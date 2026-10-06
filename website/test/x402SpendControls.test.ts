/**
 * x402SpendControls Tests
 *
 * Regression guard for the production incident where the `@x402/core` client's default
 * spend controls rejected Optimism USDC payments (no `findDefaultAsset` entry for
 * `eip155:10`/`eip155:11155420` in `@x402/evm`). These tests assert on the specific
 * networks that were missing, not just array length, so a future edit that silently
 * drops Optimism from the allowlist fails here instead of in production. The registry knows
 * no EURC anywhere, so EURC is asserted the same way.
 */

import { describe, it, expect } from "vitest";
import { ALL_NETWORKS, EURC_ADDRESSES, getUSDCAddress } from "@fretchen/chain-utils";
import { buildStablecoinAllowedAssets } from "../hooks/x402SpendControls";

describe("buildStablecoinAllowedAssets", () => {
  it("allowlists USDC on every network this site pays on", () => {
    const result = buildStablecoinAllowedAssets();
    for (const network of ALL_NETWORKS) {
      expect(result).toContainEqual(expect.objectContaining({ network, asset: getUSDCAddress(network) }));
    }
  });

  it("includes Optimism mainnet and Sepolia — missing from @x402/evm's default-asset registry", () => {
    const networks = buildStablecoinAllowedAssets().map((entry) => entry.network);
    expect(networks).toContain("eip155:10");
    expect(networks).toContain("eip155:11155420");
  });

  it("allowlists EURC on Base and Base Sepolia, and nowhere else", () => {
    const eurcEntries = buildStablecoinAllowedAssets().filter((entry) => entry.asset === EURC_ADDRESSES[entry.network]);
    expect(eurcEntries.map((entry) => entry.network).sort()).toEqual(["eip155:8453", "eip155:84532"]);
  });

  it("caps every entry at the same atomic amount, mirroring the SDK's own default cap", () => {
    const caps = new Set(buildStablecoinAllowedAssets().map((entry) => entry.maxAmountPerPayment));
    expect(caps.size).toBe(1);
    expect([...caps][0]).toBe("1000000"); // 1 token, 6 decimals
  });
});
