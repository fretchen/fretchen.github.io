// @ts-check

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getFeeAmount,
  getFacilitatorAddress,
  checkMerchantAllowance,
  collectFee,
} from "../x402_fee.js";

// Mock viem
vi.mock("viem", async () => {
  const actual = await vi.importActual("viem");
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      waitForTransactionReceipt: vi.fn(async ({ hash }) => ({
        status: "success",
        transactionHash: hash,
      })),
    })),
    createWalletClient: vi.fn(() => ({})),
    getContract: vi.fn(),
  };
});

// Mock viem/accounts
vi.mock("viem/accounts", () => ({
  privateKeyToAccount: vi.fn((key) => {
    if (key === "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80") {
      return { address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" };
    }
    return { address: "0x1234567890123456789012345678901234567890" };
  }),
}));

describe("x402_fee", () => {
  const originalEnv = { ...process.env };
  const VALID_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

  beforeEach(() => {
    process.env.FACILITATOR_WALLET_PRIVATE_KEY = VALID_PRIVATE_KEY;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ═══════════════════════════════════════════════════════════
  // getFeeAmount
  // ═══════════════════════════════════════════════════════════

  describe("getFeeAmount", () => {
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
      process.env.FACILITATOR_FEE_AMOUNT = "-100";
      expect(getFeeAmount()).toBe(10000n);
    });

    it("supports large fee amounts", () => {
      process.env.FACILITATOR_FEE_AMOUNT = "1000000"; // 1 USDC
      expect(getFeeAmount()).toBe(1000000n);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getFacilitatorAddress
  // ═══════════════════════════════════════════════════════════

  describe("getFacilitatorAddress", () => {
    it("returns address derived from private key", () => {
      const address = getFacilitatorAddress();
      expect(address).toBe("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    });

    it("returns null when private key is not set", () => {
      delete process.env.FACILITATOR_WALLET_PRIVATE_KEY;
      expect(getFacilitatorAddress()).toBeNull();
    });

    it("returns null for invalid (too short) private key", () => {
      process.env.FACILITATOR_WALLET_PRIVATE_KEY = "0xinvalid";
      expect(getFacilitatorAddress()).toBeNull();
    });

    it("handles private key without 0x prefix", () => {
      process.env.FACILITATOR_WALLET_PRIVATE_KEY =
        "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      const address = getFacilitatorAddress();
      expect(address).toBeTruthy();
    });

    it("handles private key with whitespace", () => {
      process.env.FACILITATOR_WALLET_PRIVATE_KEY = `  ${VALID_PRIVATE_KEY}  `;
      const address = getFacilitatorAddress();
      expect(address).toBe("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    });
  });

  // ═══════════════════════════════════════════════════════════
  // checkMerchantAllowance
  // ═══════════════════════════════════════════════════════════

  describe("checkMerchantAllowance", () => {
    const merchant = "0x209693Bc6afc0C5328bA36FaF03C514EF312287C";

    it("returns sufficient=true when allowance exceeds fee", async () => {
      const { getContract } = await import("viem");
      vi.mocked(getContract).mockReturnValue({
        read: {
          allowance: vi.fn().mockResolvedValue(100000n), // 0.10 USDC
        },
      });

      const result = await checkMerchantAllowance(merchant, "eip155:11155420");

      expect(result.sufficient).toBe(true);
      expect(result.allowance).toBe(100000n);
      expect(result.remainingSettlements).toBe(10); // 100000 / 10000
    });

    it("returns sufficient=false when allowance is zero", async () => {
      const { getContract } = await import("viem");
      vi.mocked(getContract).mockReturnValue({
        read: {
          allowance: vi.fn().mockResolvedValue(0n),
        },
      });

      const result = await checkMerchantAllowance(merchant, "eip155:11155420");

      expect(result.sufficient).toBe(false);
      expect(result.allowance).toBe(0n);
      expect(result.remainingSettlements).toBe(0);
    });

    it("returns sufficient=false when allowance is less than fee", async () => {
      const { getContract } = await import("viem");
      vi.mocked(getContract).mockReturnValue({
        read: {
          allowance: vi.fn().mockResolvedValue(5000n), // Half the fee
        },
      });

      const result = await checkMerchantAllowance(merchant, "eip155:11155420");

      expect(result.sufficient).toBe(false);
      expect(result.allowance).toBe(5000n);
    });

    it("returns sufficient=true when fee is 0 (fees disabled)", async () => {
      process.env.FACILITATOR_FEE_AMOUNT = "0";

      const result = await checkMerchantAllowance(merchant, "eip155:11155420");

      expect(result.sufficient).toBe(true);
      expect(result.remainingSettlements).toBe(Infinity);
    });

    it("returns insufficient when facilitator address not configured", async () => {
      delete process.env.FACILITATOR_WALLET_PRIVATE_KEY;

      const result = await checkMerchantAllowance(merchant, "eip155:11155420");

      expect(result.sufficient).toBe(false);
      expect(result.allowance).toBe(0n);
    });

    it("handles RPC errors gracefully (returns insufficient)", async () => {
      const { getContract } = await import("viem");
      vi.mocked(getContract).mockReturnValue({
        read: {
          allowance: vi.fn().mockRejectedValue(new Error("RPC timeout")),
        },
      });

      const result = await checkMerchantAllowance(merchant, "eip155:11155420");

      expect(result.sufficient).toBe(false);
      expect(result.allowance).toBe(0n);
    });

    it("correctly calculates remaining settlements", async () => {
      const { getContract } = await import("viem");
      vi.mocked(getContract).mockReturnValue({
        read: {
          allowance: vi.fn().mockResolvedValue(35000n), // 3.5 fees
        },
      });

      const result = await checkMerchantAllowance(merchant, "eip155:11155420");

      expect(result.sufficient).toBe(true);
      expect(result.remainingSettlements).toBe(3); // Floor(35000 / 10000)
    });
  });

  // ═══════════════════════════════════════════════════════════
  // collectFee
  // ═══════════════════════════════════════════════════════════

  describe("collectFee", () => {
    const merchant = "0x209693Bc6afc0C5328bA36FaF03C514EF312287C";

    it("skips fee collection when fee is 0", async () => {
      process.env.FACILITATOR_FEE_AMOUNT = "0";

      const result = await collectFee(merchant, "eip155:11155420");

      expect(result.success).toBe(true);
      expect(result.txHash).toBeUndefined();
    });

    it("returns error when private key not configured", async () => {
      delete process.env.FACILITATOR_WALLET_PRIVATE_KEY;

      const result = await collectFee(merchant, "eip155:11155420");

      expect(result.success).toBe(false);
      expect(result.error).toBe("facilitator_not_configured");
    });

    it("collects fee successfully via transferFrom", async () => {
      const mockTxHash = "0xfee1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab";
      const { getContract, createPublicClient } = await import("viem");

      vi.mocked(createPublicClient).mockReturnValue({
        waitForTransactionReceipt: vi.fn(async () => ({
          status: "success",
          transactionHash: mockTxHash,
        })),
      });

      vi.mocked(getContract).mockReturnValue({
        write: {
          transferFrom: vi.fn().mockResolvedValue(mockTxHash),
        },
      });

      const result = await collectFee(merchant, "eip155:11155420");

      expect(result.success).toBe(true);
      expect(result.txHash).toBe(mockTxHash);
    });

    it("returns error on reverted transaction", async () => {
      const mockTxHash = "0xfail234567890abcdef1234567890abcdef1234567890abcdef1234567890ab";
      const { getContract, createPublicClient } = await import("viem");

      vi.mocked(createPublicClient).mockReturnValue({
        waitForTransactionReceipt: vi.fn(async () => ({
          status: "reverted",
          transactionHash: mockTxHash,
        })),
      });

      vi.mocked(getContract).mockReturnValue({
        write: {
          transferFrom: vi.fn().mockResolvedValue(mockTxHash),
        },
      });

      const result = await collectFee(merchant, "eip155:11155420");

      expect(result.success).toBe(false);
      expect(result.txHash).toBe(mockTxHash);
      expect(result.error).toBe("fee_transaction_reverted");
    });

    it("returns insufficient_fee_allowance error", async () => {
      const { getContract } = await import("viem");
      vi.mocked(getContract).mockReturnValue({
        write: {
          transferFrom: vi.fn().mockRejectedValue(new Error("ERC20InsufficientAllowance")),
        },
      });

      const result = await collectFee(merchant, "eip155:11155420");

      expect(result.success).toBe(false);
      expect(result.error).toBe("insufficient_fee_allowance");
    });

    it("returns insufficient_merchant_balance error", async () => {
      const { getContract } = await import("viem");
      vi.mocked(getContract).mockReturnValue({
        write: {
          transferFrom: vi.fn().mockRejectedValue(new Error("ERC20InsufficientBalance")),
        },
      });

      const result = await collectFee(merchant, "eip155:11155420");

      expect(result.success).toBe(false);
      expect(result.error).toBe("insufficient_merchant_balance");
    });

    it("returns generic error for unknown failures", async () => {
      const { getContract } = await import("viem");
      vi.mocked(getContract).mockReturnValue({
        write: {
          transferFrom: vi.fn().mockRejectedValue(new Error("Network error")),
        },
      });

      const result = await collectFee(merchant, "eip155:11155420");

      expect(result.success).toBe(false);
      expect(result.error).toBe("fee_collection_failed");
    });
  });
});
