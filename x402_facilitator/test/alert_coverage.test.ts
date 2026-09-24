import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Coverage guard for the "logger.error means ours, and should page" convention — see
 * scw_js/alerts/payments.yaml's "The `logger.error` convention" section and this package's
 * README "Alerting" note.
 *
 * Why this exists: #683 was a batch of deep x402 bugs that ran silently for weeks because
 * nothing alerted on the log lines that recorded them. The fix was `scw_js/alerts/*.yaml`, but a
 * yaml file with rules only helps for the failures someone remembered to write a rule for. This
 * test makes that pairing an assertion instead of a habit: every `logger.error(...)` call site in
 * this package must be matched by some rule's filter, or be named in EXEMPT with a reason. Add a
 * new logger.error with no matching rule (or delete a rule a message still depends on) and this
 * test fails, in this package, before it reaches production.
 *
 * Deliberately a light regex scan over source text, not a TS/YAML parser — same spirit as
 * website/test/styleConventions.test.ts. Known limits, both acceptable for a guard whose job is
 * to catch an *omission*, not to fully model Loki:
 *   - The message is taken as the LAST string/template literal in a logger.error(...) call's
 *     argument list. True for every call in this package today, because the merging object
 *     (`{ err, network }`, ...) never itself contains a quoted string value. A call that broke
 *     this assumption would still be scanned, just possibly mismatched.
 *   - Only a rule's FIRST `|=`/`|~` log-line filter is checked. Real Loki ANDs every filter on a
 *     rule (see FacilitatorNeedsAttention, which also requires "Settlement failed"), so this is
 *     more permissive than the deployed rule. That direction of error is the safe one here: it
 *     can under-report a genuine gap far less easily than it can wrongly flag a covered message.
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

interface LoggedMessage {
  file: string;
  message: string;
}

function extractLoggerErrorMessages(): LoggedMessage[] {
  const files = fs
    .readdirSync(PACKAGE_ROOT)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));

  const messages: LoggedMessage[] = [];
  for (const file of files) {
    const text = fs.readFileSync(path.join(PACKAGE_ROOT, file), "utf8");
    for (const call of text.matchAll(/logger\.error\(([\s\S]*?)\);/g)) {
      const args = call[1];
      // The message is the last string/template literal in the call's argument list.
      const literals = [...args.matchAll(/"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g)];
      if (literals.length === 0) {
        continue; // e.g. a bare logger.error(err) — none exist today
      }
      const raw = literals[literals.length - 1][0];
      const message = raw.startsWith("`")
        ? raw.slice(1, -1).split("${")[0] // static prefix of a template literal
        : raw.slice(1, -1);
      messages.push({ file, message });
    }
  }
  return messages;
}

interface Rule {
  alert: string;
  selector: string;
  filters: { op: "=" | "~"; value: string }[];
}

function extractRules(): Rule[] {
  const rules: Rule[] = [];
  for (const yamlFile of fs.readdirSync(ALERTS_DIR).filter((f) => f.endsWith(".yaml"))) {
    const text = fs.readFileSync(path.join(ALERTS_DIR, yamlFile), "utf8");
    // Every rule is a "  - alert: Name" list item at the same indent; split on that marker.
    const chunks = text.split(/\n(?= {2}- alert: )/).slice(1);
    for (const chunk of chunks) {
      const alert = /- alert: (\S+)/.exec(chunk)?.[1];
      const selector = /resource_name=~?"((?:[^"\\]|\\.)*)"/.exec(chunk)?.[1];
      if (!alert || !selector) {
        continue;
      }
      const filters = [...chunk.matchAll(/\|([=~]) "((?:[^"\\]|\\.)*)"/g)].map((m) => ({
        op: m[1] as "=" | "~",
        value: m[2],
      }));
      rules.push({ alert, selector, filters });
    }
  }
  return rules;
}

const messages = extractLoggerErrorMessages();
const rules = extractRules();
// Only rules whose selector names this package's two deployed functions — a rule scoped to
// llmx402cron or searchapi says nothing about whether the facilitator itself is covered.
const facilitatorRules = rules.filter(
  (r) => r.selector.includes("facilitator") || r.selector.includes("walletreportcron"),
);

function isCovered(message: string): boolean {
  return facilitatorRules.some((rule) => {
    const first = rule.filters[0];
    if (!first) {
      return false;
    }
    return first.op === "=" ? message.includes(first.value) : new RegExp(first.value).test(message);
  });
}

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
        isCovered(message),
        `logger.error("${message}") in ${file} is not matched by any rule's first filter in ` +
          `scw_js/alerts/*.yaml, and is not in this test's EXEMPT map. Either add/extend a rule ` +
          `there, or add this message to EXEMPT with a reason.`,
      ).toBe(true);
    });
  }
});
