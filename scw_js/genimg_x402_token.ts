import {
  GenImNFTv4ABI as nftAbi,
  getViemChain,
  getGenAiNFTAddress,
  getUSDCConfig,
  isTestnet,
  loadPrivateKey,
  getRpcUrl,
} from "@fretchen/chain-utils";
import { parseJsonBody } from "./utils.js";
import {
  getContract,
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  type PublicClient,
  type Chain,
} from "viem";
import { generateAndUploadImage, JSON_BASE_PATH } from "./image_service.js";
import { privateKeyToAccount } from "viem/accounts";
import {
  createResourceServer,
  createPaymentRequirements,
  create402Response,
  extractPaymentPayload,
  createSettlementHeaders,
} from "./x402_server.js";
import { validatePaymentNetwork, getExpectedNetworks } from "./getChain.js";
import type { ScwEvent } from "./types.js";
import openapiSpec from "./openapi.genimg.json" with { type: "json" };
import { faviconBase64, faviconContentType } from "./favicon.js";

// Re-export for backward compatibility with tests
export { handle, create402Response };

const USDC_PAYMENT_AMOUNT = process.env.USDC_PAYMENT_AMOUNT ?? "70000";
const GAS_BUFFER = parseEther("0.00001");

// keccak256("Transfer(address,address,uint256)") — used to extract tokenId from mint tx logs
const TRANSFER_EVENT_HASH = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

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

    console.log(`✅ Pre-flight checks passed on ${chainName}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Pre-flight check error:`, error);
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

