import { describe, it, expect } from "vitest";
import { getFeeTokens, findFeeToken, EURE_ADDRESSES } from "../chain_utils.js";

const BASE = "eip155:8453";
const BASE_SEPOLIA = "eip155:84532";
const OP = "eip155:10";

describe("fee tokens", () => {
  it("settles USDC, EURC and EURe on both Base networks", () => {
    for (const network of [BASE, BASE_SEPOLIA]) {
      expect(getFeeTokens(network).map((t) => t.symbol)).toEqual(["USDC", "EURC", "EURe"]);
    }
  });

  it("settles USDC only on Optimism, where neither EURC nor EURe is deployed", () => {
    expect(getFeeTokens(OP).map((t) => t.symbol)).toEqual(["USDC"]);
  });

  it("marks EURe as an 18-decimal Permit2 token, and USDC/EURC as 6-decimal EIP-3009", () => {
    // Read on-chain 2026-10-04: EURe decimals() 18, EIP-2612 permit present, EIP-3009 absent.
    const byToken = Object.fromEntries(getFeeTokens(BASE).map((t) => [t.symbol, t]));
    expect(byToken.EURe).toMatchObject({
      address: "0xbf6e2966A9C3D99C9E4D069E04f7Bdb9C8aa762C",
      decimals: 18,
      transferMethod: "permit2",
    });
    expect(byToken.USDC).toMatchObject({ decimals: 6, transferMethod: "eip3009" });
    expect(byToken.EURC).toMatchObject({ decimals: 6, transferMethod: "eip3009" });
  });

  it("finds a fee token case-insensitively, and only on its own network", () => {
    expect(findFeeToken(BASE, EURE_ADDRESSES[BASE].toLowerCase())?.symbol).toBe("EURe");
    expect(findFeeToken(OP, EURE_ADDRESSES[BASE])).toBeNull();
    expect(findFeeToken(BASE, "0x0000000000000000000000000000000000000001")).toBeNull();
  });
});
