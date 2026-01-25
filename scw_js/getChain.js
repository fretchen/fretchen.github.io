// @ts-check
import { sepolia, optimism, optimismSepolia } from "viem/chains";
import { LLMv1ABI } from "./llmv1_abi.js";
import { getViemChain, fromCAIP2, getUSDCAddress, getUSDCName } from "@fretchen/chain-utils";

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
 * USDC configuration for supported networks
 * @typedef {Object} USDCConfig
 * @property {string} name - Human-readable network name
 * @property {number} chainId - EVM chain ID
 * @property {`0x${string}`} address - USDC contract address
 * @property {number} decimals - USDC decimals (always 6)
 * @property {string} usdcName - USDC permit name (for EIP-2612)
 * @property {string} usdcVersion - USDC permit version
 */

/** returns the USDC configuration for a CAIP-2 network ID
 * @param {string} network - CAIP-2 network ID (e.g., "eip155:10", "eip155:11155420")
 * @returns {USDCConfig}
 */
export function getUSDCConfig(network) {
  return {
    name: getViemChain(network).name,
    chainId: fromCAIP2(network),
    address: getUSDCAddress(network),
    decimals: 6,
    usdcName: getUSDCName(network),
    usdcVersion: "2",
  };
}

/**
 * Get the expected network for a given mode
 * @param {boolean} sepoliaTest - Whether test mode is enabled
 * @returns {string} CAIP-2 network ID
 */
export function getExpectedNetwork(sepoliaTest) {
  return sepoliaTest ? "eip155:11155420" : "eip155:10";
}

/**
 * Validate that a client-selected network matches the expected mode
 * @param {string|undefined} clientNetwork - Network from payment payload
 * @param {boolean} sepoliaTest - Whether test mode is enabled
 * @returns {{ valid: boolean, reason?: string, expected?: string, received?: string }}
 */
export function validatePaymentNetwork(clientNetwork, sepoliaTest) {
  if (!clientNetwork) {
    return { valid: false, reason: "missing_network" };
  }

  const expectedNetwork = getExpectedNetwork(sepoliaTest);
  if (clientNetwork !== expectedNetwork) {
    return {
      valid: false,
      reason: sepoliaTest ? "invalid_network_for_test_mode" : "invalid_network_for_production",
      expected: expectedNetwork,
      received: clientNetwork,
    };
  }

  return { valid: true };
}
