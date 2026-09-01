/**
 * x402 Facilitator Fee Ledger
 *
 * Durable record of fees owed by each seller, so a failed collection is retryable
 * instead of silently lost.
 *
 * One S3 object per (seller, network), updated through an ETag compare-and-swap loop
 * (the same pattern as `scw_js/x402_channel_storage.ts`), so concurrent settlements for
 * the same seller cannot clobber each other's accrual.
 *
 * Lifecycle:
 * 1. Settlement accrues the fee owed BEFORE attempting collection.
 * 2. Confirmed collection decrements the accrued balance.
 * 3. A collection whose receipt timed out is recorded as `pending` — the outcome is
 *    unknown, so the balance stands until it is reconciled (1.3).
 *
 * This ledger is best-effort by design: every operation swallows its errors. Fee
 * bookkeeping must never block a settlement — refusing to settle over a 0.01 USDC fee
 * would trade the buyer's payment for the facilitator's rounding error.
 */

import { getS3ObjectWithMeta, putS3ObjectConditional } from "@fretchen/s3-utils";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const PREFIX = "fees/";
const MAX_CAS_ATTEMPTS = 3;

/**
 * Consecutive hard failures before the stuck balance is logged at `error`.
 * Deliberately just a log line — not an alerting system.
 */
const FAILURE_ALERT_THRESHOLD = 5;

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

/** A collection attempt whose on-chain outcome is not yet known. */
export interface PendingCollection {
  txHash: string;
  /** Atomic units this attempt tried to collect. */
  amount: string;
  sentAt: string;
}

export interface SuccessfulCollection {
  txHash?: string;
  amount: string;
  at: string;
}

/**
 * Amounts are decimal strings, not bigint: JSON.stringify throws on bigint.
 */
