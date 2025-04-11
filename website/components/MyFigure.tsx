import React from "react";

export function MyFigure({ href, caption }: { href: string; caption: string }) {
  return (
    <figure>
      <img src={href} alt={caption} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
