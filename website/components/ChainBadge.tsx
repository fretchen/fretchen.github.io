import React from "react";
import { css } from "../styled-system/css";

/**
 * Chain metadata for display purposes
 */
interface ChainInfo {
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
}

const CHAIN_INFO: Record<string, ChainInfo> = {
  "eip155:10": {
    name: "Optimism",
    shortName: "OP",
    color: "#FF0420",
    bgColor: "rgba(255, 4, 32, 0.9)",
  },
  "eip155:8453": {
    name: "Base",
    shortName: "Base",
    color: "#0052FF",
    bgColor: "rgba(0, 82, 255, 0.9)",
  },
  "eip155:11155420": {
    name: "OP Sepolia",
    shortName: "OPS",
    color: "#FF0420",
    bgColor: "rgba(255, 4, 32, 0.7)",
  },
  "eip155:84532": {
    name: "Base Sepolia",
    shortName: "BaseS",
    color: "#0052FF",
    bgColor: "rgba(0, 82, 255, 0.7)",
  },
};

/**
 * Get human-readable chain name from CAIP-2 identifier
 */
export function getChainName(network: string): string {
  return CHAIN_INFO[network]?.name ?? network;
}

/**
 * Get short chain name (2-4 chars) from CAIP-2 identifier
 */
export function getChainShortName(network: string): string {
  return CHAIN_INFO[network]?.shortName ?? "?";
}

interface ChainBadgeProps {
  /** CAIP-2 network identifier (e.g., "eip155:10") */
  network: string;
  /** Size variant */
  size?: "sm" | "md";
  /** Position variant for absolute positioning on cards */
  position?: "bottom-right" | "top-left" | "inline";
}

const badgeBase = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  fontWeight: "600",
  borderRadius: "full",
  backdropFilter: "blur(4px)",
  border: "1px solid rgba(255,255,255,0.2)",
  color: "white",
  whiteSpace: "nowrap",
});

const badgeSm = css({
  fontSize: "10px",
  padding: "2px 6px",
});

const badgeMd = css({
  fontSize: "12px",
  padding: "4px 8px",
});

const positionBottomRight = css({
  position: "absolute",
  bottom: "8px",
  right: "8px",
  zIndex: 10,
});

const positionTopLeft = css({
  position: "absolute",
  top: "8px",
  left: "8px",
  zIndex: 10,
});

/**
 * Small chain indicator badge
 *
 * Shows the chain name (OP/Base) with appropriate brand colors.
 * Used on NFT cards to indicate which chain the NFT is on.
 */
export function ChainBadge({ network, size = "sm", position = "bottom-right" }: ChainBadgeProps) {
  const chainInfo = CHAIN_INFO[network];

  if (!chainInfo) {
    return null;
  }

  const sizeClass = size === "sm" ? badgeSm : badgeMd;
  const positionClass =
    position === "bottom-right" ? positionBottomRight : position === "top-left" ? positionTopLeft : "";

  return (
    <span
      className={`${badgeBase} ${sizeClass} ${positionClass}`}
      style={{ backgroundColor: chainInfo.bgColor }}
      title={chainInfo.name}
    >
      {chainInfo.shortName}
    </span>
  );
}

/**
 * Inline chain info for modals and detail views
 */
interface ChainInfoDisplayProps {
  network: string;
  tokenId?: bigint;
}

const infoRow = css({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "14px",
  color: "gray.600",
  marginTop: "8px",
});

const infoLabel = css({
  fontWeight: "500",
});

export function ChainInfoDisplay({ network, tokenId }: ChainInfoDisplayProps) {
  const chainInfo = CHAIN_INFO[network];

  if (!chainInfo) {
    return null;
  }

  return (
    <div className={infoRow}>
      <span className={infoLabel}>Network:</span>
      <ChainBadge network={network} size="md" position="inline" />
      {tokenId !== undefined && (
        <>
          <span className={infoLabel} style={{ marginLeft: "12px" }}>
            Token:
          </span>
          <span>#{tokenId.toString()}</span>
        </>
      )}
    </div>
  );
}
