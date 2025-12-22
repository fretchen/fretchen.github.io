// @ts-check

/**
 * x402 v2 Facilitator - Settlement Logic
 * Uses centralized x402Facilitator instance
 */

import { getFacilitator } from "./facilitator_instance.js";
import { verifyPayment } from "./x402_verify.js";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

/**
 * Settle a payment by executing transferWithAuthorization on-chain
 * @param {Object} paymentPayload - The payment payload from the request
 * @param {Object} paymentRequirements - The payment requirements
 * @returns {Promise<{success: boolean, payer?: string, transaction?: string, network?: string, errorReason?: string}>}
 */
export async function settlePayment(paymentPayload, paymentRequirements) {
  try {
    // First verify the payment
    logger.info("Verifying payment before settlement");
    const verifyResult = await verifyPayment(paymentPayload, paymentRequirements);

    if (!verifyResult.isValid) {
      logger.warn({ invalidReason: verifyResult.invalidReason }, "Payment verification failed");
      return {
        success: false,
        errorReason: verifyResult.invalidReason,
        payer: verifyResult.payer,
        transaction: "",
        network: paymentPayload.accepted.network,
      };
    }

    // Use x402 Facilitator for settlement
    const facilitator = getFacilitator();
    const result = await facilitator.settle(paymentPayload, paymentRequirements);

    if (result.success) {
      logger.info({ hash: result.transaction, network: paymentPayload.accepted.network }, "Transaction confirmed");
      return {
        success: true,
        payer: verifyResult.payer,
        transaction: result.transaction,
        network: paymentPayload.accepted.network,
      };
    } else {
      logger.warn({ errorReason: result.errorReason }, "Settlement failed");
      return {
        success: false,
        errorReason: result.errorReason,
        payer: verifyResult.payer,
        transaction: "",
        network: paymentPayload.accepted.network,
      };
    }
  } catch (error) {
    logger.error({ err: error }, "Settlement failed");

    // Try to extract meaningful error reason
    let errorReason = "settlement_failed";
    if (error.message?.includes("insufficient")) {
      errorReason = "insufficient_funds";
    } else if (error.message?.includes("nonce")) {
      errorReason = "authorization_already_used";
    } else if (error.message?.includes("expired")) {
      errorReason = "authorization_expired";
    }

    return {
      success: false,
      errorReason,
      payer: paymentPayload.payload?.authorization?.from,
      transaction: "",
      network: paymentPayload.accepted?.network,
    };
  }
}
