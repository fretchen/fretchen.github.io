import { css, cva } from "../styled-system/css";

/**
 * Styles for the x402 chat assistant (components/AssistantChat.tsx).
 *
 * Colocated here because nothing else uses them. The `mobile*` names are kept: they
 * distinguish the mobile header/actions from the desktop sidebar, which is real
 * information, not the namespace-avoidance prefixing the old shared file needed.
 */

/**
 * Teen mode's styling is expressed as `cva` variants rather than a second `css({})` object per
 * element.
 *
 * An earlier pass wrote each teen surface as a full hand-copy of its base — `sidebarTeen`
 * restated all 26 of `sidebar`'s properties to change a border — which nothing in the suite
 * would have kept in step: `test/styleConventions.test.ts` rule 6 guards *recipe* variants, and
 * two unrelated `css({})` calls are not that. A variant makes the pair structurally one thing.
 *
 * `cva` and not a recipe in `panda.config.ts`: these styles belong to one component, and the
 * config is for what the whole site shares (`button`, `sectionRule`) — see README, "Where styles
 * live". `cva` is the atomic form, so Panda reads the variants off the definition here and needs
 * no `staticCss` entry, and its runtime merges base with variant into one style object before
 * emitting classes, so there is no cascade race between the two.
 */

// Single consolidated width definition for assistant page
export const pageContainer = css({
  width: "100%", // Full width for chat interface
  // Removed maxWidth for full-screen chat experience
  px: "md",
  // On desktop, make room for a fixed sidebar at the viewport left
  "@media (min-width: 769px)": {
    paddingLeft: "240px",
  },
});

// Main grid layout
export const grid = css({
  display: "grid",
  minHeight: "calc(100vh - 120px)", // Account for header (~60px) + footer (~60px)
  gap: "md",
  padding: "md",
});

export const gridDesktop = css({
  // Sidebar is fixed outside the flow; grid only needs the main content column
  gridTemplateColumns: "1fr",
});

export const gridMobile = css({
  gridTemplateColumns: "1fr",
  gridTemplateRows: "auto 1fr",
});

// Sidebar styles
/** In teen mode the panel's existing left edge carries the hue: the controls are yours. */
export const sidebar = cva({
  base: {
    backgroundColor: "surface",
    borderRadius: "sm",
    padding: "md",
    display: "flex",
    flexDirection: "column",
    gap: "md",
    borderLeft: "1px solid",
    borderColor: "border",
    boxShadow: "sm",
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
  },
  variants: {
    teen: {
      true: { borderLeft: "3px solid", borderColor: "teen" },
    },
  },
});

export const sidebarSection = css({
  display: "flex",
  flexDirection: "column",
  gap: "sm",
});

/**
 * The advanced disclosure: payment network, agent provenance, bring-your-own-agent.
 *
 * A native <details> rather than a component — no state to persist, keyboard and screen-reader
 * behaviour for free, and nothing to mismatch between the server render and the first client
 * one. It is closed for everyone, owner included: one click is cheaper than a stored preference.
 */
export const advancedSummary = css({
  margin: 0,
  fontSize: "sm",
  fontWeight: "semibold",
  color: "text",
  cursor: "pointer",
});

export const advancedBody = css({
  display: "flex",
  flexDirection: "column",
  gap: "md",
  marginTop: "sm",
});

export const sidebarHeading = css({
  margin: 0,
  fontSize: "sm",
  fontWeight: "semibold",
  color: "text",
});

export const actionsContainer = css({
  display: "flex",
  flexDirection: "column",
  gap: "xs",
});

// Network picker (Optimism / Base) — a row of two small toggle buttons plus a caption.
export const networkOptions = css({
  display: "flex",
  flexDirection: "row",
  gap: "xs",
});

/**
 * Wrapper for the ChainBadge inside an unselected picker button. The badge carries the
 * chain's own brand colour (the same pill NFT cards wear in /imagegen), so selection is
 * expressed by the button's neutral `active` state rather than by a coloured fill that
 * would fight it. Unselected simply recedes.
 */
export const networkOptionMuted = css({
  opacity: 0.55,
});

