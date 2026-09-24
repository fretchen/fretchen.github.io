import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Coverage guard for the "logger.error means ours, and should page" convention — see
 * alerts/payments.yaml's "The `logger.error` convention" section and this package's README
 * "Alerting on log content" section. Mirrors x402_facilitator/test/alert_coverage.test.ts; see
 * that file's header for the fuller rationale (#683). The two are duplicated rather than shared
 * because the packages are independent npm packages with no shared test infrastructure.
 *
 * Two assertions:
 *   1. Every `logger.error(...)` call site in this package's root `.ts` files is matched by some
 *      rule's filter in `alerts/*.yaml`, or is named in EXEMPT with a reason.
 *   2. No root `.ts` file calls `console.*` at all — genimg used to be the one holdout, logging
 *      through emoji-prefixed console lines that Loki's rules had never actually been proven
 *      against. Keeping the whole package on one logger (pino) is what makes assertion 1 possible
 *      in the first place.
 *
 * Deliberately a light regex scan over source text, not a TS/YAML parser — same spirit as
 * website/test/styleConventions.test.ts. Known limits, both acceptable for a guard whose job is
 * to catch an *omission*, not to fully model Loki:
 *   - The message is taken as the LAST string/template literal in a logger.error(...) call's
 *     argument list. True for every call in this package today, because the merging object
 *     (`{ err, network }`, ...) never itself contains a quoted string value.
 *   - Only a rule's FIRST `|=`/`|~` log-line filter is checked, and rule SELECTION is coarse: a
 *     rule counts as "for this package" if its resource_name selector text mentions any of
 *     llmx402/searchapi/genimgx402token/growthapi, without attributing which message came from
 *     which deployed function. Real Loki ANDs every filter and anchors the selector per function
 *     (see services.yaml's header on `.+llmx402` never matching `…llmx402cron`), so this is more
 *     permissive than the deployed rules. That direction of error is the safe one: it can
 *     under-report a genuine gap far less easily than it can wrongly flag a covered message. The
 *     one place this repo has hit the imprecision in practice — PaidPathBroken's selector textually
 *     mentions "llmx402" but never actually matches the cron — is handled by keeping the REAL
 *     alerting correct (PaymentCronFailed carries the cron's own copy of that phrase), not by
 *     relying on this test to catch it.
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

function sourceFiles(): string[] {
  return fs.readdirSync(PACKAGE_ROOT).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
}

/** Strips string/template literal contents — used so a phrase quoted as sample DATA (not a real
 *  logger/console call) can't be mistaken for one. See llm_service.ts's mock chat completion,
 *  which embeds the literal text "console.log(...)" inside a markdown code fence string. */
function stripStringLiterals(text: string): string {
  return text.replace(/"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*'/g, '""');
}

interface LoggedMessage {
  file: string;
  message: string;
}

function extractLoggerErrorMessages(): LoggedMessage[] {
  const messages: LoggedMessage[] = [];
  for (const file of sourceFiles()) {
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
const scwJsRules = rules.filter((r) => SCW_JS_FUNCTIONS.some((name) => r.selector.includes(name)));

function isCovered(message: string): boolean {
  return scwJsRules.some((rule) => {
    const first = rule.filters[0];
    if (!first) {
      return false;
    }
    return first.op === "="
      ? message.includes(first.value)
      : new RegExp(first.value).test(message);
  });
}

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
        isCovered(message),
        `logger.error("${message}") in ${file} is not matched by any rule's first filter in ` +
          `alerts/*.yaml, and is not in this test's EXEMPT map. Either add/extend a rule there, ` +
          `or add this message to EXEMPT with a reason.`,
      ).toBe(true);
    });
  }

  for (const file of sourceFiles()) {
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
