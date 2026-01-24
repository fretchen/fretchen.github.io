import { sepolia, optimism, optimismSepolia, base, baseSepolia } from "wagmi/chains";
import type { Chain } from "wagmi/chains";
import CollectorNFTv1ABI from "../../eth/abi/contracts/CollectorNFTv1.json";
import GenImNFTv3ABI from "../../eth/abi/contracts/GenImNFTv3.json";
import SupportV2ABI from "../../eth/abi/contracts/SupportV2.json";
import LLMv1ABI from "../../eth/abi/contracts/LLMv1.json";

/**
 * Get PUBLIC_ENV__CHAIN_NAME in Vite context (Browser)
 * Direct inline implementation for simplicity
 */
const CHAIN_NAME = import.meta.env?.PUBLIC_ENV__CHAIN_NAME || "optimism";

// ═══════════════════════════════════════════════════════════════
// SupportV2: Multi-Chain Configuration
// ═══════════════════════════════════════════════════════════════

/** SupportV2 contract addresses per chain */
const SUPPORT_V2_ADDRESSES: Record<number, `0x${string}`> = {
  // Testnets
  [optimismSepolia.id]: "0x9859431b682e861b19e87Db14a04944BC747AB6d",
  [baseSepolia.id]: "0xaB44BE78499721b593a0f4BE2099b246e9C53B57",
  // Mainnets (Phase 4 - nach Deployment ausfüllen)
  // [optimism.id]: "0x...",
  // [base.id]: "0x...",
};

/** Default chain for read operations and auto-switch target */
export const DEFAULT_SUPPORT_CHAIN = optimismSepolia;

/** Recipient wallet for donations */
export const SUPPORT_RECIPIENT_ADDRESS = "0x073f26F0C3FC100e7b075C3DC3cDE0A777497D20" as const;

/**
 * Get SupportV2 contract config for a specific chain
 * @param chainId - The chain ID to get config for
 * @returns Contract config or null if chain not supported
 */
export function getSupportV2Config(chainId: number) {
  const address = SUPPORT_V2_ADDRESSES[chainId];
  if (!address) return null;

  return {
    address,
    abi: SupportV2ABI,
  } as const;
}

/**
 * Check if a chain supports SupportV2
 */
export function isSupportV2Chain(chainId: number): boolean {
  return chainId in SUPPORT_V2_ADDRESSES;
}

// ═══════════════════════════════════════════════════════════════
// Other Contract Configurations
// ═══════════════════════════════════════════════════════════════

// Create stable contract config references at module level - computed once when module loads
const STABLE_GENAI_NFT_CONTRACT_CONFIG = (() => {
  switch (CHAIN_NAME) {
    case "sepolia":
      return { address: "0xf18E3901D91D8a08380E37A466E6F7f6AA4BD4a6", abi: GenImNFTv3ABI } as const;
    case "optimismSepolia":
      // GenImNFTv4 deployed on 2025-12-24
      return { address: "0x10827cC42a09D0BAD2d43134C69F0e776D853D85", abi: GenImNFTv3ABI } as const;
    case "optimism":
      return { address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb", abi: GenImNFTv3ABI } as const;
    default:
      return { address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb", abi: GenImNFTv3ABI } as const;
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
