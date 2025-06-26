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

// ===== EINHEITLICHE KARTEN-STYLES =====

// Basis-Stil für alle Karten-Komponenten
export const baseContentCard = {
  container: css({
    width: "100%",
    borderRadius: "md",
    overflow: "hidden",
    boxShadow: "sm",
    transition: "all 0.3s ease",
    cursor: "pointer",
    textDecoration: "none",
    color: "inherit",
    display: "block",
    _hover: {
      boxShadow: "md",
      transform: "translateX(4px)",
      textDecoration: "none",
    },
    bg: "white",
    marginY: "3",
    // Mobile: Vereinfachte Hover-Effekte und engere Abstände
    "@media (max-width: 768px)": {
      marginY: "1",
      _hover: {
        boxShadow: "md",
        transform: "scale(1.01)",
        textDecoration: "none",
      },
    },
    "@media (max-width: 480px)": {
      marginY: "0.5",
      borderRadius: "sm", // Kleinerer Grenzradius für mobile Geräte
    },
  }),
  content: css({
    padding: "6",
    display: "flex",
    flexDirection: "row",
    gap: "4",
    alignItems: "flex-start",
    // Mobile responsive Layout - einheitliche Abstände
    "@media (max-width: 768px)": {
      padding: "3", // Viel engere Polsterung
      gap: "2.5",
    },
    "@media (max-width: 480px)": {
      flexDirection: "row", // Horizontal auf mobile für engeres Layout
      gap: "2",
      padding: "2.5",
      alignItems: "center", // Zentrierte Ausrichtung für bessere visuelle Balance
    },
  }),
  text: css({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0, // Verhindert Überläufe von Flex-Elementen
    gap: "1", // Konsistente interne Abstände
    // Mobile: Interne Abstände für engeres Layout entfernen
    "@media (max-width: 480px)": {
      gap: "0.5",
    },
  }),
  title: css({
    fontSize: "xl",
    fontWeight: "semibold",
    margin: 0,
    lineHeight: "1.3",
    // Mobile: Größerer Titel
    "@media (max-width: 768px)": {
      fontSize: "lg",
      lineHeight: "1.4",
      fontWeight: "bold", // Etwas fetter für Betonung
    },
    "@media (max-width: 480px)": {
      fontSize: "base", // Größer als vorher auf mobile
      lineHeight: "1.4",
      fontWeight: "bold",
    },
  }),
  description: css({
    margin: "0.5 0 0 0",
    fontSize: "sm",
    color: "gray.600",
    lineHeight: "1.5",
    // Mobile: Beschreibung ausblenden oder verkürzen
    "@media (max-width: 768px)": {
      fontSize: "xs",
      lineHeight: "1.5",
      margin: "0.25 0 0 0",
      // Beschreibung auf Tablet abschneiden
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    "@media (max-width: 480px)": {
      display: "none", // Vollständig auf mobile ausblenden
    },
  }),
  // Zusätzliche Styles für Bilder
  image: css({
    width: "20", // 80px Thumbnail-Größe
    height: "20", // 80px Thumbnail-Größe
    borderRadius: "xl",
    objectFit: "cover",
    border: "1px solid",
    borderColor: "gray.300",
    backgroundColor: "gray.100",
    flexShrink: 0,
    // Responsive Bildgrößen
    "@media (max-width: 768px)": {
      width: "12", // 48px auf Tablet
      height: "12",
      borderRadius: "lg",
    },
    "@media (max-width: 480px)": {
      width: "10", // 40px auf mobile - kleiner aber noch sichtbar
      height: "10",
      borderRadius: "md",
    },
  }),
  // Zusätzliche Styles für Datum
  date: css({
    margin: "0",
    fontSize: "sm",
    color: "gray.600",
    marginBottom: "0.5", // Reduzierte Abstände
    // Mobile: Kleiner und subtiler
    "@media (max-width: 768px)": {
      fontSize: "xs",
      marginBottom: "0.25",
    },
    "@media (max-width: 480px)": {
      fontSize: "2xs", // Sehr klein auf mobile
      marginBottom: "0",
    },
  }),
};

// Container für Listen von Karten
export const baseContentCardList = css({
  display: "flex",
  flexDirection: "column",
  gap: "4",
  "@media (max-width: 768px)": {
    gap: "2", // Engere Abstände auf mobile
  },
  "@media (max-width: 480px)": {
    gap: "1.5", // Noch enger auf kleinen mobilen Geräten
  },
});

// Übergangs-Stil für bestehende Card-Komponente (zur Kompatibilität)
export const card = {
  container: baseContentCard.container,
  content: baseContentCard.content,
  text: baseContentCard.text,
  title: baseContentCard.title,
  description: baseContentCard.description,
};

// WalletOptions component styles
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
    fontWeight: "medium",
    display: "flex",
    alignItems: "center",
    gap: "xs",
    transition: "all 0.2s ease",
    minWidth: "120px", // Ensure minimum width for readability on desktop
    justifyContent: "center",
    _hover: {
      backgroundColor: "rgba(59, 130, 246, 0.05)",
      borderColor: "#0052a3",
      color: "#0052a3",
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
      fontSize: "12px",
      marginLeft: "token(spacing.xs)",
    },
  }),
  menu: css({
    position: "absolute",
    backgroundColor: "background",
    minWidth: "160px",
    boxShadow: "0px 8px 20px 0px rgba(0,0,0,0.15)",
    zIndex: 2000, // Höherer z-index um über scrollbare Navigation zu sein
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
    margin: "0", // Remove default margin - let parent control spacing
    justifyContent: "center", // Center on mobile
  }),
  buttonGroup: css({
    display: "flex",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    borderRadius: "token(radii.sm)",
    overflow: "hidden",
  }),
  buttonBase: css({
    padding: "token(spacing.sm)",
    backgroundColor: "brand",
    color: "light",
    fontWeight: "bold",
    minHeight: "44px", // Better touch target for mobile
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    transition: "all 0.2s ease",
    // Mobile optimizations
    "@media (max-width: 768px)": {
      minHeight: "48px", // Even larger touch target on mobile
      fontSize: "sm",
    },
  }),
  writeButton: css({
    padding: "token(spacing.sm) token(spacing.md)",
    backgroundColor: "brand",
    color: "light",
    fontWeight: "bold",
    minHeight: "44px",
    borderRadius: "token(radii.sm) 0 0 token(radii.sm)",
    borderRight: "1px solid rgba(255, 255, 255, 0.3)",
    border: "none",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    _hover: {
      backgroundColor: "#0052a3",
      transform: "translateY(-1px)",
    },
    _active: {
      transform: "translateY(0)",
    },
    _disabled: {
      backgroundColor: "#5a7aac",
      cursor: "not-allowed",
      transform: "none",
      _hover: {
        backgroundColor: "#5a7aac",
        transform: "none",
      },
    },
    // Mobile optimizations
    "@media (max-width: 768px)": {
      minHeight: "48px",
      fontSize: "sm",
      padding: "token(spacing.sm) token(spacing.lg)",
    },
    "@media (max-width: 480px)": {
      padding: "token(spacing.sm) token(spacing.md)",
      fontSize: "xs",
    },
  }),
  readDisplay: css({
    padding: "token(spacing.sm) token(spacing.md)",
    backgroundColor: "brand",
    color: "light",
    fontWeight: "bold",
    minHeight: "44px",
    borderRadius: "0 token(radii.sm) token(radii.sm) 0",
    border: "none",
    minWidth: "48px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "sm",
    // Mobile optimizations
    "@media (max-width: 768px)": {
      minHeight: "48px",
      minWidth: "52px",
      fontSize: "sm",
    },
    "@media (max-width: 480px)": {
      minWidth: "48px",
      fontSize: "xs",
    },
  }),
  tooltipContainer: css({
    position: "relative",
  }),
  tooltip: css({
    position: "absolute",
    bottom: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    marginBottom: "token(spacing.xs)",
    padding: "token(spacing.sm) token(spacing.md)",
    backgroundColor: "background",
    border: "1px solid token(colors.border)",
    borderRadius: "token(radii.sm)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    width: "max-content",
    maxWidth: "280px",
    zIndex: "1000",
    fontSize: "sm",
    color: "text",
    // Mobile responsive tooltip positioning
    "@media (max-width: 768px)": {
      position: "fixed",
      bottom: "auto",
      top: "10px",
      left: "10px",
      right: "10px",
      transform: "none",
      maxWidth: "none",
      width: "auto",
      textAlign: "center",
    },
  }),
};

