import type { PageContext } from "vike/types";
import { buildBreadcrumbTrail } from "../../../utils/schemaOrg";
import { getCanonicalUrl, getPageUrl } from "../../../utils/pageContext";
import { description as getDescription } from "./+description";

export default function structuredData(pageContext: PageContext) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      name: "x402 for Sellers — Accept Crypto Payments",
      description: getDescription(),
      url: getCanonicalUrl(pageContext),
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
    },
    buildBreadcrumbTrail(getPageUrl(pageContext)),
  ];
}
