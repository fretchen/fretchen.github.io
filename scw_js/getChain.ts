import { sepolia, optimism, optimismSepolia } from "viem/chains";
import type { Chain } from "viem";
import {
  LLMv1ABI,
  getGenAiNFTMainnetNetworks,
  getGenAiNFTTestnetNetworks,
} from "@fretchen/chain-utils";

function getEnvironmentVariable(key: string, defaultValue: string): string {
  try {
    if (typeof import.meta !== "undefined" && (import.meta as unknown as { env?: Record<string, string> }).env) {
      return (import.meta as unknown as { env: Record<string, string> }).env[key] ?? defaultValue;
    }
  } catch {
    // fallback
  }
  try {
    if (typeof process !== "undefined" && process.env) {
      return process.env[key] ?? defaultValue;
    }
  } catch {
    // fallback
  }
  return defaultValue;
}

/**
 * @deprecated TODO: Migrate to CAIP-2 pattern when LLMv1 gets multi-chain support.
 * Currently used by llm_service.ts checkWalletBalance() and processMerkleTree().
 */
export function getChain(): Chain {
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

export function getLLMv1ContractConfig(): { address: `0x${string}`; abi: typeof LLMv1ABI } {
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

export function getExpectedNetworks(sepoliaTest: boolean): readonly string[] {
  return sepoliaTest ? getGenAiNFTTestnetNetworks() : getGenAiNFTMainnetNetworks();
}

export type NetworkValidationResult =
  | { valid: true }
  | { valid: false; reason: string; expected?: readonly string[]; received?: string };

export function validatePaymentNetwork(
  clientNetwork: string | undefined,
  sepoliaTest = false,
): NetworkValidationResult {
  if (!clientNetwork) {
    return { valid: false, reason: "missing_network" };
  }

  const expectedNetworks = getExpectedNetworks(sepoliaTest);

  if (!expectedNetworks.includes(clientNetwork)) {
    const allNetworks = [...getExpectedNetworks(false), ...getExpectedNetworks(true)];

    if (allNetworks.includes(clientNetwork)) {
      return {
        valid: false,
        reason: sepoliaTest ? "invalid_network_for_test_mode" : "invalid_network_for_production",
        expected: expectedNetworks,
        received: clientNetwork,
      };
    }

    return {
      valid: false,
      reason: "unsupported_network",
      expected: expectedNetworks,
      received: clientNetwork,
    };
  }

  return { valid: true };
}
