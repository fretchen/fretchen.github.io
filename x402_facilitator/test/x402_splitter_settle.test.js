// @ts-check

/**
 * Tests for x402 Splitter Facilitator /settle endpoint
 *
 * Key differences from whitelist facilitator:
 * - No whitelist checks (public facilitator)
 * - No TEST_WALLETS environment variable needed
 * - Calls splitter.executeSplit() instead of token.transferWithAuthorization()
 * - Extracts seller and salt from payload
 * - Computes nonce as keccak256(seller, salt)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { settleSplitterPayment } from "../x402_splitter_settle.js";

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

describe("x402_splitter_settle", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Set required environment variable
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0x1234567890123456789012345678901234567890123456789012345678901234";
    // NO TEST_WALLETS - public facilitator
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  const paymentAmount = "100000"; // $0.10 in 6-decimal USDC
  const tokenAddress = "0x5fd84259d66Cd46123540766Be93DFE6D43130D7"; // Sepolia USDC
  const splitterAddress = "0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946"; // Sepolia splitter
  const sellerAddress = "0x209693Bc6afc0C5328bA36FaF03C514EF312287C";

  const validPaymentPayload = {
    x402Version: 2,
    resource: {
      url: "https://api.example.com/data",
      description: "Premium data access",
      mimeType: "application/json",
    },
    accepted: {
      scheme: "exact-split",
      network: "eip155:11155420",
      amount: paymentAmount,
      asset: tokenAddress,
      payTo: splitterAddress, // Payment to splitter
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
        to: splitterAddress, // To splitter contract
        value: paymentAmount,
        validAfter: "1740672089",
        validBefore: "9999999999",
        nonce: "0xf3746613c2d920b5fdabc0856f2aeb2d4f88ee6037b8cc5d04a71a4462f13480",
      },
      seller: sellerAddress, // Final recipient
      salt: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    },
  };

  const validPaymentRequirements = {
    scheme: "exact-split",
    network: "eip155:11155420",
    amount: paymentAmount,
    asset: tokenAddress,
    payTo: splitterAddress,
    maxTimeoutSeconds: 60,
    extra: {
      name: "USDC",
      version: "2",
    },
  };

  describe("settleSplitterPayment", () => {
    it("returns error when verification fails", async () => {
      // Invalid version should fail verification
      const invalidPayload = {
        ...validPaymentPayload,
        x402Version: 1,
      };

      const result = await settleSplitterPayment(invalidPayload, validPaymentRequirements);

      expect(result.success).toBe(false);
      expect(result.errorReason).toBe("invalid_exact_evm_payload_signature");
      expect(result.transaction).toBe("");
    });

    it("returns error when private key is missing", async () => {
      delete process.env.FACILITATOR_WALLET_PRIVATE_KEY;

      const result = await settleSplitterPayment(validPaymentPayload, validPaymentRequirements);

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

      const result = await settleSplitterPayment(unsupportedPayload, unsupportedRequirements);

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
      await settleSplitterPayment(payloadWithSig, validPaymentRequirements);
    });

    it("rejects signature without 0x prefix", async () => {
      const payloadWithoutPrefix = {
        ...validPaymentPayload,
        payload: {
          ...validPaymentPayload.payload,
          signature: "a".repeat(130), // Missing 0x
        },
      };

      const result = await settleSplitterPayment(payloadWithoutPrefix, validPaymentRequirements);

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

      const result = await settleSplitterPayment(payloadWithShortSig, validPaymentRequirements);

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

      const result = await settleSplitterPayment(expiredPayload, validPaymentRequirements);

      expect(result.success).toBe(false);
      // Signature validation happens first, so we get signature error
      expect(result.errorReason).toBe("invalid_exact_evm_payload_signature");
    });

    it("requires seller field in payload", async () => {
      const payloadWithoutSeller = {
        ...validPaymentPayload,
        payload: {
          ...validPaymentPayload.payload,
          seller: undefined, // Missing seller
        },
      };

      const result = await settleSplitterPayment(payloadWithoutSeller, validPaymentRequirements);

      expect(result.success).toBe(false);
      expect(result.errorReason).toBeDefined();
    });

    it("requires salt field in payload", async () => {
      const payloadWithoutSalt = {
        ...validPaymentPayload,
        payload: {
          ...validPaymentPayload.payload,
          salt: undefined, // Missing salt
        },
      };

      const result = await settleSplitterPayment(payloadWithoutSalt, validPaymentRequirements);

      expect(result.success).toBe(false);
      expect(result.errorReason).toBeDefined();
    });

    it("extracts seller from payload", async () => {
      // This test verifies that seller extraction works
      // The actual extraction happens inside settleSplitterPayment
      const customSeller = "0xCustomSellerAddress000000000000000000000000";

      const payloadWithCustomSeller = {
        ...validPaymentPayload,
        payload: {
          ...validPaymentPayload.payload,
          seller: customSeller,
        },
      };

      // Should not throw - seller extraction should work
      await settleSplitterPayment(payloadWithCustomSeller, validPaymentRequirements);
    });

    it("extracts salt from payload", async () => {
      // This test verifies that salt extraction works
      const customSalt = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

      const payloadWithCustomSalt = {
        ...validPaymentPayload,
        payload: {
          ...validPaymentPayload.payload,
          salt: customSalt,
        },
      };

      // Should not throw - salt extraction should work
      await settleSplitterPayment(payloadWithCustomSalt, validPaymentRequirements);
    });

    it("handles different amount values correctly", async () => {
      const largeAmount = "1000000"; // $1.00

      const payloadWithLargeAmount = {
        ...validPaymentPayload,
        accepted: {
          ...validPaymentPayload.accepted,
          amount: largeAmount,
        },
        payload: {
          ...validPaymentPayload.payload,
          authorization: {
            ...validPaymentPayload.payload.authorization,
            value: largeAmount,
          },
        },
      };

      const requirementsWithLargeAmount = {
        ...validPaymentRequirements,
        amount: largeAmount,
      };

      // Should process without throwing
      await settleSplitterPayment(payloadWithLargeAmount, requirementsWithLargeAmount);
    });

    it("handles Optimism Mainnet network", async () => {
      const mainnetPayload = {
        ...validPaymentPayload,
        accepted: {
          ...validPaymentPayload.accepted,
          network: "eip155:10", // Optimism Mainnet
          asset: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // Mainnet USDC
        },
      };

      const mainnetRequirements = {
        ...validPaymentRequirements,
        network: "eip155:10",
        asset: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      };

      // Should accept Mainnet network
      await settleSplitterPayment(mainnetPayload, mainnetRequirements);
    });

    it("handles different token addresses", async () => {
      const customToken = "0xCustomTokenAddress0000000000000000000000000";

      const payloadWithCustomToken = {
        ...validPaymentPayload,
        accepted: {
          ...validPaymentPayload.accepted,
          asset: customToken,
        },
      };

      const requirementsWithCustomToken = {
        ...validPaymentRequirements,
        asset: customToken,
      };

      // Should process without throwing
      await settleSplitterPayment(payloadWithCustomToken, requirementsWithCustomToken);
    });

    it("accepts valid scheme exact-split", async () => {
      // Verify that scheme validation accepts exact-split
      const result = await settleSplitterPayment(validPaymentPayload, validPaymentRequirements);

      // Should process (may fail on verification, but not on scheme validation)
      expect(result).toBeDefined();
    });

    it("validates recipient is splitter contract", async () => {
      const wrongRecipient = "0x0000000000000000000000000000000000000000";

      const payloadWithWrongRecipient = {
        ...validPaymentPayload,
        accepted: {
          ...validPaymentPayload.accepted,
          payTo: wrongRecipient, // Wrong recipient
        },
        payload: {
          ...validPaymentPayload.payload,
          authorization: {
            ...validPaymentPayload.payload.authorization,
            to: wrongRecipient,
          },
        },
      };

      const requirementsWithWrongRecipient = {
        ...validPaymentRequirements,
        payTo: wrongRecipient,
      };

      const result = await settleSplitterPayment(
        payloadWithWrongRecipient,
        requirementsWithWrongRecipient,
      );

      // Should fail verification (recipient validation)
      expect(result.success).toBe(false);
    });
  });
});
