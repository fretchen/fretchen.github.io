import { css } from "../styled-system/css";

// Gemeinsame Layouts
export const layouts = {
  container: css({
    maxWidth: "900px",
    mx: "auto",
    px: "md",
  }),
  flexColumn: css({
    display: "flex",
    flexDirection: "column",
    gap: "md",
  }),
  flexCenter: css({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  }),
};

// Typografie
export const typography = {
  heading: css({
    fontSize: "2xl",
    fontWeight: "bold",
    marginBottom: "sm",
    color: "text",
  }),
  paragraph: css({
    marginBottom: "sm",
    lineHeight: "1.5",
  }),
  list: css({
    paddingLeft: "2em",
    marginBottom: "sm",
  }),
};

// UI-Elemente
export const elements = {
  card: css({
    padding: "md",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
    backgroundColor: "background",
  }),
  input: css({
    padding: "sm",
    width: "300px",
    borderRadius: "4px",
    border: "1px solid token(colors.border)",
  }),
  button: css({
    padding: "sm md",
    backgroundColor: "brand",
    color: "light",
    border: "none",
    borderRadius: "sm",
    cursor: "pointer",
    fontWeight: "bold",
    _disabled: {
      opacity: 0.7,
      cursor: "not-allowed",
    },
  }),
  link: css({
    color: "brand",
    textDecoration: "none",
    _hover: {
      textDecoration: "underline",
    },
  }),
  successMessage: css({
    padding: "sm",
    borderRadius: "sm",
    backgroundColor: "rgba(40, 167, 69, 0.1)",
    border: "1px solid #28a745",
    color: "#28a745",
    marginTop: "md",
  }),
  errorMessage: css({
    padding: "sm",
    borderRadius: "sm",
    backgroundColor: "rgba(220, 53, 69, 0.1)",
    border: "1px solid #dc3545",
    color: "#dc3545",
    marginTop: "md",
  }),
};
