import React from "react";
import { css } from "../../../styled-system/css";

const wrapper = css({
  my: "6",
  p: "4",
  border: "2px dashed token(colors.border, #e5e7eb)",
  borderRadius: "md",
  bg: "gray.50",
  textAlign: "center",
  color: "gray.600",
  fontSize: "sm",
});

export interface WidgetPlaceholderProps {
  /** Working title of the widget, shown as the placeholder heading. */
  label: string;
  /** One-line description of what it will do, for the reviewer, not the reader. */
  description: string;
}

/**
 * Stand-in for an interactive widget that has not been implemented yet.
 * Lets the surrounding post text be reviewed before the box-counting engine exists.
 */
export function WidgetPlaceholder({ label, description }: WidgetPlaceholderProps) {
  return (
    <div className={wrapper}>
      <strong>🚧 {label}</strong>
      <p>{description}</p>
    </div>
  );
}

export default WidgetPlaceholder;
