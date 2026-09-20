import pino from "pino";
import {
  getUSDCConfig,
  parseBearerToken,
  parseOwnerAddresses,
  verifySignedMessage,
} from "@fretchen/chain-utils";
import { searchWeb, QueryError } from "./search_service.js";
import { fetchExternalHtml, FetchUrlError, parseHttpsUrl } from "./web_fetch_service.js";
import { FetchQuerySchema, SearchQuerySchema } from "./search_schemas.js";
import { CORS_HEADERS } from "./utils.js";
import {
  create402Response,
  createBatchSettlementPaymentRequirements,
  createLLMResourceServer,
  createSettlementHeaders,
  extractPaymentPayload,
} from "./x402_server.js";

/**
 * Web access for /assistent, sold per call: `GET /search` proxies Brave's LLM Context API,
 * `GET /fetch` retrieves one arbitrary page (see `web_fetch_service.ts`).
 *
 * The function is still deployed as `searchapi` — renaming it would change its URL, which the
 * website hard-codes — so the name is now narrower than what it does.
 *
 * **Two ways in, and they are alternatives, not layers.** A valid owner signature over
 * `search-api:<timestamp>` serves for free; anything else pays. The owner path is what lets
 * server-side callers (growth-agent, notebooks, curl) work without a funded wallet, and what makes
 * own testing free. A bearer that does not verify is not an error — it simply is not the owner, and
 * falls through to the 402.
 *
 * The paid path is an x402 **batch-settlement** seller, and deliberately the same one as
 * `sc_llm_x402.ts`: `createLLMResourceServer` gives it the same receiver, receiver authorizer,
 * token and withdraw delay, which is exactly the tuple `computeChannelId` hashes. A tool call from
 * the chat therefore lands on the **channel the chat already funded** — no second deposit prompt —
 * and `llm_x402_cron.ts` claims it with no change. Amount, resource URL and `maxTimeoutSeconds` are
 * not in that hash, so they are free to differ per route.
 *
 * Exact-scheme pricing would not work here: the facilitator charges a flat 0.01 USDC per
 * settlement, which is the whole price of a search and ten times the price of a fetch. Batch
 * settlement pays that fee once per claim instead.
 */

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const AUTH_PREFIX = "search-api";

/** The routes served. A path outside this set is a 404 *before* any payment is advertised — a
 *  resource that does not exist has no price. */
const ROUTES = ["search", "fetch"] as const;
type Route = (typeof ROUTES)[number];

/**
 * Price per call, in USDC atomic units (6 decimals), as `USDC_PAYMENT_AMOUNT` is in
 * `genimg_x402_token.ts` — never a dollar float.
 *
 * Search is ten times fetch on purpose. Brave costs ~$0.005 a query, so $0.01 covers it twice over
 * with the invoke and a share of settlement; a fetch is egress only and priced to mean "not open"
 * rather than to recover a cost. The ratio also steers the model into the pattern that reads best:
 * search once, then read several of the results.
 */
const PRICE_ATOMIC: Record<Route, string> = {
  search: "10000",
  fetch: "1000",
};

const DESCRIPTION: Record<Route, string> = {
  search: "Web search with extracted page content (Brave LLM Context API)",
  fetch: "The readable text of one public web page",
};

/**
 * Mainnet only, unlike the chat, which also accepts Base Sepolia.
 *
 * Testnet USDC is free, and both of these routes spend real money on the caller's behalf — Brave
 * bills per query, and `/fetch` is egress. Advertising a testnet would hand anyone a metered API
 * for nothing. `genimg_x402_token.ts` refuses testnet for the same reason, and `sc_llm_x402.ts`
 * can allow it only because it answers testnet payments with a mocked completion.
 *
 * The cost is that the paid path cannot be exercised on a testnet at all. That is the intended
 * trade: at $0.001 a call, a real Optimism or Base run is cheaper than the setup it replaces.
 */
const MAINNET_NETWORKS = ["eip155:10", "eip155:8453"];

/**
 * Advertised and verified lock TTL, a quarter of the chat's `LLM_MAX_TIMEOUT_SECONDS`.
 *
 * It drives one thing: the per-channel `pendingRequest` lock the SDK holds from verify until
 * settle. Both upstreams here time out at 8 seconds, so 30 leaves ample margin — and because these
 * routes share the chat's channel, a lock orphaned by an upstream failure blocks the user's next
 * *chat message*, not just the next search. Shorter is the difference between a 30-second stall
 * and a two-minute one. Must be identical at advertise and verify time; the SDK treats it as
 * immutable across the pair.
 */
const MAX_TIMEOUT_SECONDS = 30;

