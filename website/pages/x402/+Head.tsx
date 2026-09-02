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
    name: "x402",
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
        name: "x402 for Sellers",
        url: "https://www.fretchen.eu/x402/sellers",
      },
      {
        "@type": "WebPage",
        name: "x402 for Buyers",
        url: "https://www.fretchen.eu/x402/buyers",
      },
    ],
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.fretchen.eu" },
    { name: "x402", url },
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
