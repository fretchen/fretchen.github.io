import React from "react";
import { css } from "../styled-system/css";

interface InfoIconProps {
  size?: "xs" | "sm" | "md";
  className?: string;
}

export default function InfoIcon({ size = "sm", className }: InfoIconProps) {
  const sizeStyles = {
    xs: css({ fontSize: "xs", lineHeight: "1" }),
    sm: css({ fontSize: "sm", lineHeight: "1" }),
    md: css({ fontSize: "md", lineHeight: "1" }),
  } as const;

  const baseStyles = css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "1em",
    height: "1em",
    borderRadius: "50%",
    backgroundColor: "blue.100",
    color: "blue.600",
    fontWeight: "bold",
    cursor: "help",
  });

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${className || ""}`} role="img" aria-label="Information">
      i
    </span>
  );
}
