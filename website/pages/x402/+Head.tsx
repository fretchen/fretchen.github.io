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

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    name: "x402 Facilitator — Accept Crypto Payments",
    description,
    url,
    author: {
      "@type": "Person",
      name: "fretchen",
      url: "https://www.fretchen.eu",
    },
    about: {
      "@type": "Thing",
      name: "x402 Payment Protocol",
      url: "https://github.com/coinbase/x402",
    },
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.fretchen.eu" },
    { name: "x402 Facilitator", url },
  ]);

  return (
    <>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />

      <meta name="twitter:card" content="summary_large_image" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}
