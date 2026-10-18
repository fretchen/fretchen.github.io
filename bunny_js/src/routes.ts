/**
 * The searchapi x402 seller's routing, natively against web-standard Request/Response —
 * the bunny twin of scw_js/search_api.ts. The payment and service layers underneath are
 * ported verbatim; this file is the only genuinely new code, a line-by-line mirror of the
 * Scaleway handler's route table, ordering rules and payment comments.
 *
 * Routing order is load-bearing and copied exactly:
 *   OPTIONS preflight → discovery (agent-registration, openapi.json, favicon.png, root
 *   HTML) → 404 for unknown paths (never a 402: a nonexistent resource has no price) →
 *   unpaid GET quotes the challenge whatever its query says → paid GET validates the
 *   query BEFORE verify/settle (verify takes the shared channel's lock; a request that
 *   fails after it never settles, orphaning the lock for MAX_TIMEOUT_SECONDS).
 */
import { logger } from "./logger.js";
import { offeredStablecoins, resolvePaidStablecoin } from "./stablecoin_pricing.js";
import { searchWeb, QueryError } from "./search_service.js";
import { fetchExternalHtml, FetchUrlError, parseHttpsUrl } from "./web_fetch_service.js";
import {
  DESCRIPTION,
  FetchQuerySchema,
  PRICE_ATOMIC,
  ROUTES,
  SearchQuerySchema,
  type Route,
} from "./search_schemas.js";
import { CORS_HEADERS } from "./utils.js";
import { FAVICON_DISCOVERY_HTML, wantsHtml } from "./discovery.js";
import { AGENT_REGISTRATION_PATH, buildAgentRegistration } from "./agent_registration.js";
import { faviconBase64, faviconContentType } from "./favicon.js";
import openapiSpec from "./openapi.search.json" with { type: "json" };
import { buildSearchBazaarExtension } from "./bazaar_discovery.js";
import {
  create402Response,
  createBatchSettlementPaymentRequirements,
  createLLMResourceServer,
  createSettlementHeaders,
  extractPaymentPayload,
  releaseLock,
  type HttpResponse,
  type SdkPaymentPayload,
  type SdkPaymentRequirements,
} from "./x402_server.js";

/**
 * Mainnet only, unlike the chat, which also accepts Base Sepolia. Testnet USDC is free, and
 * both routes spend real money on the caller's behalf — Brave bills per query, and /fetch is
 * egress. Advertising a testnet would hand anyone a metered API for nothing. The cost is
 * that the paid path cannot be exercised on a testnet at all: at $0.001 a call, a real
 * run is cheaper than the setup it replaces. (Copied from scw_js/search_api.ts.)
 */
const MAINNET_NETWORKS = ["eip155:10", "eip155:8453"];

/**
 * Advertised and verified lock TTL, a quarter of the chat's LLM_MAX_TIMEOUT_SECONDS. It
 * drives the per-channel pendingRequest lock the SDK holds from verify until settle; both
 * upstreams time out at 8 seconds, so 30 leaves ample margin — and because these routes
 * share the chat's channel, a lock orphaned by an upstream failure blocks the user's next
 * chat message. Must be identical at advertise and verify time. (Copied.)
 */
const MAX_TIMEOUT_SECONDS = 30;

/**
 * Base for the advertised `resource.url` — the production custom domain by default, so the
 * twin's published terms match the Scaleway original; set SEARCH_SERVICE_URL to the
 * bunny-provided URL when deploying the trial so the advertised origin names where the
 * trial is actually served.
 */
const SERVICE_URL = process.env.SEARCH_SERVICE_URL ?? "https://web-agent.fretchen.eu";

/** The favicon as raw bytes — web Response bodies are bytes, not Scaleway base64 strings. */
const FAVICON_BYTES = Uint8Array.from(atob(faviconBase64), (c) => c.charCodeAt(0));

function jsonResponse(statusCode: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status: statusCode, headers: CORS_HEADERS });
}

/**
 * A web-standard Response cannot carry non-latin1 header bytes (the Headers API rejects them
 * as "not a valid ByteString"), and the 402's X-Payment / the 200's X-Payment-Response are
 * raw JSON whose bazaar metadata contains em-dashes, arrows and ellipses. JSON \uXXXX escapes
 * decode to the exact same string, so escaping non-latin1 codepoints keeps the header's
 * meaning identical for any JSON-parsing client — the base64 Payment-Required /
 * Payment-Response headers are ASCII and pass through untouched.
 */
