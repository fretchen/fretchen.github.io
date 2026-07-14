/**
 * INTEGRATION test for the batch-settlement scheme (Base Sepolia, live RPC).
 *
 * Builds a real deposit+voucher payload with the @x402 batch-settlement client and
 * runs it through the facilitator's verify path in-process (no HTTP server needed).
 * A fresh, unfunded payer means verify reaches the on-chain balance check and returns
 * `invalid_batch_settlement_evm_insufficient_balance` — which proves the client↔facilitator
 * wiring (payload shape, signature, EIP-712 domain, channel config) is all accepted; only
 * the empty USDC balance stops it. No funds move (verify is read-only; no deposit is settled).
 *
 * Base Sepolia only — the canonical BATCH_SETTLEMENT_ADDRESS is deployed there (not OP Sepolia).
 * Network-dependent, so it lives in the integration suite: `npm run test:integration`.
 */
import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { verifyPayment } from "../../x402_verify.js";
import { resetFacilitator } from "../../facilitator_instance.js";
import { getChainConfig } from "../../chain_utils.js";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import {
  BatchSettlementEvmScheme,
  InMemoryClientChannelStorage,
} from "@x402/evm/batch-settlement/client";

describe("x402 batch-settlement — deposit verify (integration, live RPC)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetFacilitator();
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("facilitator verifies a batch-settlement deposit payload (insufficient balance for a fresh payer)", async () => {
    const network = "eip155:84532"; // Base Sepolia (canonical contract deployed here)
    const cfg = getChainConfig(network);

    // Fresh clean-EOA payer (ecrecover path, no code) and a fresh receiver-authorizer.
    const payer = privateKeyToAccount(generatePrivateKey());
    const receiverAuthorizer = privateKeyToAccount(generatePrivateKey());

    const scheme = new BatchSettlementEvmScheme(
      { address: payer.address, signTypedData: (a) => payer.signTypedData(a) },
      { storage: new InMemoryClientChannelStorage() },
    );

    // In production the server (scw_js) supplies receiverAuthorizer + withdrawDelay in the 402.
    const paymentRequirements = {
      scheme: "batch-settlement",
      network,
      amount: "4000", // 0.004 USDC max per-request price
      asset: cfg.USDC_ADDRESS,
      payTo: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
      maxTimeoutSeconds: 3600,
      extra: {
        name: cfg.USDC_NAME,
        version: "2",
        receiverAuthorizer: receiverAuthorizer.address,
        withdrawDelay: 86400,
      },
    };

    const partial = await scheme.createPaymentPayload(2, paymentRequirements);

    // Sanity: the client produced a deposit + cumulative voucher for a new channel.
    expect(partial.payload.type).toBe("deposit");
    expect(partial.payload.channelConfig.receiverAuthorizer.toLowerCase()).toBe(
      receiverAuthorizer.address.toLowerCase(),
    );
    expect(partial.payload.voucher.channelId).toMatch(/^0x[0-9a-fA-F]{64}$/);

    const paymentPayload = {
      x402Version: 2,
      accepted: paymentRequirements,
      payload: partial.payload,
    };

    const result = await verifyPayment(paymentPayload, paymentRequirements);

    // Wiring is accepted end-to-end; only the empty balance stops it.
    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBe("invalid_batch_settlement_evm_insufficient_balance");
    expect(result.payer.toLowerCase()).toBe(payer.address.toLowerCase());
  });
});
