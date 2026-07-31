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
    boxShadow: "sm",
    transition: "all {durations.normal} ease",
    _hover: {
      boxShadow: "md",
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
    lineHeight: "tight",
    "@media (max-width: 640px)": {
      fontSize: "md",
      lineHeight: "tight",
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
    transition: "all {durations.normal} ease",
    _focus: {
      borderColor: "brand",
      // A real outline, not a box-shadow ring: box-shadow is dropped entirely in
      // forced-colours mode, which would leave these fields with no focus indicator.
      outline: "2px solid",
      outlineColor: "brand",
      outlineOffset: "1px",
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
    transition: "all {durations.normal} ease",
    fontFamily: "inherit",
    _placeholder: {
      color: "gray.400",
      opacity: 1,
    },
    _focus: {
      borderColor: "brand",
      // A real outline, not a box-shadow ring: box-shadow is dropped entirely in
      // forced-colours mode, which would leave these fields with no focus indicator.
      outline: "2px solid",
      outlineColor: "brand",
      outlineOffset: "1px",
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
    backgroundColor: "dangerSurface",
    border: "1px solid token(colors.danger)",
    borderRadius: "sm",
    fontSize: "sm",
    color: "token(colors.danger)",
  }),
};
/** The one success block: mint confirmation and payment receipt together. */
export const successMessage = css({
  padding: "md",
  backgroundColor: "successSurface",
  border: "1px solid",
  borderColor: "successBorder",
  color: "green.800",
  borderRadius: "sm",
  marginTop: "sm",
});
