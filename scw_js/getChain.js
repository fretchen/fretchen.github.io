// @ts-check
import { sepolia, optimism, optimismSepolia } from "viem/chains";
import { LLMv1ABI } from "./llmv1_abi.js";
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
 * Gibt das entsprechende Chain-Objekt basierend auf der CHAIN-Umgebungsvariable zurück
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
  const chainName = getEnvironmentVariable("PUBLIC_ENV__CHAIN_NAME", "optimismSepolia");
  switch (chainName) {
    case "optimismSepolia":
      return { address: "0xB3dbD44477a7bcf253f2fA68eDb4be5aF2F2cA56", abi: LLMv1ABI };
    default:
      return { address: "0xB3dbD44477a7bcf253f2fA68eDb4be5aF2F2cA56", abi: LLMv1ABI };
  }
}
