/**
 * settlePayment wiring for batch-settlement — the part the real-stack tests can't reach.
 *
 * Exact-scheme settlement runs end to end in x402_settle_real_sdk.test.ts (real SDK, fake
 * chain), and which batch payloads pay whom is a pure table in x402_batch_route.test.ts.
 * What is left is how settlePayment ACTS on a batch route: skip or run verify, which
 * address and network the fee gate is asked about, whether settle is reached, whether a
 * fee is charged. The fake chain has no batch-settlement contract, so here the SDK's
 * settle() and the fee module are stubbed and the assertions are about the calls made.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { settlePayment } from "../x402_settle.js";
import * as facilitatorInstance from "../facilitator_instance.js";
import type { getFacilitator } from "../facilitator_instance.js";
import * as verifyModule from "../x402_verify.js";
import * as feeModule from "../x402_fee.js";
import {
  claim,
  claimCommand,
  settleCommand,
  refund,
  batchRequirements,
  PAYER,
  SELLER,
  OTHER_SELLER,
  BASE_SEPOLIA_USDC as USDC,
  BASE_SEPOLIA_EURC as EURC,
} from "./helpers/batchPayloads";

// Only `settle` is called on these paths, so cast through `unknown` rather than satisfying
// the whole x402Facilitator class — mirrors mockContract/mockPublicClient in x402_fee.test.ts.
function asFacilitator(shape: Record<string, unknown>) {
  return shape as unknown as ReturnType<typeof getFacilitator>;
}

/** Stub the SDK's settle() with a result; returns the mock to assert on. */
function stubSettle(result: Record<string, unknown> = { success: true, transaction: "0xsettled" }) {
  const settle = vi.fn().mockResolvedValue(result);
  vi.spyOn(facilitatorInstance, "getFacilitator").mockReturnValue(asFacilitator({ settle }));
  return settle;
}

