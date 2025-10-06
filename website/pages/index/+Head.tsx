import React from "react";
import { generateWebSiteSchema, generatePersonSchema } from "../../utils/schemaOrg";

export default function Head() {
  const url = "https://www.fretchen.eu";

  // Generate WebSite schema
  const webSiteSchema = generateWebSiteSchema(
    url,
    "fretchen",
    "Welcome to my website with all kinds of notes etc. Nothing fancy, just me thinking out loudly.",
  );

  // Generate Person schema for personal branding
  const personSchema = generatePersonSchema(
    url,
    "fretchen",
    "Physicist, researcher, and developer sharing thoughts on quantum physics, AI, and technology.",
  );

  return (
    <>
      {/* Schema.org WebSite JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />
      {/* Schema.org Person JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
    </>
  );
}
