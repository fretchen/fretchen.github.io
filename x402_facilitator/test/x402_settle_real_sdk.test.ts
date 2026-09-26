/**
 * settlePayment end to end — real verify, real @x402/evm settle, real fee collection.
 *
 * x402_settle.test.ts covers settle's orchestration branches with verify and the SDK
 * stubbed out. This file runs the whole stack instead: a genuinely signed EIP-3009
 * payment goes through our code and the SDK, and the assertions are about what reaches
 * the chain — which contract calls were sent, by whom, with which arguments, and where the
 * money ended up. Only the RPC client is fake (test/helpers/fakeChain.ts).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("viem", async (importOriginal) => {
  const { fakeViem } = await import("./helpers/fakeChain");
  return fakeViem(await importOriginal<typeof import("viem")>());
});

import { settlePayment } from "../x402_settle.js";
import { resetFacilitator } from "../facilitator_instance.js";
import { getFacilitatorAddress } from "../x402_fee.js";
import { SettleResponseSchema } from "../x402_schemas.js";
import { chain } from "./helpers/fakeChain";
import { signExactPayment, SELLER } from "./helpers/signPayment";

const FACILITATOR_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const PRICE = 100_000n;
const FEE = 10_000n;

describe("settlePayment — real SDK, fake chain", () => {
  const originalEnv = { ...process.env };
  let facilitator: `0x${string}`;

  async function fundedPayment() {
    const signed = await signExactPayment({ amount: PRICE });
    chain.addToken(signed.token, signed.name);
    chain.setBalance(signed.token, signed.payer, 1_000_000n);
    chain.setAllowance(signed.token, SELLER, facilitator, 1_000_000n);
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

  it("moves the payment on-chain, then pulls the fee from the seller", async () => {
    const { payload, requirements, payer, token, nonce } = await fundedPayment();

    const result = await settlePayment(payload, requirements);

    // Exactly two transactions, both sent by the facilitator wallet, in this order.
    expect(chain.writes.map((w) => [w.functionName, w.address, w.from])).toEqual([
      ["transferWithAuthorization", token, facilitator],
      ["transferFrom", token, facilitator],
    ]);
    const [settlement, feePull] = chain.writes;
    // The settlement relays exactly what the buyer signed…
    expect(settlement.args.slice(0, 3)).toEqual([payer, SELLER, PRICE]);
    expect(settlement.args[5]).toBe(nonce);
    // …and the fee comes from the seller, never the buyer.
    expect(feePull.args).toEqual([SELLER, facilitator, FEE]);

    expect(chain.balanceOf(token, payer)).toBe(1_000_000n - PRICE);
    expect(chain.balanceOf(token, SELLER)).toBe(PRICE - FEE);
    expect(chain.balanceOf(token, facilitator)).toBe(FEE);

    expect(result).toMatchObject({
      success: true,
      payer,
      network: "eip155:11155420",
      fee: { collected: true, status: "collected" },
    });
    expect(result.transaction).toMatch(/^0x[0-9a-f]{64}$/);
    expect(result.fee!.txHash).not.toBe(result.transaction);
    expect(result.extensions!.facilitatorFees!.info).toMatchObject({
      facilitatorFeePaid: FEE.toString(),
      asset: `eip155:11155420/erc20:${token}`,
      collection: { status: "collected", txHash: result.fee!.txHash },
    });
  });

  it("returns a body that conforms to the published SettleResponse schema", async () => {
    const { payload, requirements } = await fundedPayment();

    const result = await settlePayment(payload, requirements);

    // Strip the internal-only errorMessage exactly as x402_facilitator.ts does.
    const { errorMessage: _internal, ...body } = result;
    expect(SettleResponseSchema.safeParse(body).success).toBe(true);
  });

  it("cannot be replayed: the second settlement of the same payment moves nothing", async () => {
    const { payload, requirements, token, payer } = await fundedPayment();

    await settlePayment(payload, requirements);
    const writesAfterFirst = chain.writes.length;
    const replay = await settlePayment(payload, requirements);

    expect(replay).toMatchObject({
      success: false,
      errorReason: "invalid_exact_evm_nonce_already_used",
    });
    expect(chain.writes).toHaveLength(writesAfterFirst);
    expect(chain.balanceOf(token, payer)).toBe(1_000_000n - PRICE);
  });

  it("refuses to settle for a seller who has not approved the fee — before spending gas", async () => {
    const { payload, requirements, token } = await fundedPayment();
    chain.setAllowance(token, SELLER, facilitator, FEE - 1n);

    const result = await settlePayment(payload, requirements);

    expect(result).toMatchObject({ success: false, errorReason: "insufficient_fee_allowance" });
    expect(chain.writes).toEqual([]);
  });

  it("refuses a payer without the funds — before spending gas", async () => {
    const { payload, requirements, token, payer } = await fundedPayment();
    chain.setBalance(token, payer, PRICE - 1n);

    const result = await settlePayment(payload, requirements);

    expect(result).toMatchObject({
      success: false,
      errorReason: "invalid_exact_evm_insufficient_balance",
    });
    expect(chain.writes).toEqual([]);
  });

  it("settles without a fee pull or fee receipt when no fee is configured", async () => {
    process.env.FACILITATOR_FEE_AMOUNT = "0";
    const { payload, requirements, token } = await fundedPayment();

    const result = await settlePayment(payload, requirements);

    expect(chain.writes.map((w) => w.functionName)).toEqual(["transferWithAuthorization"]);
    expect(chain.balanceOf(token, SELLER)).toBe(PRICE);
    expect(result.success).toBe(true);
    expect(result.fee).toBeUndefined();
    expect(result.extensions).toBeUndefined();
  });
});