describe("settlePayment — batch-settlement wiring", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    vi.spyOn(feeModule, "getFeeAmount").mockReturnValue(10000n);
    // Default: a fee is owed and the seller has approved it. Tests override for rejections.
    vi.spyOn(feeModule, "evaluateFeeGate").mockResolvedValue({ kind: "charge" });
    vi.spyOn(feeModule, "collectFee").mockResolvedValue({ success: true, txHash: "0xfee" });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // ─── claim / settle commands ────────────────────────────

  it("settles a claim directly — no verify — then gates and charges its seller", async () => {
    // The SDK's verify() has no branch for claim/settle and would reject them outright.
    const verify = vi.spyOn(verifyModule, "verifyPayment");
    const settle = stubSettle({
      success: true,
      transaction: "0xclaimtx",
      extra: { channelState: { balance: "88000" } },
    });
    const payload = claimCommand([claim(SELLER, EURC)]);
    const requirements = batchRequirements();

    const result = await settlePayment(payload, requirements);

    expect(verify).not.toHaveBeenCalled();
    expect(settle).toHaveBeenCalledWith(payload, requirements);
    expect(feeModule.evaluateFeeGate).toHaveBeenCalledWith(SELLER, "eip155:84532", EURC);
    expect(feeModule.collectFee).toHaveBeenCalledWith(SELLER, "eip155:84532", EURC);
    expect(result).toMatchObject({
      success: true,
      payer: PAYER,
      transaction: "0xclaimtx",
      extra: { channelState: { balance: "88000" } },
      fee: { collected: true },
    });
    expect(result.extensions!.facilitatorFees!.info.asset).toBe(`eip155:84532/erc20:${EURC}`);
  });

  it("gates a settle command on payload.receiver, not requirements.payTo", async () => {
    // REGRESSION: the SDK's executeSettle() pays payload.receiver and never reads payTo,
    // which on this path is an unchecked caller string. Gating on payTo would let one
    // address's allowance (or none) cover another's payout.
    stubSettle();

    await settlePayment(
      settleCommand({ receiver: OTHER_SELLER, token: USDC }),
      batchRequirements({ payTo: SELLER }),
    );

    expect(feeModule.evaluateFeeGate).toHaveBeenCalledWith(OTHER_SELLER, "eip155:84532", USDC);
  });

  it("refuses a claim whose seller has not approved the fee — before settling", async () => {
    vi.spyOn(feeModule, "evaluateFeeGate").mockResolvedValue({
      kind: "reject",
      reason: "insufficient_fee_allowance",
    });
    const settle = stubSettle();

    const result = await settlePayment(claimCommand(), batchRequirements());

    expect(result).toMatchObject({ success: false, errorReason: "insufficient_fee_allowance" });
    expect(settle).not.toHaveBeenCalled();
  });

  it("stops a refused route before the gate and before settle", async () => {
    // Which payloads are refused is x402_batch_route.test.ts; this pins that a refusal
    // short-circuits — no allowance RPC, no relayed transaction.
    const settle = stubSettle();

    const result = await settlePayment(
      claimCommand([claim(SELLER), claim(OTHER_SELLER)]),
      batchRequirements(),
    );

    expect(result).toMatchObject({
      success: false,
      errorReason: "invalid_batch_settlement_evm_payload_type",
    });
    expect(feeModule.evaluateFeeGate).not.toHaveBeenCalled();
    expect(settle).not.toHaveBeenCalled();
  });

  it("surfaces the SDK's failure reason for a claim, with the payer", async () => {
    stubSettle({
      success: false,
      errorReason: "invalid_batch_settlement_evm_claim_authorizer_signature",
    });

    const result = await settlePayment(claimCommand(), batchRequirements());

    expect(result).toMatchObject({
      success: false,
      errorReason: "invalid_batch_settlement_evm_claim_authorizer_signature",
      payer: PAYER,
      transaction: "",
    });
    expect(feeModule.collectFee).not.toHaveBeenCalled();
  });

  it("keeps the broadcast hash of a pending claim, and does not charge", async () => {
    stubSettle({ success: false, errorReason: "settlement_pending", transaction: "0xinflight" });

    const result = await settlePayment(claimCommand(), batchRequirements());

    expect(result).toMatchObject({ errorReason: "settlement_pending", transaction: "0xinflight" });
    expect(feeModule.collectFee).not.toHaveBeenCalled();
  });

  it("attaches no fee receipt to a claim when fees are disabled", async () => {
    vi.spyOn(feeModule, "evaluateFeeGate").mockResolvedValue({ kind: "no_fee" });
    stubSettle();

    const result = await settlePayment(claimCommand(), batchRequirements());

    expect(result.success).toBe(true);
    expect(result.fee).toBeUndefined();
    expect(result.extensions).toBeUndefined();
    expect(feeModule.collectFee).not.toHaveBeenCalled();
  });

  // ─── Testnet test-wallet bypass ─────────────────────────

  it("bypasses the fee for a test wallet on the network the claim actually settles on", async () => {
    process.env.BATCH_SETTLEMENT_TEST_WALLETS = SELLER;
    stubSettle();

    const result = await settlePayment(claimCommand(), batchRequirements());

    expect(result.success).toBe(true);
    expect(feeModule.evaluateFeeGate).not.toHaveBeenCalled();
    expect(result.fee).toBeUndefined();
  });

  it("keys the test-wallet bypass on requirements.network, not accepted.network", async () => {
    // accepted says Base Sepolia, but the SDK dispatches on requirements.network — here
    // mainnet. Bypassing on accepted.network would admit a test wallet on mainnet.
    process.env.BATCH_SETTLEMENT_TEST_WALLETS = SELLER;
    vi.spyOn(feeModule, "evaluateFeeGate").mockResolvedValue({
      kind: "reject",
      reason: "insufficient_fee_allowance",
    });
    const settle = stubSettle();

    const result = await settlePayment(claimCommand(), batchRequirements({ network: "eip155:10" }));

    expect(result).toMatchObject({ success: false, network: "eip155:10" });
    expect(settle).not.toHaveBeenCalled();
  });

  // ─── Refunds ────────────────────────────────────────────

  it("verifies, gates and charges a refund that carries claims", async () => {
    // It pays out exactly like a claim, but unlike one it IS verifiable — and verify is
    // what pins channelConfig.receiver to payTo, so it must not be skipped.
    const verify = vi
      .spyOn(verifyModule, "verifyPayment")
      .mockResolvedValue({ isValid: true, payer: PAYER });
    stubSettle();

    const result = await settlePayment(refund([claim(SELLER)]), batchRequirements());

    expect(verify).toHaveBeenCalled();
    expect(feeModule.evaluateFeeGate).toHaveBeenCalledWith(SELLER, "eip155:84532", USDC);
    expect(feeModule.collectFee).toHaveBeenCalledTimes(1);
    expect(result.fee?.collected).toBe(true);
  });

  it("refuses to relay a claim-carrying refund when the seller's allowance is short", async () => {
    vi.spyOn(verifyModule, "verifyPayment").mockResolvedValue({ isValid: true, payer: PAYER });
    vi.spyOn(feeModule, "evaluateFeeGate").mockResolvedValue({
      kind: "reject",
      reason: "insufficient_fee_allowance",
    });
    const settle = stubSettle();

    const result = await settlePayment(refund([claim(SELLER)]), batchRequirements());

    expect(result).toMatchObject({ success: false, errorReason: "insufficient_fee_allowance" });
    expect(settle).not.toHaveBeenCalled();
  });

  it("bypasses the fee for a claim-carrying refund from a testnet test wallet", async () => {
    process.env.BATCH_SETTLEMENT_TEST_WALLETS = SELLER;
    vi.spyOn(verifyModule, "verifyPayment").mockResolvedValue({ isValid: true, payer: PAYER });
    stubSettle();

    const result = await settlePayment(refund([claim(SELLER)]), batchRequirements());

    expect(result.success).toBe(true);
    expect(feeModule.evaluateFeeGate).not.toHaveBeenCalled();
    expect(result.fee).toBeUndefined();
  });

  it("leaves a claim-less refund free, even if verify says a fee is owed", async () => {
    // Defensive: the onAfterVerify hook never sets feeRequired for batch-settlement, but if
    // it ever did, the exact-scheme fee arm must still not charge a batch payload.
    vi.spyOn(verifyModule, "verifyPayment").mockResolvedValue({
      isValid: true,
      payer: PAYER,
      feeRequired: true,
      recipient: SELLER,
    });
    stubSettle({ success: true, transaction: "0xrefundtx", extra: { channelState: { id: "c" } } });

    const result = await settlePayment(refund([]), batchRequirements());

    expect(result.success).toBe(true);
    expect(feeModule.collectFee).not.toHaveBeenCalled();
    expect(result.fee).toBeUndefined();
    // The no-fee tail must still pass the channel state through — the seller needs it.
    expect(result.extra).toEqual({ channelState: { id: "c" } });
  });

  // ─── Unexpected throw ───────────────────────────────────

  it("maps anything thrown during settlement to settlement_failed, keeping the payer", async () => {
    // Caller errors come back from the SDK as returned reasons (see the real-stack tests);
    // a throw means our side broke, so it is always the generic reason — never, say,
    // "insufficient funds" for our own wallet running out of gas.
    vi.spyOn(verifyModule, "verifyPayment").mockResolvedValue({ isValid: true, payer: PAYER });
    vi.spyOn(facilitatorInstance, "getFacilitator").mockImplementation(() => {
      throw new Error("Transaction failed: insufficient funds for gas");
    });
    const exactPayload = {
      x402Version: 2,
      accepted: { scheme: "exact", network: "eip155:11155420" },
      payload: { authorization: { from: PAYER } },
    };

    const result = await settlePayment(exactPayload, {
      scheme: "exact",
      network: "eip155:11155420",
    });

    expect(result).toMatchObject({
      success: false,
      errorReason: "settlement_failed",
      payer: PAYER,
      network: "eip155:11155420",
      transaction: "",
    });
  });
});
