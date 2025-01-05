import * as React from "react";

export function Head() {
  return (
    <>
      {/* Adding a script tag */}
      <script
        src="https://giscus.app/client.js"
        data-repo="fretchen/fretchen.github.io"
        data-repo-id="MDEwOlJlcG9zaXRvcnkzMzkyNzQ5OA=="
        data-category="General"
        data-category-id="DIC_kwDOAgWxSs4ClveO"
        data-mapping="pathname"
        data-strict="1"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="bottom"
        data-theme="preferred_color_scheme"
        data-lang="en"
        data-loading="lazy"
        crossOrigin="anonymous"
        async
      ></script>
    </>
  );
}
