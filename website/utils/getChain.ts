import { sepolia, optimism, optimismSepolia } from "wagmi/chains";
import type { Chain } from "wagmi/chains";
import CollectorNFTv1ABI from "../../eth/abi/contracts/CollectorNFTv1.json";
import GenImNFTv3ABI from "../../eth/abi/contracts/GenImNFTv3.json";
import SupportABI from "../../eth/abi/contracts/Support.json";
import LLMv1ABI from "../../eth/abi/contracts/LLMv1.json";

/**
 * Get PUBLIC_ENV__CHAIN_NAME in both Node.js and Vite contexts
 * only the default value is required now
 */
function getEnvironmentVariable(defaultValue: string): string {
  try {
    // Vite supports only static dot-notation — handle the known key explicitly
    if (typeof import.meta !== "undefined" && import.meta.env) {
      return import.meta.env.PUBLIC_ENV__CHAIN_NAME || defaultValue;
    }
  } catch {
    // Fall through to Node.js check
  }

  try {
    if (typeof process !== "undefined" && process.env) {
      return process.env.PUBLIC_ENV__CHAIN_NAME || defaultValue;
    }
  } catch {
    // Fallback to default
  }

  return defaultValue;
}

// Get chain name once at module load time for stable references
const CHAIN_NAME = getEnvironmentVariable("optimism");

// Create stable contract config references at module level - computed once when module loads
const STABLE_GENAI_NFT_CONTRACT_CONFIG = (() => {
  switch (CHAIN_NAME) {
    case "sepolia":
      return { address: "0xf18E3901D91D8a08380E37A466E6F7f6AA4BD4a6", abi: GenImNFTv3ABI } as const;
    case "optimism":
      return { address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb", abi: GenImNFTv3ABI } as const;
    default:
      return { address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb", abi: GenImNFTv3ABI } as const;
  }
})();

const STABLE_SUPPORT_CONTRACT_CONFIG = (() => {
  switch (CHAIN_NAME) {
    case "sepolia":
      return { address: "0xf137ca5dc45e3d0336ac2daa26084b0eaf244684", abi: SupportABI } as const;
    case "optimism":
      return { address: "0x314B07fBd33A7343479e99E6682D5Ee1da7F17c1", abi: SupportABI } as const;
    case "optimismSepolia":
      return { address: "0x314B07fBd33A7343479e99E6682D5Ee1da7F17c1", abi: SupportABI } as const;
    default:
      return { address: "0x314B07fBd33A7343479e99E6682D5Ee1da7F17c1", abi: SupportABI } as const;
  }
})();

const STABLE_COLLECTOR_NFT_CONTRACT_CONFIG = (() => {
  switch (CHAIN_NAME) {
    case "sepolia":
      // Sepolia testnet address (if deployed)
      return { address: "0x0000000000000000000000000000000000000000", abi: CollectorNFTv1ABI } as const;
    case "optimism":
      // Production Optimism address - CollectorNFTv1 deployed on 2025-06-15
      return { address: "0x584c40d8a7cA164933b5F90a2dC11ddCB4a924ea", abi: CollectorNFTv1ABI } as const;
    case "optimismSepolia":
      // Optimism Sepolia testnet address (if deployed)
      return { address: "0x0000000000000000000000000000000000000000", abi: CollectorNFTv1ABI } as const;
    default:
      return { address: "0x584c40d8a7cA164933b5F90a2dC11ddCB4a924ea", abi: CollectorNFTv1ABI } as const;
  }
})();

const STABLE_LLM_V1_CONTRACT_CONFIG = (() => {
  switch (CHAIN_NAME) {
    case "optimismSepolia":
      return {
        address: "0xB3dbD44477a7bcf253f2fA68eDb4be5aF2F2cA56" as `0x${string}`,
        abi: LLMv1ABI,
      } as const;
    case "optimism":
      return { address: "0x833F39D6e67390324796f861990ce9B7cf9F5dE1" as `0x${string}`, abi: LLMv1ABI } as const;
    default:
      return {
        address: "0xB3dbD44477a7bcf253f2fA68eDb4be5aF2F2cA56" as `0x${string}`,
        abi: LLMv1ABI,
      } as const;
  }
})();

// Export stable references directly - these objects never change reference
export const genAiNFTContractConfig = STABLE_GENAI_NFT_CONTRACT_CONFIG;
export const supportContractConfig = STABLE_SUPPORT_CONTRACT_CONFIG;
export const collectorNFTContractConfig = STABLE_COLLECTOR_NFT_CONTRACT_CONFIG;
export const llmV1ContractConfig = STABLE_LLM_V1_CONTRACT_CONFIG;

/**
 * Gibt das entsprechende Chain-Objekt basierend auf der CHAIN-Umgebungsvariable zurück
 * @returns Das Chain-Objekt aus wagmi/chains
 */
export function getChain(): Chain {
  // Chain-Objekt je nach Umgebungsvariable auswählen
  switch (CHAIN_NAME) {
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

// Legacy functions for backward compatibility - use the stable constants instead
/** @deprecated Use genAiNFTContractConfig constant instead for stable references */
export function getGenAiNFTContractConfig() {
  return genAiNFTContractConfig;
}

/** @deprecated Use supportContractConfig constant instead for stable references */
export function getSupportContractConfig() {
  return supportContractConfig;
}

/** @deprecated Use collectorNFTContractConfig constant instead for stable references */
export function getCollectorNFTContractConfig() {
  return collectorNFTContractConfig;
}

/** @deprecated Use llmV1ContractConfig constant instead for stable references */
export function getLLMv1ContractConfig() {
  return llmV1ContractConfig;
}
