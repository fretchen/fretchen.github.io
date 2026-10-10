/**
 * The language instruction for the chat model's system prompt.
 *
 * The prompts themselves (`website/prompts/`) are English-only by design — instructions to
 * the model, not user-facing copy, exactly like `utils/dateContext.ts` and the tool
 * `description`s in `tools/*.ts`. The German locale therefore does not get translated
 * prompts: it gets this one injected sentence, appended to the system message at send time.
 * One canonical prompt text per concern, no translation drift, and the German bundle
 * ships one sentence instead of three translated prompts.
 *
 * The locale is a default, not a mandate: typing English in German mode still gets a German
 * answer, but an explicit request for another language — "translate this to English",
 * "how do you say X in French" — wins for that answer. (The original "always, regardless of
 * the language the user writes in" wording was revised 2026-10-10: it absurdly forbade the
 * most common legitimate exception, translation requests.)
 */

/** `locale` is a parameter rather than read from the page context so the function is pure —
 * testable without a Vike page context, and callable from the send-time closure with whatever
 * locale the page resolved. Returns null when no instruction is needed, so the composition's
 * `.filter(Boolean)` drops it. */
export function formatLanguageContext(locale: string): string | null {
  if (locale !== "de") return null;
  return "Answer in German by default. If the user explicitly asks for a different language — a translation request, for instance — answer in that language instead.";
}
