import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import type { BlogPost } from "../../../types/BlogPost";
import { generateBlogPostingSchema, generateBreadcrumbSchema } from "../../../utils/schemaOrg";

export default function Head() {
  const pageContext = usePageContext();
  const data = pageContext.data;
  const urlPathname = pageContext.urlPathname;

  // Guard: Return nothing if data is not available
  if (!data || typeof data !== "object" || !("blog" in data) || !data.blog) {
    return null;
  }

  const { blog } = data as {
    blog: BlogPost;
    prevBlog: BlogPost | null;
    nextBlog: BlogPost | null;
  };

  // Generate full URL for the blog post
  const url = `https://www.fretchen.eu${urlPathname}`;

  // Generate image URL from NFT metadata if available
  const imageUrl = blog.nftMetadata?.imageUrl;

  // Generate Schema.org JSON-LD for BlogPosting
  const blogPostingSchema = generateBlogPostingSchema(blog, url, imageUrl);

  // Generate Schema.org JSON-LD for Breadcrumbs
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.fretchen.eu" },
    { name: "Blog", url: "https://www.fretchen.eu/blog" },
    { name: blog.title, url: url },
  ]);

  return (
    <>
      {/* Fediverse creator attribution for Mastodon discovery */}
      <meta name="fediverse:creator" content="@fretchen@mastodon.social" />

      {/* Schema.org BlogPosting JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
      {/* Schema.org BreadcrumbList JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}
