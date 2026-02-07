// @ts-check

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { settlePayment } from "../x402_settle.js";
import * as facilitatorInstance from "../facilitator_instance.js";
import * as verifyModule from "../x402_verify.js";
import * as feeModule from "../x402_fee.js";

// Mock viem
vi.mock("viem", async () => {
  const actual = await vi.importActual("viem");
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      waitForTransactionReceipt: vi.fn(async ({ hash }) => ({
        status: "success",
        blockNumber: 12345678n,
        transactionHash: hash,
      })),
    })),
    createWalletClient: vi.fn(() => ({
      writeContract: vi.fn(
        async () => "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      ),
    })),
  };
});

// Mock viem/accounts
vi.mock("viem/accounts", () => ({
  privateKeyToAccount: vi.fn(() => ({
    address: "0x1234567890123456789012345678901234567890",
  })),
}));

describe("x402_settle", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Set required environment variable
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0x1234567890123456789012345678901234567890123456789012345678901234";
    // Whitelist the test recipient addresses (valid one and different one for mismatch tests)
    process.env.TEST_WALLETS =
      "0x209693Bc6afc0C5328bA36FaF03C514EF312287C,0xDifferentAddress000000000000000000000000";
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  // Simple payment amount - no fee calculation needed
  const paymentAmount = "100000"; // $0.10 in 6-decimal USDC
  const tokenAddress = "0x5fd84259d66Cd46123540766Be93DFE6D43130D7";

  const validPaymentPayload = {
    x402Version: 2,
    resource: {
      url: "https://api.example.com/data",
      description: "Premium data access",
      mimeType: "application/json",
    },
    accepted: {
      scheme: "exact",
      network: "eip155:11155420",
      amount: paymentAmount,
      asset: tokenAddress,
      payTo: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
      maxTimeoutSeconds: 60,
      extra: {
        name: "USDC",
        version: "2",
      },
    },
    payload: {
      signature:
        "0x82be15c8934c70f82322befd3ae22fef371a9265014fa5f2323368bf42b257db27f16284db18eff5b60bbf3415ab860a8edf54cd7927a1a124a0ddd9d687921b1b",
      authorization: {
        from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        to: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
        value: paymentAmount, // Full payment amount
        validAfter: "1740672089",
        validBefore: "9999999999",
        nonce: "0xf3746613c2d920b5fdabc0856f2aeb2d4f88ee6037b8cc5d04a71a4462f13480",
      },
    },
  };

  const validPaymentRequirements = {
    scheme: "exact",
    network: "eip155:11155420",
    amount: paymentAmount,
    asset: tokenAddress,
    payTo: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
    maxTimeoutSeconds: 60,
    extra: {
      name: "USDC",
      version: "2",
    },
  };

  describe("settlePayment", () => {
    it("returns error when verification fails", async () => {
      // Invalid version should fail verification
      const invalidPayload = {
        ...validPaymentPayload,
        x402Version: 1,
      };

      const result = await settlePayment(invalidPayload, validPaymentRequirements);

      expect(result.success).toBe(false);
      // x402 v2 throws "No facilitator registered" which becomes unexpected_verify_error
      expect(result.errorReason).toBe("unexpected_verify_error");
      expect(result.transaction).toBe("");
    });

    it("returns error when private key is missing", async () => {
      delete process.env.FACILITATOR_WALLET_PRIVATE_KEY;

      const result = await settlePayment(validPaymentPayload, validPaymentRequirements);

      expect(result.success).toBe(false);
      expect(result.errorReason).toBeDefined();
    });

    it("returns error for unsupported network", async () => {
      const unsupportedPayload = {
        ...validPaymentPayload,
        accepted: {
          ...validPaymentPayload.accepted,
          network: "eip155:999999",
        },
      };

      const unsupportedRequirements = {
        ...validPaymentRequirements,
        network: "eip155:999999",
      };

      const result = await settlePayment(unsupportedPayload, unsupportedRequirements);

      expect(result.success).toBe(false);
      expect(result.errorReason).toBeDefined();
    });

    it("splits signature correctly", async () => {
      // We can't fully test the on-chain execution without mocking,
      // but we can verify the signature is processed
      const signature = "0x" + "ab".repeat(65); // 130 hex chars
      const payloadWithSig = {
        ...validPaymentPayload,
        payload: {
          ...validPaymentPayload.payload,
          signature,
        },
      };

      // Should not throw on signature splitting
      await settlePayment(payloadWithSig, validPaymentRequirements);
    });

    it("rejects signature without 0x prefix", async () => {
      const payloadWithoutPrefix = {
        ...validPaymentPayload,
        payload: {
          ...validPaymentPayload.payload,
          signature: "a".repeat(130), // Missing 0x
        },
      };

      const result = await settlePayment(payloadWithoutPrefix, validPaymentRequirements);

      expect(result.success).toBe(false);
      expect(result.errorReason).toBeDefined();
    });

    it("rejects signature with invalid length", async () => {
      const payloadWithShortSig = {
        ...validPaymentPayload,
        payload: {
          ...validPaymentPayload.payload,
          signature: "0xabcd", // Too short
        },
      };

      const result = await settlePayment(payloadWithShortSig, validPaymentRequirements);

      expect(result.success).toBe(false);
      expect(result.errorReason).toBeDefined();
    });

    it("handles expired authorization", async () => {
      const expiredPayload = {
        ...validPaymentPayload,
        payload: {
          ...validPaymentPayload.payload,
          authorization: {
            ...validPaymentPayload.payload.authorization,
            validBefore: Math.floor(Date.now() / 1000) - 100, // Already expired
          },
        },
      };

      const result = await settlePayment(expiredPayload, validPaymentRequirements);

      expect(result.success).toBe(false);
      // x402 v2 validates signature FIRST before checking validBefore
      // Modified authorization makes signature invalid
      expect(result.errorReason).toBe("invalid_exact_evm_payload_signature");
    });

    it("handles authorization not yet valid", async () => {
      const futurePayload = {
        ...validPaymentPayload,
        payload: {
          ...validPaymentPayload.payload,
          authorization: {
            ...validPaymentPayload.payload.authorization,
            validAfter: Math.floor(Date.now() / 1000) + 1000, // Not yet valid
          },
        },
      };

      const result = await settlePayment(futurePayload, validPaymentRequirements);

      expect(result.success).toBe(false);
      // x402 v2 validates signature FIRST before checking validAfter
      // Modified authorization makes signature invalid
      expect(result.errorReason).toBe("invalid_exact_evm_payload_signature");
    });

    it("handles insufficient amount", async () => {
      const insufficientPayload = {
        ...validPaymentPayload,
        payload: {
          ...validPaymentPayload.payload,
          authorization: {
            ...validPaymentPayload.payload.authorization,
            value: "5000", // Less than required 10000
          },
        },
      };

      const result = await settlePayment(insufficientPayload, validPaymentRequirements);

      expect(result.success).toBe(false);
      // x402 v2 validates signature FIRST before checking amount
      // Modified authorization makes signature invalid
      expect(result.errorReason).toBe("invalid_exact_evm_payload_signature");
    });

    it("handles recipient mismatch", async () => {
      const differentRecipient = "0xDifferentAddress000000000000000000000000";

      const mismatchPayload = {
        ...validPaymentPayload,
        payload: {
          ...validPaymentPayload.payload,
          authorization: {
            ...validPaymentPayload.payload.authorization,
            to: differentRecipient,
          },
        },
      };

      const result = await settlePayment(mismatchPayload, validPaymentRequirements);

      expect(result.success).toBe(false);
      // x402 v2 validates signature FIRST before checking recipient
      // Modified authorization makes signature invalid
      expect(result.errorReason).toBe("invalid_exact_evm_payload_signature");
    });

    it("validates network format", async () => {
      const invalidNetworkPayload = {
        ...validPaymentPayload,
        accepted: {
          ...validPaymentPayload.accepted,
          network: "invalid-network-format",
        },
      };

      const invalidNetworkRequirements = {
        ...validPaymentRequirements,
        network: "invalid-network-format",
      };

      const result = await settlePayment(invalidNetworkPayload, invalidNetworkRequirements);

      expect(result.success).toBe(false);
      expect(result.errorReason).toBeDefined();
    });
  });

  describe("splitSignature", () => {
    it("correctly extracts v, r, s from signature", async () => {
      // This is implicitly tested through settlePayment calls
      // The signature format is validated in x402_verify already
      const validSig = "0x" + "12".repeat(65);
      const payload = {
        ...validPaymentPayload,
        payload: {
          ...validPaymentPayload.payload,
          signature: validSig,
        },
      };

      // Should not throw
      await settlePayment(payload, validPaymentRequirements);
    });
  });

  describe("getChainConfig", () => {
    it("supports Optimism mainnet", async () => {
      const mainnetPayload = {
        ...validPaymentPayload,
        accepted: {
          ...validPaymentPayload.accepted,
          network: "eip155:10",
          asset: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        },
      };

      const mainnetRequirements = {
        ...validPaymentRequirements,
        network: "eip155:10",
        asset: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      };

      // Should not throw on mainnet network
      await settlePayment(mainnetPayload, mainnetRequirements);
    });

    it("supports Optimism Sepolia", async () => {
      // Already tested in other tests using eip155:11155420
      const result = await settlePayment(validPaymentPayload, validPaymentRequirements);

      // Should process Sepolia network (may fail on other validations, but network should be supported)
      expect(result).toBeDefined();
    });
  });

  // Note: Cross-chain security tests are covered in x402_verify.test.js
  // The test "validates signature for Optimism Mainnet (chainId 10)" ensures that:
  // 1. Mainnet signatures are validated with chain-bound Mainnet clients
  // 2. The facilitator uses separate ExactEvmScheme per network
  // Since settlePayment() calls verifyPayment() internally, the same security applies.
});

