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
 * Optional per-network RPC endpoint, read from `RPC_URL_<NETWORK>` — e.g.
 * `RPC_URL_EIP155_8453` for Base mainnet. Returns `undefined` when unset, which
 * makes viem's `http()` fall back to the chain's default public endpoint.
 *
 * Configure this for any network carrying real traffic. The public defaults
 * (e.g. `https://mainnet.base.org`) are aggressively rate-limited: a single
 * batch-settlement deposit issues a Multicall3 batch of channel-state reads and
 * comes back `over rate limit`, which surfaces as the generic
 * `..._deposit_transaction_failed` even though nothing was ever submitted
 * on-chain. It also explains multi-second latency on otherwise trivial reads.
 */
export function getRpcUrl(network: string): string | undefined {
  const key = `RPC_URL_${network.replace(/[:-]/g, "_").toUpperCase()}`;
  return process.env[key] || undefined;
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

/**
 * Get networks where the canonical x402 batch-settlement contract
 * (`BATCH_SETTLEMENT_ADDRESS`) is actually deployed.
 *
 * This is a STRICT SUBSET of `getSupportedNetworks()`. The exact scheme works on
 * every supported network (USDC exists everywhere), but batch-settlement is a
 * single fixed contract address that the @x402 SDK does not track deployment
 * status for — that's on us. Verified deployed on Optimism mainnet, Base mainnet,
 * and Base Sepolia; NOT on Optimism Sepolia (`eip155:11155420`).
 *
 * Registering BatchSettlementEvmScheme outside this list would advertise support
 * via `/supported` for a network with no contract, and any deposit/claim/settle
 * against it would fail on-chain.
 * @returns Array of CAIP-2 network identifiers with a deployed batch-settlement contract
 */
export function getBatchSettlementNetworks(): string[] {
  return ["eip155:10", "eip155:8453", "eip155:84532"];
}
