import React, { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { formatUnits, parseUnits, type Address } from "viem";
import { css } from "../styled-system/css";
import { getUSDCConfig, fromCAIP2, type USDCConfig } from "@fretchen/chain-utils";

// Minimal ERC-20 ABI for allowance + approve
export const ERC20_ABI = [
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// Supported networks for approval
export const APPROVAL_NETWORKS = [
  { network: "eip155:10", label: "Optimism" },
  { network: "eip155:8453", label: "Base" },
] as const;

export const APPROVAL_NETWORKS_WITH_TESTNETS = [
  ...APPROVAL_NETWORKS,
  { network: "eip155:11155420", label: "OP Sepolia" },
  { network: "eip155:84532", label: "Base Sepolia" },
] as const;

// Preset approval amounts
const PRESETS = [
  { label: "1 USDC", value: "1" },
  { label: "10 USDC", value: "10" },
];

/** Resolve the USDC config for a CAIP-2 network string. Returns null if unsupported. */
export function getNetworkUSDCConfig(network: string): USDCConfig | null {
  try {
    return getUSDCConfig(network);
  } catch {
    return null;
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const container = css({
  border: "1px solid token(colors.border, #e5e7eb)",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "6",
  backgroundColor: "token(colors.codeBg, #f9fafb)",
});

const statusRow = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "4",
});

const label = css({
  fontSize: "sm",
  color: "#6b7280",
  fontWeight: "medium",
});

const valueText = css({
  fontSize: "lg",
  fontWeight: "semibold",
});

const approveRow = css({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
});

const presetButton = css({
  padding: "6px 12px",
  fontSize: "sm",
  borderRadius: "6px",
  border: "1px solid token(colors.border, #d1d5db)",
  backgroundColor: "white",
  cursor: "pointer",
  fontWeight: "medium",
  transition: "all 0.15s",
  _hover: {
    backgroundColor: "#f3f4f6",
    borderColor: "#9ca3af",
  },
  _disabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
});

const activeButton = css({
  backgroundColor: "#2563eb",
  color: "white",
  borderColor: "#2563eb",
  _hover: {
    backgroundColor: "#1d4ed8",
  },
});

const selectedNetworkButton = css({
  backgroundColor: "#1e293b",
  color: "white",
  borderColor: "#1e293b",
  _hover: {
    backgroundColor: "#334155",
  },
});

const txStatus = css({
  fontSize: "sm",
  marginTop: "3",
  padding: "8px 12px",
  borderRadius: "6px",
});

const connectHint = css({
  fontSize: "sm",
  color: "#6b7280",
  textAlign: "center",
  padding: "12px",
});

const networkRow = css({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  marginBottom: "4",
});

// ─── Component ───────────────────────────────────────────────────────────────

interface FacilitatorApprovalProps {
  facilitatorAddress?: Address | null;
  showTestnets?: boolean;
}

export function FacilitatorApproval({ facilitatorAddress: propAddress, showTestnets = false }: FacilitatorApprovalProps) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [facilitatorAddress, setFacilitatorAddress] = useState<Address | null>(propAddress ?? null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const networks = showTestnets ? APPROVAL_NETWORKS_WITH_TESTNETS : APPROVAL_NETWORKS;
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0].network);

  const usdcConfig = getNetworkUSDCConfig(selectedNetwork);
  const targetChainId = usdcConfig ? usdcConfig.chainId : fromCAIP2(selectedNetwork);

  // Fetch facilitator address from /supported if not provided via props
  useEffect(() => {
    if (propAddress) {
      setFacilitatorAddress(propAddress);
      return;
    }

    const controller = new AbortController();
    fetch("https://facilitator.fretchen.eu/supported", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        // Extract facilitator address from fee extension
        const feeExt = json.extensions?.find((ext: Record<string, unknown>) => ext.name === "facilitator_fee");
        const recipient = (feeExt as Record<string, Record<string, string>>)?.fee?.recipient;
        if (recipient) {
          setFacilitatorAddress(recipient as Address);
        } else {
          setFetchError("Facilitator address not found in /supported response");
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setFetchError(err.message);
        }
      });
    return () => controller.abort();
  }, [propAddress]);

  // Read current allowance — uses the correct USDC address for the selected network
  const {
    data: allowance,
    isLoading: isReadingAllowance,
    refetch: refetchAllowance,
  } = useReadContract({
    address: usdcConfig?.address as Address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && facilitatorAddress ? [address, facilitatorAddress] : undefined,
    chainId: targetChainId,
    query: {
      enabled: !!address && !!facilitatorAddress && !!usdcConfig,
    },
  });

  // Write approve
  const { writeContract, isPending: isApproving, data: txHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Refetch allowance after successful approval
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => refetchAllowance(), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, refetchAllowance]);

  const handleApprove = async (amount: string) => {
    if (!facilitatorAddress || !address || !usdcConfig) return;

    // Switch chain if needed
    if (chainId !== targetChainId) {
      try {
        await switchChainAsync({ chainId: targetChainId });
      } catch {
        return; // User rejected switch
      }
    }

    writeContract({
      address: usdcConfig.address,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [facilitatorAddress, parseUnits(amount, usdcConfig.decimals)],
      chainId: targetChainId,
    });
  };

  // ─── Render ──────────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <div className={container}>
        <p className={label}>Could not load facilitator address: {fetchError}</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={container}>
        <p className={connectHint}>Connect your wallet to check and manage your USDC approval for the facilitator.</p>
      </div>
    );
  }

  if (!usdcConfig) {
    return (
      <div className={container}>
        <p className={label}>USDC is not available on the selected network.</p>
      </div>
    );
  }

  const formattedAllowance = allowance !== undefined ? formatUnits(allowance as bigint, usdcConfig.decimals) : "—";

  const hasAllowance = allowance !== undefined && (allowance as bigint) > 0n;

  return (
    <div className={container}>
      {/* Network selector */}
      <p className={label} style={{ marginBottom: "8px" }}>
        Network:
      </p>
      <div className={networkRow}>
        {networks.map((net) => (
          <button
            key={net.network}
            className={`${presetButton} ${selectedNetwork === net.network ? selectedNetworkButton : ""}`}
            onClick={() => setSelectedNetwork(net.network)}
          >
            {net.label}
          </button>
        ))}
      </div>

      {/* Allowance display */}
      <div className={statusRow}>
        <div>
          <p className={label}>
            Your current USDC approval on {usdcConfig.name}
          </p>
          <p className={`${valueText} ${hasAllowance ? css({ color: "#166534" }) : css({ color: "#6b7280" })}`}>
            {isReadingAllowance ? "Loading…" : `${formattedAllowance} USDC`}
          </p>
        </div>
        {facilitatorAddress && (
          <div>
            <p className={label}>Facilitator address</p>
            <p className={css({ fontSize: "xs", fontFamily: "monospace", color: "#374151" })}>{facilitatorAddress}</p>
          </div>
        )}
      </div>

      {/* USDC contract info */}
      <p className={css({ fontSize: "xs", color: "#9ca3af", marginBottom: "3" })}>
        USDC on {usdcConfig.name}: <code>{usdcConfig.address}</code>
      </p>

      {/* Approve buttons */}
      <p className={label} style={{ marginBottom: "8px" }}>
        Approve USDC spending:
      </p>
      <div className={approveRow}>
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            className={presetButton}
            disabled={isApproving || isConfirming || !facilitatorAddress}
            onClick={() => handleApprove(preset.value)}
          >
            {preset.label}
          </button>
        ))}
        <button
          className={`${presetButton} ${activeButton}`}
          disabled={isApproving || isConfirming || !facilitatorAddress}
          onClick={() => handleApprove("0")}
        >
          Revoke
        </button>
      </div>

      {(isApproving || isConfirming) && (
        <div className={`${txStatus} ${css({ backgroundColor: "#eff6ff", color: "#1e40af" })}`}>
          {isApproving ? "⏳ Confirm in your wallet…" : "⏳ Waiting for confirmation…"}
        </div>
      )}

      {isSuccess && (
        <div className={`${txStatus} ${css({ backgroundColor: "#dcfce7", color: "#166534" })}`}>
          ✓ Approval updated successfully
        </div>
      )}
    </div>
  );
}
