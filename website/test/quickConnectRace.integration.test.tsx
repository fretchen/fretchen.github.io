/**
 * Regression test for the quick-connect discovery race, run against REAL wagmi.
 *
 * test/setup.ts globally replaces wagmi with stubs (`createConfig: () => ({})`),
 * which is exactly why the unit tests cannot catch this bug: the race lives in
 * wagmi's own timing, not in the mock's. Hence `vi.unmock` here.
 *
 * With `ssr: true` (see wagmi.config.ts), WagmiProvider's Hydrate mount effect appends
 * the EIP-6963-discovered wallets one commit after mount — a child's mount effect runs
 * before it, so in that window the connector list is [walletConnect] alone. A
 * quick-connect click there used to open the WalletConnect modal instead of the
 * installed browser wallet. Expected now: the race-window attempt does nothing, and
 * the post-discovery attempt connects the discovered wallet.
 */
import { describe, it, expect, vi, type MockInstance } from "vitest";
import React, { useEffect, useRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";

// setup.ts mocks wagmi for every test file; this one needs the real thing.
vi.unmock("wagmi");
vi.unmock("wagmi/connectors");

const ADDRESS = "0x1234567890123456789012345678901234567890" as const;
const requests: string[] = [];

/**
 * A fake browser wallet that announces itself over EIP-6963, like Brave Wallet does.
 * `eth_accounts` stays empty until accounts are requested — sites must ask, and it
 * keeps wagmi's on-mount reconnect from silently "connecting" the wallet before the
 * quick-connect click is exercised.
 */
function installFakeBrowserWallet() {
  let authorized = false;
  const provider = {
    isBraveWallet: true,
    on: vi.fn(),
    removeListener: vi.fn(),
    request: vi.fn(async ({ method }: { method: string }) => {
      requests.push(method);
      switch (method) {
        case "eth_accounts":
          return authorized ? [ADDRESS] : [];
        case "eth_requestAccounts":
          authorized = true;
          return [ADDRESS];
        case "wallet_requestPermissions":
          authorized = true;
          return [{ caveats: [{ type: "restrictReturnedAccounts", value: [ADDRESS] }] }];
        case "eth_chainId":
          // Base (8453) — a configured chain in wagmi.config.ts.
          return "0x2105";
        default:
          throw new Error(`fake wallet: unsupported method ${method}`);
      }
    }),
  };
  const detail = {
    info: { uuid: "race-uuid", name: "Brave Wallet", icon: "data:,x", rdns: "com.brave.wallet" },
    provider,
  };
  // Announce at once (content scripts run before app JS) and in response to mipd's
  // requestProvider dispatch, which createConfig fires at import time.
  window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail }));
  window.addEventListener("eip6963:requestProvider", () => {
    window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail }));
  });
}

describe("quick-connect discovery race (real wagmi)", () => {
  it(
    "ignores a race-window click and connects the discovered wallet afterwards",
    async () => {
      installFakeBrowserWallet();
      const { config } = await import("../wagmi.config");
      const { WagmiProvider, useAccount, useConnect } = await import("wagmi");
      const { useWalletConnection } = await import("../hooks/useWalletConnection");
      const { QueryClient, QueryClientProvider } = await import("@tanstack/react-query");

      const log: string[] = [];
      // Set by the harness below: a spy on the WalletConnect connector's own
      // connect() method, hoisted out so the assertions can read it.
      let wcConnectSpy: MockInstance | null = null;

      function Harness() {
        const { connector, isConnected } = useAccount();
        const { connectors } = useConnect();
        const { connectWallet } = useWalletConnection();
        const phase = useRef(0);

        // Spy on the WalletConnect connector's own connect() method BEFORE any
        // quick-connect attempt. This is the one fully deterministic observable for
        // the regression: a wrong pick calls connector.connect() synchronously, while
        // React-level pending state is swallowed by act batching and store status
        // transitions also fire for the on-mount reconnect.
        useEffect(() => {
          const wc = connectors.find((c) => c.type === "walletConnect");
          if (wc) wcConnectSpy = vi.spyOn(wc, "connect");
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        // Phase A: runs BEFORE WagmiProvider's Hydrate onMount (child effects fire
        // before parent effects), i.e. inside the race window.
        useEffect(() => {
          if (phase.current !== 0) return;
          phase.current = 1;
          log.push(
            `race-window attempt: connectors=[${connectors.map((c) => `${c.name}[${c.type}]`).join(", ")}]`,
          );
          connectWallet("integration-test");
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        // Phase B: once the browser wallet has been discovered, connect again.
        useEffect(() => {
          if (phase.current !== 1) return;
          if (!connectors.some((c) => c.type === "injected")) return;
          phase.current = 2;
          log.push("post-discovery attempt");
          connectWallet("integration-test");
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [connectors]);

        useEffect(() => {
          if (isConnected && connector) {
            log.push(`connected via ${connector.name}`);
          }
        }, [isConnected, connector]);

        return <div data-testid="log">{JSON.stringify(log)}</div>;
      }

      render(
        <QueryClientProvider client={new QueryClient()}>
          <WagmiProvider config={config}>
            <Harness />
          </WagmiProvider>
        </QueryClientProvider>,
      );

      await waitFor(
        () => {
          const lines: string[] = JSON.parse(screen.getByTestId("log").textContent ?? "[]");
          expect(lines).toContain("connected via Brave Wallet");
        },
        { timeout: 15000, interval: 100 },
      );

      const lines: string[] = JSON.parse(screen.getByTestId("log").textContent ?? "[]");
      // The race-window attempt saw only WalletConnect in the list…
      expect(lines[0]).toContain("WalletConnect[walletConnect]");
      expect(lines[0]).not.toContain("injected");
      // …and must not have engaged it.
      expect(lines).not.toContain("connected via WalletConnect");

      // The WalletConnect connector itself was never asked to connect — the spy sits
      // below wagmi's React layer, so this holds regardless of render timing.
      expect(wcConnectSpy).not.toBeNull();
      expect(wcConnectSpy).not.toHaveBeenCalled();

      // The real connect went through the discovered EIP-6963 provider (wagmi asks
      // for accounts via wallet_requestPermissions when the wallet supports it, and
      // falls back to eth_requestAccounts otherwise).
      const grantedAccounts = requests.some(
        (m) => m === "wallet_requestPermissions" || m === "eth_requestAccounts",
      );
      expect(grantedAccounts).toBe(true);
    },
    30000,
  );
});
