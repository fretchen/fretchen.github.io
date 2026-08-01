import { css } from "../styled-system/css";

/** Blog-post article styles. Used by Post.tsx and the agent-onboarding page. */

// Post component styles
export const post = {
  // 3-column symmetric grid layout for posts with ToC sidebar
  // Empty left column balances the ToC on the right for visual symmetry
  articleLayout: css({
    display: "grid",
    // Symmetric: empty left (250px) | content (720px) | ToC right (250px)
    gridTemplateColumns: "250px minmax(0, 720px) 250px",
    gap: "8",
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

  // The article title. Deliberately NOT titleBar.title: that style is shared with /lab,
  // /imagegen and the index pages, which must stay sans — a serif <h1>Lab</h1> would
  // contradict "sans = things you operate". Same size and responsive steps as
  // titleBar.title so the two read as one system; only the family differs.
  title: css({
    fontFamily: "reading",
    fontSize: "2xl",
    fontWeight: "bold",
    margin: 0,
    marginBottom: "token(spacing.sm)",
    color: "text",
    lineHeight: "tight",
    "@media (max-width: 768px)": { fontSize: "xl" },
    "@media (max-width: 480px)": { fontSize: "lg" },
    wordBreak: "break-word",
    hyphens: "auto",
  }),

  // The reading surface, and the ONLY place the site opts into the serif. Everything
  // outside it — nav, metadata, comments, the ToC, all of /lab — stays on the sans set
  // by globalCss. Blog posts and all four quantum sections render through here.
  // Values are provisional pending a reading test on the longest quantum note; see
  // IDENTITY.md → Not decided.
  contentContainer: css({
    // Container to handle floating layout
    overflow: "hidden", // Clears the float
    lineHeight: "relaxed",
    fontFamily: "reading",
    fontSize: "lg", // 18px — prose reads larger than interface text
    maxWidth: "65ch", // inner measure, narrower than the 900px container
    hyphens: "auto", // correct only because <html lang> is now set — see pages/+config.ts
  }),
  // Lazy-loaded interactive component is still resolving.
  loadingBox: css({
    padding: "5",
    textAlign: "center",
  }),
  // Path line under the loading message — secondary to it, so muted and smaller.
  loadingPath: css({
    fontSize: "sm",
    color: "textMuted",
  }),
  // Same shape as ImageGenerator's `compactError`, so error panels read alike site-wide.
  errorBox: css({
    padding: "5",
    margin: "20px 0",
    backgroundColor: "dangerSurface",
    border: "1px solid token(colors.danger)",
    borderRadius: "sm",
    color: "token(colors.danger)",
  }),
  // Vertical rhythm for the reload button and the hints list inside `errorBox`.
  errorSpacing: css({
    marginTop: "2",
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
    fontWeight: "semibold",
    color: "brand",
  }),
};
