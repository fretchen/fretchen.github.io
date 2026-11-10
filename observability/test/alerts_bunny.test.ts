/**
 * Phrase-behavior tests for alerts/bunny.yaml — the sole rule on the custom bunny-logs data
 * source. Same idea as alerts_payments.test.ts: the rule is pushed as raw text and never
 * exercised locally, so nothing else notices a filter that stopped matching the line it was
 * written for.
 *
 * Two sub-filters live in the rule's expr, and each gets its own assertions:
 *   1. the facilitator's phrase filter — the settlement/fee/unhandled-error branches that moved
 *      from payments.yaml when the facilitator moved to bunny_js. Its lines arrive as the flush's
 *      JSON payload (`{"message":…}` — the flush maps pino's msg onto `message`), reason fields
 *      AFTER the message.
 *   2. the twins' level filter — a real label match, so the "lines" here are whole streams.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const yaml = readFileSync(fileURLToPath(new URL("../alerts/bunny.yaml", import.meta.url)), "utf8");

/** Every `|~ "..."` line filter in the rule, as usable RegExps, in file order. */
const filters = [...yaml.matchAll(/\|~ "([^"]+)"/g)].map((m) => new RegExp(m[1]));
const facilitatorFilter = filters.find((f) => f.source.startsWith("Settlement failed"));
if (!facilitatorFilter) {
  throw new Error(
    'No facilitator phrase filter found in bunny.yaml (expected |~ "Settlement failed…")',
  );
}

/** A facilitator line as the flush writes it into the custom source: message first, then fields. */
const facilitatorLine = (msg: string, fields: Record<string, string> = {}) =>
  `{"message":"${msg}"${Object.entries(fields)
    .map(([k, v]) => `,"${k}":"${v}"`)
    .join("")}}`;

describe("alerts/bunny.yaml — BunnySellersNeedAttention", () => {
  describe("the facilitator's phrase filter", () => {
    it.each([
      { msg: "Settlement failed", errorReason: "refund_simulation_failed" },
      { msg: "Settlement failed", errorReason: "refund_transaction_failed" },
      { msg: "Settlement failed", errorReason: "insufficient_fee_allowance" },
      { msg: "Settlement failed", errorReason: "invalid_exact_evm_transaction_failed" },
      { msg: "Settlement failed", errorReason: "invalid_batch_settlement_evm_rpc_read_failed" },
    ])("pages on $msg with $errorReason", ({ msg, errorReason }) => {
      expect(facilitatorFilter.test(facilitatorLine(msg, { errorReason }))).toBe(true);
    });

    it("pages on a settlement broadcast but unconfirmed", () => {
      expect(
        facilitatorFilter.test(
          facilitatorLine("Settlement broadcast but unconfirmed — reconcile on chain"),
        ),
      ).toBe(true);
    });

    it.each([
      "Settlement threw",
      "Unexpected error in handler",
      "Unexpected error during payment verification",
      "Fee collection failed after successful settlement",
      "Fee transaction reverted",
    ])("pages on %s", (msg) => {
      expect(facilitatorFilter.test(facilitatorLine(msg))).toBe(true);
    });

    /** The settlement branch exists to be narrower than "Settlement failed": a caller's bad
     *  signature or empty allowance is their problem, and paging on it is how people stop reading
     *  alerts. Merging it with the other branches must not have widened it. */
    it.each([
      "invalid_signature",
      "insufficient_funds",
      "authorization_already_used",
      "invalid_permit2_recipient_mismatch",
    ])("stays quiet on the caller error %s", (errorReason) => {
      expect(facilitatorFilter.test(facilitatorLine("Settlement failed", { errorReason }))).toBe(
        false,
      );
    });

    it("stays quiet on a facilitator success line", () => {
      expect(facilitatorFilter.test(facilitatorLine("Settlement successful"))).toBe(false);
    });
  });
});
