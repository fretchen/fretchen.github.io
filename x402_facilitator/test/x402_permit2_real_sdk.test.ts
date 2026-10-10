/**
 * EURe end to end — real verify, real @x402/evm Permit2 settle, real fee collection.
 *
 * EURe (Monerium) has no EIP-3009, so it is paid through the exact scheme's Permit2 variant:
 * the buyer signs a Permit2 witness transfer to the x402 Permit2 proxy, usually together with an
 * EIP-2612 permit that lets Permit2 spend its EURe (`eip2612GasSponsoring`). Payments are signed
 * with the SDK's own client and settled by the SDK's own facilitator; only the RPC client is fake
 * (test/helpers/fakeChain.ts models the proxy from its contract source).
 *
 * EURe has 18 decimals, so the same 0.01 flat fee is 10¹⁶ atomic units here, not the 10000 of
 * USDC/EURC — several tests below fail if that scaling is lost anywhere on the path.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("viem", async (importOriginal) => {
  const { fakeViem } = await import("./helpers/fakeChain");
  return fakeViem(await importOriginal<typeof import("viem")>());
});

import { PERMIT2_ADDRESS, x402ExactPermit2ProxyAddress } from "@x402/evm";
import { settlePayment } from "../x402_settle.js";
import { verifyPayment } from "../x402_verify.js";
import { resetFacilitator } from "../facilitator_instance.js";
import { getFacilitatorAddress } from "../x402_fee.js";
import { SettleResponseSchema } from "../x402_schemas.js";
import { EURE_ADDRESSES } from "@fretchen/chain-utils";
import { chain } from "./helpers/fakeChain";
import { signPermit2Payment, EURE_DOMAIN, SELLER } from "./helpers/signPayment";

const FACILITATOR_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const BASE = "eip155:8453";
const EURE = EURE_ADDRESSES[BASE];
const ONE_EURE = 10n ** 18n;
const PRICE = ONE_EURE / 10n; // 0.1 EURe
const FEE = 10n ** 16n; // 0.01 EURe

describe("EURe via Permit2 — real SDK, fake chain", () => {
  const originalEnv = { ...process.env };
  let facilitator: `0x${string}`;

  /** EURe deployed with its real domain; payer holds 1 EURe; seller approved 1 EURe of fees. */
  function fund(payer: string) {
    chain.addPermitToken(EURE, EURE_DOMAIN.name, EURE_DOMAIN.version, 8453);
    chain.setBalance(EURE, payer, ONE_EURE);
    chain.setAllowance(EURE, SELLER, facilitator, ONE_EURE);
  }

  async function fundedPayment(opts: Parameters<typeof signPermit2Payment>[0] = {}) {
    const signed = await signPermit2Payment({ amount: PRICE, ...opts });
    fund(signed.payer);
    return signed;
  }

  beforeEach(() => {
    process.env.FACILITATOR_WALLET_PRIVATE_KEY = FACILITATOR_KEY;
    resetFacilitator();
    chain.reset();
    facilitator = getFacilitatorAddress()!;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("verifies a Permit2 payment carrying an EIP-2612 permit, and counts fees in EURe units", async () => {
    const { payload, requirements, payer } = await fundedPayment();
    expect(payload.extensions).toHaveProperty("eip2612GasSponsoring");

    const result = await verifyPayment(payload, requirements);

    // 1 EURe of fee allowance / 0.01 EURe — an unscaled 10000 fee would read 10¹⁴.
    expect(result).toMatchObject({ isValid: true, payer, remainingSettlements: 100 });
    expect(chain.writes).toEqual([]);
  });

  it("settles through the proxy in one transaction, then pulls 0.01 EURe from the seller", async () => {
    const { payload, requirements, payer } = await fundedPayment();

    const result = await settlePayment(payload, requirements);

    expect(chain.writes.map((w) => [w.functionName, w.address, w.from])).toEqual([
      ["settleWithPermit", x402ExactPermit2ProxyAddress, facilitator],
      ["transferFrom", EURE, facilitator],
    ]);
    // The fee comes from the seller, in EURe's 18 decimals.
    expect(chain.writes[1].args).toEqual([SELLER, facilitator, FEE]);

    expect(chain.balanceOf(EURE, payer)).toBe(ONE_EURE - PRICE);
    expect(chain.balanceOf(EURE, SELLER)).toBe(PRICE - FEE);
    expect(chain.balanceOf(EURE, facilitator)).toBe(FEE);

    expect(result).toMatchObject({
      success: true,
      payer,
      network: BASE,
      fee: { collected: true, status: "collected" },
    });
    expect(result.extensions!.facilitatorFees!.info).toMatchObject({
      facilitatorFeePaid: FEE.toString(),
      asset: `${BASE}/erc20:${EURE}`,
    });
    const { errorMessage, ...wire } = result;
    expect(errorMessage).toBeUndefined();
    expect(SettleResponseSchema.strict().safeParse(wire).error?.issues ?? []).toEqual([]);
  });

  it("settles without the permit when the buyer already approved Permit2", async () => {
    const { payload, requirements, payer } = await fundedPayment({ gasSponsoring: false });
    chain.setAllowance(EURE, payer, PERMIT2_ADDRESS, ONE_EURE);

    const result = await settlePayment(payload, requirements);

    expect(result.success).toBe(true);
    expect(chain.writes.map((w) => w.functionName)).toEqual(["settle", "transferFrom"]);
    expect(chain.balanceOf(EURE, SELLER)).toBe(PRICE - FEE);
  });

  it("refuses a payment whose Permit2 witness pays someone other than payTo", async () => {
    // The buyer signs a transfer to another address; the seller's requirements name SELLER.
    // Before EURe, permit2_not_supported guarded this; now the SDK's recipient pin must.
    const attacker = "0x000000000000000000000000000000000000dEaD";
    const { payload, requirements } = await fundedPayment({
      signRequirements: (r) => ({ ...r, payTo: attacker }),
    });

    const verify = await verifyPayment(payload, requirements);
    const settle = await settlePayment(payload, requirements);

    expect(verify).toMatchObject({
      isValid: false,
      invalidReason: "invalid_permit2_recipient_mismatch",
    });
    expect(settle).toMatchObject({ success: false });
    expect(chain.writes).toEqual([]);
  });

  it("refuses a seller who approved a USDC-sized fee allowance in EURe — before spending gas", async () => {
    // 10000 atomic units is 0.01 USDC but 10⁻¹⁴ EURe: not enough for one EURe fee.
    const { payload, requirements } = await fundedPayment();
    chain.setAllowance(EURE, SELLER, facilitator, 10_000n);

    const result = await settlePayment(payload, requirements);

    expect(result).toMatchObject({ success: false, errorReason: "insufficient_fee_allowance" });
    expect(chain.writes).toEqual([]);
  });

  it("refuses a permit signed for the wrong EURe domain: Permit2 is left without an allowance", async () => {
    // The proxy swallows a failing permit() and carries on, so the payment fails on the
    // missing Permit2 allowance — this pins the EURe domain the docs record.
    const { payload, requirements } = await fundedPayment({
      permitDomain: { name: "EURe", version: "1" },
    });

    const result = await verifyPayment(payload, requirements);

    expect(result).toMatchObject({ isValid: false, invalidReason: "permit2_allowance_required" });
  });

  it("refuses a payer without the funds", async () => {
    const { payload, requirements, payer } = await fundedPayment();
    chain.setBalance(EURE, payer, PRICE - 1n);

    const result = await verifyPayment(payload, requirements);

    expect(result).toMatchObject({ isValid: false, invalidReason: "permit2_insufficient_balance" });
  });

  it("cannot be replayed: the second settlement of the same payment moves nothing", async () => {
    const { payload, requirements, payer } = await fundedPayment();

    await settlePayment(payload, requirements);
    const writesAfterFirst = chain.writes.length;
    const replay = await settlePayment(payload, requirements);

    expect(replay.success).toBe(false);
    expect(chain.writes).toHaveLength(writesAfterFirst);
    expect(chain.balanceOf(EURE, payer)).toBe(ONE_EURE - PRICE);
  });

  it("refuses EURe on Optimism, where it is not a fee token", async () => {
    const { payload, requirements } = await fundedPayment({ network: "eip155:10" });
    // A token at that address whose permit works on Optimism, so the SDK passes the payment and
    // only the facilitator's fee-token list stands between it and settlement.
    chain.addPermitToken(EURE, EURE_DOMAIN.name, EURE_DOMAIN.version, 10);

    const result = await verifyPayment(payload, requirements);

    expect(result).toMatchObject({ isValid: false, invalidReason: "unsupported_fee_asset" });
    expect(chain.writes).toEqual([]);
  });
});
