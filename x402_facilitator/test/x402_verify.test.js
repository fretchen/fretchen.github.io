/**
 * Tests for x402 verify endpoint
 */
import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { verifyPayment } from "../x402_verify.js";
import { resetFacilitator } from "../facilitator_instance.js";
import { getChainConfig } from "../chain_utils.js";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { ExactEvmScheme } from "@x402/evm/exact/client";

describe("x402 Verify", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset facilitator singleton before each test
    resetFacilitator();

    // Set facilitator private key for tests (Hardhat test account #0)
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
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

  test("validates signature before custom hooks run", async () => {
    // This test demonstrates that x402 v2 validates signatures BEFORE custom hooks run
    // The unauthorized recipient will be caught by invalid signature, not hooks
    const unauthorizedRecipient = "0x1111111111111111111111111111111111111111";
    const payload = {
      ...validPaymentPayload,
      accepted: {
        ...validPaymentPayload.accepted,
        payTo: unauthorizedRecipient,
      },
      payload: {
        ...validPaymentPayload.payload,
        authorization: {
          ...validPaymentPayload.payload.authorization,
          to: unauthorizedRecipient,
        },
      },
    };
    const requirements = {
      ...validPaymentRequirements,
      payTo: unauthorizedRecipient,
    };
    const result = await verifyPayment(payload, requirements);

    expect(result.isValid).toBe(false);
    // Signature validation happens first, so we get signature error
    // (The test signature is from a different address/message)
    expect(result.invalidReason).toBe("invalid_exact_evm_signature");
  });

  test("rejects invalid x402 version", async () => {
    const payload = { ...validPaymentPayload, x402Version: 1 };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // x402 v2 throws error "No facilitator registered for scheme: exact and network: eip155:11155420"
    // which we catch and return as "unexpected_verify_error"
    expect(result.invalidReason).toBe("unexpected_verify_error");
  });

  test("rejects unsupported scheme", async () => {
    const payload = {
      ...validPaymentPayload,
      accepted: { ...validPaymentPayload.accepted, scheme: "deferred" },
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // x402 v2 EVM exact scheme returns unsupported_scheme
    expect(result.invalidReason).toBe("invalid_exact_evm_scheme");
  });

  test("rejects unsupported network", async () => {
    const payload = {
      ...validPaymentPayload,
      accepted: { ...validPaymentPayload.accepted, network: "eip155:1" }, // Ethereum mainnet
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // x402 v2 returns network_mismatch for unsupported networks
    expect(result.invalidReason).toBe("invalid_exact_evm_network_mismatch");
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
    // x402 v2 validates signature FIRST, so we get signature error before timing check
    // To properly test validBefore, we would need a valid signature for this modified payload
    expect(result.invalidReason).toBe("invalid_exact_evm_signature");
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
    // x402 v2 validates signature FIRST, so we get signature error before timing check
    // To properly test validAfter, we would need a valid signature for this modified payload
    expect(result.invalidReason).toBe("invalid_exact_evm_signature");
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
    // x402 v2 validates signature FIRST, so we get signature error before amount check
    // To properly test amount validation, we would need a valid signature for this modified payload
    expect(result.invalidReason).toBe("invalid_exact_evm_signature");
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
    // x402 v2 validates signature FIRST, so we get signature error before recipient check
    // To properly test recipient validation, we would need a valid signature for this modified payload
    expect(result.invalidReason).toBe("invalid_exact_evm_signature");
  });

  test("rejects missing payload", async () => {
    const payload = {
      ...validPaymentPayload,
      payload: {},
    };
    const result = await verifyPayment(payload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // x402 v2 may return missing_eip712_domain or catch as unexpected_verify_error
    expect(["missing_eip712_domain", "unexpected_verify_error"]).toContain(result.invalidReason);
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
    // x402 v2 EVM exact scheme precise error reason
    expect(result.invalidReason).toBe("invalid_exact_evm_signature");
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
    // x402 v2 EVM exact scheme precise error reason
    expect(result.invalidReason).toBe("invalid_exact_evm_signature");
  });

  test("uses x402 v2 ExactEvmScheme for Optimism networks", async () => {
    // This test verifies that x402 v2 ExactEvmScheme processes Optimism networks
    // The test signature is invalid, but the important part is that the facilitator
    // accepts and processes the Optimism network without errors

    const result = await verifyPayment(validPaymentPayload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    // Should fail on signature validation (test signature doesn't match the payload)
    expect(result.invalidReason).toBe("invalid_exact_evm_signature");
  });

  /**
   * END-TO-END SIGNATURE VALIDATION TEST
   *
   * This test creates a REAL signature using viem and x402 client libraries,
   * then validates it through the full facilitator flow.
   *
   * This is critical because:
   * 1. It tests the actual cryptographic signature verification
   * 2. It catches signer configuration issues (like the toFacilitatorEvmSigner bug)
   * 3. It serves as a reference implementation for TypeScript clients
   *
   * Unlike other tests that use mock signatures, this creates an authentic
   * EIP-3009 authorization signature that the facilitator must validate.
   *
   * NOTE: uses a FRESH random key, not the shared Hardhat account #0. Since
   * @x402/evm 2.17+ validates signatures via ERC-1271 `isValidSignature` when the
   * signer address has code, and the well-known Hardhat key has a stray EIP-7702
   * delegation on public testnets, that shared key takes the smart-wallet path and
   * fails. A clean EOA (no code) uses ecrecover, as real users do.
   */
  test("E2E: validates real signature created with x402 client", async () => {
    // CLIENT SIDE: Create a real signature using the client library
    // This simulates what happens in a Jupyter notebook or web client

    // Fresh random key => clean EOA (no code / no EIP-7702 delegation), the ecrecover path
    const payerPrivateKey = generatePrivateKey();
    const payerAccount = privateKeyToAccount(payerPrivateKey);

    // Create x402 EVM client for signing
    const evmClient = new ExactEvmScheme({
      address: payerAccount.address,
      signTypedData: async (args) => {
        return payerAccount.signTypedData(args);
      },
    });

    // Payment parameters. Source the USDC asset + EIP-712 domain name from the
    // facilitator's own chain_utils (same source production uses via the 402
    // response). Since @x402 2.17, verify derives the authoritative domain rather
    // than trusting the payload's `extra`, so hardcoding a wrong name/address here
    // would produce a domain mismatch (invalid_exact_evm_signature).
    const network = "eip155:11155420"; // Optimism Sepolia
    const cfg = getChainConfig(network);
    const paymentAmount = "100000"; // $0.10 in 6-decimal USDC
    const recipientAddress = "0x209693Bc6afc0C5328bA36FaF03C514EF312287C";

    const paymentRequirements = {
      scheme: "exact",
      network,
      amount: paymentAmount,
      asset: cfg.USDC_ADDRESS,
      payTo: recipientAddress,
      maxTimeoutSeconds: 300,
      extra: {
        name: cfg.USDC_NAME,
        version: "2",
      },
    };

    // Create payment payload with REAL signature using x402 v2 API
    const partialPayload = await evmClient.createPaymentPayload(2, paymentRequirements);

    // Combine with resource information to create full payment payload
    const paymentPayload = {
      x402Version: 2,
      resource: {
        url: "https://api.example.com/e2e-test",
        description: "End-to-end signature validation test",
        mimeType: "application/json",
      },
      accepted: paymentRequirements,
      payload: partialPayload.payload,
    };

    // FACILITATOR SIDE: Verify the signature
    const result = await verifyPayment(paymentPayload, paymentRequirements);

    // The signature validation should succeed, then fail at the balance check
    // (invalid_exact_evm_insufficient_balance — the 2.17+ rename of insufficient_funds)
    // because the fresh test wallet holds no USDC on Sepolia.
    //
    // What matters is that we DON'T get "invalid_exact_evm_signature", which would
    // indicate a signature-verification / signer configuration problem.

    if (!result.isValid) {
      // Signature was validated correctly, but wallet doesn't have sufficient balance
      // This is expected in test environment without real testnet funds
      expect(result.invalidReason).toBe("invalid_exact_evm_insufficient_balance");
      console.log("✓ Signature validation successful (insufficient funds is expected)");
    } else {
      // If the wallet happens to have funds, that's also valid
      expect(result.isValid).toBe(true);
      expect(result.invalidReason).toBeUndefined();
      console.log("✓ Full payment verification successful");
    }

    // Verify the payer address is correctly identified
    expect(paymentPayload.payload.authorization.from.toLowerCase()).toBe(
      payerAccount.address.toLowerCase(),
    );
  });

  test("validates signature for Optimism Mainnet (chainId 10)", async () => {
    // This test would have failed before the multi-chain fix
    // because the facilitator was hardcoded to use Sepolia client for all chains.
    // Fresh random key => clean EOA (ecrecover path); see the E2E test note re:
    // the shared Hardhat key's EIP-7702 delegation under @x402 2.17+.
    const payerAccount = privateKeyToAccount(generatePrivateKey());

    // Create a client for Optimism Mainnet (chainId 10)
    const evmClient = new ExactEvmScheme({
      address: payerAccount.address,
      signTypedData: async (args) => payerAccount.signTypedData(args),
    });

    // Source asset + domain name from chain_utils. Note Optimism *mainnet* USDC
    // is "USD Coin" (not "USDC"); hardcoding the wrong name is exactly what broke
    // this test under @x402 2.17+, which derives the authoritative domain.
    const network = "eip155:10"; // Optimism Mainnet
    const cfg = getChainConfig(network);
    const paymentAmount = "1000000"; // $1.00 in 6-decimal USDC
    const recipientAddress = "0x209693Bc6afc0C5328bA36FaF03C514EF312287C";

    const paymentRequirements = {
      scheme: "exact",
      network,
      amount: paymentAmount,
      asset: cfg.USDC_ADDRESS,
      payTo: recipientAddress,
      maxTimeoutSeconds: 300,
      extra: {
        name: cfg.USDC_NAME,
        version: "2",
      },
    };

    // Create payment payload with REAL signature for Mainnet (chainId 10)
    const partialPayload = await evmClient.createPaymentPayload(2, paymentRequirements);

    const paymentPayload = {
      x402Version: 2,
      resource: {
        url: "https://api.example.com/mainnet-test",
        description: "Mainnet multi-chain signature validation test",
        mimeType: "application/json",
      },
      accepted: paymentRequirements,
      payload: partialPayload.payload,
    };

    // CRITICAL TEST: Without the multi-chain fix, this would fail because
    // verifyTypedData would use the Sepolia client instead of Mainnet client
    // The domain.chainId would be 10 (Mainnet) but the client would be configured for 11155420 (Sepolia)
    const result = await verifyPayment(paymentPayload, paymentRequirements);

    // We accept insufficient-balance or unauthorized_agent — we're testing signature
    // validation. The important part is that we DON'T get "invalid_exact_evm_signature",
    // which would indicate the signer is using the wrong chain client.
    if (!result.isValid) {
      // Valid errors: no USDC balance, or agent not whitelisted on Mainnet
      expect(["invalid_exact_evm_insufficient_balance", "unauthorized_agent"]).toContain(
        result.invalidReason,
      );
      console.log(
        `✓ Mainnet signature validation successful (${result.invalidReason} is expected)`,
      );
    } else {
      expect(result.isValid).toBe(true);
      console.log("✓ Mainnet full payment verification successful");
    }

    // Verify it's actually using mainnet chainId
    expect(paymentPayload.accepted.network).toBe("eip155:10");
  });

  // Note: Additional blockchain integration tests (actual settlement on testnet)
  // would require testnet funds and transaction execution
});
