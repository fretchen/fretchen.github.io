import { useCallback } from "react";
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

  const connectWallet = useCallback(
    (source: string, metadata?: Record<string, string | number | boolean>) => {
      const target = pickWalletConnector(connectors);
      if (target) {
        trackEvent(WalletEvents.CONNECT_ATTEMPT, { source, ...metadata });
        connect({ connector: target });
      }
    },
    [connectors, connect, trackEvent],
  );

  return {
    address,
    hasMounted,
    isConnected,
    connectWallet,
  };
}
