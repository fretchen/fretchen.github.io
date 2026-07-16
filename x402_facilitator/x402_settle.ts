/**
 * x402 v2 Facilitator - Settlement Logic
 * Uses centralized x402Facilitator instance
 * Includes post-settlement fee collection
 */

import { getFacilitator } from "./facilitator_instance";
import { verifyPayment } from "./x402_verify";
import { collectFee, getFeeAmount } from "./x402_fee";
import { getChainConfig } from "./chain_utils";
import { isRecipientWhitelisted } from "./x402_whitelist";
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
  /** Scheme-specific extras passed through from the facilitator (e.g. batch-settlement's channelState) */
  extra?: Record<string, unknown>;
}

/**
 * Derive the receiver(s) a batch-settlement claim/settle command would actually pay out to.
 *
 * These are read straight from the payload because that is what the SDK acts on:
 * `executeSettle()` takes its target from `payload.receiver`, and
 * `executeClaimWithSignature()` builds its claim args solely from `payload.claims` —
 * neither reads `paymentRequirements.payTo`.
 *
 * Returns null when the payload carries no usable receiver, so the caller rejects rather
 * than relaying an unauthorized command.
 */
function getBatchSettlementReceivers(payload: Record<string, unknown> | undefined): string[] | null {
  if (payload?.type === "settle") {
    const receiver = payload?.receiver as string | undefined;
    return receiver ? [receiver] : null;
  }

  // "claim": one claimWithSignature() call settles the whole batch atomically, so EVERY
  // claim's receiver must be whitelisted — checking only the first would let a single
  // non-whitelisted entry ride along inside an otherwise-legitimate batch.
  const claims = payload?.claims as
    | Array<{ voucher?: { channel?: { receiver?: string } } }>
    | undefined;
  if (!Array.isArray(claims) || claims.length === 0) {
    return null;
  }
  const receivers = claims.map((claim) => claim?.voucher?.channel?.receiver);
  if (receivers.some((receiver) => !receiver)) {
    return null;
  }
  return receivers as string[];
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
      // Claim/settle payloads never reach verifyPayment()/onAfterVerify() (see the
      // comment above), so this is the only gate they ever pass through. Without it,
      // anyone with a valid (self-managed) channel could get the facilitator to relay
      // claim/settle transactions at its own gas expense, for free — batch-settlement
      // has no fee to fall back on the way the exact scheme does.
      //
      // BOTH gate inputs must come from what the SDK actually executes on, never from
      // the client's `accepted` envelope or `paymentRequirements.payTo`:
      //  - receivers: `requirements.payTo` is bound to the channel's receiver only by
      //    validateChannelConfig(), which runs inside verify() — the very path this
      //    branch skips. On the settle path it is an unchecked, caller-supplied string.
      //  - network: verify() enforces `accepted.network === requirements.network`, but
      //    settle() does not, while executeClaimWithSignature()/executeSettle() both
      //    dispatch on `requirements.network`. Gating on `accepted.network` would let a
      //    caller claim a testnet (admitting BATCH_SETTLEMENT_TEST_WALLETS) while the
      //    transaction executes on mainnet.
      const network = paymentRequirements.network as string | undefined;
      const receivers = getBatchSettlementReceivers(payload);
      if (
        !network ||
        !receivers ||
        !receivers.every((receiver) => isRecipientWhitelisted(receiver, network))
      ) {
        logger.warn({ receivers, network }, "Batch-settlement recipient not whitelisted");
        return {
          success: false,
          errorReason: "recipient_not_whitelisted",
          transaction: "",
          network,
        };
      }

      const facilitator = getFacilitator();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      const result = await facilitator.settle(paymentPayload as any, paymentRequirements as any);
      const claims = payload?.claims as
        | Array<{ voucher?: { channel?: { payer?: string } } }>
        | undefined;
      const payer = claims?.[0]?.voucher?.channel?.payer;

      if (!result.success) {
        logger.warn({ errorReason: result.errorReason }, "Batch-settlement claim/settle failed");
        return { success: false, errorReason: result.errorReason, payer, transaction: "", network };
      }

      logger.info(
        { hash: result.transaction, network },
        "Batch-settlement claim/settle transaction confirmed",
      );
      // Fee-free — no fee collection for batch-settlement (see the fee guard below).
      return { success: true, payer, transaction: result.transaction, network, extra: result.extra };
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
        extra: result.extra,
      };
    }

    // No fee required (fee=0 or feeRequired not set) — this is the path batch-settlement
    // deposit/voucher payloads always take (feeRequired is forced false for them), so
    // result.extra (e.g. channelState.channelId) must be passed through here too.
    return {
      success: true,
      payer: verifyResult.payer,
      transaction: result.transaction,
      network: accepted?.network as string,
      extra: result.extra,
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
