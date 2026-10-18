/**
 * The llmx402 seller's routing, natively against web-standard Request/Response — the bunny
 * twin of scw_js/sc_llm_x402.ts. The payment and service layers underneath are ported
 * verbatim; this file mirrors the Scaleway handler's route table, ordering rules, and the
 * payment/settlement comments (challenge-before-validation, ceiling-then-usage settle,
 * testnet-mock gate), with THREE deliberate deviations:
 *
 * 1. **The 40-second completion cap.** bunny's edge kills a request at ~59 s wall clock
 *    (measured 2026-10-18, 504 at 59.2 s), so the twin advertises/verifies with
 *    LLM_MAX_TIMEOUT_SECONDS = 40 (vs the scw original's 120) and races the upstream call
 *    at the same bound. If the edge ever killed an in-flight completion, the client would
 *    get a 504 while verify-settle never finished — an orphaned channel lock; answering a
 *    timeout BEFORE the ceiling (lock released, nothing settled) is the only safe shape.
 *    maxTimeoutSeconds is per-route, not part of channelId, so channels funded against the
 *    scw chat's 120 s advertisement remain usable here.
 * 2. **The upstream call is raced.** scw_js's callLLMAPI has no timeout of its own — the
 *    Scaleway platform ceiling bounded it. This router adds the race explicitly.
 * 3. **openapi.json is served with the live price ceiling** — identical to scw (kept, since
 *    it is behavior, not platform).
 */
import { callLLMAPI, resolveModel, advertisedModelIds, type LLMMessage } from "./llm_service.js";
import { parseJsonBody, CORS_HEADERS } from "./utils.js";
import { z } from "zod";
import {
  LLMChatRequestSchema,
  LLMChatMessageSchema,
  LLMToolsSchema,
  REJECTED_PARAMS,
  FORWARDED_OWN_KEYS,
  MAX_MESSAGES_BYTES,
  MAX_PRICE_ATOMIC,
  getSettleAmount,
} from "./llm_schemas.js";
import { isTestnet } from "@fretchen/chain-utils";
import { logger } from "./logger.js";
import { offeredStablecoins, resolvePaidStablecoin } from "./stablecoin_pricing.js";
import { toResponse } from "./response.js";
import {
  createLLMResourceServer,
  createBatchSettlementPaymentRequirements,
  create402Response,
  extractPaymentPayload,
  createSettlementHeaders,
  getBatchSettlementNetworks,
  formatUsdcAtomicAsDecimalUsd,
  releaseLock,
  type SdkPaymentPayload,
  type SdkPaymentRequirements,
} from "./x402_server.js";
import { FAVICON_DISCOVERY_HTML, wantsHtml } from "./discovery.js";
import { AGENT_REGISTRATION_PATH, buildAgentRegistration } from "./agent_registration.js";
import { faviconBase64, faviconContentType } from "./favicon.js";
import { buildLlmBazaarExtension } from "./bazaar_discovery.js";
import openapiSpec from "./openapi.llm.json" with { type: "json" };

/**
 * The lock TTL and completion bound for the twin — see the header's deviation 1.
 * Must be identical at advertise and verify time (the SDK treats it as immutable across
 * the pair, like scw's 120).
 */
export const LLM_MAX_TIMEOUT_SECONDS = 40;

/** The favicon as raw bytes — web Response bodies are bytes, not Scaleway base64 strings. */
const FAVICON_BYTES = Uint8Array.from(atob(faviconBase64), (c) => c.charCodeAt(0));

function jsonError(statusCode: number, error: string): Response {
  return new Response(JSON.stringify({ error }), { status: statusCode, headers: CORS_HEADERS });
}

/**
 * OpenAI-shaped error body ({ error: { message, type, code } }) — same contract as scw_js's
 * openAiError, so callers reusing OpenAI response types parse our errors too.
 */
function openAiError(
  statusCode: number,
  message: string,
  type: string,
  code: string | null = null,
  param?: string,
): Response {
  return new Response(JSON.stringify({ error: { message, type, code, ...(param && { param }) } }), {
    status: statusCode,
    headers: CORS_HEADERS,
  });
}

