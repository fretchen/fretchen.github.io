import { callLLMAPI, convertTokensToUsdcCost, type LLMMessage } from "./llm_service.js";
import { parseJsonBody } from "./utils.js";
import { getUSDCConfig, isTestnet } from "@fretchen/chain-utils";
import pino from "pino";
import {
  createLLMResourceServer,
  createBatchSettlementPaymentRequirements,
  create402Response,
  extractPaymentPayload,
  createSettlementHeaders,
  getBatchSettlementNetworks,
  LLM_MAX_TIMEOUT_SECONDS,
} from "./x402_server.js";
import type { ScwEvent } from "./types.js";
import openapiSpec from "./openapi.llm.json" with { type: "json" };

export type { ScwEvent };

interface ScwResponse {
  body: string;
  statusCode: number;
  headers: Record<string, string>;
}

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

// Ceiling price per message, in USDC atomic units (6 decimals) — the *maximum* a message
// can cost, not what it actually costs. This is what the 402 advertises and what the
// client's voucher signs against, because @x402/evm batch-settlement/server's
// handleBeforeVerify requires an *exact* match between the voucher's signed
// maxClaimableAmount and chargedCumulativeAmount + requirements.amount at verify time.
// The REAL, usage-derived charge is computed after the LLM call and passed to
// settlePayment() as a *separate*, smaller requirements.amount — handleBeforeSettle only
// enforces chargedCumulativeAmount + requirements.amount <= voucher.maxClaimableAmount (a
// ceiling, not equality), so verify and settle are free to use different amounts. This is
// the "authorize an upper bound, claim the real amount" pattern the SDK's
// setSettlementOverrides() wraps for Express apps — we do it manually here since we call
// settlePayment() directly. See getSettleAmount() below.
// This endpoint uses Mistral, not IONOS — see llm_service.ts's LLM_PROVIDERS. Legacy
// sc_llm.ts (merkle settlement) is untouched and stays on IONOS.
const LLM_PROVIDER = "mistral";

const MAX_TOKENS_PER_MESSAGE = process.env.LLM_ESTIMATED_TOKENS_PER_MESSAGE ?? "2000";
// No real prompt/completion split exists yet for the ceiling, so price the entire
// estimate as completion (output) tokens — the pricier of the two rates for a
// provider with an asymmetric split like Mistral's. This guarantees the ceiling is
// never an underestimate relative to whatever the real split turns out to be;
// getSettleAmount's cap below still protects the ceiling from ever being exceeded.
const USDC_MAX_PRICE_PER_MESSAGE = convertTokensToUsdcCost(
  { prompt_tokens: 0, completion_tokens: MAX_TOKENS_PER_MESSAGE },
  LLM_PROVIDER,
).toString();

/**
 * Real, usage-derived charge for this message, capped at the pre-authorized ceiling
 * (`USDC_MAX_PRICE_PER_MESSAGE`) — a response that somehow runs over the estimate still
 * settles for the max rather than aborting with cap_exceeded; the difference is absorbed
 * as under-billing, not a fund-safety issue (the client is always protected by the
 * voucher's signed ceiling).
 */
