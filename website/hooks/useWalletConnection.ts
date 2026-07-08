import { useCallback } from "react";
import { useAccount, useConnect } from "wagmi";
import { useIsMounted } from "./useIsMounted";
import { pickWalletConnector } from "../utils/walletConnector";

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

  // status === "connected" (not just isConnected) waits for wagmi's reconnect to finish
  // before callers trust `address` (owner checks / signing). hasMounted avoids SSR/client
  // hydration mismatch — SSR always renders disconnected.
  const isConnected = hasMounted && status === "connected";

  const connectWallet = useCallback(() => {
    const target = pickWalletConnector(connectors);
    if (target) {
      connect({ connector: target });
    }
  }, [connectors, connect]);

  return {
    address,
    status,
    hasMounted,
    isConnected,
    canConnect: connectors.length > 0,
    connectWallet,
  };
}
