// https://vike.dev/Head

import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { extractLocale } from "../locales/extractLocale";
import { isLocalizedPath } from "../locales/locales";
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

  // Only a handful of pages are really translated — see `localizedPaths`. Everything else
  // renders German chrome around English prose, so its /de/ variant is a near-duplicate.
  const translated = isLocalizedPath(urlPathnameWithoutLocale);

  // A translated page is its own authoritative version in each language. An untranslated /de/
  // page is not a second version of anything — it canonicalises to the English original, which
  // consolidates the duplicate instead of competing with it.
  //
  // Canonical *without* `noindex`, deliberately: the two are contradictory signals with no
  // defined precedence, and Google's guidance is to pick one. Canonical is the right one here.
  const canonicalUrl = translated && locale === "de" ? deUrl : enUrl;

  return (
    <>
      <link rel="icon" href={favicon} />

      {/* Canonical URL - points to current page in its current language */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Language variants — declared only for genuinely translated pages, and each version
          lists *itself* as well as the others. Google requires that self-reference ("each
          language version must list itself as well as all other language versions"); it was
          previously omitted to chase the GSC status "Alternate page with proper canonical
          tag", which is informational — it means Google understood the alternates — not an
          error. An untranslated page has no alternate to declare and emits none.
          https://developers.google.com/search/docs/specialty/international/localized-versions */}
      {translated && (
        <>
          <link rel="alternate" hrefLang="en" href={enUrl} />
          <link rel="alternate" hrefLang="de" href={deUrl} />
          <link rel="alternate" hrefLang="x-default" href={enUrl} />
        </>
      )}

      {/* Open Graph. og:title/og:description/og:image come from +title/+description/+image,
          which vike-react renders and which pages can override; only these two need setting
          by hand. og:url must match the canonical above, and og:type defaults to "website"
          unless the page declares a +ogType.ts (article-shaped pages do). */}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={pageContext.config?.ogType ?? "website"} />

      {/* rel="me" links for identity verification (IndieWeb, Mastodon, Bluesky, etc.) */}
      {relMeLinks.map((link) => (
        <link key={link.platform} href={link.href} rel={link.rel} />
      ))}
      <link rel="webmention" href="https://webmention.io/www.fretchen.eu/webmention" />
      <meta name="fediverse:creator" content="@fretchen@mastodon.social" />

      <meta httpEquiv="Content-Security-Policy" content="object-src 'none'; base-uri 'self'" />

      {/* Schema.org JSON-LD from the page's +structuredData.ts.
          Passed as a text child rather than through dangerouslySetInnerHTML: React does not
          HTML-escape script children, so the JSON survives verbatim, and it rewrites the one
          sequence that would end the tag early — a closing script tag inside a post title
          comes out with its "s" as a s escape, which parses back to the same string.
          dangerouslySetInnerHTML would emit it literally and truncate the document. */}
      {structuredData.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}

      {/* umami analytics script - disabled when VITE_DISABLE_ANALYTICS is set */}
      {!analyticsConfig.isDisabled && (
        <script defer src={analyticsConfig.scriptUrl} data-website-id={analyticsConfig.websiteId}></script>
      )}
    </>
  );
}
