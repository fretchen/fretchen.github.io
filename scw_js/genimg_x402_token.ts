import {
  GenImNFTv4ABI as nftAbi,
  getViemChain,
  getGenAiNFTAddress,
  getUSDCConfig,
  isTestnet,
  loadPrivateKey,
  getRpcUrl,
} from "@fretchen/chain-utils";
import { parseJsonBody, CORS_HEADERS, errorResponse, openAiError } from "./utils.js";
import {
  ImageGenerationRequestSchema,
  ADVERTISED_MODELS,
  MODEL_TO_PROVIDER,
  type ImageGenerationResponse,
} from "./genimg_schemas.js";
import type { z } from "zod";
import {
  getContract,
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  type PublicClient,
  type WalletClient,
  type Chain,
  type Account,
  type Transport,
  type GetContractReturnType,
} from "viem";
import { generateAndUploadImage, JSON_BASE_PATH, type Provider } from "./image_service.js";
import { privateKeyToAccount } from "viem/accounts";
import {
  createResourceServer,
  createPaymentRequirements,
  create402Response,
  extractPaymentPayload,
  createSettlementHeaders,
  type SdkPaymentPayload,
  type SdkPaymentRequirements,
} from "./x402_server.js";
import { validatePaymentNetwork, getExpectedNetworks } from "./getChain.js";
import type { ScwEvent } from "./types.js";
import openapiSpec from "./openapi.genimg.json" with { type: "json" };
import { faviconBase64, faviconContentType } from "./favicon.js";
import { FAVICON_DISCOVERY_HTML, wantsHtml } from "./discovery.js";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

// Re-export for backward compatibility with tests
export { handle, create402Response };

const USDC_PAYMENT_AMOUNT = process.env.USDC_PAYMENT_AMOUNT ?? "70000";
const GAS_BUFFER = parseEther("0.00001");

// keccak256("Transfer(address,address,uint256)") — used to extract tokenId from mint tx logs
const TRANSFER_EVENT_HASH = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

/**
 * 402 bodies carry x402-specific diagnostic fields (reason, expected/received, payer) that
 * `errorResponse` (plain `{error: string}`) can't express — x402 clients read them, so the
 * shape stays as-is rather than folding into the OpenAI error contract. See utils.ts's
 * errorResponse/openAiError for the two shapes this endpoint otherwise uses.
 */
/**
 * Turns the first Zod issue into an OpenAI-shaped 400.
 *
 * `param` has to come from two different places: a rejected unknown field surfaces as
 * `{ code: "unrecognized_keys", keys: ["quality"], path: [] }` — note the EMPTY path, so the
 * field name is only in `keys` — while an ordinary field issue carries it in `path`.
 */
function zodErrorToResponse(error: z.ZodError) {
  const issue = error.issues[0]!;
  if (issue.code === "unrecognized_keys") {
    const key = issue.keys[0];
    return openAiError(
      400,
      `Unrecognized request argument supplied: ${issue.keys.join(", ")}`,
      "invalid_request_error",
      "unknown_parameter",
      key,
    );
  }
  const param = issue.path.length > 0 ? issue.path.join(".") : undefined;
  return openAiError(400, issue.message, "invalid_request_error", "invalid_value", param);
}

/**
 * The OpenAI-style success envelope. Everything chain-related lives under `x_nft`, so a caller
 * that only wants an image reads `data[0].url` and never learns an NFT exists — that separation
 * is what makes the published `images/v1` contract implementable by someone with no chain at all.
 */
function buildSuccessBody(args: {
  imageUrl: string;
  model: string;
  nft: ImageGenerationResponse["x_nft"];
}): ImageGenerationResponse {
  return {
    created: Math.floor(Date.now() / 1000),
    data: [{ url: args.imageUrl, revised_prompt: null }],
    model: args.model,
    x_nft: args.nft,
  };
}

function paymentError(reason: string | undefined, extra: Record<string, unknown> = {}) {
  return {
    statusCode: 402,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: "Payment verification failed", reason, ...extra }),
  };
}

