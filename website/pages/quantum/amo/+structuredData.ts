import type { PageContext } from "vike/types";
import { buildCollectionStructuredData } from "../../../utils/schemaOrg";
import { description as getDescription } from "./+description";

export default function structuredData(pageContext: PageContext) {
  return buildCollectionStructuredData(
    pageContext,
    "AMO - Atomic, Molecular & Optical Physics (Lecture Notes)",
    getDescription(),
  );
}
