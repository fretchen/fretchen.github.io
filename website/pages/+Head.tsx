// https://vike.dev/Head

import React from "react";
import { getRelMeLinks } from "../utils/siteData";
import { analyticsConfig } from "../utils/analyticsConfig";
import favicon from "./image_3_1fc7cfc7b9e9.jpg";

export default function HeadDefault() {
  const relMeLinks = getRelMeLinks();

  return (
    <>
      <link rel="icon" href={favicon} />
      {/* rel="me" links for identity verification (IndieWeb, Mastodon, Bluesky, etc.) */}
      {relMeLinks.map((link) => (
        <link key={link.platform} href={link.href} rel={link.rel} />
      ))}
      <link rel="webmention" href="https://webmention.io/www.fretchen.eu/webmention" />

      {/* umami analytics script - disabled when VITE_DISABLE_ANALYTICS is set */}
      {!analyticsConfig.isDisabled && (
        <script defer src={analyticsConfig.scriptUrl} data-website-id={analyticsConfig.websiteId}></script>
      )}
    </>
  );
}
