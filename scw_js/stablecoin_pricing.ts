/**
 * Which stablecoins the sellers offer, in which order, and at what price.
 *
 * Prices are defined in USD (6-decimal atomic units, the same scale as USDC). A EURC price is
 * derived from it with one static rate, `EUR_PER_USD`, set by hand in serverless.yml — there
 * is no oracle (x402-eurc-plan.md). The rate also works as the EURC kill switch: unset or
 * invalid, and no seller offers or accepts EURC, while USDC is unaffected.
 */

import { getStablecoins, type StablecoinInfo, type StablecoinSymbol } from "@fretchen/chain-utils";
import { logger } from "./logger.js";

/**
 * The seller's preference, most preferred first. Its only effect is the order of the 402
 * `accepts` array: a stock x402 client pays with the first entry its spend controls allow.
 * The SDK's built-in asset registry knows only USDC, so a default-configured client drops the
 * EURC entry and keeps paying USDC; a client that allowlists EURC pays EURC.
 */
export const STABLECOIN_PREFERENCE: readonly StablecoinSymbol[] = ["EURC", "USDC"];

const RATE_DECIMALS = 6;
const RATE_SCALE = 10n ** BigInt(RATE_DECIMALS);

let warnedRate: string | undefined;

/**
 * `EUR_PER_USD` as a fixed-point integer scaled by 10^6, or null when EURC must not be offered.
 * Parsed from the decimal string directly: going through a float would round the rate.
 */
function eurPerUsdScaled(): bigint | null {
  const raw = process.env.EUR_PER_USD?.trim();
  const match = raw?.match(/^(\d+)(?:\.(\d{1,6}))?$/);
  const scaled = match
    ? BigInt(match[1]) * RATE_SCALE + BigInt((match[2] ?? "").padEnd(6, "0"))
    : 0n;
  if (scaled > 0n) {
    return scaled;
  }
  if (warnedRate !== raw) {
    warnedRate = raw;
    logger.warn(
      { EUR_PER_USD: raw ?? null },
      "EUR_PER_USD unset or invalid (expected a positive decimal with at most 6 places) — EURC is not offered",
    );
  }
  return null;
}

/**
 * Convert a USD price in atomic units to `symbol`'s atomic units. EURC rounds UP, so the seller
 * never receives less than the USD price; both tokens have 6 decimals, so only the rate applies.
 * @throws if asked for EURC while EUR_PER_USD is not configured — callers only ask for a coin
 * that `offeredStablecoins` or `resolvePaidStablecoin` returned.
 */
export function usdAtomicToAsset(usdAtomic: string | bigint, symbol: StablecoinSymbol): string {
  const usd = BigInt(usdAtomic);
  if (symbol === "USDC") {
    return usd.toString();
  }
  const rate = eurPerUsdScaled();
  if (rate === null) {
    throw new Error("EURC price requested but EUR_PER_USD is not configured");
  }
  return ((usd * rate + RATE_SCALE - 1n) / RATE_SCALE).toString();
}

/** The stablecoins to offer on `network`, most preferred first. EURC only when priced. */
export function offeredStablecoins(network: string): StablecoinInfo[] {
  const priced = eurPerUsdScaled() !== null;
  return getStablecoins(network)
    .filter((coin) => coin.symbol !== "EURC" || priced)
    .sort(
      (a, b) => STABLECOIN_PREFERENCE.indexOf(a.symbol) - STABLECOIN_PREFERENCE.indexOf(b.symbol),
    );
}

/**
 * The stablecoin a buyer paid with, if this seller currently offers it on `network`. Null for
 * any other token — including EURC while the kill switch is off, so a payment signed against
 * an old 402 cannot be accepted at a price that no longer exists.
 */
export function resolvePaidStablecoin(network: string, asset: unknown): StablecoinInfo | null {
  if (typeof asset !== "string") {
    return null;
  }
  const wanted = asset.toLowerCase();
  return offeredStablecoins(network).find((coin) => coin.address.toLowerCase() === wanted) ?? null;
}
