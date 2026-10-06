/**
 * The alert rules are pushed as raw text by `scripts/alerts.ts` and never exercised locally, so
 * nothing else would notice a rule that stopped matching the line it was written for. These checks
 * are the ones a human cannot do by eye: whether a filter still matches real log text — and, since
 * the rules were consolidated into one long alternation each, whether it still stays quiet on the
 * caller errors it exists to ignore. The window and the rule count are in alerts_budget.test.ts.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const yaml = readFileSync(
  fileURLToPath(new URL("../alerts/payments.yaml", import.meta.url)),
  "utf8",
);

/** The `|~ "..."` line filter of a named rule, as a usable RegExp. */
function lineFilterOf(alertName: string): RegExp {
  const rule = yaml.slice(yaml.indexOf(`alert: ${alertName}`));
  const match = /\|~ "([^"]+)"/.exec(rule);
  if (!match) {
    throw new Error(`No |~ filter found for ${alertName}`);
  }
  return new RegExp(match[1]);
}

/** A facilitator settle result as pino writes it: the merging object first, `msg` last. */
const settleLine = (reason: string, msg = "Settlement failed") =>
  `{"level":40,"errorReason":"${reason}","errorMessage":"…","msg":"${msg}"}`;

describe("alerts/payments.yaml", () => {
  describe("FacilitatorNeedsAttention", () => {
    const filter = lineFilterOf("FacilitatorNeedsAttention");

    it.each([
      "refund_simulation_failed",
      "refund_transaction_failed",
      "insufficient_fee_allowance",
      "invalid_exact_evm_transaction_failed",
      "invalid_batch_settlement_evm_rpc_read_failed",
    ])("pages on a settlement failed with %s", (reason) => {
      expect(filter.test(settleLine(reason))).toBe(true);
    });

    /** Regression: the old rule listed settlement_pending as a reason, but this line's msg is not
     *  "Settlement failed", so its `|= "Settlement failed"` prefilter dropped it — never fired. */
    it("pages on a settlement broadcast but unconfirmed", () => {
      const line = settleLine(
        "settlement_pending",
        "Settlement broadcast but unconfirmed — reconcile on chain",
      );
      expect(filter.test(line)).toBe(true);
    });

    it.each([
      "Settlement threw",
      "Unexpected error in handler",
      "FACILITATOR_WALLET_PRIVATE_KEY not configured",
      "Email report failed",
      "Fee collection failed after successful settlement",
      "Fee transaction reverted",
    ])("pages on %s", (msg) => {
      expect(filter.test(`{"level":50,"msg":"${msg}"}`)).toBe(true);
    });

    /** The settlement branch exists to be narrower than "Settlement failed": a caller's bad
     *  signature or empty allowance is their problem, and paging on it is how people stop reading
     *  alerts. Merging it with the other branches must not have widened it. */
    it.each([
      "invalid_signature",
      "insufficient_funds",
      "authorization_already_used",
      "invalid_permit2_recipient_mismatch",
    ])("stays quiet on the caller error %s", (reason) => {
      expect(filter.test(settleLine(reason))).toBe(false);
    });
  });

  describe("PaymentCronNeedsAttention", () => {
    const filter = lineFilterOf("PaymentCronNeedsAttention");

    it.each([
      "2 channels past the refund threshold still hold escrow",
      "Refund sweep failed",
      "claimAndSettle failed",
      "Failed to configure batch-settlement resource server",
      "Fee allowance nearly exhausted",
    ])("pages on %s", (msg) => {
      expect(filter.test(`{"msg":"${msg}"}`)).toBe(true);
    });

    it("stays quiet on a routine run", () => {
      expect(filter.test(`{"msg":"claimAndSettle completed"}`)).toBe(false);
    });
  });
});
