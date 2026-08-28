import { cva } from "../../styled-system/css";

/** Shared outer wrapper for the interactive essay widgets. */
export const widgetCard = cva({
  base: {
    margin: "32px 0",
    padding: "6",
    backgroundColor: "rgba(59, 130, 246, 0.05)",
    borderRadius: "sm",
    border: "1px solid rgba(59, 130, 246, 0.2)",
  },
});
