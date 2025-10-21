import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import type { BlogPost } from "../../../../types/BlogPost";
import { generateBlogPostingSchema, generateBreadcrumbSchema } from "../../../../utils/schemaOrg";

export default function Head() {
  const pageContext = usePageContext();
  const data = pageContext.data;

  // Guard: Return nothing if data is not available
  if (!data || typeof data !== "object" || !("blog" in data) || !data.blog) {
    return null;
  }

  const { blog } = data as {
    blog: BlogPost;
    prevBlog: BlogPost | null;
    nextBlog: BlogPost | null;
  };

  // Generate full URL for the lecture
  const url = `https://www.fretchen.eu${pageContext.urlPathname}`;

  // Generate image URL from NFT metadata if available
  const imageUrl = blog.nftMetadata?.imageUrl;

  // Generate Schema.org JSON-LD for the lecture (using BlogPosting schema)
  const lectureSchema = generateBlogPostingSchema(blog, url, imageUrl);

  // Generate Schema.org JSON-LD for Breadcrumbs
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.fretchen.eu" },
    { name: "Quantum Lectures", url: "https://www.fretchen.eu/quantum" },
    { name: "AMO - Atomic, Molecular & Optical Physics", url: "https://www.fretchen.eu/quantum/amo" },
    { name: blog.title, url: url },
  ]);

  return (
    <>
      {/* Schema.org Lecture (using BlogPosting schema) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(lectureSchema) }} />
      {/* Schema.org Breadcrumbs */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}
