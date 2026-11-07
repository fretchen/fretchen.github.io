import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Builtins-only parser, imported by relative path exactly like scw_js's and
// x402_facilitator's copies of this test — no node_modules of this package are needed, so the
// CI job that runs these tests does not need observability/ installed. See its header.
import { extractRules, rulesForFunctions, isCovered } from "../../observability/alertCoverage.js";

/**
 * The twins have NO alert_coverage test on purpose: their lines carry `level` as a real Loki
 * label, so `{level="error"}` covers every logger.error by construction and any test would be
 * a tautology (see the reasoning in observability/alerts/bunny.yaml's header). The facilitator
 * breaks that argument: its most valuable alertable lines are `logger.warn` BY DESIGN (a
 * caller's fault is warn), so the bunny rule carries a phrase alternation for it — and a
 * phrase list can silently drift away from the call sites it was written for, which is the
 * exact failure this test family exists to catch (see the #683 history). This test pins the
 * ported facilitator files in this package to that alternation in three ways:
 *   1. every `logger.error` message matches the alternation,
 *   2. the warn-level alert phrases (synthetic lines in the ported logger's wire format —
 *      message BEFORE the merging object) match it, including the our-fault reason filter,
 *   3. a caller-fault "Settlement failed" line doesn't match it (the reason filter is load-
 *      bearing: without it every caller error pages).
 *
 * The reason list below is payments.yaml's our-fault list, verbatim — not an invention: the
 * scw rule chose these reasons for the facilitator and this port is parity, not new semantics.
 */

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(TEST_DIR, "..", "src");
const ALERTS_DIR = path.join(TEST_DIR, "../../observability/alerts");

/** The facilitator's surface in this package — payment core + routing + instance. */
const FACILITATOR_FILES = [
  "facilitator_routes.ts",
  "facilitator_instance.ts",
  "chain_utils.ts",
  "revert_selectors.ts",
  "x402_fee.ts",
  "x402_schemas.ts",
  "x402_settle.ts",
  "x402_supported.ts",
  "x402_verify.ts",
  "x402_whitelist.ts",
];

const messages = FACILITATOR_FILES.flatMap((file) => {
  const text = fs.readFileSync(path.join(SRC_DIR, file), "utf8");
  const callSites = [...text.matchAll(/logger\.error\(([\s\S]*?)\);/g)];
  return callSites.map((call, i) => {
    const literals = [...call[1].matchAll(/"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g)];
    const raw = literals[literals.length - 1][0];
    const message = raw.startsWith("`") ? raw.slice(1, -1).split("${")[0] : raw.slice(1, -1);
    return { file: `${file}#${call.index ?? i}`, message };
  });
});

const rules = rulesForFunctions(extractRules(ALERTS_DIR), ["facilitator"]);
const alternation = rules[0]?.filters[0];

if (!alternation || alternation.op !== "~") {
  throw new Error('bunny.yaml\'s facilitator branch must be the first `|~ "…"` filter in its rule');
}

const matches = (line: string): boolean => new RegExp(alternation.value).test(line);

describe("facilitator alert coverage (bunny rule alternation vs this package's call sites)", () => {
  it("found a realistic number of logger.error call sites", () => {
    // A floor, not an exact count — guards against the extraction silently matching nothing,
    // which would make the second test vacuously pass.
    expect(messages.length).toBeGreaterThanOrEqual(5);
  });

  it("every ported logger.error message is matched by the bunny rule's alternation", () => {
    expect(isCovered(rules, "irrelevant-probe")).toBe(false); // the rule is phrase-based, not a catch-all
    for (const { file, message } of messages) {
      expect(
        matches(message),
        `logger.error("${message}") (${file}) is not matched by the facilitator branch of ` +
          `observability/alerts/bunny.yaml — extend its alternation. See the facilitator's ` +
          `old scw-side coverage history for why a phrase can silently drift.`,
      ).toBe(true);
    }
  });

  describe("the warn-level alert phrases, in the ported logger's wire format", () => {
    // The ported logger buffers `{ message: msg, ...fields }` — message BEFORE the merging
    // object, where pino wrote it after. The alternation's reason filter therefore sits on
    // the `message` side: `Settlement failed.*(_transaction_failed|…)`.
    const fruitsOfOurFault = [
      "refund_transaction_failed",
      "insufficient_fee_allowance",
      "settlement_rpc_read_failed",
      "batch_claim_transaction_failed",
      "eip3009_transfer_transaction_failed",
    ];

    for (const reason of fruitsOfOurFault) {
      it(`pages on "Settlement failed" with reason ${reason}`, () => {
        expect(matches(`{"message":"Settlement failed","errorReason":"${reason}"}`)).toBe(true);
      });
    }

    it("does not page on a caller-fault settlement failure", () => {
      // The reason filter is the whole point: a bad signature or a malformed payload is the
      // seller's caller's problem and must not email anyone.
      expect(
        matches(`{"message":"Settlement failed","errorReason":"signature_validation_failed"}`),
      ).toBe(false);
    });

    it("pages on a broadcast settlement whose outcome is unknown — both scheme wordings", () => {
      expect(
        matches('{"message":"Settlement broadcast but unconfirmed — reconcile on chain"}'),
      ).toBe(true);
      expect(
        matches(
          '{"message":"Batch-settlement claim/settle broadcast but unconfirmed — reconcile on chain"}',
        ),
      ).toBe(true);
    });
  });
});
