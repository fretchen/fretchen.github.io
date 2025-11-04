export { extractLocale };

import { locales, defaultLocale } from "./locales";

function extractLocale(urlPathname: string) {
  const path = urlPathname.split("/");

  let locale;
  let urlPathnameWithoutLocale;
  // We remove the URL locale, for example `/de/about` => `/about`
  const first = path[1];
  if (locales.includes(first)) {
    locale = first;
    urlPathnameWithoutLocale = "/" + path.slice(2).join("/");
    // Handle root path case: "/de" should become "/"
    if (urlPathnameWithoutLocale === "/") {
      urlPathnameWithoutLocale = "/";
    }
  } else {
    locale = defaultLocale;
    urlPathnameWithoutLocale = urlPathname;
  }

  // Normalize edge cases: convert "//" or "" to "/"
  // This ensures consistent path handling across the application
  if (urlPathnameWithoutLocale === "//" || urlPathnameWithoutLocale === "") {
    urlPathnameWithoutLocale = "/";
  }

  return { locale, urlPathnameWithoutLocale };
}
