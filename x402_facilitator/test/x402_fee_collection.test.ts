import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  collectFee: vi.fn(),
  getTransactionStatus: vi.fn(),
  getFeeLedger: vi.fn(),
  accrueFee: vi.fn(),
  clearPending: vi.fn(),
  recordCollectionSuccess: vi.fn(),
  recordCollectionPending: vi.fn(),
  recordCollectionFailure: vi.fn(),
}));

vi.mock("../x402_fee.js", () => ({
  collectFee: mocks.collectFee,
  getTransactionStatus: mocks.getTransactionStatus,
}));

vi.mock("../x402_fee_ledger.js", () => ({
  getFeeLedger: mocks.getFeeLedger,
  accrueFee: mocks.accrueFee,
  clearPending: mocks.clearPending,
  recordCollectionSuccess: mocks.recordCollectionSuccess,
  recordCollectionPending: mocks.recordCollectionPending,
  recordCollectionFailure: mocks.recordCollectionFailure,
}));

// ===== Import after mocks =====
import { collectFeeWithLedger } from "../x402_fee_collection.js";

const SELLER = "0x209693Bc6afc0C5328bA36FaF03C514EF312287C";
const NETWORK = "eip155:11155420";
const FEE = 10000n;

/** A ledger entry as returned after accrual. */
function entry(overrides = {}) {
  return {
    version: 1,
    seller: SELLER.toLowerCase(),
    network: NETWORK,
    accrued: "10000",
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function pending(ageMs: number, amount = "10000") {
  return {
    txHash: "0xpendingtx",
    amount,
    sentAt: new Date(Date.now() - ageMs).toISOString(),
  };
}

describe("x402_fee_collection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getFeeLedger.mockResolvedValue(null);
    mocks.accrueFee.mockResolvedValue(entry());
    mocks.collectFee.mockResolvedValue({ success: true, txHash: "0xfeetx" });
    mocks.clearPending.mockResolvedValue(undefined);
    mocks.recordCollectionSuccess.mockResolvedValue(undefined);
    mocks.recordCollectionPending.mockResolvedValue(undefined);
    mocks.recordCollectionFailure.mockResolvedValue(undefined);
  });

  // ═══════════════════════════════════════════════════════════
  // The core 1.3 behaviour: sweep the accrued total
  // ═══════════════════════════════════════════════════════════

  it("sweeps the accrued total, not the flat fee", async () => {
    // A backlog of three failed fees plus this one.
    mocks.accrueFee.mockResolvedValue(entry({ accrued: "40000" }));

    const result = await collectFeeWithLedger(SELLER, NETWORK, FEE);

    expect(mocks.collectFee).toHaveBeenCalledWith(SELLER, NETWORK, 40000n);
    expect(result.swept).toBe(40000n);
    // The receipt still reports what THIS payment was assessed.
    expect(result.assessed).toBe(FEE);
  });

  it("decrements by the swept total on success", async () => {
    mocks.accrueFee.mockResolvedValue(entry({ accrued: "40000" }));

    await collectFeeWithLedger(SELLER, NETWORK, FEE);

    expect(mocks.recordCollectionSuccess).toHaveBeenCalledWith(SELLER, NETWORK, 40000n, "0xfeetx");
  });

  it("accrues before collecting", async () => {
    const order: string[] = [];
    mocks.accrueFee.mockImplementation(async () => {
      order.push("accrue");
      return entry();
    });
    mocks.collectFee.mockImplementation(async () => {
      order.push("collect");
      return { success: true, txHash: "0xfeetx" };
    });

    await collectFeeWithLedger(SELLER, NETWORK, FEE);

    expect(order).toEqual(["accrue", "collect"]);
  });

  // ═══════════════════════════════════════════════════════════
  // Reconciliation of a pending collection
  // ═══════════════════════════════════════════════════════════

  describe("reconciliation", () => {
    it("settles the old debt when the pending tx confirmed", async () => {
      mocks.getFeeLedger.mockResolvedValue(entry({ accrued: "10000", pending: pending(1000) }));
      mocks.getTransactionStatus.mockResolvedValue("success");

      await collectFeeWithLedger(SELLER, NETWORK, FEE);

      // Reconciled against the PENDING amount, before this fee was accrued.
      expect(mocks.recordCollectionSuccess).toHaveBeenCalledWith(
        SELLER,
        NETWORK,
        10000n,
        "0xpendingtx",
      );
      expect(mocks.collectFee).toHaveBeenCalled();
    });

    it("reconciles before accruing this payment's fee", async () => {
      mocks.getFeeLedger.mockResolvedValue(entry({ pending: pending(1000) }));
      mocks.getTransactionStatus.mockResolvedValue("success");

      const order: string[] = [];
      mocks.recordCollectionSuccess.mockImplementation(async () => void order.push("reconcile"));
      mocks.accrueFee.mockImplementation(async () => {
        order.push("accrue");
        return entry();
      });

      await collectFeeWithLedger(SELLER, NETWORK, FEE);

      // Ordering makes the sweep total correct: old debt clears first.
      expect(order[0]).toBe("reconcile");
      expect(order[1]).toBe("accrue");
    });

    it("keeps the debt and retries when the pending tx reverted", async () => {
      mocks.getFeeLedger.mockResolvedValue(entry({ pending: pending(1000) }));
      mocks.getTransactionStatus.mockResolvedValue("reverted");

      await collectFeeWithLedger(SELLER, NETWORK, FEE);

      expect(mocks.clearPending).toHaveBeenCalledWith(SELLER, NETWORK);
      // The reverted tx must never be booked as a collection.
      expect(mocks.recordCollectionSuccess).not.toHaveBeenCalledWith(
        SELLER,
        NETWORK,
        expect.anything(),
        "0xpendingtx",
      );
      // The debt was never collected, so this round retries it.
      expect(mocks.collectFee).toHaveBeenCalled();
    });

    it("blocks collection while a fresh pending tx is unresolved", async () => {
      mocks.getFeeLedger.mockResolvedValue(entry({ pending: pending(60_000) }));
      mocks.getTransactionStatus.mockResolvedValue("unknown");

      const result = await collectFeeWithLedger(SELLER, NETWORK, FEE);

      // The whole point of 1.3: collecting now could double-charge.
      expect(mocks.collectFee).not.toHaveBeenCalled();
      expect(mocks.clearPending).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toBe("fee_collection_blocked_pending");
    });

    it("still accrues this payment's fee while blocked", async () => {
      mocks.getFeeLedger.mockResolvedValue(entry({ pending: pending(60_000) }));
      mocks.getTransactionStatus.mockResolvedValue("unknown");

      await collectFeeWithLedger(SELLER, NETWORK, FEE);

      // The fee is owed whether or not it can be collected right now.
      expect(mocks.accrueFee).toHaveBeenCalledWith(SELLER, NETWORK, FEE);
    });

    it("writes off a stale pending tx and resumes collecting", async () => {
      mocks.getFeeLedger.mockResolvedValue(entry({ pending: pending(31 * 60 * 1000) }));
      mocks.getTransactionStatus.mockResolvedValue("unknown");

      await collectFeeWithLedger(SELLER, NETWORK, FEE);

      expect(mocks.clearPending).toHaveBeenCalledWith(SELLER, NETWORK);
      // Written off, not booked as collected — the debt still stands.
      expect(mocks.recordCollectionSuccess).not.toHaveBeenCalledWith(
        SELLER,
        NETWORK,
        expect.anything(),
        "0xpendingtx",
      );
      expect(mocks.collectFee).toHaveBeenCalled();
    });

    it("never treats an RPC failure as a resolved outcome", async () => {
      mocks.getFeeLedger.mockResolvedValue(entry({ pending: pending(1000) }));
      // getTransactionStatus maps RPC errors to "unknown" rather than guessing.
      mocks.getTransactionStatus.mockResolvedValue("unknown");

      const result = await collectFeeWithLedger(SELLER, NETWORK, FEE);

      expect(mocks.recordCollectionSuccess).not.toHaveBeenCalled();
      expect(mocks.clearPending).not.toHaveBeenCalled();
      expect(result.error).toBe("fee_collection_blocked_pending");
    });

    it("skips reconciliation entirely when nothing is pending", async () => {
      mocks.getFeeLedger.mockResolvedValue(entry());

      await collectFeeWithLedger(SELLER, NETWORK, FEE);

      expect(mocks.getTransactionStatus).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Collection outcomes
  // ═══════════════════════════════════════════════════════════

  describe("outcomes", () => {
    it("records a timed-out collection as pending with the swept amount", async () => {
      mocks.accrueFee.mockResolvedValue(entry({ accrued: "40000" }));
      mocks.collectFee.mockResolvedValue({
        success: false,
        txHash: "0xnewpending",
        error: "fee_collection_pending",
      });

      await collectFeeWithLedger(SELLER, NETWORK, FEE);

      expect(mocks.recordCollectionPending).toHaveBeenCalledWith(
        SELLER,
        NETWORK,
        40000n,
        "0xnewpending",
      );
      expect(mocks.recordCollectionFailure).not.toHaveBeenCalled();
    });

    it("records a hard failure without clearing the debt", async () => {
      mocks.collectFee.mockResolvedValue({
        success: false,
        error: "insufficient_fee_allowance",
      });

      await collectFeeWithLedger(SELLER, NETWORK, FEE);

      expect(mocks.recordCollectionFailure).toHaveBeenCalledWith(
        SELLER,
        NETWORK,
        "insufficient_fee_allowance",
      );
      expect(mocks.recordCollectionSuccess).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Allowance capping
  // ═══════════════════════════════════════════════════════════

  describe("allowance cap", () => {
    it("caps the sweep at the seller's allowance", async () => {
      mocks.accrueFee.mockResolvedValue(entry({ accrued: "40000" }));

      // One transferFrom for more than approved reverts in full, so an uncapped sweep
      // of this backlog would collect nothing at all.
      const result = await collectFeeWithLedger(SELLER, NETWORK, FEE, 25000n);

      expect(mocks.collectFee).toHaveBeenCalledWith(SELLER, NETWORK, 25000n);
      expect(result.swept).toBe(25000n);
    });

    it("leaves the remainder accrued after a partial sweep", async () => {
      mocks.accrueFee.mockResolvedValue(entry({ accrued: "40000" }));

      await collectFeeWithLedger(SELLER, NETWORK, FEE, 25000n);

      // Only the swept amount is decremented; 15000 stays owed for next time.
      expect(mocks.recordCollectionSuccess).toHaveBeenCalledWith(
        SELLER,
        NETWORK,
        25000n,
        "0xfeetx",
      );
    });

    it("does not cap when the allowance covers the whole balance", async () => {
      mocks.accrueFee.mockResolvedValue(entry({ accrued: "40000" }));

      await collectFeeWithLedger(SELLER, NETWORK, FEE, 100000n);

      expect(mocks.collectFee).toHaveBeenCalledWith(SELLER, NETWORK, 40000n);
    });

    it("does NOT cap when the allowance is unknown", async () => {
      mocks.accrueFee.mockResolvedValue(entry({ accrued: "40000" }));

      // undefined means "could not read", not "zero". Capping here would silently halt
      // all collection during a transient RPC failure.
      await collectFeeWithLedger(SELLER, NETWORK, FEE, undefined);

      expect(mocks.collectFee).toHaveBeenCalledWith(SELLER, NETWORK, 40000n);
    });

    it("skips collection when the allowance is exhausted", async () => {
      mocks.accrueFee.mockResolvedValue(entry({ accrued: "40000" }));

      const result = await collectFeeWithLedger(SELLER, NETWORK, FEE, 0n);

      expect(mocks.collectFee).not.toHaveBeenCalled();
      expect(result.swept).toBe(0n);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Ledger-disabled fallback
  // ═══════════════════════════════════════════════════════════

  it("falls back to the flat fee when the ledger is unavailable", async () => {
    mocks.getFeeLedger.mockResolvedValue(null);
    mocks.accrueFee.mockResolvedValue(null); // no S3 credentials

    const result = await collectFeeWithLedger(SELLER, NETWORK, FEE);

    // Identical to the pre-ledger behaviour: collect exactly the flat fee.
    expect(mocks.collectFee).toHaveBeenCalledWith(SELLER, NETWORK, FEE);
    expect(result.swept).toBe(FEE);
  });

  it("does not attempt collection when nothing is owed", async () => {
    mocks.accrueFee.mockResolvedValue(entry({ accrued: "0" }));

    const result = await collectFeeWithLedger(SELLER, NETWORK, 0n);

    expect(mocks.collectFee).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });
});
