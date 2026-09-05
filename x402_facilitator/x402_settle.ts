/**
 * x402 v2 Facilitator - Settlement Logic
 * Uses centralized x402Facilitator instance
 * Includes post-settlement fee collection
 */

import { getFacilitator } from "./facilitator_instance";
import { verifyPayment } from "./x402_verify";
import {
  collectFee,
  evaluateFeeGate,
  getFeeAmount,
  type FeeGateDecision,
  type FeeResult,
} from "./x402_fee";
import type { Address } from "viem";
import type { z } from "zod";
import type {
  FeeStatusSchema,
  FacilitatorFeePaidSchema,
  SettleResponseBody,
} from "./x402_schemas";
import { getChainConfig } from "./chain_utils";
import { isTestWalletBypassed } from "./x402_whitelist";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

/**
 * The wire shapes below are derived from the Zod schemas in `x402_schemas.ts`, which are
 * also what generate `openapi.json` — so the internal type, the published spec, and the
 * response the handler builds cannot drift apart. Do not restate these fields by hand.
 */

/** How this payment's fee stands once the settlement returns. */
export type FeeStatus = z.infer<typeof FeeStatusSchema>;

/** Facilitator fee receipt per x402 Fee Disclosure proposal (coinbase/x402#1016) */
export type FacilitatorFeePaid = z.infer<typeof FacilitatorFeePaidSchema>;

/**
 * The `/settle` response body, plus one field that never reaches the wire.
 *
 * `errorMessage` is the underlying failure detail from the SDK (e.g. the decoded EVM
 * revert reason behind a generic `errorReason` like `..._deposit_transaction_failed`).
 * **Logged, never returned over HTTP** — it is SDK-generated text that can embed
 * addresses and calldata, and callers get the stable `errorReason` code instead. Without
 * it the real cause is silently discarded, which has previously turned a one-line revert
 * into days of guessing. It is deliberately absent from `SettleResponseSchema`.
 */
export type SettleResult = SettleResponseBody & { errorMessage?: string };

/**
 * Derive the single receiver a batch-settlement claim/settle command pays out to.
 *
 * Read straight from the payload because that is what the SDK acts on:
 * `executeSettle()` takes its target from `payload.receiver`, and
 * `executeClaimWithSignature()` builds its claim args solely from `payload.claims` —
 * neither reads `paymentRequirements.payTo`.
 *
 * A channel is a (payer, receiver, token, …) tuple, so a claim batch is one seller
 * sweeping many of its own payer channels: many vouchers, **one** receiver. The contract
 * would structurally accept a batch spanning channels with different receivers, but this
 * facilitator charges one flat fee against one allowance, so such a batch would let one
 * seller's allowance pay for another seller's payout. Reject it instead — returning null
 * here makes the caller refuse the command.
 *
 * Returns null when the payload carries no usable receiver, or when a claim batch names
 * more than one.
 */
function getBatchSettlementReceiver(payload: Record<string, unknown> | undefined): string | null {
  if (payload?.type === "settle") {
    return (payload?.receiver as string | undefined) ?? null;
  }

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

  // Compare case-insensitively: addresses arrive in mixed EIP-55 checksum casing, so a
  // raw string comparison would reject a legitimate single-seller batch.
  const unique = new Set(receivers.map((receiver) => receiver!.toLowerCase()));
  if (unique.size > 1) {
    return null;
  }
  return receivers[0]!;
}

/**
 * Settle a payment by executing transferWithAuthorization on-chain.
 * If fee is configured, collect fee after successful settlement.
 */
/**
 * Describe a fee collection outcome for the receipt.
 *
 * "pending" is distinct from "failed": the transfer was sent but its receipt wait timed
 * out (see FEE_RECEIPT_TIMEOUT_MS in x402_fee.ts), so it may still land. The tx hash is
 * returned alongside it, which is how the seller resolves it themselves.
 */
function feeStatusOf(result: FeeResult): FeeStatus {
  if (result.success) {
    return "collected";
  }
  return result.error === "fee_collection_pending" ? "pending" : "failed";
}

/**
 * Collect the flat fee after a successful settlement and build the #1016 receipt.
 * Shared by the `exact` branch and the batch-settlement `claim`/`settle` branch — both
 * charge the identical flat fee, on-chain, immediately after their settlement lands.
 */
