import { css } from "../styled-system/css";
import { stack } from "../styled-system/patterns";

// ===== ALLGEMEINE LAYOUTSTILE =====

// Container styles
export const container = css({
  maxWidth: "900px",
  mx: "auto",
  px: "md",
});

export const flexColumn = css({
  display: "flex",
  flexDirection: "column",
  gap: "md",
});

export const flexCenter = css({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
});

// ===== TYPOGRAFIE =====

export const heading = css({
  fontSize: "2xl",
  fontWeight: "bold",
  marginBottom: "sm",
  color: "text",
});

export const paragraph = css({
  marginBottom: "sm",
  lineHeight: "1.5",
});

export const list = css({
  paddingLeft: "2em",
  marginBottom: "sm",
});

// Hero section styles
export const heroContainer = css({
  textAlign: "center",
  marginY: "8",
});

export const heroText = css({
  fontSize: "lg",
  maxWidth: "700px",
  margin: "0 auto",
});

// Section header styles
export const sectionHeading = css({
  fontSize: "2xl",
  fontWeight: "semibold",
  marginBottom: "4",
  paddingBottom: "2",
  borderBottom: "1px solid token(colors.border)",
});

// Card layout styles
export const cardStack = stack({ gap: "4" });

// Blog section styles
export const blogSection = css({ marginTop: "10" });

// ===== VEREINFACHTE INTERAKTIVE ELEMENTE =====

// Universeller Button-Stil
export const baseButton = css({
  padding: "sm lg",
  border: "none",
  borderRadius: "sm",
  cursor: "pointer",
  fontWeight: "medium",
  fontSize: "sm",
  transition: "all 0.2s",
  _disabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
});

export const primaryButton = css({
  backgroundColor: "brand",
  color: "light",
  _hover: { backgroundColor: "#0052a3" },
});

export const secondaryButton = css({
  backgroundColor: "gray.200",
  color: "gray.800",
  _hover: { backgroundColor: "gray.300" },
});

// Universeller Spinner
export const spinner = css({
  width: "20px",
  height: "20px",
  borderRadius: "full",
  border: "2px solid token(colors.brand)",
  borderRightColor: "transparent",
  animation: "spin 1s linear infinite",
});

// Status-Nachrichten
export const statusMessage = css({
  padding: "sm",
  borderRadius: "sm",
  fontSize: "sm",
  display: "flex",
  alignItems: "center",
  gap: "sm",
});

export const errorStatus = css({
  backgroundColor: "rgba(220, 53, 69, 0.1)",
  border: "1px solid #dc3545",
  color: "#dc3545",
});

export const successStatus = css({
  backgroundColor: "rgba(40, 167, 69, 0.1)",
  border: "1px solid #28a745",
  color: "#28a745",
});

export const infoStatus = css({
  backgroundColor: "rgba(59, 130, 246, 0.1)",
  border: "1px solid token(colors.brand)",
  color: "brand",
});

export const link = css({
  display: "inline-block",
  color: "brand",
  textDecoration: "none",
  marginTop: "xs",
  fontWeight: "medium",
  _hover: { textDecoration: "underline" },
});

// ===== ZUSTANDSANZEIGEN =====

export const errorMessage = css({
  padding: "sm",
  borderRadius: "sm",
  backgroundColor: "rgba(220, 53, 69, 0.1)",
  border: "1px solid #dc3545",
  color: "#dc3545",
  marginTop: "md",
});

export const successMessage = css({
  padding: "md",
  backgroundColor: "rgba(40, 167, 69, 0.1)",
  border: "1px solid #28a745",
  borderRadius: "sm",
  marginTop: "sm",
});

// ===== IMAGE GENERATOR VEREINFACHT =====

