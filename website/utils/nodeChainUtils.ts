/**
 * Node.js-specific chain utilities using pure viem
 * Used for build-time operations like blog generation
 */

import { createPublicClient, http } from "viem";
import { sepolia, optimism, optimismSepolia } from "viem/chains";
import type { Chain, PublicClient } from "viem";
import CollectorNFTv1ABI from "../../eth/abi/contracts/CollectorNFTv1.json";
import GenImNFTv3ABI from "../../eth/abi/contracts/GenImNFTv3.json";
import LLMv1ABI from "../../eth/abi/contracts/LLMv1.json";

/**
 * Get environment variable in Node.js context
 */
function getNodeEnvironmentVariable(defaultValue: string): string {
  if (typeof process !== "undefined" && process.env) {
    return process.env.PUBLIC_ENV__CHAIN_NAME || defaultValue;
  }
  return defaultValue;
}

// Get chain name for Node.js environment
const NODE_CHAIN_NAME = getNodeEnvironmentVariable("optimism");

/**
 * Get the appropriate chain object for Node.js
 */
export function getNodeChain(): Chain {
  switch (NODE_CHAIN_NAME) {
    case "sepolia":
      return sepolia;
    case "optimism":
      return optimism;
    case "optimismSepolia":
      return optimismSepolia;
    default:
      return optimism;
  }
}

/**
 * Create a public client for Node.js environment using pure viem
 */
export function createNodePublicClient(): PublicClient {
  const chain = getNodeChain();
  return createPublicClient({
    chain,
    transport: http(), // Pure viem HTTP transport
  });
}

// Node.js contract configurations - computed once at module load
const NODE_GENAI_NFT_CONTRACT_CONFIG = (() => {
  switch (NODE_CHAIN_NAME) {
    case "sepolia":
      return {
        address: "0xf18E3901D91D8a08380E37A466E6F7f6AA4BD4a6" as `0x${string}`,
        abi: GenImNFTv3ABI,
      } as const;
    case "optimism":
      return {
        address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb" as `0x${string}`,
        abi: GenImNFTv3ABI,
      } as const;
    default:
      return {
        address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb" as `0x${string}`,
        abi: GenImNFTv3ABI,
      } as const;
  }
})();

const NODE_COLLECTOR_NFT_CONTRACT_CONFIG = (() => {
  switch (NODE_CHAIN_NAME) {
    case "sepolia":
      return {
        address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        abi: CollectorNFTv1ABI,
      } as const;
    case "optimism":
      return {
        address: "0x584c40d8a7cA164933b5F90a2dC11ddCB4a924ea" as `0x${string}`,
        abi: CollectorNFTv1ABI,
      } as const;
    case "optimismSepolia":
      return {
        address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        abi: CollectorNFTv1ABI,
      } as const;
    default:
      return {
        address: "0x584c40d8a7cA164933b5F90a2dC11ddCB4a924ea" as `0x${string}`,
        abi: CollectorNFTv1ABI,
      } as const;
  }
})();

const NODE_LLM_V1_CONTRACT_CONFIG = (() => {
  switch (NODE_CHAIN_NAME) {
    case "optimismSepolia":
      return {
        address: "0xB3dbD44477a7bcf253f2fA68eDb4be5aF2F2cA56" as `0x${string}`,
        abi: LLMv1ABI,
      } as const;
    case "optimism":
      return {
        address: "0x833F39D6e67390324796f861990ce9B7cf9F5dE1" as `0x${string}`,
        abi: LLMv1ABI,
      } as const;
    default:
      return {
        address: "0xB3dbD44477a7bcf253f2fA68eDb4be5aF2F2cA56" as `0x${string}`,
        abi: LLMv1ABI,
      } as const;
  }
})();

// Export stable contract configurations for Node.js
export const nodeContractConfigs = {
  genAiNFT: NODE_GENAI_NFT_CONTRACT_CONFIG,
  collectorNFT: NODE_COLLECTOR_NFT_CONTRACT_CONFIG,
  llmV1: NODE_LLM_V1_CONTRACT_CONFIG,
} as const;

// Convenience exports for backward compatibility
export const nodeGenAiNFTContractConfig = NODE_GENAI_NFT_CONTRACT_CONFIG;
export const nodeCollectorNFTContractConfig = NODE_COLLECTOR_NFT_CONTRACT_CONFIG;
export const nodeLlmV1ContractConfig = NODE_LLM_V1_CONTRACT_CONFIG;
