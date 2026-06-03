import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { readContract } from "wagmi/actions";
import { config } from "../wagmi.config";
import { getGenAiNFTAddress, GenImNFTv4ABI, GENAI_NFT_NETWORKS, fromCAIP2, isTestnet } from "@fretchen/chain-utils";

export interface MultiChainNFTToken {
  tokenId: bigint;
  network: string;
}

interface UseMultiChainUserNFTsOptions {
  includeTestnets?: boolean;
}

interface UseMultiChainUserNFTsResult {
  tokens: MultiChainNFTToken[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

async function fetchUserTokensOnNetwork(network: string, address: `0x${string}`): Promise<MultiChainNFTToken[]> {
  const contractAddress = getGenAiNFTAddress(network);
  const chainId = fromCAIP2(network);

  const balance = await readContract(config, {
    address: contractAddress,
    abi: GenImNFTv4ABI,
    functionName: "balanceOf",
    args: [address],
    chainId,
  });

  if (!balance || balance === 0n) return [];

  const tokenPromises = Array.from({ length: Number(balance) }, (_, i) =>
    readContract(config, {
      address: contractAddress,
      abi: GenImNFTv4ABI,
      functionName: "tokenOfOwnerByIndex",
      args: [address, BigInt(i)],
      chainId,
    })
      .then((tokenId) => ({ tokenId, network }) as MultiChainNFTToken)
      .catch(() => null),
  );

  const results = await Promise.all(tokenPromises);
  return results.filter((t): t is MultiChainNFTToken => t !== null);
}

async function fetchAllUserNFTs(networks: string[], address: `0x${string}`): Promise<MultiChainNFTToken[]> {
  const networkResults = await Promise.all(
    networks.map((network) => fetchUserTokensOnNetwork(network, address).catch(() => [] as MultiChainNFTToken[])),
  );
  return networkResults.flat().sort((a, b) => (b.tokenId > a.tokenId ? 1 : b.tokenId < a.tokenId ? -1 : 0));
}

export function useMultiChainUserNFTs(options: UseMultiChainUserNFTsOptions = {}): UseMultiChainUserNFTsResult {
  const { includeTestnets = false } = options;
  const { address, isConnected } = useAccount();

  const networks = useMemo(() => GENAI_NFT_NETWORKS.filter((n) => includeTestnets || !isTestnet(n)), [includeTestnets]);

  const {
    data: tokens = [],
    isPending,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["multiChainUserNFTs", address, networks.join(",")],
    queryFn: () => fetchAllUserNFTs(networks, address!),
    enabled: isConnected && !!address,
  });

  return {
    tokens,
    isLoading: isPending && isConnected && !!address,
    error: isError ? (queryError instanceof Error ? queryError.message : "Failed to load NFTs") : null,
    reload: async () => {
      await refetch();
    },
  };
}

interface UseMultiChainPublicNFTsOptions {
  includeTestnets?: boolean;
}

interface UseMultiChainPublicNFTsResult {
  tokens: MultiChainNFTToken[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

async function fetchPublicTokensOnNetwork(network: string): Promise<MultiChainNFTToken[]> {
  const contractAddress = getGenAiNFTAddress(network);
  const chainId = fromCAIP2(network);

  const tokenIds = (await readContract(config, {
    address: contractAddress,
    abi: GenImNFTv4ABI,
    functionName: "getAllPublicTokens",
    chainId,
  })) as bigint[];

  if (!tokenIds || tokenIds.length === 0) return [];
  return tokenIds.map((tokenId) => ({ tokenId, network }));
}

async function fetchAllPublicNFTs(networks: string[]): Promise<MultiChainNFTToken[]> {
  const networkResults = await Promise.all(
    networks.map((network) => fetchPublicTokensOnNetwork(network).catch(() => [] as MultiChainNFTToken[])),
  );
  return networkResults.flat().sort((a, b) => (b.tokenId > a.tokenId ? 1 : b.tokenId < a.tokenId ? -1 : 0));
}

export function useMultiChainPublicNFTs(options: UseMultiChainPublicNFTsOptions = {}): UseMultiChainPublicNFTsResult {
  const { includeTestnets = false } = options;

  const networks = useMemo(() => GENAI_NFT_NETWORKS.filter((n) => includeTestnets || !isTestnet(n)), [includeTestnets]);

  const {
    data: tokens = [],
    isPending,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["multiChainPublicNFTs", networks.join(",")],
    queryFn: () => fetchAllPublicNFTs(networks),
  });

  return {
    tokens,
    isLoading: isPending,
    error: isError ? (queryError instanceof Error ? queryError.message : "Failed to load public NFTs") : null,
    reload: async () => {
      await refetch();
    },
  };
}
