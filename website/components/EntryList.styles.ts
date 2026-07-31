import { css } from "../styled-system/css";

/** EntryList's own styles. The card itself comes from the shared `baseContentCard`. */

// EntryList component styles
// Container für Listen von Karten (nur intern von entryList genutzt)
const baseContentCardList = css({
  display: "flex",
  flexDirection: "column",
  gap: "4",
  "@media (max-width: 768px)": {
    gap: "2", // Engere Abstände auf mobile
  },
  "@media (max-width: 480px)": {
    gap: "1.5", // Noch enger auf kleinen mobilen Geräten
  },
});

export const entryList = {
  container: baseContentCardList,

  // EntryList's own styles — everything else comes from baseContentCard directly.
  textContent: css({
    flex: 1,
    display: "flex",
    flexDirection: "column",
  }),
  viewAllContainer: css({
    textAlign: "right",
    marginTop: "2",
    "@media (max-width: 480px)": {
      textAlign: "center",
      marginTop: "3",
    },
  }),
};
