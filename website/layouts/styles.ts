import { css } from "../styled-system/css";
import { stack, flex } from "../styled-system/patterns";

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

// ===== INTERAKTIVE ELEMENTE =====

export const button = css({
  padding: "md",
  backgroundColor: "brand",
  color: "light",
  border: "none",
  borderRadius: "sm",
  cursor: "pointer",
  fontWeight: "bold",
  width: "100%",
  margin: "xs 0",
  transition: "all 0.2s",
  _hover: { backgroundColor: "#0052a3" },
  _disabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
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

// ===== IMAGE GENERATOR SPEZIFISCHE STILE =====

export const imageGen = {
  cardLayout: css({
    display: "flex",
    flexDirection: ["column", "column", "row"],
    gap: "lg",
    marginTop: "md",
    backgroundColor: "background",
    borderRadius: "md",
    border: "1px solid token(colors.border)",
    padding: "md",
  }),
  column: css({
    flex: "1",
    display: "flex",
    flexDirection: "column",
    gap: "md",
  }),
  columnHeading: css({
    fontSize: "lg",
    margin: 0,
  }),
  stepsList: css({
    display: "flex",
    flexDirection: "column",
    gap: "xs",
    marginBottom: "sm",
  }),
  stepItem: css({
    display: "flex",
    alignItems: "center",
    gap: "sm",
  }),
  stepNumber: css({
    backgroundColor: "brand",
    color: "light",
    width: "24px",
    height: "24px",
    borderRadius: "full",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  }),
  promptTextarea: css({
    padding: "md",
    height: "150px",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
    resize: "vertical",
    marginBottom: "sm",
    width: "100%",
  }),
  statusIndicator: css({
    padding: "sm",
    backgroundColor: "rgba(0, 102, 204, 0.1)",
    border: "1px solid token(colors.brand)",
    borderRadius: "sm",
    marginBottom: "sm",
  }),
  statusRow: css({
    display: "flex",
    alignItems: "center",
    gap: "sm",
  }),
  spinner: css({
    width: "16px",
    height: "16px",
    borderRadius: "full",
    border: "2px solid token(colors.brand)",
    borderRightColor: "transparent",
    animation: "spin 1s linear infinite",
  }),
  statusText: css({
    fontSize: "sm",
    color: "gray.600",
    marginTop: "xs",
  }),
  imagePreview: css({
    width: "100%",
    aspectRatio: "1/1",
    border: "2px dashed token(colors.border)",
    borderRadius: "sm",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
    position: "relative",
  }),
  imageOverlay: css({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    zIndex: 1,
  }),
  largeSpinner: css({
    width: "40px",
    height: "40px",
    borderRadius: "full",
    border: "4px solid token(colors.brand)",
    borderRightColor: "transparent",
    animation: "spin 1s linear infinite",
    marginBottom: "md",
  }),
  generatedImage: css({
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
  }),
  placeholderContent: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "md",
    textAlign: "center",
    color: "text",
  }),
  placeholderIcon: css({
    marginBottom: "sm",
    opacity: 0.5,
  }),
  placeholderCaption: css({
    fontSize: "sm",
    color: "gray.500",
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
  }),
  menu: css({
    position: "absolute",
    backgroundColor: "background",
    minWidth: "160px",
    boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)",
    zIndex: "1",
    right: "0",
    borderRadius: "sm",
    marginTop: "xs",
  }),
  menuItem: css({
    padding: "sm",
    textDecoration: "none",
    display: "block",
    color: "text",
    textAlign: "left",
    cursor: "pointer",
    borderBottom: "1px solid token(colors.border)",
    transition: "background-color 0.2s ease",
    _last: { borderBottom: "none" },
  }),
  menuItemHover: css({
    backgroundColor: "border",
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

// Page-specific styles for blog entries
export const pageContainer = css({
  maxWidth: "900px",
  mx: "auto",
  px: "md",
});
