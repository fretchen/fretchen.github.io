// @ts-check

/**
 * x402 Splitter Facilitator - Main Handler
 * Handles /verify, /settle, /supported endpoints
 *
 * No whitelist - public facilitator with fixed fee
 */

import { verifySplitterPayment } from "./x402_splitter_verify.js";
import { settleSplitterPayment } from "./x402_splitter_settle.js";
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
  // Handle CORS preflight
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

  // Parse request body
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
      endpoint: "verify",
      network: paymentPayload.accepted?.network,
      amount: paymentPayload.payload?.authorization?.value,
      scheme: paymentPayload.accepted?.scheme,
    },
    "Processing verify request",
  );

  try {
    const result = await verifySplitterPayment(paymentPayload, paymentRequirements);

    if (result.isValid) {
      logger.info({ payer: result.payer }, "Payment verification successful (no whitelist)");
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
    logger.error({ err: error, message: error.message }, "Unexpected error in verify handler");
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Internal server error",
        isValid: false,
        invalidReason: "unexpected_verify_error",
      }),
    };
  }
}

/**
 * Handle /settle endpoint - on-chain execution
 */
export async function handleSettle(event, _context) {
  // Handle CORS preflight
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

  // Parse request body
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
      endpoint: "settle",
      network: paymentPayload.accepted?.network,
      amount: paymentPayload.payload?.authorization?.value,
      seller: paymentPayload.payload?.seller,
    },
    "Processing settlement request",
  );

  try {
    const result = await settleSplitterPayment(paymentPayload, paymentRequirements);

    if (result.success) {
      logger.info(
        {
          transaction: result.transaction,
          payer: result.payer,
          network: result.network,
        },
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
          network: result.network,
        },
        "Settlement failed",
      );

      return {
        statusCode: 200, // Still return 200, but with success: false
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          errorReason: result.errorReason,
          payer: result.payer,
          transaction: result.transaction || "",
          network: result.network,
        }),
      };
    }
  } catch (error) {
    logger.error({ err: error, message: error.message }, "Unexpected error in settle handler");
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Internal server error",
        success: false,
        errorReason: "unexpected_settle_error",
      }),
    };
  }
}

/**
 * Handle /supported endpoint - capability discovery
 * TODO: Implement capability discovery
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

  return {
    statusCode: 501,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      error: "Supported endpoint not yet implemented",
    }),
  };
}

/**
 * Main handler with routing
 * Routes requests to /verify, /settle, /supported endpoints
 */
export async function handle(event, context) {
  const path = event.path || event.rawUrl || "";

  logger.debug({ path, method: event.httpMethod }, "Incoming request");

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

/**
 * Local development server for testing
 * Start with: NODE_ENV=test node x402_splitter_facilitator.js
 */
if (process.env.NODE_ENV === "test") {
  (async () => {
    const dotenvModule = await import("dotenv");
    dotenvModule.config();

    const scw_fnc_node = await import("@scaleway/serverless-functions");
    scw_fnc_node.serveHandler(handle, 8081); // Different port from main facilitator

    logger.info("🚀 Splitter Facilitator local server started at http://localhost:8081");
    logger.info("   POST http://localhost:8081/verify");
    logger.info("   POST http://localhost:8081/settle");
    logger.info("   GET  http://localhost:8081/supported (not yet implemented)");
  })().catch((err) => logger.error({ err }, "Error starting local server"));
}
