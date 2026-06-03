import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { readContract } from "wagmi/actions";
import { config } from "../wagmi.config";
import { getGenAiNFTAddress, GenImNFTv4ABI, fromCAIP2 } from "@fretchen/chain-utils";

export interface UseNFTListedStatusOptions {
  tokenId: bigint;
  network: string;
  enabled?: boolean;
}

export interface UseNFTListedStatusResult {
  isListed: boolean | null | undefined;
  isLoading: boolean;
  error: string | undefined;
  refetch: () => Promise<void>;
  setOptimisticListed: (value: boolean) => void;
}

export function useNFTListedStatus({
  tokenId,
  network,
  enabled = true,
}: UseNFTListedStatusOptions): UseNFTListedStatusResult {
  const queryClient = useQueryClient();
  const chainId = fromCAIP2(network);
  const contractAddress = getGenAiNFTAddress(network);
  const tokenIdStr = tokenId.toString();
  const queryKey = ["nftListedStatus", tokenIdStr, network] as const;

  const {
    data: isListed,
    isPending,
    isError,
    error: queryError,
    refetch,
  } = useQuery<boolean | null>({
    queryKey,
    queryFn: async () => {
      try {
        return await readContract(config, {
          address: contractAddress,
          abi: GenImNFTv4ABI,
          functionName: "isTokenListed",
          args: [tokenId],
          chainId,
        });
      } catch (err) {
        // Legacy tokens minted before isListed feature — not a real error
        const isContractRevert =
          err instanceof Error &&
          (err.message.includes("reverted") ||
            err.name.includes("ContractFunctionRevertedError") ||
            err.name.includes("ContractFunctionExecutionError"));
        if (isContractRevert) return null;
        throw err;
      }
    },
    enabled,
  });

  const setOptimisticListed = useCallback(
    (value: boolean) => {
      queryClient.setQueryData(queryKey, value);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, tokenIdStr, network],
  );

  return {
    isListed,
    isLoading: enabled !== false && isPending,
    error: isError ? (queryError instanceof Error ? queryError.message : "Failed to load listing status") : undefined,
    refetch: async () => {
      await refetch();
    },
    setOptimisticListed,
  };
}
