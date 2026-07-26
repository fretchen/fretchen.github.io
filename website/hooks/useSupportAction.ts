import * as React from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useChainId,
  useReadContracts,
  useWalletClient,
} from "wagmi";
import {
  getUSDCConfig,
  toCAIP2,
  buildTransferWithAuthorizationTypedData,
  randomAuthorizationNonce,
  splitAuthorizationSignature,
} from "@fretchen/chain-utils";
import {
  getSupportV2Config,
  isSupportV2Chain,
  DEFAULT_SUPPORT_CHAIN,
  SUPPORT_RECIPIENT_ADDRESS,
  SUPPORT_V2_CHAINS,
} from "../utils/getChain";
import { trackEvent } from "../utils/analytics";
import { useLocale } from "./useLocale";

// Fixed donation amount: 0.50 USDC (6 decimals)
const DONATION_AMOUNT_USDC = 500000n;

/**
 * Custom hook for SupportV2 with multi-chain support
 * - Reads likes from BOTH chains in current mode (mainnet or testnet) and aggregates them
 * - Mode controlled by VITE_USE_TESTNET env variable
 * - Donates in USDC via EIP-3009 transferWithAuthorization (donateToken) — no ETH needed for
 *   the donation itself, only for gas. Donates on whichever supported chain the wallet is
 *   already on. Never auto-switches: an unsupported chain (e.g. Ethereum mainnet) surfaces
 *   as `isOnSupportedChain: false` for the UI to explain, with `switchToSupportedChain` as
 *   an explicit opt-in action — a blind switch would likely just move the user to a chain
 *   they have no USDC on, turning one confusing failure into another.
 */
export function useSupportAction(url: string) {
  // errorMessage tracks chain-switch/signing failures and config errors from handleSupport
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  // Captures the chain used at write time so the analytics effect reads a stable value
  const txChainIdRef = React.useRef<number | undefined>(undefined);

  // Localized error strings
  const errorUrlRequired = useLocale({ label: "metadataLine.errorUrlRequired" });
  const errorWalletNotConnected = useLocale({ label: "metadataLine.errorWalletNotConnected" });
  const errorChainSwitchFailed = useLocale({ label: "metadataLine.errorChainSwitchFailed" });
  const errorConfig = useLocale({ label: "metadataLine.errorConfig" });
  const errorUsdcUnavailable = useLocale({ label: "metadataLine.errorUsdcUnavailable" });
  const errorSignatureRejected = useLocale({ label: "metadataLine.errorSignatureRejected" });
  const modalBody = useLocale({ label: "metadataLine.modalBody" });

  // Wagmi hooks
  const { isConnected, chainId: accountChainId, address } = useAccount();
  const wagmiChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
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

  // Whether the wallet is currently on a chain SupportV2 is deployed on (Optimism/Base).
  // Exposed so the UI can show guidance BEFORE any wallet action is attempted, instead of
  // silently firing a chain-switch popup for a chain the user has no USDC on.
  const isOnSupportedChain = chainId ? isSupportV2Chain(chainId) : false;

  // Explicit, opt-in chain switch — never called automatically. The user should understand
  // why they're switching (via the UI guidance) before the wallet prompt appears.
  const switchToSupportedChain = React.useCallback(async () => {
    setErrorMessage(null);
    try {
      await switchChainAsync({ chainId: DEFAULT_SUPPORT_CHAIN.id });
    } catch {
      setErrorMessage(errorChainSwitchFailed.replace("{chain}", DEFAULT_SUPPORT_CHAIN.name));
    }
  }, [switchChainAsync, errorChainSwitchFailed]);

  // Handle support action: sign an EIP-3009 USDC authorization, then submit donateToken.
  // Donates on whichever supported chain the wallet is already on. Does NOT auto-switch —
  // an unsupported chain is a UI-guidance case (see isOnSupportedChain / switchToSupportedChain),
  // not something to silently work around, since the user's USDC may not even be on the
  // target chain and a blind switch would likely just lead to a confusing failed donation.
  const handleSupport = React.useCallback(async () => {
    setErrorMessage(null);
    if (!fullUrl) {
      setErrorMessage(errorUrlRequired);
      return;
    }
    if (!address || !walletClient) {
      setErrorMessage(errorWalletNotConnected);
      return;
    }

    // Check support status directly (not from closure) to avoid stale state.
    // Normally the caller (MetadataLine) checks isOnSupportedChain and shows the guided
    // modal BEFORE calling handleSupport, so this is a defensive fallback (e.g. chain
    // changed between render and click) — reuse the modal's own plain-language copy
    // rather than a separate message.
    if (!isSupportV2Chain(chainId)) {
      setErrorMessage(modalBody);
      return;
    }
    const targetChainId = chainId;

    const resolvedConfig = getSupportV2Config(targetChainId);
    if (!resolvedConfig) {
      setErrorMessage(errorConfig);
      return;
    }

    let usdcConfig;
    try {
      usdcConfig = getUSDCConfig(toCAIP2(targetChainId));
    } catch {
      setErrorMessage(errorUsdcUnavailable);
      return;
    }

    // Build and sign the EIP-3009 authorization (donor -> recipient, single-use nonce)
    const nonce = randomAuthorizationNonce();
    const validAfter = 0n;
    const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour window

    const typedData = buildTransferWithAuthorizationTypedData(usdcConfig, {
      from: address,
      to: SUPPORT_RECIPIENT_ADDRESS,
      value: DONATION_AMOUNT_USDC,
      validAfter,
      validBefore,
      nonce,
    });

    let signature: `0x${string}`;
    try {
      signature = await walletClient.signTypedData({ account: address, ...typedData });
    } catch {
      setErrorMessage(errorSignatureRejected);
      return;
    }

    const { v, r, s } = splitAuthorizationSignature(signature);

    // Capture chain at write time; read in the effect to avoid chainId dep causing re-fires
    txChainIdRef.current = targetChainId;

    writeContract({
      ...resolvedConfig,
      functionName: "donateToken",
      args: [
        fullUrl,
        SUPPORT_RECIPIENT_ADDRESS,
        usdcConfig.address,
        DONATION_AMOUNT_USDC,
        validAfter,
        validBefore,
        nonce,
        v,
        r,
        s,
      ],
      chainId: targetChainId,
    });
  }, [
    fullUrl,
    address,
    walletClient,
    chainId,
    writeContract,
    errorUrlRequired,
    errorWalletNotConnected,
    modalBody,
    errorConfig,
    errorUsdcUnavailable,
    errorSignatureRejected,
  ]);

  // Side effects after transaction: analytics + refetch
  React.useEffect(() => {
    if (isSuccess) {
      trackEvent("blog-support-success", { url: fullUrl, chainId: txChainIdRef.current });
      void refetch();
    }
  }, [isSuccess, writeError, refetch, fullUrl]);

  return {
    // State - aggregated count from both chains in current mode
    supportCount: aggregatedCount.toString(),
    isLoading: isPending || isConfirming,
    isSuccess,
    errorMessage: errorMessage ?? writeError?.message ?? null,
    isConnected,
    isReadPending,
    readError,
    isOnSupportedChain,
    // Actions
    handleSupport,
    switchToSupportedChain,
  };
}
