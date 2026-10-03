import type { PaymentCurrency } from "../hooks/x402Currency";

/**
 * What an image costs, per currency, for display only — what is actually charged is whatever the
 * seller's 402 asks for, and the spend controls cap it.
 *
 * A mirror of `scw_js/serverless.yml` (`USDC_PAYMENT_AMOUNT` / `EURC_PAYMENT_AMOUNT`): two
 * separate prices, not one converted into the other. Change both places together.
 */
export const IMAGE_PRICE: Record<PaymentCurrency, string> = {
  EURC: "€0.06 EURC",
  USDC: "$0.07 USDC",
};

/** An amount actually spent, in the channel token's atomic units (6 decimals for both), in the
 *  same "€0.06 EURC" shape as `IMAGE_PRICE`. Three decimals: a search is a cent, a page a tenth. */
export function formatSpend(atomic: bigint, currency: PaymentCurrency): string {
  const amount = (Number(atomic) / 1_000_000).toFixed(3);
  return currency === "EURC" ? `€${amount} EURC` : `$${amount} USDC`;
}
