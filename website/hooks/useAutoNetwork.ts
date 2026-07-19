/**
 * Hook for network detection with deferred switching.
 *
 * Detects the user's connected wallet chain and returns the target CAIP-2 network.
 * Does NOT auto-switch - instead provides a `switchIfNeeded()` function
 * to call at interaction time (submit button).
 *
 * This pattern is more user-friendly:
 * - No surprising wallet popups on connect
 * - Switch happens in context of an action (expected by users)
 * - Beginners don't need to understand chains
 */

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useCallback, useState } from "react";
import { toCAIP2, fromCAIP2 } from "@fretchen/chain-utils";

interface UseAutoNetworkResult {
  /** Target CAIP-2 network for transactions */
  network: string;
  /** Whether wallet is already on the target network */
  isOnCorrectNetwork: boolean;
  /** Call before submitting a transaction - switches chain if needed */
  switchIfNeeded: () => Promise<boolean>;
  /**
   * The error message from the most recent failed switchIfNeeded() call, if any.
   * Null on success or before any switch attempt. Useful for surfacing why a switch
   * failed instead of a generic "please switch" message — e.g. a wallet connector
   * without automatic `wallet_addEthereumChain` fallback (some WalletConnect-linked
   * wallets) will reject with the raw "Unrecognized chain ID" RPC error here, whereas
   * MetaMask's own injected connector recovers from that automatically (see switchIfNeeded).
   */
  switchError: string | null;
}

/**
 * Returns the target CAIP-2 network and a function to switch when needed.
 *
 * @param supportedNetworks - Array of CAIP-2 network strings (e.g., ["eip155:10", "eip155:11155420"])
 * @returns Object with network, isOnCorrectNetwork, and switchIfNeeded()
 *
 * @example
 * ```tsx
 * import { GENAI_NFT_NETWORKS } from "@fretchen/chain-utils";
 *
 * function MyComponent() {
 *   const { network, isOnCorrectNetwork, switchIfNeeded } = useAutoNetwork(GENAI_NFT_NETWORKS);
 *
 *   const handleSubmit = async () => {
 *     const switched = await switchIfNeeded();
 *     if (!switched) return; // User rejected switch
 *     // Proceed with transaction on `network`
 *   };
 * }
 * ```
 */
export function useAutoNetwork(supportedNetworks: readonly string[]): UseAutoNetworkResult {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [switchError, setSwitchError] = useState<string | null>(null);

  const defaultNetwork = supportedNetworks[0];
  const currentNetwork = toCAIP2(chainId);
  const isSupported = supportedNetworks.includes(currentNetwork);

  // Return the current network if supported, otherwise the default
  const network = isSupported ? currentNetwork : defaultNetwork;

  const switchIfNeeded = useCallback(async (): Promise<boolean> => {
    // Already on correct network
    if (isSupported) return true;

    // Not connected - nothing to switch
    if (!isConnected) return true;

    // Try to switch. If the wallet doesn't know this chain yet, MetaMask (and any
    // wallet using wagmi's generic injected connector) rejects the switch with RPC
    // error 4902 and the connector automatically retries via `wallet_addEthereumChain`
    // before switching — i.e. two separate wallet approval prompts before the switch
    // resolves. That's expected, not a bug; not every connector has this fallback
    // (e.g. some WalletConnect-linked wallets), so a failure here is still possible.
    try {
      await switchChainAsync({ chainId: fromCAIP2(defaultNetwork) });
      setSwitchError(null);
      return true;
    } catch (err) {
      // User rejected, or the wallet couldn't add/switch to the chain
      setSwitchError(err instanceof Error ? err.message : "Failed to switch network");
      return false;
    }
  }, [isSupported, isConnected, switchChainAsync, defaultNetwork]);

  return {
    network,
    isOnCorrectNetwork: isSupported,
    switchIfNeeded,
    switchError,
  };
}
