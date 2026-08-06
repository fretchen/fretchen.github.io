import { css } from "../styled-system/css";

/** Styles for components/MetadataLine.tsx — its only consumer. */

export const metadataLine = {
  container: css({
    fontSize: "sm",
    color: "gray.600",
    marginBottom: "lg",
    display: "flex",
    alignItems: "center",
    gap: "xs",
    flexWrap: "wrap",
    lineHeight: "normal",
    // Mobile responsive
    "@media (max-width: 768px)": {
      fontSize: "xs",
      gap: "xs",
    },
  }),
  separator: css({
    margin: "0 token(spacing.xs)",
    opacity: 0.5,
    userSelect: "none",
  }),
  reactions: css({
    fontSize: "inherit",
    color: "inherit",
    userSelect: "none",
  }),
  supportWrapper: css({
    display: "inline-block",
  }),
  // Amount reads as secondary to the "Support" verb (lighter weight + slightly muted).
  supportAmount: css({
    fontWeight: "normal",
    opacity: 0.85,
  }),
};
