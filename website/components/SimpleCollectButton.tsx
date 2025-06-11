import React, { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useChainId } from "wagmi";
import { getCollectorNFTContractConfig, getChain } from "../utils/getChain";
import * as styles from "../layouts/styles";

interface SimpleCollectButtonProps {
  genImTokenId: bigint;
}

/**
 * SimpleCollectButton Component
 *
 * A minimal collect button styled like other NFT card action buttons.
 * Shows mint count and allows collecting NFTs.
 */
export function SimpleCollectButton({ genImTokenId }: SimpleCollectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Wagmi hooks
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContract, isPending, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Chain and contract configuration
  const chain = getChain();
  const collectorContractConfig = getCollectorNFTContractConfig();
  const isCorrectNetwork = chainId === chain.id;

  // Read mint stats
  const {
    data: mintStats,
    error: readError,
    isPending: isReadPending,
    refetch,
  } = useReadContract({
    ...collectorContractConfig,
    functionName: "getMintStats",
    args: [genImTokenId],
    chainId: chain.id,
  });

  // Handle collect action
  const handleCollect = async () => {
    if (!isConnected) return;
    if (!isCorrectNetwork) return;
    if (!mintStats || !Array.isArray(mintStats)) return;

    setIsLoading(true);

    const [, currentPrice] = mintStats as [bigint, bigint, bigint];

    writeContract({
      ...collectorContractConfig,
      functionName: "mintCollectorNFT",
      args: [genImTokenId, "ipfs://collected-nft"],
      value: currentPrice,
    });
  };

  // Update state after transaction
  useEffect(() => {
    if (isSuccess) {
      setIsLoading(false);
      setTimeout(() => {
        refetch();
      }, 2000);
    }
    if (writeError) {
      setIsLoading(false);
    }
  }, [isSuccess, writeError, refetch]);

  // Get mint count
  const getMintCount = () => {
    if (isReadPending) return "...";
    if (readError || !mintStats || !Array.isArray(mintStats)) return "0";
    const [mintCount] = mintStats as [bigint, bigint, bigint];
    return mintCount.toString();
  };

  return (
    <button
      onClick={handleCollect}
      disabled={!isConnected || isLoading || isPending || isConfirming || !isCorrectNetwork}
      className={`${styles.nftCard.actionButton} ${styles.primaryButton}`}
      title={`Collect this NFT (${getMintCount()} collected so far)`}
    >
      {isLoading || isPending ? "📦 Collecting..." : isSuccess ? "✅ Collected!" : `📦 Collect (${getMintCount()})`}
    </button>
  );
}