export const imageGen = {
  // Kompaktes Layout
  compactLayout: css({
    background: "background",
    borderRadius: "md",
    border: "1px solid token(colors.border)",
    padding: "lg",
    marginBottom: "xl",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    transition: "all 0.2s ease",
    _hover: {
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
    },
  }),
  compactContainer: css({
    display: "flex",
    flexDirection: "column",
    gap: "md",
  }),
  compactHeader: css({
    marginBottom: "sm",
    textAlign: "center",
  }),
  compactTitle: css({
    fontSize: "lg",
    fontWeight: "bold",
    margin: 0,
    color: "brand",
  }),
  compactSubtitle: css({
    fontSize: "sm",
    color: "gray.600",
    marginTop: "xs",
    lineHeight: "1.4",
  }),
  compactForm: css({
    display: "flex",
    flexDirection: "column",
    gap: "md",
  }),
  compactFormRow: css({
    display: "flex",
    gap: "md",
    alignItems: "center",
    flexWrap: "wrap",
    "@media (max-width: 640px)": {
      flexDirection: "column",
      alignItems: "stretch",
      gap: "sm",
    },
  }),
  // Diskrete Kontrollleiste
  controlBar: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "md",
    "@media (max-width: 640px)": {
      flexDirection: "column",
      alignItems: "stretch",
      gap: "sm",
    },
  }),
  optionsGroup: css({
    display: "flex",
    alignItems: "center",
    gap: "md",
    "@media (max-width: 640px)": {
      width: "100%",
      justifyContent: "space-between",
    },
  }),
  compactSelect: css({
    padding: "sm md",
    border: "1px solid token(colors.border)",
    borderRadius: "md",
    fontSize: "sm",
    backgroundColor: "white",
    minWidth: "110px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    _focus: {
      borderColor: "brand",
      outline: "none",
      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
    },
    _hover: {
      borderColor: "gray.400",
    },
  }),
  // Kompakter Generator Button
  generatorButton: css({
    paddingY: "xs",
    paddingX: "md",
    backgroundColor: "brand",
    color: "light",
    border: "none",
    borderRadius: "md",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "sm",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: "xs",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
    _hover: {
      backgroundColor: "#0052a3",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 8px rgba(59, 130, 246, 0.3)",
    },
    _active: {
      transform: "translateY(0)",
      boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
    },
    "@media (max-width: 640px)": {
      width: "100%",
      justifyContent: "center",
    },
  }),
  generatorButtonDisabled: css({
    backgroundColor: "gray.300",
    color: "gray.500",
    cursor: "not-allowed",
    boxShadow: "none",
    _hover: {
      backgroundColor: "gray.300",
      transform: "none",
      boxShadow: "none",
    },
  }),
  compactLabel: css({
    fontSize: "sm",
    fontWeight: "semibold",
    color: "gray.800",
    minWidth: "auto",
    whiteSpace: "nowrap",
  }),
  compactFormatGroup: css({
    display: "flex",
    alignItems: "center",
    gap: "sm",
    padding: "sm md",
    backgroundColor: "gray.50",
    borderRadius: "md",
    border: "1px solid token(colors.border)",
    "@media (max-width: 640px)": {
      justifyContent: "center",
    },
  }),
  compactTextarea: css({
    flex: 1,
    padding: "sm md",
    border: "1px solid token(colors.border)",
    borderRadius: "md",
    fontSize: "sm",
    minHeight: "60px",
    resize: "vertical",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
    _focus: {
      borderColor: "brand",
      outline: "none",
      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
    },
    _hover: {
      borderColor: "gray.400",
    },
  }),
  compactButton: css({
    paddingY: "sm",
    paddingX: "lg",
    backgroundColor: "brand",
    color: "light",
    border: "none",
    borderRadius: "md",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "sm",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: "xs",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
    _hover: {
      backgroundColor: "#0052a3",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 8px rgba(59, 130, 246, 0.3)",
    },
    _active: {
      transform: "translateY(0)",
      boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
    },
  }),
  compactButtonDisabled: css({
    backgroundColor: "gray.300",
    color: "gray.500",
    cursor: "not-allowed",
    boxShadow: "none",
    _hover: {
      backgroundColor: "gray.300",
      transform: "none",
      boxShadow: "none",
    },
  }),
  compactStatus: css({
    display: "flex",
    alignItems: "center",
    gap: "sm",
    padding: "sm",
    background: "rgba(59, 130, 246, 0.1)",
    border: "1px solid rgba(59, 130, 246, 0.2)",
    borderRadius: "sm",
    fontSize: "sm",
  }),
  compactError: css({
    padding: "sm",
    backgroundColor: "rgba(220, 53, 69, 0.1)",
    border: "1px solid #dc3545",
    borderRadius: "sm",
    fontSize: "sm",
    color: "#dc3545",
  }),

  // Wiederverwendbare Stile für Heading
  columnHeading: css({
    fontSize: "lg",
    margin: 0,
  }),
};

