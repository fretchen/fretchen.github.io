/**
 * Which stablecoins the sellers offer, in which order, and how their prices are expressed.
 *
 * USDC and EURC are two parallel price systems. Every price is quoted explicitly in each token
 * (`PriceList`), and anything derived — the LLM's per-message cost — is computed inside that
 * token's own system from its own rate card. There is no exchange rate anywhere: a EURC price is
 * a euro price someone chose, not a converted dollar price.
 */

import { getStablecoins, type StablecoinInfo, type StablecoinSymbol } from "@fretchen/chain-utils";

/** A price in each token's atomic units (both have 6 decimals). */
export type PriceList = Record<StablecoinSymbol, string>;

/**
 * The seller's preference, most preferred first. Its only effect is the order of the 402
 * `accepts` array: a stock x402 client pays with the first entry its spend controls allow.
 * The SDK's built-in asset registry knows only USDC, so a default-configured client drops the
 * EURC entry and keeps paying USDC; a client that allowlists EURC pays EURC.
 */
export const STABLECOIN_PREFERENCE: readonly StablecoinSymbol[] = ["EURC", "USDC"];

/** The stablecoins to offer on `network`, most preferred first. */
export function offeredStablecoins(network: string): StablecoinInfo[] {
  return getStablecoins(network).sort(
    (a, b) => STABLECOIN_PREFERENCE.indexOf(a.symbol) - STABLECOIN_PREFERENCE.indexOf(b.symbol),
  );
}

/** The stablecoin a buyer paid with, if this seller offers it on `network`; null otherwise. */
export function resolvePaidStablecoin(network: string, asset: unknown): StablecoinInfo | null {
  if (typeof asset !== "string") {
    return null;
  }
  const wanted = asset.toLowerCase();
  return offeredStablecoins(network).find((coin) => coin.address.toLowerCase() === wanted) ?? null;
}
