/**
 * Turning a thrown error into something a tool can hand back to the model.
 *
 * Shared rather than per-tool because every tool needs the same two things and the cost of getting
 * it wrong is the same everywhere: a tool result goes into the conversation and is billed as input
 * tokens on *every* subsequent hop of the turn. Wallet and SDK errors are routinely multi-line and
 * very long, so an unbounded `err.message` is a recurring charge, not a one-off.
 */

/** Longest failure reason worth sending. Past this the model has the gist and the rest is cost. */
const MAX_REASON_LENGTH = 200;

/** A short, single-line description of a failure, for the model to explain to the user — instead
 *  of the generic "I'm having trouble" it produces when the reason is withheld entirely. */
export function describeFailure(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const singleLine = message.replace(/\s+/g, " ").trim();
  return singleLine.length > MAX_REASON_LENGTH ? `${singleLine.slice(0, MAX_REASON_LENGTH)}…` : singleLine;
}

/** The wire-level failure result shared by the fetching tools. */
export function fetchFailed(err: unknown): { status: "fetch_failed"; reason: string } {
  return { status: "fetch_failed", reason: describeFailure(err) };
}
