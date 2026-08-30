/**
 * The German the three widgets speak, in one place — so a child moving from the shapes to
 * the coastline to their own drawing hears the same sentence pattern each time, and so a
 * wording change happens once instead of three times.
 */

export function formatFactor(factor: number): string {
  return factor.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * The dimension, i.e. the exponent in ×F = 2^d. Two decimals, so it matches the values the
 * appendix quotes (Bretagne ≈ 1,19, Normandie ≈ 1,08).
 *
 * This is the one place a logarithm appears in the widgets' user-facing output, and it is
 * never called one: written as the exponent of a power of two, the same number becomes
 * something a sixth-grader can read off directly.
 */
export function formatDimension(dimension: number): string {
  return dimension.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** What is being measured, so the sentence reads naturally in each widget. */
export type Subject = "die Form" | "die Küste" | "deine Linie";

/**
 * The guidance line's sentence after a measurement. It does the one division the child
 * would otherwise have to do in their head, and it does it in words rather than leaving
 * it to be read off two table rows.
 *
 * Returned in parts because the count is the one thing set in the accent colour — the
 * "number in focus" rule. Everything else in the widget stays neutral.
 */
export interface CountSentence {
  before: string;
  count: string;
  after: string;
}

export function countSentence(count: number, previousCount: number | null, subject: Subject): CountSentence {
  if (previousCount === null || previousCount <= 0) {
    return { before: "", count: `${count} Kästchen`, after: ` berühren ${subject}.` };
  }
  const factor = formatFactor(count / previousCount);
  return { before: "Jetzt sind es ", count: `${count} Kästchen`, after: ` — ${factor}-mal so viele wie eben.` };
}
