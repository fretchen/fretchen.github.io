import React from "react";
import type { PageContext } from "vike/types";
import type { BlogPost } from "../../types/BlogPost";
import { generateBlogCollectionSchema } from "../../utils/schemaOrg";

export default function Head({ data }: PageContext) {
  // Guard: Return nothing if data is not available (e.g., during build/prerender phase)
  if (!data || typeof data !== "object" || !("blogs" in data) || !data.blogs) {
    return null;
  }

  const { blogs } = data as { blogs: BlogPost[] };
  const url = "https://www.fretchen.eu/blog";

  // Generate CollectionPage schema for blog list
  const collectionSchema = generateBlogCollectionSchema(url, blogs);

  return (
    <>
      {/* Schema.org CollectionPage JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
    </>
  );
}
