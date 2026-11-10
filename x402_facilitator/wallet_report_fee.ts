/**
 * The weekly wallet report's fee/account view — the ONLY pieces of the retired facilitator
 * core this package still needs now that the HTTP facilitator lives in bunny_js
 * (bunny_js/src/facilitator/) and serves facilitator.fretchen.eu. Extracted verbatim from
 * the old x402_fee.ts at the teardown; the fee model's source of truth is
 * bunny_js/src/facilitator/x402_fee.ts — if the fee changes there, update this copy in the
 * same sitting. The stakes are low and one-sided: nothing funds-bearing runs here anymore,
 * a drift only mis-estimates the report's nominal-fee arithmetic.
 */
import type { Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { loadPrivateKey } from "@fretchen/chain-utils";
import { logger } from "./logger";

/**
 * The facilitator's flat per-settlement fee. Merchant-pays by design: the fee is pulled from
 * the settled amount right after settlement, never charged to the buyer. Every place that
 * charges, checks or reports the fee must therefore use `feeAmountFor(decimals)`, so the
 * token's decimals and the base unit are scaled in exactly one place.
 */
const DEFAULT_FEE_AMOUNT = 10000n;

/** The decimals `FACILITATOR_FEE_AMOUNT` / `DEFAULT_FEE_AMOUNT` are written in. */
const FEE_BASE_DECIMALS = 6;

export function getFeeAmount(): bigint {
  const envFee = process.env.FACILITATOR_FEE_AMOUNT;
  if (envFee) {
    try {
      const parsed = BigInt(envFee);
      if (parsed < 0n) {
        logger.warn({ envFee }, "Invalid FACILITATOR_FEE_AMOUNT (negative), using default");
        return DEFAULT_FEE_AMOUNT;
      }
      return parsed;
    } catch {
      logger.warn(
        { envFee },
        "Invalid FACILITATOR_FEE_AMOUNT (not a valid integer), using default",
      );
      return DEFAULT_FEE_AMOUNT;
    }
  }
  return DEFAULT_FEE_AMOUNT;
}

/** The nominal fee in atomic units of a token with `decimals` decimals (0.01 → 10¹⁶ for 18). */
export function feeAmountFor(decimals: number): bigint {
  const base = getFeeAmount();
  return decimals >= FEE_BASE_DECIMALS
    ? base * 10n ** BigInt(decimals - FEE_BASE_DECIMALS)
    : base / 10n ** BigInt(FEE_BASE_DECIMALS - decimals);
}

/** The facilitator's wallet address — the account the weekly report balances. Null = unset. */
export function getFacilitatorAddress(): Address | null {
  try {
    return privateKeyToAccount(loadPrivateKey("FACILITATOR_WALLET_PRIVATE_KEY")).address;
  } catch {
    return null;
  }
}
