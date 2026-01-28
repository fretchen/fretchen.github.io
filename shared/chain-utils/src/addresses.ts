/**
 * Contract Address Maps
 *
 * Organized by contract, with separate maps for mainnet and testnet.
 * All keys are CAIP-2 format: "eip155:<chainId>"
 */

// ═══════════════════════════════════════════════════════════════
// GenImNFT (GenAI NFT)
// ═══════════════════════════════════════════════════════════════

export const MAINNET_GENAI_NFT_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:10": "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb", // Optimism
  // "eip155:8453": "0x...", // Base - add after Deployment
};

export const TESTNET_GENAI_NFT_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:11155420": "0x10827cC42a09D0BAD2d43134C69F0e776D853D85", // Optimism Sepolia
};

/** All networks where GenImNFT is deployed */
export const GENAI_NFT_NETWORKS = [
  ...Object.keys(MAINNET_GENAI_NFT_ADDRESSES),
  ...Object.keys(TESTNET_GENAI_NFT_ADDRESSES),
] as const;

// ═══════════════════════════════════════════════════════════════
// CollectorNFT
// ═══════════════════════════════════════════════════════════════

export const MAINNET_COLLECTOR_NFT_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:10": "0x584c40d8a7cA164933b5F90a2dC11ddCB4a924ea", // Optimism
};

export const TESTNET_COLLECTOR_NFT_ADDRESSES: Record<string, `0x${string}`> = {
  // Keine Testnet-Deployments aktuell
};

/** All networks where CollectorNFT is deployed */
export const COLLECTOR_NFT_NETWORKS = [
  ...Object.keys(MAINNET_COLLECTOR_NFT_ADDRESSES),
  ...Object.keys(TESTNET_COLLECTOR_NFT_ADDRESSES),
] as const;

// ═══════════════════════════════════════════════════════════════
// SupportV2
// ═══════════════════════════════════════════════════════════════

export const MAINNET_SUPPORT_V2_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:10": "0x4ca63f8A4Cd56287E854f53E18ca482D74391316", // Optimism
  "eip155:8453": "0xB70EA4d714Fed01ce20E93F9033008BadA1c8694", // Base
};

export const TESTNET_SUPPORT_V2_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:11155420": "0x9859431b682e861b19e87Db14a04944BC747AB6d", // Optimism Sepolia
  "eip155:84532": "0xaB44BE78499721b593a0f4BE2099b246e9C53B57", // Base Sepolia
};

/** All networks where SupportV2 is deployed */
export const SUPPORT_V2_NETWORKS = [
  ...Object.keys(MAINNET_SUPPORT_V2_ADDRESSES),
  ...Object.keys(TESTNET_SUPPORT_V2_ADDRESSES),
] as const;

// ═══════════════════════════════════════════════════════════════
// LLMv1 (out of scope for migration, but included for completeness)
// ═══════════════════════════════════════════════════════════════

export const MAINNET_LLM_V1_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:10": "0x833F39D6e67390324796f861990ce9B7cf9F5dE1", // Optimism
};

export const TESTNET_LLM_V1_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:11155420": "0xB3dbD44477a7bcf253f2fA68eDb4be5aF2F2cA56", // Optimism Sepolia
};

// ═══════════════════════════════════════════════════════════════
// USDC (available on all chains)
// ═══════════════════════════════════════════════════════════════

export const USDC_ADDRESSES: Record<string, `0x${string}`> = {
  // Mainnets
  "eip155:10": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // Optimism
  "eip155:8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base
  // Testnets
  "eip155:11155420": "0x5fd84259d66Cd46123540766Be93DFE6D43130D7", // Optimism Sepolia
  "eip155:84532": "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
};

export const USDC_NAMES: Record<string, string> = {
  "eip155:10": "USD Coin",
  "eip155:11155420": "USDC",
  "eip155:8453": "USD Coin",
  "eip155:84532": "USDC",
};

// ═══════════════════════════════════════════════════════════════
// EIP3009 Splitter
// ═══════════════════════════════════════════════════════════════

export const MAINNET_EIP3009_SPLITTER_ADDRESSES: Record<string, `0x${string}`> = {
  // "eip155:10": "0x...", // Optimism - not yet deployed
};

export const TESTNET_EIP3009_SPLITTER_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:11155420": "0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946", // Optimism Sepolia
};

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Get GenAI NFT address for a network (mainnet or testnet).
 * @throws Error if not deployed on that network
 */
export function getGenAiNFTAddress(network: string): `0x${string}` {
  const address = MAINNET_GENAI_NFT_ADDRESSES[network] || TESTNET_GENAI_NFT_ADDRESSES[network];
  if (!address) {
    throw new Error(`GenAI NFT not deployed on ${network}`);
  }
  return address;
}

