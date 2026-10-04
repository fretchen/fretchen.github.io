/**
 * The rule COUNT is a cost decision, so it is pinned here rather than left to whoever edits the
 * YAML next. Scaleway bills each active alert rule (€0.015/day, checked 2026-10-04); the phrases a
 * rule matches are free. A new failure mode is a new alternative in an existing rule's line
 * filter, not a new rule.
 *
 * Why a test and not just a comment: on 2026-10-04 the twelve-rule version in git was pushed over a
 * three-rule consolidation that had only ever existed on the ruler. The comments now in both YAML
 * headers explain the budget; this makes breaking it fail CI instead of quietly quadrupling the bill.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Raising a number here is a cost decision: change it deliberately, with the reason next to it. */
const RULE_BUDGET: Record<string, number> = {
  "services.yaml": 1, // ServicesNeedAttention
  "payments.yaml": 2, // PaymentCronNeedsAttention, FacilitatorNeedsAttention
};

const read = (file: string) =>
  readFileSync(fileURLToPath(new URL(`../alerts/${file}`, import.meta.url)), "utf8");

describe.each(Object.entries(RULE_BUDGET))("alerts/%s", (file, budget) => {
  const yaml = read(file);

  it(`holds exactly ${budget} rule(s) — each rule is billed`, () => {
    const rules = [...yaml.matchAll(/^ {2}- alert: (\S+)/gm)].map((m) => m[1]);
    expect(
      rules.length,
      `${file} has ${rules.length} rules (${rules.join(", ")}), budget ${budget}. Each active ` +
        `rule is billed daily — add the new phrase as an alternative to an existing rule's line ` +
        `filter instead (see the cost block at the top of ${file}).`,
    ).toBe(budget);
  });

  /** Scaleway's Loki ruler rejects a range window above 1h outright, and a shorter one silently
   *  narrows the window in which a 12-hourly cron's line can be seen. */
  it("uses the 1h range window everywhere", () => {
    // Matched inside count_over_time only: payments.yaml's header names a rejected `[13h]` to
    // explain why the cap exists, and a check that failed on prose would teach people to delete it.
    // Lazy `.*?`, not `[^)]*`: the selectors and filters now contain `(…|…)` groups.
    const windows = [...yaml.matchAll(/count_over_time\(.*?\[(\d+[smhd])\]\)/g)].map((m) => m[1]);
    expect(windows.length).toBeGreaterThan(0);
    expect([...new Set(windows)]).toEqual(["1h"]);
  });
});
