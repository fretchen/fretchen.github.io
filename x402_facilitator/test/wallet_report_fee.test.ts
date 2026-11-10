/**
 * The fee/address extraction's own regression tests — ported from the retired x402_fee.test.ts
 * when the facilitator moved to bunny_js (bunny_js/test/facilitator/x402_fee.test.ts covers the
 * live copy; this guards the report-side copy). The cases that matter here: the env-fee
 * validation branches (a corrupted FACILITATOR_FEE_AMOUNT must fall back, not throw or NaN) and
 * the decimals scaling — especially EURe's 18 decimals, where 0.01 is 10¹⁶ atomic units, the
 * shipped-wrong trap this arithmetic once embodied.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getFeeAmount, feeAmountFor, getFacilitatorAddress } from "../wallet_report_fee";

describe("wallet_report_fee", () => {
  const originalEnv = { ...process.env };
  // Well-known anvil/hardhat key #0 — public knowledge, used for the address-derivation shape.
  const VALID_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

  beforeEach(() => {
    process.env.FACILITATOR_WALLET_PRIVATE_KEY = VALID_PRIVATE_KEY;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("getFeeAmount — env validation must fall back, never throw", () => {
    it("returns default fee (10000) when env not set", () => {
      delete process.env.FACILITATOR_FEE_AMOUNT;
      expect(getFeeAmount()).toBe(10000n);
    });

    it("returns custom fee from env", () => {
      process.env.FACILITATOR_FEE_AMOUNT = "50000";
      expect(getFeeAmount()).toBe(50000n);
    });

    it("returns 0 when fee is explicitly set to 0 (fees disabled)", () => {
      process.env.FACILITATOR_FEE_AMOUNT = "0";
      expect(getFeeAmount()).toBe(0n);
    });

    it("returns default for negative values", () => {
      process.env.FACILITATOR_FEE_AMOUNT = "-1000";
      expect(getFeeAmount()).toBe(10000n);
    });

    it("returns default for non-integer strings (e.g. text)", () => {
      process.env.FACILITATOR_FEE_AMOUNT = "not-a-number";
      expect(getFeeAmount()).toBe(10000n);
    });

    it("returns default for decimal values", () => {
      process.env.FACILITATOR_FEE_AMOUNT = "100.5";
      expect(getFeeAmount()).toBe(10000n);
    });

    it("BigInt-trims whitespace-only values to 0n (fees disabled), which is safe", () => {
      process.env.FACILITATOR_FEE_AMOUNT = "  ";
      expect(getFeeAmount()).toBe(0n);
    });
  });

  describe("feeAmountFor — the decimals scaling, incl. the EURe 18-decimals trap", () => {
    it("returns the base amount for the base decimals (USDC/EURC, 6)", () => {
      expect(feeAmountFor(6)).toBe(10000n);
    });

    it("scales UP for EURe's 18 decimals: 0.01 is 10^16, not 10000", () => {
      expect(feeAmountFor(18)).toBe(10_000_000_000_000_000n);
    });

    it("scales DOWN below the base decimals (0.01 in a 2-decimals token = 1 unit)", () => {
      expect(feeAmountFor(2)).toBe(1n);
    });
  });

  describe("getFacilitatorAddress", () => {
    it("returns the address derived from the private key", () => {
      expect(getFacilitatorAddress()).toBe("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    });

    it("returns null when the private key is not set", () => {
      delete process.env.FACILITATOR_WALLET_PRIVATE_KEY;
      expect(getFacilitatorAddress()).toBeNull();
    });

    it("returns null for an invalid (too short) private key", () => {
      process.env.FACILITATOR_WALLET_PRIVATE_KEY = "0xinvalid";
      expect(getFacilitatorAddress()).toBeNull();
    });

    it("handles a private key without the 0x prefix", () => {
      process.env.FACILITATOR_WALLET_PRIVATE_KEY =
        "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      expect(getFacilitatorAddress()).toBe("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    });
  });
});