// ===== KOMPONENTEN-SPEZIFISCHE STILE =====

// Card component styles
export const card = {
  container: css({
    width: "100%",
    borderRadius: "md",
    overflow: "hidden",
    boxShadow: "sm",
    transition: "all 0.3s ease",
    _hover: {
      boxShadow: "md",
      transform: "translateX(4px)",
    },
    bg: "white",
    marginY: "3",
    marginX: "1",
  }),
  content: css({
    padding: "6",
    display: "flex",
    flexDirection: "row",
    gap: "4",
    alignItems: "center",
  }),
  text: css({
    flex: 1,
  }),
  title: css({
    fontSize: "xl",
    fontWeight: "semibold",
    margin: 0,
  }),
  description: css({
    color: "gray.600",
    fontSize: "sm",
    marginTop: "1",
  }),
  link: css({
    whiteSpace: "nowrap",
    fontWeight: "medium",
  }),
};

// WalletOptions component styles
export const walletOptions = {
  dropdown: css({
    position: "relative",
    display: "inline-block",
  }),
  button: css({
    padding: "8px 16px",
    backgroundColor: "brand",
    color: "light",
    border: "none",
    borderRadius: "sm",
    cursor: "pointer",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "xs",
    transition: "all 0.2s ease",
    _hover: {
      backgroundColor: "#0052a3",
    },
  }),
  menu: css({
    position: "absolute",
    backgroundColor: "background",
    minWidth: "160px",
    boxShadow: "0px 8px 20px 0px rgba(0,0,0,0.15)",
    zIndex: 1000,
    right: "0",
    borderRadius: "sm",
    marginTop: "2px", // Reduced gap to make it feel more connected
    border: "1px solid token(colors.border)",
    overflow: "hidden", // Ensures rounded corners work properly
  }),
  menuItem: css({
    padding: "10px 16px", // Slightly larger padding for easier clicking
    textDecoration: "none",
    display: "block",
    color: "text",
    textAlign: "left",
    cursor: "pointer",
    borderBottom: "1px solid token(colors.border)",
    transition: "all 0.2s ease",
    fontSize: "sm",
    _last: { borderBottom: "none" },
    _hover: {
      backgroundColor: "rgba(59, 130, 246, 0.08)", // Subtle brand color hover
      color: "brand",
    },
  }),
  menuItemHover: css({
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    color: "brand",
  }),
};

