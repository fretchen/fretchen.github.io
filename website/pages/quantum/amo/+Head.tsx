import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import type { BlogPost } from "../../../types/BlogPost";
import { generateBlogCollectionSchema, generateBreadcrumbSchema } from "../../../utils/schemaOrg";
import { description as getDescription } from "./+description";
import { title as getTitle } from "./+title";

export default function Head() {
  const pageContext = usePageContext();
  const data = pageContext.data;

  // Guard: Return nothing if data is not available
  if (!data || typeof data !== "object" || !("blogs" in data) || !data.blogs) {
    return null;
  }

  const { blogs } = data as { blogs: BlogPost[] };
  const url = `https://www.fretchen.eu${pageContext.urlPathname}`;
  const title = getTitle();
  const description = getDescription();

  // Generate CollectionPage schema for this AMO lecture list
  const collectionSchemaBase = generateBlogCollectionSchema(url, blogs);
  // Provide a more specific name & description for the AMO collection
  const collectionSchema = {
    ...collectionSchemaBase,
    name: "AMO - Atomic, Molecular & Optical Physics (Lecture Notes)",
    description,
  };

  // Generate breadcrumb schema for better indexing
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.fretchen.eu" },
    { name: "Quantum Lectures", url: "https://www.fretchen.eu/quantum" },
    { name: "AMO - Atomic, Molecular & Optical Physics", url },
  ]);

  return (
    <>
      {/* Meta tags for search engines and social cards */}
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />


      {/* Schema.org JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}
