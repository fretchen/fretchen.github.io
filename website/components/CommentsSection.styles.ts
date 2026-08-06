import { css } from "../styled-system/css";

/** Styles for components/CommentsSection.tsx — its only consumer. */

export const commentSection = {
  container: css({
    marginTop: "xl",
    paddingTop: "md",
    borderTop: "token(borders.light)",
  }),
  title: css({
    fontSize: "md",
    fontWeight: "semibold",
    color: "text",
    margin: 0,
    marginBottom: "md",
  }),
  loading: css({ color: "gray.500", fontStyle: "italic" }),
  empty: css({ color: "gray.500", fontStyle: "italic", marginBottom: "md" }),
  list: css({ listStyle: "none", padding: 0, marginTop: "md" }),
  // No fill and no shadow: on the white page ground the fill did nothing and the shadow was
  // all that remained, leaving a card on a site that no longer has any. The border stays —
  // comments are other people's words, and the edge marks where each one begins.
  comment: css({
    padding: "md",
    marginBottom: "sm",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
    "@media (max-width: 768px)": {
      padding: "sm",
    },
  }),
  commentHeader: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "xs",
  }),
  commentDate: css({ fontSize: "sm", color: "gray.500" }),
  commentText: css({ margin: 0, lineHeight: "relaxed", color: "text" }),
  form: css({
    display: "flex",
    flexDirection: "column",
    gap: "sm",
    padding: "md",
    marginTop: "md",
    // No fill: gray.50 was invisible against the old grey page, but on white it reads as a
    // tinted panel — the thing IDENTITY.md rules out. The border is enough to group the form.
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
    "@media (max-width: 480px)": {
      padding: "sm",
    },
  }),
  nameInput: css({
    padding: "sm",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
    fontSize: "sm",
    maxWidth: "300px",
    backgroundColor: "white",
  }),
  textInput: css({
    padding: "sm",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
    fontSize: "sm",
    resize: "vertical",
    minHeight: "80px",
    backgroundColor: "white",
  }),
  formFooter: css({
    display: "flex",
    alignItems: "center",
    gap: "sm",
  }),
  successMsg: css({ color: "green.600", fontSize: "sm" }),
  errorMsg: css({ color: "red.600", fontSize: "sm" }),
};
