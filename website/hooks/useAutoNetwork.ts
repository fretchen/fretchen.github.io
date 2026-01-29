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
import { useCallback } from "react";
import { toCAIP2, fromCAIP2 } from "@fretchen/chain-utils";

interface UseAutoNetworkResult {
  /** Target CAIP-2 network for transactions */
  network: string;
  /** Whether wallet is already on the target network */
  isOnCorrectNetwork: boolean;
  /** Call before submitting a transaction - switches chain if needed */
  switchIfNeeded: () => Promise<boolean>;
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

    // Try to switch
    try {
      await switchChainAsync({ chainId: fromCAIP2(defaultNetwork) });
      return true;
    } catch {
      // User rejected or error
      return false;
    }
  }, [isSupported, isConnected, switchChainAsync, defaultNetwork]);

  return {
    network,
    isOnCorrectNetwork: isSupported,
    switchIfNeeded,
  };
}
