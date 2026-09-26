/**
 * Builders for batch-settlement payloads, shared by the pure classification table
 * (x402_batch_route.test.ts) and the settle wiring tests (x402_settle.test.ts).
 *
 * Each returns the full x402 `paymentPayload`; `classifyBatchSettlement` takes its inner
 * `.payload`. Signatures are placeholders — nothing here is verified on-chain, only routed.
 */

import { SELLER } from "./signPayment";

export { SELLER };
export const PAYER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
export const OTHER_SELLER = "0x3333333333333333333333333333333333333333";
export const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
export const BASE_SEPOLIA_EURC = "0x808456652fdb597867f38412077A9182bf77359F";

const SIG = "0x" + "ab".repeat(65);
const accepted = { scheme: "batch-settlement", network: "eip155:84532" };

/** One claim on a channel paying `receiver` in `token`; pass `null` for a channel with no token. */
export function claim(receiver: string = SELLER, token: string | null = BASE_SEPOLIA_USDC) {
  return {
    voucher: {
      channel: { payer: PAYER, receiver, token: token ?? undefined },
      maxClaimableAmount: "12000",
    },
    signature: SIG,
    totalClaimed: "0",
  };
}

/** A `type: "claim"` command sweeping the given claims. */
export function claimCommand(claims: unknown = [claim()]) {
  return {
    x402Version: 2,
    accepted,
    payload: { type: "claim", claims, claimAuthorizerSignature: "0x" + "cd".repeat(65) },
  };
}

/** A `type: "settle"` command. Omit a field to build a malformed one. */
export function settleCommand(target: { receiver?: string; token?: string } = {}) {
  const { receiver = SELLER, token = BASE_SEPOLIA_USDC } = target;
  return { x402Version: 2, accepted, payload: { type: "settle", receiver, token } };
}

/** A malformed settle command with no receiver. */
export function settleCommandWithoutReceiver() {
  return { x402Version: 2, accepted, payload: { type: "settle", token: BASE_SEPOLIA_USDC } };
}

/** A refund on SELLER's USDC channel, carrying `claims` (anything — to build malformed ones). */
export function refund(claims: unknown) {
  return {
    x402Version: 2,
    accepted,
    payload: {
      type: "refund",
      channelConfig: { payer: PAYER, receiver: SELLER, token: BASE_SEPOLIA_USDC },
      // isVoucherFields() requires all three of these to be present.
      voucher: { channelId: "0x" + "11".repeat(32), maxClaimableAmount: "12000", signature: SIG },
      amount: "5000",
      refundNonce: "0",
      claims,
      refundAuthorizerSignature: "0x" + "ef".repeat(65),
      claimAuthorizerSignature: "0x" + "cd".repeat(65),
    },
  };
}

/** A deposit — funds a channel, pays out to no one. */
export function deposit() {
  return {
    x402Version: 2,
    accepted,
    payload: {
      type: "deposit",
      channelConfig: { payer: PAYER, receiver: SELLER, token: BASE_SEPOLIA_USDC },
      amount: "20000",
    },
  };
}

export function batchRequirements(overrides: { network?: string; payTo?: string } = {}) {
  return { scheme: "batch-settlement", network: "eip155:84532", payTo: SELLER, ...overrides };
}
