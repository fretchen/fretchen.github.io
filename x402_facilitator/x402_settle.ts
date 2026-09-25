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
// The SDK's own dispatch predicates. Imported rather than reimplemented so this file's
// notion of "what will this payload do on-chain" cannot drift from the SDK's — drift
// between the two is exactly what the enriched-refund bypass was.
import {
  isBatchSettlementClaimPayload,
  isBatchSettlementEnrichedRefundPayload,
  isBatchSettlementSettlePayload,
} from "@x402/evm";
import type { Address } from "viem";
import type { z } from "zod";
import type { FeeStatusSchema, FacilitatorFeePaidSchema, SettleResponseBody } from "./x402_schemas";
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
 * The one `success: false` that is **not** a terminal failure.
 *
 * Added by @x402/evm 2.23 for every settle path (eip3009/permit2 for `exact` and `upto`, and
 * batch-settlement's settle/claim/deposit/refund): when the transaction has been **broadcast** but
 * waiting for its receipt fails — an RPC error, a timeout — the chain may still confirm it. Before
 * 2.23 that came back as a terminal failure, so a caller could conclude "settlement failed" about a
 * transaction that in fact succeeded, and retry it.
 *
 * What makes it recoverable is the `transaction` hash that comes with it, so the caller can
 * reconcile on chain before deciding anything. Which is precisely why the failure branches below
 * must stop hard-coding `transaction: ""`.
 *
 * Declared here rather than imported: neither `@x402/core` nor `@x402/evm` exports its constant
 * from a public entry point (it lives in an internal chunk in both), so the string is the contract.
 */
const SETTLEMENT_PENDING = "settlement_pending";

/**
 * Return the one value every entry shares, or null when any is missing or they differ.
 * Case-insensitive: addresses arrive in mixed EIP-55 checksum casing, so a raw string
 * comparison would reject a legitimate batch.
 */
function singleAddress(values: Array<string | undefined>): string | null {
  if (values.length === 0 || values.some((value) => !value)) {
    return null;
  }
  const unique = new Set(values.map((value) => value!.toLowerCase()));
  return unique.size === 1 ? values[0]! : null;
}

/**
 * Derive the single receiver a batch-settlement claim/settle command pays out to, and the
 * single token it pays out in — the token the fee is then charged in.
 *
 * Read straight from the payload because that is what the SDK acts on:
 * `executeSettle()` takes its target from `payload.receiver` and `payload.token`, and
 * `executeClaimWithSignature()` builds its claim args solely from `payload.claims` —
 * neither reads `paymentRequirements.payTo` or `.asset`.
 *
 * A channel is a (payer, receiver, token, …) tuple, so a claim batch is one seller
 * sweeping many of its own payer channels: many vouchers, **one** receiver. The contract
 * would structurally accept a batch spanning channels with different receivers, but this
 * facilitator charges one flat fee against one allowance, so such a batch would let one
 * seller's allowance pay for another seller's payout. Reject it instead — returning null
 * here makes the caller refuse the command. The same holds for tokens: one flat fee is
 * charged in one token, so a batch mixing USDC and EURC channels is refused too.
 *
 * Returns null when the payload carries no usable receiver or token, or when a claim batch
 * names more than one of either.
 */
function getBatchSettlementTarget(
  payload: Record<string, unknown> | undefined,
): { receiver: string; token: string } | null {
  if (payload?.type === "settle") {
    const receiver = payload?.receiver as string | undefined;
    const token = payload?.token as string | undefined;
    return receiver && token ? { receiver, token } : null;
  }

  const claims = payload?.claims as
    | Array<{ voucher?: { channel?: { receiver?: string; token?: string } } }>
    | undefined;
  if (!Array.isArray(claims)) {
    return null;
  }

  const receiver = singleAddress(claims.map((claim) => claim?.voucher?.channel?.receiver));
  const token = singleAddress(claims.map((claim) => claim?.voucher?.channel?.token));
  return receiver && token ? { receiver, token } : null;
}

/**
 * What a batch-settlement payload will actually do on-chain, and so whether it owes a fee.
 *
 * - `command`         — `claim`/`settle`. Skip verify (the SDK has no verify() branch for
 *                       them), gate, settle, charge.
 * - `claiming-refund` — a refund carrying claims. Verify first, then gate and charge it
 *                       exactly like a claim.
 * - `free`            — deposit, voucher, claim-less refund. These fund, sign or unwind a
 *                       channel without paying out to a receiver (FEE_MODEL_PLAN.md
 *                       Phase 3).
 * - `reject`          — malformed, or claims that do not belong to the verified channel.
 */
type BatchRoute =
  | { kind: "command"; feeRecipient: string; feeToken: string }
  | { kind: "claiming-refund"; feeRecipient: string; feeToken: string }
  | { kind: "free" }
  | { kind: "reject"; errorReason: string };

/**
 * Decide how a batch-settlement payload must be handled, keyed on the payload SHAPE the
 * SDK dispatches on — never on `payload.type` alone.
 *
 * Shape and label disagree for exactly one payload: an *enriched refund*, `type: "refund"`
 * carrying a non-empty `claims[]`. @x402/evm routes it to `executeRefundWithSignature()`,
 * which submits `multicall([claimWithSignature, refundWithSignature])` — the identical
 * on-chain payout a `type: "claim"` performs. Trusting the label let that shape skip the
 * allowance gate and the fee outright, so a caller could have its claims relayed for free
 * simply by relabelling them. **The fee follows the claim, not the label.**
 *
 * A claim-less refund stays free: it returns the payer's own escrow and pays out to no one.
 */
function classifyBatchSettlement(payload: Record<string, unknown> | undefined): BatchRoute {
  if (isBatchSettlementClaimPayload(payload) || isBatchSettlementSettlePayload(payload)) {
    const target = getBatchSettlementTarget(payload);
    return target
      ? { kind: "command", feeRecipient: target.receiver, feeToken: target.token }
      : { kind: "reject", errorReason: "invalid_batch_settlement_evm_payload_type" };
  }

  if (isBatchSettlementEnrichedRefundPayload(payload)) {
    const claims = (payload as Record<string, unknown>).claims;
    // The SDK's guards are shape-only (`"claims" in payload`), so a non-array `claims`
    // reaches here fully "narrowed". Treat it as malformed rather than as free.
    if (!Array.isArray(claims)) {
      return { kind: "reject", errorReason: "invalid_batch_settlement_evm_payload_type" };
    }
    if (claims.length === 0) {
      return { kind: "free" };
    }

    const claimsTarget = getBatchSettlementTarget(payload);
    if (!claimsTarget) {
      return { kind: "reject", errorReason: "invalid_batch_settlement_evm_payload_type" };
    }

    // verify() validates ONLY payload.voucher and payload.channelConfig (verifyVoucher →
    // validateChannelConfig, which is what pins channelConfig.receiver to
    // requirements.payTo). It never looks at payload.claims. So without this check a
    // caller could submit a perfectly valid refund for a channel it owns while smuggling
    // claims that pay out to arbitrary unrelated receivers, relayed by the facilitator's
    // hot wallet. Anchoring every claim to the one channel verify vouches for closes that.
    const channelConfig = (payload as Record<string, unknown>).channelConfig as
      | { receiver?: string; token?: string }
      | undefined;
    const channelReceiver = channelConfig?.receiver;
    if (!channelReceiver || channelReceiver.toLowerCase() !== claimsTarget.receiver.toLowerCase()) {
      return { kind: "reject", errorReason: "invalid_batch_settlement_evm_receiver_mismatch" };
    }
    // Same anchoring for the token: the fee is charged in it, so claims in a token other
    // than the verified channel's could otherwise pick which allowance pays.
    const channelToken = channelConfig?.token;
    if (!channelToken || channelToken.toLowerCase() !== claimsTarget.token.toLowerCase()) {
      return { kind: "reject", errorReason: "invalid_batch_settlement_evm_token_mismatch" };
    }

    // Take recipient and token from channelConfig, not from the claims: they are now proven
    // equal, and channelConfig is what verify() binds via computeChannelId.
    return { kind: "claiming-refund", feeRecipient: channelReceiver, feeToken: channelToken };
  }

  // Labelled a command but failed the shape guard above — e.g. a `settle` with no
  // `receiver`. Malformed, not free. The SDK's verify() has no branch for these types
  // either, so letting them fall through would settle nothing and surface a misleading
  // `unexpected_verify_error` instead of naming the real problem.
  //
  // This reads `payload.type`, but only to sharpen the error for a payload already
  // excluded from every paying path: it can reject, never admit, so it cannot become a
  // way to buy free passage with a label.
  const payloadType = payload?.type;
  if (payloadType === "claim" || payloadType === "settle") {
    return { kind: "reject", errorReason: "invalid_batch_settlement_evm_payload_type" };
  }

  return { kind: "free" };
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
  token: Address,
): Promise<{
  fee: NonNullable<SettleResult["fee"]>;
  extensions: SettleResult["extensions"];
}> {
  const feeAmount = getFeeAmount();
  const feeResult = await collectFee(recipient, network, token);
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
    // at 0.01 of a stablecoin the bookkeeping to recover it costs far more than the fee.
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
          asset: `${network}/erc20:${token}`,
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

    // Every batch-settlement fee decision is made here, once, from the payload's SHAPE.
    // The onAfterVerify hook deliberately forces feeRequired=false for this whole scheme
    // so it cannot become a second, label-based source of truth for the same question.
    const isBatchSettlement = accepted?.scheme === "batch-settlement";
    const route: BatchRoute = isBatchSettlement
      ? classifyBatchSettlement(payload)
      : { kind: "free" };

    if (route.kind === "reject") {
      logger.warn(
        { errorReason: route.errorReason, network: paymentRequirements.network },
        "Batch-settlement payload rejected before settlement",
      );
      return {
        success: false,
        errorReason: route.errorReason,
        transaction: "",
        network: paymentRequirements.network as string | undefined,
      };
    }

    // Batch-settlement "claim" and "settle" payloads are settlement COMMANDS, not
    // future payments to verify — the SDK's own scheme.verify() has no branch for
    // them at all (only deposit/voucher/refund are verifiable) and unconditionally
    // rejects them with invalid_batch_settlement_evm_payload_type. Skip the
    // verify-first gate for these two types and settle directly; the scheme's own
    // settle() does its own type-appropriate validation internally (e.g.
    // executeClaimWithSignature verifies the claimAuthorizerSignature and each
    // voucher signature on-chain before moving funds).
    //
    // An enriched refund does the same payout but IS verifiable, so it deliberately does
    // NOT come through here — it takes the verify-first path below, which is what pins
    // its channelConfig.receiver to requirements.payTo.
    if (route.kind === "command") {
      // Claim/settle payloads never reach verifyPayment()/onAfterVerify() (see the
      // comment above), so this is the only gate they ever pass through. These are the
      // two payload types that actually realize a payment ("usage"), so — unlike
      // deposit/voucher/refund, which are open and fee-free — they carry the same flat
      // fee `exact` charges, gated by the same allowance check (in the channel's token)
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
      // One seller per batch — see getBatchSettlementReceiver, applied by
      // classifyBatchSettlement. The fee is charged once against that seller's allowance,
      // same as `exact`.
      const feeRecipient = route.feeRecipient;

      if (!network) {
        logger.warn({ network }, "Batch-settlement claim/settle has no network to dispatch on");
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
        : await evaluateFeeGate(feeRecipient as Address, network, route.feeToken as Address);

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
        const pending = result.errorReason === SETTLEMENT_PENDING;
        logger.warn(
          {
            errorReason: result.errorReason,
            errorMessage: result.errorMessage,
            // Only meaningful when pending — a terminal failure never broadcast anything.
            ...(pending && { transaction: result.transaction, network }),
          },
          pending
            ? "Batch-settlement claim/settle broadcast but unconfirmed — reconcile on chain"
            : "Batch-settlement claim/settle failed",
        );
        return {
          success: false,
          errorReason: result.errorReason,
          errorMessage: result.errorMessage,
          payer,
          // Pass the broadcast hash through. Hard-coding "" here would throw away the one thing
          // that makes settlement_pending recoverable, leaving the caller unable to tell a
          // transaction that never happened from one that may already have confirmed.
          transaction: pending ? (result.transaction ?? "") : "",
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
      const { fee, extensions } = await collectAndReportFee(
        feeRecipient as Address,
        network,
        route.feeToken as Address,
      );

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

    // An enriched refund performs a claimWithSignature — the same payout `type: "claim"`
    // performs — so it owes the same fee and must clear the same allowance gate. verify()
    // has just pinned channelConfig.receiver to requirements.payTo, and
    // classifyBatchSettlement pinned every claim to that same receiver, so this recipient
    // is now a verified address rather than a caller-supplied string. Gate BEFORE
    // settling: the allowance is the merchant's authorization to be relayed at all, so it
    // has to hold before the facilitator's hot wallet spends any gas.
    const settleNetwork = paymentRequirements.network as string | undefined;
    let refundGate: FeeGateDecision | undefined;
    if (route.kind === "claiming-refund") {
      if (!settleNetwork) {
        logger.warn({}, "Claim-carrying refund has no network to dispatch on");
        return {
          success: false,
          errorReason: "invalid_batch_settlement_evm_payload_type",
          payer: verifyResult.payer,
          transaction: "",
          network: settleNetwork,
        };
      }

      // Same testnet test-wallet carve-out the claim/settle branch gets.
      refundGate = isTestWalletBypassed(route.feeRecipient, settleNetwork)
        ? { kind: "no_fee" }
        : await evaluateFeeGate(
            route.feeRecipient as Address,
            settleNetwork,
            route.feeToken as Address,
          );

      if (refundGate.kind === "reject") {
        return {
          success: false,
          errorReason: refundGate.reason,
          payer: verifyResult.payer,
          transaction: "",
          network: settleNetwork,
        };
      }
    }

    // Execute settlement via x402 Facilitator
    const facilitator = getFacilitator();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const result = await facilitator.settle(paymentPayload as any, paymentRequirements as any);

    if (!result.success) {
      const pending = result.errorReason === SETTLEMENT_PENDING;
      logger.warn(
        {
          errorReason: result.errorReason,
          errorMessage: result.errorMessage,
          ...(pending && { transaction: result.transaction, network: accepted?.network }),
        },
        pending ? "Settlement broadcast but unconfirmed — reconcile on chain" : "Settlement failed",
      );
      return {
        success: false,
        errorReason: result.errorReason,
        errorMessage: result.errorMessage,
        payer: verifyResult.payer,
        // See SETTLEMENT_PENDING: the hash is what the caller reconciles against.
        transaction: pending ? (result.transaction ?? "") : "",
        network: accepted?.network as string,
      };
    }

    logger.info({ hash: result.transaction, network: accepted?.network }, "Transaction confirmed");

    // Settlement succeeded — check if fee collection is needed. Two mutually exclusive
    // sources, never both:
    //  - batch-settlement: only a claim-carrying refund owes anything, decided by `route`
    //    above. Deposit/voucher/claim-less refunds fund, sign or unwind a channel and stay
    //    free.
    //  - exact: the onAfterVerify hook set feeRequired + recipient. The `!isBatchSettlement`
    //    guard keeps that arm off batch payloads entirely, so the two can never double-charge
    //    the same settlement even if the hook is later changed.
    //  The exact fee is charged in `paymentRequirements.asset`: the requirements verify just
    //  ran against, and the token the onAfterVerify gate checked the allowance of.
    const network = accepted?.network as string | undefined;
    const exactAsset = paymentRequirements.asset as string | undefined;
    const chargeable: { recipient: Address; network: string; token: Address } | undefined =
      route.kind === "claiming-refund" && refundGate?.kind === "charge" && settleNetwork
        ? {
            recipient: route.feeRecipient as Address,
            network: settleNetwork,
            token: route.feeToken as Address,
          }
        : verifyResult.feeRequired &&
            !isBatchSettlement &&
            verifyResult.recipient &&
            network &&
            exactAsset
          ? {
              recipient: verifyResult.recipient as Address,
              network,
              token: exactAsset as Address,
            }
          : undefined;

    if (chargeable) {
      logger.info(
        { recipient: chargeable.recipient, network: chargeable.network },
        "Settlement succeeded, collecting fee",
      );
      const { fee, extensions } = await collectAndReportFee(
        chargeable.recipient,
        chargeable.network,
        chargeable.token,
      );

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
    // Distinct phrase from the ordinary "Settlement failed" result below (a caller error,
    // returned rather than thrown) so an alert rule can page on this one without also firing
    // on every bad signature. The SDK returns transaction failures rather than throwing them
    // (see x402/evm's parseEip3009TransferError), so reaching this catch at all means
    // something outside the scheme's own validation broke — a hook abort, no scheme
    // registered, or getFacilitator() itself failing.
    logger.error({ err }, "Settlement threw");

    // Try to extract meaningful error reason. No "insufficient" → insufficient_funds branch:
    // that string also matches OUR wallet being out of gas ("insufficient funds for gas"),
    // which is not the caller's fault and must not be reported to them as such. It falls
    // through to the generic settlement_failed below instead.
    let errorReason = "settlement_failed";
    if (err.message?.includes("nonce")) {
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
