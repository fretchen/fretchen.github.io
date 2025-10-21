import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { generateBreadcrumbSchema } from "../../utils/schemaOrg";
import { description as getDescription } from "./+description";
import { title as getTitle } from "./+title";

export default function Head() {
  const pageContext = usePageContext();
  const url = `https://www.fretchen.eu${pageContext.urlPathname}`;
  const title = getTitle();
  const description = getDescription();

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Quantum — Lecture Notes",
    description,
    url,
    author: {
      "@type": "Person",
      name: "fretchen",
      url: "https://www.fretchen.eu",
    },
    hasPart: [
      {
        "@type": "WebPage",
        name: "Quantum Basics",
        url: "https://www.fretchen.eu/quantum/basics",
      },
      {
        "@type": "WebPage",
        name: "AMO - Atomic, Molecular & Optical Physics",
        url: "https://www.fretchen.eu/quantum/amo",
      },
      {
        "@type": "WebPage",
        name: "Quantum Machine Learning",
        url: "https://www.fretchen.eu/quantum/qml",
      },
      {
        "@type": "WebPage",
        name: "Quantum Hardware",
        url: "https://www.fretchen.eu/quantum/hardware",
      },
    ],
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.fretchen.eu" },
    { name: "Quantum Lectures", url },
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
