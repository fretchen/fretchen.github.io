import type { PageContext } from "vike/types";
import type { BlogPost } from "../types/BlogPost";
import { extractLocale } from "../locales/extractLocale";
import { defaultLocale } from "../locales/locales";
import { getCanonicalUrl, getPageUrl } from "./pageContext";
import { SITE, getPersonSchema } from "./siteData";

/**
 * Generates Schema.org BlogPosting structured data for SEO
 * @param blog - Blog post data
 * @param url - Full URL of the blog post
 * @param imageUrl - Optional image URL for the blog post
 * @returns Schema.org BlogPosting object
 */
export function generateBlogPostingSchema(blog: BlogPost, url: string, imageUrl?: string) {
  const person = getPersonSchema();

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.description || "",
    datePublished: blog.publishing_date,
    author: person,
    publisher: person,
    url: url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    ...(imageUrl && {
      image: {
        "@type": "ImageObject",
        url: imageUrl,
      },
    }),
  };
}

/**
 * Generates Schema.org BreadcrumbList structured data for SEO
 * @param items - Array of breadcrumb items with name and url
 * @returns Schema.org BreadcrumbList object
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Display names for every path that can appear as a breadcrumb ancestor.
 *
 * Keyed by the locale-stripped path without a trailing slash. A path that is not
 * listed here contributes no breadcrumb node unless it is the leaf, in which case
 * `buildBreadcrumbTrail`'s `leafName` supplies the label — that is how `@id` pages
 * (`/blog/14`, `/quantum/basics/3`) get named after their post title.
 */
const SECTION_LABELS: Record<string, string> = {
  "/blog": "Blog",
  "/lab": "Lab",
  "/x402": "x402",
  "/x402/buyers": "x402 for Buyers",
  "/x402/sellers": "x402 for Sellers",
  "/quantum": "Quantum Lectures",
  "/quantum/basics": "Quantum Basics",
  "/quantum/amo": "AMO - Atomic, Molecular & Optical Physics",
  "/quantum/qml": "Quantum Machine Learning",
  "/quantum/hardware": "Quantum Hardware",
};

/**
 * Derives a page's full breadcrumb trail from its URL.
 *
 * Every ancestor node is built from the *ancestor's* own path, which is the point:
 * the trails used to be hand-copied into each page's head, and drift had already
 * produced a node labelled "x402" whose URL was the sellers page. The trail also
 * follows the URL's locale, so a `/de/` page links to its German ancestors, and it
 * reuses the trailing-slash normalisation from `extractLocale` so the URLs match the
 * canonical tags (GitHub Pages only serves the trailing-slash form).
 *
 * @param urlPathname - Raw pathname including any locale prefix, from `getPageUrl()`
 * @param leafName - Name for the final node when the path itself has no label (e.g. a post title)
 * @returns Schema.org BreadcrumbList object
 */
export function buildBreadcrumbTrail(urlPathname: string, leafName?: string) {
  const { locale, urlPathnameWithoutLocale } = extractLocale(urlPathname);
  const localePrefix = locale === defaultLocale ? "" : `/${locale}`;

  const segments = urlPathnameWithoutLocale.split("/").filter(Boolean);
  const items = [{ name: "Home", url: `${SITE.url}${localePrefix}/` }];

  let path = "";
  segments.forEach((segment, index) => {
    path += `/${segment}`;
    const isLeaf = index === segments.length - 1;
    const name = (isLeaf && leafName) || SECTION_LABELS[path];
    if (!name) return;
    items.push({ name, url: `${SITE.url}${localePrefix}${path}/` });
  });

  return generateBreadcrumbSchema(items);
}

/**
 * Structured data for any single post or lecture page (`@id` routes).
 *
 * Every one of these pages wants the same two things — a BlogPosting for the post and a
 * breadcrumb trail ending in its title — so they share one builder rather than five copies
 * of the same `pageContext.data` guard.
 */
export function buildPostStructuredData(pageContext: PageContext) {
  const data = pageContext.data;
  if (!data || typeof data !== "object" || !("blog" in data) || !data.blog) return [];

  const { blog } = data as { blog: BlogPost };

  return [
    generateBlogPostingSchema(blog, getCanonicalUrl(pageContext), blog.nftMetadata?.imageUrl),
    buildBreadcrumbTrail(getPageUrl(pageContext), blog.title),
  ];
}

/**
 * Structured data for a page listing posts or lectures (`/blog`, `/quantum/basics`, …):
 * a CollectionPage over the listed entries, plus the breadcrumb trail.
 */
export function buildCollectionStructuredData(pageContext: PageContext, name: string, description: string) {
  const data = pageContext.data;
  if (!data || typeof data !== "object" || !("blogs" in data) || !data.blogs) return [];

  const { blogs } = data as { blogs: BlogPost[] };

  return [
    { ...generateBlogCollectionSchema(getCanonicalUrl(pageContext), blogs), name, description },
    buildBreadcrumbTrail(getPageUrl(pageContext)),
  ];
}

/**
 * Generates Schema.org WebSite structured data for the homepage
 * @param url - Base URL of the website
 * @param name - Name of the website
 * @param description - Description of the website
 * @returns Schema.org WebSite object
 */
export function generateWebSiteSchema(url: string, name: string, description: string) {
  const person = getPersonSchema();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: name,
    description: description,
    url: url,
    author: {
      ...person,
      url: url, // Override with provided url
    },
    // Note: potentialAction (SearchAction) removed as search functionality is not yet implemented
    // Can be added back when site search is available
  };
}

/**
 * Generates Schema.org Person structured data for the site owner
 * @param url - Base URL of the website
 * @param name - Person's name
 * @param description - Description of the person
 * @returns Schema.org Person object
 */
export function generatePersonSchema(url: string, name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: name,
    url: url,
    description: description,
  };
}

/**
 * Generates Schema.org CollectionPage structured data for blog list page
 * @param url - URL of the blog list page
 * @param blogs - Array of blog posts to include in the collection
 * @returns Schema.org CollectionPage object
 */
export function generateBlogCollectionSchema(url: string, blogs: BlogPost[]) {
  const person = getPersonSchema();

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Blog Posts",
    description:
      "Game theory and economics, quantum physics, and what I learned building on the web — often with something you can play with.",
    url: url,
    author: person,
    hasPart: blogs
      .map((blog, originalIndex) => ({
        blog,
        originalIndex, // Preserve the original index which is the blog ID
      }))
      .slice(0, 10)
      .map((item, position) => ({
        "@type": "BlogPosting",
        position: position + 1,
        headline: item.blog.title,
        description: item.blog.description || "",
        datePublished: item.blog.publishing_date,
        url: `${SITE.url}/blog/${item.originalIndex}`,
      })),
  };
}
