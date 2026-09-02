export const locales = ["en", "de"];
export const defaultLocale = "en";

/**
 * Paths that genuinely exist in German — not just German chrome around English prose.
 *
 * `/de/` renders for *every* route, but `locales/de.ts` only translates the `imagegen` and
 * `assistent` namespaces (plus the shared `walletoptions` / `metadataLine` chrome). On a blog
 * post or a lecture the body therefore stays English and only the navigation changes, which is
 * the pattern Google names explicitly:
 *
 *   "Translating only the boilerplate text of your pages while keeping the bulk of your content
 *    in a single language ... can create a bad user experience if the same content appears
 *    multiple times in search results with various boilerplate languages."
 *   https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
 *
 * Claiming a German alternate for all ~84 URLs is what produced the duplicate-content signals.
 * So hreflang is declared only for the paths listed here — where the page really is a second
 * language version — and every other `/de/` page canonicalises to its English original instead.
 * The pages still render, so the language toggle keeps working and the chrome stays German.
 *
 * To add a page: translate its actual content, then add its path (locale-stripped, trailing
 * slash — the form `extractLocale` returns) to this list. Both `pages/+Head.tsx` and
 * `utils/generateSitemap.ts` read it; the sitemap is a standalone script and cannot see Vike's
 * page config, which is why this is a plain shared constant rather than a `+` setting.
 */
export const localizedPaths = ["/imagegen/", "/assistent/"];

/** Whether `pathWithoutLocale` (trailing slash included) has a real translation. */
export function isLocalizedPath(pathWithoutLocale: string): boolean {
  return localizedPaths.includes(pathWithoutLocale);
}
