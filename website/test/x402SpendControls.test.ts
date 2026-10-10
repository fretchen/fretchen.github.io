/**
 * x402SpendControls Tests
 *
 * Regression guard for the production incident where the `@x402/core` client's default
 * spend controls rejected Optimism USDC payments (no `findDefaultAsset` entry for
 * `eip155:10`/`eip155:11155420` in `@x402/evm`). These tests assert on the specific
 * networks that were missing, not just array length, so a future edit that silently
 * drops Optimism from the allowlist fails here instead of in production. The registry knows
 * no EURC or EURe anywhere, so both are asserted the same way — and the caps are per token:
 * a 6-decimal cap on EURe would veto every EURe payment at 10⁻¹² tokens.
 */

import { describe, it, expect } from "vitest";
import { ALL_NETWORKS, EURE_ADDRESSES, EURC_ADDRESSES, getUSDCAddress } from "@fretchen/chain-utils";
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

  it("allowlists EURe on Base and Base Sepolia, and nowhere else", () => {
    const eureEntries = buildStablecoinAllowedAssets().filter((entry) => entry.asset === EURE_ADDRESSES[entry.network]);
    expect(eureEntries.map((entry) => entry.network).sort()).toEqual(["eip155:8453", "eip155:84532"]);
  });

  it("caps each entry at one whole token in that token's own decimals", () => {
    const byAsset = new Map(buildStablecoinAllowedAssets().map((entry) => [entry.asset, entry.maxAmountPerPayment]));
    expect(byAsset.get(getUSDCAddress("eip155:8453"))).toBe("1000000"); // 1 USDC, 6 decimals
    expect(byAsset.get(EURC_ADDRESSES["eip155:8453"])).toBe("1000000"); // 1 EURC, 6 decimals
    // 1 EURe is 10¹⁸ atomic — the 6-decimal figure would cap every EURe payment at 10⁻¹² tokens.
    expect(byAsset.get(EURE_ADDRESSES["eip155:8453"])).toBe("1000000000000000000");
  });
});
