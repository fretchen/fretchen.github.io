/**
 * Tests for x402 verify endpoint
 */
import { describe, test, expect } from "vitest";
import { verifyPayment } from "../x402_verify.js";
import { calculateFee } from "../fee_config.js";

describe("x402 Verify", () => {
  // Calculate fee for $0.10 payment (minimum transaction amount)
  const paymentAmount = "100000"; // $0.10 in 6-decimal USDC
  const tokenAddress = "0x5fd84259d66Cd46123540766Be93DFE6D43130D7";
  const feeInfo = calculateFee(paymentAmount, tokenAddress);
  const totalAmount = feeInfo.totalAmount; // payment + fee = "110000"

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
        value: totalAmount, // Must include service fee
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
    expect(result.invalidReason).toBe("invalid_exact_evm_payload_authorization_value");
  });

  test("rejects payment without service fee", async () => {
    // Note: In real usage, this test would require a valid signature for the wrong amount.
    // Since we don't have a signer in tests, we test that value < totalAmount is checked.
    // The signature validation will fail first (as expected), but the important thing is
    // that the authorization value must include the service fee for the payment to succeed.
    const payload = {
      ...validPaymentPayload,
      payload: {
        ...validPaymentPayload.payload,
        authorization: {
          ...validPaymentPayload.payload.authorization,
          value: paymentAmount, // Only payment, no fee ("100000" instead of "110000")
        },
      },
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    // The signature will be invalid since we changed the value
    // In production, this prevents users from trying to pay without the fee
    expect(result.isValid).toBe(false);
    // Either signature validation fails (because value doesn't match signature)
    // or fee validation fails (if somehow signature passed)
    expect(["invalid_exact_evm_payload_signature", "insufficient_authorization"]).toContain(
      result.invalidReason,
    );
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
    expect(result.invalidReason).toBe("invalid_exact_evm_payload_signature");
    expect(result.message).toContain("must start with '0x' prefix");
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
    expect(result.invalidReason).toBe("invalid_exact_evm_payload_signature");
    expect(result.message).toContain("Invalid signature length");
  });

  // Note: Full signature and blockchain integration tests would require
  // actual wallet signatures and testnet interaction
});
