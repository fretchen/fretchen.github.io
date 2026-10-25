/**
 * The facilitator's fee model, as /supported publishes it — and how to read the right figure
 * for a token.
 *
 * Separate module, not part of `x402_server.ts`, deliberately: `x402_server` pulls in S3
 * storage and the SDK resource-server machinery, and several tests mock it wholesale — a
 * consumer that imports the fee math from there would get the mock, not the math. This file
 * has no imports at all, so every consumer (sellers' fee-allowance script, the claim cron,
 * and their tests) runs the real thing.
 */

/** What the facilitator charges, and the address that collects it. */
export interface FacilitatorFeeConfig {
  /** Spender to approve — the facilitator wallet that runs `transferFrom`. */
  recipient: `0x${string}`;
  /** Flat fee per settlement, in 6-decimal NOMINAL units — the top-level figure /supported
   *  publishes. Valid as an atomic amount only for 6-decimal tokens (USDC, EURC); EURe's
   *  real fee is 10¹² times this, and lives in `feeByAsset`. Never divide an allowance by
   *  this number for a token with other decimals — see `facilitatorFeeFor`. */
  flatFee: bigint;
  /** Per-token fees in each token's OWN atomic units, from /supported's `facilitatorFees.assets`
   *  (key: `"<network>:<asset lowercase>"`). Empty on a facilitator build predating the
   *  per-token assets list — then only 6-decimal tokens have a knowable fee. */
  feeByAsset: Map<string, bigint>;
}

/**
 * The facilitator's fee in `token`'s own atomic units on `network`, or null when it cannot be
 * known: no per-token `assets` entry, and `token` is not a 6-decimal token for which the
 * nominal `flatFee` happens to be the atomic amount. Callers must treat null as "unknown",
 * never fall back to the nominal figure — dividing an 18-decimal EURe allowance by the
 * 6-decimal 10000 reports a 1-EURe approval as a trillion settlements, and approving
 *  100 × 10000 atomic would write an allowance of 10⁻¹² EURe over a healthy one.
 */
export function facilitatorFeeFor(
  fee: FacilitatorFeeConfig,
  network: string,
  token: string,
  decimals: number,
): bigint | null {
  const perToken = fee.feeByAsset.get(`${network}:${token.toLowerCase()}`);
  if (perToken !== undefined) {
    return perToken;
  }
  return decimals === 6 ? fee.flatFee : null;
}
