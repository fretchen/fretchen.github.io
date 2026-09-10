/**
 * x402 v2 Facilitator - Main Handler
 * Handles POST /verify and POST /settle endpoints
 */

import { verifyPayment } from "./x402_verify";
import { settlePayment } from "./x402_settle";
import { getSupportedCapabilities } from "./x402_supported";
import {
  PaymentRequestSchema,
  type VerifyResponseBody,
  type SettleResponseBody,
} from "./x402_schemas";
import openapiSpec from "./openapi.json" with { type: "json" };
import type { z } from "zod";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

/**
 * Scaleway Functions event object
 */
export interface ScalewayEvent {
  httpMethod: string;
  path?: string;
  rawUrl?: string;
  body?: string | Record<string, unknown>;
  headers?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
}

/**
 * Scaleway Functions context object
 */
export interface ScalewayContext {
  memoryLimitInMb?: number;
  functionName?: string;
  functionVersion?: string;
}

/**
 * Scaleway Functions response object
 */
export interface ScalewayResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Payment request body structure.
 *
 * Inferred from the schema the service publishes rather than hand-written beside it: the previous
 * interface declared every field optional, which described neither what the spec advertised nor
 * what the handler required. `looseObject` keeps the index signatures, so the payload still
 * satisfies the `Record<string, unknown>` parameters of verifyPayment/settlePayment.
 */
type PaymentRequestBody = z.infer<typeof PaymentRequestSchema>;

/**
 * Common headers for all responses
 */
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

/** Human-facing documentation for the facilitator — the root path redirects browsers here. */
const DOCUMENTATION_URL = "https://www.fretchen.eu/x402/";

/**
 * Case-insensitive header lookup. Header casing on Scaleway's event object is not
 * guaranteed, so a direct `headers["Accept"]` read can silently miss a real header.
 */
function getHeader(headers: Record<string, string> | undefined, name: string): string | undefined {
  if (!headers) {
    return undefined;
  }
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) {
      return value;
    }
  }
  return undefined;
}

/**
 * Handle /verify endpoint - off-chain verification
 */
export async function handleVerify(
  event: ScalewayEvent,
  _context: ScalewayContext,
): Promise<ScalewayResponse> {
  return handlePaymentRequest(event, _context, false);
}

/**
 * Handle /settle endpoint - on-chain execution
 */
export async function handleSettle(
  event: ScalewayEvent,
  _context: ScalewayContext,
): Promise<ScalewayResponse> {
  return handlePaymentRequest(event, _context, true);
}

/**
 * Handle /supported endpoint - capability discovery
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function handleSupported(
  event: ScalewayEvent,
  _context: ScalewayContext,
): Promise<ScalewayResponse> {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed. Use GET." }),
    };
  }

  const capabilities = getSupportedCapabilities();
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(capabilities),
  };
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function handleOpenApiSpec(
  event: ScalewayEvent,
  _context: ScalewayContext,
): Promise<ScalewayResponse> {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed. Use GET." }),
    };
  }

  // No live values to patch in, unlike scw_js's openapi.json: /supported is already the
  // live source of truth for the fee amount and recommended approval, so this document
  // only ever describes shape. structuredClone still guards against any future caller
  // mutating the shared import.
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(structuredClone(openapiSpec)),
  };
}

/**
 * Unified handler for verify and settle endpoints
 */