interface PreFlightSuccess {
  success: true;
}
interface PreFlightFailure {
  success: false;
  error: string;
  details: Record<string, string>;
}
type PreFlightResult = PreFlightSuccess | PreFlightFailure;

async function preFlightChecks(
  publicClient: PublicClient,
  serverAddress: `0x${string}`,
  mintPrice: bigint,
  chainName: string,
): Promise<PreFlightResult> {
  try {
    const balance = await publicClient.getBalance({ address: serverAddress });
    const requiredBalance = mintPrice + GAS_BUFFER;

    if (balance < requiredBalance) {
      const balanceEth = parseFloat(balance.toString()) / 1e18;
      const requiredEth = parseFloat(requiredBalance.toString()) / 1e18;
      return {
        success: false,
        error: "insufficient_server_funds",
        details: {
          message: `Server wallet has insufficient funds on ${chainName}`,
          serverAddress,
          currentBalance: `${balanceEth.toFixed(6)} ETH`,
          requiredBalance: `${requiredEth.toFixed(6)} ETH`,
          deficit: `${(requiredEth - balanceEth).toFixed(6)} ETH`,
          chain: chainName,
        },
      };
    }

    logger.debug({ chain: chainName }, "Pre-flight checks passed");
    return { success: true };
  } catch (error) {
    // Diagnostic detail only — the caller in handle() logs the authoritative, alert-covered
    // "Pre-flight check failed" line for every failure branch of this function, this one
    // included. Logging this one at `error` too would double the coverage burden for no signal.
    logger.warn({ err: error, chain: chainName }, "Pre-flight check threw");
    return {
      success: false,
      error: "preflight_check_failed",
      details: {
        message: `Failed to perform pre-flight checks on ${chainName}`,
        errorDetails: (error as Error).message,
        chain: chainName,
      },
    };
  }
}

const resourceServer = createResourceServer();

interface MintResult {
  tokenId: number;
  mintTxHash: `0x${string}`;
  transferTxHash: `0x${string}`;
}

/** What `getContract({ abi: nftAbi, client: { public, wallet } })` in handle() actually returns —
 *  named here so mintNFTToClient can be typed against it instead of `any`. The wallet client's
 *  account/chain must be narrowed away from their `| undefined` defaults (matching the real
 *  `createWalletClient({ account, chain, transport })` call in handle()), or viem's generated
 *  `write.*` actions can't tell an account/chain is already bound and demand them again as
 *  call-site arguments. */
type NftContract = GetContractReturnType<
  typeof nftAbi,
  { public: PublicClient; wallet: WalletClient<Transport, Chain, Account> }
>;

