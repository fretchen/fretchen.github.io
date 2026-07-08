import { describe, it, expect } from "vitest";

/**
 * wagmi's walletConnect() connector (wagmi.config.ts) lazily imports its real wallet
 * SDK inside connect(). The package is an optional peer dependency of
 * @wagmi/connectors, so if it's ever removed from package.json, the connector
 * silently throws "dependency ... not found" on click with no visible error in the
 * UI. This test fails loudly instead.
 *
 * (The dedicated metaMask() SDK connector was removed — browser wallets now come from
 * EIP-6963 auto-discovery — so @metamask/connect-evm is intentionally not a dependency
 * and is not checked here.)
 */
describe("wagmi connector optional peer dependencies", () => {
  it("walletConnect() connector's SDK package is installed and importable", async () => {
    await expect(import("@walletconnect/ethereum-provider")).resolves.toBeDefined();
  });
});
