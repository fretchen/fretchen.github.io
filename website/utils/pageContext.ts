import type { PageContext } from "vike/types";
import { extractLocale } from "../locales/extractLocale";
import { defaultLocale } from "../locales/locales";
import { SITE_CONFIG } from "./siteConfig";

/**
 * Gets the current page URL pathname in a consistent way across the application.
 *
 * This function provides a standardized approach to accessing the page URL:
 * - Prefers `urlOriginal` which is always available during SSR and pre-rendering
 * - Falls back to `urlPathname` for edge cases in client-side routing
 * - Returns empty string as final fallback for safety
 *
 * @param pageContext - The Vike page context object
 * @returns The current page URL pathname (e.g., "/blog/14" or "/de/blog/14")
 *
 * @example
 * ```tsx
 * const pathname = getPageUrl(pageContext);
 * const { locale, urlPathnameWithoutLocale } = extractLocale(pathname);
 * ```
 */
export function getPageUrl(pageContext: PageContext): string {
  return pageContext.urlOriginal || pageContext.urlPathname || "";
}

/**
 * Builds the page's canonical absolute URL — locale prefix kept, trailing slash included.
 *
 * Use this, not `pageContext.urlPathname`, wherever a page needs to name itself. Vike's
 * router runs on `urlLogical`, which `+onBeforeRoute.ts` has already stripped of the locale,
 * so `urlPathname` silently yields the *English* URL on a `/de/` page. Structured data used
 * to build URLs that way and pointed German pages at their English counterparts.
 *
 * Mirrors the canonical tag in `pages/+Head.tsx`.
 */
export function getCanonicalUrl(pageContext: PageContext): string {
  const { locale, urlPathnameWithoutLocale } = extractLocale(getPageUrl(pageContext));
  const localePrefix = locale === defaultLocale ? "" : `/${locale}`;
  return `${SITE_CONFIG.url}${localePrefix}${urlPathnameWithoutLocale}`;
}
