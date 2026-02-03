import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { readContract } from "wagmi/actions";
import { config } from "../wagmi.config";
import {
  getGenAiNFTAddress,
  GenImNFTv4ABI,
  GENAI_NFT_NETWORKS,
  fromCAIP2,
  isTestnet,
} from "@fretchen/chain-utils";

/**
 * NFT with chain information for multi-chain display
 */
export interface MultiChainNFTToken {
  tokenId: bigint;
  network: string;
}

/**
 * Options for the useMultiChainUserNFTs hook
 */
interface UseMultiChainUserNFTsOptions {
  /** Include testnet NFTs (default: false) */
  includeTestnets?: boolean;
}

/**
 * Result of the useMultiChainUserNFTs hook
 */
interface UseMultiChainUserNFTsResult {
  /** All NFT tokens across chains (sorted by tokenId descending) */
  tokens: MultiChainNFTToken[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Reload all chains */
  reload: () => Promise<void>;
}

/**
 * Hook to fetch user's NFTs across all configured chains in parallel.
 * 
 * @example
 * const { tokens, isLoading, error, reload } = useMultiChainUserNFTs();
 * 
 * // tokens = [
 * //   { tokenId: 26n, network: "eip155:10" },
 * //   { tokenId: 1n, network: "eip155:8453" },
 * //   ...
 * // ]
 */
export function useMultiChainUserNFTs(
  options: UseMultiChainUserNFTsOptions = {}
): UseMultiChainUserNFTsResult {
  const { includeTestnets = false } = options;
  const { address, isConnected } = useAccount();
  
  const [tokens, setTokens] = useState<MultiChainNFTToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter networks based on testnet preference
  const networks = useMemo(() => {
    return GENAI_NFT_NETWORKS.filter((n) => includeTestnets || !isTestnet(n));
  }, [includeTestnets]);

  /**
   * Fetch all token IDs for a user on a single network
   */
  const fetchUserTokensOnNetwork = useCallback(
    async (network: string): Promise<MultiChainNFTToken[]> => {
      if (!address) return [];

      const contractAddress = getGenAiNFTAddress(network);
      const chainId = fromCAIP2(network);

      try {
        // Get user's balance on this chain
        const balance = await readContract(config, {
          address: contractAddress,
          abi: GenImNFTv4ABI,
          functionName: "balanceOf",
          args: [address],
          chainId,
        });

        if (!balance || balance === 0n) {
          return [];
        }

        // Fetch all token IDs in parallel
        const tokenPromises: Promise<MultiChainNFTToken | null>[] = [];
        for (let i = 0; i < Number(balance); i++) {
          tokenPromises.push(
            (async () => {
              try {
                const tokenId = await readContract(config, {
                  address: contractAddress,
                  abi: GenImNFTv4ABI,
                  functionName: "tokenOfOwnerByIndex",
                  args: [address, BigInt(i)],
                  chainId,
                });
                return { tokenId: tokenId as bigint, network };
              } catch (err) {
                console.error(`Error fetching token at index ${i} on ${network}:`, err);
                return null;
              }
            })()
          );
        }

        const results = await Promise.all(tokenPromises);
        return results.filter((t): t is MultiChainNFTToken => t !== null);
      } catch (err) {
        console.error(`Error fetching NFTs on ${network}:`, err);
        return [];
      }
    },
    [address]
  );

  /**
   * Fetch NFTs from all networks in parallel
   */
  const loadAllNetworks = useCallback(async () => {
    if (!isConnected || !address) {
      setTokens([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch from all networks in parallel
      const networkResults = await Promise.all(
        networks.map((network) => fetchUserTokensOnNetwork(network))
      );

      // Flatten and sort by tokenId (descending - newest first)
      const allTokens = networkResults.flat().sort((a, b) => {
        if (b.tokenId > a.tokenId) return 1;
        if (b.tokenId < a.tokenId) return -1;
        return 0;
      });

      setTokens(allTokens);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load NFTs";
      setError(message);
      console.error("Error loading multi-chain NFTs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, networks, fetchUserTokensOnNetwork]);

  // Load on mount and when dependencies change
  useEffect(() => {
    if (isConnected && address) {
      loadAllNetworks();
    }
  }, [isConnected, address, loadAllNetworks]);

  return {
    tokens,
    isLoading,
    error,
    reload: loadAllNetworks,
  };
}

/**
 * Options for the useMultiChainPublicNFTs hook
 */
interface UseMultiChainPublicNFTsOptions {
  /** Include testnet NFTs (default: false) */
  includeTestnets?: boolean;
}

/**
 * Result of the useMultiChainPublicNFTs hook
 */
interface UseMultiChainPublicNFTsResult {
  /** All public NFT tokens across chains (sorted by tokenId descending) */
  tokens: MultiChainNFTToken[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Reload all chains */
  reload: () => Promise<void>;
}

/**
 * Hook to fetch public (listed) NFTs across all configured chains in parallel.
 */
export function useMultiChainPublicNFTs(
  options: UseMultiChainPublicNFTsOptions = {}
): UseMultiChainPublicNFTsResult {
  const { includeTestnets = false } = options;
  
  const [tokens, setTokens] = useState<MultiChainNFTToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter networks based on testnet preference
  const networks = useMemo(() => {
    return GENAI_NFT_NETWORKS.filter((n) => includeTestnets || !isTestnet(n));
  }, [includeTestnets]);

  /**
   * Fetch all public token IDs on a single network
   */
  const fetchPublicTokensOnNetwork = useCallback(
    async (network: string): Promise<MultiChainNFTToken[]> => {
      const contractAddress = getGenAiNFTAddress(network);
      const chainId = fromCAIP2(network);

      try {
        const tokenIds = await readContract(config, {
          address: contractAddress,
          abi: GenImNFTv4ABI,
          functionName: "getAllPublicTokens",
          chainId,
        }) as bigint[];

        if (!tokenIds || tokenIds.length === 0) {
          return [];
        }

        return tokenIds.map((tokenId) => ({ tokenId, network }));
      } catch (err) {
        console.error(`Error fetching public NFTs on ${network}:`, err);
        return [];
      }
    },
    []
  );

  /**
   * Fetch public NFTs from all networks in parallel
   */
  const loadAllNetworks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch from all networks in parallel
      const networkResults = await Promise.all(
        networks.map((network) => fetchPublicTokensOnNetwork(network))
      );

      // Flatten and sort by tokenId (descending - newest first)
      const allTokens = networkResults.flat().sort((a, b) => {
        if (b.tokenId > a.tokenId) return 1;
        if (b.tokenId < a.tokenId) return -1;
        return 0;
      });

      setTokens(allTokens);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load public NFTs";
      setError(message);
      console.error("Error loading multi-chain public NFTs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [networks, fetchPublicTokensOnNetwork]);

  // Load on mount
  useEffect(() => {
    loadAllNetworks();
  }, [loadAllNetworks]);

  return {
    tokens,
    isLoading,
    error,
    reload: loadAllNetworks,
  };
}