/** Base for the advertised `resource.url` — the custom domain, matching `imagegen-agent` and
 *  `llm-agent`. It is declared in `serverless.yml`, which is what keeps it: the plugin deletes any
 *  domain on the function that the file does not list. The generated Scaleway hostname still
 *  answers, but this is the identity x402scan lists, so it is the one advertised. */
const SERVICE_URL = process.env.SEARCH_SERVICE_URL ?? "https://web-agent.fretchen.eu";

/**
 * `CORS_HEADERS` covers what x402 needs, and nothing else does it need — `genimg` and `llmx402`
 * are payment-only. This endpoint is the only one with **two** ways in, so its preflight must also
 * permit the owner's bearer.
 *
 * `Authorization` has to be named. It is the one header a `*` wildcard in
 * `Access-Control-Allow-Headers` does not cover, which is why `analytics/stats.ts` — the repo's
 * other browser-facing bearer endpoint — lists it explicitly rather than wildcarding.
 *
 * Local rather than a change to the shared constant, so that constant stays an honest description
 * of what the payment-only endpoints accept.
 */
const SEARCH_CORS_HEADERS = {
  ...CORS_HEADERS,
  "Access-Control-Allow-Headers": `${CORS_HEADERS["Access-Control-Allow-Headers"]}, Authorization`,
};

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: SEARCH_CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

function parsePath(rawPath: string): string {
  return rawPath.replace(/^\/+/, "");
}

function isRoute(path: string): path is Route {
  return (ROUTES as readonly string[]).includes(path);
}

// --- The two ways in ----------------------------------------------------------------------------

/**
 * Is this the owner, asking for the free path?
 *
 * Everything that is not a verified owner is `false` rather than an error: under x402 the caller
 * still has a way to be served, and refusing them before offering the price would be wrong.
 *
 * That includes an unconfigured `OWNER_ETH_ADDRESS`, which used to be a 500 back when this was a
 * gate and an empty owner list meant nobody could be served at all. It is logged loudly, because it
 * is a misconfiguration, but it fails *closed* the way that matters — nobody gets in free — and it
 * no longer takes down a paid path that never depended on the variable.
 */
async function checkOwner(headers: Record<string, string> | undefined): Promise<boolean> {
  const auth = parseBearerToken(headers?.authorization || headers?.Authorization);
  if (!auth) {
    return false;
  }

  const ownerAddresses = parseOwnerAddresses(process.env.OWNER_ETH_ADDRESS);
  if (ownerAddresses.length === 0) {
    logger.error("OWNER_ETH_ADDRESS not configured — the free owner path is unavailable");
    return false;
  }

  const authError = await verifySignedMessage(
    auth.address,
    auth.signature,
    auth.message,
    AUTH_PREFIX,
    ownerAddresses,
  );
  if (authError) {
    logger.info({ reason: authError }, "Bearer token rejected, falling through to payment");
    return false;
  }
  return true;
}

// --- Serving ------------------------------------------------------------------------------------

type Args = { route: "search"; q: string } | { route: "fetch"; url: string };

/**
 * Validate the query string, or throw `QueryError` / `FetchUrlError`.
 *
 * Separate from `run` below so a paid request can be rejected **before** anything is verified or
 * settled — and that ordering does more than save the caller money. `verifyPayment` takes the
 * channel's `pendingRequest` lock, and a request that fails after it never settles, so the lock is
 * orphaned for `MAX_TIMEOUT_SECONDS` on a channel the chat shares. Every check that can happen
 * without I/O therefore happens here, including the url's scheme.
 *
 * One parameter per route means the first issue is the error, so it is used verbatim.
 * `z.prettifyError` would wrap the same sentence in a multi-line report and change the 400 bodies
 * the model corrects itself from.
 */
function parseArgs(route: Route, queryParams: Record<string, string>): Args {
  if (route === "search") {
    const parsed = SearchQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      throw new QueryError(parsed.error.issues[0].message);
    }
    return { route, q: parsed.data.q };
  }

  const parsed = FetchQuerySchema.safeParse(queryParams);
  if (!parsed.success) {
    throw new QueryError(parsed.error.issues[0].message);
  }
  // The schema says "a non-empty string"; `parseHttpsUrl` says "a url we could actually fetch",
  // and it is the same function `assertPublicUrl` runs later — the scheme rule has one home.
  return { route, url: parseHttpsUrl(parsed.data.url).toString() };
}

function run(args: Args): Promise<unknown> {
  return args.route === "search" ? searchWeb(args.q) : fetchExternalHtml(args.url);
}

