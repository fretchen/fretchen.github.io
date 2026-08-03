import { css } from "../styled-system/css";

/** Styles for components/ArticleShell.tsx — the reading-page grid. */

export const articleShell = {
  // Article + ToC, centred together as one object. Two columns, two rows:
  //
  //   ┌ header  ┐
  //   ├ content ┤ ToC
  //
  // There is deliberately no empty left column. The previous 250px spacer made the *content
  // column* viewport-centred, which left the visible object — prose plus ToC — sitting well
  // right of centre (~360px of nothing on the left against ~78px on the right at 1440px).
  // The only spacer width that centres prose+ToC is zero.
  //
  // The header having its own row is what aligns the ToC's first line with the first line of
  // body text: row 2's top edge is the body's top edge by construction. A fixed top margin
  // on the sidebar cannot do this — the offset depends on the title, which wraps to one, two
  // or three lines depending on the post.
  layout: css({
    display: "grid",
    gridTemplateColumns: "minmax(0, 720px) 250px",
    // Split from `gap`, which would also apply between the header row and the body row.
    // (`gap: "0 32px"` is not an option — styleConventions rule 3 rejects the shorthand.)
    columnGap: "8",
    rowGap: "0",
    justifyContent: "center",

    // Break out of pageContainer, whose content box is 860px, to fit the 1002px grid.
    // Percentage-based rather than the old `width: 100vw; left: 50%; margin-left: -50vw`:
    // 100vw counts the scrollbar gutter, so on a scrollbar-reserving platform that overflowed
    // by ~7.5px and put a spurious horizontal scrollbar on every post. 80px stays inside the
    // symmetric ancestor padding, and since every ancestor is symmetric, justifyContent still
    // centres on the viewport.
    width: "calc(100% + 160px)",
    marginLeft: "-80px",
    marginRight: "-80px",

    // Tablet and below: single centred column, no ToC, no break-out.
    "@media (max-width: 1200px)": {
      width: "100%",
      marginLeft: "auto",
      marginRight: "auto",
      gridTemplateColumns: "1fr",
      maxWidth: "720px",
    },
  }),

  // Title and metadata — row 1. Optional; a page may pass no header at all.
  header: css({
    gridColumn: "1",
    gridRow: "1",
    minWidth: 0,
  }),

  // The body — row 2, same column as the header so the two share their edges.
  content: css({
    gridColumn: "1",
    gridRow: "2",
    minWidth: 0, // Prevents grid blowout with long content
  }),

  // ToC sidebar — row 2, so it starts level with the first line of body text.
  // Default align-self: stretch makes it span the whole body row, which is the travel its
  // `position: sticky` needs.
  sidebar: css({
    gridColumn: "2",
    gridRow: "2",
    // Hidden on smaller screens (ToC component handles its own hiding too)
    "@media (max-width: 1200px)": {
      display: "none",
    },
  }),
};