export interface FeeLedgerEntry {
  version: 1;
  /** Lowercased — see keyFor(). */
  seller: string;
  /** CAIP-2, unsanitised (the key form is sanitised). */
  network: string;
  /** Atomic units currently owed. */
  accrued: string;
  pending?: PendingCollection;
  lastSuccess?: SuccessfulCollection;
  /**
   * Consecutive hard collection failures. Reset on success; left alone by a pending
   * outcome, which is unknown rather than failed. Drives the stuck-balance alert.
   */
  consecutiveFailures?: number;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Key layout
// ═══════════════════════════════════════════════════════════════

/**
 * `fees/{network}/{seller}.json`
 *
 * Two normalisations that matter for correctness:
 * - the seller is lowercased, because addresses arrive EIP-55 checksummed and two
 *   casings would otherwise create two ledger rows for the same seller;
 * - the CAIP-2 colon is replaced, because colons in S3 keys interact awkwardly with
 *   SigV4 canonical-URI encoding.
 */
function keyFor(seller: string, network: string): string {
  return `${PREFIX}${network.replace(/:/g, "-")}/${seller.toLowerCase()}.json`;
}

// ═══════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════

/**
 * The ledger is only active when S3 credentials are present. Without them
 * `@fretchen/s3-utils` throws on every call, so short-circuit instead: a facilitator
 * deployed without object storage keeps settling, just without fee bookkeeping.
 */
export function isLedgerEnabled(): boolean {
  return Boolean(process.env.SCW_ACCESS_KEY && process.env.SCW_SECRET_KEY);
}

// ═══════════════════════════════════════════════════════════════
// Core CAS primitive
// ═══════════════════════════════════════════════════════════════

/**
 * Read-modify-write one ledger entry under compare-and-swap.
 *
 * Returns the written entry, or null if the update function declined to change
 * anything or the CAS loop was exhausted.
 */
async function updateEntry(
  seller: string,
  network: string,
  update: (current: FeeLedgerEntry | undefined) => FeeLedgerEntry | undefined,
): Promise<FeeLedgerEntry | null> {
  const key = keyFor(seller, network);

  for (let attempt = 1; attempt <= MAX_CAS_ATTEMPTS; attempt++) {
    const existing = await getS3ObjectWithMeta(key);
    const current = existing ? (JSON.parse(existing.body) as FeeLedgerEntry) : undefined;

    const next = update(current);
    if (!next) {
      return null;
    }

    const putResult = await putS3ObjectConditional(key, JSON.stringify(next), {
      contentType: "application/json",
      ...(existing ? { ifMatch: existing.etag } : { ifNoneMatch: "*" }),
    });
    if (putResult.ok) {
      return next;
    }
    // 412 precondition failure: another writer won the race — retry from a fresh read.
  }

  // Unlike S3ChannelStorage, do not throw: the caller is a settlement in flight and
  // losing the bookkeeping is strictly better than losing the buyer's receipt.
  logger.error(
    { seller, network, key, attempts: MAX_CAS_ATTEMPTS },
    "Fee ledger CAS exhausted — accrual not recorded",
  );
  return null;
}

/**
 * Run a ledger operation, absorbing any failure.
 *
 * Every caller is on the settlement request path, where the ledger is the least
 * valuable thing in flight. S3 being unreachable must degrade bookkeeping, not payments.
 */
async function withLedger<T>(
  operation: string,
  seller: string,
  network: string,
  fn: () => Promise<T>,
): Promise<T | null> {
  if (!isLedgerEnabled()) {
    logger.debug({ operation, seller, network }, "Fee ledger disabled (no S3 credentials)");
    return null;
  }

  try {
    return await fn();
  } catch (err) {
    logger.error({ err, operation, seller, network }, "Fee ledger operation failed");
    return null;
  }
}

function emptyEntry(seller: string, network: string): FeeLedgerEntry {
  return {
    version: 1,
    seller: seller.toLowerCase(),
    network,
    accrued: "0",
    updatedAt: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// Operations
// ═══════════════════════════════════════════════════════════════

/** Read one entry. Returns null when absent, disabled, or unreadable. */
export async function getFeeLedger(
  seller: string,
  network: string,
): Promise<FeeLedgerEntry | null> {
  if (!isLedgerEnabled()) {
    return null;
  }

  try {
    const result = await getS3ObjectWithMeta(keyFor(seller, network));
    return result ? (JSON.parse(result.body) as FeeLedgerEntry) : null;
  } catch (err) {
    logger.error({ err, seller, network }, "Fee ledger read failed");
    return null;
  }
}

/**
 * Record that a fee is owed. Called BEFORE collection is attempted, so that a crash
 * mid-collection leaves the debt recorded rather than lost.
 */
export async function accrueFee(
  seller: string,
  network: string,
  amount: bigint,
): Promise<FeeLedgerEntry | null> {
  if (amount === 0n) {
    return null;
  }

  return withLedger("accrue", seller, network, () =>
    updateEntry(seller, network, (current) => {
      const base = current ?? emptyEntry(seller, network);
      return {
        ...base,
        accrued: (BigInt(base.accrued) + amount).toString(),
        updatedAt: new Date().toISOString(),
      };
    }),
  );
}

/**
 * Record a confirmed collection: decrement the accrued balance and clear any pending
 * marker. Clamped at zero so a double-record can never drive the balance negative.
 */
export async function recordCollectionSuccess(
  seller: string,
  network: string,
  amount: bigint,
  txHash?: string,
): Promise<void> {
  await withLedger("collection_success", seller, network, () =>
    updateEntry(seller, network, (current) => {
      const base = current ?? emptyEntry(seller, network);
      const remaining = BigInt(base.accrued) - amount;
      const next: FeeLedgerEntry = {
        ...base,
        accrued: (remaining > 0n ? remaining : 0n).toString(),
        lastSuccess: { txHash, amount: amount.toString(), at: new Date().toISOString() },
        consecutiveFailures: 0,
        updatedAt: new Date().toISOString(),
      };
      delete next.pending;
      return next;
    }),
  );
}

/**
 * Record a collection whose receipt timed out (see `fee_collection_pending` in
 * `x402_fee.ts`). The transaction may still land, so the accrued balance is left
 * standing — only 1.3's reconciliation can safely resolve it.
 */
export async function recordCollectionPending(
  seller: string,
  network: string,
  amount: bigint,
  txHash: string,
): Promise<void> {
  await withLedger("collection_pending", seller, network, () =>
    updateEntry(seller, network, (current) => {
      const base = current ?? emptyEntry(seller, network);
      return {
        ...base,
        pending: { txHash, amount: amount.toString(), sentAt: new Date().toISOString() },
        updatedAt: new Date().toISOString(),
      };
    }),
  );
}

/**
 * Drop the pending marker without touching the accrued balance.
 *
 * Used when a pending collection resolved as reverted, or went stale without ever
 * producing a receipt. The debt deliberately stands: it was never actually collected,
 * so it must remain owed and retryable.
 */
export async function clearPending(seller: string, network: string): Promise<void> {
  await withLedger("clear_pending", seller, network, () =>
    updateEntry(seller, network, (current) => {
      if (!current?.pending) {
        return undefined;
      }
      const next: FeeLedgerEntry = { ...current, updatedAt: new Date().toISOString() };
      delete next.pending;
      return next;
    }),
  );
}

/**
 * Record a hard collection failure and surface a balance that keeps failing.
 *
 * Persistence (1.2) made the debt recorded; this is what makes a stuck one *visible*,
 * which matters more now that an unresolved pending marker can block collection.
 */
export async function recordCollectionFailure(
  seller: string,
  network: string,
  error?: string,
): Promise<void> {
  await withLedger("collection_failure", seller, network, async () => {
    const updated = await updateEntry(seller, network, (current) => {
      const base = current ?? emptyEntry(seller, network);
      return {
        ...base,
        consecutiveFailures: (base.consecutiveFailures ?? 0) + 1,
        updatedAt: new Date().toISOString(),
      };
    });

    if (updated && (updated.consecutiveFailures ?? 0) >= FAILURE_ALERT_THRESHOLD) {
      logger.error(
        {
          seller,
          network,
          consecutiveFailures: updated.consecutiveFailures,
          accrued: updated.accrued,
          error,
        },
        "Fee collection stuck — consecutive failures crossed alert threshold",
      );
    }
    return updated;
  });
}
