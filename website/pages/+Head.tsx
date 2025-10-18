// https://vike.dev/Head

import React from "react";
import favicon from "./image_3_1fc7cfc7b9e9.jpg";
export default function HeadDefault() {
  return (
    <>
      <link rel="icon" href={favicon} />
      {/* rel="me" link for identity verification (IndieWeb, Mastodon, etc.) */}
      <link href="https://github.com/fretchen" rel="me" />
      <link href="https://fretchen.bsky.social" rel="me atproto" />
      <link rel="webmention" href="https://webmention.io/www.fretchen.eu/webmention" />

      {/* umami analytics script - disabled when DISABLE_ANALYTICS is set */}
      {!import.meta.env.VITE_DISABLE_ANALYTICS && (
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="e41ae7d9-a536-426d-b40e-f2488b11bf95"
        ></script>
      )}
    </>
  );
}
