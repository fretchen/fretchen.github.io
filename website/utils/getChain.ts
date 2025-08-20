import { sepolia, optimism, optimismSepolia } from "wagmi/chains";
import type { Chain } from "wagmi/chains";
import { CollectorNFTv1ABI } from "../../eth/abi/contracts/CollectorNFTv1";
import { GenImNFTv3ABI } from "../../eth/abi/contracts/GenImNFTv3";
import { SupportABI } from "../../eth/abi/contracts/Support";
import { LLMv1ABI } from "../../eth/abi/contracts/LLMv1";

/**
 * Get environment variable in both Node.js and Vite contexts
 */
function getEnvironmentVariable(key: string, defaultValue: string): string {
  try {
    // Try Vite environment (browser/build context)
    if (typeof import.meta !== "undefined" && import.meta.env) {
      return import.meta.env[key] || defaultValue;
    }
  } catch {
    // Fallback to Node.js environment
  }

  try {
    // Try Node.js environment
    if (typeof process !== "undefined" && process.env) {
      return process.env[key] || defaultValue;
    }
  } catch {
    // Fallback to default
  }

  return defaultValue;
}

/**
 * Gibt das entsprechende Chain-Objekt basierend auf der CHAIN-Umgebungsvariable zurück
 * @returns Das Chain-Objekt aus wagmi/chains
 */
export function getChain(): Chain {
  // Environmentvariable lesen, Fallback auf 'optimism'
  const chainName = getEnvironmentVariable("PUBLIC_ENV__CHAIN_NAME", "optimism");
  // Chain-Objekt je nach Umgebungsvariable auswählen
  switch (chainName) {
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

export function getGenAiNFTContractConfig() {
  const chainName = getEnvironmentVariable("PUBLIC_ENV__CHAIN_NAME", "optimism");
  // ChainConfig based on Env Variable
  switch (chainName) {
    case "sepolia":
      return { address: "0xf18E3901D91D8a08380E37A466E6F7f6AA4BD4a6", abi: GenImNFTv3ABI } as const;
    case "optimism":
      return { address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb", abi: GenImNFTv3ABI } as const;
    default:
      return { address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb", abi: GenImNFTv3ABI } as const;
  }
}

export function getSupportContractConfig() {
  const chainName = getEnvironmentVariable("PUBLIC_ENV__CHAIN_NAME", "optimism");
  // ChainConfig based on Env Variable
  switch (chainName) {
    case "sepolia":
      return { address: "0xf137ca5dc45e3d0336ac2daa26084b0eaf244684", abi: SupportABI } as const;
    case "optimism":
      return { address: "0x314B07fBd33A7343479e99E6682D5Ee1da7F17c1", abi: SupportABI } as const;
    case "optimismSepolia":
      return { address: "0x314B07fBd33A7343479e99E6682D5Ee1da7F17c1", abi: SupportABI } as const;
    default:
      return { address: "0x314B07fBd33A7343479e99E6682D5Ee1da7F17c1", abi: SupportABI } as const;
  }
}

export function getCollectorNFTContractConfig() {
  const chainName = getEnvironmentVariable("PUBLIC_ENV__CHAIN_NAME", "optimism");
  // ChainConfig based on Env Variable
  switch (chainName) {
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
}

/**
 * Get LLMv1 contract configuration for chat functionality
 */
export function getLLMv1ContractConfig() {
  const chainName = getEnvironmentVariable("PUBLIC_ENV__CHAIN_NAME", "optimism");

  switch (chainName) {
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
}
