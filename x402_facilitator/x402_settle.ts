/**
 * x402 v2 Facilitator - Settlement Logic
 * Uses centralized x402Facilitator instance
 * Includes post-settlement fee collection for non-whitelisted merchants
 */

import { getFacilitator } from "./facilitator_instance.js";
import { verifyPayment } from "./x402_verify.js";
import { collectFee } from "./x402_fee.js";
import type { Address } from "viem";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

export interface SettleResult {
  success: boolean;
  payer?: string;
  transaction?: string;
  network?: string;
  errorReason?: string;
  /** Fee collection info (only for non-whitelisted merchants) */
  fee?: {
    collected: boolean;
    txHash?: string;
    error?: string;
  };
}

/**
 * Settle a payment by executing transferWithAuthorization on-chain.
 * If the recipient is not whitelisted (fee required), collect fee after successful settlement.
 */
export async function settlePayment(
  paymentPayload: Record<string, unknown>,
  paymentRequirements: Record<string, unknown>,
): Promise<SettleResult> {
  try {
    // First verify the payment (includes whitelist/fee allowance check)
    logger.info("Verifying payment before settlement");
    const verifyResult = await verifyPayment(paymentPayload, paymentRequirements);

    const accepted = paymentPayload.accepted as Record<string, unknown> | undefined;

    if (!verifyResult.isValid) {
      logger.warn({ invalidReason: verifyResult.invalidReason }, "Payment verification failed");
      return {
        success: false,
        errorReason: verifyResult.invalidReason,
        payer: verifyResult.payer,
        transaction: "",
        network: accepted?.network as string,
      };
    }

    // Execute settlement via x402 Facilitator
    const facilitator = getFacilitator();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await facilitator.settle(paymentPayload as any, paymentRequirements as any);

    if (!result.success) {
      logger.warn({ errorReason: result.errorReason }, "Settlement failed");
      return {
        success: false,
        errorReason: result.errorReason,
        payer: verifyResult.payer,
        transaction: "",
        network: accepted?.network as string,
      };
    }

    logger.info(
      { hash: result.transaction, network: accepted?.network },
      "Transaction confirmed",
    );

    // Settlement succeeded — check if fee collection is needed
    const feeRequired = verifyResult.feeRequired;
    const recipient = verifyResult.recipient;
    const network = accepted?.network as string | undefined;

    if (feeRequired && recipient && network) {
      // Post-settlement fee collection
      logger.info(
        { recipient, network },
        "Settlement succeeded, collecting fee from non-whitelisted merchant",
      );

      const feeResult = await collectFee(recipient as Address, network);

      if (feeResult.success) {
        logger.info(
          { recipient, network, feeTxHash: feeResult.txHash },
          "Fee collected successfully after settlement",
        );
      } else {
        // Fee collection failed — settlement still succeeded!
        // Log warning but don't fail the response
        logger.warn(
          { recipient, network, feeError: feeResult.error },
          "Fee collection failed after successful settlement — flagging for retry",
        );
      }

      return {
        success: true,
        payer: verifyResult.payer,
        transaction: result.transaction,
        network: accepted?.network as string,
        fee: {
          collected: feeResult.success,
          txHash: feeResult.txHash,
          error: feeResult.error,
        },
      };
    }

    // Whitelisted recipient — no fee needed
    return {
      success: true,
      payer: verifyResult.payer,
      transaction: result.transaction,
      network: accepted?.network as string,
    };
  } catch (error) {
    const err = error as Error;
    logger.error({ err }, "Settlement failed");

    // Try to extract meaningful error reason
    let errorReason = "settlement_failed";
    if (err.message?.includes("insufficient")) {
      errorReason = "insufficient_funds";
    } else if (err.message?.includes("nonce")) {
      errorReason = "authorization_already_used";
    } else if (err.message?.includes("expired")) {
      errorReason = "authorization_expired";
    }

    const payload = paymentPayload.payload as Record<string, unknown> | undefined;
    const authorization = payload?.authorization as Record<string, unknown> | undefined;
    const accepted = paymentPayload.accepted as Record<string, unknown> | undefined;

    return {
      success: false,
      errorReason,
      payer: authorization?.from as string | undefined,
      transaction: "",
      network: accepted?.network as string | undefined,
    };
  }
}
