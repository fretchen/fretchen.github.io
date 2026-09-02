// https://vike.dev/Head

import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { extractLocale } from "../locales/extractLocale";
import { getRelMeLinks, SITE } from "../utils/siteData";
import { analyticsConfig } from "../utils/analyticsConfig";
import { getPageUrl } from "../utils/pageContext";
import favicon from "./image_3_1fc7cfc7b9e9.jpg";

/**
 * The only `+Head` in the repo, and deliberately so.
 *
 * `+Head` is cumulative — it accumulates down the directory tree and cannot be
 * overridden — so anything per-page put here is emitted again on every nested page,
 * with the parent's values. Section-level `+Head.tsx` files used to do exactly that.
 *
 * Per-page metadata therefore belongs in the *non-cumulative* settings instead:
 * vike-react already renders `<title>` and `og:title` from `+title`, the description
 * meta and `og:description` from `+description`, and `og:image` + `twitter:card` from
 * `+image`. JSON-LD, which has no built-in setting, uses the custom `structuredData`
 * setting declared in `+config.ts`.
 *
 * What stays here is only what is true for every page.
 */
export default function HeadDefault() {
  const pageContext = usePageContext();
  const relMeLinks = getRelMeLinks();
  const structuredData = pageContext.config?.structuredData?.(pageContext) ?? [];

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

      {/* Language variants for SEO - only alternate languages (not self-reference) */}
      {/* See: https://developers.google.com/search/docs/specialty/international/localized-versions */}
      {locale !== "en" && <link rel="alternate" hrefLang="en" href={enUrl} />}
      {locale !== "de" && <link rel="alternate" hrefLang="de" href={deUrl} />}
      <link rel="alternate" hrefLang="x-default" href={enUrl} />

      {/* Open Graph. og:title/og:description/og:image come from +title/+description/+image,
          which vike-react renders and which pages can override; only these two need setting
          by hand, and og:url must match the canonical above. */}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />

      {/* rel="me" links for identity verification (IndieWeb, Mastodon, Bluesky, etc.) */}
      {relMeLinks.map((link) => (
        <link key={link.platform} href={link.href} rel={link.rel} />
      ))}
      <link rel="webmention" href="https://webmention.io/www.fretchen.eu/webmention" />
      <meta name="fediverse:creator" content="@fretchen@mastodon.social" />

      <meta httpEquiv="Content-Security-Policy" content="object-src 'none'; base-uri 'self'" />

      {/* Schema.org JSON-LD from the page's +structuredData.ts */}
      {structuredData.map((schema, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      {/* umami analytics script - disabled when VITE_DISABLE_ANALYTICS is set */}
      {!analyticsConfig.isDisabled && (
        <script defer src={analyticsConfig.scriptUrl} data-website-id={analyticsConfig.websiteId}></script>
      )}
    </>
  );
}
