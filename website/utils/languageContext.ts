/**
 * The language instruction for the chat model's system prompt.
 *
 * The prompts themselves (`website/prompts/`) are English-only by design — instructions to
 * the model, not user-facing copy, exactly like `utils/dateContext.ts` and the tool
 * `description`s in `tools/*.ts`. The German locale therefore does not get translated
 * prompts: it gets this one injected sentence, appended to the system message at send time.
 * One canonical prompt text per concern, no translation drift, and the German bundle
 * ships one sentence instead of three translated prompts.
 */

/** `locale` is a parameter rather than read from the page context so the function is pure —
 * testable without a Vike page context, and callable from the send-time closure with whatever
 * locale the page resolved. Returns null when no instruction is needed, so the composition's
 * `.filter(Boolean)` drops it. */
export function formatLanguageContext(locale: string): string | null {
  if (locale !== "de") return null;
  // "Regardless of the language the user writes in": in German mode an English-typed question
  // still gets a German answer — the locale is the user's choice of interface, not a
  // per-message language hint (planner decision, round 1).
  return "Always write your answers in German, regardless of the language the user writes in.";
}
