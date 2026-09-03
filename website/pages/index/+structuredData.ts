import { generatePersonSchema, generateWebSiteSchema } from "../../utils/schemaOrg";
import { SITE } from "../../utils/siteData";

export default function structuredData() {
  return [
    generateWebSiteSchema(SITE.url, SITE.name, SITE.description),
    generatePersonSchema(SITE.url, SITE.name, SITE.description),
  ];
}
