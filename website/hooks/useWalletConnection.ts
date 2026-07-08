import { useCallback } from "react";
import { useAccount, useConnect } from "wagmi";
import { useIsMounted } from "./useIsMounted";
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
  const { address, status } = useAccount();
  const { connectors, connect } = useConnect();
  const hasMounted = useIsMounted();
  const { trackEvent } = useUmami();

  // status === "connected" (not just isConnected) waits for wagmi's reconnect to finish
  // before callers trust `address` (owner checks / signing). hasMounted avoids SSR/client
  // hydration mismatch — SSR always renders disconnected. `status` itself is intentionally
  // not returned below — only this derived, safe flag is, so callers can't bypass it.
  const isConnected = hasMounted && status === "connected";

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
