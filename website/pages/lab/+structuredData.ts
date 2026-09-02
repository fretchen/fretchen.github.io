import type { PageContext } from "vike/types";
import { buildBreadcrumbTrail } from "../../utils/schemaOrg";
import { getCanonicalUrl, getPageUrl } from "../../utils/pageContext";
import { description as getDescription } from "./+description";

export default function structuredData(pageContext: PageContext) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Lab — Blockchain Experiments",
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
          name: "AI Image Generator",
          url: "https://www.fretchen.eu/imagegen",
        },
        {
          "@type": "WebPage",
          name: "AI Assistant",
          url: "https://www.fretchen.eu/assistent",
        },
        {
          "@type": "WebPage",
          name: "x402",
          url: "https://www.fretchen.eu/x402",
        },
        {
          "@type": "WebPage",
          name: "Selling LLM Access with x402",
          url: "https://www.fretchen.eu/agent-onboarding",
        },
      ],
    },
    buildBreadcrumbTrail(getPageUrl(pageContext)),
  ];
}
