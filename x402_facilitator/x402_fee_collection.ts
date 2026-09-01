/**
 * x402 Facilitator Fee Collection Flow
 *
 * Ties the on-chain fee operations (`x402_fee.ts`) to the durable ledger
 * (`x402_fee_ledger.ts`) so that a fee is never lost and never collected twice.
 *
 * Every fee-bearing settlement runs, in this order:
 *   1. Reconcile any collection left pending by an earlier settlement.
 *   2. Accrue the fee owed for this payment.
 *   3. Sweep the seller's whole accrued balance in one transferFrom.
 *
 * The ordering is load-bearing: reconciling first settles the old debt before this
 * payment's fee is added, so the sweep total is right. Accrual happens before the
 * transfer so a crash mid-collection leaves the debt recorded rather than lost.
 */

import type { Address } from "viem";
import pino from "pino";
import { collectFee, getTransactionStatus, type FeeResult } from "./x402_fee";
import {
  getFeeLedger,
  accrueFee,
  clearPending,
  recordCollectionSuccess,
  recordCollectionPending,
  recordCollectionFailure,
  type FeeLedgerEntry,
} from "./x402_fee_ledger";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

/**
 * How long an unconfirmed collection blocks further attempts before it is written off.
 *
 * Tradeoff: a transaction that lands after this window would be collected twice. On an
 * L2 with ~2s blocks, one still unmined after 30 minutes has almost certainly been
 * dropped or replaced — and the alternative, wedging that seller's collection forever on
 * a single lost transaction, is worse.
 */
const PENDING_STALE_MS = 30 * 60 * 1000;

export interface FeeOutcome extends FeeResult {
  /** Fee assessed for THIS payment — what the receipt reports. */
  assessed: bigint;
  /** Atomic units this settlement actually attempted to sweep (accrued total). */
  swept?: bigint;
}

type ReconcileResult = "none" | "resolved" | "blocked";

/**
 * Resolve a collection whose receipt wait timed out.
 *
 * "unknown" is never treated as either outcome: collecting again could double-charge a
 * fee that already landed, and writing it off would drop one that never did. While the
 * outcome is genuinely unknown and still fresh, collection is blocked instead.
 */
async function reconcilePending(
  seller: string,
  network: string,
  entry: FeeLedgerEntry | null,
): Promise<ReconcileResult> {
  const pending = entry?.pending;
  if (!pending) {
    return "none";
  }

  const status = await getTransactionStatus(pending.txHash, network);

  if (status === "success") {
    logger.info(
      { seller, network, feeTxHash: pending.txHash, amount: pending.amount },
      "Reconciled pending fee collection — confirmed on-chain",
    );
    await recordCollectionSuccess(seller, network, BigInt(pending.amount), pending.txHash);
    return "resolved";
  }

  if (status === "reverted") {
    logger.warn(
      { seller, network, feeTxHash: pending.txHash },
      "Reconciled pending fee collection — reverted, debt stands",
    );
    await clearPending(seller, network);
    return "resolved";
  }

  const age = Date.now() - new Date(pending.sentAt).getTime();
  if (age > PENDING_STALE_MS) {
    logger.warn(
      { seller, network, feeTxHash: pending.txHash, ageMs: age },
      "Pending fee collection went stale without a receipt — writing off, debt stands",
    );
    await clearPending(seller, network);
    return "resolved";
  }

  logger.info(
    { seller, network, feeTxHash: pending.txHash, ageMs: age },
    "Pending fee collection still unresolved — skipping collection this round",
  );
  return "blocked";
}

/**
 * Accrue this payment's fee, then sweep the seller's accrued balance.
 *
 * Never throws: the caller is a settlement that has already landed on-chain, and fee
 * bookkeeping must not cost the buyer their receipt.
 */
export async function collectFeeWithLedger(
  seller: string,
  network: string,
  feeAmount: bigint,
  allowance?: bigint,
): Promise<FeeOutcome> {
  const entry = await getFeeLedger(seller, network);
  const reconciled = await reconcilePending(seller, network, entry);

  // Accrue regardless of whether collection can proceed — the debt is owed either way.
  const updated = await accrueFee(seller, network, feeAmount);

  if (reconciled === "blocked") {
    return { success: false, error: "fee_collection_blocked_pending", assessed: feeAmount };
  }

  // Without the ledger (no S3 credentials) there is no accrued total to sweep, so fall
  // back to the flat per-settlement fee — exactly the pre-ledger behaviour.
  const owed = updated ? BigInt(updated.accrued) : feeAmount;

  // Cap at the seller's allowance: one transferFrom for more than they approved reverts
  // in full, so an uncapped sweep of a backlog would collect nothing at all rather than
  // as much as possible. A partial sweep leaves the remainder accrued for next time.
  //
  // An UNKNOWN allowance (undefined) must not cap — capping to 0n would silently halt
  // all collection during a transient RPC failure.
  const swept = allowance === undefined ? owed : owed < allowance ? owed : allowance;

  if (swept === 0n) {
    logger.info(
      { seller, network, owed: owed.toString(), allowance: allowance?.toString() },
      "Nothing collectable this round — allowance exhausted or nothing owed",
    );
    return { success: true, assessed: feeAmount, swept: 0n };
  }

  const result = await collectFee(seller as Address, network, swept);

  if (result.success) {
    await recordCollectionSuccess(seller, network, swept, result.txHash);
  } else if (result.error === "fee_collection_pending") {
    await recordCollectionPending(seller, network, swept, result.txHash as string);
  } else {
    await recordCollectionFailure(seller, network, result.error);
  }

  return { ...result, assessed: feeAmount, swept };
}
