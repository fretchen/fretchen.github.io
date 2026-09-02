import type { PageContext } from "vike/types";
import { buildBreadcrumbTrail } from "../../utils/schemaOrg";
import { getCanonicalUrl, getPageUrl } from "../../utils/pageContext";
import { description as getDescription } from "./+description";

export default function structuredData(pageContext: PageContext) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Quantum — Lecture Notes",
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
    },
    buildBreadcrumbTrail(getPageUrl(pageContext)),
  ];
}