async function mintNFTToClient(
  contract: NftContract,
  publicClient: PublicClient,
  clientAddress: string,
  metadataUrl: string,
  contractAddress: string,
  serverWallet: string,
  mintPrice: bigint,
  isListed = false,
): Promise<MintResult> {
  logger.debug({ isListed, clientAddress }, "Minting NFT to server, then transferring to client");

  const mintTxHash = await contract.write.safeMint([metadataUrl, isListed], { value: mintPrice });
  logger.debug({ mintTxHash }, "Mint transaction submitted");

  const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintTxHash });
  if (mintReceipt.status !== "success") {
    throw new Error("Mint transaction failed");
  }

  const mintLog = mintReceipt.logs.find((log) => {
    if (log.address.toLowerCase() !== contractAddress.toLowerCase()) {
      return false;
    }
    const zeroAddress = "0x0000000000000000000000000000000000000000000000000000000000000000";
    return log.topics[0] === TRANSFER_EVENT_HASH && log.topics[1] === zeroAddress;
  });

  if (!mintLog) {
    throw new Error("Could not find mint event in transaction");
  }

  const tokenId = parseInt(mintLog.topics[3]!, 16);
  logger.info({ tokenId, mintTxHash }, "NFT minted");

  const MAX_TRANSFER_RETRIES = 3;
  const RETRY_DELAY_MS = 2000;
  let transferTxHash: `0x${string}` | undefined;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_TRANSFER_RETRIES; attempt++) {
    try {
      logger.debug({ attempt, maxAttempts: MAX_TRANSFER_RETRIES }, "Transfer attempt");
      transferTxHash = await contract.write.safeTransferFrom([
        serverWallet as `0x${string}`,
        clientAddress as `0x${string}`,
        BigInt(tokenId),
      ]);
      logger.debug({ transferTxHash }, "Transfer transaction submitted");
      break;
    } catch (error) {
      lastError = error;
      const msg = (error as { message?: string; shortMessage?: string }).message ?? "";
      const short = (error as { shortMessage?: string }).shortMessage ?? "";

      const isNonExistentToken =
        msg.includes("ERC721NonexistentToken") || short.includes("ERC721NonexistentToken");
      const isNonce =
        msg.includes("nonce too low") ||
        msg.includes("Nonce provided for the transaction is lower") ||
        short.includes("nonce too low");

      if ((isNonExistentToken || isNonce) && attempt < MAX_TRANSFER_RETRIES) {
        logger.warn({ tokenId, attempt, delayMs: RETRY_DELAY_MS }, "Transfer race, retrying");
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        continue;
      }
      throw error;
    }
  }

  if (!transferTxHash) {
    throw lastError ?? new Error("Transfer failed after retries");
  }

  const transferReceipt = await publicClient.waitForTransactionReceipt({ hash: transferTxHash });
  if (transferReceipt.status !== "success") {
    throw new Error("Transfer transaction failed");
  }

  logger.info({ tokenId, transferTxHash }, "NFT transferred to client");
  return { tokenId, mintTxHash, transferTxHash };
}

interface GeneratedImage {
  metadataUrl: string;
  imageUrl: string;
}

/**
 * Generation only — deliberately separate from `mintNFTToClient` so the handler owns the
 * boundary between them. That boundary is the whole point: a failure here means the caller got
 * nothing and must not be charged (500), while a failure in the mint means they hold a usable
 * image and get a 200 with `x_nft.status: "mint_failed"`.
 */
async function generateImage(
  prompt: string,
  size = "1024x1024",
  mode = "generate",
  referenceImageBase64: string | null = null,
  useMockImage = false,
  provider: Provider = "bfl",
): Promise<GeneratedImage> {
  // Prompt at debug, not info — mirrors llm_service.ts's "Generating answer for prompt".
  logger.debug({ mode, size, prompt }, "Generating image");

  const tempTokenId = Date.now();

  if (useMockImage) {
    logger.debug("Using mock image (test mode)");
    const imageUrl = "https://via.placeholder.com/1024x1024.png?text=Test+Image";
    const metadataUrl = `https://example.com/metadata/test_${tempTokenId}.json`;
    return { metadataUrl, imageUrl };
  }

  const metadataUrl = await generateAndUploadImage(
    prompt,
    tempTokenId,
    provider,
    size,
    mode,
    referenceImageBase64,
  );

  const baseDomain = new URL(JSON_BASE_PATH);
  const url = new URL(metadataUrl);
  if (url.hostname !== baseDomain.hostname) {
    throw new Error(`Untrusted metadata URL: ${metadataUrl}`);
  }

  const metadataResponse = await fetch(metadataUrl);
  if (!metadataResponse.ok) {
    throw new Error(`Failed to load metadata: ${metadataResponse.status}`);
  }

  const metadata = (await metadataResponse.json()) as { image: string };
  logger.info({ imageUrl: metadata.image }, "Image generated");
  return { metadataUrl, imageUrl: metadata.image };
}

