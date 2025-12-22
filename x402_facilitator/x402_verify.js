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
    // 🔍 DEBUG: Log authorization types as received
    const auth = paymentPayload?.payload?.authorization;
    if (auth) {
      logger.info(
        {
          authTypes: {
            value: typeof auth.value,
            validAfter: typeof auth.validAfter,
            validBefore: typeof auth.validBefore,
          },
          authValues: {
            value: auth.value,
            validAfter: auth.validAfter,
            validBefore: auth.validBefore,
          },
        },
        "Authorization data received",
      );
    }

    // 🔍 DEBUG: Log what x402 will use for EIP-712 domain reconstruction
    logger.info(
      {
        extraName: paymentPayload?.accepted?.extra?.name,
        extraVersion: paymentPayload?.accepted?.extra?.version,
        asset: paymentPayload?.accepted?.asset,
        network: paymentPayload?.accepted?.network,
        payTo: paymentPayload?.accepted?.payTo,
      },
      "EIP-712 Domain reconstruction parameters",
    );

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
