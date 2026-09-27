import React from "react";
import { css } from "../styled-system/css";
import { button } from "../styled-system/recipes";
import { useLocale } from "../hooks/useLocale";
import { PAYMENT_CURRENCIES, storeCurrency, usePaymentCurrency } from "../hooks/x402Currency";

/**
 * The site-wide EURC/USDC choice (see `hooks/x402Currency.ts`). Reads and writes the shared
 * preference itself, so every page that shows it stays in step without passing state around.
 */
export function CurrencyToggle() {
  const currency = usePaymentCurrency();
  const payWithLabel = useLocale({ label: "payment.payWith" });

  return (
    <div role="group" aria-label={payWithLabel} className={css({ display: "flex", alignItems: "center", gap: "2" })}>
      <span className={css({ fontSize: "sm", color: "textMuted" })}>{payWithLabel}</span>
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
  );
}

export default CurrencyToggle;
