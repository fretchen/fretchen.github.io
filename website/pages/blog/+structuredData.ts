import type { PageContext } from "vike/types";
import { buildCollectionStructuredData } from "../../utils/schemaOrg";
import { description as getDescription } from "./+description";

export default function structuredData(pageContext: PageContext) {
  return buildCollectionStructuredData(pageContext, "Blog Posts", getDescription());
}
