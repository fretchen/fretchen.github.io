// @ts-check

/**
 * Chain Utilities for x402 Facilitator
 * Shared functions for network/chain handling
 *
 * Uses @fretchen/chain-utils for chain/address data,
 * adds local RPC URL handling and facilitator-specific config.
 */

import {
  getViemChain,
  fromCAIP2,
  getGenAiNFTAddress,
  getLLMv1Address,
  getEIP3009SplitterAddress,
  getUSDCAddress,
  getUSDCName,
} from "@fretchen/chain-utils";

// Re-export getViemChain as getChain for backward compatibility
export { getViemChain as getChain };

/**
 * Get RPC URL for a network with fallback handling
 *
 * Environment Variable Behavior:
 * - undefined/not set → Uses default public endpoint
 * - empty string "" → Treated as undefined (via .trim())
 * - whitespace " " → Treated as undefined (via .trim())
 * - valid URL → Uses custom endpoint
 *
 * This centralizes RPC URL logic and ensures consistent fallback behavior
 * across all facilitator functions. For production deployments, set custom
 * RPC URLs via OPTIMISM_RPC_URL and OPTIMISM_SEPOLIA_RPC_URL environment
 * variables to avoid rate limits on public endpoints.
 *
 * @param {string} network - Network ID (eip155:10 or eip155:11155420)
 * @returns {string} RPC URL to use for this network
 * @throws {Error} If network is not supported
 */
export function getRpcUrl(network) {
  if (network === "eip155:10") {
    const customRpcUrl = process.env.OPTIMISM_RPC_URL?.trim();
    return customRpcUrl || "https://mainnet.optimism.io";
  }
  if (network === "eip155:11155420") {
    const customRpcUrl = process.env.OPTIMISM_SEPOLIA_RPC_URL?.trim();
    return customRpcUrl || "https://sepolia.optimism.io";
  }
  throw new Error(`Unsupported network: ${network}`);
}

/**
 * Safely get an address, returning null if not deployed
 * @param {function(string): string} getter - Address getter function
 * @param {string} network - Network ID
 * @returns {string|null} Address or null if not deployed
 */
function safeGetAddress(getter, network) {
  try {
    return getter(network);
  } catch {
    return null;
  }
}

/**
 * Get chain configuration including RPC URL and contract addresses
 * @param {string} network - Network ID (eip155:10 or eip155:11155420)
 * @returns {{chain: import("viem/chains").Chain, rpcUrl: string, GENIMG_V4_ADDRESS: string|null, LLMV1_ADDRESS: string|null, SPLITTER_ADDRESS: string|null, USDC_ADDRESS: string, USDC_NAME: string}} Chain config with RPC URL and contract addresses
 * @throws {Error} If network is not supported
 */
export function getChainConfig(network) {
  return {
    chain: getViemChain(network),
    rpcUrl: getRpcUrl(network),
    GENIMG_V4_ADDRESS: safeGetAddress(getGenAiNFTAddress, network),
    LLMV1_ADDRESS: safeGetAddress(getLLMv1Address, network),
    SPLITTER_ADDRESS: safeGetAddress(getEIP3009SplitterAddress, network),
    USDC_ADDRESS: getUSDCAddress(network),
    USDC_NAME: getUSDCName(network),
  };
}

/**
 * Token information for supported networks
 */
export const TOKEN_INFO = {
  // Optimism Mainnet
  "eip155:10": {
    "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85": {
      address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      version: "2",
    },
  },
  // Optimism Sepolia
  "eip155:11155420": {
    "0x5fd84259d66Cd46123540766Be93DFE6D43130D7": {
      address: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
      symbol: "USDC",
      name: "USDC",
      decimals: 6,
      version: "2",
    },
  },
};

/**
 * Get token information for a specific token on a network
 * @param {string} network - Network ID
 * @param {string} tokenAddress - Token contract address
 * @returns {Object} Token information
 * @throws {Error} If token is not supported
 */
export function getTokenInfo(network, tokenAddress) {
  const networkTokens = TOKEN_INFO[network];
  if (!networkTokens) {
    throw new Error(`Unsupported network: ${network}`);
  }

  const tokenInfo = networkTokens[tokenAddress];
  if (!tokenInfo) {
    throw new Error(`Unsupported token: ${tokenAddress} on network ${network}`);
  }

  return tokenInfo;
}

/**
 * Convert CAIP-2 network identifier to numeric chainId
 * @param {string} network - Network ID (eip155:10 or eip155:11155420)
 * @returns {number} Numeric chainId
 * @throws {Error} If network is not supported
 */
export function getChainId(network) {
  return fromCAIP2(network);
}

/**
 * Get all supported networks
 * @returns {string[]} Array of supported network identifiers
 */
export function getSupportedNetworks() {
  return ["eip155:10", "eip155:11155420"];
}
