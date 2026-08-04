import { css } from "../styled-system/css";

/** Styles for components/TableOfContents.tsx — its only consumer. */

// ===== TABLE OF CONTENTS STYLES =====
export const toc = {
  /** Main container - sticky positioning */
  container: css({
    position: "sticky",
    // The app bar is `position: relative` (layouts/LayoutDefault.styles.ts) and scrolls
    // away, so there is no fixed header to clear. The old 100px/120px pair was sized for
    // one that does not exist and parked the ToC a long way down the viewport.
    top: "20px",
    maxHeight: "calc(100vh - 40px)",
    overflowY: "auto",
    paddingRight: "sm",
    paddingBottom: "lg",
    scrollbarWidth: "thin",
    scrollbarColor: "token(colors.gray.300) transparent",
    "&::-webkit-scrollbar": {
      width: "4px",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "token(colors.gray.300)",
      borderRadius: "xs",
    },
    "@media (max-width: 1200px)": {
      display: "none",
    },
  }),

  /** Title "On this page" */
  title: css({
    fontSize: "xs",
    fontWeight: "semibold",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "gray.500",
    marginBottom: "sm",
    paddingLeft: "sm",
  }),

  /** List container */
  list: css({
    listStyle: "none",
    padding: 0,
    margin: 0,
  }),

  /** Individual list item */
  listItem: css({
    // Entry separation lives here, NOT on the link's paddingY: padding sits inside the
    // border-left rail, so widening it would stretch the active indicator instead of
    // separating entries. The rail must stay flush to exactly one entry.
    // Longhands rather than `margin: 0` so this can't lose a shorthand-vs-longhand
    // ordering race with marginBottom in Panda's atomic output.
    marginTop: "0",
    marginBottom: "0.5em",
    padding: 0,
    "&:last-child": {
      marginBottom: "0",
    },
  }),

  /** Link styling - base state */
  link: css({
    display: "block",
    paddingY: "xs",
    paddingX: "sm",
    fontSize: "sm",
    // snug (1.375), not normal (1.5): a wrapped entry's own lines must sit tighter than the
    // gap between entries, or item boundaries are ambiguous. Keep in sync with linkActive.
    lineHeight: "snug",
    color: "gray.600",
    textDecoration: "none",
    borderLeft: "2px solid transparent",
    transition: "all {durations.normal} ease",
    cursor: "pointer",
    "&:hover": {
      color: "gray.900",
      backgroundColor: "gray.50",
    },
  }),

  /** Link styling - active state */
  linkActive: css({
    display: "block",
    paddingY: "xs",
    paddingX: "sm",
    fontSize: "sm",
    lineHeight: "snug", // must match link above
    color: "gray.900",
    fontWeight: "semibold",
    textDecoration: "none",
    borderLeft: "2px solid token(colors.blue.500)",
    backgroundColor: "blue.50",
    transition: "all {durations.normal} ease",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "blue.100",
    },
  }),

  /** Indent for h3 headings */
  indent: css({
    paddingLeft: "lg",
  }),
};
