import { css } from "../styled-system/css";

/** Styles for components/ToolConfirmCard.tsx — its only consumer. */

export const container = css({
  border: "1px solid",
  borderColor: "border",
  borderRadius: "lg",
  padding: "5",
  marginTop: "2",
  backgroundColor: "surface",
});

export const title = css({
  fontSize: "md",
  fontWeight: "semibold",
  marginBottom: "3",
});

export const fieldLabel = css({
  fontSize: "sm",
  fontWeight: "semibold",
  display: "block",
  marginBottom: "1",
});

export const promptInput = css({
  width: "100%",
  fontFamily: "ui",
  fontSize: "sm",
  padding: "2",
  borderRadius: "md",
  border: "1px solid",
  borderColor: "border",
  marginBottom: "3",
  resize: "vertical",
  minHeight: "10",
});

export const sizeRow = css({
  display: "flex",
  gap: "2",
  marginBottom: "3",
});

export const metaRow = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  fontSize: "sm",
  color: "gray.600",
  marginBottom: "1",
});

export const mintNotice = css({
  fontSize: "xs",
  color: "gray.500",
  marginBottom: "4",
});

export const actionsRow = css({
  display: "flex",
  gap: "2",
});
