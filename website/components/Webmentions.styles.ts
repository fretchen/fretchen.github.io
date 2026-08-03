import { css } from "../styled-system/css";

/** Styles for components/Webmentions.tsx — its only consumer. */

// Webmentions component styles - social reactions from the web
export const webmentions = {
  container: css({
    marginTop: "xl",
    paddingTop: "md",
    borderTop: "token(borders.light)",
  }),
  sectionTitle: css({
    fontSize: "md",
    fontWeight: "semibold",
    color: "text",
    margin: 0,
    marginBottom: "sm",
  }),
  shareSeparator: css({
    color: "gray.400",
    fontSize: "sm",
  }),
  compactBar: css({
    display: "flex",
    alignItems: "center",
    gap: "md",
    flexWrap: "wrap",
    marginBottom: "sm",
  }),
  compactCounts: css({
    display: "flex",
    gap: "sm",
    alignItems: "center",
  }),
  compactCount: css({
    fontSize: "sm",
    color: "gray.600",
    fontWeight: "semibold",
  }),
  shareActions: css({
    display: "flex",
    gap: "sm",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: "sm",
  }),
  avatarGrid: css({
    display: "flex",
    gap: "sm",
    flexWrap: "wrap",
    marginTop: "sm",
  }),
  avatarLink: css({
    display: "block",
    transition: "all {durations.normal} ease",
    _hover: {
      transform: "scale(1.1)",
      opacity: 0.8,
    },
  }),
  avatar: css({
    width: "40px",
    height: "40px",
    borderRadius: "full",
    border: "2px solid token(colors.border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "gray.100",
    fontSize: "lg",
    "@media (max-width: 768px)": {
      width: "36px",
      height: "36px",
    },
    "@media (max-width: 480px)": {
      width: "32px",
      height: "32px",
      fontSize: "md",
    },
  }),
  replyList: css({
    listStyle: "none",
    padding: 0,
    margin: 0,
    marginTop: "sm",
  }),
  replyCard: css({
    marginTop: "md",
    padding: "md",
    backgroundColor: "white",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
    boxShadow: "sm",
    transition: "all {durations.normal} ease",
    _hover: {
      boxShadow: "md",
    },
    "@media (max-width: 768px)": {
      padding: "sm",
      marginTop: "sm",
    },
  }),
  replyHeader: css({
    display: "flex",
    gap: "sm",
    alignItems: "center",
    marginBottom: "sm",
  }),
  replyAvatar: css({
    width: "40px",
    height: "40px",
    borderRadius: "full",
    border: "2px solid token(colors.border)",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "gray.100",
    fontSize: "lg",
    "@media (max-width: 480px)": {
      width: "32px",
      height: "32px",
      fontSize: "md",
    },
  }),
  replyAuthor: css({
    flex: 1,
  }),
  authorName: css({
    fontWeight: "semibold",
    color: "brand",
    textDecoration: "none",
    transition: "all {durations.normal} ease",
    _hover: {
      textDecoration: "underline",
    },
  }),
  replyDate: css({
    marginLeft: "xs",
    color: "gray.600",
    fontSize: "sm",
  }),
  replyContent: css({
    marginTop: "sm",
    lineHeight: "relaxed",
    color: "text",
  }),
  replyLink: css({
    display: "inline-block",
    marginTop: "sm",
    fontSize: "sm",
    color: "brand",
    textDecoration: "none",
    transition: "all {durations.normal} ease",
    _hover: {
      textDecoration: "underline",
    },
  }),
  loadingState: css({
    marginTop: "xl",
    paddingTop: "md",
    borderTop: "token(borders.light)",
    textAlign: "center",
    color: "gray.600",
    fontSize: "sm",
  }),
};
