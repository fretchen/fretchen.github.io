import React from "react";
import { cva, cx } from "../styled-system/css";

const logo = cva({
  base: { color: "brand", flexShrink: 0 },
  variants: {
    teen: {
      true: { color: "teen" },
    },
  },
});

const PATHS = {
  default:
    "M15.33 14.0L24.65 5.31A8.33 8.33 0 0 1 36.02 5.31L45.33 14.0L68.67 14.0L77.98 5.31A8.33 8.33 0 0 1 89.35 5.31L98.67 14.0A8.33 8.33 0 0 1 107.0 22.33L107.0 105.67A8.33 8.33 0 0 1 98.67 114.0L15.33 114.0A8.33 8.33 0 0 1 7.0 105.67L7.0 22.33A8.33 8.33 0 0 1 15.33 14.0ZM29.96 44.3a7.04 7.04 0 1 1 14.07 0a7.04 7.04 0 1 1 -14.07 0ZM69.96 44.3a7.04 7.04 0 1 1 14.07 0a7.04 7.04 0 1 1 -14.07 0ZM44.04 43.0h25.93v2.59h-25.93ZM54.59 63.0a2.41 2.41 0 1 1 4.81 0a2.41 2.41 0 1 1 -4.81 0ZM34.35 77.7A22.65 23.2 0 0 0 79.65 77.7Z",
  teen: "M15.33 14.0L30.33 0L45.33 14.0L68.67 14.0L83.67 0L98.67 14.0L107.0 22.33L107.0 105.67L98.67 114.0L15.33 114.0L7.0 105.67L7.0 22.33ZM30.05 36.4h13.9v15.8h-13.9ZM70.05 36.4h13.9v15.8h-13.9ZM43.95 43.0h26.1v2.59h-26.1ZM54.59 63.0a2.41 2.41 0 1 1 4.81 0a2.41 2.41 0 1 1 -4.81 0ZM34.35 77.7A22.65 23.2 0 0 0 79.65 77.7Z",
};

/**
 * The mark, inline rather than an <img>: its `fill="currentColor"` only picks up the brand colour
 * from the page when the SVG is part of the DOM. Paths copied from `public/fretchen-logo.svg` and
 * `public/fretchen-teen.svg`. Without a `label` it is decorative and hidden from screen readers.
 */
export function FretchenLogo({
  size,
  label,
  teen = false,
  className,
}: {
  size: number;
  label?: string;
  teen?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 114 114"
      width={size}
      height={size}
      fill="currentColor"
      fillRule="evenodd"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cx(logo({ teen }), className)}
    >
      <path d={teen ? PATHS.teen : PATHS.default} />
    </svg>
  );
}
