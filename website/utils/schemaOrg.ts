import type { BlogPost } from "../types/BlogPost";

/**
 * Generates Schema.org BlogPosting structured data for SEO
 * @param blog - Blog post data
 * @param url - Full URL of the blog post
 * @param imageUrl - Optional image URL for the blog post
 * @returns Schema.org BlogPosting object
 */
export function generateBlogPostingSchema(blog: BlogPost, url: string, imageUrl?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.description || "",
    datePublished: blog.publishing_date,
    author: {
      "@type": "Person",
      name: "fretchen",
      url: "https://www.fretchen.eu",
    },
    publisher: {
      "@type": "Person",
      name: "fretchen",
      url: "https://www.fretchen.eu",
    },
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
 * Generates Schema.org WebSite structured data for the homepage
 * @param url - Base URL of the website
 * @param name - Name of the website
 * @param description - Description of the website
 * @returns Schema.org WebSite object
 */
export function generateWebSiteSchema(url: string, name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: name,
    description: description,
    url: url,
    author: {
      "@type": "Person",
      name: "fretchen",
      url: url,
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
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Blog Posts",
    description: "A collection of blog posts about various topics, ideas, and notes.",
    url: url,
    author: {
      "@type": "Person",
      name: "fretchen",
      url: "https://www.fretchen.eu",
    },
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
        url: `https://www.fretchen.eu/blog/${item.originalIndex}`,
      })),
  };
}
