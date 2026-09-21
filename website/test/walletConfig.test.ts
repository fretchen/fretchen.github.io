import { describe, it, expect, vi } from "vitest";
import { injected, metaMask, walletConnect } from "wagmi/connectors";
import { createConfig } from "wagmi";
// Importing the config module runs its top-level createConfig(...) call. wagmi and
// wagmi/connectors are mocked in test/setup.ts, so we assert on which connector
// factories the config invokes rather than on the (mocked-away) config object.
import "../wagmi.config";

// Vitest resets mock state before each test, so the import-time calls are captured here,
// at module scope, while they are still recorded — by the time an it() body runs they are
// gone. Re-executing the module per test instead (vi.resetModules + dynamic import) would
// re-run the vi.mock factories and hand wagmi.config fresh mock instances that no longer
// match the bindings imported above.
const walletConnectCalls = vi.mocked(walletConnect).mock.calls.length;
const injectedCalls = vi.mocked(injected).mock.calls.length;
const metaMaskCalls = vi.mocked(metaMask).mock.calls.length;
const configArg = vi.mocked(createConfig).mock.calls[0]?.[0] as { connectors?: unknown[] };

/**
 * Guards the connector setup against silently re-introducing the broken dedicated
 * MetaMask SDK connector (or a redundant generic injected() that would duplicate
 * auto-discovered wallets). Browser wallets must come from EIP-6963 auto-discovery;
 * WalletConnect is the only explicit connector.
 */
describe("wagmi.config connectors", () => {
  it("wires up only walletConnect as an explicit connector", () => {
    expect(walletConnectCalls).toBe(1);
    expect(injectedCalls).toBe(0);
    expect(metaMaskCalls).toBe(0);
  });

  it("passes exactly one connector to createConfig", () => {
    expect(configArg.connectors).toHaveLength(1);
  });
});
