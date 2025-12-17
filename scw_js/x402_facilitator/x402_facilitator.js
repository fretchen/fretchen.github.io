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
 * Handler function for the verify endpoint
 * @param {Object} event - The event object
 * @param {Object} _context - The invocation context
 * @returns {Promise<{body: string, statusCode: number, headers: Record<string, string>}>}
 */
export async function handle(event, _context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Determine endpoint from path
  const path = event.path || event.rawUrl || "";
  const isSupportedEndpoint = path.includes("/supported");

  // Handle GET /supported endpoint
  if (isSupportedEndpoint && event.httpMethod === "GET") {
    const capabilities = getSupportedCapabilities();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(capabilities),
    };
  }

  // Only accept POST requests for verify/settle
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: "Method not allowed. Use POST for /verify and /settle, or GET for /supported.",
      }),
    };
  }

  // Determine endpoint from path (for verify/settle)
  const isSettleEndpoint = path.includes("/settle");
  const isVerifyEndpoint = path.includes("/verify");

  if (!isSettleEndpoint && !isVerifyEndpoint) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Endpoint not found. Use /verify or /settle" }),
    };
  }

  let body;
  try {
    body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch (error) {
    logger.error({ err: error }, "Failed to parse request body");
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }

  // Validate request structure
  if (!body.paymentPayload || !body.paymentRequirements) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "Request must include both paymentPayload and paymentRequirements",
      }),
    };
  }

  const { paymentPayload, paymentRequirements } = body;

  logger.info(
    {
      endpoint: isSettleEndpoint ? "settle" : "verify",
      network: paymentPayload.accepted?.network,
      amount: paymentRequirements.amount,
      scheme: paymentPayload.accepted?.scheme,
    },
    "Processing request",
  );

  try {
    // Handle /settle endpoint
    if (isSettleEndpoint) {
      const result = await settlePayment(paymentPayload, paymentRequirements);

      if (result.success) {
        logger.info(
          { payer: result.payer, transaction: result.transaction },
          "Settlement successful",
        );
        return {
          statusCode: 200,
          headers,
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
          headers,
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
        headers,
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
        headers,
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
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        [isSettleEndpoint ? "success" : "isValid"]: false,
        [isSettleEndpoint ? "errorReason" : "invalidReason"]: isSettleEndpoint
          ? "unexpected_settlement_error"
          : "unexpected_verify_error",
      }),
    };
  }
}

/* This is used to test locally and will not be executed on Scaleway Functions */
if (process.env.NODE_ENV === "test") {
  (async () => {
    const dotenvModule = await import("dotenv");
    dotenvModule.config();

    const scw_fnc_node = await import("@scaleway/serverless-functions");
    scw_fnc_node.serveHandler(handle, 8080);

    logger.info("🚀 Local server started at http://localhost:8080");
    logger.info("Testing endpoint: POST http://localhost:8080");
  })().catch((err) => logger.error({ err }, "Error starting local server"));
}
