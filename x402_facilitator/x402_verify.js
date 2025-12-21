// @ts-check

/**
 * x402 v2 Payment Verification Module
 * Uses x402/facilitator package + custom whitelist extension
 */

import { createPublicClient, http } from "viem";
import { verify as x402FacilitatorVerify } from "x402/facilitator";
import pino from "pino";
import { isAgentWhitelisted } from "./x402_whitelist.js";
import { getChain } from "./chain_utils.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

/**
 * Verify payment authorization using x402/facilitator + custom whitelist
 * @param {Object} paymentPayload - Payment payload from client
 * @param {Object} paymentRequirements - Payment requirements from resource server
 * @returns {Promise<{isValid: boolean, invalidReason?: string, payer?: string}>}
 */
export async function verifyPayment(paymentPayload, paymentRequirements) {
  try {
    // 1. CUSTOM EXTENSION: Early whitelist check (before expensive x402 operations)
    const network = paymentPayload.accepted?.network;
    const recipient = paymentPayload.payload?.authorization?.to;

    if (!network || !recipient) {
      logger.warn("Missing network or recipient in payment payload");
      return {
        isValid: false,
        invalidReason: "invalid_payload",
      };
    }

    // Check recipient whitelist (GenImNFTv4/LLMv1 NFT holders only)
    const whitelistCheck = await isAgentWhitelisted(recipient, network);
    if (!whitelistCheck.isWhitelisted) {
      logger.warn({ recipient, network }, "Payment verification failed: Recipient not whitelisted");
      return {
        isValid: false,
        invalidReason: "unauthorized_agent",
        recipient,
      };
    }

    logger.info(
      { recipient, network, source: whitelistCheck.source },
      "Recipient whitelist check passed",
    );

    // 2. Use x402/facilitator for standard verification
    const chain = getChain(network);
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const result = await x402FacilitatorVerify(
      publicClient,
      paymentPayload,
      paymentRequirements,
    );

    logger.info(
      {
        isValid: result.isValid,
        invalidReason: result.invalidReason,
        payer: result.payer,
      },
      "x402 facilitator verification result",
    );

    return result;
  } catch (error) {
    logger.error({ err: error }, "Unexpected error during payment verification");
    return {
      isValid: false,
      invalidReason: "unexpected_verify_error",
    };
  }
}