function isHexAddress(addr: unknown): addr is `0x${string}` {
  return typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

// The request fields this endpoint consumes rather than passes on — derived from the
// schema's own shape rather than a hand-written list, exactly as in scw_js (see there).
const STRIPPED_REQUEST_KEYS = new Set(
  Object.keys(LLMChatRequestSchema.shape).filter((key) => !FORWARDED_OWN_KEYS.has(key)),
);

export async function handleLLMRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  const method = request.method;
  const path = (new URL(request.url).pathname ?? "").replace(/^\/+/, "");
  const headers = Object.fromEntries(request.headers) as Record<string, string>;
  const isGetOrHead = method === "GET" || method === "HEAD";
  const isHead = method === "HEAD";

  if (isGetOrHead && path === AGENT_REGISTRATION_PATH) {
    return new Response(
      isHead
        ? null
        : JSON.stringify(
            buildAgentRegistration(openapiSpec, "llm", process.env.NFT_WALLET_PUBLIC_KEY),
          ),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  if (method === "GET" && path === "openapi.json") {
    // The static file's x-payment-info.price.max is a documentation-only baseline —
    // MAX_PRICE_ATOMIC is the real, live ceiling, so override it here rather than let the
    // served discovery doc silently drift from the actual runtime 402 behavior (scw parity).
    const spec = structuredClone(openapiSpec) as typeof openapiSpec;
    spec.paths["/"].post["x-payment-info"].price.max = formatUsdcAtomicAsDecimalUsd(
      MAX_PRICE_ATOMIC.USDC,
    );
    return new Response(JSON.stringify(spec), {
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

  if (method !== "POST") {
    return jsonError(400, "Only POST requests are supported");
  }

  const body = parseJsonBody(await request.text());
  if (!body) {
    return openAiError(400, "Invalid JSON body", "invalid_request_error");
  }

  // ─── Payment challenge comes BEFORE request validation ─── (scw parity: an unpaid request
  // is answered with the 402 whatever its body says — the llm/v1 contract; a paid request
  // still runs the full validation below before any voucher is verified or settled.)
  const receiverAddressForChallenge = process.env.NFT_WALLET_PUBLIC_KEY;
  if (!receiverAddressForChallenge || !isHexAddress(receiverAddressForChallenge)) {
    return jsonError(
      500,
      "Service provider address not configured or invalid. Set NFT_WALLET_PUBLIC_KEY to a 0x-prefixed 40-hex-char address.",
    );
  }
  const paymentPayloadEarly = extractPaymentPayload(headers) ?? body["payment"];
  if (!paymentPayloadEarly) {
    logger.info("No payment provided, returning 402");
    let challengeScheme: ReturnType<typeof createLLMResourceServer>["scheme"];
    try {
      ({ scheme: challengeScheme } = createLLMResourceServer(receiverAddressForChallenge));
    } catch (err) {
      logger.error({ err }, "Failed to configure batch-settlement resource server");
      return jsonError(500, "Server configuration error");
    }
    const paymentRequirements = await createBatchSettlementPaymentRequirements({
      // Absolute, from the committed spec's server URL — bazaar validation rejects relative.
      resourceUrl: `${openapiSpec.servers[0].url}/`,
      description: "AI Assistant chat message",
      mimeType: "application/json",
      price: MAX_PRICE_ATOMIC,
      payTo: receiverAddressForChallenge,
      scheme: challengeScheme,
      networks: getBatchSettlementNetworks(),
      maxTimeoutSeconds: LLM_MAX_TIMEOUT_SECONDS,
      extensions: buildLlmBazaarExtension(),
      serviceName: "Fretchen AI Assistant",
      tags: ["llm", "chat", "x402"],
      iconUrl: `${openapiSpec.servers[0].url}/favicon.png`,
    });
    return toResponse(create402Response(paymentRequirements));
  }

  // OpenAI chat-completions request body — everything we do not consume is FORWARDED to the
  // upstream model (Mistral owns the chat-param contract). The rejected list below covers
  // exactly the params that move cost past the fixed per-message ceiling (scw parity; the
  // list lives in llm_schemas.ts so the published 400s are built from the same entries).
  for (const param of REJECTED_PARAMS) {
    if (param.predicate(body[param.name])) {
      return openAiError(400, param.message, "invalid_request_error", param.code, param.errorParam);
    }
  }

  // Capped rather than refused, like scw: tool definitions are input tokens on every hop;
  // validated with the published schema so the caps a caller reads are the caps enforced.
  if (body["tools"] !== undefined) {
    const tools = LLMToolsSchema.safeParse(body["tools"]);
    if (!tools.success) {
      return openAiError(
        400,
        `Invalid 'tools': ${z.prettifyError(tools.error)}`,
        "invalid_request_error",
        "unsupported_value",
        "tools",
      );
    }
  }

  const toolChoice = body["tool_choice"];
  if (toolChoice !== undefined && toolChoice !== "auto" && toolChoice !== "none") {
    return openAiError(
      400,
      'Only tool_choice "auto" or "none" is supported by this endpoint; a forced or named choice is not.',
      "invalid_request_error",
      "unsupported_value",
      "tool_choice",
    );
  }

  const messages = body["messages"];
  if (!Array.isArray(messages) || messages.length === 0) {
    return openAiError(400, "'messages' must be a non-empty array.", "invalid_request_error");
  }
  // Capped before verifyPayment: an over-limit request must be rejected without being charged.
  const messagesBytes = Buffer.byteLength(JSON.stringify(messages), "utf8");
  if (messagesBytes > MAX_MESSAGES_BYTES) {
    return openAiError(
      400,
      `'messages' must serialize to at most ${MAX_MESSAGES_BYTES} bytes (received ${messagesBytes}). Each message is metered against a fixed per-message price ceiling, which a larger conversation would exceed.`,
      "invalid_request_error",
      "unsupported_value",
      "messages",
    );
  }
  const parsedMessages = z.array(LLMChatMessageSchema).min(1).safeParse(messages);
  if (!parsedMessages.success) {
    return openAiError(
      400,
      `Invalid 'messages': ${z.prettifyError(parsedMessages.error)}`,
      "invalid_request_error",
    );
  }
  const prompt = parsedMessages.data as LLMMessage[];

  const requestedModel = body["model"];
  if (typeof requestedModel !== "string" || !requestedModel) {
    return openAiError(400, "'model' is required.", "invalid_request_error");
  }
  const resolved = resolveModel(requestedModel);
  if (!resolved) {
    return openAiError(
      404,
      `The model '${requestedModel}' does not exist or is not served by this endpoint. Available: ${advertisedModelIds().join(", ")}.`,
      "invalid_request_error",
      "model_not_found",
    );
  }

  // `useDummyData` is the vendor extension (testnet mock control) — deliberately left
  // undefined when absent, so the testnet reject check can distinguish "not sent".
  let useDummyData: boolean | undefined;
  if (body["useDummyData"] !== undefined) {
    if (typeof body["useDummyData"] !== "boolean") {
      return openAiError(400, "Invalid useDummyData flag.", "invalid_request_error");
    }
    useDummyData = body["useDummyData"] as boolean;
  }

  const receiverAddress = process.env.NFT_WALLET_PUBLIC_KEY;
  if (!receiverAddress || !isHexAddress(receiverAddress)) {
    return jsonError(
      500,
      "Service provider address not configured or invalid. Set NFT_WALLET_PUBLIC_KEY to a 0x-prefixed 40-hex-char address.",
    );
  }

  let resourceServer: ReturnType<typeof createLLMResourceServer>["resourceServer"];
  let scheme: ReturnType<typeof createLLMResourceServer>["scheme"];
  try {
    ({ resourceServer, scheme } = createLLMResourceServer(receiverAddress));
  } catch (err) {
    logger.error({ err }, "Failed to configure batch-settlement resource server");
    return jsonError(500, "Server configuration error");
  }

  // Non-null: the unpaid case already returned the 402 challenge above, before validation.
  const paymentPayload = paymentPayloadEarly;

  const clientNetwork = (paymentPayload as Record<string, unknown>)["accepted"]
    ? (((paymentPayload as Record<string, unknown>)["accepted"] as Record<string, unknown>)[
        "network"
      ] as string | undefined)
    : undefined;

  if (!clientNetwork || !getBatchSettlementNetworks().includes(clientNetwork)) {
    return jsonError(402, "Unsupported or missing network for batch-settlement payment");
  }

  // SECURITY: testnet must never reach the real Mistral API (scw parity). An explicit
  // `useDummyData: false` on a testnet network is always a caller error — reject loudly.
  if (isTestnet(clientNetwork) && useDummyData === false) {
    return jsonError(
      400,
      "Real inference is not available on testnet — this network always returns a mocked LLM response. Omit useDummyData or set it to true, or use a mainnet network for a real completion.",
    );
  }
  // Never spend real inference budget on a valueless testnet payment (scw parity).
  const useMock = useDummyData === true || isTestnet(clientNetwork);

  // Price the stablecoin the buyer's channel is in, not a fixed one (scw parity).
  const accepted = (paymentPayload as Record<string, unknown>)["accepted"] as
    Record<string, unknown> | undefined;
  const coin = resolvePaidStablecoin(clientNetwork, accepted?.["asset"]);
  if (!coin) {
    logger.warn({ clientNetwork, asset: accepted?.["asset"] }, "Payment asset not offered");
    return jsonError(
      402,
      `Unsupported payment asset on ${clientNetwork} — offered: ${offeredStablecoins(clientNetwork)
        .map((offered) => `${offered.symbol} ${offered.address}`)
        .join(", ")}`,
    );
  }
  const baseRequirements: SdkPaymentRequirements = {
    scheme: "batch-settlement",
    network: clientNetwork as `${string}:${string}`,
    amount: MAX_PRICE_ATOMIC[coin.symbol],
    asset: coin.address,
    payTo: receiverAddress,
    maxTimeoutSeconds: LLM_MAX_TIMEOUT_SECONDS,
    extra: { name: coin.name, version: coin.version },
  };
  // Must be the SAME enhanced requirements the client signed its channelConfig against —
  // a raw object here makes the facilitator reject every deposit with
  // receiver_authorizer_mismatch (scw parity; confirmed via a real Base Sepolia run).
  const paymentRequirements = await scheme.enhancePaymentRequirements(
    baseRequirements,
    {
      x402Version: 2,
      scheme: "batch-settlement",
      network: clientNetwork as `${string}:${string}`,
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
      paymentPayload as SdkPaymentPayload,
      paymentRequirements,
    );
  } catch (error) {
    logger.error({ err: error }, "Payment verification error");
    return jsonError(402, `Payment verification failed: ${(error as Error).message}`);
  }

  if (!verification.isValid) {
    // Through createPaymentRequiredResponse (not a hand-rolled body) so the SDK's corrective
    // enrichment runs — channelState/voucherState for cumulative mismatches, which the client
    // SDK's processCorrectivePaymentRequired needs to resync and retry (scw parity).
    logger.warn(
      { reason: verification.invalidReason, message: verification.invalidMessage },
      "Payment verification failed",
    );
    const paymentRequired = await resourceServer.createPaymentRequiredResponse(
      [paymentRequirements],
      {
        url: `${openapiSpec.servers[0].url}/`,
        description: "AI Assistant chat message",
        mimeType: "application/json",
      },
      verification.invalidReason,
      verification.payer ? { payer: verification.payer } : undefined,
      undefined,
      paymentPayload as SdkPaymentPayload,
    );
    return toResponse(create402Response(paymentRequired));
  }

  let llmData: Awaited<ReturnType<typeof callLLMAPI>>;
  try {
    if (useMock) {
      logger.info({ network: clientNetwork }, "Using mock LLM response (test mode)");
    }
    logger.debug({ prompt }, "Generating answer for prompt");
    // Forward everything we do not consume (scw parity; STRIPPED_REQUEST_KEYS is derived
    // from the schema, keeping this self-maintaining).
    const forwardedParams = Object.fromEntries(
      Object.entries(body).filter(([key]) => !STRIPPED_REQUEST_KEYS.has(key)),
    );
    // DEVIATION from scw: race the upstream call at the twin's 40 s cap — bunny's edge
    // kills the request at ~59 s wall clock, and an in-flight kill would strand the
    // channel lock. callLLMAPI itself is unbounded (the scw platform ceiling bound it).
    llmData = await Promise.race([
      callLLMAPI(prompt, useMock, resolved.provider, forwardedParams),
      new Promise<never>((_resolve, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `LLM completion exceeded the twin's ${LLM_MAX_TIMEOUT_SECONDS} s bound (the bunny edge kills requests at ~59 s)`,
              ),
            ),
          LLM_MAX_TIMEOUT_SECONDS * 1000,
        ),
      ),
    ]);
  } catch (error) {
    logger.error({ err: error }, "Error during answer generation");
    // Verified but never settled: release the channel lock, or the next message waits out
    // LLM_MAX_TIMEOUT_SECONDS behind `channel_busy` for an answer that was never charged.
    await releaseLock(resourceServer, paymentPayload as SdkPaymentPayload, paymentRequirements);
    return jsonError(500, (error as Error).message);
  }

  // Settling with a DIFFERENT (smaller, real-usage) amount than verifyPayment() used is
  // intentional (scw parity — see getSettleAmount() in llm_schemas.ts): handleBeforeSettle
  // only checks against the voucher's signed ceiling, not against what verify saw.
  const settleAmount = getSettleAmount(llmData.usage, coin.symbol);
  const settleRequirements = { ...paymentRequirements, amount: settleAmount };

  try {
    const settlement = await resourceServer.settlePayment(
      paymentPayload as SdkPaymentPayload,
      settleRequirements,
    );
    if (!settlement.success) {
      logger.error({ settlement }, "Settlement failed");
      return jsonError(402, `Settlement failed: ${settlement.errorReason ?? "unknown"}`);
    }

    logger.info(
      { usage: llmData.usage, model: llmData.model, settleAmount },
      "Answer generated and settled",
    );
    return new Response(JSON.stringify(llmData), {
      status: 200,
      headers: { ...CORS_HEADERS, ...createSettlementHeaders(settlement) },
    });
  } catch (error) {
    logger.error({ err: error }, "Settlement error");
    return jsonError(402, `Settlement failed: ${(error as Error).message}`);
  }
}
