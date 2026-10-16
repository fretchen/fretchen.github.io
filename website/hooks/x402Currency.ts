/**
 * Which settlement token this site pays with, as a buyer.
 *
 * The site-wide preference, EURe by default. EURe is the default because the sellers prefer it
 * (the deployed `STABLECOIN_PREFERENCE` lists EURe first, so the 402 offers it first); the
 * toggle keeps EURC and USDC one click away. A stored choice always wins over the default, so
 * flipping the default only ever affects a visitor with no stored preference — existing users
 * keep paying what they chose. The sellers list what they accept — on Base all three tokens, on
 * Optimism USDC only — and the client picks. This module is that pick: `preferCurrency` is the
 * selector every x402 client here is built with, and `networksForCurrency` is why the network
 * follows the currency (a euro token means Base).
 *
 * Both chosen and paid tokens must also pass the spend controls first (`x402SpendControls.ts`);
 * the selector only chooses among what they let through. EURe is 18 decimals
 * (`CURRENCY_DECIMALS`) — the display and spend-cap math must never assume 6.
 */

import { useSyncExternalStore } from "react";
import { findSettlementToken, getSettlementTokens, type SettlementTokenSymbol } from "@fretchen/chain-utils";
import { createLocalStorageStore } from "../utils/localStorageStore";
import type { AcceptsEntry } from "./x402Discovery";

export type PaymentCurrency = SettlementTokenSymbol;

export const PAYMENT_CURRENCIES: readonly PaymentCurrency[] = ["EURe", "EURC", "USDC"];

export const DEFAULT_CURRENCY: PaymentCurrency = "EURe";

/**
 * Decimals per currency, derived from the shared registry (a symbol's decimals never vary by
 * network; Base is the one network carrying all three). EURe is 18 — the 6-decimal assumption
 * that holds for USDC and EURC silently breaks EURe by 10¹².
 */
export const CURRENCY_DECIMALS: Record<PaymentCurrency, number> = Object.fromEntries(
  getSettlementTokens("eip155:8453").map((token) => [token.symbol, token.decimals]),
) as Record<PaymentCurrency, number>;

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
 * network stays first. A euro token narrows the NFT networks to Base; USDC keeps them all.
 */
export function networksForCurrency(currency: PaymentCurrency, networks: readonly string[]): string[] {
  return networks.filter((network) => getSettlementTokens(network).some((token) => token.symbol === currency));
}

/** The currency an `accepts` entry is priced in, or null for a token this site does not pay with. */
function currencyOf(entry: { network?: string; asset?: string }): PaymentCurrency | null {
  if (!entry.network || !entry.asset) return null;
  return findSettlementToken(entry.network, entry.asset)?.symbol ?? null;
}

/**
 * The `paymentRequirementsSelector` for an `x402Client`: the first entry in `currency`, otherwise
 * the seller's own first entry. The fallback is what lets an EURe preference still pay a seller
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

/**
 * The settlement currencies the agent offers on `network`, in `PAYMENT_CURRENCIES` order —
 * the candidate list for `selectFundedCurrency`. A fallback is only ever chosen from what
 * the seller actually takes, so a funded token it does not offer is never picked. Empty for
 * an unreadable offer (`accepts === null`): with no candidates the fallback cannot fire,
 * and the send proceeds exactly as before.
 */
export function offeredCurrencies(accepts: AcceptsEntry[] | null, network: string): PaymentCurrency[] {
  if (!accepts) return [];
  const onNetwork = accepts.filter((entry) => entry.network === network);
  return PAYMENT_CURRENCIES.filter((currency) => onNetwork.some((entry) => currencyOf(entry) === currency));
}

/**
 * The guarded-B currency fallback: pay in a token the wallet can actually fund, when the
 * token the send would pay in cannot cover its deposit floor.
 *
 * Pure on purpose — the caller gathers the facts, this only decides:
 * - `paid` is what the send would pay in after seller-side negotiation (`offeredCurrency`),
 *   not the raw user preference.
 * - `candidates` are the tokens the seller offers on the pay network, in
 *   `PAYMENT_CURRENCIES` order (euro-first), so among two funded alternatives EURC beats USDC.
 * - `fundable` answers "can the wallet balance cover this token's deposit floor".
 *
 * The rules, each of which is a guard agreed in the plan: the paid currency always wins when
 * it can fund the deposit; a fallback is only ever chosen from what the seller actually offers
 * (a fundable preference the seller does not take is unusable by construction); and when
 * nothing is fundable the paid currency stands unchanged — the send then fails with a message
 * that is honest exactly because this fallback ran first ("recharge" is only correct advice
 * when no held token could fund it). A fallback never persists: the stored preference is the
 * user's alone, and the deposit signature remains the consent gate for the new token.
 */
export function selectFundedCurrency(
  paid: PaymentCurrency,
  candidates: readonly PaymentCurrency[],
  fundable: (currency: PaymentCurrency) => boolean,
): { currency: PaymentCurrency; fellBack: boolean } {
  if (candidates.includes(paid) && fundable(paid)) {
    return { currency: paid, fellBack: false };
  }
  const funded = candidates.find((candidate) => fundable(candidate));
  return funded ? { currency: funded, fellBack: true } : { currency: paid, fellBack: false };
}