/**
 * Try to get GenAI NFT address, returns null if not deployed.
 */
export function tryGetGenAiNFTAddress(network: string): `0x${string}` | null {
  return MAINNET_GENAI_NFT_ADDRESSES[network] || TESTNET_GENAI_NFT_ADDRESSES[network] || null;
}

/**
 * Get CollectorNFT address for a network (mainnet or testnet).
 * @throws Error if not deployed on that network
 */
export function getCollectorNFTAddress(network: string): `0x${string}` {
  const address =
    MAINNET_COLLECTOR_NFT_ADDRESSES[network] || TESTNET_COLLECTOR_NFT_ADDRESSES[network];
  if (!address) {
    throw new Error(`CollectorNFT not deployed on ${network}`);
  }
  return address;
}

/**
 * Try to get CollectorNFT address, returns null if not deployed.
 */
export function tryGetCollectorNFTAddress(network: string): `0x${string}` | null {
  return (
    MAINNET_COLLECTOR_NFT_ADDRESSES[network] || TESTNET_COLLECTOR_NFT_ADDRESSES[network] || null
  );
}

/**
 * Get LLMv1 address for a network (mainnet or testnet).
 * @throws Error if not deployed on that network
 */
export function getLLMv1Address(network: string): `0x${string}` {
  const address = MAINNET_LLM_V1_ADDRESSES[network] || TESTNET_LLM_V1_ADDRESSES[network];
  if (!address) {
    throw new Error(`LLMv1 not deployed on ${network}`);
  }
  return address;
}

/**
 * Try to get LLMv1 address, returns null if not deployed.
 */
export function tryGetLLMv1Address(network: string): `0x${string}` | null {
  return MAINNET_LLM_V1_ADDRESSES[network] || TESTNET_LLM_V1_ADDRESSES[network] || null;
}

/**
 * Get SupportV2 address for a network (mainnet or testnet).
 * @throws Error if not deployed on that network
 */
export function getSupportV2Address(network: string): `0x${string}` {
  const address = MAINNET_SUPPORT_V2_ADDRESSES[network] || TESTNET_SUPPORT_V2_ADDRESSES[network];
  if (!address) {
    throw new Error(`SupportV2 not deployed on ${network}`);
  }
  return address;
}

/**
 * Try to get SupportV2 address, returns null if not deployed.
 */
export function tryGetSupportV2Address(network: string): `0x${string}` | null {
  return MAINNET_SUPPORT_V2_ADDRESSES[network] || TESTNET_SUPPORT_V2_ADDRESSES[network] || null;
}

/**
 * Get EIP3009 Splitter address for a network (mainnet or testnet).
 * @throws Error if not deployed on that network
 */
export function getEIP3009SplitterAddress(network: string): `0x${string}` {
  const address =
    MAINNET_EIP3009_SPLITTER_ADDRESSES[network] || TESTNET_EIP3009_SPLITTER_ADDRESSES[network];
  if (!address) {
    throw new Error(`EIP3009 Splitter not deployed on ${network}`);
  }
  return address;
}

/**
 * Try to get EIP3009 Splitter address, returns null if not deployed.
 */
export function tryGetEIP3009SplitterAddress(network: string): `0x${string}` | null {
  return (
    MAINNET_EIP3009_SPLITTER_ADDRESSES[network] ||
    TESTNET_EIP3009_SPLITTER_ADDRESSES[network] ||
    null
  );
}

/**
 * Get USDC address for a network.
 * @throws Error if USDC not available on that network
 */
export function getUSDCAddress(network: string): `0x${string}` {
  const address = USDC_ADDRESSES[network];
  if (!address) {
    throw new Error(`USDC not available on ${network}`);
  }
  return address;
}

/**
 * Get USDC name for a network.
 * @throws Error if USDC not available on that network
 */
export function getUSDCName(network: string): string {
  const name = USDC_NAMES[network];
  if (!name) {
    throw new Error(`USDC not available on ${network}`);
  }
  return name;
}

// ═══════════════════════════════════════════════════════════════
// USDC Configuration
// ═══════════════════════════════════════════════════════════════

/**
 * Complete USDC configuration for EIP-712 / EIP-3009 payments.
 * Critical for x402 payment verification and settlement.
 */
export interface USDCConfig {
  /** Human-readable network name (e.g., "OP Mainnet") */
  name: string;
  /** EVM chain ID (e.g., 10 for Optimism) */
  chainId: number;
  /** USDC contract address */
  address: `0x${string}`;
  /** USDC decimals (always 6) */
  decimals: 6;
  /** USDC EIP-712 domain name - CRITICAL for signature verification */
  usdcName: string;
  /** USDC EIP-712 domain version */
  usdcVersion: string;
}
