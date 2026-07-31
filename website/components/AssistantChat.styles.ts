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
