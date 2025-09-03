export { extractLocale };

import { locales, defaultLocale } from "./locales";

function extractLocale(urlPathname) {
  const path = urlPathname.split("/");

  let locale;
  let urlPathnameWithoutLocale;
  // We remove the URL locale, for example `/de/about` => `/about`
  const first = path[1];
  if (locales.includes(first)) {
    locale = first;
    urlPathnameWithoutLocale = "/" + path.slice(2).join("/");
  } else {
    locale = defaultLocale;
    urlPathnameWithoutLocale = urlPathname;
  }

  return { locale, urlPathnameWithoutLocale };
}
