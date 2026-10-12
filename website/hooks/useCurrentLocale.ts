import { usePageContext } from "vike-react/usePageContext";
import { defaultLocale } from "../locales/locales";

/**
 * The raw current locale ("en" | "de"), as resolved from the URL prefix by
 * pages/+onBeforeRoute.ts — for code that must branch on the locale itself rather than
 * render a translated label (useLocale remains the one way to get translated copy).
 * Fallback mirrors useLocale: a page context without a locale is the default locale.
 */
export function useCurrentLocale(): string {
  const pageContext = usePageContext() as { locale?: string };
  return pageContext.locale ?? defaultLocale;
}
