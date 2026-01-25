import * as React from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useChainId } from "wagmi";
import { parseEther } from "viem";
import { useReadContract } from "wagmi";
import {
  getSupportV2Config,
  isSupportV2Chain,
  DEFAULT_SUPPORT_CHAIN,
  SUPPORT_RECIPIENT_ADDRESS,
  SUPPORT_V2_CHAINS,
} from "../utils/getChain";
import { trackEvent } from "../utils/analytics";

/**
 * Custom hook for SupportV2 with multi-chain support
 * - Reads likes from BOTH chains in current mode (mainnet or testnet) and aggregates them
 * - Mode controlled by VITE_USE_TESTNET env variable
 * - Automatic chain switch when user clicks "Support"
 */
export function useSupportAction(url: string) {
  // States
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fullUrl, setFullUrl] = React.useState(url);

  // Wagmi hooks - compare both chainId sources for debugging
  const { isConnected, chainId: accountChainId, connector } = useAccount();
  const wagmiChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const donationAmount = parseEther("0.0002");
  const { writeContract, isPending, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Debug: Log chain IDs on every render
  React.useEffect(() => {
    console.log(
      `[Support] Chain debug - accountChainId: ${accountChainId}, wagmiChainId: ${wagmiChainId}, connector: ${connector?.name}`,
    );
  }, [accountChainId, wagmiChainId, connector]);

  // Use accountChainId as it reflects wallet state
  const chainId = accountChainId ?? wagmiChainId;

  // Set full URL after hydration
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const rawUrl = window.location.origin + url;
      const cleanUrl = rawUrl.replace(/\/+$/, "");
      setFullUrl(cleanUrl);
    }
  }, [url]);

  // ═══════════════════════════════════════════════════════════════
  // AGGREGATED READS: Read likes from BOTH chains in current mode
  // Uses SUPPORT_V2_CHAINS which is either [optimism, base] or
  // [optimismSepolia, baseSepolia] based on VITE_USE_TESTNET
  // ═══════════════════════════════════════════════════════════════

  const chain1Config = getSupportV2Config(SUPPORT_V2_CHAINS[0].id)!;
  const chain2Config = getSupportV2Config(SUPPORT_V2_CHAINS[1].id)!;

  // Read from first chain (Optimism or OP Sepolia)
  const {
    data: chain1Count,
    error: chain1Error,
    isPending: isChain1Pending,
    refetch: refetchChain1,
  } = useReadContract({
    ...chain1Config,
    functionName: "getLikesForUrl",
    args: [fullUrl],
    chainId: SUPPORT_V2_CHAINS[0].id,
    query: { enabled: !!fullUrl },
  });

  // Read from second chain (Base or Base Sepolia)
  const {
    data: chain2Count,
    error: chain2Error,
    isPending: isChain2Pending,
    refetch: refetchChain2,
  } = useReadContract({
    ...chain2Config,
    functionName: "getLikesForUrl",
    args: [fullUrl],
    chainId: SUPPORT_V2_CHAINS[1].id,
    query: { enabled: !!fullUrl },
  });

  // Aggregate counts from both chains
  const aggregatedCount = React.useMemo(() => {
    const count1 = typeof chain1Count === "bigint" ? chain1Count : 0n;
    const count2 = typeof chain2Count === "bigint" ? chain2Count : 0n;
    return count1 + count2;
  }, [chain1Count, chain2Count]);

  // Combined read state
  const isReadPending = isChain1Pending || isChain2Pending;
  const readError = chain1Error || chain2Error;

  // Refetch both chains
  const refetch = React.useCallback(() => {
    refetchChain1();
    refetchChain2();
  }, [refetchChain1, refetchChain2]);

  // Handle support action with automatic chain switch
  const handleSupport = React.useCallback(async () => {
    setErrorMessage(null);
    if (!fullUrl) {
      setErrorMessage("URL ist erforderlich");
      return;
    }

    // Determine which chain to use for the transaction
    // Check support status directly (not from closure) to avoid stale state
    const currentlySupported = chainId ? isSupportV2Chain(chainId) : false;
    let targetChainId = chainId ?? DEFAULT_SUPPORT_CHAIN.id;

    console.log(`[Support] Current chain: ${chainId}, supported: ${currentlySupported}`);

    // Automatic chain switch only if not on a supported chain
    if (!currentlySupported) {
      console.log(`[Support] Chain mismatch: current=${chainId}, switching to ${DEFAULT_SUPPORT_CHAIN.name}`);
      try {
        await switchChainAsync({ chainId: DEFAULT_SUPPORT_CHAIN.id });
        console.log(`[Support] Successfully switched to ${DEFAULT_SUPPORT_CHAIN.name}`);
        targetChainId = DEFAULT_SUPPORT_CHAIN.id;
      } catch (switchError) {
        console.error("[Support] Chain switch failed:", switchError);
        setErrorMessage(`Chain-Wechsel zu ${DEFAULT_SUPPORT_CHAIN.name} fehlgeschlagen`);
        return;
      }
    }

    // Get contract config for the target chain (user's chain if supported, otherwise default)
    const activeConfig = getSupportV2Config(targetChainId);
    if (!activeConfig) {
      setErrorMessage("Konfigurationsfehler");
      return;
    }

    setIsLoading(true);
    console.log(`[Support] Sending donation on chain ${targetChainId} to ${activeConfig.address}`);

    // SupportV2 has recipient parameter
    writeContract({
      ...activeConfig,
      functionName: "donate",
      args: [fullUrl, SUPPORT_RECIPIENT_ADDRESS],
      value: donationAmount,
    });
  }, [fullUrl, chainId, switchChainAsync, writeContract, donationAmount]);

  // Update state after transaction
  React.useEffect(() => {
    if (isSuccess) {
      // Track successful support
      trackEvent("blog-support-success", {
        url: fullUrl,
        chainId: chainId,
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
  }, [isSuccess, writeError, refetch, fullUrl, chainId]);

  return {
    // State - aggregated count from both chains in current mode
    supportCount: aggregatedCount.toString(),
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
