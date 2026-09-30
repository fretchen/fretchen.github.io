import React from "react";
import { css, cx } from "../styled-system/css";

const logo = css({ color: "brand", flexShrink: 0 });

/**
 * The mark, inline rather than an <img>: its `fill="currentColor"` only picks up the brand colour
 * from the page when the SVG is part of the DOM. Path copied from `public/fretchen-logo.svg`.
 * Without a `label` it is decorative and hidden from screen readers.
 */
export function FretchenLogo({ size, label, className }: { size: number; label?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 114"
      width={Math.round((size * 100) / 114)}
      height={size}
      fill="currentColor"
      fillRule="evenodd"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cx(logo, className)}
    >
      <path d="M8.33 14.0L23.33 0L38.33 14.0L61.67 14.0L76.67 0L91.67 14.0L100.0 22.33L100.0 105.67L91.67 114.0L8.33 114.0L0 105.67L0 22.33ZM23.05 36.4h13.9v15.8h-13.9ZM63.05 36.4h13.9v15.8h-13.9ZM36.95 43.0h26.1v2.59h-26.1ZM47.59 63.0a2.41 2.41 0 1 0 4.81 0a2.41 2.41 0 1 0 -4.81 0ZM27.35 77.7A22.65 23.2 0 0 0 72.65 77.7Z" />
    </svg>
  );
}
