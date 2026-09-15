/**
 * The current date, phrased for the chat model's system prompt.
 *
 * Deliberately not a tool. A `get_date` tool only fires if the model knows that it does not know
 * the date — and it does not: it believes its training cutoff is today, which is the failure this
 * fixes. The date is also needed *before* the first tool call, because it ends up inside tool
 * arguments (`get_sitzungen` filters on ISO `von`/`bis` strings), and every hop is a separately
 * paid completion out of `MAX_HOPS`. In the system prompt it costs no hop and no tool budget.
 *
 * English even for the German locale, and therefore not in `locales/`: this is an instruction to
 * the model rather than user-facing copy, like the `description` strings in `tools/*.ts`.
 */

/** `now` and `timeZone` are parameters rather than read from the ambient clock so the function is
 *  pure — testable without fake timers, and independent of the machine's own zone. */
export function formatDateContext(now: Date, timeZone: string): string {
  // `en-CA` renders YYYY-MM-DD, and `timeZone` makes it the *local* day. `toISOString()` would be
  // shorter and wrong: it is UTC, so from 22:00 CEST onwards it names yesterday — precisely when
  // someone asks what today is.
  const isoDate = now.toLocaleDateString("en-CA", { timeZone });
  // The weekday comes along because "last week" and "on Monday" are otherwise guessed too.
  const weekday = now.toLocaleDateString("en-US", { timeZone, weekday: "long" });

  return (
    `Today is ${weekday}, ${isoDate} (${timeZone}). Use this for anything relative — "today", ` +
    `"this week", "the last session" — including ISO date arguments you pass to tools. Never use ` +
    `your training data to decide what the current date is.`
  );
}
