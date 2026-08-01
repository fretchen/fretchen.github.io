import type { PageContext } from "vike/types";
import { defaultLocale } from "../locales/locales";

/**
 * `<html lang>`, following the URL locale that +onBeforeRoute.ts puts on the pageContext.
 *
 * This was previously unset, so every page — including the `/de/` routes — claimed to be
 * English. Beyond being wrong for screen readers and search engines, it is what makes
 * `hyphens: auto` on the prose container safe: without a correct lang the browser
 * hyphenates German compounds by English rules.
 *
 * Lives in its own file because Vike serialises +config.ts values to JSON and so rejects
 * function-valued configs there.
 */
export default function lang(pageContext: PageContext): string {
  return pageContext.locale ?? defaultLocale;
}
