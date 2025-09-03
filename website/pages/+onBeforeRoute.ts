// pages/+onBeforeRoute.ts
// Environment: server & client

import type { PageContext } from "vike/types";
import { modifyUrl } from "vike/modifyUrl";
import type { Url } from "vike/types";
import i18n from "../i18n";

export function onBeforeRoute(pageContext: PageContext) {
  const { urlWithoutLocale, locale } = extractLocale(pageContext.urlParsed);
  console.log("Locale detected:", locale);
  i18n.changeLanguage(locale);
  return {
    pageContext: {
      // Make locale available as pageContext.locale
      locale,
      // Vike's router will use pageContext.urlLogical instead of pageContext.urlOriginal and
      // the locale is removed from pageContext.urlParsed
      urlLogical: urlWithoutLocale,
    },
  };
}

// Keep locales as a simple, editable list of strings
const LOCALES: string[] = ["de", "en"];
type Locale = string | null;

function getLocaleFromPathname(pathname: string): Locale {
  if (!pathname) return null;
  // normalize and split: "/de/whatever" -> ["de", "whatever"]
  const parts = pathname.replace(/^\//, "").toLowerCase().split("/");
  const candidate = parts[0] || "";
  return LOCALES.includes(candidate) ? candidate : null;
}

function hasLocalePrefix(pathname: string): boolean {
  return getLocaleFromPathname(pathname) !== null;
}

function extractLocale(url: Url) {
  const { pathname } = url;
  console.log(pathname);

  // determine if the pathname starts with a locale
  const hasLocale = hasLocalePrefix(pathname);
  console.log("hasLocale", hasLocale);
  let pathnameWithoutLocale;
  let locale;
  if (hasLocale) {
    // Determine the locale, for example:
    //  /en/film/42 => en
    //  /de/film/42 => de
    locale = getLocaleFromPathname(pathname);

    // Remove the locale prefix safely (only the leading /{locale})

    pathnameWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), "");
  } else {
    locale = "en";
    console.log("No locale found, defaulting to", locale);
    pathnameWithoutLocale = pathname;
  }

  // Reconstruct full URL
  const urlWithoutLocale = modifyUrl(url.href, { pathname: pathnameWithoutLocale });

  return { locale, urlWithoutLocale };
}
