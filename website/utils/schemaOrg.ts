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
