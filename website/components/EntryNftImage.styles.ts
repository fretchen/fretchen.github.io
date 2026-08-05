import { css } from "../styled-system/css";

/** Styles for components/EntryNftImage.tsx — its only consumer. */

export const entryNftImage = {
  // 80px at every width, matching the slot EntryList holds for it, so the entry text column
  // never shifts between entries that have artwork and entries that don't.
  image: css({
    width: "20",
    height: "20",
    objectFit: "cover",
    display: "block",
    flexShrink: 0,
    // No border, no fill. The old 1px gray.300 outline and gray.100 backing existed to give
    // the image an edge against the white card; on the page ground it has its own.
    borderRadius: "xs", // 2px — knocks the corner off without reading as a chip
  }),

  // Only the loading state is filled: a grey box is what a placeholder should look like.
  placeholder: css({
    width: "20",
    height: "20",
    borderRadius: "xs",
    backgroundColor: "gray.100",
  }),
};
