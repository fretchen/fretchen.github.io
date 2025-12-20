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
 * Get chain configuration including RPC URL
 * @param {string} network - Network ID (eip155:10 or eip155:11155420)
 * @returns {{chain: import("viem/chains").Chain, rpcUrl: string}} Chain config with RPC URL
 * @throws {Error} If network is not supported
 */
export function getChainConfig(network) {
  if (network === "eip155:10") {
    return {
      chain: optimism,
      rpcUrl: process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io",
      GENIMG_V4_ADDRESS: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
      LLMV1_ADDRESS: "0x833F39D6e67390324796f861990ce9B7cf9F5dE1",
    };
  }
  if (network === "eip155:11155420") {
    return {
      chain: optimismSepolia,
      rpcUrl: process.env.OPTIMISM_SEPOLIA_RPC_URL || "https://sepolia.optimism.io",
      GENIMG_V4_ADDRESS: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
      LLMV1_ADDRESS: "0xB3dbD44477a7bcf253f2fA68eDb4be5aF2F2cA56",
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
