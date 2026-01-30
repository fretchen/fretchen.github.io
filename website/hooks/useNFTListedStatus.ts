/**
 * Hook to fetch and manage the listing status of an NFT.
 *
 * This hook encapsulates the logic for checking if an NFT is publicly listed
 * via the smart contract's isListed function.
 *
 * @example
 * ```tsx
 * const { isListed, isLoading, error, refetch } = useNFTListedStatus({
 *   tokenId: BigInt(42),
 *   network: "eip155:10",
 *   enabled: !isPublicView, // Only fetch in private view
 * });
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import { readContract } from "wagmi/actions";
import { config } from "../wagmi.config";
import { getGenAiNFTAddress, GenImNFTv4ABI, fromCAIP2 } from "@fretchen/chain-utils";

export interface UseNFTListedStatusOptions {
  /** The token ID to check */
  tokenId: bigint;
  /** The CAIP-2 network string (e.g., "eip155:10") */
  network: string;
  /** Whether to enable the query (default: true) */
  enabled?: boolean;
}

export interface UseNFTListedStatusResult {
  /** Whether the NFT is listed (undefined if not yet loaded) */
  isListed: boolean | undefined;
  /** Whether the query is currently loading */
  isLoading: boolean;
  /** Error message if the query failed */
  error: string | undefined;
  /** Function to manually refetch the listing status */
  refetch: () => Promise<void>;
  /** Optimistically update the listing status (for UI feedback) */
  setOptimisticListed: (value: boolean) => void;
}

/**
 * Fetches and manages the listing status of an NFT from the smart contract.
 *
 * The isListed status determines whether an NFT appears in the public gallery.
 * This hook only fetches in private view (when enabled=true).
 */
export function useNFTListedStatus({
  tokenId,
  network,
  enabled = true,
}: UseNFTListedStatusOptions): UseNFTListedStatusResult {
  const [isListed, setIsListed] = useState<boolean | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const chainId = fromCAIP2(network);
  const contractAddress = getGenAiNFTAddress(network);

  const fetchListedStatus = useCallback(async () => {
    if (!enabled) {
      setIsListed(undefined);
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const result = await readContract(config, {
        address: contractAddress,
        abi: GenImNFTv4ABI,
        functionName: "isListed",
        args: [tokenId],
        chainId,
      });

      setIsListed(result as boolean);
    } catch (err) {
      console.warn("Could not load listing status:", err);
      setError(err instanceof Error ? err.message : "Failed to load listing status");
      // Keep isListed as undefined on error
    } finally {
      setIsLoading(false);
    }
  }, [tokenId, network, enabled, contractAddress, chainId]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchListedStatus();
  }, [fetchListedStatus]);

  // Optimistic update for immediate UI feedback
  const setOptimisticListed = useCallback((value: boolean) => {
    setIsListed(value);
  }, []);

  return {
    isListed,
    isLoading,
    error,
    refetch: fetchListedStatus,
    setOptimisticListed,
  };
}