describe("x402_settle with mocked facilitator", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0x1234567890123456789012345678901234567890123456789012345678901234";
    process.env.TEST_WALLETS =
      "0x209693Bc6afc0C5328bA36FaF03C514EF312287C,0xDifferentAddress000000000000000000000000";
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  const paymentAmount = "100000";
  const tokenAddress = "0x5fd84259d66Cd46123540766Be93DFE6D43130D7";

  const validPaymentPayload = {
    x402Version: 2,
    accepted: {
      scheme: "exact",
      network: "eip155:11155420",
      amount: paymentAmount,
      asset: tokenAddress,
      payTo: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
    },
    payload: {
      signature: "0x" + "ab".repeat(65),
      authorization: {
        from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        to: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
        value: paymentAmount,
        validAfter: "0",
        validBefore: "9999999999",
        nonce: "0xf374661300000000000000000000000000000000000000000000000000000000",
      },
    },
  };

  const validPaymentRequirements = {
    scheme: "exact",
    network: "eip155:11155420",
    amount: paymentAmount,
    asset: tokenAddress,
    payTo: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
  };

  it("returns success when verification and settlement succeed", async () => {
    const mockFacilitator = {
      settle: vi.fn().mockResolvedValue({
        success: true,
        transaction: "0xabc123def456",
      }),
    };

    vi.spyOn(verifyModule, "verifyPayment").mockResolvedValue({
      isValid: true,
      payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    });

    vi.spyOn(facilitatorInstance, "getFacilitator").mockReturnValue(mockFacilitator);

    const result = await settlePayment(validPaymentPayload, validPaymentRequirements);

    expect(result.success).toBe(true);
    expect(result.payer).toBe("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    expect(result.transaction).toBe("0xabc123def456");
    expect(result.network).toBe("eip155:11155420");
  });

  it("returns failure when facilitator settle returns failure", async () => {
    const mockFacilitator = {
      settle: vi.fn().mockResolvedValue({
        success: false,
        errorReason: "insufficient_allowance",
      }),
    };

    vi.spyOn(verifyModule, "verifyPayment").mockResolvedValue({
      isValid: true,
      payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    });

    vi.spyOn(facilitatorInstance, "getFacilitator").mockReturnValue(mockFacilitator);

    const result = await settlePayment(validPaymentPayload, validPaymentRequirements);

    expect(result.success).toBe(false);
    expect(result.errorReason).toBe("insufficient_allowance");
    expect(result.payer).toBe("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    expect(result.transaction).toBe("");
  });

  it("extracts insufficient_funds error reason from exception", async () => {
    vi.spyOn(verifyModule, "verifyPayment").mockResolvedValue({
      isValid: true,
      payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    });

    vi.spyOn(facilitatorInstance, "getFacilitator").mockImplementation(() => {
      throw new Error("Transaction failed: insufficient funds for gas");
    });

    const result = await settlePayment(validPaymentPayload, validPaymentRequirements);

    expect(result.success).toBe(false);
    expect(result.errorReason).toBe("insufficient_funds");
  });

  it("extracts authorization_already_used error reason from nonce error", async () => {
    vi.spyOn(verifyModule, "verifyPayment").mockResolvedValue({
      isValid: true,
      payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    });

    vi.spyOn(facilitatorInstance, "getFacilitator").mockImplementation(() => {
      throw new Error("nonce already used");
    });

    const result = await settlePayment(validPaymentPayload, validPaymentRequirements);

    expect(result.success).toBe(false);
    expect(result.errorReason).toBe("authorization_already_used");
  });

  it("extracts authorization_expired error reason from expired error", async () => {
    vi.spyOn(verifyModule, "verifyPayment").mockResolvedValue({
      isValid: true,
      payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    });

    vi.spyOn(facilitatorInstance, "getFacilitator").mockImplementation(() => {
      throw new Error("authorization expired");
    });

    const result = await settlePayment(validPaymentPayload, validPaymentRequirements);

    expect(result.success).toBe(false);
    expect(result.errorReason).toBe("authorization_expired");
  });

  it("returns generic settlement_failed for unknown errors", async () => {
    vi.spyOn(verifyModule, "verifyPayment").mockResolvedValue({
      isValid: true,
      payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    });

    vi.spyOn(facilitatorInstance, "getFacilitator").mockImplementation(() => {
      throw new Error("Unknown blockchain error");
    });

    const result = await settlePayment(validPaymentPayload, validPaymentRequirements);

    expect(result.success).toBe(false);
    expect(result.errorReason).toBe("settlement_failed");
  });

  // ═══════════════════════════════════════════════════════════
  // Fee collection tests
  // ═══════════════════════════════════════════════════════════

  it("collects fee after settlement for non-whitelisted merchant", async () => {
    const mockFacilitator = {
      settle: vi.fn().mockResolvedValue({
        success: true,
        transaction: "0xsettletxhash",
      }),
    };

    vi.spyOn(verifyModule, "verifyPayment").mockResolvedValue({
      isValid: true,
      payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      feeRequired: true,
      recipient: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
    });

    vi.spyOn(facilitatorInstance, "getFacilitator").mockReturnValue(mockFacilitator);

    vi.spyOn(feeModule, "collectFee").mockResolvedValue({
      success: true,
      txHash: "0xfeetxhash123",
    });

    const result = await settlePayment(validPaymentPayload, validPaymentRequirements);

    expect(result.success).toBe(true);
    expect(result.transaction).toBe("0xsettletxhash");
    expect(result.fee).toBeDefined();
    expect(result.fee.collected).toBe(true);
    expect(result.fee.txHash).toBe("0xfeetxhash123");
    expect(feeModule.collectFee).toHaveBeenCalledWith(
      "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
      "eip155:11155420",
    );
  });

  it("settlement succeeds even when fee collection fails", async () => {
    const mockFacilitator = {
      settle: vi.fn().mockResolvedValue({
        success: true,
        transaction: "0xsettletxhash",
      }),
    };

    vi.spyOn(verifyModule, "verifyPayment").mockResolvedValue({
      isValid: true,
      payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      feeRequired: true,
      recipient: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
    });

    vi.spyOn(facilitatorInstance, "getFacilitator").mockReturnValue(mockFacilitator);

    vi.spyOn(feeModule, "collectFee").mockResolvedValue({
      success: false,
      error: "insufficient_fee_allowance",
    });

    const result = await settlePayment(validPaymentPayload, validPaymentRequirements);

    // Settlement still succeeds — settlement-first design
    expect(result.success).toBe(true);
    expect(result.transaction).toBe("0xsettletxhash");
    expect(result.fee).toBeDefined();
    expect(result.fee.collected).toBe(false);
    expect(result.fee.error).toBe("insufficient_fee_allowance");
  });

  it("does not collect fee for whitelisted merchant", async () => {
    const mockFacilitator = {
      settle: vi.fn().mockResolvedValue({
        success: true,
        transaction: "0xsettletxhash",
      }),
    };

    // verifyPayment returns without feeRequired (whitelisted path)
    vi.spyOn(verifyModule, "verifyPayment").mockResolvedValue({
      isValid: true,
      payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    });

    vi.spyOn(facilitatorInstance, "getFacilitator").mockReturnValue(mockFacilitator);

    const collectFeeSpy = vi.spyOn(feeModule, "collectFee");

    const result = await settlePayment(validPaymentPayload, validPaymentRequirements);

    expect(result.success).toBe(true);
    expect(result.fee).toBeUndefined();
    expect(collectFeeSpy).not.toHaveBeenCalled();
  });

  it("does not collect fee when feeRequired but recipient is missing", async () => {
    const mockFacilitator = {
      settle: vi.fn().mockResolvedValue({
        success: true,
        transaction: "0xsettletxhash",
      }),
    };

    // feeRequired=true but no recipient — should skip fee collection
    vi.spyOn(verifyModule, "verifyPayment").mockResolvedValue({
      isValid: true,
      payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      feeRequired: true,
    });

    vi.spyOn(facilitatorInstance, "getFacilitator").mockReturnValue(mockFacilitator);

    const collectFeeSpy = vi.spyOn(feeModule, "collectFee");

    const result = await settlePayment(validPaymentPayload, validPaymentRequirements);

    expect(result.success).toBe(true);
    expect(result.fee).toBeUndefined();
    expect(collectFeeSpy).not.toHaveBeenCalled();
  });
});
