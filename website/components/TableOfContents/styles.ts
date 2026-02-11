import { css } from "../../styled-system/css";

/**
 * Panda CSS styles for Table of Contents component
 * Follows Docusaurus-style sticky sidebar pattern
 */

export const tocStyles = {
  /** Main container - sticky positioning */
  container: css({
    position: "sticky",
    top: "100px", // Below header
    maxHeight: "calc(100vh - 120px)",
    overflowY: "auto",
    paddingRight: "sm",
    paddingBottom: "lg",

    // Hide scrollbar but keep functionality
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
      borderRadius: "2px",
    },

    // Hide on smaller screens
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
    padding: "xs sm",
    fontSize: "sm",
    lineHeight: "1.4",
    color: "gray.600",
    textDecoration: "none",
    borderLeft: "2px solid transparent",
    transition: "all 0.15s ease",
    cursor: "pointer",

    "&:hover": {
      color: "gray.900",
      backgroundColor: "gray.50",
    },
  }),

  /** Link styling - active state */
  linkActive: css({
    display: "block",
    padding: "xs sm",
    fontSize: "sm",
    lineHeight: "1.4",
    color: "gray.900",
    fontWeight: "medium",
    textDecoration: "none",
    borderLeft: "2px solid token(colors.blue.500)",
    backgroundColor: "blue.50",
    transition: "all 0.15s ease",
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
