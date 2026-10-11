/**
 * Names for the x402BatchSettlement contract's custom-error revert selectors.
 *
 * Why this exists: the SDK simulates claim/refund/settle calls with an ABI fragment that
 * declares no `error` entries, so when the contract reverts, viem reports the raw selector
 * and an "Unable to decode signature … as it was not found on the provided ABI" message.
 * The selector is the whole diagnosis — 0xd758525c is `ZeroRefund()` — but as raw hex it
 * sent an operator to a signature database on 2026-10-11 to read a one-word answer.
 *
 * The 21 errors below are the complete error list of the contract this facilitator
 * dispatches to (0x4020074e9dF2ce1deE5A9C1b5c3f541D02a10003, same CREATE2 address on every
 * chain), taken from `contracts/evm/src/x402BatchSettlement.sol` in x402-foundation/x402.
 * Every selector was computed with viem's `toFunctionSelector` and two were cross-checked
 * against production evidence: `InvalidRefundNonce()` 0x164f1afe (a stale refundNonce
 * incident) and `ZeroRefund()` 0xd758525c (the fully-claimed-channel incident of
 * 2026-10-11). test/revert_selectors.test.ts recomputes the map from the names, so a typo
 * in either half fails CI.
 */

/** Revert selector (with 0x prefix, lowercase) → the contract's error name with (). */
export const BATCH_SETTLEMENT_REVERT_SELECTORS: Record<`0x${string}`, string> = {
  "0xea3a9a39": "InvalidChannel()",
  "0x56316e87": "ZeroDeposit()",
  "0x1132981b": "DepositOverflow()",
  "0x8baa579f": "InvalidSignature()",
  "0xf5e2237d": "NotReceiverAuthorizer()",
  "0xdefb7069": "NotAuthorizedToClaim()",
  "0x7864f008": "NotAuthorizedToRefund()",
  "0xf1789775": "ClaimExceedsCeiling()",
  "0x7d8242b6": "ClaimExceedsBalance()",
  "0xa2aed0f0": "WithdrawalAlreadyPending()",
  "0x3a0a1ca6": "WithdrawalNotPending()",
  "0x15f969d5": "NotAuthorizedToFinalizeWithdraw()",
  "0xf3965827": "WithdrawDelayNotElapsed()",
  "0xd0d04f60": "NothingToWithdraw()",
  "0x6d3d5764": "WithdrawAmountExceedsAvailable()",
  "0x4574fab6": "WithdrawDelayOutOfRange()",
  "0xc2e5347d": "EmptyBatch()",
  "0xeb43592c": "DepositCollectionFailed()",
  "0x18b1afd4": "InvalidCollector()",
  "0x164f1afe": "InvalidRefundNonce()",
  "0xd758525c": "ZeroRefund()",
};

/** Standalone revert selectors: `0x` + 8 hex NOT followed by more hex. The lookahead keeps
 *  the first 8 hex of a longer value — a tx hash, an address, calldata — from ever being
 *  read as a selector; a real selector in a viem message stands alone. */
const SELECTOR_RE = /0x[0-9a-fA-F]{8}(?![0-9a-fA-F])/g;

/**
 * Append the names of every known BatchSettlement revert selector a message mentions.
 *
 * Applied where the SDK's raw `errorMessage` first enters this package (the two
 * `facilitator.settle` call sites in `x402_settle.ts`), so every log line and returned
 * `SettleResult.errorMessage` downstream carries the decoded name. Unknown selectors and
 * selector-free messages pass through unchanged — this annotates, it never rewrites. The
 * suffix deliberately matches the alert rules' regexes nowhere: `errorReason` and the log
 * msg are untouched, so `(refund_[a-z_]*failed|…).*Settlement failed` keeps matching.
 */
export function annotateDecodedRevert(message: string | undefined): string | undefined {
  if (!message) {
    return message;
  }
  const decoded = [...message.matchAll(SELECTOR_RE)]
    .map((match) => match[0].toLowerCase() as `0x${string}`)
    .filter((selector) => selector in BATCH_SETTLEMENT_REVERT_SELECTORS)
    .map((selector) => `${BATCH_SETTLEMENT_REVERT_SELECTORS[selector]} (${selector})`);
  if (decoded.length === 0) {
    return message;
  }
  return `${message} — decoded revert: ${[...new Set(decoded)].join(", ")}`;
}
