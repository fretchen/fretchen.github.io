import React, { useState } from "react";
import { css } from "../../styled-system/css";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button
      type="button"
      className={css({
        display: "inline-block",
        border: "1px solid black",
        rounded: "sm",
        bg: "gray.200",
        px: 1,
        py: 0.5,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: "16px",
      })}
      onClick={() => setCount((count) => count + 1)}
    >
      Counter {count}
    </button>
  );
}
