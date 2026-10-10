import { useCallback, useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { useIsMounted } from "./useIsMounted";
import { useIsWalletConnected } from "./useIsWalletConnected";
import { useUmami } from "./useUmami";
import { pickWalletConnector } from "../utils/walletConnector";
import { WalletEvents } from "../utils/analytics";

/**
 * Single source of truth for the quick-connect pattern used by the imagegen,
 * assistent, and growth pages.
 *
 * (The title-bar WalletOptions dropdown is intentionally NOT a consumer — it lets the
 * user pick a specific connector from a list, so it keeps raw useConnect.)
 */
export function useWalletConnection() {
  const { address } = useAccount();
  const { connectors, connect } = useConnect();
  const hasMounted = useIsMounted();
  const { trackEvent } = useUmami();

  // useIsWalletConnected waits for wagmi's post-hydration reconnect before trusting
  // `address` (owner checks / signing), avoiding both a hydration mismatch and a
  // flash of stale "disconnected" state — see its own doc comment. `hasMounted` is
  // returned separately below for callers that need an SSR/hydration gate without
  // waiting on the wallet reconnect itself (e.g. a page shell that renders the same
  // way whether or not a wallet ends up connected).
  const isConnected = useIsWalletConnected();

  // wagmi appends the EIP-6963-discovered browser wallets inside WagmiProvider's Hydrate
  // mount effect — one commit after the first render, because `ssr: true` defers discovery
  // out of the initial connector computation (see wagmi.config.ts). Until that append
  // lands, a connector list with no injected entry means "not discovered yet", not "not
  // installed", so the WalletConnect fallback must not fire (see pickWalletConnector). A
  // macrotask is late enough: the append is driven by already-settled promises inside
  // onMount, so it always completes before any timer fires.
  const [discoverySettled, setDiscoverySettled] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setDiscoverySettled(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const connectWallet = useCallback(
    (source: string, metadata?: Record<string, string | number | boolean>) => {
      const target = pickWalletConnector(connectors, { discoverySettled });
      if (!target) return;
      trackEvent(WalletEvents.CONNECT_ATTEMPT, { source, ...metadata });
      connect({ connector: target });
    },
    [connectors, connect, trackEvent, discoverySettled],
  );

  return {
    address,
    hasMounted,
    isConnected,
    connectWallet,
  };
}
