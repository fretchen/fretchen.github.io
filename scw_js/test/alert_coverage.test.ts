import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  sourceFiles,
  stripStringLiterals,
  extractLoggerErrorMessages,
  extractRules,
  rulesForFunctions,
  isCovered,
} from "./lib/alertCoverageLib.js";

/**
 * Coverage guard for the "logger.error means ours, and should page" convention — see
 * alerts/payments.yaml's "The `logger.error` convention" section and this package's README
 * "Alerting on log content" section. The parsing logic is shared with
 * x402_facilitator/test/alert_coverage.test.ts via `./lib/alertCoverageLib.ts`; see that file's
 * header for the fuller rationale (#683) and its documented limits.
 *
 * Two assertions:
 *   1. Every `logger.error(...)` call site in this package's root `.ts` files is matched by some
 *      rule's filter in `alerts/*.yaml`, or is named in EXEMPT with a reason.
 *   2. No root `.ts` file calls `console.*` at all — genimg used to be the one holdout, logging
 *      through emoji-prefixed console lines that Loki's rules had never actually been proven
 *      against. Keeping the whole package on one logger (pino) is what makes assertion 1 possible
 *      in the first place.
 */

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.join(TEST_DIR, "..");
const ALERTS_DIR = path.join(TEST_DIR, "../alerts");

/** Messages that deliberately have no alert rule, and why. */
const EXEMPT: Record<string, string> = {
  "Error starting local server":
    "only runs when NODE_ENV=test (local dev bootstrap) — never deployed",
};

/** Resource-name fragments this package's functions deploy under (serverless.yml). */
const SCW_JS_FUNCTIONS = ["llmx402", "searchapi", "genimgx402token", "growthapi"];

const messages = extractLoggerErrorMessages(PACKAGE_ROOT);
const rules = extractRules(ALERTS_DIR);
const scwJsRules = rulesForFunctions(rules, SCW_JS_FUNCTIONS);

describe("scw_js alert coverage", () => {
  it("found a realistic number of logger.error call sites", () => {
    // A floor, not an exact count — guards against the extractor silently matching nothing,
    // which would make every other test in this file vacuously pass.
    expect(messages.length).toBeGreaterThanOrEqual(15);
  });

  it("found this package's alert rules", () => {
    expect(scwJsRules.length).toBeGreaterThanOrEqual(4);
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
        isCovered(scwJsRules, message),
        `logger.error("${message}") in ${file} is not matched by any rule's first filter in ` +
          `alerts/*.yaml, and is not in this test's EXEMPT map. Either add/extend a rule there, ` +
          `or add this message to EXEMPT with a reason.`,
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
