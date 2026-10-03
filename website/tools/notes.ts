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

/** One finding as far as anything outside the model cares: the claim, and where it came from. */
export type Finding = { claim: string; source_url?: string };

/**
 * The usable findings out of a call's parsed arguments — every entry with a non-empty `claim`.
 * Shared by the runner and the chat's notes list, so the two can never disagree about what was
 * noted. Deliberately lenient: the notepad is read by the model alone, and rejecting a long claim
 * or a missing url would only cost a paid hop for the resend. The schema's `status` and
 * `source_url` shape what the model writes; the prompt carries the citation discipline.
 */
export function readFindings(args: unknown): Finding[] {
  const findings = (args as { findings?: unknown } | null)?.findings;
  if (!Array.isArray(findings)) return [];
  return findings.flatMap((entry: unknown) => {
    const { claim, source_url } = (entry ?? {}) as { claim?: unknown; source_url?: unknown };
    if (typeof claim !== "string" || !claim.trim()) return [];
    return [{ claim, ...(typeof source_url === "string" ? { source_url } : {}) }];
  });
}

/**
 * Says how many findings a batch held. Pure: the findings themselves are already in the
 * conversation as this call's arguments, so there is nothing to store.
 *
 * `invalid` only for a batch with nothing in it — an answer, not a malfunction, so the runner marks
 * it recoverable and the notepad stays on offer.
 */
export function validateFindings(args: Record<string, unknown>): NoteFindingsResult {
  const recorded = readFindings(args).length;
  return recorded > 0
    ? { status: "ok", recorded }
    : { status: "invalid", reason: "findings must be a non-empty array of { claim, source_url, status }." };
}