async function handle(
  event: ScwEvent,
  _context: unknown,
  _cb?: unknown,
): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  isBase64Encoded?: boolean;
}> {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod === "GET" && (event.path ?? "").replace(/^\/+/, "") === "openapi.json") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(openapiSpec),
    };
  }

  // The Scaleway/Envoy gateway intercepts the exact path /favicon.ico and answers it
  // with its own 404 before the function runs, so we cannot serve favicon.ico here.
  // Instead we cover the two paths that DO reach the function and that x402scan
  // (@agentcash/discovery) actually uses to resolve an icon:
  //   1. The origin root: scrapeFavicon fetches it and parses <link rel="icon"> first,
  //      before probing any COMMON_FAVICON_PATHS. So a GET on "/" that asks for HTML
  //      (a scraper, never an x402 payment client — those POST JSON) gets a minimal
  //      HTML page pointing at /favicon.png.
  //   2. /favicon.png: one of scrapeFavicon's COMMON_FAVICON_PATHS fallbacks, and unlike
  //      /favicon.ico it is not swallowed by the gateway.
  const normalizedPath = (event.path ?? "").replace(/^\/+/, "");
  const isGetOrHead = event.httpMethod === "GET" || event.httpMethod === "HEAD";

  if (isGetOrHead && normalizedPath === "favicon.png") {
    const isHead = event.httpMethod === "HEAD";
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, "Content-Type": faviconContentType },
      body: isHead ? "" : faviconBase64,
      isBase64Encoded: !isHead,
    };
  }

  if (isGetOrHead && normalizedPath === "" && wantsHtml(event.headers)) {
    const isHead = event.httpMethod === "HEAD";
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "text/html; charset=utf-8" },
      body: isHead ? "" : FAVICON_DISCOVERY_HTML,
    };
  }

  if (event.httpMethod !== "POST") {
    return errorResponse(400, "Only POST requests are supported");
  }

  const body = parseJsonBody(event.body);
  if (!body) {
    return openAiError(400, "Invalid JSON body", "invalid_request_error");
  }

  const paymentPayload = extractPaymentPayload(event.headers) ?? body["payment"];

  let account: ReturnType<typeof privateKeyToAccount>;
  try {
    account = privateKeyToAccount(loadPrivateKey("NFT_WALLET_PRIVATE_KEY"));
  } catch (err) {
    // Every request fails identically until this is fixed — see alerts/services.yaml's
    // PaidPathBroken, which this phrase is matched by.
    logger.error({ err }, "NFT_WALLET_PRIVATE_KEY not configured or invalid");
    return errorResponse(500, `Server configuration error: ${(err as Error).message}`);
  }
  const serverWallet = account.address;

  // Read, not validated — the 402 challenge below negotiates which networks to offer from it,
  // and that has to happen before any request validation runs (see the comment on the branch).
  const requestedNetwork = (body["network"] as string | undefined) ?? null;

  if (requestedNetwork) {
    const isTestnetMode = isTestnet(requestedNetwork);
    logger.debug({ network: requestedNetwork, testnet: isTestnetMode }, "Network requested");
  }

  // ─── Payment challenge comes BEFORE request validation ───
  // An unpaid request is answered with the 402 whatever its body says — mirrors
  // sc_llm_x402.ts's identical rule. Validating first means a client probing for the
  // payment terms it is supposed to discover gets a 400 with no Payment-Required header
  // instead. Nothing is charged here: this branch only advertises terms. A *paid* request
  // still runs the full validation below before any voucher is verified or settled, so a
  // malformed paid request is rejected without being charged.
  if (!paymentPayload) {
    logger.debug("No payment provided, returning 402");

    // The one field validated before the challenge, because it is the one that *determines the
    // terms*: `network` decides what the 402 offers, and the exact scheme signs for whatever it
    // is offered. Everything else (prompt, size, model) stays after the challenge, so a client
    // probing for the payment terms still gets them — a probe sends no network at all.
    //
    // This used to fall back to the mainnet list, so a caller naming a chain we do not serve was
    // silently offered — and could pay on — a different, real-money chain. `eip155:84532` is the
    // trap: Base Sepolia is sc_llm_x402's testnet but has no GenImNFT, so "our testnet" was a
    // mainnet bill here.
    let networks: readonly string[];
    if (requestedNetwork) {
      const allNetworks = [...getExpectedNetworks(false), ...getExpectedNetworks(true)];
      if (!allNetworks.includes(requestedNetwork)) {
        return openAiError(
          400,
          `Unsupported network '${requestedNetwork}'. This endpoint can only be paid on: ${allNetworks.join(", ")}`,
          "invalid_request_error",
          "unsupported_network",
          "network",
        );
      }
      networks = [requestedNetwork];
    } else {
      // No network named: offer every mainnet we accept. Deliberate — a third-party agent that
      // pays should pay on mainnet, and this is the path an images/v1 client takes, since
      // `network` is a vendor extension outside the interop floor.
      networks = getExpectedNetworks(false);
    }
    logger.debug({ networks }, "402 offering networks");

    const paymentRequirements = createPaymentRequirements({
      resourceUrl: event.path ?? process.env.GENIMG_SERVICE_URL ?? "https://api.example.com/genimg",
      description: "AI Image Generation with NFT Certificate",
      mimeType: "application/json",
      amount: USDC_PAYMENT_AMOUNT,
      payTo: serverWallet,
      networks,
    });

    return create402Response(paymentRequirements);
  }

  const parsed = ImageGenerationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return zodErrorToResponse(parsed.error);
  }

  const { prompt, mode = "generate", size = "1024x1024" } = parsed.data;
  const model = parsed.data.model ?? ADVERTISED_MODELS[0];
  const provider = MODEL_TO_PROVIDER[model];
  // `isListed` and its `x_nft.listed` alias mean the same thing; either being true is enough.
  const isListed = parsed.data.isListed === true || parsed.data.x_nft?.listed === true;

  // Cross-field rule, deliberately outside the schema: JSON Schema cannot express
  // "required when another field has this value" without if/then, and `.refine()` is not
  // representable by z.toJSONSchema at all — it would silently vanish from the generated spec.
  let referenceImageBase64: string | null = null;
  if (mode === "edit") {
    referenceImageBase64 = parsed.data.referenceImage ?? null;
    if (!referenceImageBase64) {
      return openAiError(
        400,
        "Edit mode requires referenceImage parameter",
        "invalid_request_error",
        "missing_required_parameter",
        "referenceImage",
      );
    }
    logger.debug("Reference image provided for editing");
  }

  logger.debug("Payment received, verifying");

  const clientNetwork =
    (paymentPayload as Record<string, unknown>)?.["accepted"] !== undefined
      ? (((paymentPayload as Record<string, unknown>)["accepted"] as Record<string, unknown>)?.[
          "network"
        ] as string | undefined)
      : undefined;

  const networkValidation = validatePaymentNetwork(clientNetwork);
  if (!networkValidation.valid) {
    // The caller's fault (wrong/missing network), not ours — warn, not error.
    logger.warn({ reason: networkValidation.reason, clientNetwork }, "Network validation failed");
    return paymentError(networkValidation.reason, {
      expected: networkValidation.expected,
      received: networkValidation.received,
    });
  }

  const usdcConfig = getUSDCConfig(clientNetwork!);
  const contractAddress = getGenAiNFTAddress(clientNetwork!);
  logger.debug({ network: usdcConfig.name, clientNetwork }, "Client selected network");

  // Single-network requirements object for the x402 verify/settle calls
  const paymentRequirements: SdkPaymentRequirements = {
    scheme: "exact",
    network: clientNetwork! as `${string}:${string}`,
    amount: USDC_PAYMENT_AMOUNT,
    asset: usdcConfig.address,
    payTo: serverWallet,
    maxTimeoutSeconds: 60,
    extra: { name: usdcConfig.usdcName, version: usdcConfig.usdcVersion },
  };

  let verification: { isValid: boolean; invalidReason?: string; payer?: string };
  try {
    // paymentPayload is trusted-shape here, not validated against SdkPaymentPayload — the SDK's
    // own verify() is what actually checks it; this cast just names the boundary instead of
    // leaving it untyped.
    verification = await resourceServer.verifyPayment(
      paymentPayload as SdkPaymentPayload,
      paymentRequirements,
    );
  } catch (error) {
    // Our call to the facilitator threw — see alerts/services.yaml's SellerPaymentFailing,
    // which this phrase (shared with llmx402/searchapi) is matched by.
    logger.error({ err: error }, "Payment verification error");
    return paymentError("facilitator_error", { details: (error as Error).message });
  }

  if (!verification.isValid) {
    // The caller's fault (bad/expired signature, insufficient allowance, ...) — warn.
    logger.warn(
      { reason: verification.invalidReason, payer: verification.payer },
      "Payment verification failed",
    );
    return paymentError(verification.invalidReason, { payer: verification.payer });
  }

  const clientAddress = verification.payer!;
  logger.info({ clientAddress }, "Payment verified");

  try {
    const viemChain = getViemChain(clientNetwork!);
    logger.debug({ chain: viemChain.name, clientNetwork }, "Using chain");

    const chain = viemChain as unknown as Chain;
    // Falls back to the chain's public endpoint when unset — fine for testnets, but
    // set RPC_URL_<NETWORK> for anything carrying real traffic (see getRpcUrl).
    const rpcUrl = getRpcUrl(clientNetwork!);
    const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
    const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });

    const contract = getContract({
      address: contractAddress,
      abi: nftAbi,
      client: { public: publicClient, wallet: walletClient },
    });

    const mintPrice = (await contract.read.mintPrice()) as bigint;
    logger.debug(
      { mintPriceEth: (parseFloat(mintPrice.toString()) / 1e18).toFixed(6) },
      "Mint price",
    );

    const preFlightResult = await preFlightChecks(
      publicClient,
      account.address,
      mintPrice,
      viemChain.name,
    );

    if (!preFlightResult.success) {
      // Our wallet or our RPC, never the caller's — see alerts/services.yaml's PaidPathBroken.
      logger.error(
        { reason: preFlightResult.error, details: preFlightResult.details },
        "Pre-flight check failed",
      );
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: "Service configuration error",
          reason: preFlightResult.error,
          ...preFlightResult.details,
        }),
      };
    }

    // Generation failure means the caller got nothing — the outer catch turns it into a 500
    // and no payment is settled.
    const { metadataUrl, imageUrl } = await generateImage(
      prompt,
      size,
      mode,
      referenceImageBase64,
      isTestnet(clientNetwork!),
      provider,
    );

    // Collect BEFORE the irreversible on-chain mint. This used to run fire-and-forget AFTER the
    // mint and only log on failure, which let a payer cancel their EIP-3009 authorization (or
    // simply move the balance) during the generation window — minutes, since BFL polls up to
    // 60x5s — and keep both the image and an NFT whose mintPrice and gas we paid. Awaiting here
    // caps the cost of a failed settlement at one BFL generation: nothing is minted, and the S3
    // URL is unguessable (getRandomString in image_service.ts), so the caller receives nothing.
    let settlement: Awaited<ReturnType<typeof resourceServer.settlePayment>>;
    try {
      settlement = await resourceServer.settlePayment(
        paymentPayload as SdkPaymentPayload,
        paymentRequirements,
      );
    } catch (error) {
      // See SellerPaymentFailing — same phrase as llmx402/searchapi's settle-call catch.
      logger.error({ err: error }, "Settlement error");
      return paymentError("settlement_failed", { details: (error as Error).message });
    }
    if (!settlement.success) {
      // See SellerPaymentFailing — same phrase llmx402/searchapi use for a rejected settlement.
      logger.error({ settlement }, "Settlement failed");
      return paymentError("settlement_failed", { details: settlement.errorReason });
    }
    logger.info(
      { transaction: settlement.transaction, network: settlement.network },
      "Payment settled",
    );

    const settlementHeaders = createSettlementHeaders({
      success: true,
      payer: clientAddress,
      network: clientNetwork,
    });

    let mintResult: MintResult;
    try {
      mintResult = await mintNFTToClient(
        contract,
        publicClient,
        clientAddress,
        metadataUrl,
        contractAddress,
        serverWallet,
        mintPrice,
        isListed,
      );
    } catch (mintError) {
      // The image exists and the caller can use it, so a 5xx would be a lie. Return 200 with
      // the URL and report the chain-side failure in the extension.
      //
      // The payment HAS settled by this point — settlement deliberately precedes the mint, see
      // above — so the settlement headers are attached here too. The caller paid for a
      // generation they received; what they did not get is the NFT. See alerts/services.yaml's
      // PaidButUndelivered.
      logger.error(
        { err: mintError, payer: clientAddress, network: clientNetwork },
        "Mint failed after successful generation",
      );
      return {
        body: JSON.stringify(
          buildSuccessBody({
            imageUrl,
            model,
            nft: {
              status: "mint_failed",
              reason: (mintError as Error).message,
              network: clientNetwork,
              metadata_url: metadataUrl,
            },
          }),
        ),
        headers: { ...CORS_HEADERS, ...settlementHeaders },
        statusCode: 200,
      };
    }

    return {
      body: JSON.stringify(
        buildSuccessBody({
          imageUrl,
          model,
          nft: {
            status: "minted",
            token_id: mintResult.tokenId,
            contract: contractAddress,
            network: clientNetwork,
            metadata_url: metadataUrl,
            mint_tx: mintResult.mintTxHash,
            transfer_tx: mintResult.transferTxHash,
            listed: isListed,
            mint_price: mintPrice.toString(),
            owner: clientAddress,
          },
        }),
      ),
      headers: { ...CORS_HEADERS, ...settlementHeaders },
      statusCode: 200,
    };
  } catch (error) {
    // The outer catch: a bug, an upstream nobody has a rule for yet, or S3 failing. See
    // alerts/services.yaml's ServiceUnhandledError.
    logger.error({ err: error }, "Error during operation");
    return errorResponse(500, `Operation failed: ${(error as Error).message}`);
  }
}