async function handlePaymentRequest(
  event: ScalewayEvent,
  _context: ScalewayContext,
  isSettle: boolean,
): Promise<ScalewayResponse> {
  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  // Only accept POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  // Two distinct failures, two distinct messages. Scaleway hands us either a raw string or an
  // already-parsed object, and only the string path can fail at JSON.parse.
  let rawBody: unknown;
  if (typeof event.body === "string") {
    try {
      rawBody = JSON.parse(event.body);
    } catch (error) {
      logger.error({ err: error }, "Failed to parse request body");
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
      };
    }
  } else {
    rawBody = event.body;
  }

  // Validate against the schema this service publishes as its contract, rather than the shallow
  // truthiness check that used to stand here — until now `PaymentRequestSchema` generated the
  // OpenAPI document and nothing else, so the published request shape was a claim no code checked.
  //
  // It requires `paymentPayload.accepted`, and so does @x402/core: its own PaymentPayload type
  // declares `accepted: PaymentRequirements` with no `?`, while `resource` and `extensions` are
  // optional. It is load-bearing here too — x402_settle.ts derives isBatchSettlement from
  // accepted.scheme, and x402_verify.ts reads asset/network/payTo off it. A payload without it
  // cannot be settled, so a 400 is the accurate answer; it previously reached the SDK and came
  // back isValid:false, which called a malformed request an invalid payment.
  const validation = PaymentRequestSchema.safeParse(rawBody);
  if (!validation.success) {
    logger.warn({ issues: validation.error.issues }, "Rejected malformed payment request");
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Request must include both paymentPayload and paymentRequirements",
      }),
    };
  }

  // GUARD ONLY — validation.data is deliberately discarded. safeParse on a looseObject returns a
  // deep CLONE, and verifyPayment/settlePayment cast the payload to Record<string, unknown> and
  // read arbitrary keys off it (x402_verify.ts, x402_settle.ts). Forwarding the clone would work
  // today but silently change what they see the moment this schema gains a transform, a coercion
  // or a default. The cast is safe precisely because safeParse just proved the shape, and a loose
  // schema means the original carries a superset of the parsed value's keys.
  const { paymentPayload, paymentRequirements } = rawBody as PaymentRequestBody;

  logger.info(
    {
      endpoint: isSettle ? "settle" : "verify",
      network: paymentPayload.accepted?.network,
      amount: paymentRequirements.amount,
      scheme: paymentPayload.accepted?.scheme,
    },
    "Processing request",
  );

  try {
    // Handle /settle endpoint
    if (isSettle) {
      const result = await settlePayment(paymentPayload, paymentRequirements);

      if (result.success) {
        logger.info(
          { payer: result.payer, transaction: result.transaction },
          "Settlement successful",
        );
        const responseBody: SettleResponseBody = {
          success: true,
          payer: result.payer,
          transaction: result.transaction,
          network: result.network,
        };
        if (result.fee) {
          responseBody.fee = result.fee;
        }
        if (result.extensions) {
          responseBody.extensions = result.extensions;
        }
        if (result.extra) {
          responseBody.extra = result.extra;
        }
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify(responseBody),
        };
      } else {
        logger.warn(
          {
            errorReason: result.errorReason,
            // Underlying SDK detail (e.g. the decoded revert reason). Logged only —
            // deliberately omitted from the response body below, which returns the
            // stable `errorReason` code instead. See SettleResult.errorMessage.
            errorMessage: result.errorMessage,
            payer: result.payer,
          },
          "Settlement failed",
        );

        const failureBody: SettleResponseBody = {
          success: false,
          errorReason: result.errorReason,
          payer: result.payer,
          transaction: "",
          network: result.network,
        };
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify(failureBody),
        };
      }
    }

    // Handle /verify endpoint
    const result = await verifyPayment(paymentPayload, paymentRequirements);

    if (result.isValid) {
      logger.info({ payer: result.payer }, "Payment verification successful");
      const responseBody: VerifyResponseBody = {
        isValid: true,
        payer: result.payer,
        // Early warning for the seller: how many more settlements their current USDC
        // approval covers. Omitted when there is no fee or it could not be read.
        ...(result.remainingSettlements !== undefined && {
          remainingSettlements: result.remainingSettlements,
        }),
      };
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(responseBody),
      };
    } else {
      logger.warn(
        {
          invalidReason: result.invalidReason,
          payer: result.payer,
        },
        "Payment verification failed",
      );

      const responseBody: VerifyResponseBody = {
        isValid: false,
        invalidReason: result.invalidReason,
        payer: result.payer,
      };
      return {
        statusCode: 200, // Still return 200, but with isValid: false
        headers: CORS_HEADERS,
        body: JSON.stringify(responseBody),
      };
    }
  } catch (error) {
    logger.error({ err: error }, "Unexpected error in handler");
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Internal server error",
        [isSettle ? "success" : "isValid"]: false,
        [isSettle ? "errorReason" : "invalidReason"]: isSettle
          ? "unexpected_settlement_error"
          : "unexpected_verify_error",
      }),
    };
  }
}

/**
 * Local development server with routing
 * This simulates the separate Scaleway Functions deployment locally
 */
export async function handle(
  event: ScalewayEvent,
  context: ScalewayContext,
): Promise<ScalewayResponse> {
  const path = event.path || event.rawUrl || "";

  if (path.includes("/openapi.json")) {
    return handleOpenApiSpec(event, context);
  }
  if (path.includes("/supported")) {
    return handleSupported(event, context);
  }
  if (path.includes("/settle")) {
    return handleSettle(event, context);
  }
  if (path.includes("/verify")) {
    return handleVerify(event, context);
  }

  // Only the literal root ("/") — NOT the empty string. A real root request (browser,
  // curl, an agent probing the domain) always carries path "/"; an event with neither
  // `path` nor `rawUrl` set is a malformed/absent-info request, which stays a 404 below.
  if (path === "/") {
    const accept = getHeader(event.headers, "Accept") ?? "";
    if (accept.includes("text/html")) {
      // A human followed a link (e.g. from a facilitator listing) — send them to the
      // docs instead of a JSON error object.
      return {
        statusCode: 302,
        headers: { ...CORS_HEADERS, Location: DOCUMENTATION_URL },
        body: "",
      };
    }
    // No Accept: text/html — an agent, curl, or a machine client. Give it an onward
    // path rather than nothing to act on.
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        service: "x402 facilitator",
        documentation: DOCUMENTATION_URL,
        supported: "/supported",
        openapi: "/openapi.json",
        endpoints: ["/verify", "/settle", "/supported", "/openapi.json"],
      }),
    };
  }

  // Default 404
  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      error: "Endpoint not found. Use /verify, /settle, or /supported",
    }),
  };
}

/* This is used to test locally and will not be executed on Scaleway Functions */
if (process.env.NODE_ENV === "test") {
  (async () => {
    const dotenvModule = await import("dotenv");
    dotenvModule.config();

    const scw_fnc_node = await import("@scaleway/serverless-functions");
    // The local dev server's Handler type models Scaleway's raw Lambda-style event
    // (headers: Record<string, unknown> | null), which is narrower than our
    // ScalewayEvent — this cast is a dev-only harness boundary, not a real runtime risk.
    scw_fnc_node.serveHandler(handle as Parameters<typeof scw_fnc_node.serveHandler>[0], 8080);

    logger.info("🚀 Local server started at http://localhost:8080");
    logger.info("   POST http://localhost:8080/verify");
    logger.info("   POST http://localhost:8080/settle");
    logger.info("   GET  http://localhost:8080/supported");
  })().catch((err: Error) => logger.error({ err }, "Error starting local server"));
}
