import React from "react";
import type { PageContext } from "vike/types";
import type { BlogPost } from "../../../types/BlogPost";
import { generateBlogPostingSchema } from "../../../utils/schemaOrg";

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

  // Generate Schema.org JSON-LD
  const schema = generateBlogPostingSchema(blog, url, imageUrl);

  return (
    <>
      {/* Schema.org BlogPosting JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}
