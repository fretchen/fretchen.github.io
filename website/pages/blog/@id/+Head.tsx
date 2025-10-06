import React from "react";
import type { PageContext } from "vike/types";
import type { BlogPost } from "../../../types/BlogPost";
import { generateBlogPostingSchema, generateBreadcrumbSchema } from "../../../utils/schemaOrg";

export default function Head({ data, urlPathname }: PageContext) {
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
      {/* Schema.org BlogPosting JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
      {/* Schema.org BreadcrumbList JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}