// Post component styles
export const post = {
  publishingDate: css({
    color: "gray.600",
    fontSize: "sm",
    marginBottom: "md",
  }),
  contentContainer: css({
    // Container to handle floating layout
    overflow: "hidden", // Clears the float
    lineHeight: "1.6",
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
  // Verwendung der einheitlichen Basis-Styles
  container: baseContentCardList,
  entry: baseContentCard.container,
  entryContent: baseContentCard.content,
  entryText: baseContentCard.text,
  entryTitle: baseContentCard.title,
  entryDescription: baseContentCard.description,
  entryDate: baseContentCard.date,
  entryNftImage: baseContentCard.image,
  
  // Spezifische EntryList-Styles
  entryTextContent: css({
    flex: 1,
    display: "flex",
    flexDirection: "column",
  }),
  viewAllContainer: css({
    textAlign: "right",
    marginTop: "2",
    "@media (max-width: 480px)": {
      textAlign: "center",
      marginTop: "3",
    },
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
    // Mobile responsive styles
    "@media (max-width: 768px)": {
      fontSize: "1.8rem",
      margin: "token(spacing.sm) token(spacing.0)",
      padding: "token(spacing.xs)",
    },
    "@media (max-width: 480px)": {
      fontSize: "1.5rem",
      margin: "token(spacing.xs) token(spacing.0)",
    },
  }),
  appbar: css({
    padding: "token(spacing.sm) token(spacing.md)",
    width: "token(sizes.full)",
    display: "flex",
    flexDirection: "row",
    gap: "token(spacing.md)",
    borderBottom: "token(borders.light)",
    alignItems: "center",
    // Mobile responsive styles - simplere Struktur
    "@media (max-width: 768px)": {
      gap: "token(spacing.sm)",
      padding: "token(spacing.sm)",
    },
    "@media (max-width: 480px)": {
      gap: "token(spacing.xs)",
      padding: "token(spacing.xs) token(spacing.sm)",
    },
  }),
  // Navigation container wrapper for positioning scroll indicator
  navigationContainer: css({
    position: "relative",
    flex: 1,
    display: "flex",
    "@media (max-width: 768px)": {
      width: "100%",
    },
  }),
  navigationLinks: css({
    display: "flex",
    flexDirection: "row",
    gap: "token(spacing.md)",
    alignItems: "center",
    flex: 1,
    // Desktop: Last item (Connect button) should be pushed to the right
    "@media (min-width: 769px)": {
      "& > :last-child": {
        marginLeft: "auto",
      },
    },
    // Mobile responsive styles - horizontal scrolling
    "@media (max-width: 768px)": {
      overflowX: "auto",
      overflowY: "hidden",
      gap: "token(spacing.sm)",
      width: "100%",
      paddingBottom: "token(spacing.xs)", // Space for scrollbar
      scrollSnapType: "x mandatory",
      position: "relative",
      zIndex: 1, // Niedriger z-index als das Dropdown-Menü
    },
    "@media (max-width: 480px)": {
      gap: "token(spacing.sm)",
    },
  }),
  // Separate scroll indicator that stays fixed
  scrollIndicator: css({
    display: "none",
    "@media (max-width: 768px)": {
      display: "block",
      position: "absolute",
      top: 0,
      right: 0,
      width: "30px",
      height: "100%",
      background: "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.9) 70%, white 100%)",
      pointerEvents: "none",
      zIndex: 2,
      opacity: 1,
      transition: "opacity 0.3s ease",
      "&::before": {
        content: '"→"',
        position: "absolute",
        top: "50%",
        right: "6px",
        transform: "translateY(-50%)",
        fontSize: "12px",
        color: "rgba(59, 130, 246, 0.7)",
        fontWeight: "bold",
        animation: "pulse 2s ease-in-out infinite",
      },
    },
  }),
  // Hidden state for scroll indicator
  scrollIndicatorHidden: css({
    opacity: "0 !important",
  }),
  navigationLink: css({
    // Ensure links don't shrink and have proper spacing for touch
    flexShrink: 0,
    whiteSpace: "nowrap",
    "@media (max-width: 768px)": {
      scrollSnapAlign: "start",
      padding: "token(spacing.sm) token(spacing.md)",
      minWidth: "auto",
      textAlign: "center",
    },
  }),
  content: css({
    padding: "token(spacing.md)",
    paddingBottom: "token(spacing.xl)",
    minHeight: "token(sizes.screen)",
  }),
  footer: css({
    padding: "token(spacing.md)",
    textAlign: "center",
    borderTop: "1px solid token(colors.border)",
    marginTop: "token(spacing.xl)",
    color: "gray.600",
  }),
  footerAttribution: css({
    fontSize: "sm",
    color: "gray.500",
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

// TitleBar component styles - simplified to just the title
export const titleBar = {
  title: css({
    fontSize: "2xl",
    fontWeight: "bold",
    margin: 0,
    marginBottom: "token(spacing.sm)",
    color: "text",
    lineHeight: "1.2",
    // Responsive typography
    "@media (max-width: 768px)": {
      fontSize: "xl",
    },
    "@media (max-width: 480px)": {
      fontSize: "lg",
    },
    // Handle very long titles
    overflow: "hidden",
    textOverflow: "ellipsis",
    wordBreak: "break-word",
    hyphens: "auto",
  }),
};

// StarSupport component styles - compact star-based support button
export const starSupport = {
  // Reading progress bar with integrated support button
  progressContainer: css({
    position: "sticky",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid token(colors.border)",
    padding: "token(spacing.xs) token(spacing.md)",
    display: "flex",
    alignItems: "center",
    gap: "token(spacing.md)",
    zIndex: 100,
    transition: "all 0.3s ease",
    // Hide by default, show when scrolling
    transform: "translateY(-100%)",
    "&[data-visible='true']": {
      transform: "translateY(0)",
    },
    "@media (max-width: 768px)": {
      padding: "token(spacing.xs) token(spacing.sm)",
      gap: "token(spacing.sm)",
    },
  }),
  progressBar: css({
    flex: 1,
    height: "4px",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: "2px",
    overflow: "hidden",
    position: "relative",
  }),
  progressFill: css({
    height: "100%",
    backgroundColor: "brand",
    borderRadius: "2px",
    transition: "width 0.3s ease",
  }),
  supportButton: css({
    display: "flex",
    alignItems: "center",
    gap: "token(spacing.xs)",
    padding: "token(spacing.xs) token(spacing.sm)",
    backgroundColor: "transparent",
    border: "1px solid rgba(59, 130, 246, 0.3)",
    borderRadius: "token(radii.full)",
    cursor: "pointer",
    fontSize: "sm",
    fontWeight: "medium",
    color: "brand",
    transition: "all 0.2s ease",
    minHeight: "32px",
    whiteSpace: "nowrap",
    _hover: {
      backgroundColor: "rgba(59, 130, 246, 0.05)",
      borderColor: "brand",
      transform: "translateY(-1px)",
    },
    _active: {
      transform: "translateY(0)",
    },
    _disabled: {
      opacity: 0.6,
      cursor: "not-allowed",
      transform: "none",
      _hover: {
        transform: "none",
        backgroundColor: "transparent",
      },
    },
    "@media (max-width: 768px)": {
      padding: "token(spacing.xs)",
      fontSize: "xs",
      minHeight: "28px",
      gap: "2px",
    },
  }),
  supportButtonActive: css({
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "brand",
    color: "brand",
  }),
  starIcon: css({
    fontSize: "14px",
    transition: "all 0.2s ease",
    "@media (max-width: 768px)": {
      fontSize: "12px",
    },
  }),
  starIconFilled: css({
    color: "#fbbf24", // Golden yellow for filled star
  }),
  supportCount: css({
    fontSize: "sm",
    fontWeight: "medium",
    "@media (max-width: 768px)": {
      fontSize: "xs",
    },
  }),
  // Inline variant for content placement
  inlineContainer: css({
    display: "flex",
    alignItems: "center",
    gap: "token(spacing.sm)",
    padding: "token(spacing.sm) 0",
    borderTop: "1px solid rgba(59, 130, 246, 0.1)",
    borderBottom: "1px solid rgba(59, 130, 246, 0.1)",
    margin: "token(spacing.lg) 0",
    fontSize: "sm",
    color: "gray.600",
  }),
  inlineText: css({
    flex: 1,
    fontSize: "sm",
    color: "gray.600",
  }),
  inlineButton: css({
    display: "flex",
    alignItems: "center",
    gap: "token(spacing.xs)",
    padding: "token(spacing.xs) token(spacing.sm)",
    backgroundColor: "transparent",
    border: "1px solid rgba(59, 130, 246, 0.3)",
    borderRadius: "token(radii.sm)",
    cursor: "pointer",
    fontSize: "sm",
    fontWeight: "medium",
    color: "brand",
    transition: "all 0.2s ease",
    _hover: {
      backgroundColor: "rgba(59, 130, 246, 0.05)",
      borderColor: "brand",
    },
    _disabled: {
      opacity: 0.6,
      cursor: "not-allowed",
    },
  }),
  // Tooltip for errors/warnings
  tooltip: css({
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: "token(spacing.xs)",
    padding: "token(spacing.xs) token(spacing.sm)",
    backgroundColor: "background",
    border: "1px solid token(colors.border)",
    borderRadius: "token(radii.sm)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    fontSize: "xs",
    color: "text",
    whiteSpace: "nowrap",
    zIndex: 1000,
    "@media (max-width: 768px)": {
      position: "fixed",
      top: "10px",
      left: "10px",
      right: "10px",
      marginTop: 0,
      whiteSpace: "normal",
      textAlign: "center",
    },
  }),
};

// MetadataLine component styles - discrete content metadata integration
export const metadataLine = {
  container: css({
    fontSize: "sm",
    color: "gray.600",
    marginBottom: "lg",
    display: "flex",
    alignItems: "center",
    gap: "xs",
    flexWrap: "wrap",
    lineHeight: "1.4",
    // Mobile responsive
    "@media (max-width: 768px)": {
      fontSize: "xs",
      gap: "xs",
    },
  }),
  separator: css({
    margin: "0 token(spacing.xs)",
    opacity: 0.5,
    userSelect: "none",
  }),
  supportButton: css({
    background: "none",
    border: "none",
    color: "inherit",
    cursor: "pointer",
    textDecoration: "none",
    fontSize: "inherit",
    fontFamily: "inherit",
    padding: 0,
    margin: 0,
    transition: "all 0.2s ease",
    _hover: {
      color: "brand",
    },
    _disabled: {
      cursor: "default",
      opacity: 0.6,
    },
  }),
};
