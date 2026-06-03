import * as React from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useChainId,
  useReadContracts,
} from "wagmi";
import { parseEther } from "viem";
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

  // Wagmi hooks
  const { isConnected, chainId: accountChainId } = useAccount();
  const wagmiChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const donationAmount = parseEther("0.0002");
  const { writeContract, isPending, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Use accountChainId as it reflects wallet state
  const chainId = accountChainId ?? wagmiChainId;

  // Compute full URL during render; safe since window.location.origin is stable
  const fullUrl = typeof window !== "undefined" ? (window.location.origin + url).replace(/\/+$/, "") : url;

  // ═══════════════════════════════════════════════════════════════
  // AGGREGATED READS: Read likes from ALL chains in current mode
  // Uses SUPPORT_V2_CHAINS which is either [optimism, base, ...] or
  // [optimismSepolia, baseSepolia, ...] based on VITE_USE_TESTNET
  // Scales automatically to any number of chains!
  // ═══════════════════════════════════════════════════════════════

  // Build contract read configs for all supported chains
  const readContracts = React.useMemo(
    () =>
      SUPPORT_V2_CHAINS.map((chain) => {
        const config = getSupportV2Config(chain.id)!;
        return {
          ...config,
          functionName: "getLikesForUrl" as const,
          args: [fullUrl] as const,
          chainId: chain.id,
        };
      }),
    [fullUrl],
  );

  // Single hook reads from ALL chains via multicall
  const {
    data: chainResults,
    error: readError,
    isPending: isReadPending,
    refetch,
  } = useReadContracts({
    contracts: readContracts,
    query: { enabled: !!fullUrl },
  });

  // Aggregate counts from all chains
  const aggregatedCount = chainResults
    ? chainResults.reduce((sum, result) => {
        if (result.status === "success" && typeof result.result === "bigint") {
          return sum + result.result;
        }
        return sum;
      }, 0n)
    : 0n;

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

    // Automatic chain switch only if not on a supported chain
    if (!currentlySupported) {
      try {
        await switchChainAsync({ chainId: DEFAULT_SUPPORT_CHAIN.id });
        targetChainId = DEFAULT_SUPPORT_CHAIN.id;
      } catch {
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

    // SupportV2 has recipient parameter
    writeContract({
      ...activeConfig,
      functionName: "donate",
      args: [fullUrl, SUPPORT_RECIPIENT_ADDRESS],
      value: donationAmount,
    });
  }, [fullUrl, chainId, switchChainAsync, writeContract, donationAmount]);

  // Side effects after transaction: analytics + refetch (no setErrorMessage here)
  React.useEffect(() => {
    if (isSuccess) {
      trackEvent("blog-support-success", { url: fullUrl, chainId: chainId });
      setIsLoading(false);
      setErrorMessage(null);
      setTimeout(() => {
        void refetch();
      }, 2000);
    }
    if (writeError) {
      setIsLoading(false);
      // writeError.message is merged at the return site — no setState needed
    }
  }, [isSuccess, writeError, refetch, fullUrl, chainId]);

  return {
    // State - aggregated count from both chains in current mode
    supportCount: aggregatedCount.toString(),
    isLoading: isLoading || isPending || isConfirming,
    isSuccess,
    errorMessage: errorMessage ?? writeError?.message ?? null,
    isConnected,
    isReadPending,
    readError,
    // Actions
    handleSupport,
  };
}
