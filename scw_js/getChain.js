// @ts-check
import fs from "fs";
import { sepolia, optimism, optimismSepolia } from "viem/chains";

const CollectorNFTv1ABI = JSON.parse(
  fs.readFileSync("../eth/abi/contracts/CollectorNFTv1.json", "utf8"),
);
const GenImNFTv3ABI = JSON.parse(fs.readFileSync("../eth/abi/contracts/GenImNFTv3.json", "utf8"));
const LLMv1ABI = JSON.parse(fs.readFileSync("../eth/abi/contracts/LLMv1.json", "utf8"));

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

/**
 * Gibt die Konfiguration für den GenImNFTv3 Vertrag zurück
 * @returns {{ address: string, abi: any }}
 */
export function getGenAiNFTContractConfig() {
  const chainName = getEnvironmentVariable("PUBLIC_ENV__CHAIN_NAME", "optimism");
  switch (chainName) {
    case "sepolia":
      return { address: "0xf18E3901D91D8a08380E37A466E6F7f6AA4BD4a6", abi: GenImNFTv3ABI };
    case "optimism":
      return { address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb", abi: GenImNFTv3ABI };
    default:
      return { address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb", abi: GenImNFTv3ABI };
  }
}

/**
 * Gibt die Konfiguration für den CollectorNFT Vertrag zurück
 * @returns {{ address: string, abi: any }}
 */
export function getCollectorNFTContractConfig() {
  const chainName = getEnvironmentVariable("PUBLIC_ENV__CHAIN_NAME", "optimism");
  switch (chainName) {
    case "sepolia":
      return { address: "0x0000000000000000000000000000000000000000", abi: CollectorNFTv1ABI };
    case "optimism":
      return { address: "0x584c40d8a7cA164933b5F90a2dC11ddCB4a924ea", abi: CollectorNFTv1ABI };
    case "optimismSepolia":
      return { address: "0x0000000000000000000000000000000000000000", abi: CollectorNFTv1ABI };
    default:
      return { address: "0x584c40d8a7cA164933b5F90a2dC11ddCB4a924ea", abi: CollectorNFTv1ABI };
  }
}