function byteStringHeaderValue(value: string): string {
  return value.replace(/[\u0100-\uFFFF]/g, (ch) => {
    return `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
}

/** The ported x402 helpers still speak the {statusCode, headers, body} envelope. */
function toResponse(http: HttpResponse): Response {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(http.headers)) {
    headers[key] = byteStringHeaderValue(value);
  }
  return new Response(http.body, { status: http.statusCode, headers });
}

function parsePath(rawPath: string): string {
  return rawPath.replace(/^\/+/, "");
}

function isRoute(path: string): path is Route {
  return (ROUTES as readonly string[]).includes(path);
}

// --- Serving ------------------------------------------------------------------------------------

type Args = { route: "search"; q: string } | { route: "fetch"; url: string };

/**
 * Validate the query string, or throw QueryError / FetchUrlError.
 *
 * Separate from `run` below so a paid request can be rejected **before** anything is verified
 * or settled — verifyPayment takes the channel's pendingRequest lock, and a request that
 * fails after it never settles, so the lock is orphaned for MAX_TIMEOUT_SECONDS on a channel
 * the chat shares. Every check that can happen without I/O therefore happens here, including
 * the url's scheme. One parameter per route means the first issue is the error, used
 * verbatim. (Copied from scw_js/search_api.ts.)
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
  // The schema says "a non-empty string"; parseHttpsUrl says "a url we could actually fetch",
  // and it is the same function assertPublicUrl runs later — the scheme rule has one home.
  return { route, url: parseHttpsUrl(parsed.data.url).toString() };
}

function run(args: Args): Promise<unknown> {
  return args.route === "search" ? searchWeb(args.q) : fetchExternalHtml(args.url);
}

/**
 * A bad query or an unfetchable url is the caller's fault and worth saying precisely — the
 * model corrects itself from these. Everything else is ours or the upstream's, and stays
 * generic so an internal hostname or path cannot leak through an error string. (Copied.)
 */
function errorResponseFor(err: unknown): Response {
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
 * Settle-after-success is what makes an upstream failure free for the caller. It leaves a
 * verify without a matching settle, which holds the channel lock for MAX_TIMEOUT_SECONDS —
 * the reason that constant is 30 and not 120. (Copied from scw_js/search_api.ts.)
 */
async function servePaid(
  route: Route,
  args: Args,
  payload: Record<string, unknown>,
  receiverAddress: `0x${string}`,
): Promise<Response> {
  const network = acceptedNetwork(payload);
  if (!network || !MAINNET_NETWORKS.includes(network)) {
    return jsonResponse(402, {
      error: `Unsupported or missing network. This endpoint accepts ${MAINNET_NETWORKS.join(", ")}`,
    });
  }

  // Price the stablecoin the buyer's channel is in (see sc_llm_x402.ts) — checked before any
  // server setup, since an unoffered asset is the caller's error, not ours.
  const paidAsset = (payload["accepted"] as Record<string, unknown> | undefined)?.["asset"];
  const coin = resolvePaidStablecoin(network, paidAsset);
  if (!coin) {
    return jsonResponse(402, {
      error: `Unsupported payment asset on ${network}`,
      accepted: offeredStablecoins(network).map((offered) => offered.address),
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

  const baseRequirements: SdkPaymentRequirements = {
    scheme: "batch-settlement",
    network: network as `${string}:${string}`,
    amount: PRICE_ATOMIC[route][coin.symbol],
    asset: coin.address,
    payTo: receiverAddress,
    maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
    extra: { name: coin.name, version: coin.version },
  };
  // The ENHANCED requirements, not the base ones: the facilitator's validateChannelConfig treats
  // a missing extra.receiverAuthorizer as a mismatch rather than as "not required", so a raw
  // object here makes every deposit fail with receiver_authorizer_mismatch. (Copied.)
  const paymentRequirements = await scheme.enhancePaymentRequirements(
    baseRequirements,
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
      payload as SdkPaymentPayload,
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
    // cumulative-amount mismatch this attaches channelState/voucherState, which is what the
    // client needs to resync and retry by itself instead of showing the user a dead channel.
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
      payload as SdkPaymentPayload,
    );
    return toResponse(create402Response(paymentRequired));
  }

  let data: unknown;
  try {
    data = await run(args);
  } catch (err) {
    // Nothing is settled: an upstream that failed is not something to charge for. But verify took
    // the channel lock, which the chat shares — release it, or the user's next message is
    // rejected with channel_busy. (Copied.)
    logger.warn({ err, route }, "Run failed after verify; lock released");
    await releaseLock(resourceServer, payload as SdkPaymentPayload, paymentRequirements);
    return errorResponseFor(err);
  }

  // Fixed price, so settle takes the same amount verify did.
  let settlement: Record<string, unknown> & { success: boolean; errorReason?: string };
  try {
    settlement = await resourceServer.settlePayment(
      payload as SdkPaymentPayload,
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

  logger.info(
    { route, network, asset: coin.symbol, amount: baseRequirements.amount },
    "Served and settled",
  );
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...CORS_HEADERS, ...createSettlementHeaders(settlement) },
  });
}

/** The 402 challenge: what this route costs and where it may be paid. */
async function challenge(route: Route, receiverAddress: `0x${string}`): Promise<Response> {
  let scheme: ReturnType<typeof createLLMResourceServer>["scheme"];
  try {
    ({ scheme } = createLLMResourceServer(receiverAddress));
  } catch (err) {
    logger.error({ err }, "Failed to configure batch-settlement resource server");
    return jsonResponse(500, { error: "Internal server error" });
  }

  const paymentRequirements = await createBatchSettlementPaymentRequirements({
    // The route, not the full request: a client caches payment terms per resource url, and the
    // terms are the same whatever the query says. (Copied.)
    resourceUrl: `${SERVICE_URL}/${route}`,
    description: DESCRIPTION[route],
    mimeType: "application/json",
    price: PRICE_ATOMIC[route],
    payTo: receiverAddress,
    scheme,
    networks: MAINNET_NETWORKS,
    maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
    // One bazaar block per route: the block names the method and the query parameters, and the
    // two routes sell different things at different prices. (Copied.)
    extensions: buildSearchBazaarExtension(route),
    serviceName: "Fretchen Web Access",
    tags: ["search", "web", "x402"],
    iconUrl: `${openapiSpec.servers[0].url}/favicon.png`,
  });
  return toResponse(create402Response(paymentRequirements));
}

function isHexAddress(addr: unknown): addr is `0x${string}` {
  return typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export async function handleRequest(request: Request): Promise<Response> {
  // CORS preflight, answered before anything else — a browser sends it with neither an
  // Authorization header nor a payment. (Copied ordering.)
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  // Web Request headers are lowercase; every consumer in the ported stack
  // (extractPaymentPayload, wantsHtml) matches case-insensitively.
  const headers = Object.fromEntries(request.headers) as Record<string, string>;
  const method = request.method;
  const url = new URL(request.url);
  const path = parsePath(url.pathname);
  const queryParams = Object.fromEntries(url.searchParams) as Record<string, string>;

  // ── Discovery, answered before payment and before the route check ─────────────────────────
  // Free, unauthenticated and unpaid. A price list nobody can read is not a price list:
  // x402scan resolves an icon by fetching the origin ROOT and parsing <link rel="icon">
  // before it ever probes /favicon.png, so the root HTML is what makes the crawler index
  // this origin at all (see discovery.ts). (Copied.)
  const isGetOrHead = method === "GET" || method === "HEAD";
  const isHead = method === "HEAD";

  if (isGetOrHead && path === AGENT_REGISTRATION_PATH) {
    return new Response(
      isHead
        ? null
        : JSON.stringify(
            buildAgentRegistration(openapiSpec, "search", process.env.NFT_WALLET_PUBLIC_KEY),
          ),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  if (isGetOrHead && path === "openapi.json") {
    // Served verbatim, unlike the chat's, which rewrites its price ceiling at serve time.
    // Both prices here are constants generated from PRICE_ATOMIC, so there is nothing that
    // could drift between the document and the 402. (Copied.)
    return new Response(isHead ? null : JSON.stringify(openapiSpec), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (isGetOrHead && path === "favicon.png") {
    return new Response(isHead ? null : FAVICON_BYTES, {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": faviconContentType },
    });
  }

  if (isGetOrHead && path === "" && wantsHtml(headers)) {
    return new Response(isHead ? null : FAVICON_DISCOVERY_HTML, {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Paid routes are GET only. The 404 stays ahead of the 402: a resource that does not exist has
  // no price, so an unknown path must never be answered with payment requirements. (Copied.)
  if (method !== "GET" || !isRoute(path)) {
    return jsonResponse(404, { error: "Not found" });
  }

  const receiverAddress = process.env.NFT_WALLET_PUBLIC_KEY;
  if (!isHexAddress(receiverAddress)) {
    logger.error("NFT_WALLET_PUBLIC_KEY not configured or invalid");
    return jsonResponse(500, { error: "Internal server error" });
  }

  // GET routes, so the payment can only arrive in a header. (Copied.)
  const payload = extractPaymentPayload(headers);
  if (!payload) {
    // Before validation, deliberately: an unpaid request is answered with the price whatever
    // its query string says, so a client probing for terms is not first told its query is
    // malformed. (Copied.)
    return challenge(path, receiverAddress);
  }

  // A *paid* request is validated before anything is verified or settled. (Copied.)
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
