/**
 * x402 v2 Facilitator - Settlement Logic
 * Uses centralized x402Facilitator instance
 * Includes post-settlement fee collection
 */

import { getFacilitator } from "./facilitator_instance";
import { verifyPayment } from "./x402_verify";
import { collectFee, getFeeAmount } from "./x402_fee";
import { getChainConfig } from "./chain_utils";
import type { Address } from "viem";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

/** Facilitator fee receipt per x402 Fee Disclosure proposal (coinbase/x402#1016) */
export interface FacilitatorFeePaid {
  version: string;
  facilitatorFeePaid: string;
  asset: string;
  model: string;
}

export interface SettleResult {
  success: boolean;
  payer?: string;
  transaction?: string;
  network?: string;
  errorReason?: string;
  /** Fee collection info (present when fee is configured) */
  fee?: {
    collected: boolean;
    txHash?: string;
    error?: string;
  };
  /** x402 v2 extensions (facilitatorFees receipt per #1016 proposal) */
  extensions?: {
    facilitatorFees?: {
      info: FacilitatorFeePaid;
    };
  };
}

/**
 * Settle a payment by executing transferWithAuthorization on-chain.
 * If fee is configured, collect fee after successful settlement.
 */
export async function settlePayment(
  paymentPayload: Record<string, unknown>,
  paymentRequirements: Record<string, unknown>,
): Promise<SettleResult> {
  try {
    const accepted = paymentPayload.accepted as Record<string, unknown> | undefined;
    const payload = paymentPayload.payload as Record<string, unknown> | undefined;
    const payloadType = payload?.type as string | undefined;

    // Batch-settlement "claim" and "settle" payloads are settlement COMMANDS, not
    // future payments to verify — the SDK's own scheme.verify() has no branch for
    // them at all (only deposit/voucher/refund are verifiable) and unconditionally
    // rejects them with invalid_batch_settlement_evm_payload_type. Skip the
    // verify-first gate for these two types and settle directly; the scheme's own
    // settle() does its own type-appropriate validation internally (e.g.
    // executeClaimWithSignature verifies the claimAuthorizerSignature and each
    // voucher signature on-chain before moving funds).
    const isBatchSettlement = accepted?.scheme === "batch-settlement";
    if (isBatchSettlement && (payloadType === "claim" || payloadType === "settle")) {
      const facilitator = getFacilitator();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      const result = await facilitator.settle(paymentPayload as any, paymentRequirements as any);
      const claims = payload?.claims as
        | Array<{ voucher?: { channel?: { payer?: string } } }>
        | undefined;
      const payer = claims?.[0]?.voucher?.channel?.payer;
      const network = accepted?.network as string | undefined;

      if (!result.success) {
        logger.warn({ errorReason: result.errorReason }, "Batch-settlement claim/settle failed");
        return { success: false, errorReason: result.errorReason, payer, transaction: "", network };
      }

      logger.info(
        { hash: result.transaction, network },
        "Batch-settlement claim/settle transaction confirmed",
      );
      // Fee-free — no fee collection for batch-settlement (see the fee guard below).
      return { success: true, payer, transaction: result.transaction, network };
    }

    // First verify the payment (includes fee allowance check)
    logger.info("Verifying payment before settlement");
    const verifyResult = await verifyPayment(paymentPayload, paymentRequirements);

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
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

    logger.info({ hash: result.transaction, network: accepted?.network }, "Transaction confirmed");

    // Settlement succeeded — check if fee collection is needed.
    // Batch-settlement channels are fee-free: the post-settlement transferFrom fee
    // model is exact-scheme only. The onAfterVerify hook already sets feeRequired=false
    // for batch-settlement; this scheme guard makes that explicit and defensive.
    // (isBatchSettlement already computed above.)
    const feeRequired = verifyResult.feeRequired && !isBatchSettlement;
    const recipient = verifyResult.recipient;
    const network = accepted?.network as string | undefined;

    if (feeRequired && recipient && network) {
      // Post-settlement fee collection
      logger.info({ recipient, network }, "Settlement succeeded, collecting fee");

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

      // Build facilitatorFees receipt (per x402 Fee Disclosure proposal #1016)
      const feeAmountStr = getFeeAmount().toString();
      const chainConfig = getChainConfig(network);
      const facilitatorFeesExtension: SettleResult["extensions"] = {
        facilitatorFees: {
          info: {
            version: "1",
            facilitatorFeePaid: feeResult.success ? feeAmountStr : "0",
            asset: `${network}/erc20:${chainConfig.USDC_ADDRESS}`,
            model: "flat",
          },
        },
      };

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
        extensions: facilitatorFeesExtension,
      };
    }

    // No fee required (fee=0 or feeRequired not set)
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
