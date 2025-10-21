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

  // Generate CollectionPage schema for this QML lecture list
  const collectionSchemaBase = generateBlogCollectionSchema(url, blogs);
  const collectionSchema = {
    ...collectionSchemaBase,
    name: "Quantum Machine Learning — Lecture Notes",
    description,
  };

  // Generate breadcrumb schema for better indexing
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.fretchen.eu" },
    { name: "Quantum Lectures", url: "https://www.fretchen.eu/quantum" },
    { name: "Quantum Machine Learning", url },
  ]);

  return (
    <>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />

      <meta name="twitter:card" content="summary_large_image" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}
