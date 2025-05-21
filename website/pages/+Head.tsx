// https://vike.dev/Head

import React from "react";
import favicon from "./image_3_1fc7cfc7b9e9.jpg";
export default function HeadDefault() {
  return (
    <>
      <link rel="icon" href={favicon} />
      {
        // umami analytics script
      }
      <script
        defer
        src="https://cloud.umami.is/script.js"
        data-website-id="e41ae7d9-a536-426d-b40e-f2488b11bf95"
      ></script>
    </>
  );
}
