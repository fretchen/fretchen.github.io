/**
 * Sitemap Generator for Vike Pre-rendered Static Site
 *
 * Generates sitemap.xml after build by:
 * 1. Scanning all generated HTML files in build directory
 * 2. Adding hreflang alternates for i18n (en/de)
 * 3. Extracting lastmod from blog frontmatter where available
 *
 * Run: tsx ./utils/generateSitemap.ts
 *
 * @see https://www.sitemaps.org/protocol.html
 * @see https://developers.google.com/search/docs/specialty/international/localized-versions
 */

import fs from "fs";
import path from "path";
import { SITE_CONFIG } from "./siteConfig";
import { locales, defaultLocale } from "../locales/locales";

const SITE_URL = SITE_CONFIG.url;

const BUILD_DIR = "./build";
const SITEMAP_PATH = path.join(BUILD_DIR, "sitemap.xml");

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

  // Generate alternates for all locales
  const alternates = locales.map((l) => ({
    hreflang: l,
    href:
      l === defaultLocale
        ? `${SITE_URL}${canonicalPath}`
        : `${SITE_URL}/${l}${canonicalPath === "/" ? "/" : canonicalPath}`,
  }));

  // Add x-default pointing to the default locale version
  alternates.push({
    hreflang: "x-default",
    href: `${SITE_URL}${canonicalPath}`,
  });

  return { canonicalPath, locale, alternates };
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
      const alternateLinks = url.alternates
        ?.map((alt) => `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}"/>`)
        .join("\n");

      return `  <url>
    <loc>${url.loc}</loc>${url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ""}
    <changefreq>${url.changefreq || "monthly"}</changefreq>
    <priority>${url.priority?.toFixed(1) || "0.5"}</priority>
${alternateLinks || ""}
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
async function generateSitemap(): Promise<void> {
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

  for (const filePath of htmlFiles) {
    const urlPath = filePathToUrlPath(filePath);
    const { canonicalPath, locale, alternates } = getLocaleInfo(urlPath);

    // Only add the canonical (default locale) version to avoid duplicates
    if (locale === defaultLocale) {
      const fullUrl = `${SITE_URL}${urlPath}`;

      urlMap.set(canonicalPath, {
        loc: fullUrl,
        lastmod: new Date().toISOString().split("T")[0], // Today's date as fallback
        changefreq: getChangeFreq(canonicalPath),
        priority: getPriority(canonicalPath),
        alternates,
      });
    }
  }

  // Convert map to array and sort by priority (highest first)
  const urls = Array.from(urlMap.values()).sort((a, b) => (b.priority || 0) - (a.priority || 0));

  console.log(`[Sitemap] Generated ${urls.length} unique URLs`);

  // Generate XML
  const sitemapXml = generateSitemapXml(urls);

  // Write sitemap
  fs.writeFileSync(SITEMAP_PATH, sitemapXml, "utf-8");
  console.log(`[Sitemap] Sitemap written to ${SITEMAP_PATH}`);

  // Note: robots.txt with Sitemap reference is maintained in public/robots.txt
  // and copied to build/ during the build process
}

// Run if called directly
generateSitemap().catch((error) => {
  console.error("[Sitemap] Error generating sitemap:", error);
  process.exit(1);
});

export { generateSitemap, SitemapUrl };
