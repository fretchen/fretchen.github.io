// pages/+onBeforeRoute.ts
// Environment: server & client

import type { PageContext } from "vike/types";
import { modifyUrl } from "vike/modifyUrl";
import { extractLocale } from "../locales/extractLocale";

export function onBeforeRoute(pageContext: PageContext) {
  const url = pageContext.urlParsed;
  const { locale, urlPathnameWithoutLocale } = extractLocale(url.pathname);
  console.log("Locale detected:", locale);
  console.log("URL without locale:", urlPathnameWithoutLocale);
  const urlLogical = modifyUrl(url.href, { pathname: urlPathnameWithoutLocale });
  return {
    pageContext: {
      // Make locale available as pageContext.locale
      locale,
      // Vike's router will use pageContext.urlLogical instead of pageContext.urlOriginal
      urlLogical,
    },
  };
}
