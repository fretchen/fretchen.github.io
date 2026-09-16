/**
 * Sitemap Generator for Vike Pre-rendered Static Site
 *
 * Also emits build/content-index.json — the `{url, title}` list of English pages that
 * /assistent's `get_page` tool reads to find a page before fetching it. It lives here rather
 * than in a script of its own because this one already walks every built HTML file and already
 * pulls metadata out of each; a second walk would be the same work twice.
 *
 * Generates sitemap.xml after build by:
 * 1. Scanning all generated HTML files in build directory
 * 2. Adding reciprocal hreflang alternates for the pages that are really translated
 *    (locales/localizedPaths) — untranslated /de/ pages canonicalise to English and are
 *    left out entirely, rather than submitted as competing duplicates
 * 3. Extracting lastmod from each page's own BlogPosting JSON-LD, omitting it where the
 *    page has no publication date
 *
 * Run: tsx ./utils/generateSitemap.ts
 *
 * @see https://www.sitemaps.org/protocol.html
 * @see https://developers.google.com/search/docs/specialty/international/localized-versions
 */

import fs from "fs";
import path from "path";
import { SITE_CONFIG } from "./siteConfig";
import { locales, defaultLocale, isLocalizedPath } from "../locales/locales";

const SITE_URL = SITE_CONFIG.url;

const BUILD_DIR = "./build";
const SITEMAP_PATH = path.join(BUILD_DIR, "sitemap.xml");
const CONTENT_INDEX_PATH = path.join(BUILD_DIR, "content-index.json");
/**
 * A second copy, for `vike dev`.
 *
 * The index can only be built from built HTML, so under the dev server it would otherwise 404 and
 * /assistent's get_page tool would lose its page list — exactly where you try the tool out. Vite
 * serves `public/` at the site root in dev, so dropping a copy there makes the previous build's
 * index available while developing. The deployed copy is always the fresh one: `vike build` copies
 * `public/` into `build/` first, and this script then overwrites `build/content-index.json` above.
 *
 * Gitignored — it is a build output that happens to live in an input directory.
 */
const CONTENT_INDEX_DEV_PATH = path.join("./public", "content-index.json");

/** One entry of build/content-index.json — the page list /assistent's get_page tool reads. */
interface ContentIndexEntry {
  url: string;
  title: string;
}

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
  alternates?: { hreflang: string; href: string }[];
}

/**
 * Recursively find all HTML files in a directory
 */
function findHtmlFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      findHtmlFiles(fullPath, files);
    } else if (entry.name === "index.html") {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Convert file path to URL path
 * e.g., "build/blog/0/index.html" -> "/blog/0/"
 */
function filePathToUrlPath(filePath: string): string {
  // Normalize path and remove build dir prefix
  let urlPath = filePath
    .replace(/\\/g, "/") // Normalize path separators first
    .replace(/^\.?\/?(build)/, "") // Remove ./build, /build, or build prefix
    .replace(/\/index\.html$/, "/"); // Remove /index.html, add /

  // Ensure leading slash
  if (!urlPath.startsWith("/")) {
    urlPath = "/" + urlPath;
  }

  // Handle root path
  if (urlPath === "/" || urlPath === "//") {
    return "/";
  }

  // Ensure trailing slash
  if (!urlPath.endsWith("/")) {
    urlPath += "/";
  }

  return urlPath;
}

/**
 * Determine the canonical locale and alternate paths for a URL
 */
function getLocaleInfo(urlPath: string): {
  canonicalPath: string;
  locale: string;
  alternates: { hreflang: string; href: string }[];
} {
  // Check if URL starts with a locale prefix
  const localePrefix = locales.find((l) => l !== defaultLocale && urlPath.startsWith(`/${l}/`));

  let canonicalPath: string;
  let locale: string;

  if (localePrefix) {
    // This is a localized URL (e.g., /de/blog/0/)
    locale = localePrefix;
    canonicalPath = urlPath.replace(`/${localePrefix}`, "") || "/";
  } else {
    // This is a default locale URL (e.g., /blog/0/)
    locale = defaultLocale;
    canonicalPath = urlPath;
  }

  // Ensure canonicalPath has trailing slash
  if (canonicalPath !== "/" && !canonicalPath.endsWith("/")) {
    canonicalPath += "/";
  }

  // Only genuinely translated pages form an hreflang cluster — see locales/localizedPaths.
  // Everything else renders German chrome around English prose, and its /de/ variant
  // canonicalises to the English page (pages/+Head.tsx) rather than claiming to be a
  // language version of it.
  if (!isLocalizedPath(canonicalPath)) {
    return { canonicalPath, locale, alternates: [] };
  }

  // Every version lists ALL versions, itself included — Google requires the self-reference:
  // "each language version must list itself as well as all other language versions".
  const alternates = locales.map((l) => ({
    hreflang: l,
    href: l === defaultLocale ? `${SITE_URL}${canonicalPath}` : `${SITE_URL}/${l}${canonicalPath}`,
  }));

  // x-default points at the default locale version
  alternates.push({
    hreflang: "x-default",
    href: `${SITE_URL}${canonicalPath}`,
  });

  return { canonicalPath, locale, alternates };
}

/**
 * Read a page's publication date out of its own rendered Schema.org JSON-LD.
 *
 * Every post and lecture already emits a BlogPosting with `datePublished` (see
 * utils/schemaOrg.ts), so the built HTML carries the frontmatter date and no MDX parsing is
 * needed here. Pages without one — landing pages, the index — get no `lastmod` at all, which
 * is deliberate: this used to stamp *today* on all 84 URLs on every build, and Google ignores
 * lastmod it finds to be consistently inaccurate. No date beats a wrong one.
 */
function extractLastmod(filePath: string): string | undefined {
  const match = /"datePublished":"(\d{4}-\d{2}-\d{2})/.exec(fs.readFileSync(filePath, "utf-8"));
  return match?.[1];
}

/**
 * Read a page's own `<title>`, without the site-name suffix.
 *
 * This is what /assistent's `get_page` tool lists so the model can pick a page to read. Titles
 * only, deliberately: the meta descriptions average 178 characters, which would take the whole
 * index from ~6 KB to ~22 KB — and a tool result is charged as input tokens on every later hop of
 * the turn, so the whole 86-entry index has to stay small enough to hand over at once. Handing it
 * over whole is what lets the tool skip a query parameter, a result cap, and a no-matches path.
 */
function extractTitle(filePath: string): string | undefined {
  const match = /<title[^>]*>([^<]*)<\/title>/i.exec(fs.readFileSync(filePath, "utf-8"));
  if (!match) return undefined;
  // Every +title.ts appends " | fretchen.eu" as a literal; the suffix is derived from the
  // configured host rather than repeated here, so a domain change cannot silently stop it
  // stripping. Matched with endsWith rather than a RegExp built from that host: escaping a string
  // into a pattern is easy to get half-right (CodeQL flagged an earlier version of this line for
  // escaping `.` but not `\`), and a literal comparison needs no escaping at all.
  const suffix = ` | ${new URL(SITE_URL).hostname.replace(/^www\./, "")}`;
  const title = match[1];
  return (title.endsWith(suffix) ? title.slice(0, -suffix.length) : title).trim() || undefined;
}

/**
 * Determine priority based on URL depth and type
 */
function getPriority(urlPath: string): number {
  if (urlPath === "/") return 1.0;
  if (urlPath === "/blog/" || urlPath === "/quantum/") return 0.9;
  if (urlPath.startsWith("/blog/") || urlPath.startsWith("/quantum/")) return 0.8;
  if (urlPath === "/imagegen/" || urlPath === "/assistent/") return 0.7;
  return 0.5;
}

/**
 * Determine change frequency based on URL type
 */
function getChangeFreq(urlPath: string): SitemapUrl["changefreq"] {
  if (urlPath === "/") return "weekly";
  if (urlPath === "/blog/") return "weekly";
  if (urlPath.startsWith("/blog/")) return "monthly";
  if (urlPath.startsWith("/quantum/")) return "monthly";
  return "monthly";
}

/**
 * Generate the sitemap XML content
 */
function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlEntries = urls
    .map((url) => {
      // Most pages have no alternates at all now, so this must not leave a blank line behind.
      const alternateLinks = (url.alternates ?? [])
        .map((alt) => `\n    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}"/>`)
        .join("");

      return `  <url>
    <loc>${url.loc}</loc>${url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ""}
    <changefreq>${url.changefreq || "monthly"}</changefreq>
    <priority>${url.priority?.toFixed(1) || "0.5"}</priority>${alternateLinks}
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>`;
}

/**
 * Main function to generate sitemap
 */
function generateSitemap(): void {
  console.log("[Sitemap] Starting sitemap generation...");

  // Check if build directory exists
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`[Sitemap] Build directory not found: ${BUILD_DIR}`);
    console.error("[Sitemap] Run 'npm run build' first.");
    process.exit(1);
  }

  // Find all HTML files
  const htmlFiles = findHtmlFiles(BUILD_DIR);
  console.log(`[Sitemap] Found ${htmlFiles.length} HTML files`);

  // Group URLs by canonical path to avoid duplicates
  const urlMap = new Map<string, SitemapUrl>();
  const contentIndex: ContentIndexEntry[] = [];

  for (const filePath of htmlFiles) {
    const urlPath = filePathToUrlPath(filePath);
    const { canonicalPath, locale, alternates } = getLocaleInfo(urlPath);

    // The content index lists English URLs only. A /de/ page renders German chrome around the
    // same English prose, so including both would double the index with duplicates the model
    // would have to tell apart.
    if (locale === defaultLocale) {
      const title = extractTitle(filePath);
      if (title) contentIndex.push({ url: urlPath, title });
    }

    // A non-default-locale URL earns its own entry only where the page is really translated.
    // Untranslated /de/ pages canonicalise to their English original, so listing them here
    // would submit a URL we are simultaneously telling Google not to index in its own right.
    if (locale !== defaultLocale && !isLocalizedPath(canonicalPath)) continue;

    urlMap.set(urlPath, {
      loc: `${SITE_URL}${urlPath}`,
      lastmod: extractLastmod(filePath),
      changefreq: getChangeFreq(canonicalPath),
      priority: getPriority(canonicalPath),
      alternates,
    });
  }

  // Convert map to array and sort by priority (highest first)
  const urls = Array.from(urlMap.values()).sort((a, b) => (b.priority || 0) - (a.priority || 0));

  console.log(`[Sitemap] Generated ${urls.length} unique URLs`);

  // Generate XML
  const sitemapXml = generateSitemapXml(urls);

  // Write sitemap
  fs.writeFileSync(SITEMAP_PATH, sitemapXml, "utf-8");
  console.log(`[Sitemap] Sitemap written to ${SITEMAP_PATH}`);

  // Write the content index consumed by /assistent's get_page tool.
  contentIndex.sort((a, b) => a.url.localeCompare(b.url));
  const contentIndexJson = JSON.stringify(contentIndex);
  fs.writeFileSync(CONTENT_INDEX_PATH, contentIndexJson, "utf-8");
  fs.writeFileSync(CONTENT_INDEX_DEV_PATH, contentIndexJson, "utf-8");
  console.log(`[Sitemap] Content index written to ${CONTENT_INDEX_PATH} (${contentIndex.length} pages)`);

  // Note: robots.txt with Sitemap reference is maintained in public/robots.txt
  // and copied to build/ during the build process
}

// Run if called directly
try {
  generateSitemap();
} catch (error) {
  console.error("[Sitemap] Error generating sitemap:", error);
  process.exit(1);
}

export { generateSitemap, SitemapUrl };
