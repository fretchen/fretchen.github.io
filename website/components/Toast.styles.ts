import { css } from "../styled-system/css";

/** Styles for components/Toast.tsx — its only consumer. */

// Toast notification styles
export const toast = {
  container: css({
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 9999,
    transition: "all 0.3s ease-out",
  }),
  content: css({
    display: "flex",
    alignItems: "center",
    gap: "sm",
    padding: "md",
    backgroundColor: "rgba(34, 197, 94, 0.95)", // Default success color
    color: "white",
    borderRadius: "md",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    fontSize: "sm",
    fontWeight: "medium",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    '&[data-type="error"]': {
      backgroundColor: "rgba(220, 53, 69, 0.95)",
    },
    '&[data-type="warning"]': {
      backgroundColor: "rgba(255, 193, 7, 0.95)",
      color: "black",
    },
  }),
  icon: css({
    fontSize: "md",
  }),
  message: css({
    whiteSpace: "nowrap",
  }),
};
