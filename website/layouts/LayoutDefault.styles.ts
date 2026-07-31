import { css } from "../styled-system/css";

/** Layout chrome: app bar, nav, content well, footer. Used by LayoutDefault and Footer. */

// Layout component styles
export const layout = {
  main: css({
    display: "flex",
    flexDirection: "column",
    width: "100%", // Full width instead of constrained
    padding: "0 32px", // Generous side margins for breathing room
    backgroundColor: "gray.50", // Subtle background for content area
    "@media (max-width: 768px)": {
      padding: "0 16px", // Smaller margins on tablet
    },
    "@media (max-width: 480px)": {
      padding: "0 8px", // Minimal margins on mobile
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
      transition: "opacity {durations.normal} ease",
      "&::before": {
        content: '"→"',
        position: "absolute",
        top: "50%",
        right: "6px",
        transform: "translateY(-50%)",
        fontSize: "xs",
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
    // (a minHeight referencing a non-existent `sizes.screen` token used to sit here; it
    // never produced valid CSS, so it is dropped rather than "fixed" into new behaviour)
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
    padding: "0 16px",
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
    gap: "0.5",
    color: "gray.600",
    textDecoration: "none",
    transition: "color {durations.normal} ease",
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

/**
 * Active nav item, tinted with the hue its section owns (see utils/territory.ts).
 *
 * Set on the wrapper rather than the anchor: Panda's reset gives `a { color: inherit }`,
 * so the link picks this up, and the shared `Link` primitive stays colourless — it wraps
 * whole cards elsewhere (Card.tsx, EntryList.tsx), where a colour would tint card content.
 */
export const navActive = {
  voice: css({ color: "brand", fontWeight: "semibold" }),
  explore: css({ color: "explore", fontWeight: "semibold" }),
};
