import { describe, it, expect, vi } from "vitest";
import { injected, metaMask, walletConnect } from "wagmi/connectors";
import { createConfig } from "wagmi";
// Importing the config module runs its top-level createConfig(...) call. wagmi and
// wagmi/connectors are mocked in test/setup.ts, so we assert on which connector
// factories the config invokes rather than on the (mocked-away) config object.
import "../wagmi.config";

/**
 * Guards the connector setup against silently re-introducing the broken dedicated
 * MetaMask SDK connector (or a redundant generic injected() that would duplicate
 * auto-discovered wallets). Browser wallets must come from EIP-6963 auto-discovery;
 * WalletConnect is the only explicit connector.
 */
describe("wagmi.config connectors", () => {
  it("wires up only walletConnect as an explicit connector", () => {
    expect(vi.mocked(walletConnect)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(injected)).not.toHaveBeenCalled();
    expect(vi.mocked(metaMask)).not.toHaveBeenCalled();
  });

  it("passes exactly one connector to createConfig", () => {
    const arg = vi.mocked(createConfig).mock.calls[0]?.[0] as { connectors?: unknown[] };
    expect(arg.connectors).toHaveLength(1);
  });
});
