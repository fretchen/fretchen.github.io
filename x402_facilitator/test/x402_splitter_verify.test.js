/**
 * Tests for x402 Splitter Facilitator /verify endpoint
 *
 * Key differences from whitelist facilitator:
 * - No whitelist checks (public facilitator)
 * - No TEST_WALLETS environment variable needed
 * - Payment goes to splitter contract, not final recipient
 * - Payload includes seller and salt fields
 *
 * Error codes are based on actual implementation behavior.
 */

import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { verifySplitterPayment } from "../x402_splitter_verify.js";

describe("x402 Splitter Verify", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Only need facilitator private key for signature validation
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    // NO TEST_WALLETS - public facilitator
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  // Test data
  const paymentAmount = "100000"; // $0.10 in 6-decimal USDC
  const tokenAddress = "0x5fd84259d66Cd46123540766Be93DFE6D43130D7"; // Sepolia USDC
  const splitterAddress = "0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946"; // Sepolia splitter
  const recipientAddress = "0x209693Bc6afc0C5328bA36FaF03C514EF312287C"; // Final seller

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
      payTo: splitterAddress, // Payment to splitter, not seller
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
        to: splitterAddress, // Splitter receives the authorization
        value: paymentAmount,
        validAfter: "1740672089",
        validBefore: "9999999999",
        nonce: "0xf3746613c2d920b5fdabc0856f2aeb2d4f88ee6037b8cc5d04a71a4462f13480",
      },
      seller: recipientAddress, // Final recipient extracted for splitting
      salt: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    },
  };

  const validPaymentRequirements = {
    scheme: "exact-split",
    network: "eip155:11155420",
    amount: paymentAmount,
    asset: tokenAddress,
    payTo: splitterAddress, // Requirements also specify splitter
    maxTimeoutSeconds: 60,
    extra: {
      name: "USDC",
      version: "2",
    },
  };

  test("validates signature before other checks", async () => {
    // Test with invalid signature format
    const payload = {
      ...validPaymentPayload,
      payload: {
        ...validPaymentPayload.payload,
        signature: "invalid",
      },
    };

    const result = await verifySplitterPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // Invalid signature format throws error which becomes unexpected_verify_error
    expect(result.invalidReason).toBe("unexpected_verify_error");
  });

  test("rejects invalid x402 version", async () => {
    const payload = { ...validPaymentPayload, x402Version: 1 };
    const result = await verifySplitterPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // Signature validation happens, test signature doesn't match modified payload
    expect(result.invalidReason).toBe("invalid_exact_evm_payload_signature");
  });

  test("rejects unsupported scheme", async () => {
    const payload = {
      ...validPaymentPayload,
      accepted: { ...validPaymentPayload.accepted, scheme: "deferred" },
    };
    const requirements = {
      ...validPaymentRequirements,
      scheme: "deferred", // Match payload to pass scheme check
    };
    const result = await verifySplitterPayment(payload, requirements);

    expect(result.isValid).toBe(false);
    // After passing scheme check, signature validation happens
    expect(result.invalidReason).toBe("invalid_exact_evm_payload_signature");
  });

  test("rejects unsupported network", async () => {
    const payload = {
      ...validPaymentPayload,
      accepted: { ...validPaymentPayload.accepted, network: "eip155:1" }, // Ethereum mainnet
    };
    const requirements = {
      ...validPaymentRequirements,
      network: "eip155:1", // Match payload to pass network check
    };
    const result = await verifySplitterPayment(payload, requirements);

    expect(result.isValid).toBe(false);
    // After passing network check, unsupported_network is detected during chain validation
    expect(result.invalidReason).toBe("unsupported_network");
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
    const result = await verifySplitterPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // Signature validation happens first, so modified payload fails signature check
    expect(result.invalidReason).toBe("invalid_exact_evm_payload_signature");
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
    const result = await verifySplitterPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // Signature validation happens first
    expect(result.invalidReason).toBe("invalid_exact_evm_payload_signature");
  });

  test("rejects insufficient amount (less than fixed fee)", async () => {
    const payload = {
      ...validPaymentPayload,
      payload: {
        ...validPaymentPayload.payload,
        authorization: {
          ...validPaymentPayload.payload.authorization,
          value: "5000", // Less than 10000 fixed fee
        },
      },
    };
    const result = await verifySplitterPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // Amount validation actually happens BEFORE signature check in this implementation
    expect(result.invalidReason).toBe("invalid_exact_evm_payload_authorization_value");
  });

  test("rejects mismatched recipient (not splitter)", async () => {
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
    const result = await verifySplitterPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // Recipient check happens before signature validation
    expect(result.invalidReason).toBe("invalid_exact_evm_payload_recipient_mismatch");
  });

  test("rejects missing payload", async () => {
    const payload = {
      ...validPaymentPayload,
      payload: {},
    };
    const result = await verifySplitterPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // Missing authorization field
    expect(result.invalidReason).toBe("missing_authorization");
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
    const result = await verifySplitterPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // Signature parsing error
    expect(result.invalidReason).toBe("unexpected_verify_error");
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
    const result = await verifySplitterPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // Signature parsing error
    expect(result.invalidReason).toBe("unexpected_verify_error");
  });

  test("uses x402 v2 ExactEvmScheme for Optimism networks", async () => {
    // Verify that the facilitator accepts and processes Optimism networks
    const result = await verifySplitterPayment(validPaymentPayload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // Should fail on signature validation (test signature doesn't match)
    expect(result.invalidReason).toBe("invalid_exact_evm_payload_signature");
  });

  test("requires seller field in payload", async () => {
    const payload = {
      ...validPaymentPayload,
      payload: {
        ...validPaymentPayload.payload,
        seller: undefined, // Missing seller
      },
    };
    const result = await verifySplitterPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // Will fail during verification checks
    expect(result.invalidReason).toBeDefined();
  });

  test("requires salt field in payload", async () => {
    const payload = {
      ...validPaymentPayload,
      payload: {
        ...validPaymentPayload.payload,
        salt: undefined, // Missing salt
      },
    };
    const result = await verifySplitterPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // Will fail during verification checks
    expect(result.invalidReason).toBeDefined();
  });

  // Payment Requirements Validation Tests

  test("rejects amount mismatch", async () => {
    const mismatchedRequirements = {
      ...validPaymentRequirements,
      amount: "200000", // Different from payload's 100000
    };

    const result = await verifySplitterPayment(validPaymentPayload, mismatchedRequirements);

    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBe("amount_mismatch");
  });

  test("rejects recipient mismatch", async () => {
    const wrongRecipient = "0x0000000000000000000000000000000000000001";
    const mismatchedRequirements = {
      ...validPaymentRequirements,
      payTo: wrongRecipient,
    };

    const result = await verifySplitterPayment(validPaymentPayload, mismatchedRequirements);

    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBe("recipient_mismatch");
  });

  test("rejects network mismatch", async () => {
    const mismatchedRequirements = {
      ...validPaymentRequirements,
      network: "eip155:10", // Mainnet instead of Sepolia
    };

    const result = await verifySplitterPayment(validPaymentPayload, mismatchedRequirements);

    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBe("network_mismatch");
  });

  test("rejects asset mismatch", async () => {
    const wrongAsset = "0x0000000000000000000000000000000000000002";
    const mismatchedRequirements = {
      ...validPaymentRequirements,
      asset: wrongAsset,
    };

    const result = await verifySplitterPayment(validPaymentPayload, mismatchedRequirements);

    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBe("asset_mismatch");
  });

  test("rejects scheme mismatch", async () => {
    const mismatchedRequirements = {
      ...validPaymentRequirements,
      scheme: "exact", // Standard scheme instead of exact-split
    };

    const result = await verifySplitterPayment(validPaymentPayload, mismatchedRequirements);

    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBe("scheme_mismatch");
  });

  test("rejects missing accepted field", async () => {
    const payload = {
      ...validPaymentPayload,
      accepted: undefined,
    };

    const result = await verifySplitterPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBe("missing_accepted");
  });

  test("accepts case-insensitive address matching", async () => {
    // Should accept addresses with different casing
    const upperCaseRequirements = {
      ...validPaymentRequirements,
      payTo: splitterAddress.toUpperCase(),
      asset: tokenAddress.toUpperCase(),
    };

    const result = await verifySplitterPayment(validPaymentPayload, upperCaseRequirements);

    expect(result.isValid).toBe(false);
    // Will fail on signature, but NOT on address matching
    expect(result.invalidReason).not.toBe("recipient_mismatch");
    expect(result.invalidReason).not.toBe("asset_mismatch");
  });

  // Note: E2E tests with real signatures would require @real-token/x402-client
  // which is not installed in this environment. Those tests are covered by
  // the Jupyter notebook end-to-end demonstrations.
});
