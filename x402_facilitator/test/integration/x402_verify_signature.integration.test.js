/**
 * INTEGRATION tests for exact-scheme signature verification.
 *
 * These deliberately make REAL RPC calls (Optimism mainnet + Sepolia): they create
 * authentic EIP-3009 signatures with the x402 client and run them through the full
 * facilitator verify path, which since @x402/evm 2.17 does on-chain reads
 * (getCode, ERC-1271 isValidSignature when the signer has code, and a
 * transferWithAuthorization balance simulation).
 *
 * They are network-dependent (slow, occasionally flaky) so they live outside the
 * hermetic unit suite. Run with `npm run test:integration`, not `npm test`.
 */
import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { verifyPayment } from "../../x402_verify.js";
import { resetFacilitator } from "../../facilitator_instance.js";
import { getChainConfig } from "../../chain_utils.js";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { ExactEvmScheme } from "@x402/evm/exact/client";

describe("x402 Verify — real signature (integration, live RPC)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetFacilitator();
    // Facilitator's own signing key (Hardhat test account #0). This is the
    // facilitator wallet, not the payer — the payer uses a fresh key per test.
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  /**
   * END-TO-END SIGNATURE VALIDATION TEST
   *
   * Creates a REAL signature using viem and the x402 client library, then
   * validates it through the full facilitator flow. Catches signer/verification
   * configuration issues and serves as a reference for TypeScript clients.
   *
   * NOTE: uses a FRESH random key, not the shared Hardhat account #0. Since
   * @x402/evm 2.17+ validates signatures via ERC-1271 `isValidSignature` when the
   * signer address has code, and the well-known Hardhat key has a stray EIP-7702
   * delegation on public testnets, that shared key takes the smart-wallet path and
   * fails. A clean EOA (no code) uses ecrecover, as real users do.
   */
  test("E2E: validates real signature created with x402 client", async () => {
    // Fresh random key => clean EOA (no code / no EIP-7702 delegation), the ecrecover path
    const payerAccount = privateKeyToAccount(generatePrivateKey());

    const evmClient = new ExactEvmScheme({
      address: payerAccount.address,
      signTypedData: async (args) => payerAccount.signTypedData(args),
    });

    // Source the USDC asset + EIP-712 domain name from the facilitator's own
    // chain_utils (same source production uses via the 402 response). Since @x402
    // 2.17, verify derives the authoritative domain rather than trusting the
    // payload's `extra`, so a wrong name/address here would fail verification.
    const network = "eip155:11155420"; // Optimism Sepolia
    const cfg = getChainConfig(network);
    const paymentRequirements = {
      scheme: "exact",
      network,
      amount: "100000", // $0.10 in 6-decimal USDC
      asset: cfg.USDC_ADDRESS,
      payTo: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
      maxTimeoutSeconds: 300,
      extra: { name: cfg.USDC_NAME, version: "2" },
    };

    const partialPayload = await evmClient.createPaymentPayload(2, paymentRequirements);
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

    const result = await verifyPayment(paymentPayload, paymentRequirements);

    // The signature should validate, then fail the balance check
    // (invalid_exact_evm_insufficient_balance — 2.17+ rename of insufficient_funds)
    // since the fresh wallet holds no USDC. What matters: NOT invalid_exact_evm_signature.
    if (!result.isValid) {
      expect(result.invalidReason).toBe("invalid_exact_evm_insufficient_balance");
    } else {
      expect(result.invalidReason).toBeUndefined();
    }

    expect(paymentPayload.payload.authorization.from.toLowerCase()).toBe(
      payerAccount.address.toLowerCase(),
    );
  });

  test("validates signature for Optimism Mainnet (chainId 10)", async () => {
    // Fresh random key => clean EOA (ecrecover path); see the E2E test note re:
    // the shared Hardhat key's EIP-7702 delegation under @x402 2.17+.
    const payerAccount = privateKeyToAccount(generatePrivateKey());

    const evmClient = new ExactEvmScheme({
      address: payerAccount.address,
      signTypedData: async (args) => payerAccount.signTypedData(args),
    });

    // Note Optimism *mainnet* USDC is "USD Coin" (not "USDC"); sourcing from
    // chain_utils avoids the wrong-domain-name bug under @x402 2.17+.
    const network = "eip155:10"; // Optimism Mainnet
    const cfg = getChainConfig(network);
    const paymentRequirements = {
      scheme: "exact",
      network,
      amount: "1000000", // $1.00 in 6-decimal USDC
      asset: cfg.USDC_ADDRESS,
      payTo: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
      maxTimeoutSeconds: 300,
      extra: { name: cfg.USDC_NAME, version: "2" },
    };

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

    const result = await verifyPayment(paymentPayload, paymentRequirements);

    // Accept insufficient-balance or unauthorized_agent — testing signature
    // validation. The important part is NOT getting invalid_exact_evm_signature,
    // which would mean the wrong chain client / domain was used.
    if (!result.isValid) {
      expect(["invalid_exact_evm_insufficient_balance", "unauthorized_agent"]).toContain(
        result.invalidReason,
      );
    } else {
      expect(result.isValid).toBe(true);
    }

    expect(paymentPayload.accepted.network).toBe("eip155:10");
  });
});
