// https://vike.dev/Head

import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { extractLocale } from "../locales/extractLocale";
import { getRelMeLinks, SITE } from "../utils/siteData";
import { analyticsConfig } from "../utils/analyticsConfig";
import favicon from "./image_3_1fc7cfc7b9e9.jpg";

export default function HeadDefault() {
  const pageContext = usePageContext();
  const relMeLinks = getRelMeLinks();

  // Extract locale and clean path for hreflang tags
  const { urlPathnameWithoutLocale } = extractLocale(pageContext.urlOriginal || pageContext.urlPathname || "");

  // Ensure clean path (avoid double slashes)
  const cleanPath = urlPathnameWithoutLocale === "//" || urlPathnameWithoutLocale === "" ? "/" : urlPathnameWithoutLocale;

  // Build URLs for both languages
  const enUrl = `${SITE.url}${cleanPath}`;
  const deUrl = `${SITE.url}/de${cleanPath}`;

  return (
    <>
      <link rel="icon" href={favicon} />

      {/* Canonical URL - tells Google this is the authoritative version (with www) */}
      <link rel="canonical" href={enUrl} />

      {/* Language variants for SEO (helps Google understand en is at root, not /en/) */}
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="de" href={deUrl} />
      <link rel="alternate" hrefLang="x-default" href={enUrl} />

      {/* rel="me" links for identity verification (IndieWeb, Mastodon, Bluesky, etc.) */}
      {relMeLinks.map((link) => (
        <link key={link.platform} href={link.href} rel={link.rel} />
      ))}
      <link rel="webmention" href="https://webmention.io/www.fretchen.eu/webmention" />

      {/* umami analytics script - disabled when VITE_DISABLE_ANALYTICS is set */}
      {!analyticsConfig.isDisabled && (
        <script defer src={analyticsConfig.scriptUrl} data-website-id={analyticsConfig.websiteId}></script>
      )}
    </>
  );
}
