import { css } from "../styled-system/css";

/**
 * Shared style primitives ONLY.
 *
 * Everything here has three or more consumers. Add to this file on a style's THIRD
 * consumer — not its second, and never in anticipation. Component styles live next to
 * their component (`components/Webmentions.styles.ts`) or inline in the page that owns
 * them; a feature cluster owns its own module (`components/nft/styles.ts`).
 *
 * Values come from tokens, never from literals:
 *   colours / spacing / type  ->  panda.config.ts
 *   buttons                   ->  the `button` recipe, never a fresh css({})
 *
 * Panda compiles css({}) statically, so several ways of writing a style silently emit
 * no CSS at all. See the styling rules in CLAUDE.md; test/styleConventions.test.ts
 * enforces them.
 */

// ===== ALLGEMEINE LAYOUTSTILE =====

// Container styles
export const container = css({
  maxWidth: "900px",
  mx: "auto", // Center the container
  px: "md",
  width: "100%", // Take full width up to maxWidth
});

/**
 * The lead paragraph under a section title, on every index page.
 *
 * Bounded to the same measure as the article body (components/Post.styles.ts) so a page's
 * intro and the list below it share one right edge — previously these ran to the full 900px
 * while everything else was measured. Serif because it is a description: prose you read,
 * not a control you operate.
 */
export const pageIntro = css({
  fontFamily: "reading",
  maxWidth: "measure", // shared with card.item and entryList.row — one right edge per page
  marginBottom: "lg",
  lineHeight: "relaxed",
});

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

// ===== IMAGE GENERATOR VEREINFACHT =====

// ===== VEREINFACHTE NFT STILE =====

// Page-specific styles for blog entries
export const pageContainer = css({
  maxWidth: "900px",
  mx: "auto",
  px: "md",
});

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
    paddingY: "sm",
    paddingX: "lg",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    fontSize: "sm",
    fontWeight: "semibold",
    color: "gray.600",
    transition: "all {durations.normal} ease",
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

// TitleBar component styles - simplified to just the title
export const titleBar = {
  title: css({
    fontSize: "2xl",
    fontWeight: "bold",
    margin: 0,
    marginBottom: "token(spacing.sm)",
    color: "text",
    lineHeight: "tight",
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
    // manual, matching the article title — see components/Post.styles.ts. wordBreak above
    // already handles the overflow case this was guarding.
    hyphens: "manual",
  }),
};

// ===== COMMENTS SECTION STYLES =====

// ===== WEBMENTIONS STYLES =====

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
    boxShadow: "2xl",
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
    borderRadius: "full",
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
    transition: "color {durations.normal} ease",
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
    margin: 0,
    marginBottom: "md",
    // leave room so the title never sits under the ✕
    paddingRight: "lg",
  }),
  // Body text inside a padded modal
  text: css({
    fontSize: "sm",
    color: "gray.700",
    lineHeight: "normal",
    margin: 0,
    marginBottom: "md",
  }),
  // Inline error message inside a modal
  error: css({
    fontSize: "sm",
    color: "danger",
    lineHeight: "normal",
    margin: 0,
    marginBottom: "md",
  }),
  // Muted "why this?" motivation line
  why: css({
    fontSize: "sm",
    color: "gray.500",
    lineHeight: "normal",
    margin: 0,
    marginBottom: "md",
  }),
  // Inline brand-colored link (e.g. "Learn more: Optimism · Base")
  link: css({
    color: "brand",
    textDecoration: "none",
    fontWeight: "semibold",
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
    marginTop: "sm",
    textAlign: "center",
  }),
  // ─── Image-modal content parts ───────────────────────────────────────
  // Used with <Modal padded={false}>: the image is full-bleed and these supply
  // the caption block beneath it (see components/ImageModal.tsx).
  image: css({
    width: "100%",
    height: "auto",
    maxHeight: "60vh",
    objectFit: "contain",
  }),
  imageInfo: css({
    padding: "md",
    borderTop: "1px solid rgba(229, 231, 235, 1)",
  }),
  imageTitle: css({
    fontSize: "lg",
    fontWeight: "bold",
    marginBottom: "xs",
  }),
  imageDescription: css({
    fontSize: "sm",
    color: "gray.600",
    lineHeight: "normal",
  }),
};
