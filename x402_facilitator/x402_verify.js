// @ts-check

/**
 * x402 v2 Payment Verification Module
 * Uses centralized x402Facilitator instance
 */

import { getFacilitator } from "./facilitator_instance.js";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

/**
 * Verify payment authorization using x402 Facilitator
 * @param {Object} paymentPayload - Payment payload from client
 * @param {Object} paymentRequirements - Payment requirements from resource server
 * @returns {Promise<{isValid: boolean, invalidReason?: string, payer?: string, recipient?: string}>}
 */
export async function verifyPayment(paymentPayload, paymentRequirements) {
  try {
    const facilitator = getFacilitator();
    const result = await facilitator.verify(paymentPayload, paymentRequirements);

    if (result.isValid) {
      logger.info(
        {
          payer: result.payer,
          amount: paymentPayload.payload?.authorization?.value,
          network: paymentPayload.accepted?.network,
        },
        "Payment verification successful",
      );
    } else {
      logger.warn(
        { invalidReason: result.invalidReason, payer: result.payer },
        "Payment verification failed",
      );
    }

    return result;
  } catch (error) {
    logger.error(
      { err: error, message: error.message },
      "Unexpected error during payment verification",
    );
    return {
      isValid: false,
      invalidReason: "unexpected_verify_error",
    };
  }
}
