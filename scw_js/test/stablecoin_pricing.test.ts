import { describe, it, expect } from "vitest";
import { USDC_ADDRESSES, EURC_ADDRESSES } from "@fretchen/chain-utils";
import { offeredStablecoins, resolvePaidStablecoin } from "../stablecoin_pricing.js";

const BASE = "eip155:8453";
const BASE_SEPOLIA = "eip155:84532";
const OP = "eip155:10";

describe("stablecoin_pricing", () => {
  describe("offeredStablecoins", () => {
    it("offers EURe, then EURC, then USDC on both Base networks — the order is the preference", () => {
      expect(offeredStablecoins(BASE).map((c) => c.symbol)).toEqual(["EURe", "EURC", "USDC"]);
      expect(offeredStablecoins(BASE_SEPOLIA).map((c) => c.symbol)).toEqual([
        "EURe",
        "EURC",
        "USDC",
      ]);
    });

    it("offers USDC only on Optimism, where EURC and EURe do not exist", () => {
      expect(offeredStablecoins(OP).map((c) => c.symbol)).toEqual(["USDC"]);
    });

    it("needs no configuration to offer EURC or EURe", () => {
      // EURC and EURe are first-class price lists, not conversions that depend on a rate being set.
      expect(offeredStablecoins(BASE).some((c) => c.symbol === "EURC")).toBe(true);
      expect(offeredStablecoins(BASE).some((c) => c.symbol === "EURe")).toBe(true);
    });

    it("carries each token's decimals — EURe is 18, not 6", () => {
      const bySymbol = Object.fromEntries(offeredStablecoins(BASE).map((c) => [c.symbol, c]));
      expect(bySymbol.EURe.decimals).toBe(18);
      expect(bySymbol.EURC.decimals).toBe(6);
      expect(bySymbol.USDC.decimals).toBe(6);
    });
  });

  describe("resolvePaidStablecoin", () => {
    it("resolves an offered token, case-insensitively", () => {
      expect(resolvePaidStablecoin(BASE, EURC_ADDRESSES[BASE].toLowerCase())?.symbol).toBe("EURC");
      expect(resolvePaidStablecoin(BASE, USDC_ADDRESSES[BASE])?.symbol).toBe("USDC");
    });

    it("rejects another network's token, an unknown token, and a missing asset", () => {
      expect(resolvePaidStablecoin(OP, EURC_ADDRESSES[BASE])).toBeNull();
      expect(resolvePaidStablecoin(BASE, "0x0000000000000000000000000000000000000001")).toBeNull();
      expect(resolvePaidStablecoin(BASE, undefined)).toBeNull();
    });
  });
});
