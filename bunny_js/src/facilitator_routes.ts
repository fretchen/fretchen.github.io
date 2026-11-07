/**
 * The facilitator's routing layer — a line-by-line native port of the Scaleway handler's
 * routing, CORS, root redirect, and verify/settle envelope semantics (x402_facilitator/
 * x402_facilitator.ts), against web-standard Request/Response — the `llm_routes.ts` shape.
 * Ordering rules and response envelopes are carried over unchanged: the same CORS headers,
 * the same 200-with-isValid:false verify semantics, the same 405/400/500 bodies, the same
 * Accept-header root redirect. Only the transport is new; the payment behavior is the ported
 * core's (../src/x402_verify.ts, ../src/x402_settle.ts), unmodified.
 */
import { verifyPayment } from "./x402_verify";
import { settlePayment } from "./x402_settle";
import { getSupportedCapabilities } from "./x402_supported";
import {
  PaymentRequestSchema,
  type SettleResponseBody,
  type VerifyResponseBody,
} from "./x402_schemas";
import type { z } from "zod";
import openapiSpec from "./openapi.facilitator.json" with { type: "json" };
import { logger } from "./logger";

/** Inferred from the published schema rather than hand-written beside it. `looseObject` keeps
 *  the index signatures, so the payload still satisfies verifyPayment/settlePayment's
 *  `Record<string, unknown>` parameters. */
type PaymentRequestBody = z.infer<typeof PaymentRequestSchema>;

/** Common headers for all responses — identical to the Scaleway handler's CORS_HEADERS. */
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

/** Human-facing documentation for the facilitator — the root path redirects browsers here. */
const DOCUMENTATION_URL = "https://www.fretchen.eu/x402/";

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: CORS_HEADERS,
  });

/**
 * Unified handler for the /verify and /settle endpoints (the Scaleway handler's
 * handlePaymentRequest, verbatim). A caller's fault is a 40x, ours is a 500; a settlement
 * that fails for any reason still answers 200 with success:false and the stable errorReason.
 */
async function handlePaymentRequest(req: Request, isSettle: boolean): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers: CORS_HEADERS });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed. Use POST." });
  }

  // Malformed JSON is the caller's fault, not ours — warn, not error: the alert-coverage
  // convention is that logger.error means "ours, and should page".
  let rawBody: unknown;
  try {
    rawBody = JSON.parse(await req.text());
  } catch (error) {
    logger.warn({ err: error }, "Failed to parse request body");
    return jsonResponse(400, { error: "Invalid JSON in request body" });
  }

  // Validate against the schema this service publishes, which generated the OpenAPI
  // document and nothing else. It requires `paymentPayload.accepted`, and so does @x402/core;
  // x402_settle.ts derives isBatchSettlement from accepted.scheme and x402_verify.ts reads
  // asset/network/payTo off it, so a payload without it cannot be settled. Such a payload
  // must not reach the SDK and come back isValid:false — that is a malformed request.
  const validation = PaymentRequestSchema.safeParse(rawBody);
  if (!validation.success) {
    logger.warn({ issues: validation.error.issues }, "Rejected malformed payment request");
    return jsonResponse(400, {
      error: "Request must include both paymentPayload and paymentRequirements",
    });
  }

  // GUARD ONLY — validation.data is discarded. safeParse on a looseObject returns a deep clone,
  // and verifyPayment/settlePayment read arbitrary keys off the payload; forwarding the clone
  // works today but breaks the moment this schema gains a transform, coercion or default.
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
        return jsonResponse(200, responseBody);
      }

      // Underlying SDK detail (e.g. the decoded revert reason) is logged only — deliberately
      // omitted from the response body below, which returns the stable `errorReason` code.
      logger.warn(
        {
          errorReason: result.errorReason,
          errorMessage: result.errorMessage,
          payer: result.payer,
        },
        "Settlement failed",
      );
      // transaction is forwarded, not blanked: settlePayment already returns "" for every
      // terminal failure and the broadcast hash for settlement_pending — the one failure a
      // caller can reconcile on chain instead of retrying a transaction that may have confirmed.
      const failureBody: SettleResponseBody = {
        success: false,
        errorReason: result.errorReason,
        payer: result.payer,
        transaction: result.transaction ?? "",
        network: result.network,
      };
      return jsonResponse(200, failureBody);
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
        // Must be forwarded, not summarised: the seller writes its cached channel record
        // straight from this, and a missing `extra` makes it cache zeros rather than leave
        // the record alone. See VerifyResponseSchema.extra. /settle already does this.
        ...(result.extra !== undefined && { extra: result.extra }),
      };
      return jsonResponse(200, responseBody);
    }

    logger.warn(
      {
        invalidReason: result.invalidReason,
        payer: result.payer,
      },
      "Payment verification failed",
    );

    return jsonResponse(200, {
      isValid: false, // Still return 200, but with isValid: false
      invalidReason: result.invalidReason,
      payer: result.payer,
    } satisfies VerifyResponseBody);
  } catch (error) {
    logger.error({ err: error }, "Unexpected error in handler");
    return jsonResponse(500, {
      error: "Internal server error",
      [isSettle ? "success" : "isValid"]: false,
      [isSettle ? "errorReason" : "invalidReason"]: isSettle
        ? "unexpected_settlement_error"
        : "unexpected_verify_error",
    });
  }
}

/** /supported — capability discovery (GET only; OPTIONS answering the preflight). */
export function handleSupportedRequest(req: Request): Response {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers: CORS_HEADERS });
  }
  if (req.method !== "GET") {
    return jsonResponse(405, { error: "Method not allowed. Use GET." });
  }
  return jsonResponse(200, getSupportedCapabilities());
}

/** /openapi.json — the published schema. No live values to patch in: /supported is already
 *  the live source of truth for the fee amount and recommended approval, so this document
 *  only ever describes shape. structuredClone guards against any future caller mutating the
 *  shared import. */
export function handleOpenApiSpecRequest(req: Request): Response {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers: CORS_HEADERS });
  }
  if (req.method !== "GET") {
    return jsonResponse(405, { error: "Method not allowed. Use GET." });
  }
  return jsonResponse(200, structuredClone(openapiSpec));
}

/**
 * The routing table — same order and same substring matching as the Scaleway handler's
 * path.includes() dispatch, so any path that routed there routes identically here.
 */
export async function handleFacilitatorRequest(req: Request): Promise<Response> {
  const path = new URL(req.url).pathname;

  if (path.includes("/openapi.json")) {
    return handleOpenApiSpecRequest(req);
  }
  if (path.includes("/supported")) {
    return handleSupportedRequest(req);
  }
  if (path.includes("/settle")) {
    return handlePaymentRequest(req, true);
  }
  if (path.includes("/verify")) {
    return handlePaymentRequest(req, false);
  }

  // Only the literal root ("/"). A human followed a link (e.g. from a facilitator
  // listing) — send them to the docs instead of a JSON error object; anything else
  // (an agent, curl, a machine client) gets an onward path, not nothing.
  if (path === "/") {
    if ((req.headers.get("Accept") ?? "").includes("text/html")) {
      return new Response("", {
        status: 302,
        headers: { ...CORS_HEADERS, Location: DOCUMENTATION_URL },
      });
    }
    return jsonResponse(200, {
      service: "x402 facilitator",
      documentation: DOCUMENTATION_URL,
      supported: "/supported",
      openapi: "/openapi.json",
      endpoints: ["/verify", "/settle", "/supported", "/openapi.json"],
    });
  }

  return jsonResponse(404, {
    error: "Endpoint not found. Use /verify, /settle, or /supported",
  });
}
