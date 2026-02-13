import React, { useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from "wagmi";
import { formatEther } from "viem";
import { getCollectorNFTAddress, CollectorNFTv1ABI, COLLECTOR_NFT_NETWORKS, fromCAIP2 } from "@fretchen/chain-utils";
import { useAutoNetwork } from "../hooks/useAutoNetwork";
import * as styles from "../layouts/styles";
import { useLocale } from "../hooks/useLocale";

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
  // Wagmi hooks
  const { isConnected } = useAccount();
  const { network, switchIfNeeded } = useAutoNetwork(COLLECTOR_NFT_NETWORKS);
  const { writeContract, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [isLoading, setIsLoading] = useState(false);

  // Chain ID for current network
  const chainId = fromCAIP2(network);

  const collectLabel = useLocale({ label: "imagegen.collect" });
  const collectingLabel = useLocale({ label: "imagegen.collecting" });
  const collectedLabel = useLocale({ label: "imagegen.collected" });
  const priceLoadingLabel = useLocale({ label: "imagegen.priceLoading" });
  const currentPriceInfoLabel = useLocale({ label: "imagegen.currentPriceInfo" });

  // Read mint stats
  const {
    data: mintStats,
    error: readError,
    isPending: isReadPending,
    refetch,
  } = useReadContract({
    address: getCollectorNFTAddress(network),
    abi: CollectorNFTv1ABI,
    functionName: "getMintStats",
    args: [genImTokenId],
    chainId,
  });

  // Handle collect action
  const handleCollect = async () => {
    if (!isConnected) return;
    if (!mintStats || !Array.isArray(mintStats)) return;

    setIsLoading(true);

    // Ensure correct network before transaction
    const switched = await switchIfNeeded();
    if (!switched) {
      setIsLoading(false);
      return;
    }

    const [, currentPrice] = mintStats as [bigint, bigint, bigint];

    writeContract({
      address: getCollectorNFTAddress(network),
      abi: CollectorNFTv1ABI,
      functionName: "mintCollectorNFT",
      args: [genImTokenId], // CollectorNFTv1 doesn't need URI parameter
      value: currentPrice,
    });
    // Don't set isLoading(false) here - let useEffect handle it when isPending becomes true
  };

  // Reset isLoading once wagmi takes over or transaction completes
  // Using a ref to avoid set-state-in-effect warning
  if ((isPending || isSuccess) && isLoading) {
    setIsLoading(false);
  }

  // Update state after transaction
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        refetch();
      }, 2000);
    }
  }, [isSuccess, refetch]);

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
      return priceLoadingLabel;
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

    return currentPriceInfoLabel
      .replace("{currentPrice}", formattedCurrent)
      .replace("{nextTier}", nextTierBoundary.toString())
      .replace("{nextPrice}", formattedNextTier);
  };

  return (
    <button
      onClick={handleCollect}
      disabled={!isConnected || isPending || isConfirming || isLoading}
      className={`${styles.nftCard.actionButton} ${styles.primaryButton}`}
      title={`Collect this NFT (${getMintCount()} collected) | ${getPriceInfo()}`}
    >
      {isPending || isLoading
        ? `📦 ${collectingLabel}`
        : isSuccess
          ? `✅ ${collectedLabel}`
          : `📦 ${collectLabel} (${getMintCount()})`}
    </button>
  );
}
