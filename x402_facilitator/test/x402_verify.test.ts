/**
 * Tests for x402 verify — the REAL verify path, hermetic.
 *
 * Nothing in our code or in @x402/evm is mocked. Only the RPC client is replaced by an
 * in-memory chain (test/helpers/fakeChain.ts), and every payment is genuinely signed
 * (test/helpers/signPayment.ts) with the one field under test set wrong BEFORE signing.
 * So each rejection test reaches the check it is named for: remove that check from the
 * SDK or from our fee hook and the matching test fails.
 *
 * The same payments against live RPC are in test/integration/x402_verify_signature.integration.test.ts.
 */
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("viem", async (importOriginal) => {
  const { fakeViem } = await import("./helpers/fakeChain");
  return fakeViem(await importOriginal<typeof import("viem")>());
});

import { verifyPayment } from "../x402_verify.js";
import { resetFacilitator } from "../facilitator_instance.js";
import { getFacilitatorAddress } from "../x402_fee.js";
import { chain } from "./helpers/fakeChain";
import { signExactPayment, SELLER } from "./helpers/signPayment";

const FACILITATOR_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const now = () => BigInt(Math.floor(Date.now() / 1000));

describe("x402 Verify (real SDK, fake chain)", () => {
  const originalEnv = { ...process.env };

  /**
   * Sign a payment and put the chain in the state where it should pass: token deployed,
   * payer funded, seller has approved the facilitator for the fee.
   */
  async function fundedPayment(options: Parameters<typeof signExactPayment>[0] = {}) {
    const signed = await signExactPayment(options);
    chain.addToken(signed.token, signed.name);
    chain.setBalance(signed.token, signed.payer, 1_000_000n);
    chain.setAllowance(signed.token, SELLER, getFacilitatorAddress()!, 1_000_000n);
    return signed;
  }

  beforeEach(() => {
    process.env.FACILITATOR_WALLET_PRIVATE_KEY = FACILITATOR_KEY;
    resetFacilitator();
    chain.reset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("accepts a correctly signed, funded payment", async () => {
    const { payload, requirements, payer } = await fundedPayment();

    const result = await verifyPayment(payload, requirements);

    expect(result).toMatchObject({ isValid: true, payer, feeRequired: true, recipient: SELLER });
    // 1_000_000 allowance / 10_000 fee
    expect(result.remainingSettlements).toBe(100);
  });

  test("verify is read-only: nothing is written to the chain", async () => {
    const { payload, requirements } = await fundedPayment();

    await verifyPayment(payload, requirements);

    expect(chain.writes).toEqual([]);
  });

  // ─── Signature ───────────────────────────────────────────

  test("rejects a signature by someone other than authorization.from", async () => {
    const { payload, requirements } = await fundedPayment();
    const other = await signExactPayment();
    payload.payload.signature = other.payload.payload.signature;

    const result = await verifyPayment(payload, requirements);

    expect(result).toMatchObject({ isValid: false, invalidReason: "invalid_exact_evm_signature" });
  });

  test("rejects a payment whose signed authorization was altered afterwards", async () => {
    const { payload, requirements } = await fundedPayment();
    payload.payload.authorization.value = "1"; // no longer what was signed

    const result = await verifyPayment(payload, requirements);

    expect(result.invalidReason).toBe("invalid_exact_evm_signature");
  });

  test("rejects signature without 0x prefix", async () => {
    const { payload, requirements } = await fundedPayment();
    payload.payload.signature = payload.payload.signature.slice(2) as `0x${string}`;

    const result = await verifyPayment(payload, requirements);

    expect(result).toMatchObject({ isValid: false, invalidReason: "invalid_exact_evm_signature" });
  });

  test("rejects signature with invalid length", async () => {
    const { payload, requirements } = await fundedPayment();
    payload.payload.signature = payload.payload.signature.slice(0, -2) as `0x${string}`;

    const result = await verifyPayment(payload, requirements);

    expect(result).toMatchObject({ isValid: false, invalidReason: "invalid_exact_evm_signature" });
  });

  // ─── Authorization fields (validly signed, one field wrong) ───

  test("rejects an authorization paying someone other than payTo", async () => {
    const { payload, requirements } = await fundedPayment({
      authorization: { to: "0x1111111111111111111111111111111111111111" },
    });

    const result = await verifyPayment(payload, requirements);

    expect(result.invalidReason).toBe("invalid_exact_evm_recipient_mismatch");
  });

  test("rejects an expired authorization", async () => {
    const { payload, requirements } = await fundedPayment({
      authorization: { validBefore: now() - 1n },
    });

    const result = await verifyPayment(payload, requirements);

    expect(result.invalidReason).toBe("invalid_exact_evm_payload_authorization_valid_before");
  });

  test("rejects an authorization that is not valid yet", async () => {
    const { payload, requirements } = await fundedPayment({
      authorization: { validAfter: now() + 3600n },
    });

    const result = await verifyPayment(payload, requirements);

    expect(result.invalidReason).toBe("invalid_exact_evm_payload_authorization_valid_after");
  });

  test("rejects an authorization for less than the required amount", async () => {
    const { payload, requirements } = await fundedPayment({ authorization: { value: 5_000n } });

    const result = await verifyPayment(payload, requirements);

    expect(result.invalidReason).toBe("invalid_exact_evm_payload_authorization_value_mismatch");
  });

  // ─── On-chain state ─────────────────────────────────────

  test("rejects a payer without enough balance", async () => {
    const { payload, requirements, payer, token } = await fundedPayment();
    chain.setBalance(token, payer, 99_999n);

    const result = await verifyPayment(payload, requirements);

    expect(result).toMatchObject({
      isValid: false,
      invalidReason: "invalid_exact_evm_insufficient_balance",
      payer,
    });
  });

  test("rejects an authorization whose nonce was already used", async () => {
    const { payload, requirements, payer, token, nonce } = await fundedPayment();
    chain.markNonceUsed(token, payer, nonce);

    const result = await verifyPayment(payload, requirements);

    expect(result.invalidReason).toBe("invalid_exact_evm_nonce_already_used");
  });

  test("rejects a token that is not a deployed contract", async () => {
    const { payload, requirements } = await signExactPayment(); // token never added

    const result = await verifyPayment(payload, requirements);

    expect(result.invalidReason).toBe("asset_not_deployed_contract");
  });

  // ─── Our fee gate (facilitator_instance onAfterVerify) ─────

  test("rejects when the seller has not approved the facilitator for the fee", async () => {
    const { payload, requirements, token } = await fundedPayment();
    chain.setAllowance(token, SELLER, getFacilitatorAddress()!, 9_999n);

    const result = await verifyPayment(payload, requirements);

    expect(result).toMatchObject({ isValid: false, invalidReason: "insufficient_fee_allowance" });
  });

  test("accepts without any approval when no fee is configured", async () => {
    process.env.FACILITATOR_FEE_AMOUNT = "0";
    const { payload, requirements, token } = await fundedPayment();
    chain.setAllowance(token, SELLER, getFacilitatorAddress()!, 0n);

    const result = await verifyPayment(payload, requirements);

    expect(result).toMatchObject({ isValid: true, feeRequired: false });
  });

  // ─── Request shape ──────────────────────────────────────

  test("rejects invalid x402 version", async () => {
    const { payload, requirements } = await fundedPayment();

    const result = await verifyPayment({ ...payload, x402Version: 1 }, requirements);

    // The SDK throws "No facilitator registered for x402 version: 1"; verifyPayment maps it.
    expect(result).toMatchObject({ isValid: false, invalidReason: "unexpected_verify_error" });
  });

  test("rejects unsupported scheme", async () => {
    const { payload, requirements } = await fundedPayment();

    const result = await verifyPayment(
      { ...payload, accepted: { ...payload.accepted, scheme: "deferred" } },
      requirements,
    );

    expect(result.invalidReason).toBe("invalid_exact_evm_scheme");
  });

  test("rejects a payload whose network differs from the requirements", async () => {
    const { payload, requirements } = await fundedPayment();

    const result = await verifyPayment(
      { ...payload, accepted: { ...payload.accepted, network: "eip155:1" } },
      requirements,
    );

    expect(result.invalidReason).toBe("invalid_exact_evm_network_mismatch");
  });

  test("rejects missing payload", async () => {
    const { payload, requirements } = await fundedPayment();

    const result = await verifyPayment({ ...payload, payload: {} }, requirements);

    expect(result).toMatchObject({ isValid: false, invalidReason: "unexpected_verify_error" });
  });

  test("verifies on every supported network with that network's USDC domain", async () => {
    // Optimism mainnet's USDC domain name is "USD Coin", testnets use "USDC" — a wrong
    // per-network name would fail the signature check here.
    for (const network of ["eip155:10", "eip155:11155420", "eip155:8453", "eip155:84532"]) {
      const { payload, requirements } = await fundedPayment({ network });

      const result = await verifyPayment(payload, requirements);

      expect({ network, isValid: result.isValid, reason: result.invalidReason }).toEqual({
        network,
        isValid: true,
        reason: undefined,
      });
    }
  });
});
