import * as React from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from "wagmi";
import { parseEther } from "viem";
import { useReadContract } from "wagmi";
import {
  getSupportV2Config,
  isSupportV2Chain,
  DEFAULT_SUPPORT_CHAIN,
  SUPPORT_RECIPIENT_ADDRESS,
} from "../utils/getChain";
import { trackEvent } from "../utils/analytics";

/**
 * Custom hook for SupportV2 with multi-chain support
 * Automatic chain switch when user clicks "Support" (like ImageGenerator.tsx)
 */
export function useSupportAction(url: string) {
  // States
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fullUrl, setFullUrl] = React.useState(url);

  // Wagmi hooks
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
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

  // Check if current chain is supported
  const isSupported = isSupportV2Chain(chainId);

  // Chain for read operations: User's chain if supported, otherwise default
  const readChainId = isSupported ? chainId : DEFAULT_SUPPORT_CHAIN.id;
  const readConfig = getSupportV2Config(readChainId)!;

  // Read support data - always works (even if user on wrong chain)
  const {
    data: supportCount,
    error: readError,
    isPending: isReadPending,
    refetch,
  } = useReadContract({
    ...readConfig,
    functionName: "getLikesForUrl",
    args: [fullUrl],
    chainId: readChainId,
    query: { enabled: !!fullUrl },
  });

  // Handle support action with automatic chain switch
  const handleSupport = React.useCallback(async () => {
    setErrorMessage(null);
    if (!fullUrl) {
      setErrorMessage("URL ist erforderlich");
      return;
    }

    // Automatic chain switch if not on supported chain
    if (!isSupported) {
      console.log(
        `[Support] Chain mismatch: current=${chainId}, switching to ${DEFAULT_SUPPORT_CHAIN.name}`
      );
      try {
        await switchChainAsync({ chainId: DEFAULT_SUPPORT_CHAIN.id });
        console.log(`[Support] Successfully switched to ${DEFAULT_SUPPORT_CHAIN.name}`);
      } catch (switchError) {
        console.error("[Support] Chain switch failed:", switchError);
        setErrorMessage(`Chain-Wechsel zu ${DEFAULT_SUPPORT_CHAIN.name} fehlgeschlagen`);
        return;
      }
    }

    // Get contract config (use default chain after potential switch)
    const activeConfig = getSupportV2Config(DEFAULT_SUPPORT_CHAIN.id);
    if (!activeConfig) {
      setErrorMessage("Konfigurationsfehler");
      return;
    }

    setIsLoading(true);

    // SupportV2 has recipient parameter
    writeContract({
      ...activeConfig,
      functionName: "donate",
      args: [fullUrl, SUPPORT_RECIPIENT_ADDRESS],
      value: donationAmount,
    });
  }, [fullUrl, isSupported, chainId, switchChainAsync, writeContract, donationAmount]);

  // Update state after transaction
  React.useEffect(() => {
    if (isSuccess) {
      // Track successful support
      trackEvent("blog-support-success", {
        url: fullUrl,
        chainId: readChainId,
      });

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
  }, [isSuccess, writeError, refetch, fullUrl, readChainId]);

  return {
    // State
    supportCount: supportCount?.toString() || "0",
    isLoading: isLoading || isPending || isConfirming,
    isSuccess,
    errorMessage,
    isConnected,
    isReadPending,
    readError,
    // Actions
    handleSupport,
  };
}
