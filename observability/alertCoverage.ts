import fs from "node:fs";
import path from "node:path";

/**
 * Shared parser behind `scw_js/test/alert_coverage.test.ts` and
 * `x402_facilitator/test/alert_coverage.test.ts`. Both import it by relative path and read the
 * rules next to it in `alerts/`, so neither service owns the alerting setup. It replaced two
 * hand-copied versions of this parser, which had already drifted once (only one of them had the
 * console.* check).
 *
 * **Node built-ins only.** Those two packages' CI jobs never run `npm install` here, so an import
 * from this package's own node_modules would work locally and break in CI.
 *
 * Deliberately a light regex scan over source text, not a TS/YAML parser — same spirit as
 * website/test/styleConventions.test.ts. Known limits, both acceptable for a guard whose job is
 * to catch an *omission*, not to fully model Loki:
 *   - The message is taken as the LAST string/template literal in a logger.error(...) call's
 *     argument list. True for every call in both packages today, because the merging object
 *     (`{ err, network }`, ...) never itself contains a quoted string value. A call that broke
 *     this assumption would still be scanned, just possibly mismatched.
 *   - Only a rule's FIRST `|=`/`|~` log-line filter is checked, and rule SELECTION is coarse: a
 *     rule "counts" for a package if its resource_name selector text mentions any of that
 *     package's function names, without attributing which message came from which deployed
 *     function. Real Loki ANDs every filter and anchors the selector per function (see
 *     alerts/services.yaml's header on `.+llmx402` never matching `…llmx402cron`), so this
 *     is more permissive than the deployed rules. That direction of error is the safe one: it can
 *     under-report a genuine gap far less easily than it can wrongly flag a covered message. The
 *     one place this repo has hit the imprecision in practice — PaidPathBroken's selector textually
 *     mentions "llmx402" but never actually matches the cron — is handled by keeping the REAL
 *     alerting correct (PaymentCronFailed carries the cron's own copy of that phrase), not by
 *     relying on this test to catch it.
 */

export interface LoggedMessage {
  file: string;
  message: string;
}

export interface Rule {
  alert: string;
  selector: string;
  filters: { op: "=" | "~"; value: string }[];
}

/** Every root `.ts` file in `packageRoot` that isn't a test file. */
export function sourceFiles(packageRoot: string): string[] {
  return fs.readdirSync(packageRoot).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
}

/** Strips string/template literal contents — used so a phrase quoted as sample DATA (not a real
 *  logger/console call) can't be mistaken for one. See scw_js/llm_service.ts's mock chat
 *  completion, which embeds the literal text "console.log(...)" inside a markdown code fence
 *  string. */
export function stripStringLiterals(text: string): string {
  return text.replace(/"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*'/g, '""');
}

export function extractLoggerErrorMessages(packageRoot: string): LoggedMessage[] {
  const messages: LoggedMessage[] = [];
  for (const file of sourceFiles(packageRoot)) {
    const text = fs.readFileSync(path.join(packageRoot, file), "utf8");
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

export function extractRules(alertsDir: string): Rule[] {
  const rules: Rule[] = [];
  for (const yamlFile of fs.readdirSync(alertsDir).filter((f) => f.endsWith(".yaml"))) {
    const text = fs.readFileSync(path.join(alertsDir, yamlFile), "utf8");
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

/** Rules whose selector text mentions any of the given deployed-function-name fragments. */
export function rulesForFunctions(rules: Rule[], functionNames: string[]): Rule[] {
  return rules.filter((r) => functionNames.some((name) => r.selector.includes(name)));
}

export function isCovered(rules: Rule[], message: string): boolean {
  return rules.some((rule) => {
    const first = rule.filters[0];
    if (!first) {
      return false;
    }
    return first.op === "=" ? message.includes(first.value) : new RegExp(first.value).test(message);
  });
}
