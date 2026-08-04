import { css } from "../styled-system/css";

/**
 * Styles for Card and its CardList container.
 *
 * Both live here because CardList is a two-line component that exists only to hold Cards —
 * a second styles file for one rule would be drift.
 *
 * There is no card here any more: no fill, border, radius or shadow. Those existed to make
 * a white box visible on a grey page, and the page is white now. Space does the separating.
 */

export const cardList = {
  list: css({
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    // 2.5rem. This gap IS what the card fill used to draw, so it must stay clearly larger
    // than the space inside an entry or the entries merge.
    // On the list, not the item: item-owned marginY is how spacing drifted under
    // baseContentCard, where each card set its own marginY: "3".
    gap: "10",
    marginTop: "lg",
    marginBottom: "lg",
    "@media (max-width: 768px)": {
      gap: "8",
    },
  }),
};

export const card = {
  item: css({
    maxWidth: "min(72ch, 100%)", // same measure as the article body — see Post.styles.ts
  }),

  link: css({
    display: "block",
    textDecoration: "none",
    color: "inherit",
    // The whole hover affordance, now that the fill, shadow and translate are gone.
    // Element selector rather than a class: Panda extracts css() statically, so a composed
    // class name cannot be interpolated into a selector (styleConventions rule 2).
    "&:hover > span:first-child": {
      textDecoration: "underline",
      textUnderlineOffset: "3px",
      textDecorationThickness: "1px",
    },
  }),

  title: css({
    display: "block",
    fontFamily: "reading",
    fontSize: "xl",
    fontWeight: "semibold",
    lineHeight: "tight",
    color: "text",
    "@media (max-width: 480px)": { fontSize: "lg" },
  }),

  description: css({
    display: "block",
    fontFamily: "reading",
    fontSize: "md",
    lineHeight: "relaxed",
    color: "textMuted",
    marginTop: "2",
  }),
};
