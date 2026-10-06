/**
 * Which stablecoin this site pays with, as a buyer.
 *
 * One site-wide preference, EURC by default. The sellers list what they accept — on Base EURC and
 * USDC, on Optimism USDC only (Circle has no EURC there) — and the client picks. This module is
 * that pick: `preferCurrency` is the selector every x402 client here is built with, and
 * `networksForCurrency` is why the network follows the currency (EURC means Base).
 *
 * Both tokens must also pass the spend controls first (`x402SpendControls.ts`); the selector only
 * chooses among what they let through.
 */

import { useSyncExternalStore } from "react";
import { findStablecoin, getStablecoins, type StablecoinSymbol } from "@fretchen/chain-utils";
import { createLocalStorageStore } from "../utils/localStorageStore";
import type { AcceptsEntry } from "./x402Discovery";

export type PaymentCurrency = StablecoinSymbol;

export const PAYMENT_CURRENCIES: readonly PaymentCurrency[] = ["EURC", "USDC"];

export const DEFAULT_CURRENCY: PaymentCurrency = "EURC";

const CURRENCY_KEY = "x402-currency";

const currencyStore = createLocalStorageStore(CURRENCY_KEY);

function isPaymentCurrency(value: string | null): value is PaymentCurrency {
  return value !== null && (PAYMENT_CURRENCIES as readonly string[]).includes(value);
}

/** The stored choice, or the default when there is none or it is not a currency we pay with. */
export function readCurrency(): PaymentCurrency {
  const stored = currencyStore.read();
  return isPaymentCurrency(stored) ? stored : DEFAULT_CURRENCY;
}

export const storeCurrency = (currency: PaymentCurrency): void => currencyStore.write(currency);

/**
 * The preference as React state, shared by every page and tab. The server snapshot is the default,
 * so server-rendered markup and the first client render agree.
 */
export function usePaymentCurrency(): PaymentCurrency {
  return useSyncExternalStore(currencyStore.subscribe, readCurrency, () => DEFAULT_CURRENCY);
}

/**
 * The networks, of those given, on which `currency` exists — order kept, so a caller's default
 * network stays first. EURC narrows the NFT networks to Base; USDC keeps them all.
 */
export function networksForCurrency(currency: PaymentCurrency, networks: readonly string[]): string[] {
  return networks.filter((network) => getStablecoins(network).some((coin) => coin.symbol === currency));
}

/** The currency an `accepts` entry is priced in, or null for a token this site does not pay with. */
function currencyOf(entry: { network?: string; asset?: string }): PaymentCurrency | null {
  if (!entry.network || !entry.asset) return null;
  return findStablecoin(entry.network, entry.asset)?.symbol ?? null;
}

/**
 * The `paymentRequirementsSelector` for an `x402Client`: the first entry in `currency`, otherwise
 * the seller's own first entry. The fallback is what lets a EURC preference still pay a seller
 * that only takes USDC — an Optimism-only third-party agent, say.
 *
 * `onPick` reports what was actually chosen, so a label can name the currency that was paid rather
 * than the one that was preferred.
 *
 * Structurally typed rather than importing `PaymentRequirements`: `@x402/core` is only a
 * transitive dependency here (see `x402SpendControls.ts`).
 */
export function preferCurrency(currency: PaymentCurrency, onPick?: (paid: PaymentCurrency | null) => void) {
  return <T extends { network: string; asset: string }>(_x402Version: number, accepts: T[]): T => {
    const chosen = accepts.find((entry) => currencyOf(entry) === currency) ?? accepts[0];
    onPick?.(chosen ? currencyOf(chosen) : null);
    return chosen;
  };
}

/**
 * The currency the selector would pay in on `network`, read from a probed `accepts[]` — or null
 * when the offer is unknown or holds nothing on that network. For showing a fallback before the
 * user pays; the selector itself decides at payment time.
 */
export function offeredCurrency(
  accepts: AcceptsEntry[] | null,
  network: string,
  preferred: PaymentCurrency,
): PaymentCurrency | null {
  if (!accepts) return null;
  const onNetwork = accepts.filter((entry) => entry.network === network);
  if (onNetwork.some((entry) => currencyOf(entry) === preferred)) return preferred;
  const first = onNetwork[0];
  return first ? currencyOf(first) : null;
}
