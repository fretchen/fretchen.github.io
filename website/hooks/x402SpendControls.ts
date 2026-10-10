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
 * allowlists every settlement token the site pays with — USDC on every network, EURC and
 * EURe on Base — so the safety rail stays in place, just extended to cover what the SDK's
 * own registry doesn't know about. The registry knows no EURC and no EURe at all, so without
 * these entries every EURC or EURe offer would be dropped before the preference selector
 * (`x402Currency.ts`) ever saw it.
 *
 * The cap is **one whole token, in that token's own decimals**: `10^decimals` atomic.
 * USDC and EURC get 10⁶; EURe gets 10¹⁸ — a 6-decimal cap applied to EURe would veto every
 * EURe payment at 10⁻¹² tokens. The registry supplies each token's decimals, so a future
 * token with yet other decimals is capped correctly without touching this file.
 */

import { ALL_NETWORKS, getSettlementTokens } from "@fretchen/chain-utils";

/**
 * Build the `spendControls.allowedAssets` list: every settlement token on every network this site
 * pays on (`getSettlementTokens`), each capped at one whole token in its own atomic units. Pass to
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
    getSettlementTokens(network).map((token) => ({
      network,
      asset: token.address,
      // One whole token in the token's own decimals — never a fixed 6-decimal figure.
      maxAmountPerPayment: String(10n ** BigInt(token.decimals)),
    })),
  );
}