/**
 * A bad query or an unfetchable url is the caller's fault and worth saying precisely — the model
 * corrects itself from these. Everything else is ours or the upstream's, and stays generic so an
 * internal hostname or path cannot leak through an error string.
 */
function errorResponseFor(err: unknown) {
  if (err instanceof QueryError || err instanceof FetchUrlError) {
    return jsonResponse(400, { error: err.message });
  }
  logger.error({ err }, "Request handler error");
  return jsonResponse(500, { error: "Internal server error" });
}

// --- The paid path ------------------------------------------------------------------------------

/** The network the payer built their payload against, or null if they named none. */
function acceptedNetwork(payload: Record<string, unknown>): string | null {
  const accepted = payload["accepted"] as Record<string, unknown> | undefined;
  const network = accepted?.["network"];
  return typeof network === "string" ? network : null;
}

/**
 * Serve one route against a payment: verify, run, and settle **only if the run succeeded**.
 *
 * Settle-after-success is what makes an upstream failure free for the caller. It leaves a verify
 * without a matching settle, which holds the channel lock for `MAX_TIMEOUT_SECONDS` — the reason
 * that constant is 30 and not 120.
 */
async function servePaid(
  route: Route,
  args: Args,
  payload: Record<string, unknown>,
  receiverAddress: `0x${string}`,
) {
  const network = acceptedNetwork(payload);
  if (!network || !MAINNET_NETWORKS.includes(network)) {
    return jsonResponse(402, {
      error: `Unsupported or missing network. This endpoint accepts ${MAINNET_NETWORKS.join(", ")}`,
    });
  }

  let resourceServer: ReturnType<typeof createLLMResourceServer>["resourceServer"];
  let scheme: ReturnType<typeof createLLMResourceServer>["scheme"];
  try {
    ({ resourceServer, scheme } = createLLMResourceServer(receiverAddress));
  } catch (err) {
    logger.error({ err }, "Failed to configure batch-settlement resource server");
    return jsonResponse(500, { error: "Internal server error" });
  }

  const usdcConfig = getUSDCConfig(network);
  const baseRequirements = {
    scheme: "batch-settlement",
    network,
    amount: PRICE_ATOMIC[route],
    asset: usdcConfig.address,
    payTo: receiverAddress,
    maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
    extra: { name: usdcConfig.usdcName, version: usdcConfig.usdcVersion },
  };
  // The ENHANCED requirements, not the base ones: the facilitator's validateChannelConfig treats a
  // missing `extra.receiverAuthorizer` as a mismatch rather than as "not required", so a raw object
  // here makes every deposit fail with receiver_authorizer_mismatch. Same trap as sc_llm_x402.ts.
  const paymentRequirements = await scheme.enhancePaymentRequirements(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    baseRequirements as any,
    {
      x402Version: 2,
      scheme: "batch-settlement",
      network: network as `${string}:${string}`,
      extra: baseRequirements.extra,
    },
    [],
  );

  let verification: {
    isValid: boolean;
    invalidReason?: string;
    invalidMessage?: string;
    payer?: string;
  };
  try {
    verification = await resourceServer.verifyPayment(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload as any,
      paymentRequirements,
    );
  } catch (err) {
    logger.error({ err }, "Payment verification error");
    return jsonResponse(402, { error: `Payment verification failed: ${(err as Error).message}` });
  }

  if (!verification.isValid) {
    logger.warn(
      { reason: verification.invalidReason, message: verification.invalidMessage },
      "Payment verification failed",
    );
    // Through the SDK rather than a hand-rolled body, so its response-time enrichment runs: for a
    // cumulative-amount mismatch this attaches channelState/voucherState, which is what the client
    // needs to resync and retry by itself instead of showing the user a dead channel.
    const paymentRequired = await resourceServer.createPaymentRequiredResponse(
      [paymentRequirements],
      {
        url: `${SERVICE_URL}/${route}`,
        description: DESCRIPTION[route],
        mimeType: "application/json",
      },
      verification.invalidReason,
      verification.payer ? { payer: verification.payer } : undefined,
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload as any,
    );
    return create402Response(paymentRequired);
  }

  let data: unknown;
  try {
    data = await run(args);
  } catch (err) {
    // Nothing is settled: an upstream that failed is not something to charge for.
    return errorResponseFor(err);
  }

  // Fixed price, so settle takes the same amount verify did — no ceiling-versus-usage split like
  // the chat's, where the real cost is only known after the completion.
  let settlement: Record<string, unknown> & { success: boolean; errorReason?: string };
  try {
    settlement = await resourceServer.settlePayment(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload as any,
      paymentRequirements,
    );
  } catch (err) {
    logger.error({ err }, "Settlement error");
    return jsonResponse(402, { error: `Settlement failed: ${(err as Error).message}` });
  }

  if (!settlement.success) {
    logger.error({ settlement }, "Settlement failed");
    return jsonResponse(402, {
      error: `Settlement failed: ${settlement.errorReason ?? "unknown"}`,
    });
  }

  logger.info({ route, network, amount: PRICE_ATOMIC[route] }, "Served and settled");
  return {
    statusCode: 200,
    headers: { ...SEARCH_CORS_HEADERS, ...createSettlementHeaders(settlement) },
    body: JSON.stringify(data),
  };
}

