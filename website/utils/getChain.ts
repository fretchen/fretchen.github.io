import { optimism, optimismSepolia, base, baseSepolia } from "wagmi/chains";
import SupportV2ABI from "../../eth/abi/contracts/SupportV2.json";
import LLMv1ABI from "../../eth/abi/contracts/LLMv1.json";

// ═══════════════════════════════════════════════════════════════
// Chain utilities are now in @fretchen/chain-utils
// Import directly where needed:
//   import { getGenAiNFTAddress, GenImNFTv4ABI, GENAI_NFT_NETWORKS } from "@fretchen/chain-utils";
//   import { getCollectorNFTAddress, CollectorNFTv1ABI, COLLECTOR_NFT_NETWORKS } from "@fretchen/chain-utils";
// ═══════════════════════════════════════════════════════════════

/**
 * Get PUBLIC_ENV__CHAIN_NAME in Vite context (Browser)
 */
const CHAIN_NAME = import.meta.env?.PUBLIC_ENV__CHAIN_NAME || "optimism";

// ═══════════════════════════════════════════════════════════════
// SupportV2: Multi-Chain Configuration
// ═══════════════════════════════════════════════════════════════

/**
 * Use testnet chains for SupportV2?
 * Set VITE_USE_TESTNET=true in .env for local development
 * Default: false (mainnet)
 */
const USE_TESTNET = import.meta.env?.VITE_USE_TESTNET === "true";

/** SupportV2 contract addresses - mainnet */
const MAINNET_SUPPORT_V2_ADDRESSES: Record<number, `0x${string}`> = {
  [optimism.id]: "0x4ca63f8A4Cd56287E854f53E18ca482D74391316",
  [base.id]: "0xB70EA4d714Fed01ce20E93F9033008BadA1c8694",
};

/** SupportV2 contract addresses - testnet */
const TESTNET_SUPPORT_V2_ADDRESSES: Record<number, `0x${string}`> = {
  [optimismSepolia.id]: "0x9859431b682e861b19e87Db14a04944BC747AB6d",
  [baseSepolia.id]: "0xaB44BE78499721b593a0f4BE2099b246e9C53B57",
};

/** Active SupportV2 addresses based on VITE_USE_TESTNET */
const SUPPORT_V2_ADDRESSES = USE_TESTNET ? TESTNET_SUPPORT_V2_ADDRESSES : MAINNET_SUPPORT_V2_ADDRESSES;

/** Active chains for SupportV2 (both reading and writing) */
export const SUPPORT_V2_CHAINS = USE_TESTNET ? ([optimismSepolia, baseSepolia] as const) : ([optimism, base] as const);

/** Default chain for read operations and auto-switch target */
export const DEFAULT_SUPPORT_CHAIN = USE_TESTNET ? optimismSepolia : optimism;

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
 * Check if a chain supports SupportV2 (in current mode: mainnet or testnet)
 */
export function isSupportV2Chain(chainId: number): boolean {
  return chainId in SUPPORT_V2_ADDRESSES;
}

// ═══════════════════════════════════════════════════════════════
// Legacy Contract Configurations
//
// GenAI NFT: MIGRATED to chain-utils (Phase 2):
//   import { getGenAiNFTAddress, GenImNFTv4ABI, GENAI_NFT_NETWORKS } from "@fretchen/chain-utils";
//   const { network } = useAutoNetwork(GENAI_NFT_NETWORKS);
//   const address = getGenAiNFTAddress(network);
//
// CollectorNFT: MIGRATED to chain-utils (Phase 3):
//   import { getCollectorNFTAddress, CollectorNFTv1ABI, COLLECTOR_NFT_NETWORKS } from "@fretchen/chain-utils";
//   const { network, switchIfNeeded } = useAutoNetwork(COLLECTOR_NFT_NETWORKS);
//   const address = getCollectorNFTAddress(network);
//
// LLMv1: Stays in legacy config (out of scope for multi-chain)
// ═══════════════════════════════════════════════════════════════

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

/** Out of scope: LLMv1 stays in legacy config */
export const llmV1ContractConfig = STABLE_LLM_V1_CONTRACT_CONFIG;

// ═══════════════════════════════════════════════════════════════
// Legacy getChain() for LLMv1 (Phase 4 migration candidate)
// Returns the chain object based on CHAIN_NAME environment variable
// ═══════════════════════════════════════════════════════════════

import type { Chain } from "wagmi/chains";

/**
 * Get chain for LLMv1 contract based on environment variable
 * @returns Chain object (optimism or optimismSepolia)
 * @deprecated Use chain-utils for GenAI/CollectorNFT. LLMv1 migration is Phase 4.
 */
export function getChain(): Chain {
  switch (CHAIN_NAME) {
    case "optimismSepolia":
      return optimismSepolia;
    case "optimism":
    default:
      return optimism;
  }
}
