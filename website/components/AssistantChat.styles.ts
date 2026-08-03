import { css } from "../styled-system/css";

/**
 * Styles for the x402 chat assistant (components/AssistantChat.tsx).
 *
 * Colocated here because nothing else uses them. The `mobile*` names are kept: they
 * distinguish the mobile header/actions from the desktop sidebar, which is real
 * information, not the namespace-avoidance prefixing the old shared file needed.
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
export const sidebar = css({
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
});

export const sidebarSection = css({
  display: "flex",
  flexDirection: "column",
  gap: "sm",
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
  color: "textMuted",
  padding: "2xl",
  fontSize: "sm",
});

// Message bubbles
export const messageContainer = css({
  marginY: "md",
  display: "flex",
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

export const messageBubbleUser = css({
  backgroundColor: "text",
  color: "light",
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
  lineHeight: "normal",
  outline: "none",
  backgroundColor: "background",
  _focus: {
    borderColor: "brand",
  },
  minWidth: 0, // allow flexbox shrink on small screens
});
