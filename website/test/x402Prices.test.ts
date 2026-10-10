/**
 * Display-only prices and spend formatting, per currency — EURe is 18 decimals, so the atomic
 * math must follow the currency, never a fixed 6-decimal divisor.
 */
import { describe, expect, it } from "vitest";
import { IMAGE_PRICE, formatSpend } from "../utils/x402Prices";

describe("IMAGE_PRICE", () => {
  it("carries the image price in every payable currency", () => {
    expect(IMAGE_PRICE.EURe).toBe("€0.06 EURe");
    expect(IMAGE_PRICE.EURC).toBe("€0.06 EURC");
    expect(IMAGE_PRICE.USDC).toBe("$0.07 USDC");
  });
});

describe("formatSpend", () => {
  it("formats an EURe amount with its 18 decimals", () => {
    // 0.01 EURe — the search price, settled on Base mainnet in the buyer notebook.
    expect(formatSpend(10n ** 16n, "EURe")).toBe("€0.010 EURe");
    expect(formatSpend(60000000000000000n, "EURe")).toBe("€0.060 EURe");
  });

  it("keeps the 6-decimal formats for EURC and USDC", () => {
    expect(formatSpend(10_000n, "EURC")).toBe("€0.010 EURC");
    expect(formatSpend(10_000n, "USDC")).toBe("$0.010 USDC");
  });

  it("does not silently divide an 18-decimal amount by a 6-decimal divisor", () => {
    // The trap this guards: a fixed 1e6 divisor would render 0.01 EURe as €10000000.000.
    expect(formatSpend(10n ** 16n, "EURe")).not.toContain("10000000");
  });
});
