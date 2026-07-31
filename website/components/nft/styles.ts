import { css } from "../../styled-system/css";

/**
 * Styles for the NFT card/list cluster (NFTCard, NFTList, MyNFTList, PublicNFTList,
 * ImageModal, ImageGenerator). Feature-owned rather than global: three consumers each,
 * but all inside this one cluster.
 */

// Image-First NFT Card styles
export const nftCard = {
  container: css({
    position: "relative",
    aspectRatio: "1", // Quadratisches Format
    borderRadius: "lg",
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: "md",
    transition: "all {durations.normal} ease",
    background: "gray.100",
    _hover: {
      transform: "scale(1.02)",
      boxShadow: "md",
    },
    // Mobile: Slightly smaller scale effect
    "@media (max-width: 768px)": {
      _hover: {
        transform: "scale(1.01)",
      },
    },
  }),
  highlighted: css({
    border: "2px solid token(colors.success)",
    background: "rgba(240, 253, 244, 1)",
    animation: "pulse 2s ease-in-out infinite",
  }),
  loadingContainer: css({
    textAlign: "center",
    padding: "lg",
  }),
  loadingText: css({
    fontSize: "sm",
    color: "gray.600",
    marginTop: "sm",
  }),
  errorContainer: css({
    textAlign: "center",
    padding: "lg",
  }),
  errorBox: css({
    background: "rgba(254, 238, 238, 1)",
    border: "1px solid rgba(252, 204, 204, 1)",
    borderRadius: "sm",
    padding: "sm",
    marginBottom: "sm",
  }),
  errorText: css({
    fontSize: "sm",
    color: "rgba(221, 51, 51, 1)",
  }),
  tokenIdText: css({
    fontSize: "sm",
    color: "gray.600",
  }),
  imageContainer: css({
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    background: "gray.100",
  }),
  image: css({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform {durations.normal} ease",
    _groupHover: {
      transform: "scale(1.05)",
    },
  }),
  imagePlaceholder: css({
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "gray.200",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "gray.500",
    fontSize: "lg",
    fontWeight: "semibold",
  }),

  // Actions Overlay (nur bei Hover sichtbar)
  actionsOverlay: css({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "md",
    opacity: 0,
    transition: "opacity {durations.normal} ease",
    _groupHover: {
      opacity: 1,
    },
    // Mobile: Always show actions with lower opacity
    "@media (max-width: 768px)": {
      opacity: 0.9,
      background: "rgba(0,0,0,0.3)",
    },
  }),

  // Corner Badges für Status Info
  cornerBadge: css({
    position: "absolute",
    top: "sm",
    right: "sm",
    background: "rgba(0,0,0,0.8)",
    color: "white",
    fontSize: "xs",
    fontWeight: "semibold",
    padding: "xs sm",
    borderRadius: "full",
    backdropFilter: "blur(4px)",
    border: "1px solid rgba(255,255,255,0.1)",
  }),

  // Neutraler Badge für Owner Info
  ownerBadge: css({
    position: "absolute",
    top: "sm",
    left: "sm",
    background: "rgba(0,0,0,0.8)",
    color: "white",
    fontSize: "xs",
    fontWeight: "semibold",
    padding: "xs sm",
    borderRadius: "full",
    backdropFilter: "blur(4px)",
    border: "1px solid rgba(255,255,255,0.1)",
  }),

  // Grüner Badge nur für "Listed" Status
  listedBadge: css({
    position: "absolute",
    top: "2.5rem", // Unter dem Owner Badge positioniert
    left: "sm",
    background: "token(colors.success)",
    color: "white",
    fontSize: "xs",
    fontWeight: "semibold",
    padding: "xs sm",
    borderRadius: "full",
    backdropFilter: "blur(4px)",
    border: "1px solid rgba(255,255,255,0.2)",
  }),
  imageError: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "gray.600",
    fontSize: "sm",
    // Mobile: Adjust font size
    "@media (max-width: 480px)": {
      fontSize: "2xs",
    },
  }),

  // Checkbox für Listed Status
  checkboxLabel: css({
    display: "flex",
    alignItems: "center",
    gap: "xs",
    fontSize: "xs",
    color: "gray.600",
    cursor: "pointer",
    userSelect: "none",
    _hover: {
      color: "gray.800",
    },
    // Mobile: More compact layout
    "@media (max-width: 480px)": {
      fontSize: "2xs",
      gap: "2xs",
    },
  }),
  checkbox: css({
    width: "14px",
    height: "14px",
    cursor: "pointer",
    accentColor: "brand",
    _disabled: {
      cursor: "not-allowed",
      opacity: 0.6,
    },
  }),

  // Overlay Action-Buttons
  actions: css({
    display: "flex",
    gap: "sm",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    // Mobile: Larger gaps for better touch targets
    "@media (max-width: 768px)": {
      gap: "md",
    },
  }),

};
// NFT List component styles
export const nftList = {
  container: css({
    marginTop: "2xl",
  }),
  loadingContainer: css({
    textAlign: "center",
    padding: "xl",
  }),
  emptyStateContainer: css({
    textAlign: "center",
    padding: "xl",
    background: "rgba(249, 249, 249, 1)",
    borderRadius: "md",
  }),
  emptyStateText: css({
    color: "gray.600",
  }),
  grid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "md", // Kleinere Gaps für dichtere Packung
    marginTop: "lg",
    // Mobile: Optimiert für Image-First
    "@media (max-width: 768px)": {
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: "sm",
    },
    "@media (max-width: 480px)": {
      gridTemplateColumns: "repeat(2, 1fr)", // Genau 2 Spalten auf mobil
      gap: "xs",
      marginTop: "md",
    },
  }),
  walletPrompt: css({
    textAlign: "center",
    padding: "xl",
    color: "gray.600",
  }),
};
