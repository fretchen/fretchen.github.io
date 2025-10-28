import React from "react";
import { generateWebSiteSchema, generatePersonSchema } from "../../utils/schemaOrg";
import { SITE } from "../../utils/siteData";

export default function Head() {
  // Generate WebSite schema
  const webSiteSchema = generateWebSiteSchema(
    SITE.url,
    SITE.name,
    "Welcome to my website with all kinds of notes etc. Nothing fancy, just me thinking out loudly.",
  );

  // Generate Person schema for personal branding
  const personSchema = generatePersonSchema(SITE.url, SITE.name, SITE.description);

  return (
    <>
      {/* Schema.org WebSite JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />
      {/* Schema.org Person JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
    </>
  );
}
