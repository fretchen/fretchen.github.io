import { useMemo } from "react";
import { getPublicClient } from "@wagmi/core";
import { config } from "../wagmi.config";
import { getChain } from "../utils/getChain";

/**
 * Custom hook that provides a stable reference to the configured public client.
 *
 * This hook prevents infinite re-renders by memoizing the client instance.
 * The client is created once per component mount and remains stable throughout
 * the component's lifecycle.
 *
 * @returns A stable public client instance configured with the correct chain
 */
export function useConfiguredPublicClient() {
  return useMemo(() => {
    const chain = getChain();
    return getPublicClient({ ...config, chains: [chain] });
  }, []);
}
