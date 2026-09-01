import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockGetS3ObjectWithMeta, mockPutS3ObjectConditional } = vi.hoisted(() => ({
  mockGetS3ObjectWithMeta: vi.fn(),
  mockPutS3ObjectConditional: vi.fn(),
}));

vi.mock("@fretchen/s3-utils", () => ({
  getS3ObjectWithMeta: mockGetS3ObjectWithMeta,
  putS3ObjectConditional: mockPutS3ObjectConditional,
}));

// ===== Import after mocks =====
import {
  isLedgerEnabled,
  getFeeLedger,
  accrueFee,
  clearPending,
  recordCollectionSuccess,
  recordCollectionPending,
  recordCollectionFailure,
  type FeeLedgerEntry,
} from "../x402_fee_ledger.js";

const SELLER = "0x209693Bc6afc0C5328bA36FaF03C514EF312287C";
const NETWORK = "eip155:11155420";
const KEY = "fees/eip155-11155420/0x209693bc6afc0c5328ba36faf03c514ef312287c.json";

/** The entry body handed to the most recent conditional PUT. */
function lastWritten(): FeeLedgerEntry {
  const calls = mockPutS3ObjectConditional.mock.calls;
  return JSON.parse(calls[calls.length - 1][1] as string) as FeeLedgerEntry;
}

function existing(entry: Partial<FeeLedgerEntry>, etag = '"abc"') {
  return {
    body: JSON.stringify({
      version: 1,
      seller: SELLER.toLowerCase(),
      network: NETWORK,
      accrued: "0",
      updatedAt: "2026-01-01T00:00:00.000Z",
      ...entry,
    }),
    etag,
  };
}

