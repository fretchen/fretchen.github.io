import { css } from "../styled-system/css";

/** Styles for components/WalletOptions.tsx — its only consumer. */

export const walletOptions = {
  dropdown: css({
    position: "relative",
    display: "inline-block",
  }),
  button: css({
    // Consistent outline/border style for all screen sizes
    padding: "8px 16px",
    backgroundColor: "transparent",
    color: "brand",
    border: "1px solid token(colors.brand)",
    borderRadius: "sm",
    cursor: "pointer",
    fontWeight: "semibold",
    display: "flex",
    alignItems: "center",
    gap: "xs",
    transition: "all {durations.normal} ease",
    minWidth: "120px", // Ensure minimum width for readability on desktop
    justifyContent: "center",
    _hover: {
      backgroundColor: "rgba(59, 130, 246, 0.05)",
      borderColor: "token(colors.brandHover)",
      color: "token(colors.brandHover)",
    },
    // Mobile responsive styles - smaller and more compact
    "@media (max-width: 768px)": {
      padding: "6px 10px",
      fontSize: "13px",
      minWidth: "auto",
      maxWidth: "none",
      width: "auto",
      marginLeft: "token(spacing.sm)", // Kleiner Abstand zu den anderen Links
    },
    "@media (max-width: 480px)": {
      padding: "4px 8px",
      fontSize: "xs",
      marginLeft: "token(spacing.xs)",
    },
  }),
  menu: css({
    position: "absolute",
    backgroundColor: "background",
    minWidth: "160px",
    boxShadow: "lg",
    zIndex: 2000, // Höherer z-index um über scrollbare Navigation zu sein
    right: "0",
    borderRadius: "sm",
    marginTop: "0.5", // Reduced gap to make it feel more connected
    border: "1px solid token(colors.border)",
    overflow: "hidden", // Ensures rounded corners work properly
  }),
  menuItem: css({
    padding: "10px 16px", // Slightly larger padding for easier clicking
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "xs",
    color: "text",
    textAlign: "left",
    cursor: "pointer",
    borderBottom: "1px solid token(colors.border)",
    transition: "all {durations.normal} ease",
    fontSize: "sm",
    _last: { borderBottom: "none" },
    _hover: {
      backgroundColor: "rgba(59, 130, 246, 0.08)", // Subtle brand color hover
      color: "brand",
    },
  }),
  menuItemIcon: css({
    width: "16px",
    height: "16px",
    flexShrink: 0,
  }),
  menuItemHover: css({
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    color: "brand",
  }),
};
