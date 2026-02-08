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
    name: "Lab — Blockchain Experiments",
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
        name: "AI Image Generator",
        url: "https://www.fretchen.eu/imagegen",
      },
      {
        "@type": "WebPage",
        name: "AI Assistent",
        url: "https://www.fretchen.eu/assistent",
      },
      {
        "@type": "WebPage",
        name: "x402 Payments & Facilitator",
        url: "https://www.fretchen.eu/x402",
      },
      {
        "@type": "WebPage",
        name: "Agent Onboarding",
        url: "https://www.fretchen.eu/agent-onboarding",
      },
    ],
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.fretchen.eu" },
    { name: "Lab", url },
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
