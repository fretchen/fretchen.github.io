import type { X402Tool } from "../types/x402";

/**
 * The model's research notes, as a tool.
 *
 * The notes are kept nowhere but in the conversation: a `note_findings` call's own *arguments*
 * stay in the assistant turn for the rest of the user turn, while the raw page and search results
 * they were taken from are compacted away by `utils/toolLoop.ts` one hop later. So this tool
 * stores nothing and returns almost nothing — its job is to give the findings a fixed shape
 * (claim, source, status) that the synthesis can rely on, and to tell the model when a batch is
 * malformed. No `get_notes` (they are already in context) and no reset (the per-turn
 * conversation is discarded after each turn anyway).
 *
 * Free and local: no fetch, no payment. React-free like the other tool modules.
 */

/** Findings per call. A batch is what one round of reading produces, not a whole report. */
const MAX_FINDINGS = 10;

/** One sentence, condensed — a claim longer than this is a paste of the source, not a note. */
const MAX_CLAIM_CHARS = 400;

const STATUSES = ["open", "answered", "blocked"] as const;

export const noteFindingsTool: X402Tool = {
  type: "function",
  function: {
    name: "note_findings",
    description:
      "Record what you learned, while researching with search_web/fetch_url. Call it in the same " +
      "step as your next search or fetch, never alone. Raw results disappear one step after you " +
      "read them; only your notes stay. One condensed sentence per claim, with the url it came from.",
    parameters: {
      type: "object",
      properties: {
        findings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              claim: { type: "string", description: "One condensed sentence, or an open sub-question." },
              source_url: { type: "string", description: "The url the claim comes from. Omit only for open." },
              status: { type: "string", enum: [...STATUSES] },
              confidence: { type: "string", enum: ["high", "medium", "low"] },
            },
            required: ["claim", "status"],
          },
        },
      },
      required: ["findings"],
    },
  },
};

// --- Result contract -------------------------------------------------------------------------

export type NoteFindingsResult = { status: "ok"; recorded: number } | { status: "invalid"; reason: string };

/**
 * Checks one batch and says how many findings it held. Pure: the findings themselves are already
 * in the conversation as this call's arguments, so there is nothing to store.
 *
 * `invalid` is an answer, not a malfunction — the runner marks it recoverable so the model can
 * resend a corrected batch rather than losing the tool for the rest of the turn.
 */
export function validateFindings(args: Record<string, unknown>): NoteFindingsResult {
  const findings = args.findings;
  if (!Array.isArray(findings) || findings.length === 0) {
    return { status: "invalid", reason: "findings must be a non-empty array." };
  }
  if (findings.length > MAX_FINDINGS) {
    return { status: "invalid", reason: `At most ${MAX_FINDINGS} findings per call.` };
  }
  for (const [i, finding] of findings.entries()) {
    const { claim, source_url, status } = (finding ?? {}) as Record<string, unknown>;
    if (typeof claim !== "string" || !claim.trim()) {
      return { status: "invalid", reason: `findings[${i}].claim must be a non-empty string.` };
    }
    if (claim.length > MAX_CLAIM_CHARS) {
      return { status: "invalid", reason: `findings[${i}].claim is too long; condense it to one sentence.` };
    }
    if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
      return { status: "invalid", reason: `findings[${i}].status must be one of ${STATUSES.join(", ")}.` };
    }
    // An answered or blocked claim has to say where it came from — that url is what the final
    // answer cites, and a claim without one is exactly the fabricated citation this prevents.
    if (status !== "open" && !(typeof source_url === "string" && source_url.startsWith("https://"))) {
      return { status: "invalid", reason: `findings[${i}].source_url must be the https url the claim came from.` };
    }
  }
  return { status: "ok", recorded: findings.length };
}
