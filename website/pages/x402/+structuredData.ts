import type { PageContext } from "vike/types";
import { buildBreadcrumbTrail } from "../../utils/schemaOrg";
import { getCanonicalUrl, getPageUrl } from "../../utils/pageContext";
import { description as getDescription } from "./+description";

export default function structuredData(pageContext: PageContext) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "x402",
      description: getDescription(),
      url: getCanonicalUrl(pageContext),
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
    },
    buildBreadcrumbTrail(getPageUrl(pageContext)),
  ];
}
