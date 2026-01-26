// @ts-check

/**
 * Chain Utilities for x402 Facilitator
 * Shared functions for network/chain handling
 *
 * Uses @fretchen/chain-utils for chain/address data.
 */

import {
  getViemChain,
  tryGetGenAiNFTAddress,
  tryGetLLMv1Address,
  tryGetEIP3009SplitterAddress,
  getUSDCAddress,
  getUSDCName,
} from "@fretchen/chain-utils";

/**
 * Get chain configuration including contract addresses
 * @param {string} network - Network ID (eip155:10 or eip155:11155420)
 * @returns {{chain: import("viem/chains").Chain, GENIMG_V4_ADDRESS: string|null, LLMV1_ADDRESS: string|null, SPLITTER_ADDRESS: string|null, USDC_ADDRESS: string, USDC_NAME: string}} Chain config with contract addresses
 * @throws {Error} If network is not supported
 */
export function getChainConfig(network) {
  return {
    chain: getViemChain(network),
    GENIMG_V4_ADDRESS: tryGetGenAiNFTAddress(network),
    LLMV1_ADDRESS: tryGetLLMv1Address(network),
    SPLITTER_ADDRESS: tryGetEIP3009SplitterAddress(network),
    USDC_ADDRESS: getUSDCAddress(network),
    USDC_NAME: getUSDCName(network),
  };
}

/**
 * Get all supported networks
 * @returns {string[]} Array of supported network identifiers
 */
export function getSupportedNetworks() {
  return ["eip155:10", "eip155:11155420"];
}
