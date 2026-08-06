import { css } from "../styled-system/css";

/**
 * Blog-post article styles. Used by Post.tsx.
 *
 * The page grid (article + ToC) is NOT here — it lives in ArticleShell.styles.ts, since
 * agent-onboarding renders it too.
 */

// Post component styles
export const post = {
  // The article title. Deliberately NOT titleBar.title: that style is shared with /lab,
  // /imagegen and the index pages, which must stay sans — a serif <h1>Lab</h1> would
  // contradict "sans = things you operate".
  //
  // 2xl sits one step above the 20px prose h2 set in panda.config.ts globalCss, so the page
  // title outranks its own sections. It briefly ran at xl to stop long titles wrapping; that
  // put it *below* the h2 and made the inversion worse. Titles over ~58 characters wrap here
  // (9 of 33), which is ordinary typography — the hierarchy is not.
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
    // manual, not auto — see contentContainer below.
    hyphens: "manual",
  }),

  // The reading surface, and the ONLY place the site opts into the serif. Everything
  // outside it — nav, metadata, comments, the ToC, all of /lab — stays on the sans set
  // by globalCss. Blog posts and all four quantum sections render through here.
  // Values are provisional pending a reading test on the longest quantum note; see
  // IDENTITY.md → Not decided.
  contentContainer: css({
    // Container to handle floating layout
    overflow: "hidden", // Clears the float
    // The reading surface — family, size and leading come from the shared text style in
    // panda.config.ts, which the /x402 and /agent-onboarding guides use too.
    textStyle: "prose",
    // The measure, sized to fill ArticleShell's 720px column so the body shares its edges
    // with the title and metadata. Was 65ch (~640px), which left 80px of the column
    // unreachable — `overflow: hidden` above means nothing, not even a float, could use it.
    // Kept in `ch` rather than px so it survives a font-size change (IDENTITY.md); the
    // min() guards against the ch value computing wider than the column on a fallback face.
    maxWidth: "min(72ch, 100%)",
    // `auto` hyphenated English prose — three of six lines in a typical first paragraph,
    // which is what made the body read as compressed rather than unhurried. <html lang>
    // does not help: it follows the URL prefix (pages/+lang.ts), not the post's language,
    // so it only picks which language's rules apply, never whether to hyphenate at all.
    hyphens: "manual",
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