describe("x402_fee_ledger", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.SCW_ACCESS_KEY = "test-access-key";
    process.env.SCW_SECRET_KEY = "test-secret-key";
    vi.clearAllMocks();
    mockGetS3ObjectWithMeta.mockResolvedValue(null);
    mockPutS3ObjectConditional.mockResolvedValue({ ok: true, etag: '"new"' });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ═══════════════════════════════════════════════════════════
  // Enablement
  // ═══════════════════════════════════════════════════════════

  describe("isLedgerEnabled", () => {
    it("is enabled when both S3 credentials are present", () => {
      expect(isLedgerEnabled()).toBe(true);
    });

    it("is disabled when the access key is missing", () => {
      delete process.env.SCW_ACCESS_KEY;
      expect(isLedgerEnabled()).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Key layout
  // ═══════════════════════════════════════════════════════════

  describe("key layout", () => {
    it("lowercases the seller and strips the CAIP-2 colon", async () => {
      await accrueFee(SELLER, NETWORK, 10000n);

      expect(mockPutS3ObjectConditional).toHaveBeenCalledWith(
        KEY,
        expect.any(String),
        expect.anything(),
      );
    });

    it("maps differently-cased seller addresses onto the same key", async () => {
      await accrueFee(SELLER.toLowerCase(), NETWORK, 10000n);
      await accrueFee(SELLER.toUpperCase().replace("0X", "0x"), NETWORK, 10000n);

      const keys = mockPutS3ObjectConditional.mock.calls.map((c) => c[0] as string);
      expect(new Set(keys).size).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // accrueFee
  // ═══════════════════════════════════════════════════════════

  describe("accrueFee", () => {
    it("creates a new entry with If-None-Match when none exists", async () => {
      await accrueFee(SELLER, NETWORK, 10000n);

      expect(mockPutS3ObjectConditional).toHaveBeenCalledWith(
        KEY,
        expect.any(String),
        expect.objectContaining({ ifNoneMatch: "*" }),
      );
      expect(lastWritten().accrued).toBe("10000");
    });

    it("increments an existing balance with If-Match", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(existing({ accrued: "10000" }, '"etag-1"'));

      await accrueFee(SELLER, NETWORK, 10000n);

      expect(mockPutS3ObjectConditional).toHaveBeenCalledWith(
        KEY,
        expect.any(String),
        expect.objectContaining({ ifMatch: '"etag-1"' }),
      );
      expect(lastWritten().accrued).toBe("20000");
    });

    it("does nothing when the fee is zero", async () => {
      await accrueFee(SELLER, NETWORK, 0n);
      expect(mockPutS3ObjectConditional).not.toHaveBeenCalled();
    });

    it("returns the updated entry so the caller knows the accrued total", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(existing({ accrued: "30000" }));

      const updated = await accrueFee(SELLER, NETWORK, 10000n);

      expect(updated?.accrued).toBe("40000");
    });

    it("returns null when the ledger is disabled", async () => {
      delete process.env.SCW_ACCESS_KEY;
      await expect(accrueFee(SELLER, NETWORK, 10000n)).resolves.toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // recordCollectionSuccess
  // ═══════════════════════════════════════════════════════════

  describe("recordCollectionSuccess", () => {
    it("decrements the balance and records the tx", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(existing({ accrued: "30000" }));

      await recordCollectionSuccess(SELLER, NETWORK, 10000n, "0xfee");

      const written = lastWritten();
      expect(written.accrued).toBe("20000");
      expect(written.lastSuccess).toMatchObject({ txHash: "0xfee", amount: "10000" });
    });

    it("clears a pending marker", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(
        existing({
          accrued: "10000",
          pending: { txHash: "0xold", amount: "10000", sentAt: "2026-01-01T00:00:00.000Z" },
        }),
      );

      await recordCollectionSuccess(SELLER, NETWORK, 10000n, "0xfee");

      expect(lastWritten().pending).toBeUndefined();
    });

    it("clamps at zero rather than going negative", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(existing({ accrued: "0" }));

      await recordCollectionSuccess(SELLER, NETWORK, 10000n, "0xfee");

      expect(lastWritten().accrued).toBe("0");
    });
  });

  // ═══════════════════════════════════════════════════════════
  // recordCollectionPending
  // ═══════════════════════════════════════════════════════════

  describe("recordCollectionPending", () => {
    it("records the hash and leaves the balance standing", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(existing({ accrued: "10000" }));

      await recordCollectionPending(SELLER, NETWORK, 10000n, "0xpending");

      const written = lastWritten();
      // The tx may still land, so the debt must not be cleared here — only 1.3's
      // reconciliation can safely resolve it.
      expect(written.accrued).toBe("10000");
      expect(written.pending).toMatchObject({ txHash: "0xpending", amount: "10000" });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // clearPending
  // ═══════════════════════════════════════════════════════════

  describe("clearPending", () => {
    it("drops the pending marker but leaves the debt standing", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(
        existing({
          accrued: "10000",
          pending: { txHash: "0xold", amount: "10000", sentAt: "2026-01-01T00:00:00.000Z" },
        }),
      );

      await clearPending(SELLER, NETWORK);

      const written = lastWritten();
      expect(written.pending).toBeUndefined();
      // The fee was never actually collected, so it must remain owed.
      expect(written.accrued).toBe("10000");
    });

    it("writes nothing when there is no pending marker", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(existing({ accrued: "10000" }));

      await clearPending(SELLER, NETWORK);

      expect(mockPutS3ObjectConditional).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // recordCollectionFailure (stuck-balance visibility)
  // ═══════════════════════════════════════════════════════════

  describe("recordCollectionFailure", () => {
    it("increments the consecutive failure counter", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(
        existing({ accrued: "10000", consecutiveFailures: 2 }),
      );

      await recordCollectionFailure(SELLER, NETWORK, "insufficient_fee_allowance");

      expect(lastWritten().consecutiveFailures).toBe(3);
    });

    it("starts the counter at 1 on a first failure", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(existing({ accrued: "10000" }));

      await recordCollectionFailure(SELLER, NETWORK);

      expect(lastWritten().consecutiveFailures).toBe(1);
    });

    it("is reset by a successful collection", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(
        existing({ accrued: "10000", consecutiveFailures: 4 }),
      );

      await recordCollectionSuccess(SELLER, NETWORK, 10000n, "0xfee");

      expect(lastWritten().consecutiveFailures).toBe(0);
    });

    it("is left untouched by a pending outcome", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(
        existing({ accrued: "10000", consecutiveFailures: 2 }),
      );

      await recordCollectionPending(SELLER, NETWORK, 10000n, "0xpending");

      // An unknown outcome is not a failure.
      expect(lastWritten().consecutiveFailures).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // CAS behaviour
  // ═══════════════════════════════════════════════════════════

  describe("compare-and-swap", () => {
    it("retries from a fresh read after a 412 and uses the re-read value", async () => {
      mockGetS3ObjectWithMeta
        .mockResolvedValueOnce(existing({ accrued: "10000" }, '"stale"'))
        .mockResolvedValueOnce(existing({ accrued: "50000" }, '"fresh"'));
      mockPutS3ObjectConditional
        .mockResolvedValueOnce({ ok: false, status: 412 })
        .mockResolvedValueOnce({ ok: true, etag: '"written"' });

      await accrueFee(SELLER, NETWORK, 10000n);

      expect(mockPutS3ObjectConditional).toHaveBeenCalledTimes(2);
      // 50000 (the value another writer left behind) + 10000, not 10000 + 10000.
      expect(lastWritten().accrued).toBe("60000");
      expect(mockPutS3ObjectConditional.mock.calls[1][2]).toMatchObject({ ifMatch: '"fresh"' });
    });

    it("gives up after exhausting attempts without throwing", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(existing({ accrued: "10000" }));
      mockPutS3ObjectConditional.mockResolvedValue({ ok: false, status: 412 });

      await expect(accrueFee(SELLER, NETWORK, 10000n)).resolves.toBeNull();
      expect(mockPutS3ObjectConditional).toHaveBeenCalledTimes(3);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Failure policy — must never block a settlement
  // ═══════════════════════════════════════════════════════════

  describe("failure policy", () => {
    it("swallows S3 read failures", async () => {
      mockGetS3ObjectWithMeta.mockRejectedValue(new Error("S3 unreachable"));
      await expect(accrueFee(SELLER, NETWORK, 10000n)).resolves.toBeNull();
    });

    it("swallows S3 write failures", async () => {
      mockPutS3ObjectConditional.mockRejectedValue(new Error("S3 unreachable"));
      await expect(accrueFee(SELLER, NETWORK, 10000n)).resolves.toBeNull();
    });

    it("no-ops entirely when credentials are absent", async () => {
      delete process.env.SCW_ACCESS_KEY;

      await accrueFee(SELLER, NETWORK, 10000n);
      await recordCollectionSuccess(SELLER, NETWORK, 10000n, "0xfee");
      await recordCollectionPending(SELLER, NETWORK, 10000n, "0xpending");

      expect(mockGetS3ObjectWithMeta).not.toHaveBeenCalled();
      expect(mockPutS3ObjectConditional).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getFeeLedger
  // ═══════════════════════════════════════════════════════════

  describe("getFeeLedger", () => {
    it("returns the parsed entry", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(existing({ accrued: "42" }));
      await expect(getFeeLedger(SELLER, NETWORK)).resolves.toMatchObject({ accrued: "42" });
    });

    it("returns null when absent", async () => {
      await expect(getFeeLedger(SELLER, NETWORK)).resolves.toBeNull();
    });

    it("returns null instead of throwing when S3 fails", async () => {
      mockGetS3ObjectWithMeta.mockRejectedValue(new Error("S3 unreachable"));
      await expect(getFeeLedger(SELLER, NETWORK)).resolves.toBeNull();
    });
  });
});
