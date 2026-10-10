import React from "react";
import { css } from "../styled-system/css";
import { button } from "../styled-system/recipes";
import { useLocale } from "../hooks/useLocale";
import { PAYMENT_CURRENCIES, storeCurrency, usePaymentCurrency } from "../hooks/x402Currency";

/**
 * The site-wide currency choice (see `hooks/x402Currency.ts`). Reads and writes the shared
 * preference itself, so every page that shows it stays in step without passing state around.
 *
 * Equal-width segments that wrap as a set: a grid with `auto-fit` tracks floored at each
 * button's `min-content` puts as many equal segments on a line as fit, and a wrapped one
 * keeps the same width as its row-mates. In the chat's fixed sidebar (~199px of content
 * width) that is two per line with the third matching below; in wider containers (the
 * imagegen card) all three share one line. Flex could not express this — flex items refuse
 * to shrink below their content, and a lone wrapped item with `flex: 1` grows to the whole
 * line, which is why the third button once rendered full-width on its own line.
 */
export function CurrencyToggle() {
  const currency = usePaymentCurrency();
  const payWithLabel = useLocale({ label: "payment.payWith" });

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "sm" })}>
      <span className={css({ fontSize: "sm", color: "textMuted" })}>{payWithLabel}</span>
      <div
        role="group"
        aria-label={payWithLabel}
        className={css({
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min-content, 1fr))",
          gap: "2",
        })}
      >
        {PAYMENT_CURRENCIES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => storeCurrency(option)}
            aria-pressed={currency === option}
            className={button({ visual: "secondary", size: "sm", active: currency === option })}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CurrencyToggle;
