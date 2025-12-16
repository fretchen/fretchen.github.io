/**
 * Tests for x402 verify endpoint
 */
import { describe, test, expect, beforeEach, vi } from "vitest";
import { verifyPayment } from "../x402_verify.js";

describe("x402 Verify", () => {
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
      amount: "10000",
      asset: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
      payTo: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
      maxTimeoutSeconds: 60,
      extra: {
        name: "USDC",
        version: "2",
      },
    },
    payload: {
      signature:
        "0x2d6a7588d6acca505cbf0d9a4a227e0c52c6c34008c8e8986a1283259764173608a2ce6496642e377d6da8dbbf5836e9bd15092f9ecab05ded3d6293af148b571c",
      authorization: {
        from: "0x857b06519E91e3A54538791bDbb0E22373e36b66",
        to: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
        value: "10000",
        validAfter: "1740672089",
        validBefore: "9999999999", // Far future
        nonce: "0xf3746613c2d920b5fdabc0856f2aeb2d4f88ee6037b8cc5d04a71a4462f13480",
      },
    },
  };

  const validPaymentRequirements = {
    scheme: "exact",
    network: "eip155:11155420",
    amount: "10000",
    asset: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    payTo: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
    maxTimeoutSeconds: 60,
    extra: {
      name: "USDC",
      version: "2",
    },
  };

  test("rejects invalid x402 version", async () => {
    const payload = { ...validPaymentPayload, x402Version: 1 };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBe("invalid_x402_version");
  });

  test("rejects unsupported scheme", async () => {
    const payload = {
      ...validPaymentPayload,
      accepted: { ...validPaymentPayload.accepted, scheme: "deferred" },
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBe("unsupported_scheme");
  });

  test("rejects unsupported network", async () => {
    const payload = {
      ...validPaymentPayload,
      accepted: { ...validPaymentPayload.accepted, network: "eip155:1" }, // Ethereum mainnet
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBe("invalid_network");
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
    expect(result.invalidReason).toBe("invalid_exact_evm_payload_authorization_valid_before");
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
    expect(result.invalidReason).toBe("invalid_exact_evm_payload_authorization_valid_after");
  });

  test("rejects insufficient amount", async () => {
    const payload = {
      ...validPaymentPayload,
      payload: {
        ...validPaymentPayload.payload,
        authorization: {
          ...validPaymentPayload.payload.authorization,
          value: "5000", // Less than required 10000
        },
      },
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBe("invalid_exact_evm_payload_authorization_value");
  });

  test("rejects mismatched recipient", async () => {
    const payload = {
      ...validPaymentPayload,
      payload: {
        ...validPaymentPayload.payload,
        authorization: {
          ...validPaymentPayload.payload.authorization,
          to: "0x0000000000000000000000000000000000000000",
        },
      },
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBe("invalid_exact_evm_payload_recipient_mismatch");
  });

  test("rejects missing payload", async () => {
    const payload = {
      ...validPaymentPayload,
      payload: {},
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBe("invalid_payload");
  });

  // Note: Full signature and blockchain integration tests would require
  // actual wallet signatures and testnet interaction
});
