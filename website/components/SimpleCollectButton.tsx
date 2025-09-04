import React, { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useChainId } from "wagmi";
import { formatEther } from "viem";
import { getCollectorNFTContractConfig, getChain } from "../utils/getChain";
import * as styles from "../layouts/styles";
import {useLocale} from "../hooks/useLocale";
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
      args: [genImTokenId], // CollectorNFTv1 doesn't need URI parameter
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

  // Get price information for tooltip
  const getPriceInfo = () => {
    if (isReadPending || readError || !mintStats || !Array.isArray(mintStats)) {
      return "Price loading...";
    }

    const [mintCount, currentPrice] = mintStats as [bigint, bigint, bigint];
    const currentPriceETH = formatEther(currentPrice);

    // Format prices to show only significant digits
    const formatPrice = (ethString: string) => {
      const num = parseFloat(ethString);
      if (num >= 0.001) return num.toFixed(3);
      if (num >= 0.0001) return num.toFixed(4);
      return num.toFixed(6);
    };

    const formattedCurrent = formatPrice(currentPriceETH);

    // Calculate the next tier boundary (next multiple of 5)
    const currentMintCount = Number(mintCount);
    const nextTierBoundary = Math.ceil((currentMintCount + 1) / 5) * 5;

    // Calculate price at next tier boundary using same logic as smart contract
    // Price doubles every 5 mints: baseMintPrice * (2 ** (mintCount / 5))
    const baseMintPrice = currentPrice / BigInt(2 ** Math.floor(currentMintCount / 5));
    const nextTierPrice = baseMintPrice * BigInt(2 ** Math.floor(nextTierBoundary / 5));
    const formattedNextTier = formatPrice(formatEther(nextTierPrice));

    return `Current price: ${formattedCurrent} ETH | Price after ${nextTierBoundary} mints: ${formattedNextTier} ETH`;
  };

  return (
    <button
      onClick={handleCollect}
      disabled={!isConnected || isLoading || isPending || isConfirming || !isCorrectNetwork}
      className={`${styles.nftCard.actionButton} ${styles.primaryButton}`}
      title={`Collect this NFT (${getMintCount()} collected) | ${getPriceInfo()}`}
    >
      {isLoading || isPending ? "📦 Collecting..." : isSuccess ? "✅ Collected!" : `📦 ${useLocale({label: 'imagegen.collect'})} (${getMintCount()})`}
    </button>
  );
}
