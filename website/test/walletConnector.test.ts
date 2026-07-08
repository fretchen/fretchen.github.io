import { describe, it, expect } from "vitest";
import type { Connector } from "wagmi";
import { pickWalletConnector } from "../utils/walletConnector";

// Minimal stand-ins — pickWalletConnector only reads `type`.
const wc = { type: "walletConnect" } as unknown as Connector;
const injectedMetaMask = { type: "injected" } as unknown as Connector;

describe("pickWalletConnector", () => {
  it("returns the injected connector when one is present", () => {
    expect(pickWalletConnector([wc, injectedMetaMask])).toBe(injectedMetaMask);
  });

  it("falls back to the first connector when none is injected", () => {
    expect(pickWalletConnector([wc])).toBe(wc);
  });

  it("returns undefined for an empty list", () => {
    expect(pickWalletConnector([])).toBeUndefined();
  });
});
