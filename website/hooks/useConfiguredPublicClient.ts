import { useMemo } from "react";
import { getPublicClient } from "@wagmi/core";
import { config } from "../wagmi.config";
import { fromCAIP2 } from "@fretchen/chain-utils";

/**
 * Custom hook that provides a stable reference to the configured public client.
 *
 * This hook prevents infinite re-renders by memoizing the client instance.
 * The client is created once per component mount and remains stable throughout
 * the component's lifecycle.
 *
 * @param network - CAIP-2 network string (e.g., "eip155:10"). Required.
 * @returns A stable public client instance configured with the correct chain
 */
export function useConfiguredPublicClient(network: string) {
  return useMemo(() => {
    const chainId = fromCAIP2(network);
    // Must pass chainId explicitly to get the correct chain's public client
    return getPublicClient(config, { chainId });
  }, [network]);
}
