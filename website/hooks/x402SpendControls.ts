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
 * allowlists USDC on every network the site actually pays on, so the safety rail stays
 * in place — just extended to cover a network the SDK's own registry doesn't know about.
 */

import { ALL_NETWORKS, getUSDCAddress } from "@fretchen/chain-utils";

// Mirrors the SDK's own default cap for a "default" (registry-recognized) asset ($1,
// USDC has 6 decimals) — this allowlist only extends recognition to networks the SDK's
// own findDefaultAsset doesn't know about (Optimism, see module doc above); it does not
// relax the cap that already applies to Base et al.
const DEFAULT_MAX_AMOUNT_PER_PAYMENT_ATOMIC = "1000000";

/**
 * Build the `spendControls.allowedAssets` list: USDC on every network this site pays on,
 * each capped at `DEFAULT_MAX_AMOUNT_PER_PAYMENT_ATOMIC`. Pass to `x402Client#setSpendControls`.
 *
 * No import of `SpendControlAsset` from `@x402/core` here — `@x402/core` is only a
 * transitive dependency of `@x402/fetch`/`@x402/evm` in package.json, not a direct one,
 * and both hooks reach `x402Client` only via a dynamic `await import("@x402/fetch")`. A
 * plain object literal is structurally assignable to `setSpendControls`'s param at each
 * call site without needing a type-only import that would make `@x402/core` a phantom
 * dependency.
 */
export function buildUsdcAllowedAssets() {
  return ALL_NETWORKS.map((network) => ({
    network,
    asset: getUSDCAddress(network),
    maxAmountPerPayment: DEFAULT_MAX_AMOUNT_PER_PAYMENT_ATOMIC,
  }));
}
