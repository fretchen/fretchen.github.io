import { css } from "../styled-system/css";

/** Styles for components/NFTFloatImage.tsx — its only consumer. */

// NFT Float Image styles for left-floating editorial image
export const nftFloat = {
  container: css({
    float: "left",
    width: "220px",
    marginRight: "lg",
    marginBottom: "md",
    marginTop: "xs",
    // Clear float for mobile
    "@media (max-width: 768px)": {
      float: "none",
      width: "100%",
      maxWidth: "300px",
      margin: "md auto",
      display: "block",
    },
  }),
  image: css({
    width: "100%",
    height: "auto",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    display: "block",
  }),
  caption: css({
    fontSize: "xs",
    color: "gray.600",
    marginTop: "xs",
    textAlign: "center",
    lineHeight: "1.3",
  }),
  loading: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
    backgroundColor: "gray.50",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
  }),
  spinner: css({
    width: "20px",
    height: "20px",
    border: "2px solid token(colors.gray.300)",
    borderTop: "2px solid token(colors.brand)",
    borderRadius: "full",
    animation: "spin 1s linear infinite",
  }),
  loadingText: css({
    fontSize: "xs",
    color: "gray.600",
    marginTop: "xs",
  }),
  placeholder: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
    backgroundColor: "gray.50",
    borderRadius: "sm",
    border: "1px dashed token(colors.gray.300)",
    textAlign: "center",
  }),
  placeholderText: css({
    fontSize: "sm",
    color: "gray.700",
    fontWeight: "medium",
  }),
  errorText: css({
    fontSize: "xs",
    color: "gray.500",
    marginTop: "xs",
  }),
};
