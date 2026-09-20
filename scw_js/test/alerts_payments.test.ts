/**
 * The alert rules are pushed as raw text by `scripts/alerts.ts` and never exercised locally, so
 * nothing else would notice a rule that stopped matching the line it was written for. These two
 * checks are the ones a human cannot do by eye: whether a filter still matches real log text, and
 * whether every window respects the 1h cap Scaleway's ruler enforces.
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
  if (!match) throw new Error(`No |~ filter found for ${alertName}`);
  return new RegExp(match[1]);
}

describe("alerts/payments.yaml", () => {
  /** Scaleway's Loki ruler rejects a range window above 1h outright, and a shorter one silently
   *  narrows the window in which a 12-hourly cron's line can be seen. */
  it("uses the 1h range window everywhere", () => {
    // Matched inside count_over_time only: the header comment names a rejected `[13h]` to explain
    // why the cap exists, and a check that failed on prose would teach people to delete the prose.
    const windows = [...yaml.matchAll(/count_over_time\([^)]*\[(\d+[smhd])\]/g)].map((m) => m[1]);
    expect(windows.length).toBeGreaterThan(0);
    expect([...new Set(windows)]).toEqual(["1h"]);
  });

  describe("FacilitatorNeedsAttention", () => {
    const filter = lineFilterOf("FacilitatorNeedsAttention");

    it.each([
      "refund_simulation_failed",
      "refund_transaction_failed",
      "insufficient_fee_allowance",
      "settlement_pending",
    ])("pages on %s", (reason) => {
      expect(filter.test(`{"errorReason":"${reason}","msg":"Settlement failed"}`)).toBe(true);
    });

    /** The rule exists to be narrower than "Settlement failed": a caller's bad signature or empty
     *  allowance is their problem, and paging on it is how people stop reading alerts. */
    it.each(["invalid_signature", "insufficient_funds", "authorization_already_used"])(
      "stays quiet on the caller error %s",
      (reason) => {
        expect(filter.test(`{"errorReason":"${reason}","msg":"Settlement failed"}`)).toBe(false);
      },
    );
  });
});
