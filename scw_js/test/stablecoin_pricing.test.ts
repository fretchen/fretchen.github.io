import { describe, it, expect } from "vitest";
import { USDC_ADDRESSES, EURC_ADDRESSES } from "@fretchen/chain-utils";
import { offeredStablecoins, resolvePaidStablecoin } from "../stablecoin_pricing.js";

const BASE = "eip155:8453";
const BASE_SEPOLIA = "eip155:84532";
const OP = "eip155:10";

describe("stablecoin_pricing", () => {
  describe("offeredStablecoins", () => {
    it("offers EURC first on both Base networks — the order is the preference", () => {
      expect(offeredStablecoins(BASE).map((c) => c.symbol)).toEqual(["EURC", "USDC"]);
      expect(offeredStablecoins(BASE_SEPOLIA).map((c) => c.symbol)).toEqual(["EURC", "USDC"]);
    });

    it("offers USDC only on Optimism, where EURC does not exist", () => {
      expect(offeredStablecoins(OP).map((c) => c.symbol)).toEqual(["USDC"]);
    });

    it("needs no configuration to offer EURC", () => {
      // EURC is a first-class price list, not a conversion that depends on a rate being set.
      expect(offeredStablecoins(BASE).some((c) => c.symbol === "EURC")).toBe(true);
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
