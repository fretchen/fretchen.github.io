/**
 * The alert rules are pushed as raw text by `scripts/alerts.ts` and never exercised locally, so
 * nothing else would notice a rule that stopped matching the line it was written for. These checks
 * are the ones a human cannot do by eye: whether a filter still matches real log text — and, since
 * the rules are consolidated into one long alternation each, whether it still stays quiet on the
 * lines it exists to ignore. The window and the rule count are in alerts_budget.test.ts; the
 * facilitator's own settlement/fee phrases moved with it to alerts/bunny.yaml and are tested in
 * alerts_bunny.test.ts.
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

describe("alerts/payments.yaml", () => {
  describe("FacilitatorNeedsAttention — walletreportcron only", () => {
    const filter = lineFilterOf("FacilitatorNeedsAttention");

    it.each([
      "Email report failed",
      "Email API returned 500: boom",
      "Cannot send wallet report: FACILITATOR_WALLET_PRIVATE_KEY not configured",
    ])("pages on %s", (msg) => {
      expect(filter.test(`{"level":50,"msg":"${msg}"}`)).toBe(true);
    });

    it.each([
      // The facilitator's own failures live in the bunny-logs source now — this rule must not
      // match them where they land, or a leftover phrase would widen the cron rule silently.
      "Settlement failed",
      "Fee collection failed",
      "Settlement broadcast but unconfirmed",
    ])("stays quiet on the facilitator line %s (bunny.yaml's job)", (msg) => {
      expect(filter.test(`{"msg":"${msg}"}`)).toBe(false);
    });

    it("stays quiet on a routine report send", () => {
      expect(filter.test(`{"msg":"Facilitator weekly report sent"}`)).toBe(false);
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
