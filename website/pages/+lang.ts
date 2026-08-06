import type { PageContext } from "vike/types";
import { defaultLocale } from "../locales/locales";

/**
 * `<html lang>`, following the URL locale that +onBeforeRoute.ts puts on the pageContext.
 *
 * This was previously unset, so every page — including the `/de/` routes — claimed to be
 * English, which is wrong for screen readers and search engines.
 *
 * Not load-bearing for hyphenation, despite what an earlier comment here claimed: the prose
 * container sets `hyphens: manual`, and this value follows the URL prefix rather than the
 * content's language anyway — blog posts are untranslated and serve under both prefixes.
 *
 * Lives in its own file because Vike serialises +config.ts values to JSON and so rejects
 * function-valued configs there.
 */
export default function lang(pageContext: PageContext): string {
  return pageContext.locale ?? defaultLocale;
}