async function collectAndReportFee(
  recipient: Address,
  network: string,
): Promise<{
  fee: NonNullable<SettleResult["fee"]>;
  extensions: SettleResult["extensions"];
}> {
  const feeAmount = getFeeAmount();
  const feeResult = await collectFee(recipient, network);
  const feeStatus = feeStatusOf(feeResult);

  if (feeStatus === "collected") {
    logger.info(
      { recipient, network, feeTxHash: feeResult.txHash },
      "Fee collected successfully after settlement",
    );
  } else if (feeStatus === "pending") {
    // Fee tx was sent but not confirmed within its bounded wait. It may still land,
    // so this is not a failure — it is an unknown outcome carrying a tx hash, which
    // is returned in the receipt so the seller can resolve it themselves.
    logger.warn(
      { recipient, network, feeTxHash: feeResult.txHash },
      "Fee tx pending at response time — outcome unknown",
    );
  } else {
    // Fee collection failed — settlement still succeeded. The fee is not retried:
    // at 0.01 USDC the bookkeeping to recover it costs far more than the fee.
    logger.warn(
      { recipient, network, feeError: feeResult.error },
      "Fee collection failed after successful settlement",
    );
  }

  // `facilitatorFeePaid` always reports the fee ASSESSED for this payment, never a
  // collection outcome. Zeroing it because collection failed would understate what
  // the payment actually cost and make the facilitator look cheaper than it is — the
  // worse distortion for a transparency extension. The outcome lives in
  // `collection.status` instead.
  const chainConfig = getChainConfig(network);
  return {
    fee: {
      collected: feeStatus === "collected",
      status: feeStatus,
      txHash: feeResult.txHash,
      error: feeResult.error,
    },
    extensions: {
      facilitatorFees: {
        info: {
          version: "1",
          facilitatorFeePaid: feeAmount.toString(),
          asset: `${network}/erc20:${chainConfig.USDC_ADDRESS}`,
          model: "flat",
          collection: {
            status: feeStatus,
            ...(feeResult.txHash && { txHash: feeResult.txHash }),
          },
        },
      },
    },
  };
}

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
      // comment above), so this is the only gate they ever pass through. These are the
      // two payload types that actually realize a payment ("usage"), so — unlike
      // deposit/voucher/refund, which are open and fee-free — they carry the same flat
      // fee `exact` charges, gated by the same USDC allowance check
      // (FEE_MODEL_PLAN.md Phase 3).
      //
      // The gate input must come from what the SDK actually executes on, never from
      // the client's `accepted` envelope or `paymentRequirements.payTo`:
      //  - `requirements.payTo` is bound to the channel's receiver only by
      //    validateChannelConfig(), which runs inside verify() — the very path this
      //    branch skips. On the settle path it is an unchecked, caller-supplied string.
      //  - network: verify() enforces `accepted.network === requirements.network`, but
      //    settle() does not, while executeClaimWithSignature()/executeSettle() both
      //    dispatch on `requirements.network`. Gating on `accepted.network` would let a
      //    caller claim a testnet (admitting BATCH_SETTLEMENT_TEST_WALLETS) while the
      //    transaction executes on mainnet.
      const network = paymentRequirements.network as string | undefined;
      // One seller per batch — see getBatchSettlementReceiver. The fee is charged once
      // against that seller's allowance, same as `exact`.
      const feeRecipient = getBatchSettlementReceiver(payload);

      if (!network || !feeRecipient) {
        logger.warn(
          { network },
          "Batch-settlement claim/settle has no single usable receiver — missing, or a batch spanning several",
        );
        return {
          success: false,
          errorReason: "invalid_batch_settlement_evm_payload_type",
          transaction: "",
          network,
        };
      }

      // A testnet test wallet skips the gate entirely (CI/local dev convenience); it then
      // takes the same no-receipt path fees-disabled does.
      const gate: FeeGateDecision = isTestWalletBypassed(feeRecipient, network)
        ? { kind: "no_fee" }
        : await evaluateFeeGate(feeRecipient as Address, network);

      if (gate.kind === "reject") {
        return {
          success: false,
          errorReason: gate.reason,
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
        logger.warn(
          { errorReason: result.errorReason, errorMessage: result.errorMessage },
          "Batch-settlement claim/settle failed",
        );
        return {
          success: false,
          errorReason: result.errorReason,
          errorMessage: result.errorMessage,
          payer,
          transaction: "",
          network,
        };
      }

      logger.info(
        { hash: result.transaction, network },
        "Batch-settlement claim/settle transaction confirmed",
      );

      if (gate.kind === "no_fee") {
        // Fees disabled, or a testnet test wallet. Attach no fee receipt — `fee` and
        // `extensions.facilitatorFees` are documented as present only when a fee is
        // configured, and `exact` omits them under the same conditions.
        return {
          success: true,
          payer,
          transaction: result.transaction,
          network,
          extra: result.extra,
        };
      }

      logger.info({ feeRecipient, network }, "Settlement succeeded, collecting fee");
      const { fee, extensions } = await collectAndReportFee(feeRecipient as Address, network);

      return {
        success: true,
        payer,
        transaction: result.transaction,
        network,
        fee,
        extensions,
        extra: result.extra,
      };
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
      logger.warn(
        { errorReason: result.errorReason, errorMessage: result.errorMessage },
        "Settlement failed",
      );
      return {
        success: false,
        errorReason: result.errorReason,
        errorMessage: result.errorMessage,
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
      logger.info({ recipient, network }, "Settlement succeeded, collecting fee");
      const { fee, extensions } = await collectAndReportFee(recipient as Address, network);

      return {
        success: true,
        payer: verifyResult.payer,
        transaction: result.transaction,
        network: accepted?.network as string,
        fee,
        extensions,
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
    // EIP-3009 shape only. Permit2 payloads (payer at permit2Authorization.from) are
    // rejected at verify time (permit2_not_supported), so they never reach settle.
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
