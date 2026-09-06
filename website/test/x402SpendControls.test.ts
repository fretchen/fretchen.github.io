/**
 * x402SpendControls Tests
 *
 * Regression guard for the production incident where the `@x402/core` client's default
 * spend controls rejected Optimism USDC payments (no `findDefaultAsset` entry for
 * `eip155:10`/`eip155:11155420` in `@x402/evm`). These tests assert on the specific
 * networks that were missing, not just array length, so a future edit that silently
 * drops Optimism from the allowlist fails here instead of in production.
 */

import { describe, it, expect } from "vitest";
import { ALL_NETWORKS, getUSDCAddress } from "@fretchen/chain-utils";
import { buildUsdcAllowedAssets } from "../hooks/x402SpendControls";

describe("buildUsdcAllowedAssets", () => {
  it("returns one entry per network this site pays on", () => {
    const result = buildUsdcAllowedAssets();
    expect(result).toHaveLength(ALL_NETWORKS.length);
    expect(result.map((entry) => entry.network).sort()).toEqual([...ALL_NETWORKS].sort());
  });

  it("includes Optimism mainnet and Sepolia — missing from @x402/evm's default-asset registry", () => {
    const networks = buildUsdcAllowedAssets().map((entry) => entry.network);
    expect(networks).toContain("eip155:10");
    expect(networks).toContain("eip155:11155420");
  });

  it("uses the real USDC address for every network", () => {
    for (const entry of buildUsdcAllowedAssets()) {
      expect(entry.asset).toBe(getUSDCAddress(entry.network));
    }
  });

  it("caps every entry at the same atomic amount, mirroring the SDK's own default cap", () => {
    const caps = new Set(buildUsdcAllowedAssets().map((entry) => entry.maxAmountPerPayment));
    expect(caps.size).toBe(1);
    expect([...caps][0]).toBe("1000000"); // 1 USDC, 6 decimals
  });
});
