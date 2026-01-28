/**
 * @fretchen/chain-utils
 *
 * Shared chain utilities with CAIP-2 pattern.
 * CAIP-2 format: "eip155:<chainId>" (e.g., "eip155:10" for Optimism)
 */

import { optimism, optimismSepolia, base, baseSepolia } from "viem/chains";
import type { Chain } from "viem";

// ═══════════════════════════════════════════════════════════════
// CAIP-2 Conversion Utilities
// ═══════════════════════════════════════════════════════════════

/**
 * Convert a numeric chain ID to CAIP-2 format.
 * @example toCAIP2(10) → "eip155:10"
 */
export const toCAIP2 = (chainId: number): string => `eip155:${chainId}`;

/**
 * Parse a CAIP-2 string to get the numeric chain ID.
 * @throws Error if the format is invalid
 * @example fromCAIP2("eip155:10") → 10
 */
export const fromCAIP2 = (network: string): number => {
  const match = network.match(/^eip155:(\d+)$/);
  if (!match) {
    throw new Error(`Invalid CAIP-2 format: ${network}`);
  }
  return parseInt(match[1], 10);
};

// ═══════════════════════════════════════════════════════════════
// Supported Networks
// ═══════════════════════════════════════════════════════════════

/** All supported mainnet CAIP-2 identifiers */
export const MAINNET_NETWORKS = ["eip155:10", "eip155:8453"] as const;

/** All supported testnet CAIP-2 identifiers */
export const TESTNET_NETWORKS = ["eip155:11155420", "eip155:84532"] as const;

/** All supported CAIP-2 identifiers */
export const ALL_NETWORKS = [...MAINNET_NETWORKS, ...TESTNET_NETWORKS] as const;

export type MainnetNetwork = (typeof MAINNET_NETWORKS)[number];
export type TestnetNetwork = (typeof TESTNET_NETWORKS)[number];
export type Network = (typeof ALL_NETWORKS)[number];

// ═══════════════════════════════════════════════════════════════
// Viem Chain Mapping
// ═══════════════════════════════════════════════════════════════

const CHAIN_MAP: Record<string, Chain> = {
  "eip155:10": optimism,
  "eip155:11155420": optimismSepolia,
  "eip155:8453": base,
  "eip155:84532": baseSepolia,
};

/**
 * Get the Viem Chain object for a CAIP-2 network identifier.
 * @throws Error if the network is not supported
 */
export function getViemChain(network: string): Chain {
  const chain = CHAIN_MAP[network];
  if (!chain) {
    throw new Error(
      `Unsupported network: ${network}. Supported: ${Object.keys(CHAIN_MAP).join(", ")}`
    );
  }
  return chain;
}

/**
 * Check if a CAIP-2 network identifier is supported.
 */
export function isNetworkSupported(network: string): network is Network {
  return network in CHAIN_MAP;
}

/**
 * Check if a CAIP-2 network identifier is a mainnet.
 */
export function isMainnet(network: string): network is MainnetNetwork {
  return (MAINNET_NETWORKS as readonly string[]).includes(network);
}

/**
 * Check if a CAIP-2 network identifier is a testnet.
 */
export function isTestnet(network: string): network is TestnetNetwork {
  return (TESTNET_NETWORKS as readonly string[]).includes(network);
}

// Re-export addresses
export * from "./addresses";

// ═══════════════════════════════════════════════════════════════
// USDC Configuration
// ═══════════════════════════════════════════════════════════════

import { getUSDCAddress, getUSDCName, type USDCConfig } from "./addresses";

/**
 * Get complete USDC configuration for a CAIP-2 network ID.
 * Used for EIP-712 / EIP-3009 payment verification and settlement.
 *
 * @throws Error if the network is not supported
 * @example
 * const config = getUSDCConfig("eip155:10");
 * // { name: "OP Mainnet", chainId: 10, address: "0x...", decimals: 6, usdcName: "USD Coin", usdcVersion: "2" }
 */
export function getUSDCConfig(network: string): USDCConfig {
  return {
    name: getViemChain(network).name,
    chainId: fromCAIP2(network),
    address: getUSDCAddress(network),
    decimals: 6,
    usdcName: getUSDCName(network),
    usdcVersion: "2",
  };
}

// Re-export USDCConfig type
export type { USDCConfig };

// ═══════════════════════════════════════════════════════════════
// Contract ABIs
// ═══════════════════════════════════════════════════════════════

export * from "./abi";
