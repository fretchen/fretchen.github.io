import { PaymentError } from "../utils/x402PaidFetch";

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

/** A tool call that could not be paid for. Separate from `fetch_failed` because the model's next
 *  move differs: one is "try a different source", the other is "say the payment did not go
 *  through". Saying "I found nothing" when the channel is empty would simply be false. */
export type PaymentFailure = { status: "channel_busy" | "payment_failed"; reason: string };

/**
 * A payment failure as a tool result, or null when the error was not one — so a caller can fall
 * through to `fetchFailed` for everything else.
 *
 * Two statuses, not three. `channel_busy` is the only payment failure with a different next move
 * (the per-channel lock clears within seconds, so the next hop can succeed), and the wallet's own
 * reason carries the rest of the detail — a drained channel, a declined signature, an underfunded
 * wallet all arrive with `PaymentError`'s message already written for a human.
 */
export function paymentFailed(err: unknown): PaymentFailure | null {
  if (!(err instanceof PaymentError)) {
    return null;
  }
  if (err.isChannelBusy) {
    return {
      status: "channel_busy",
      reason: "The payment channel is busy settling the previous request. It clears within seconds.",
    };
  }
  // Its own wording rather than `PaymentError`'s, which was written for the chat — where the user
  // resends and the SDK deposits on the way. Mid-turn there is nothing to approve, and a tool that
  // told the model to promise a wallet prompt sent a real user looking for a popup that could not
  // appear. State the situation; the next message is what triggers the top-up.
  if (err.isDrainedChannel) {
    return {
      status: "payment_failed",
      reason: "The payment channel has no funds left for this call. It needs a top-up before the web tools work again.",
    };
  }
  return { status: "payment_failed", reason: describeFailure(err) };
}