if (process.env.NODE_ENV === "test" && !process.env.CI) {
  import("dotenv").then((dotenv) => {
    dotenv.config();
    import("fastify").then((fastifyModule) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fastify = (fastifyModule.default as any)({ bodyLimit: 10 * 1024 * 1024 });

      import("@fastify/cors").then((corsModule) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fastify.register((corsModule as any).default, {
          origin: true,
          methods: ["GET", "POST", "OPTIONS"],
          allowedHeaders: "*",
          exposedHeaders: ["Payment-Required", "PAYMENT-REQUIRED", "X-Payment", "PAYMENT-RESPONSE"],
        });

        import("@fastify/url-data").then((urlDataModule) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fastify.register((urlDataModule as any).default);

          fastify.addContentTypeParser(
            "text/json",
            { parseAs: "string" },
            fastify.defaultTextParser,
          );
          fastify.addContentTypeParser(
            "application/x-www-form-urlencoded",
            { parseAs: "string" },
            fastify.defaultTextParser,
          );
          fastify.addContentTypeParser(
            "application/json",
            { parseAs: "string" },
            fastify.defaultTextParser,
          );

          fastify.route({
            method: ["GET", "POST", "PUT", "DELETE", "PATCH"],
            url: "/*",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            handler: async (request: any, reply: any) => {
              try {
                const event: ScwEvent = {
                  httpMethod: request.method,
                  headers: request.headers,
                  body: request.body,
                  path: request.url,
                  queryStringParameters: request.query,
                };
                const result = await handle(event, {});
                reply.status(result.statusCode ?? 200);
                for (const [key, value] of Object.entries(result.headers ?? {})) {
                  reply.header(key, value);
                }
                return result.body;
              } catch (error) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                reply.status(500).send({ error: (error as any).message });
              }
            },
          });

          fastify.listen({ port: 8082, host: "0.0.0.0" }, (err: unknown, address: string) => {
            if (err) {
              // Local dev only — never deployed. Same phrase the other packages' local server
              // bootstraps use; see EXEMPT in test/alert_coverage.test.ts.
              logger.error({ err }, "Error starting local server");
              process.exit(1);
            }
            logger.info({ address }, "Local server listening");
          });
        });
      });
    });
  });
}
