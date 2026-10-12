/**
 * Which settlement tokens the sellers offer, in which order, and how their prices are expressed.
 *
 * USDC, EURC and EURe are three parallel price systems. Every price is quoted explicitly in each
 * token (`PriceList`), and anything derived — the LLM's per-message cost — is computed inside that
 * token's own system from its own rate card. There is no exchange rate anywhere: a EURC or EURe
 * price is a euro price someone chose, not a converted dollar price. EURe has 18 decimals
 * (USDC and EURC have 6), so a PriceList's atomic values differ per token — never assume 6.
 */

import {
  getSettlementTokens,
  type SettlementTokenInfo,
  type SettlementTokenSymbol,
} from "@fretchen/chain-utils";

/** A price in each token's atomic units — 6 decimals for USDC/EURC, 18 for EURe. */
export type PriceList = Record<SettlementTokenSymbol, string>;

/**
 * The seller's preference, most preferred first. Its only effect is the order of the 402
 * `accepts` array: a stock x402 client pays with the first entry its spend controls allow.
 * The SDK's built-in asset registry knows only USDC, so a default-configured client drops the
 * EURe and EURC entries and keeps paying USDC; a client that allowlists EURe (or EURC) pays it.
 */
export const STABLECOIN_PREFERENCE: readonly SettlementTokenSymbol[] = ["EURe", "EURC", "USDC"];

/** The settlement tokens to offer on `network`, most preferred first. */
export function offeredStablecoins(network: string): SettlementTokenInfo[] {
  return getSettlementTokens(network).sort(
    (a, b) => STABLECOIN_PREFERENCE.indexOf(a.symbol) - STABLECOIN_PREFERENCE.indexOf(b.symbol),
  );
}

/**
 * Decimals per settlement token, derived from the shared registry (USDC/EURC 6, EURe 18) — a
 * symbol's decimals never vary by network, so this is a lookup table built from the registry,
 * not a second source of truth. Base carries all three tokens, so it is the one network the
 * table is read from. Pricing code that only holds a symbol uses it to rescale.
 */
export const TOKEN_DECIMALS = Object.fromEntries(
  offeredStablecoins("eip155:8453").map((token) => [token.symbol, token.decimals]),
) as Record<SettlementTokenSymbol, number>;

/** The token a buyer paid with, if this seller offers it on `network`; null otherwise. */
export function resolvePaidStablecoin(network: string, asset: unknown): SettlementTokenInfo | null {
  if (typeof asset !== "string") {
    return null;
  }
  const wanted = asset.toLowerCase();
  return offeredStablecoins(network).find((coin) => coin.address.toLowerCase() === wanted) ?? null;
}