export const networkNote = css({
  margin: 0,
  fontSize: "xs",
  opacity: 0.8,
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

// Page heading row: the title + territory rule, with the mobile clear-chat button beside it.
export const titleRow = css({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "sm",
  flexShrink: 0,
});

export const mobileActions = css({
  display: "flex",
  gap: "xs",
  alignItems: "center",
});

/** In teen mode the conversation's frame takes the hue — one border, and the whole area reads
 *  as changed. */
export const messagesContainer = cva({
  base: {
    flex: "1 1 auto", // Allow grow, shrink, and base on content
    overflow: "auto",
    border: "1px solid",
    borderColor: "border",
    borderRadius: "xs",
    padding: "md",
    backgroundColor: "background",
    minHeight: 0, // Allow flex item to shrink below content size
  },
  variants: {
    teen: {
      true: { borderColor: "teen" },
    },
  },
});

export const emptyState = css({
  textAlign: "center",
  color: "textMuted",
  padding: "2xl",
  fontSize: "sm",
});

/** Spacing for the teen-mode offer under the empty-state line. */
export const emptyStateOffer = css({
  marginTop: "md",
});

/** Message bubbles. Teen mode's share of the change here is air: more room between turns. */
export const messageContainer = cva({
  base: {
    marginY: "md",
    display: "flex",
  },
  variants: {
    teen: {
      true: { marginY: "lg" },
    },
  },
});

export const messageContainerUser = css({
  justifyContent: "flex-end",
});

export const messageContainerAssistant = css({
  justifyContent: "flex-start",
});

export const messageBubble = css({
  paddingY: "sm",
  paddingX: "md",
  borderRadius: "sm",
  maxWidth: "80%",
});

/**
 * Teen mode's biggest visual move: your own messages are filled in the mode's hue instead of
 * near-black.
 *
 * The rule the whole treatment follows is that magenta marks what is *yours* — your messages,
 * your controls, your frame — while the assistant's replies stay on the neutral ground they are
 * read from. So the page carries more of the hue the longer you talk, rather than announcing
 * itself once and then sitting there. `messageBubbleAssistant` is deliberately untouched: it is
 * the one surface here you read rather than operate, and a tint under serif prose is both harder
 * to read and the "reads as dirty" failure IDENTITY.md names.
 */
export const messageBubbleUser = cva({
  base: {
    backgroundColor: "text",
    color: "light",
  },
  variants: {
    teen: {
      true: { backgroundColor: "teen" },
    },
  },
});

export const messageBubbleAssistant = css({
  backgroundColor: "surface",
  color: "text",
  border: "1px solid",
  borderColor: "border",
});

// Speaker label. Deliberately plain: alignment and fill already say who is talking, so the
// label is a quiet fallback for when they don't (screen readers, a narrow column). The
// uppercasing and letter-spacing this used to carry were decoration — see IDENTITY.md,
// "clean, not decorated". The locale strings are already sentence case.
export const messageRole = css({
  fontWeight: "semibold",
  marginBottom: "xs",
  fontSize: "xs",
  opacity: 0.8,
});

export const messageContent = css({
  lineHeight: "normal",
});

/**
 * The assistant's replies are prose you read, so they take the serif — IDENTITY.md's
 * "serif reads, sans operates". Everything else here is a tool you operate (your own
 * messages, the sidebar, labels, the composer) and stays in the sans default.
 *
 * Size is deliberately left at the inherited UI value rather than the README's prose `lg`:
 * that figure is set for a full-width article measure, and a bubble is capped at 80% of an
 * already narrow column.
 */
export const messageContentReading = css({
  fontFamily: "reading",
  lineHeight: "relaxed",
});

// Teen mode deliberately does NOT enlarge this. A size bump with no other change reads as an
// accessibility setting rather than a different place — it was tried, and "zoomed in for old
// people" is what it looked like. The hue does that work now; the extra air between turns
// (messageContainerTeen) is kept, because air is not zoom.

/**
 * Attribution under an answer that a Bundestakt lookup fed. CC BY 4.0 requires naming and
 * linking the source, so this is a licence obligation rather than decoration — it stays with
 * the published answer instead of disappearing with the loading indicator.
 */
export const messageSource = css({
  marginTop: "xs",
  fontSize: "xs",
  color: "textMuted",
  "& a": {
    color: "textMuted",
    textDecoration: "underline",
  },
});

// Plain-text messages (user input) preserve literal newlines/spacing.
// Markdown-rendered messages (assistant output) skip this — Markdown's own
// block spacing would otherwise double up with pre-wrap.
export const messageContentPlain = css({
  whiteSpace: "pre-wrap",
});

// Loading message
export const loadingMessage = css({
  marginY: "md",
  display: "flex",
  justifyContent: "flex-start",
});

export const loadingBubble = css({
  maxWidth: "80%",
  paddingY: "sm",
  paddingX: "md",
  borderRadius: "sm",
  backgroundColor: "surface",
  color: "text",
  border: "1px solid",
  borderColor: "border",
  fontStyle: "italic",
});

// Input area
export const inputArea = css({
  display: "flex",
  gap: "xs",
  paddingY: "md",
  flexShrink: 0, // Don't shrink the input area
  alignItems: "flex-end", // keep button visually aligned to input
});

/** In teen mode the composer's focus ring is the mode's hue, because typing is yours. */
export const messageInput = cva({
  base: {
    flex: 1,
    padding: "md",
    border: "1px solid",
    borderColor: "border",
    borderRadius: "xs",
    resize: "vertical",
    minHeight: "60px",
    maxHeight: "120px",
    fontSize: "sm",
    lineHeight: "normal",
    outline: "none",
    backgroundColor: "background",
    _focus: {
      borderColor: "brand",
    },
    minWidth: 0, // allow flexbox shrink on small screens
  },
  variants: {
    teen: {
      true: { _focus: { borderColor: "teen" } },
    },
  },
});
