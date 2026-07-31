import { css } from "../styled-system/css";
import { stack } from "../styled-system/patterns";

// ===== ALLGEMEINE LAYOUTSTILE =====

// Container styles
export const container = css({
  maxWidth: "900px",
  mx: "auto", // Center the container
  px: "md",
  width: "100%", // Take full width up to maxWidth
});

export const paragraph = css({
  marginBottom: "sm",
  lineHeight: "1.5",
});

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

// Universeller Spinner
export const spinner = css({
  width: "20px",
  height: "20px",
  borderRadius: "full",
  border: "2px solid token(colors.brand)",
  borderRightColor: "transparent",
  animation: "spin 1s linear infinite",
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
    marginBottom: "md",
    color: "brand",
    lineHeight: "1.3",
    "@media (max-width: 640px)": {
      fontSize: "md",
      lineHeight: "1.2",
    },
  }),
  compactSubtitle: css({
    fontSize: "sm",
    color: "gray.600",
    marginTop: "xs",
    lineHeight: "1.4",
  }),
  compactSubtitleSimplified: css({
    fontSize: "sm",
    color: "gray.500",
    marginTop: "xs",
    marginBottom: "md",
    lineHeight: "1.3",
    fontWeight: "normal",
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
    _placeholder: {
      color: "gray.400",
      opacity: 1,
    },
    _focus: {
      borderColor: "brand",
      outline: "none",
      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
    },
    _hover: {
      borderColor: "gray.400",
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
    border: "1px solid token(colors.danger)",
    borderRadius: "sm",
    fontSize: "sm",
    color: "token(colors.danger)",
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
    gap: "1", // Konsistente interne Abstände (normal spacing)
    // Mobile: Interne Abstände für engeres Layout entfernen
    "@media (max-width: 480px)": {
      gap: "0.5",
    },
  }),
  // Compact text container for when description is present
  textCompact: css({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    gap: "0", // No gap - tight spacing when description is present
    // Mobile: Interne Abstände für engeres Layout entfernen
    "@media (max-width: 480px)": {
      gap: "0",
    },
  }),
  title: css({
    fontSize: "xl",
    fontWeight: "semibold",
    margin: 0, // Override browser default h3 margins
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
    marginTop: "xs", // Small top margin for spacing from title
    fontSize: "sm",
    color: "gray.600",
    lineHeight: "1.5",
    // Mobile: Beschreibung ausblenden oder verkürzen
    "@media (max-width: 768px)": {
      fontSize: "xs",
      lineHeight: "1.5",
      marginTop: "xs",
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
    marginBottom: "md", // Normal spacing without description (20px)
    fontSize: "sm",
    color: "gray.600",
    // Mobile: Kleiner und subtiler
    "@media (max-width: 768px)": {
      fontSize: "xs",
      marginBottom: "sm",
    },
    "@media (max-width: 480px)": {
      fontSize: "2xs", // Sehr klein auf mobile
      marginBottom: "xs",
    },
  }),
  // Date style when description is present (substantially tighter spacing)
  dateWithDescription: css({
    fontSize: "sm",
    color: "gray.600",
    // Mobile: Kleiner und subtiler
    "@media (max-width: 768px)": {
      fontSize: "xs",
    },
    "@media (max-width: 480px)": {
      fontSize: "2xs",
    },
  }),
};

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
    display: "flex",
    alignItems: "center",
    gap: "xs",
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

// Post component styles
export const post = {
  // 3-column symmetric grid layout for posts with ToC sidebar
  // Empty left column balances the ToC on the right for visual symmetry
  articleLayout: css({
    display: "grid",
    // Symmetric: empty left (250px) | content (720px) | ToC right (250px)
    gridTemplateColumns: "250px minmax(0, 720px) 250px",
    gap: "2rem",
    justifyContent: "center",

    // "Break out" of parent containers to use full viewport width
    width: "100vw",
    position: "relative",
    left: "50%",
    marginLeft: "-50vw",

    // Tablet: Center content, hide ToC, return to normal layout
    "@media (max-width: 1200px)": {
      // Reset break-out
      width: "100%",
      position: "static",
      left: "auto",
      marginLeft: "0",
      // Single centered column
      gridTemplateColumns: "1fr",
      maxWidth: "720px",
      margin: "0 auto",
    },

    // Mobile: Single column, tighter spacing
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
      gap: "0",
    },
  }),

  // Main content area (center column)
  articleContent: css({
    minWidth: 0, // Prevents grid blowout with long content
  }),

  // ToC sidebar (right column)
  articleSidebar: css({
    // Hidden on smaller screens (ToC component handles its own hiding too)
    "@media (max-width: 1200px)": {
      display: "none",
    },
  }),

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
      borderRadius: "2px",
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

// Container für Listen von Karten (nur intern von entryList genutzt)
const baseContentCardList = css({
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

// EntryList component styles
export const entryList = {
  // Verwendung der einheitlichen Basis-Styles
  container: baseContentCardList,
  entry: baseContentCard.container,
  entryContent: baseContentCard.content,
  entryText: baseContentCard.text,
  entryTextCompact: baseContentCard.textCompact,
  entryTitle: baseContentCard.title,
  entryDescription: baseContentCard.description,
  entryDate: baseContentCard.date,
  entryDateWithDescription: baseContentCard.dateWithDescription,
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
    width: "100%", // Full width instead of constrained
    padding: "0 2rem", // Generous side margins for breathing room
    backgroundColor: "gray.50", // Subtle background for content area
    "@media (max-width: 768px)": {
      padding: "0 1rem", // Smaller margins on tablet
    },
    "@media (max-width: 480px)": {
      padding: "0 0.5rem", // Minimal margins on mobile
    },
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
    width: "100%",
    padding: "token(spacing.xs) 0", // Reduced from sm to xs (10px → 5px)
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "token(borders.light)",
    backgroundColor: "white", // White background for contrast
    position: "relative",
    // Mobile responsive styles
    "@media (max-width: 768px)": {
      padding: "token(spacing.xs)", // Also reduced for mobile
      gap: "token(spacing.sm)",
    },
    "@media (max-width: 480px)": {
      gap: "token(spacing.xs)",
      padding: "token(spacing.xs) token(spacing.sm)",
    },
  }),
  // Navigation container wrapper for positioning scroll indicator
  navigationContainer: css({
    position: "relative",
    width: "100%",
    maxWidth: "1200px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 token(spacing.md)",
    "@media (max-width: 768px)": {
      padding: "0 token(spacing.sm)",
      maxWidth: "100%",
    },
    "@media (max-width: 480px)": {
      padding: "0 token(spacing.xs)",
    },
  }),
  navigationLinks: css({
    display: "flex",
    flexDirection: "row",
    gap: "token(spacing.md)",
    alignItems: "center",
    flex: 1,
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
    paddingBottom: "0", // Removed bottom padding
    minHeight: "token(sizes.screen)",
    // Removed maxWidth to avoid conflicts with page-specific containers
    // Individual pages should define their own width constraints
  }),
  footer: css({
    width: "100%",
    padding: "token(spacing.sm) 0",
    borderTop: "token(borders.light)",
    marginTop: 0,
    backgroundColor: "white",
  }),
  footerContent: css({
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 1rem",
  }),
  hcard: css({
    display: "flex",
    flexDirection: "row",
    gap: "token(spacing.md)",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    "@media (max-width: 768px)": {
      flexDirection: "column",
      gap: "token(spacing.sm)",
    },
  }),
  hcardName: css({
    fontSize: "sm",
    fontWeight: "semibold",
    color: "text",
  }),
  hcardNameLink: css({
    color: "text",
    textDecoration: "none",
    _hover: {
      textDecoration: "underline",
    },
  }),
  hcardPhoto: css({
    width: "0",
    height: "0",
    opacity: 0,
    position: "absolute",
    pointerEvents: "none",
  }),
  hcardNote: css({
    fontSize: "xs",
    color: "gray.600",
    display: "none",
    "@media (max-width: 768px)": {
      display: "block",
      textAlign: "center",
      width: "100%",
    },
  }),
  hcardLinks: css({
    display: "flex",
    gap: "token(spacing.md)",
    justifyContent: "center",
    flexWrap: "wrap",
    fontSize: "sm",
  }),
  hcardLink: css({
    display: "flex",
    alignItems: "center",
    gap: "2px",
    color: "gray.600",
    textDecoration: "none",
    transition: "color 0.2s",
    fontSize: "xs",
    _hover: {
      color: "text",
    },
  }),
  footerAttribution: css({
    fontSize: "xs",
    color: "gray.500",
    margin: 0,
    padding: 0,
    border: "none",
  }),
  headerControls: css({
    display: "flex",
    alignItems: "center",
    gap: "token(spacing.sm)",
    flexShrink: 0, // Prevent shrinking on smaller screens
    // Mobile: Stack vertically or hide some elements
    "@media (max-width: 768px)": {
      gap: "token(spacing.xs)",
    },
    "@media (max-width: 480px)": {
      gap: "token(spacing.xs)",
      // Consider hiding language toggle on very small screens if needed
    },
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

// Image-First NFT Card styles
export const nftCard = {
  container: css({
    position: "relative",
    aspectRatio: "1", // Quadratisches Format
    borderRadius: "lg",
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    transition: "all 0.3s ease",
    background: "gray.100",
    _hover: {
      transform: "scale(1.02)",
      boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
    },
    // Mobile: Slightly smaller scale effect
    "@media (max-width: 768px)": {
      _hover: {
        transform: "scale(1.01)",
      },
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
    transition: "transform 0.3s ease",
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
    fontWeight: "medium",
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
    transition: "opacity 0.3s ease",
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
    fontWeight: "500",
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
    fontWeight: "500",
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
    background: "rgba(34, 197, 94, 0.9)",
    color: "white",
    fontSize: "xs",
    fontWeight: "500",
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

  description: css({
    fontSize: "sm",
    color: "gray.600",
    marginBottom: "sm",
    lineHeight: "1.4",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxHeight: "2.8em",
    // Mobile: Smaller font and reduced max height
    "@media (max-width: 768px)": {
      fontSize: "xs",
      maxHeight: "2.1em",
      marginBottom: "xs",
    },
    "@media (max-width: 480px)": {
      maxHeight: "1.4em", // Show only 1 line on very small screens
      marginBottom: "2xs",
    },
  }),
  footer: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "xs",
    color: "gray.400",
    flexWrap: "wrap",
    gap: "xs",
    // Mobile: Stack vertically for better mobile layout
    "@media (max-width: 768px)": {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "sm",
    },
    "@media (max-width: 480px)": {
      fontSize: "2xs",
      gap: "xs",
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
  reactions: css({
    fontSize: "inherit",
    color: "inherit",
    userSelect: "none",
  }),
  supportWrapper: css({
    display: "inline-block",
  }),
  // Amount reads as secondary to the "Support" verb (lighter weight + slightly muted).
  supportAmount: css({
    fontWeight: "normal",
    opacity: 0.85,
  }),
};

// ===== COMMENTS SECTION STYLES =====

export const commentSection = {
  container: css({
    marginTop: "xl",
    paddingTop: "md",
    borderTop: "token(borders.light)",
  }),
  title: css({
    fontSize: "md",
    fontWeight: "semibold",
    color: "text",
    margin: 0,
    marginBottom: "md",
  }),
  loading: css({ color: "gray.500", fontStyle: "italic" }),
  empty: css({ color: "gray.500", fontStyle: "italic", marginBottom: "md" }),
  list: css({ listStyle: "none", padding: 0, margin: "md 0 0 0" }),
  comment: css({
    padding: "md",
    marginBottom: "sm",
    backgroundColor: "white",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
    boxShadow: "sm",
    "@media (max-width: 768px)": {
      padding: "sm",
    },
  }),
  commentHeader: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "xs",
  }),
  commentDate: css({ fontSize: "sm", color: "gray.500" }),
  commentText: css({ margin: 0, lineHeight: "1.6", color: "text" }),
  form: css({
    display: "flex",
    flexDirection: "column",
    gap: "sm",
    padding: "md",
    marginTop: "md",
    backgroundColor: "gray.50",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
    "@media (max-width: 480px)": {
      padding: "sm",
    },
  }),
  nameInput: css({
    padding: "sm",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
    fontSize: "sm",
    maxWidth: "300px",
    backgroundColor: "white",
  }),
  textInput: css({
    padding: "sm",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
    fontSize: "sm",
    resize: "vertical",
    minHeight: "80px",
    backgroundColor: "white",
  }),
  formFooter: css({
    display: "flex",
    alignItems: "center",
    gap: "sm",
  }),
  successMsg: css({ color: "green.600", fontSize: "sm" }),
  errorMsg: css({ color: "red.600", fontSize: "sm" }),
};

// ===== WEBMENTIONS STYLES =====

// Webmentions component styles - social reactions from the web
export const webmentions = {
  container: css({
    marginTop: "xl",
    paddingTop: "md",
    borderTop: "token(borders.light)",
  }),
  sectionTitle: css({
    fontSize: "md",
    fontWeight: "semibold",
    color: "text",
    margin: "0 0 sm 0",
  }),
  shareSeparator: css({
    color: "gray.400",
    fontSize: "sm",
  }),
  compactBar: css({
    display: "flex",
    alignItems: "center",
    gap: "md",
    flexWrap: "wrap",
    marginBottom: "sm",
  }),
  compactCounts: css({
    display: "flex",
    gap: "sm",
    alignItems: "center",
  }),
  compactCount: css({
    fontSize: "sm",
    color: "gray.600",
    fontWeight: "medium",
  }),
  shareActions: css({
    display: "flex",
    gap: "sm",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: "sm",
  }),
  avatarGrid: css({
    display: "flex",
    gap: "sm",
    flexWrap: "wrap",
    marginTop: "sm",
  }),
  avatarLink: css({
    display: "block",
    transition: "all 0.2s ease",
    _hover: {
      transform: "scale(1.1)",
      opacity: 0.8,
    },
  }),
  avatar: css({
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "2px solid token(colors.border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "gray.100",
    fontSize: "lg",
    "@media (max-width: 768px)": {
      width: "36px",
      height: "36px",
    },
    "@media (max-width: 480px)": {
      width: "32px",
      height: "32px",
      fontSize: "md",
    },
  }),
  replyList: css({
    listStyle: "none",
    padding: 0,
    margin: 0,
    marginTop: "sm",
  }),
  replyCard: css({
    marginTop: "md",
    padding: "md",
    backgroundColor: "white",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
    boxShadow: "sm",
    transition: "all 0.2s ease",
    _hover: {
      boxShadow: "md",
    },
    "@media (max-width: 768px)": {
      padding: "sm",
      marginTop: "sm",
    },
  }),
  replyHeader: css({
    display: "flex",
    gap: "sm",
    alignItems: "center",
    marginBottom: "sm",
  }),
  replyAvatar: css({
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "2px solid token(colors.border)",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "gray.100",
    fontSize: "lg",
    "@media (max-width: 480px)": {
      width: "32px",
      height: "32px",
      fontSize: "md",
    },
  }),
  replyAuthor: css({
    flex: 1,
  }),
  authorName: css({
    fontWeight: "medium",
    color: "brand",
    textDecoration: "none",
    transition: "all 0.2s ease",
    _hover: {
      textDecoration: "underline",
    },
  }),
  replyDate: css({
    marginLeft: "xs",
    color: "gray.600",
    fontSize: "sm",
  }),
  replyContent: css({
    marginTop: "sm",
    lineHeight: "1.6",
    color: "text",
  }),
  replyLink: css({
    display: "inline-block",
    marginTop: "sm",
    fontSize: "sm",
    color: "brand",
    textDecoration: "none",
    transition: "all 0.2s ease",
    _hover: {
      textDecoration: "underline",
    },
  }),
  cta: css({
    marginTop: "md",
    padding: "md",
    backgroundColor: "gray.50",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
    "@media (max-width: 480px)": {
      padding: "sm",
    },
  }),
  ctaText: css({
    fontSize: "md",
    color: "text",
    lineHeight: "1.6",
    margin: 0,
  }),
  ctaSubtext: css({
    fontSize: "sm",
    color: "gray.600",
    lineHeight: "1.6",
  }),
  ctaLink: css({
    color: "brand",
    textDecoration: "none",
    fontWeight: "medium",
    transition: "all 0.2s ease",
    _hover: {
      textDecoration: "underline",
    },
  }),
  loadingState: css({
    marginTop: "xl",
    paddingTop: "md",
    borderTop: "token(borders.light)",
    textAlign: "center",
    color: "gray.600",
    fontSize: "sm",
  }),
  emptyState: css({
    marginTop: "xl",
    paddingTop: "md",
    borderTop: "token(borders.light)",
    textAlign: "center",
    padding: "lg",
  }),
  emptyIcon: css({
    fontSize: "3xl",
    display: "block",
    marginBottom: "sm",
  }),
  emptyTitle: css({
    fontSize: "lg",
    fontWeight: "medium",
    color: "text",
    marginBottom: "xs",
  }),
  emptyText: css({
    fontSize: "sm",
    color: "gray.600",
  }),
};

// ===== ASSISTANT PAGE STYLES =====

// Single consolidated width definition for assistant page
export const assistantPageContainer = css({
  width: "100%", // Full width for chat interface
  // Removed maxWidth for full-screen chat experience
  px: "md",
  // On desktop, make room for a fixed sidebar at the viewport left
  "@media (min-width: 769px)": {
    paddingLeft: "240px",
  },
});

// Main grid layout
export const assistantGrid = css({
  display: "grid",
  minHeight: "calc(100vh - 120px)", // Account for header (~60px) + footer (~60px)
  gap: "md",
  padding: "md",
});

export const assistantGridDesktop = css({
  // Sidebar is fixed outside the flow; grid only needs the main content column
  gridTemplateColumns: "1fr",
});

export const assistantGridMobile = css({
  gridTemplateColumns: "1fr",
  gridTemplateRows: "auto 1fr",
});

// Sidebar styles
export const sidebar = css({
  backgroundColor: "#fbfcfe",
  borderRadius: "sm",
  padding: "md",
  display: "flex",
  flexDirection: "column",
  gap: "md",
  borderLeft: "1px solid",
  borderColor: "border",
  boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
  // On desktop, fix the sidebar to the left edge of the viewport
  position: "fixed",
  left: 0,
  top: "var(--header-height, 64px)",
  width: "240px",
  height: "calc(100vh - var(--header-height, 64px) - var(--footer-height, 60px))",
  overflow: "auto",
  zIndex: 40,
  // Keep the same visual when narrow screens use the inline sidebar
  "@media (max-width: 768px)": {
    position: "relative",
    width: "100%",
    left: "auto",
    top: "auto",
  },
});

export const sidebarSection = css({
  display: "flex",
  flexDirection: "column",
  gap: "sm",
});

export const sidebarHeading = css({
  margin: 0,
  fontSize: "sm",
  fontWeight: "600",
  color: "text",
});

export const actionsContainer = css({
  display: "flex",
  flexDirection: "column",
  gap: "xs",
});

// Chat area
export const chatArea = css({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  gap: "md",
  minHeight: 0, // Allow flex item to shrink below content size
  // Ensure chat area stretches properly inside the grid column
});

// Mobile header
export const mobileHeader = css({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "xs 0",
  borderBottom: "1px solid",
  borderColor: "border",
  marginBottom: "xs",
});

export const mobileTitle = css({
  margin: 0,
  fontSize: "lg",
});

export const mobileActions = css({
  display: "flex",
  gap: "xs",
  alignItems: "center",
});

export const messagesContainer = css({
  flex: "1 1 auto", // Allow grow, shrink, and base on content
  overflow: "auto",
  border: "1px solid",
  borderColor: "border",
  borderRadius: "xs",
  padding: "md",
  backgroundColor: "background",
  minHeight: 0, // Allow flex item to shrink below content size
});

export const emptyState = css({
  textAlign: "center",
  color: "#888",
  padding: "2xl",
  fontSize: "sm",
});

// Message bubbles
export const messageContainer = css({
  margin: "md 0",
  display: "flex",
});

export const messageContainerUser = css({
  justifyContent: "flex-end",
});

export const messageContainerAssistant = css({
  justifyContent: "flex-start",
});

export const messageBubble = css({
  padding: "sm md",
  borderRadius: "sm",
  maxWidth: "80%",
});

export const messageBubbleUser = css({
  backgroundColor: "#2d3748",
  color: "white",
});

export const messageBubbleAssistant = css({
  backgroundColor: "token(colors.surface)",
  color: "text",
  border: "1px solid #e2e8f0",
});

export const messageRole = css({
  fontWeight: "500",
  marginBottom: "xs",
  fontSize: "xs",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  opacity: 0.8,
});

export const messageContent = css({
  lineHeight: "1.5",
});

// Plain-text messages (user input) preserve literal newlines/spacing.
// Markdown-rendered messages (assistant output) skip this — Markdown's own
// block spacing would otherwise double up with pre-wrap.
export const messageContentPlain = css({
  whiteSpace: "pre-wrap",
});

// Loading message
export const loadingMessage = css({
  margin: "md 0",
  display: "flex",
  justifyContent: "flex-start",
});

export const loadingBubble = css({
  maxWidth: "80%",
  padding: "sm md",
  borderRadius: "sm",
  backgroundColor: "token(colors.surface)",
  color: "text",
  border: "1px solid #e2e8f0",
  fontStyle: "italic",
});

// Input area
export const inputArea = css({
  display: "flex",
  gap: "xs",
  padding: "md 0",
  flexShrink: 0, // Don't shrink the input area
  alignItems: "flex-end", // keep button visually aligned to input
});

export const messageInput = css({
  flex: 1,
  padding: "md",
  border: "1px solid",
  borderColor: "border",
  borderRadius: "xs",
  resize: "vertical",
  minHeight: "60px",
  maxHeight: "120px",
  fontSize: "sm",
  lineHeight: "1.5",
  outline: "none",
  backgroundColor: "background",
  _focus: {
    borderColor: "brand",
  },
  minWidth: 0, // allow flexbox shrink on small screens
});

// ─── Shared Modal shell ───────────────────────────────────────────────
// One dialog look for the whole site (NFT zoom, donation guide, …). Values match the
// original nftCard.modal* pattern (the site's only live modal) so nothing changes visually.
export const modal = {
  overlay: css({
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
  content: css({
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
  // Dark filled circle — for modals whose content sits over a full-bleed image (ImageModal).
  close: css({
    position: "absolute",
    top: "sm",
    right: "sm",
    background: "rgba(0, 0, 0, 0.5)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "md",
    lineHeight: 1,
    zIndex: 1,
    _hover: {
      background: "rgba(0, 0, 0, 0.7)",
    },
  }),
  // Light glyph — for text modals on a white card, where a dark filled circle reads louder
  // than the title. Subtle grey ✕ that darkens on hover.
  closeLight: css({
    position: "absolute",
    top: "sm",
    right: "sm",
    background: "transparent",
    color: "gray.400",
    border: "none",
    borderRadius: "sm",
    width: "28px",
    height: "28px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "md",
    lineHeight: 1,
    zIndex: 1,
    transition: "color 0.15s ease",
    _hover: {
      color: "gray.700",
    },
  }),
  // Padded body for text/content modals. Image modals put edge-to-edge content directly
  // in `content` instead and skip this — so bounding the width here keeps text dialogs at a
  // sane ~440px card without constraining the full-bleed image modal (which stays maxWidth 90vw).
  body: css({
    width: "min(440px, 90vw)",
    padding: "lg",
  }),
  title: css({
    fontSize: "lg",
    fontWeight: "bold",
    margin: "0 0 md 0",
    // leave room so the title never sits under the ✕
    paddingRight: "lg",
  }),
  // Body text inside a padded modal
  text: css({
    fontSize: "sm",
    color: "gray.700",
    lineHeight: "1.5",
    margin: "0 0 md 0",
  }),
  // Inline error message inside a modal
  error: css({
    fontSize: "sm",
    color: "#c0392b",
    lineHeight: "1.5",
    margin: "0 0 md 0",
  }),
  // Muted "why this?" motivation line
  why: css({
    fontSize: "sm",
    color: "gray.500",
    lineHeight: "1.5",
    margin: "0 0 md 0",
  }),
  // Inline brand-colored link (e.g. "Learn more: Optimism · Base")
  link: css({
    color: "brand",
    textDecoration: "none",
    fontWeight: "medium",
    _hover: { textDecoration: "underline" },
  }),
  // Wrapper that makes a single primary action span the modal width — the conventional
  // treatment for a one-action guided/onboarding step (vs. a right-aligned confirm/cancel row).
  primaryAction: css({
    display: "flex",
    marginTop: "md",
    "& > button, & > a": {
      width: "100%",
      justifyContent: "center",
    },
  }),
  // Small helper note beneath the primary action (e.g. "your wallet will ask you to confirm")
  note: css({
    fontSize: "xs",
    color: "gray.500",
    margin: "sm 0 0 0",
    textAlign: "center",
  }),
  // Full-width orange primary action for the support flow — carries the support pill's
  // warm accent (metadataLine.supportButton) into the modal so the whole flow reads as one.
  // Shares the shape/interaction of the site's primaryButton, only the color differs.
  supportPrimary: css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "xs",
    width: "100%",
    paddingY: "sm",
    paddingX: "lg",
    background: "linear-gradient(135deg, token(colors.support) 0%, token(colors.supportLight) 100%)",
    color: "token(colors.light)",
    border: "none",
    borderRadius: "md",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "sm",
    textDecoration: "none",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px rgba(255, 107, 53, 0.25)",
    _hover: {
      transform: "translateY(-1px)",
      boxShadow: "0 4px 8px rgba(255, 107, 53, 0.35)",
    },
    _active: {
      transform: "translateY(0)",
      boxShadow: "0 2px 4px rgba(255, 107, 53, 0.25)",
    },
    _disabled: {
      cursor: "default",
      opacity: 0.6,
      transform: "none",
      boxShadow: "none",
    },
  }),
  // Quiet secondary action beneath the primary (e.g. "Try again") — text-weight, neutral.
  secondaryAction: css({
    display: "block",
    width: "100%",
    marginTop: "sm",
    padding: "sm",
    background: "transparent",
    color: "gray.600",
    border: "none",
    borderRadius: "md",
    cursor: "pointer",
    fontSize: "sm",
    fontWeight: "medium",
    textAlign: "center",
    transition: "color 0.15s ease",
    _hover: { color: "text" },
  }),
};
