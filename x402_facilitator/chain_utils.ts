/**
 * Chain Utilities for x402 Facilitator
 * Shared functions for network/chain handling
 *
 * Uses @fretchen/chain-utils for chain/address data.
 */

import type { Chain } from "viem";
import {
  getViemChain,
  tryGetEIP3009SplitterAddress,
  getUSDCAddress,
  getUSDCName,
} from "@fretchen/chain-utils";

export interface ChainConfig {
  chain: Chain;
  SPLITTER_ADDRESS: string | null;
  USDC_ADDRESS: string;
  USDC_NAME: string;
}

/**
 * Get chain configuration including contract addresses
 * @param network - Network ID (e.g. "eip155:10" or "eip155:11155420")
 * @returns Chain config with contract addresses
 * @throws If network is not supported
 */
export function getChainConfig(network: string): ChainConfig {
  return {
    chain: getViemChain(network),
    SPLITTER_ADDRESS: tryGetEIP3009SplitterAddress(network),
    USDC_ADDRESS: getUSDCAddress(network),
    USDC_NAME: getUSDCName(network),
  };
}

/**
 * Get all supported networks
 * @returns Array of supported CAIP-2 network identifiers
 */
export function getSupportedNetworks(): string[] {
  return ["eip155:10", "eip155:11155420", "eip155:8453", "eip155:84532"];
}
