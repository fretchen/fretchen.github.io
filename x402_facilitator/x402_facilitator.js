// @ts-check

/**
 * x402 v2 Facilitator - Main Handler
 * Handles POST /verify and POST /settle endpoints
 */

import { verifyPayment } from "./x402_verify.js";
import { settlePayment } from "./x402_settle.js";
import { getSupportedCapabilities } from "./x402_supported.js";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

/**
 * Common headers for all responses
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "*",
  "Content-Type": "application/json",
};

/**
 * Handle /verify endpoint - off-chain verification
 */
export async function handleVerify(event, _context) {
  return handlePaymentRequest(event, _context, false);
}

/**
 * Handle /settle endpoint - on-chain execution
 */
export async function handleSettle(event, _context) {
  return handlePaymentRequest(event, _context, true);
}

/**
 * Handle /supported endpoint - capability discovery
 */
export async function handleSupported(event, _context) {
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

/**
 * Unified handler for verify and settle endpoints
 * @param {Object} event - The event object
 * @param {Object} _context - The invocation context
 * @param {boolean} isSettle - Whether this is a settle request
 * @returns {Promise<{body: string, statusCode: number, headers: Record<string, string>}>}
 */
async function handlePaymentRequest(event, _context, isSettle) {
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

  let body;
  try {
    body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch (error) {
    logger.error({ err: error }, "Failed to parse request body");
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }

  // Validate request structure
  if (!body.paymentPayload || !body.paymentRequirements) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Request must include both paymentPayload and paymentRequirements",
      }),
    };
  }

  const { paymentPayload, paymentRequirements } = body;

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
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: true,
            payer: result.payer,
            transaction: result.transaction,
            network: result.network,
          }),
        };
      } else {
        logger.warn(
          {
            errorReason: result.errorReason,
            payer: result.payer,
          },
          "Settlement failed",
        );

        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: false,
            errorReason: result.errorReason,
            payer: result.payer,
            transaction: "",
            network: result.network,
          }),
        };
      }
    }

    // Handle /verify endpoint
    const result = await verifyPayment(paymentPayload, paymentRequirements);

    if (result.isValid) {
      logger.info({ payer: result.payer }, "Payment verification successful");
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          isValid: true,
          payer: result.payer,
        }),
      };
    } else {
      logger.warn(
        {
          invalidReason: result.invalidReason,
          payer: result.payer,
        },
        "Payment verification failed",
      );

      return {
        statusCode: 200, // Still return 200, but with isValid: false
        headers: CORS_HEADERS,
        body: JSON.stringify({
          isValid: false,
          invalidReason: result.invalidReason,
          payer: result.payer,
        }),
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
export async function handle(event, context) {
  const path = event.path || event.rawUrl || "";

  if (path.includes("/supported")) {
    return handleSupported(event, context);
  }
  if (path.includes("/settle")) {
    return handleSettle(event, context);
  }
  if (path.includes("/verify")) {
    return handleVerify(event, context);
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
    scw_fnc_node.serveHandler(handle, 8080);

    logger.info("🚀 Local server started at http://localhost:8080");
    logger.info("   POST http://localhost:8080/verify");
    logger.info("   POST http://localhost:8080/settle");
    logger.info("   GET  http://localhost:8080/supported");
  })().catch((err) => logger.error({ err }, "Error starting local server"));
}
