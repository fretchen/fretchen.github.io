import React from "react";
import type { PageContext } from "vike/types";
import type { BlogPost } from "../../types/BlogPost";
import { generateBlogCollectionSchema } from "../../utils/schemaOrg";

export default function Head({ data }: PageContext) {
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
