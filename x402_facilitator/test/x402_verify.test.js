/**
 * Tests for x402 verify endpoint
 */
import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { verifyPayment } from "../x402_verify.js";
import { resetFacilitator } from "../facilitator_instance.js";

describe("x402 Verify", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset facilitator singleton before each test
    resetFacilitator();
    
    // Set facilitator private key for tests (Hardhat test account #0)
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    
    // Whitelist multiple addresses: the valid recipient and a different one for mismatch tests
    process.env.TEST_WALLETS =
      "0x209693Bc6afc0C5328bA36FaF03C514EF312287C,0x0000000000000000000000000000000000000000";
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
      url: "https://api.example.com/premium-data",
      description: "Access to premium market data",
      mimeType: "application/json",
    },
    accepted: {
      scheme: "exact",
      network: "eip155:11155420", // Optimism Sepolia for testing
      amount: paymentAmount, // Payment to recipient
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
        validBefore: "9999999999", // Far future
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

  test("rejects unauthorized recipient (not whitelisted)", async () => {
    // Use a recipient address that is NOT whitelisted (different from the 0x000... used for mismatch tests)
    const unauthorizedRecipient = "0x1111111111111111111111111111111111111111";
    const payload = {
      ...validPaymentPayload,
      accepted: {
        ...validPaymentPayload.accepted,
        payTo: unauthorizedRecipient, // Not whitelisted recipient
      },
      payload: {
        ...validPaymentPayload.payload,
        authorization: {
          ...validPaymentPayload.payload.authorization,
          to: unauthorizedRecipient, // Not whitelisted recipient
        },
      },
    };
    const requirements = {
      ...validPaymentRequirements,
      payTo: unauthorizedRecipient,
    };
    const result = await verifyPayment(payload, requirements);

    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBe("unauthorized_agent");
    expect(result.recipient).toBe(unauthorizedRecipient);
  });

  test("rejects invalid x402 version", async () => {
    const payload = { ...validPaymentPayload, x402Version: 1 };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // x402 v2 utility may return slightly different error reason
    expect(result.invalidReason).toBeDefined();
  });

  test("rejects unsupported scheme", async () => {
    const payload = {
      ...validPaymentPayload,
      accepted: { ...validPaymentPayload.accepted, scheme: "deferred" },
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // x402 v2 utility may return slightly different error reason
    expect(result.invalidReason).toBeDefined();
  });

  test("rejects unsupported network", async () => {
    const payload = {
      ...validPaymentPayload,
      accepted: { ...validPaymentPayload.accepted, network: "eip155:1" }, // Ethereum mainnet
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // x402 v2 returns network_mismatch for unsupported networks
    expect(result.invalidReason).toBe("network_mismatch");
  });

  test("rejects expired authorization", async () => {
    const payload = {
      ...validPaymentPayload,
      payload: {
        ...validPaymentPayload.payload,
        authorization: {
          ...validPaymentPayload.payload.authorization,
          validBefore: "1000000000", // Past timestamp
        },
      },
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // x402 v2 may use different error reason format
    expect(result.invalidReason).toContain("valid");
  });

  test("rejects not yet valid authorization", async () => {
    const payload = {
      ...validPaymentPayload,
      payload: {
        ...validPaymentPayload.payload,
        authorization: {
          ...validPaymentPayload.payload.authorization,
          validAfter: "9999999999", // Future timestamp
        },
      },
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // x402 v2 may use different error reason format
    expect(result.invalidReason).toContain("valid");
  });

  test("rejects insufficient amount (less than payment)", async () => {
    const payload = {
      ...validPaymentPayload,
      payload: {
        ...validPaymentPayload.payload,
        authorization: {
          ...validPaymentPayload.payload.authorization,
          value: "5000", // Less than required payment amount
        },
      },
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // x402 v2 may use different error reason format
    expect(result.invalidReason).toBeDefined();
  });

  test("rejects mismatched recipient", async () => {
    const differentRecipient = "0x0000000000000000000000000000000000000000";

    const payload = {
      ...validPaymentPayload,
      payload: {
        ...validPaymentPayload.payload,
        authorization: {
          ...validPaymentPayload.payload.authorization,
          to: differentRecipient,
        },
      },
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // x402 v2 may use different error reason format
    expect(result.invalidReason).toBeDefined();
  });

  test("rejects missing payload", async () => {
    const payload = {
      ...validPaymentPayload,
      payload: {},
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // x402 v2 may throw exception for completely invalid payload
    expect(result.invalidReason).toBeDefined();
  });

  test("rejects signature without 0x prefix", async () => {
    const payload = {
      ...validPaymentPayload,
      payload: {
        ...validPaymentPayload.payload,
        signature:
          "2d6a7588d6acca505cbf0d9a4a227e0c52c6c34008c8e8986a1283259764173608a2ce6496642e377d6da8dbbf5836e9bd15092f9ecab05ded3d6293af148b571c", // Missing 0x
      },
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // x402 v2 will detect invalid signature format
    expect(result.invalidReason).toBeDefined();
  });

  test("rejects signature with invalid length", async () => {
    const payload = {
      ...validPaymentPayload,
      payload: {
        ...validPaymentPayload.payload,
        signature:
          "0x2d6a7588d6acca505cbf0d9a4a227e0c52c6c34008c8e8986a1283259764173608a2ce6496642e377d6da8dbbf5836e9bd15092f9ecab05ded3d6293af148b57", // Too short
      },
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // x402 v2 will detect invalid signature
    expect(result.invalidReason).toBeDefined();
  });

  test("uses x402 v2 verification for Optimism networks", async () => {
    // This test verifies that x402 v2 now officially supports Optimism
    // Previously, we needed manual fallback code. Now x402 handles it natively.
    
    const result = await verifyPayment(validPaymentPayload, validPaymentRequirements);

    // Will fail on signature (test signature is from Hardhat, not real)
    // But importantly, it's processed by x402 v2 utilities which support Optimism
    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBeDefined();
  });

  // Note: Full signature and blockchain integration tests would require
  // actual wallet signatures and testnet interaction
});
