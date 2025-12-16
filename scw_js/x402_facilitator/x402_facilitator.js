// @ts-check

/**
 * x402 v2 Facilitator - Main Handler
 * Handles POST /verify endpoint for payment verification
 */

import { verifyPayment } from "./x402_verify.js";
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

  // Only accept POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
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
      network: paymentPayload.accepted?.network,
      amount: paymentRequirements.amount,
      scheme: paymentPayload.accepted?.scheme,
    },
    "Processing verification request",
  );

  try {
    // Verify the payment
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
    logger.error({ err: error }, "Unexpected error in verify handler");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        isValid: false,
        invalidReason: "unexpected_verify_error",
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
