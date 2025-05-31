import React from "react";
import { MyFigureProps } from "../types/components";

export function MyFigure({ href, caption }: MyFigureProps) {
  return (
    <figure>
      <img src={href} alt={caption} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
