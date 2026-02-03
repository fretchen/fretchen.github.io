// @ts-check
import { sepolia, optimism, optimismSepolia } from "viem/chains";
import {
  LLMv1ABI,
  getGenAiNFTMainnetNetworks,
  getGenAiNFTTestnetNetworks,
  isTestnet,
} from "@fretchen/chain-utils";

/**
 * Get environment variable in both Node.js and Vite contexts
 * @param {string} key
 * @param {string} defaultValue
 * @returns {string}
 */
function getEnvironmentVariable(key, defaultValue) {
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
 * Gibt das entsprechende Chain-Objekt basierend auf der CHAIN-Umgebungsvariable zurück.
 *
 * @deprecated TODO: Migrate to CAIP-2 pattern when LLMv1 gets multi-chain support.
 * Currently used by:
 * - llm_service.js: checkWalletBalance() (line ~454)
 * - llm_service.js: processMerkleTree() (line ~572)
 *
 * @returns {import("viem/chains").Chain}
 */
export function getChain() {
  const chainName = getEnvironmentVariable("PUBLIC_ENV__CHAIN_NAME", "optimism");
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

/** returns the config of the LLMv1 contract
 * @returns {{ address: `0x${string}`, abi: any }}
 */
export function getLLMv1ContractConfig() {
  const chainName = getEnvironmentVariable("PUBLIC_ENV__CHAIN_NAME", "optimism");
  switch (chainName) {
    case "optimismSepolia":
      return { address: "0xB3dbD44477a7bcf253f2fA68eDb4be5aF2F2cA56", abi: LLMv1ABI };
    case "optimism":
      return { address: "0x833F39D6e67390324796f861990ce9B7cf9F5dE1", abi: LLMv1ABI };
    default:
      return { address: "0xB3dbD44477a7bcf253f2fA68eDb4be5aF2F2cA56", abi: LLMv1ABI };
  }
}

/**
 * Get the expected networks for a given mode
 * Dynamically pulls from chain-utils deployment configuration
 * @param {boolean} sepoliaTest - Whether test mode is enabled
 * @returns {string[]} Array of CAIP-2 network IDs
 */
export function getExpectedNetworks(sepoliaTest) {
  return sepoliaTest ? getGenAiNFTTestnetNetworks() : getGenAiNFTMainnetNetworks();
}

/**
 * Get the expected network for a given mode (legacy, returns first network)
 * @deprecated Use getExpectedNetworks() instead
 * @param {boolean} sepoliaTest - Whether test mode is enabled
 * @returns {string} CAIP-2 network ID
 */
export function getExpectedNetwork(sepoliaTest) {
  return getExpectedNetworks(sepoliaTest)[0];
}

/**
 * Validate that a client-selected network is supported
 * @param {string|undefined} clientNetwork - Network from payment payload
 * @returns {{ valid: boolean, reason?: string, expected?: string[], received?: string }}
 */
export function validatePaymentNetwork(clientNetwork) {
  if (!clientNetwork) {
    return { valid: false, reason: "missing_network" };
  }

  // Check against all supported networks (mainnet + testnet)
  const allNetworks = [...getExpectedNetworks(false), ...getExpectedNetworks(true)];
  if (!allNetworks.includes(clientNetwork)) {
    return {
      valid: false,
      reason: "unsupported_network",
      expected: allNetworks,
      received: clientNetwork,
    };
  }

  return { valid: true };
}
