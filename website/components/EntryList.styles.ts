import { css } from "../styled-system/css";

/**
 * EntryList's styles. There is no card any more — no fill, border, radius or shadow. The
 * thumbnail marks where an entry starts and whitespace separates one from the next, which
 * is what IDENTITY.md asks for: whitespace structures, not borders or panels.
 */

export const entryList = {
  container: css({
    display: "flex",
    flexDirection: "column",
    // 3rem. This replaces the card border, so it has to be clearly larger than the spacing
    // inside an entry (0.25–0.5rem) or entries merge into one block.
    gap: "12",
    "@media (max-width: 768px)": { gap: "10" },
  }),

  // The whole entry is one link, so the click target survives the card's removal — and so
  // that exactly one visible anchor exists per entry, which several tests index positionally.
  link: css({
    display: "block",
    textDecoration: "none",
    color: "inherit",
    // The entire hover affordance now that the fill, shadow and translate are gone. The only
    // h3 inside the link is the p-name title.
    "&:hover h3": {
      textDecoration: "underline",
      textUnderlineOffset: "3px",
      textDecorationThickness: "1px",
    },
  }),

  row: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: "6", // 1.5rem, thumbnail → text
    // The measure bounds the whole row, thumbnail included — that is what makes an entry end
    // on the same right edge as a card, which has no thumbnail. Bounding the text column
    // instead pushed every entry 104px past the cards. Shared with card.item and the intro
    // paragraph in components/PageHeader.
    maxWidth: "measure",
  }),

  // Held at 80px whether or not an image renders: EntryNftImage returns null when there is
  // no artwork, and without this box the text column would jump left on those entries.
  // Keeping the column aligned matters more for scanning than filling the hole, so there is
  // deliberately no placeholder graphic.
  thumb: css({
    width: "20",
    height: "20",
    flexShrink: 0,
  }),

  // No maxWidth: the row above carries the measure, so this simply fills what the thumbnail
  // leaves. Bounding here too would re-create the offset the row bound exists to remove.
  text: css({
    flex: 1,
    minWidth: 0, // stops a long unbroken title from blowing the row out
  }),

  // Metadata stays sans: IDENTITY.md keeps the metadata column in the UI face.
  date: css({
    fontFamily: "ui",
    fontSize: "sm",
    color: "textMuted",
    marginBottom: "1", // 0.25rem
  }),

  title: css({
    fontFamily: "reading",
    fontSize: "xl",
    fontWeight: "semibold",
    lineHeight: "tight",
    color: "text",
    margin: 0, // preflight does not reset h3 margins
    "@media (max-width: 480px)": { fontSize: "lg" },
  }),

  description: css({
    fontFamily: "reading",
    fontSize: "md",
    lineHeight: "relaxed",
    color: "textMuted",
    marginTop: "2", // 0.5rem
    // Descriptions run 113–272 characters, so the full sentence is 5–7 lines on a phone.
    // Three lines, never `display: none` — the summary is what tells someone whether to open
    // the post, and hiding it gives mobile visitors the least useful version of the page.
    // Panda's lineClamp utility expands to the -webkit-box trio, not the `line-clamp`
    // property, so this is the widely-supported form.
    "@media (max-width: 768px)": {
      lineClamp: "3",
      fontSize: "sm",
    },
  }),

  viewAllContainer: css({
    marginTop: "8",
    fontSize: "sm",
    // No textAlign: right — there is no card edge left for it to hang from.
  }),
};