async function mintNFTToClient(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  publicClient: PublicClient,
  clientAddress: string,
  metadataUrl: string,
  contractAddress: string,
  serverWallet: string,
  mintPrice: bigint,
  isListed = false,
): Promise<MintResult> {
  console.log(
    `🎨 Minting NFT to server (isListed=${isListed}), then transferring to ${clientAddress}`,
  );

  const mintTxHash = await contract.write.safeMint([metadataUrl, isListed], { value: mintPrice });
  console.log(`📝 Mint transaction submitted: ${mintTxHash}`);

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
  console.log(`✅ NFT minted: tokenId=${tokenId}`);

  const MAX_TRANSFER_RETRIES = 3;
  const RETRY_DELAY_MS = 2000;
  let transferTxHash: `0x${string}` | undefined;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_TRANSFER_RETRIES; attempt++) {
    try {
      console.log(`📤 Transfer attempt ${attempt}/${MAX_TRANSFER_RETRIES}...`);
      transferTxHash = await contract.write.safeTransferFrom([
        serverWallet as `0x${string}`,
        clientAddress as `0x${string}`,
        BigInt(tokenId),
      ]);
      console.log(`📤 Transfer transaction submitted: ${transferTxHash}`);
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
        console.log(`⏳ Retrying in ${RETRY_DELAY_MS}ms...`);
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

  console.log(`✅ NFT transferred to client: tokenId=${tokenId}`);
  return { tokenId, mintTxHash, transferTxHash };
}

interface GenerateResult {
  metadata_url: string;
  image_url: string;
  tokenId: number;
  mintTxHash: `0x${string}`;
  transferTxHash: `0x${string}`;
}

async function generateImageAndMintNFT(
  prompt: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  publicClient: PublicClient,
  clientAddress: string,
  contractAddress: string,
  serverWallet: string,
  size = "1024x1024",
  mode = "generate",
  referenceImageBase64: string | null = null,
  useMockImage = false,
  mintPrice = BigInt(0),
  isListed = false,
): Promise<GenerateResult> {
  console.log(`🎨 Generating image: mode=${mode}, size=${size}, prompt="${prompt}"`);

  const tempTokenId = Date.now();
  let metadataUrl: string;
  let imageUrl: string;

  if (useMockImage) {
    console.log("🎭 Using mock image (test mode)");
    imageUrl = "https://via.placeholder.com/1024x1024.png?text=Test+Image";
    metadataUrl = `https://example.com/metadata/test_${tempTokenId}.json`;
  } else {
    metadataUrl = await generateAndUploadImage(
      prompt,
      tempTokenId,
      "bfl",
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
    imageUrl = metadata.image;
  }

  console.log(`✅ Image ${useMockImage ? "mocked" : "generated"}: ${imageUrl}`);

  const mintResult = await mintNFTToClient(
    contract,
    publicClient,
    clientAddress,
    metadataUrl,
    contractAddress,
    serverWallet,
    mintPrice,
    isListed,
  );

  return {
    metadata_url: metadataUrl,
    image_url: imageUrl,
    tokenId: mintResult.tokenId,
    mintTxHash: mintResult.mintTxHash,
    transferTxHash: mintResult.transferTxHash,
  };
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
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        // Must cover every header @x402/fetch sets on the paid retry request, or the
        // browser preflight fails with "... is not allowed by Access-Control-Allow-Headers".
        // - PAYMENT-SIGNATURE: x402 v2 payment header (we negotiate x402Version: 2)
        // - X-PAYMENT: x402 v1 payment header (fallback)
        // - Access-Control-Expose-Headers: set on the request by @x402/fetch (spec-odd but real)
        // Keep this in sync with @x402/fetch; the OPTIONS test enforces it.
        "Access-Control-Allow-Headers":
          "Content-Type, PAYMENT-SIGNATURE, X-PAYMENT, Access-Control-Expose-Headers",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Content-Type": "application/json",
      },
      body: "",
    };
  }

  if (event.httpMethod === "GET" && (event.path ?? "").replace(/^\/+/, "") === "openapi.json") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(openapiSpec),
    };
  }

  if (event.httpMethod === "GET" && (event.path ?? "").replace(/^\/+/, "") === "favicon.ico") {
    return {
      statusCode: 200,
      headers: { "Content-Type": faviconContentType, "Access-Control-Allow-Origin": "*" },
      body: faviconBase64,
      isBase64Encoded: true,
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      body: JSON.stringify({ error: "Only POST requests are supported" }),
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      statusCode: 400,
    };
  }

  const body = parseJsonBody(event.body);
  if (!body) {
    return {
      body: JSON.stringify({ error: "Invalid JSON body" }),
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      statusCode: 400,
    };
  }

  const paymentPayload = extractPaymentPayload(event.headers) ?? body["payment"];
  const prompt = body["prompt"] as string | undefined;

  if (!prompt) {
    return {
      body: JSON.stringify({ error: "No prompt provided" }),
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      statusCode: 400,
    };
  }

  console.log(`📝 Prompt: "${prompt}"`);

  let account: ReturnType<typeof privateKeyToAccount>;
  try {
    account = privateKeyToAccount(loadPrivateKey("NFT_WALLET_PRIVATE_KEY"));
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "Server configuration error",
        message: (err as Error).message,
      }),
    };
  }
  const serverWallet = account.address;

  const mode = (body["mode"] as string | undefined) ?? "generate";
  const size = (body["size"] as string | undefined) ?? "1024x1024";
  const requestedNetwork = (body["network"] as string | undefined) ?? null;
  const isListed = body["isListed"] === true;

  const validModes = ["generate", "edit"];
  if (!validModes.includes(mode)) {
    return {
      body: JSON.stringify({
        error: `Invalid mode parameter. Must be one of: ${validModes.join(", ")}`,
      }),
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      statusCode: 400,
    };
  }

  const validSizes = ["1024x1024", "1792x1024"];
  if (!validSizes.includes(size)) {
    return {
      body: JSON.stringify({
        error: `Invalid size parameter. Must be one of: ${validSizes.join(", ")}`,
      }),
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      statusCode: 400,
    };
  }

  let referenceImageBase64: string | null = null;
  if (mode === "edit") {
    referenceImageBase64 = (body["referenceImage"] as string | undefined) ?? null;
    if (!referenceImageBase64) {
      return {
        body: JSON.stringify({ error: "Edit mode requires referenceImage parameter" }),
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        statusCode: 400,
      };
    }
    console.log("🖼️  Reference image provided for editing");
  }

  if (requestedNetwork) {
    const isTestnetMode = isTestnet(requestedNetwork);
    console.log(`🌐 Network: ${requestedNetwork} (${isTestnetMode ? "testnet" : "mainnet"})`);
  }

  if (!paymentPayload) {
    console.log("❌ No payment provided → Returning 402");

    let networks: readonly string[];
    if (requestedNetwork) {
      const allNetworks = [...getExpectedNetworks(false), ...getExpectedNetworks(true)];
      if (allNetworks.includes(requestedNetwork)) {
        networks = [requestedNetwork];
      } else {
        networks = getExpectedNetworks(false);
      }
    } else {
      networks = getExpectedNetworks(false);
    }

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

  console.log("🔍 Payment received, verifying...");

  const clientNetwork =
    (paymentPayload as Record<string, unknown>)?.["accepted"] !== undefined
      ? (((paymentPayload as Record<string, unknown>)["accepted"] as Record<string, unknown>)?.[
          "network"
        ] as string | undefined)
      : undefined;
  console.log(`🌐 Payment payload network: ${clientNetwork}`);

  const clientIsTestnet = clientNetwork ? isTestnet(clientNetwork) : false;

  const networkValidation = validatePaymentNetwork(clientNetwork, clientIsTestnet);
  if (!networkValidation.valid) {
    console.error(`❌ Network validation failed: ${networkValidation.reason}`);
    return {
      statusCode: 402,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "Payment verification failed",
        reason: networkValidation.reason,
        expected: networkValidation.expected,
        received: networkValidation.received,
      }),
    };
  }

  const usdcConfig = getUSDCConfig(clientNetwork!);
  const contractAddress = getGenAiNFTAddress(clientNetwork!);
  console.log(`📍 Client selected network: ${usdcConfig.name} (${clientNetwork})`);

  // Single-network requirements object for the x402 verify/settle calls
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentRequirements: any = {
    scheme: "exact",
    network: clientNetwork!,
    amount: USDC_PAYMENT_AMOUNT,
    asset: usdcConfig.address,
    payTo: serverWallet,
    maxTimeoutSeconds: 60,
    extra: { name: usdcConfig.usdcName, version: usdcConfig.usdcVersion },
  };

  let verification: { isValid: boolean; invalidReason?: string; payer?: string };
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    verification = await resourceServer.verifyPayment(paymentPayload as any, paymentRequirements);
  } catch (error) {
    console.error(`❌ Payment verification error:`, error);
    return {
      statusCode: 402,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "Payment verification failed",
        reason: "facilitator_error",
        details: (error as Error).message,
      }),
    };
  }

  if (!verification.isValid) {
    console.log(`❌ Payment verification failed: ${verification.invalidReason}`);
    return {
      statusCode: 402,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "Payment verification failed",
        reason: verification.invalidReason,
        payer: verification.payer,
      }),
    };
  }

  const clientAddress = verification.payer!;
  console.log(`✅ Payment verified for client: ${clientAddress}`);

  try {
    const viemChain = getViemChain(clientNetwork!);
    console.log(`🔗 Using chain: ${viemChain.name} (${clientNetwork})`);

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
    console.log(`💰 Mint price: ${(parseFloat(mintPrice.toString()) / 1e18).toFixed(6)} ETH`);

    console.log(`🔍 Running pre-flight checks...`);
    const preFlightResult = await preFlightChecks(
      publicClient,
      account.address,
      mintPrice,
      viemChain.name,
    );

    if (!preFlightResult.success) {
      console.error(`❌ Pre-flight check failed: ${preFlightResult.error}`);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          error: "Service configuration error",
          reason: preFlightResult.error,
          ...preFlightResult.details,
        }),
      };
    }

    const result = await generateImageAndMintNFT(
      prompt,
      contract,
      publicClient,
      clientAddress,
      contractAddress,
      serverWallet,
      size,
      mode,
      referenceImageBase64,
      isTestnet(clientNetwork!),
      mintPrice,
      isListed,
    );

    resourceServer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .settlePayment(paymentPayload as any, paymentRequirements)
      .then((settlement) => {
        console.log(`✅ Payment settled:`, settlement);
      })
      .catch((error: unknown) => {
        console.error(`⚠️ Settlement failed (non-critical): ${(error as Error).message}`);
      });

    const settlementHeaders = createSettlementHeaders({
      success: true,
      payer: clientAddress,
      network: clientNetwork,
    });

    return {
      body: JSON.stringify({
        ...result,
        payer: clientAddress,
        network: clientNetwork,
        size,
        mode,
        isListed,
        mintPrice: mintPrice.toString(),
        message: `Image successfully ${mode === "edit" ? "edited" : "generated"} and NFT minted`,
      }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        ...settlementHeaders,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error(`❌ Error during operation: ${error}`);
    return {
      body: JSON.stringify({ error: "Operation failed", message: (error as Error).message }),
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      statusCode: 500,
    };
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
              console.error("Failed to start server:", err);
              process.exit(1);
            }
            console.log(`🚀 x402 v2 Token Payment Local Server listening at ${address}`);
          });
        });
      });
    });
  });
}
