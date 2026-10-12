import { describe, it, expect } from "vitest";
import type { Connector } from "wagmi";
import { pickWalletConnector } from "../utils/walletConnector";

// Minimal stand-ins — pickWalletConnector only reads `type`.
const wc = { type: "walletConnect" } as unknown as Connector;
const injectedMetaMask = { type: "injected" } as unknown as Connector;

const settled = { discoverySettled: true };
const unsettled = { discoverySettled: false };

describe("pickWalletConnector", () => {
  it("returns the injected connector when one is present, regardless of discovery state", () => {
    expect(pickWalletConnector([wc, injectedMetaMask], settled)).toBe(injectedMetaMask);
    expect(pickWalletConnector([wc, injectedMetaMask], unsettled)).toBe(injectedMetaMask);
  });

  it("falls back to the first connector once discovery has settled", () => {
    expect(pickWalletConnector([wc], settled)).toBe(wc);
  });

  it("returns undefined before discovery has settled and none is injected", () => {
    // The race fix: on the first render after SSR the connector list is
    // [walletConnect] alone because ssr: true defers EIP-6963 discovery to a
    // mount effect — WalletConnect must not be picked in that window.
    expect(pickWalletConnector([wc], unsettled)).toBeUndefined();
  });

  it("returns undefined for an empty list", () => {
    expect(pickWalletConnector([], settled)).toBeUndefined();
    expect(pickWalletConnector([], unsettled)).toBeUndefined();
  });
});
