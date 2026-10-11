import { describe, it, expect } from "vitest";
import { toFunctionSelector } from "viem";
import { BATCH_SETTLEMENT_REVERT_SELECTORS, annotateDecodedRevert } from "../revert_selectors";

/** The complete error list of contracts/evm/src/x402BatchSettlement.sol, independently of the
 *  module under test: the test recomputes every selector from the name, so a typo in either
 *  the name or the selector half of the map fails here. */
const CONTRACT_ERRORS = [
  "InvalidChannel()",
  "ZeroDeposit()",
  "DepositOverflow()",
  "InvalidSignature()",
  "NotReceiverAuthorizer()",
  "NotAuthorizedToClaim()",
  "NotAuthorizedToRefund()",
  "ClaimExceedsCeiling()",
  "ClaimExceedsBalance()",
  "WithdrawalAlreadyPending()",
  "WithdrawalNotPending()",
  "NotAuthorizedToFinalizeWithdraw()",
  "WithdrawDelayNotElapsed()",
  "NothingToWithdraw()",
  "WithdrawAmountExceedsAvailable()",
  "WithdrawDelayOutOfRange()",
  "EmptyBatch()",
  "DepositCollectionFailed()",
  "InvalidCollector()",
  "InvalidRefundNonce()",
  "ZeroRefund()",
];

/** The real viem message from the 2026-10-11 facilitator log — the incident that motivated
 *  the module. Verbatim except for the escaped quotes the JSON log payload carried. */
const ZERO_REFUND_MESSAGE =
  'The contract function "refundWithSignature" reverted with the following signature:\n' +
  "0xd758525c\n" +
  "\n" +
  'Unable to decode signature "0xd758525c" as it was not found on the provided ABI.\n' +
  "Make sure you are using the correct ABI and that the error exists on it.\n" +
  "You can look up the decoded signature here: https://4byte.sourcify.dev/?q=0xd758525c.\n";

describe("BATCH_SETTLEMENT_REVERT_SELECTORS", () => {
  it("covers exactly the contract's error list, name for name", () => {
    const bySelector = new Map(Object.entries(BATCH_SETTLEMENT_REVERT_SELECTORS));
    expect(bySelector.size).toBe(CONTRACT_ERRORS.length);
    for (const name of CONTRACT_ERRORS) {
      // The map's values carry the name WITH parentheses; the selector is keccak(name).
      expect(bySelector.get(toFunctionSelector(name))).toBe(name);
    }
  });

  it("names the two selectors production has actually bitten this repo with", () => {
    // 0x164f1afe: the stale refundNonce reverts documented in scw_js/x402_channel_sync.ts.
    // 0xd758525c: the ZeroRefund revert of the 2026-10-11 fully-claimed-channel incident.
    expect(BATCH_SETTLEMENT_REVERT_SELECTORS["0x164f1afe"]).toBe("InvalidRefundNonce()");
    expect(BATCH_SETTLEMENT_REVERT_SELECTORS["0xd758525c"]).toBe("ZeroRefund()");
  });
});

describe("annotateDecodedRevert", () => {
  it("names the selector in a real undecoded viem revert message", () => {
    const annotated = annotateDecodedRevert(ZERO_REFUND_MESSAGE);
    expect(annotated).toContain("decoded revert: ZeroRefund() (0xd758525c)");
    // Annotates, never rewrites: the original text stays intact for anything grepping it.
    expect(annotated).toMatch(
      /^The contract function "refundWithSignature" reverted with the following signature:/,
    );
  });

  it("appends each known selector once, even when the message repeats it", () => {
    const annotated = annotateDecodedRevert(
      "failed with 0xd758525c and again 0xD758525C plus 0x164f1afe",
    );
    expect(annotated).toBe(
      "failed with 0xd758525c and again 0xD758525C plus 0x164f1afe" +
        " — decoded revert: ZeroRefund() (0xd758525c), InvalidRefundNonce() (0x164f1afe)",
    );
  });

  it("leaves unknown selectors and selector-free messages unchanged", () => {
    expect(annotateDecodedRevert("reverted with 0xdeadbeef, whatever that is")).toBe(
      "reverted with 0xdeadbeef, whatever that is",
    );
    expect(annotateDecodedRevert("plain failure, no selector anywhere")).toBe(
      "plain failure, no selector anywhere",
    );
  });

  it("does not read the 8-hex prefix of a longer value as a selector", () => {
    // A tx hash or calldata blob starts 0x + many hex chars; even when its first 8 hex
    // collide with a known selector, it is not one. The lookahead requires the selector to
    // stand alone, the way viem presents it in "reverted with the following signature".
    expect(annotateDecodedRevert("hash 0xd758525c00000000deadbeef confirmed")).toBe(
      "hash 0xd758525c00000000deadbeef confirmed",
    );
  });

  it("passes undefined through", () => {
    expect(annotateDecodedRevert(undefined)).toBeUndefined();
  });
});
