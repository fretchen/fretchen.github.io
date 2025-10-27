import React from "react";
import { MyFigureProps } from "../types/components";

/**
 * MyFigure Component
 * Renders a semantic HTML5 figure element with optional ID and styling.
 * Supports image imports from Vite and displays captions.
 *
 * @param href - Image source (can be imported from Vite or external URL)
 * @param caption - Figure caption text
 * @param id - Optional figure ID for referencing and styling
 * @param width - Optional image width (default: "100%")
 * @param alt - Optional alt text (falls back to caption if not provided)
 * @param className - Optional CSS classes for custom styling
 * @param title - Optional figure title (rendered above the image)
 */
export function MyFigure({ href, caption, id, width = "100%", alt, className, title }: MyFigureProps) {
  return (
    <figure id={id} className={className} style={{ margin: "1.5em 0" }}>
      {title && <h3 style={{ marginTop: 0, marginBottom: "0.5em" }}>{title}</h3>}
      <img
        src={href}
        alt={alt || caption}
        width={width}
        style={{
          maxWidth: width,
          height: "auto",
          display: "block",
          margin: "0 auto",
        }}
      />
      <figcaption style={{ marginTop: "0.75em", fontStyle: "italic", textAlign: "center" }}>{caption}</figcaption>
    </figure>
  );
}
