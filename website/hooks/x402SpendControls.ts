/**
 * x402 Buyer Spend-Control Allowlist
 *
 * The `@x402/core` client SDK now defaults every unconfigured `x402Client` to a
 * spend-control allowlist: only assets the registered scheme's `findDefaultAsset`
 * recognizes are payable, capped at $1. `@x402/evm`'s `findDefaultAsset` registry has
 * entries for Base, Polygon, Arbitrum and others, but **no entry for `eip155:10` or
 * `eip155:11155420`** (Optimism mainnet/Sepolia) — a pre-existing SDK gap already
 * documented server-side in `scw_js/x402_server.ts`'s comments about `DEFAULT_STABLECOINS`.
 * Left unconfigured, every payment on Optimism is rejected client-side before a wallet
 * signature is ever requested — see the "Failed to create payment payload... rejected by
 * spendControls" production incident this fixes.
 *
 * Rather than disabling spend controls (`spendControls: false`), this explicitly
 * allowlists every stablecoin the site pays with — USDC on every network, EURC on Base — so
 * the safety rail stays in place, just extended to cover what the SDK's own registry doesn't
 * know about. The registry knows no EURC at all, so without this entry every EURC offer would
 * be dropped before the preference selector (`x402Currency.ts`) ever saw it.
 */

import { ALL_NETWORKS, getStablecoins } from "@fretchen/chain-utils";

// Mirrors the SDK's own default cap for a "default" (registry-recognized) asset ($1; USDC
// and EURC both have 6 decimals, so this is 1 token of either) — this allowlist only extends
// recognition to what the SDK's own findDefaultAsset doesn't know about (Optimism, EURC; see
// module doc above); it does not relax the cap that already applies to Base USDC.
const DEFAULT_MAX_AMOUNT_PER_PAYMENT_ATOMIC = "1000000";

/**
 * Build the `spendControls.allowedAssets` list: every stablecoin on every network this site pays
 * on (`getStablecoins`), each capped at `DEFAULT_MAX_AMOUNT_PER_PAYMENT_ATOMIC`. Pass to
 * `x402Client#setSpendControls`. Which of them is actually paid is the selector's decision.
 *
 * No import of `SpendControlAsset` from `@x402/core` here — `@x402/core` is only a
 * transitive dependency of `@x402/fetch`/`@x402/evm` in package.json, not a direct one,
 * and both hooks reach `x402Client` only via a dynamic `await import("@x402/fetch")`. A
 * plain object literal is structurally assignable to `setSpendControls`'s param at each
 * call site without needing a type-only import that would make `@x402/core` a phantom
 * dependency.
 */
export function buildStablecoinAllowedAssets() {
  return ALL_NETWORKS.flatMap((network) =>
    getStablecoins(network).map((coin) => ({
      network,
      asset: coin.address,
      maxAmountPerPayment: DEFAULT_MAX_AMOUNT_PER_PAYMENT_ATOMIC,
    })),
  );
}
