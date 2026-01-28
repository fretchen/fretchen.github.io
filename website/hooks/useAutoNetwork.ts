/**
 * Hook for automatic network detection and switching.
 *
 * Detects the user's connected wallet chain and returns the CAIP-2 network string.
 * If the chain is not in the supported networks, automatically switches to the default.
 */

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useEffect } from "react";
import { toCAIP2, fromCAIP2 } from "@fretchen/chain-utils";

/**
 * Returns the current CAIP-2 network if supported, otherwise switches to default.
 *
 * @param supportedNetworks - Array of CAIP-2 network strings (e.g., ["eip155:10", "eip155:11155420"])
 * @returns Current CAIP-2 network string
 *
 * @example
 * ```tsx
 * import { GENAI_NFT_NETWORKS } from "@fretchen/chain-utils";
 *
 * function MyComponent() {
 *   const network = useAutoNetwork(GENAI_NFT_NETWORKS);
 *   // network is "eip155:10" or "eip155:11155420"
 * }
 * ```
 */
export function useAutoNetwork(supportedNetworks: readonly string[]): string {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  const defaultNetwork = supportedNetworks[0];
  const currentNetwork = toCAIP2(chainId);
  const isSupported = supportedNetworks.includes(currentNetwork);

  useEffect(() => {
    if (isConnected && !isSupported && switchChain) {
      switchChain({ chainId: fromCAIP2(defaultNetwork) });
    }
  }, [isConnected, isSupported, switchChain, defaultNetwork]);

  return isSupported ? currentNetwork : defaultNetwork;
}
