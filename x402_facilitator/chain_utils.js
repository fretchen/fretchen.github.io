// @ts-check

/**
 * Chain Utilities for x402 Facilitator
 * Shared functions for network/chain handling
 */

import { optimism, optimismSepolia } from "viem/chains";

/**
 * Convert x402 network identifier to viem chain object
 * @param {string} network - Network ID (eip155:10 or eip155:11155420)
 * @returns {import("viem/chains").Chain} Viem chain object
 * @throws {Error} If network is not supported
 */
export function getChain(network) {
  if (network === "eip155:10") {
    return optimism;
  }
  if (network === "eip155:11155420") {
    return optimismSepolia;
  }
  throw new Error(`Unsupported network: ${network}`);
}

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
 * Get chain configuration including RPC URL and contract addresses
 * @param {string} network - Network ID (eip155:10 or eip155:11155420)
 * @returns {{chain: import("viem/chains").Chain, rpcUrl: string, GENIMG_V4_ADDRESS: string|null, LLMV1_ADDRESS: string|null, SPLITTER_ADDRESS: string|null, USDC_ADDRESS: string, USDC_NAME: string}} Chain config with RPC URL and contract addresses
 * @throws {Error} If network is not supported
 */
export function getChainConfig(network) {
  if (network === "eip155:10") {
    return {
      chain: optimism,
      rpcUrl: getRpcUrl(network),
      GENIMG_V4_ADDRESS: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
      LLMV1_ADDRESS: "0x833F39D6e67390324796f861990ce9B7cf9F5dE1",
      SPLITTER_ADDRESS: null, // Not yet deployed on mainnet
      USDC_ADDRESS: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      USDC_NAME: "USD Coin",
    };
  }
  if (network === "eip155:11155420") {
    return {
      chain: optimismSepolia,
      rpcUrl: getRpcUrl(network),
      GENIMG_V4_ADDRESS: null,
      LLMV1_ADDRESS: null,
      SPLITTER_ADDRESS: "0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946",
      USDC_ADDRESS: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
      USDC_NAME: "USDC",
    };
  }
  throw new Error(`Unsupported network: ${network}`);
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
  const chain = getChain(network);
  return chain.id;
}

/**
 * Get all supported networks
 * @returns {string[]} Array of supported network identifiers
 */
export function getSupportedNetworks() {
  return ["eip155:10", "eip155:11155420"];
}
