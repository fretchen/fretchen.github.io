import { describe, it, expect } from "vitest";

/**
 * wagmi's metaMask()/walletConnect() connectors (wagmi.config.ts) lazily import
 * their real wallet SDK inside connect(). Both packages are optional peer
 * dependencies of @wagmi/connectors, so if either is ever removed from
 * package.json, the connector silently throws "dependency ... not found" on
 * click with no visible error in the UI. This test fails loudly instead.
 */
describe("wagmi connector optional peer dependencies", () => {
  it("metaMask() connector's SDK package is installed and importable", async () => {
    await expect(import("@metamask/connect-evm")).resolves.toBeDefined();
  });

  it("walletConnect() connector's SDK package is installed and importable", async () => {
    await expect(import("@walletconnect/ethereum-provider")).resolves.toBeDefined();
  });
});
