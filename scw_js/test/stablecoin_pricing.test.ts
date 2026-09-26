import { describe, it, expect, afterEach } from "vitest";
import { USDC_ADDRESSES, EURC_ADDRESSES } from "@fretchen/chain-utils";
import {
  offeredStablecoins,
  resolvePaidStablecoin,
  usdAtomicToAsset,
} from "../stablecoin_pricing.js";

const BASE = "eip155:8453";
const OP = "eip155:10";

describe("stablecoin_pricing", () => {
  afterEach(() => {
    delete process.env.EUR_PER_USD;
  });

  describe("usdAtomicToAsset", () => {
    it("prices USDC at the USD amount, rate or no rate", () => {
      expect(usdAtomicToAsset("70000", "USDC")).toBe("70000");
      process.env.EUR_PER_USD = "0.86";
      expect(usdAtomicToAsset(70000n, "USDC")).toBe("70000");
    });

    it("converts EURC exactly when the product is whole", () => {
      process.env.EUR_PER_USD = "0.86";
      expect(usdAtomicToAsset("70000", "EURC")).toBe("60200");
    });

    it("rounds EURC up, so the seller never receives less than the USD price", () => {
      process.env.EUR_PER_USD = "0.86";
      // 1001 × 0.86 = 860.86
      expect(usdAtomicToAsset("1001", "EURC")).toBe("861");
      // The smallest price still costs something.
      expect(usdAtomicToAsset("1", "EURC")).toBe("1");
      expect(usdAtomicToAsset("0", "EURC")).toBe("0");
    });

    it("reads all six rate decimals without float rounding", () => {
      process.env.EUR_PER_USD = "0.123457";
      expect(usdAtomicToAsset("1000000", "EURC")).toBe("123457");
    });

    it("refuses to price EURC without a rate", () => {
      expect(() => usdAtomicToAsset("70000", "EURC")).toThrow("EUR_PER_USD");
    });
  });

  describe("offeredStablecoins", () => {
    it("offers EURC first on Base when a rate is set — the order is the preference", () => {
      process.env.EUR_PER_USD = "0.86";
      expect(offeredStablecoins(BASE).map((c) => c.symbol)).toEqual(["EURC", "USDC"]);
    });

    it("offers USDC only on Optimism, where EURC does not exist", () => {
      process.env.EUR_PER_USD = "0.86";
      expect(offeredStablecoins(OP).map((c) => c.symbol)).toEqual(["USDC"]);
    });

    it.each([
      ["unset", undefined],
      ["empty", ""],
      ["zero", "0"],
      ["negative", "-0.86"],
      ["not a number", "abc"],
      ["too many decimals", "0.8612345"],
      ["comma decimal", "0,86"],
    ])("drops EURC when the rate is %s", (_label, rate) => {
      if (rate !== undefined) {
        process.env.EUR_PER_USD = rate;
      }
      expect(offeredStablecoins(BASE).map((c) => c.symbol)).toEqual(["USDC"]);
    });
  });

  describe("resolvePaidStablecoin", () => {
    it("resolves an offered token, case-insensitively", () => {
      process.env.EUR_PER_USD = "0.86";
      expect(resolvePaidStablecoin(BASE, EURC_ADDRESSES[BASE].toLowerCase())?.symbol).toBe("EURC");
      expect(resolvePaidStablecoin(BASE, USDC_ADDRESSES[BASE])?.symbol).toBe("USDC");
    });

    it("rejects EURC while it is not offered, so an old 402 cannot be paid at a stale price", () => {
      expect(resolvePaidStablecoin(BASE, EURC_ADDRESSES[BASE])).toBeNull();
    });

    it("rejects another network's token, an unknown token, and a missing asset", () => {
      process.env.EUR_PER_USD = "0.86";
      expect(resolvePaidStablecoin(OP, EURC_ADDRESSES[BASE])).toBeNull();
      expect(resolvePaidStablecoin(BASE, "0x0000000000000000000000000000000000000001")).toBeNull();
      expect(resolvePaidStablecoin(BASE, undefined)).toBeNull();
    });
  });
});
