import { css } from "../styled-system/css";

/** Styles for components/Toast.tsx — its only consumer. */

// Toast notification styles
export const toast = {
  container: css({
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 9999,
    transition: "all {durations.normal} ease",
  }),
  content: css({
    display: "flex",
    alignItems: "center",
    gap: "sm",
    padding: "md",
    // One rule for all three states: the status colour as fill, white text. Every
    // combination clears AA (success 5.02, danger 4.53, warning 5.02), so there is no
    // black-text special case. The previous green.500 fill was 2.28:1 and unreadable.
    backgroundColor: "success",
    color: "white",
    borderRadius: "md",
    boxShadow: "lg",
    fontSize: "sm",
    fontWeight: "semibold",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    '&[data-type="error"]': {
      backgroundColor: "danger",
    },
    '&[data-type="warning"]': {
      backgroundColor: "warning",
    },
  }),
  icon: css({
    fontSize: "md",
  }),
  message: css({
    whiteSpace: "nowrap",
  }),
};
