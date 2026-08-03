import { css } from "../styled-system/css";

/** Styles for components/TableOfContents.tsx — its only consumer. */

// ===== TABLE OF CONTENTS STYLES =====
export const toc = {
  /** Main container - sticky positioning */
  container: css({
    position: "sticky",
    top: "100px",
    maxHeight: "calc(100vh - 120px)",
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
    margin: 0,
    padding: 0,
  }),

  /** Link styling - base state */
  link: css({
    display: "block",
    paddingY: "xs",
    paddingX: "sm",
    fontSize: "sm",
    lineHeight: "normal",
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
    lineHeight: "normal",
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
