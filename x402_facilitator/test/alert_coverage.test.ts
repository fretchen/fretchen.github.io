import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Crosses the package boundary the same way this file's own ALERTS_DIR already does (below) —
// reading scw_js/alerts/*.yaml by relative path. tsconfig.json's `rootDir` had to be dropped for
// this: with `noEmit: true` it served no purpose (nothing is emitted) except making `tsc` refuse
// to type-check a source file living outside this package (TS6059), which is exactly what this
// import needs to do.
import {
  sourceFiles,
  stripStringLiterals,
  extractLoggerErrorMessages,
  extractRules,
  rulesForFunctions,
  isCovered,
} from "../../scw_js/test/lib/alertCoverageLib.js";

/**
 * Coverage guard for the "logger.error means ours, and should page" convention — see
 * scw_js/alerts/payments.yaml's "The `logger.error` convention" section and this package's
 * README "Alerting" note. The parsing logic is shared with
 * scw_js/test/alert_coverage.test.ts via `scw_js/test/lib/alertCoverageLib.ts`; see that file's
 * header for the fuller rationale (#683) and its documented limits.
 *
 * Why this exists: #683 was a batch of deep x402 bugs that ran silently for weeks because
 * nothing alerted on the log lines that recorded them. The fix was `scw_js/alerts/*.yaml`, but a
 * yaml file with rules only helps for the failures someone remembered to write a rule for. This
 * test makes that pairing an assertion instead of a habit.
 *
 * Two assertions, same shape as scw_js's copy:
 *   1. Every `logger.error(...)` call site in this package's root `.ts` files is matched by some
 *      rule's filter in `scw_js/alerts/*.yaml`, or is named in EXEMPT with a reason.
 *   2. No root `.ts` file calls `console.*` at all. This package was already console-free when
 *      this check was added — it exists so it stays that way, since a `console.*` regression
 *      here would be just as unwatchable by Loki as it was for genimg before scw_js's own copy
 *      of this test gained the same check.
 */

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.join(TEST_DIR, "..");
const ALERTS_DIR = path.join(TEST_DIR, "../../scw_js/alerts");

/** Messages that deliberately have no alert rule, and why. */
const EXEMPT: Record<string, string> = {
  "Error starting local server":
    "only runs when NODE_ENV=test (local dev bootstrap) — never deployed",
  "Failed to build wallet report for network":
    "the error is folded into the weekly report email body itself (renderEmailText's ⚠️ line), " +
    "so it already reaches an inbox without a Loki rule",
};

// Only rules whose selector names this package's two deployed functions — a rule scoped to
// llmx402cron or searchapi says nothing about whether the facilitator itself is covered.
const FACILITATOR_FUNCTIONS = ["facilitator", "walletreportcron"];

const messages = extractLoggerErrorMessages(PACKAGE_ROOT);
const rules = extractRules(ALERTS_DIR);
const facilitatorRules = rulesForFunctions(rules, FACILITATOR_FUNCTIONS);

describe("facilitator alert coverage", () => {
  it("found a realistic number of logger.error call sites", () => {
    // A floor, not an exact count — guards against the extractor silently matching nothing,
    // which would make every other test in this file vacuously pass.
    expect(messages.length).toBeGreaterThanOrEqual(8);
  });

  it("found the facilitator/walletreportcron alert rules", () => {
    expect(facilitatorRules.length).toBeGreaterThanOrEqual(3);
  });

  it("every EXEMPT entry still names a real logger.error message", () => {
    const known = new Set(messages.map((m) => m.message));
    for (const exempt of Object.keys(EXEMPT)) {
      expect(
        known.has(exempt),
        `EXEMPT["${exempt}"] no longer matches any logger.error call — remove it`,
      ).toBe(true);
    }
  });

  for (const { file, message } of messages) {
    it(`"${message}" (${file}) is alertable`, () => {
      if (message in EXEMPT) {
        return;
      }
      expect(
        isCovered(facilitatorRules, message),
        `logger.error("${message}") in ${file} is not matched by any rule's first filter in ` +
          `scw_js/alerts/*.yaml, and is not in this test's EXEMPT map. Either add/extend a rule ` +
          `there, or add this message to EXEMPT with a reason.`,
      ).toBe(true);
    });
  }

  for (const file of sourceFiles(PACKAGE_ROOT)) {
    it(`${file} does not call console.*`, () => {
      const text = fs.readFileSync(path.join(PACKAGE_ROOT, file), "utf8");
      const withoutStrings = stripStringLiterals(text);
      const match = /console\.\w+\(/.exec(withoutStrings);
      expect(
        match,
        `${file} calls ${match?.[0] ?? "console.*"} — use the file's pino \`logger\` instead, ` +
          `so the call can be alert-covered like every other logger.error in this package.`,
      ).toBeNull();
    });
  }
});
