/**
 * Foldable — a plain <details>/<summary> disclosure.
 *
 * Used on documentation pages so a long build guide skims as a checklist but expands into
 * full code snippets. No JS state: native <details> keeps it accessible and SSR-safe.
 */
import React from "react";
import { css } from "../styled-system/css";

const wrapper = css({
  mb: "3",
  border: "1px solid token(colors.border, #e5e7eb)",
  borderRadius: "md",
  overflow: "hidden",
});

// The closed state is the one that has to read as a control, so tint the summary rather than
// the whole wrapper — an expanded snippet then sits on the page ground, not in a second box.
const summary = css({
  px: "3",
  py: "2",
  fontSize: "sm",
  fontWeight: "semibold",
  color: "brand",
  bg: "gray.50",
  cursor: "pointer",
  userSelect: "none",
  _hover: { bg: "gray.100" },
});

const body = css({ px: "3", pb: "3", pt: "1" });

export interface FoldableProps {
  /** Summary line, e.g. "Show the code". */
  label: string;
  /** Open on first render (use sparingly — the point is a skimmable page). */
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function Foldable({ label, defaultOpen = false, children }: FoldableProps) {
  return (
    <details className={wrapper} open={defaultOpen}>
      <summary className={summary}>{label}</summary>
      <div className={body}>{children}</div>
    </details>
  );
}

export default Foldable;
