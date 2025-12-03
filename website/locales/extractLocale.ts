export { extractLocale };

import { locales, defaultLocale } from "./locales";

function extractLocale(urlPathname: string) {
  // Strip query strings before processing - they should not be part of canonical URLs
  // This prevents invalid URLs like "/imagegen?foo=bar/" (trailing slash after query)
  const [cleanPathname] = urlPathname.split("?");

  const path = cleanPathname.split("/");

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
    urlPathnameWithoutLocale = cleanPathname;
  }

  // Normalize edge cases: convert "//" or "" to "/"
  // This ensures consistent path handling across the application
  if (urlPathnameWithoutLocale === "//" || urlPathnameWithoutLocale === "") {
    urlPathnameWithoutLocale = "/";
  }

  // Ensure trailing slash for all non-root paths (GitHub Pages convention)
  // This prevents "Duplicate without user-selected canonical" SEO issues
  // since GitHub Pages always serves URLs with trailing slashes
  if (urlPathnameWithoutLocale !== "/" && !urlPathnameWithoutLocale.endsWith("/")) {
    urlPathnameWithoutLocale = urlPathnameWithoutLocale + "/";
  }

  return { locale, urlPathnameWithoutLocale };
}
