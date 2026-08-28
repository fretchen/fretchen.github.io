import { cva } from "../../styled-system/css";

/**
 * Shared "how did this outcome go" status styling for the prisoner's-dilemma widgets.
 * Reuses the site's reserved success/warning/danger status colors (panda.config.ts) instead
 * of inventing a new palette — see IDENTITY.md and the "no second spelling" rule there.
 */
export type SeverityLevel = "success" | "warning" | "danger";

export const severityBox = cva({
  base: { textAlign: "center", padding: "3", borderRadius: "md", backgroundColor: "white" },
  variants: {
    level: {
      success: { border: "2px solid {colors.success}" },
      warning: { border: "2px solid {colors.warning}" },
      danger: { border: "2px solid {colors.danger}" },
    },
  },
});

export const severityText = cva({
  variants: {
    level: {
      success: { color: "success" },
      warning: { color: "warning" },
      danger: { color: "danger" },
    },
  },
});