/** The 402 challenge: what this route costs and where it may be paid. */
async function challenge(route: Route, receiverAddress: `0x${string}`) {
  let scheme: ReturnType<typeof createLLMResourceServer>["scheme"];
  try {
    ({ scheme } = createLLMResourceServer(receiverAddress));
  } catch (err) {
    logger.error({ err }, "Failed to configure batch-settlement resource server");
    return jsonResponse(500, { error: "Internal server error" });
  }

  const paymentRequirements = await createBatchSettlementPaymentRequirements({
    // The route, not the full request: a client caches payment terms per resource url, and the
    // terms are the same whatever the query says.
    resourceUrl: `${SERVICE_URL}/${route}`,
    description: DESCRIPTION[route],
    mimeType: "application/json",
    amount: PRICE_ATOMIC[route],
    payTo: receiverAddress,
    scheme,
    networks: MAINNET_NETWORKS,
    maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
  });
  return create402Response(paymentRequirements);
}

function isHexAddress(addr: unknown): addr is `0x${string}` {
  return typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export async function handle(
  event: Record<string, unknown>,
  _context: unknown,
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  // CORS preflight, answered before anything else — a browser sends it with neither an
  // Authorization header nor a payment.
  if ((event.httpMethod as string) === "OPTIONS") {
    return { statusCode: 200, headers: SEARCH_CORS_HEADERS, body: "" };
  }

  const headers = event.headers as Record<string, string> | undefined;
  const method = event.httpMethod as string;
  const path = parsePath((event.path as string) || "");
  const queryParams = (event.queryStringParameters as Record<string, string>) || {};

  if (method !== "GET" || !isRoute(path)) {
    return jsonResponse(404, { error: "Not found" });
  }

  if (await checkOwner(headers)) {
    try {
      return jsonResponse(200, await run(parseArgs(path, queryParams)));
    } catch (err) {
      return errorResponseFor(err);
    }
  }

  const receiverAddress = process.env.NFT_WALLET_PUBLIC_KEY;
  if (!isHexAddress(receiverAddress)) {
    logger.error("NFT_WALLET_PUBLIC_KEY not configured or invalid");
    return jsonResponse(500, { error: "Internal server error" });
  }

  // GET routes, so the payment can only arrive in a header — there is no body to fall back to the
  // way `genimg_x402_token.ts` does.
  const payload = extractPaymentPayload(headers ?? {});
  if (!payload) {
    // Before validation, deliberately: an unpaid request is answered with the price whatever its
    // query string says, so a client probing for terms is not first told its query is malformed.
    return challenge(path, receiverAddress);
  }

  // A *paid* request is validated before anything is verified or settled.
  let args: Args;
  try {
    args = parseArgs(path, queryParams);
  } catch (err) {
    return errorResponseFor(err);
  }

  try {
    return await servePaid(path, args, payload, receiverAddress);
  } catch (err) {
    logger.error({ err }, "Paid request handler error");
    return jsonResponse(500, { error: "Internal server error" });
  }
}

/* Local dev server — only when run directly: npm run dev:search */
const isEntrypoint =
  typeof process.argv[1] === "string" &&
  import.meta.url.endsWith(process.argv[1].replace(/.*\//, ""));

if (isEntrypoint && process.env.NODE_ENV === "test") {
  (async () => {
    const dotenvModule = await import("dotenv");
    dotenvModule.config();

    // Said out loud because it is not obvious and it has already cost a debugging session: a local
    // run verifies and settles against the **shared, production** channel store, so its writes are
    // the same records the deployed chat reads. That is deliberate — testing the paid path needs a
    // real, funded channel — but it means a local experiment is not a local experiment.
    logger.warn(
      { bucket: process.env.SCW_S3_BUCKET ?? "my-imagestore", prefix: "channels/<network>/" },
      "Local server uses the PRODUCTION x402 channel store",
    );

    const scw = await import("@scaleway/serverless-functions");
    scw.serveHandler(handle, 8084);
  })().catch((err) => logger.error({ err }, "Error starting local server"));
}
