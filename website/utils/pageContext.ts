import type { PageContext } from "vike/types";

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
