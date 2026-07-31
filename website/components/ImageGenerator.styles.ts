import { css } from "../styled-system/css";

/** Styles for components/ImageGenerator.tsx — its only consumer. */

export const imageGen = {
  // Kompaktes Layout
  compactLayout: css({
    background: "background",
    borderRadius: "md",
    border: "1px solid token(colors.border)",
    padding: "lg",
    marginBottom: "xl",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    transition: "all 0.2s ease",
    _hover: {
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
    },
  }),
  compactContainer: css({
    display: "flex",
    flexDirection: "column",
    gap: "md",
  }),
  compactHeader: css({
    marginBottom: "sm",
    textAlign: "center",
  }),
  compactTitle: css({
    fontSize: "lg",
    fontWeight: "bold",
    margin: 0,
    marginBottom: "md",
    color: "brand",
    lineHeight: "1.3",
    "@media (max-width: 640px)": {
      fontSize: "md",
      lineHeight: "1.2",
    },
  }),
  compactForm: css({
    display: "flex",
    flexDirection: "column",
    gap: "md",
  }),
  // Diskrete Kontrollleiste
  controlBar: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "md",
    "@media (max-width: 640px)": {
      flexDirection: "column",
      alignItems: "stretch",
      gap: "sm",
    },
  }),
  optionsGroup: css({
    display: "flex",
    alignItems: "center",
    gap: "md",
    "@media (max-width: 640px)": {
      width: "100%",
      justifyContent: "space-between",
    },
  }),
  compactSelect: css({
    padding: "sm md",
    border: "1px solid token(colors.border)",
    borderRadius: "md",
    fontSize: "sm",
    backgroundColor: "white",
    minWidth: "110px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    _focus: {
      borderColor: "brand",
      outline: "none",
      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
    },
    _hover: {
      borderColor: "gray.400",
    },
  }),
  compactTextarea: css({
    flex: 1,
    padding: "sm md",
    border: "1px solid token(colors.border)",
    borderRadius: "md",
    fontSize: "sm",
    minHeight: "60px",
    resize: "vertical",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
    _placeholder: {
      color: "gray.400",
      opacity: 1,
    },
    _focus: {
      borderColor: "brand",
      outline: "none",
      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
    },
    _hover: {
      borderColor: "gray.400",
    },
  }),
  compactStatus: css({
    display: "flex",
    alignItems: "center",
    gap: "sm",
    padding: "sm",
    background: "rgba(59, 130, 246, 0.1)",
    border: "1px solid rgba(59, 130, 246, 0.2)",
    borderRadius: "sm",
    fontSize: "sm",
  }),
  compactError: css({
    padding: "sm",
    backgroundColor: "rgba(220, 53, 69, 0.1)",
    border: "1px solid token(colors.danger)",
    borderRadius: "sm",
    fontSize: "sm",
    color: "token(colors.danger)",
  }),

};
export const successMessage = css({
  padding: "md",
  backgroundColor: "rgba(40, 167, 69, 0.1)",
  border: "1px solid #28a745",
  borderRadius: "sm",
  marginTop: "sm",
});
