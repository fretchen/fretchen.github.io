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
  getSettlementTokens,
  type Network,
  type SettlementTokenInfo,
} from "@fretchen/chain-utils";

export interface ChainConfig {
  chain: Chain;
  SPLITTER_ADDRESS: string | null;
  USDC_ADDRESS: string;
  USDC_NAME: string;
}

// Per-network RPC endpoint resolution lives in the shared package so `scw_js` (which
// has the same bare-`http()` exposure) uses one implementation and one env-var
// convention. Re-exported here so existing local imports keep working.
export { getRpcUrl } from "@fretchen/chain-utils";

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
export function getSupportedNetworks(): Network[] {
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
export function getBatchSettlementNetworks(): Network[] {
  return ["eip155:10", "eip155:8453", "eip155:84532"];
}

// ═══════════════════════════════════════════════════════════════
// Fee tokens — the tokens this facilitator settles and charges its fee in
// ═══════════════════════════════════════════════════════════════

/**
 * How a buyer authorizes moving a token. USDC and EURC implement EIP-3009
 * (`transferWithAuthorization`); EURe does not, so it is paid through Permit2 — with an EIP-2612
 * permit to Permit2 bundled in, so the buyer needs no separate approval transaction.
 * (Mirrored from @fretchen/chain-utils, where the registry lives.)
 */
export type TransferMethod = "eip3009" | "permit2";

/** A token this facilitator settles and may charge its fee in (same shape as the shared registry's). */
export type FeeToken = SettlementTokenInfo;

/**
 * Every token this facilitator settles on `network`, from the shared registry: USDC everywhere,
 * EURC and EURe (Monerium, 18 decimals, paid via Permit2) on Base. The sellers (`scw_js`) read
 * the same list for what they offer, so the facilitator never charges a fee in a token the
 * sellers cannot be paid in.
 */
export function getFeeTokens(network: string): FeeToken[] {
  return getSettlementTokens(network);
}

/** The fee token at `address` on `network`, case-insensitively; null for any other token. */
export function findFeeToken(network: string, address: string): FeeToken | null {
  const wanted = address.toLowerCase();
  return getFeeTokens(network).find((token) => token.address.toLowerCase() === wanted) ?? null;
}
