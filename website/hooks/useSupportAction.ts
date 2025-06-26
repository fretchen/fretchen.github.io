import * as React from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { parseEther } from "viem";
import { useReadContract } from "wagmi";
import { getChain, getSupportContractConfig } from "../utils/getChain";

/**
 * Custom hook for handling support/like functionality
 * Separates Web3 logic from UI components
 */
export function useSupportAction(url: string) {
  // States
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fullUrl, setFullUrl] = React.useState(url);

  // Wagmi hooks
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const donationAmount = parseEther("0.0002");
  const { writeContract, isPending, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Set full URL after hydration
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const rawUrl = window.location.origin + url;
      const cleanUrl = rawUrl.replace(/\/+$/, "");
      setFullUrl(cleanUrl);
    }
  }, [url]);

  // Chain and contract configuration
  const chain = getChain();
  const supportContractConfig = getSupportContractConfig();
  const isCorrectNetwork = chainId === chain.id;

  // Read support data
  const {
    data: supportCount,
    error: readError,
    isPending: isReadPending,
    refetch,
  } = useReadContract({
    ...supportContractConfig,
    functionName: "getLikesForUrl",
    args: [fullUrl],
    chainId: chain.id,
  });

  // Handle support action
  const handleSupport = React.useCallback(async () => {
    setErrorMessage(null);
    if (!fullUrl) {
      setErrorMessage("URL ist erforderlich");
      return;
    }

    if (!isCorrectNetwork) {
      setErrorMessage(`Bitte wechsle zum ${chain.name} Netzwerk`);
      return;
    }

    setIsLoading(true);

    writeContract({
      ...supportContractConfig,
      functionName: "donate",
      args: [fullUrl],
      value: donationAmount,
    });
  }, [fullUrl, isCorrectNetwork, chain.name, writeContract, supportContractConfig, donationAmount]);

  // Update state after transaction
  React.useEffect(() => {
    if (isSuccess) {
      setIsLoading(false);
      setErrorMessage(null);
      setTimeout(() => {
        refetch();
      }, 2000);
    }
    if (writeError) {
      setIsLoading(false);
      setErrorMessage(writeError?.message || "Transaktion fehlgeschlagen");
    }
  }, [isSuccess, writeError, refetch]);

  // Warning message logic
  const warningMessage =
    errorMessage || (!isCorrectNetwork && isConnected ? `Bitte wechsle zum ${chain.name} Netzwerk` : null);

  return {
    // State
    supportCount: supportCount?.toString() || "0",
    isLoading: isLoading || isPending || isConfirming,
    isSuccess,
    errorMessage: warningMessage,
    isConnected,
    isReadPending,
    readError,
    // Actions
    handleSupport,
  };
}
