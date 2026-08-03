import { useMemo } from "react";
import { getPublicClient } from "wagmi/actions";
import { config, asConfiguredChainId } from "../wagmi.config";
import { fromCAIP2 } from "@fretchen/chain-utils";

/**
 * Resolve the configured public client for a CAIP-2 network, outside of React.
 *
 * Use this when the network isn't known at render time — e.g. `useX402Chat` only learns
 * which network it will pay on after negotiating with the agent, so it can't rely on the
 * hook below having been called with the right one.
 *
 * @param network - CAIP-2 network string (e.g., "eip155:10"). Required.
 * @returns A public client instance configured with the correct chain
 */
export function getConfiguredPublicClient(network: string) {
  const chainId = asConfiguredChainId(fromCAIP2(network));
  // Must pass chainId explicitly to get the correct chain's public client
  return getPublicClient(config, { chainId });
}

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
  return useMemo(() => getConfiguredPublicClient(network), [network]);
}
