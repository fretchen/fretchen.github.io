// @ts-check
import { sepolia, optimism, optimismSepolia, base, baseSepolia } from "viem/chains";
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

/** returns the config of the GenImgV4 contract
 * @param {string} network - CAIP-2 network ID (e.g., "eip155:10", "eip155:11155420")
 * @returns {{ address: `0x${string}` }}
 */
export function getGenImgContractConfig(network) {
  switch (network) {
    case "eip155:11155420": // Optimism Sepolia
      return { address: "0x10827cC42a09D0BAD2d43134C69F0e776D853D85" };
    case "eip155:10": // Optimism Mainnet
      return { address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb" };
    default:
      throw new Error(`GenImg contract not deployed on network: ${network}`);
  }
}

/** returns the viem chain object for a CAIP-2 network ID
 * @param {string} network - CAIP-2 network ID (e.g., "eip155:10", "eip155:11155420")
 * @returns {import("viem/chains").Chain}
 */
export function getViemChain(network) {
  switch (network) {
    case "eip155:10": // Optimism Mainnet
      return optimism;
    case "eip155:11155420": // Optimism Sepolia
      return optimismSepolia;
    case "eip155:8453": // Base Mainnet
      return base;
    case "eip155:84532": // Base Sepolia
      return baseSepolia;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}