function getSettleAmount(usage: { prompt_tokens: number; completion_tokens: number }): string {
  const actualCost = convertTokensToUsdcCost(usage, LLM_PROVIDER);
  const maxCost = BigInt(USDC_MAX_PRICE_PER_MESSAGE);
  return (actualCost > maxCost ? maxCost : actualCost).toString();
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  // Must cover every header @x402/fetch sets on the paid retry request — see
  // genimg_x402_token.ts's identical OPTIONS block for the same reasoning.
  "Access-Control-Allow-Headers":
    "Content-Type, PAYMENT-SIGNATURE, X-PAYMENT, Access-Control-Expose-Headers",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

function isHexAddress(addr: unknown): addr is `0x${string}` {
  return typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function errorResponse(statusCode: number, error: string): ScwResponse {
  return { body: JSON.stringify({ error }), headers: CORS_HEADERS, statusCode };
}

export async function handle(event: ScwEvent, _context: unknown): Promise<ScwResponse> {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod === "GET" && (event.path ?? "").replace(/^\/+/, "") === "openapi.json") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(openapiSpec),
    };
  }

  if (event.httpMethod !== "POST") {
    return errorResponse(400, "Only POST requests are supported");
  }

  const body = parseJsonBody(event.body);
  if (!body) {
    return errorResponse(400, "Invalid JSON body");
  }

  const data = body["data"] as Record<string, unknown> | undefined;
  if (!Array.isArray(data?.["prompt"])) {
    return errorResponse(400, "No prompt provided");
  }
  const prompt = data["prompt"] as LLMMessage[];

  // Deliberately left undefined (not defaulted to false) when absent — the testnet
  // reject check below needs to distinguish "not sent" from "explicitly false".
  let useDummyData: boolean | undefined;
  if (data["useDummyData"] !== undefined) {
    if (typeof data["useDummyData"] !== "boolean") {
      return errorResponse(400, "Invalid useDummyData flag");
    }
    useDummyData = data["useDummyData"];
  }

  const receiverAddress = process.env.NFT_WALLET_PUBLIC_KEY;
  if (!receiverAddress || !isHexAddress(receiverAddress)) {
    return errorResponse(
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
    return errorResponse(500, "Server configuration error");
  }

  const paymentPayload = extractPaymentPayload(event.headers) ?? body["payment"];

  if (!paymentPayload) {
    logger.info("No payment provided, returning 402");
    const paymentRequirements = await createBatchSettlementPaymentRequirements({
      resourceUrl: event.path ?? process.env.LLM_SERVICE_URL ?? "https://api.example.com/llm",
      description: "AI Assistant chat message",
      mimeType: "application/json",
      amount: USDC_MAX_PRICE_PER_MESSAGE,
      payTo: receiverAddress,
      scheme,
    });
    return create402Response(paymentRequirements);
  }

  const clientNetwork = (paymentPayload as Record<string, unknown>)["accepted"]
    ? (((paymentPayload as Record<string, unknown>)["accepted"] as Record<string, unknown>)[
        "network"
      ] as string | undefined)
    : undefined;

  if (!clientNetwork || !getBatchSettlementNetworks().includes(clientNetwork)) {
    return errorResponse(402, "Unsupported or missing network for batch-settlement payment");
  }

  // SECURITY: testnet must never reach the real Mistral API. Neither real caller
  // (website's useX402Chat.ts, this endpoint's buyer notebook) ever sends
  // useDummyData — they rely entirely on network selection. An explicit
  // `useDummyData: false` on a testnet network is therefore always a caller error,
  // not a legitimate request for a real answer — reject it loudly instead of
  // silently downgrading to a mock response.
  if (isTestnet(clientNetwork) && useDummyData === false) {
    return errorResponse(
      400,
      "Real inference is not available on testnet — this network always returns a mocked LLM response. Omit useDummyData or set it to true, or use a mainnet network for a real completion.",
    );
  }
  // Never spend real inference budget on a valueless testnet payment. As with
  // genimg's useMockImage (genimg_x402_token.ts), a testnet payment still runs the real
  // x402 verify/settle but gets a mock completion instead of a paid API call.
  const useMock = useDummyData === true || isTestnet(clientNetwork);

  const usdcConfig = getUSDCConfig(clientNetwork);
  const baseRequirements = {
    scheme: "batch-settlement",
    network: clientNetwork,
    amount: USDC_MAX_PRICE_PER_MESSAGE,
    asset: usdcConfig.address,
    payTo: receiverAddress,
    // Must match the value advertised in the 402 (createBatchSettlementPaymentRequirements)
    // — the SDK treats maxTimeoutSeconds as immutable between advertise and verify.
    maxTimeoutSeconds: LLM_MAX_TIMEOUT_SECONDS,
    extra: { name: usdcConfig.usdcName, version: usdcConfig.usdcVersion },
  };
  // Must be the SAME enhanced requirements (extra.receiverAuthorizer/withdrawDelay) the
  // client signed its channelConfig against when it saw the 402 — a raw, un-enhanced
  // requirements object here makes the facilitator's validateChannelConfig() reject every
  // deposit with receiver_authorizer_mismatch, since it treats a missing extra field as a
  // mismatch rather than "not required". Confirmed via a real Base Sepolia run.
  const paymentRequirements = await scheme.enhancePaymentRequirements(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    baseRequirements as any,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      paymentPayload as any,
      paymentRequirements,
    );
  } catch (error) {
    logger.error({ err: error }, "Payment verification error");
    return errorResponse(402, `Payment verification failed: ${(error as Error).message}`);
  }

  if (!verification.isValid) {
    // Log the SDK's human-readable invalidMessage alongside the machine reason — e.g. for
    // `channel_busy` it reads "Channel is already processing a request", which explains an
    // otherwise-opaque, transient rejection (a per-channel lock held across verify→settle;
    // self-heals within LLM_MAX_TIMEOUT_SECONDS). The response body keeps `invalidReason` as
    // the raw code, which the client SDK's corrective-recovery path matches on.
    logger.warn(
      { reason: verification.invalidReason, message: verification.invalidMessage },
      "Payment verification failed",
    );
    // Must go through createPaymentRequiredResponse (not a hand-rolled body) so the SDK's
    // response-time scheme enrichment runs — e.g. for batch-settlement's
    // invalid_batch_settlement_evm_cumulative_amount_mismatch, this attaches
    // accepts[].extra.channelState/voucherState, which is what the client SDK's
    // processCorrectivePaymentRequired needs to resync and retry automatically. Passing the
    // failed paymentPayload is what triggers that enrichment (see the SDK's own doc comment
    // on this param). Confirmed via a real Base Sepolia run through the buyer notebook.
    const paymentRequired = await resourceServer.createPaymentRequiredResponse(
      [paymentRequirements],
      {
        url: event.path ?? process.env.LLM_SERVICE_URL ?? "https://api.example.com/llm",
        description: "AI Assistant chat message",
        mimeType: "application/json",
      },
      verification.invalidReason,
      verification.payer ? { payer: verification.payer } : undefined,
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      paymentPayload as any,
    );
    return create402Response(paymentRequired);
  }

  let llmData: Awaited<ReturnType<typeof callLLMAPI>>;
  try {
    if (useMock) {
      logger.info({ network: clientNetwork }, "Using mock LLM response (test mode)");
    }
    logger.debug({ prompt }, "Generating answer for prompt");
    llmData = await callLLMAPI(prompt, useMock, LLM_PROVIDER);
  } catch (error) {
    logger.error({ err: error }, "Error during answer generation");
    const msg = (error as Error).message;
    const statusCode = msg.includes("API Token nicht gefunden") ? 401 : 500;
    return errorResponse(statusCode, msg);
  }

  // Commits chargedCumulativeAmount locally for a voucher payload (no on-chain tx, no
  // facilitator call — confirmed from @x402/evm source: handleBeforeSettle returns
  // `{ skip: true }`); for a deposit payload this is the one real on-chain settlement.
  //
  // Settling with a DIFFERENT (smaller, real-usage) amount than what verifyPayment() used
  // is intentional — see getSettleAmount()'s comment above. handleBeforeSettle only checks
  // this against the voucher's signed ceiling, not against what verify saw.
  const settleAmount = getSettleAmount(llmData.usage);
  const settleRequirements = { ...paymentRequirements, amount: settleAmount };

  try {
    const settlement = await resourceServer.settlePayment(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      paymentPayload as any,
      settleRequirements,
    );
    if (!settlement.success) {
      logger.error({ settlement }, "Settlement failed");
      return errorResponse(402, `Settlement failed: ${settlement.errorReason ?? "unknown"}`);
    }

    logger.info(
      { usage: llmData.usage, model: llmData.model, settleAmount },
      "Answer generated and settled",
    );
    logger.debug({ data: llmData }, "Answer content");
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, ...createSettlementHeaders(settlement) },
      body: JSON.stringify(llmData),
    };
  } catch (error) {
    logger.error({ err: error }, "Settlement error");
    return errorResponse(402, `Settlement failed: ${(error as Error).message}`);
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

          fastify.listen({ port: 8085, host: "0.0.0.0" }, (err: unknown, address: string) => {
            if (err) {
              console.error("Failed to start server:", err);
              process.exit(1);
            }
            console.log(`🚀 LLM x402 batch-settlement Local Server listening at ${address}`);
          });
        });
      });
    });
  });
}