// SupportArea component styles
export const supportArea = {
  container: css({
    display: "flex",
    alignItems: "center",
    margin: "md 0",
  }),
  buttonGroup: css({
    display: "flex",
  }),
  buttonBase: css({
    padding: "sm",
    backgroundColor: "brand",
    color: "light",
    fontWeight: "bold",
    height: "36px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
  }),
  writeButton: css({
    padding: "sm",
    backgroundColor: "brand",
    color: "light",
    fontWeight: "bold",
    height: "36px",
    borderRadius: "4px 0 0 4px",
    borderRight: "1px solid white",
    borderLeft: "none",
    borderTop: "none",
    borderBottom: "none",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    _disabled: {
      backgroundColor: "#5a7aac",
      cursor: "not-allowed",
    },
  }),
  readDisplay: css({
    padding: "sm",
    backgroundColor: "brand",
    color: "light",
    fontWeight: "bold",
    height: "36px",
    borderRadius: "0 4px 4px 0",
    border: "none",
    minWidth: "20px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }),
  tooltipContainer: css({
    position: "relative",
  }),
  tooltip: css({
    position: "absolute",
    bottom: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    marginBottom: "xs",
    padding: "sm",
    backgroundColor: "background",
    border: "1px solid",
    borderRadius: "sm",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    width: "max-content",
    maxWidth: "250px",
    zIndex: "100",
  }),
};

// Post component styles
export const post = {
  publishingDate: css({
    color: "gray.600",
    fontSize: "sm",
    marginBottom: "md",
  }),
  navigation: css({
    display: "flex",
    justifyContent: "space-between",
    marginTop: "xl",
    borderTop: "1px solid token(colors.border)",
    paddingTop: "md",
  }),
  navLink: css({
    display: "flex",
    flexDirection: "column",
  }),
  navLinkPrev: css({
    alignItems: "flex-start",
  }),
  navLinkNext: css({
    alignItems: "flex-end",
    textAlign: "right",
  }),
  navLabel: css({
    color: "gray.600",
  }),
  navTitle: css({
    fontWeight: "medium",
    color: "brand",
  }),
};

// EntryList component styles
export const entryList = {
  container: css({
    display: "flex",
    flexDirection: "column",
    gap: "4",
  }),
  entry: css({
    width: "100%",
    borderRadius: "md",
    overflow: "hidden",
    boxShadow: "sm",
    transition: "all 0.3s ease",
    _hover: {
      boxShadow: "md",
      transform: "translateX(4px)",
    },
    bg: "white",
    marginY: "3",
  }),
  entryContent: css({
    padding: "6",
    display: "flex",
    flexDirection: "row",
    gap: "4",
    alignItems: "center",
  }),
  entryText: css({
    flex: 1,
  }),
  entryDate: css({
    margin: "0",
    fontSize: "sm",
    color: "gray.600",
    marginBottom: "1",
  }),
  entryTitle: css({
    fontSize: "xl",
    fontWeight: "semibold",
    margin: 0,
  }),
  entryDescription: css({
    margin: "1 0 0 0",
    fontSize: "sm",
    color: "gray.600",
  }),
  entryLink: css({
    whiteSpace: "nowrap",
    fontWeight: "medium",
  }),
  viewAllContainer: css({
    textAlign: "right",
    marginTop: "2",
  }),
};

// Layout component styles
export const layout = {
  main: css({
    display: "flex",
    flexDirection: "column",
    maxWidth: "token(sizes.container)",
    margin: "auto",
  }),
  title: css({
    textAlign: "center",
    margin: "token(spacing.md) token(spacing.0)",
    padding: "token(spacing.sm)",
  }),
  appbar: css({
    padding: "token(spacing.sm) token(spacing.md)",
    width: "token(sizes.full)",
    display: "flex",
    flexDirection: "row",
    gap: "token(spacing.md)",
    borderBottom: "token(borders.light)",
    alignItems: "center",
  }),
  walletContainer: css({
    marginLeft: "auto",
  }),
  content: css({
    padding: "token(spacing.md)",
    paddingBottom: "token(spacing.xl)",
    minHeight: "token(sizes.screen)",
  }),
};

// ===== VEREINFACHTE NFT STILE =====

// NFT List component styles
export const nftList = {
  container: css({
    marginTop: "2xl",
  }),
  heading: css({
    marginBottom: "xl",
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
    gap: "lg",
    marginTop: "lg",
  }),
  walletPrompt: css({
    textAlign: "center",
    padding: "xl",
    color: "gray.600",
  }),
};

// Vereinfachte NFT Card styles
export const nftCard = {
  container: css({
    border: "1px solid token(colors.border)",
    borderRadius: "md",
    padding: "md",
    background: "background",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    _hover: {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
    },
  }),
  highlighted: css({
    border: "2px solid rgba(34, 197, 94, 1)",
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
    width: "100%",
    height: "200px",
    background: "rgba(245, 245, 245, 1)",
    borderRadius: "sm",
    marginBottom: "sm",
    overflow: "hidden",
  }),
  image: css({
    width: "100%",
    height: "100%",
    objectFit: "cover",
  }),
  imagePlaceholder: css({
    width: "100%",
    height: "200px",
    background: "rgba(245, 245, 245, 1)",
    borderRadius: "sm",
    marginBottom: "sm",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "gray.600",
    fontSize: "sm",
  }),
  imageError: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "gray.600",
    fontSize: "sm",
  }),
  title: css({
    fontSize: "md",
    fontWeight: "bold",
    marginBottom: "xs",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  description: css({
    fontSize: "sm",
    color: "gray.600",
    marginBottom: "sm",
    lineHeight: "1.4",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxHeight: "2.8em",
  }),
  footer: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "xs",
    color: "gray.400",
    flexWrap: "wrap",
    gap: "xs",
  }),
  metadataLink: css({
    color: "brand",
    textDecoration: "none",
    _hover: { textDecoration: "underline" },
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

  // Vereinfachte Action-Buttons
  actions: css({
    display: "flex",
    gap: "xs",
    marginTop: "sm",
    justifyContent: "center",
  }),
  actionButton: css({
    padding: "xs sm",
    fontSize: "xs",
    border: "1px solid",
    borderRadius: "sm",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textDecoration: "none",
    textAlign: "center",
    minWidth: "60px",
  }),

  // Vereinfachtes Modal
  modalOverlay: css({
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "lg",
  }),
  modalContent: css({
    position: "relative",
    maxWidth: "90vw",
    maxHeight: "90vh",
    background: "white",
    borderRadius: "md",
    overflow: "auto",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    display: "flex",
    flexDirection: "column",
  }),
  modalImage: css({
    width: "100%",
    height: "auto",
    maxHeight: "60vh",
    objectFit: "contain",
  }),
  modalClose: css({
    position: "absolute",
    top: "sm",
    right: "sm",
    background: "rgba(0, 0, 0, 0.5)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "lg",
    _hover: {
      background: "rgba(0, 0, 0, 0.7)",
    },
  }),
  modalInfo: css({
    padding: "md",
    borderTop: "1px solid rgba(229, 231, 235, 1)",
  }),
  modalTitle: css({
    fontSize: "lg",
    fontWeight: "bold",
    marginBottom: "xs",
  }),
  modalDescription: css({
    fontSize: "sm",
    color: "gray.600",
    lineHeight: "1.4",
  }),
};

// Page-specific styles for blog entries
export const pageContainer = css({
  maxWidth: "900px",
  mx: "auto",
  px: "md",
});

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
      color: "#000",
    },
  }),
  icon: css({
    fontSize: "md",
  }),
  message: css({
    whiteSpace: "nowrap",
  }),
};

// Tab component styles
export const tabs = {
  container: css({
    marginTop: "2xl",
  }),
  tabList: css({
    display: "flex",
    borderBottom: "2px solid token(colors.border)",
    marginBottom: "lg",
    gap: "xs",
  }),
  tab: css({
    padding: "sm lg",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    fontSize: "sm",
    fontWeight: "medium",
    color: "gray.600",
    transition: "all 0.2s ease",
    _hover: {
      color: "brand",
      backgroundColor: "rgba(59, 130, 246, 0.05)",
    },
  }),
  activeTab: css({
    color: "brand",
    borderBottomColor: "brand",
    backgroundColor: "rgba(59, 130, 246, 0.05)",
  }),
  tabPanel: css({
    display: "block",
  }),
  hiddenPanel: css({
    display: "none",
  }),
};
