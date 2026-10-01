import React from "react";
import { cva, cx } from "../styled-system/css";

// The SVG files are a mask; the colour is the span's background. So the files in public/ are the
// only source of the shape, and the colour comes from the token, whatever fill the file carries.
const logo = cva({
  base: {
    display: "inline-block",
    flexShrink: 0,
    backgroundColor: "brand",
    maskImage: "url(/fretchen-logo.svg)",
    maskSize: "contain",
    maskRepeat: "no-repeat",
    maskPosition: "center",
  },
  variants: {
    teen: {
      true: { backgroundColor: "teen", maskImage: "url(/fretchen-teen.svg)" },
    },
  },
});

/** The mark, from `public/fretchen-logo.svg` (or `fretchen-teen.svg`). Without a `label` it is decorative. */
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
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ width: size, height: size }}
      className={cx(logo({ teen }), className)}
    />
  );
}
