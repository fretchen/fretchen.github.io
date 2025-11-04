// https://vike.dev/Head

import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { extractLocale } from "../locales/extractLocale";
import { getRelMeLinks, SITE } from "../utils/siteData";
import { analyticsConfig } from "../utils/analyticsConfig";
import { getPageUrl } from "../utils/pageContext";
import favicon from "./image_3_1fc7cfc7b9e9.jpg";

export default function HeadDefault() {
  const pageContext = usePageContext();
  const relMeLinks = getRelMeLinks();

  // Extract locale and clean path for hreflang and canonical tags
  const { locale, urlPathnameWithoutLocale } = extractLocale(getPageUrl(pageContext));

  // Build URLs for both languages
  const enUrl = `${SITE.url}${urlPathnameWithoutLocale}`;
  const deUrl = `${SITE.url}/de${urlPathnameWithoutLocale}`;

  // Canonical URL points to the CURRENT page's language version
  // This tells search engines each language version is its own authoritative source
  const canonicalUrl = locale === "de" ? deUrl : enUrl;

  return (
    <>
      <link rel="icon" href={favicon} />

      {/* Canonical URL - points to current page in its current language */}
      <link rel="canonical" href={canonicalUrl} />

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
