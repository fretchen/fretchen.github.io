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
  getStablecoins,
  type Network,
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
// Fee tokens — the stablecoins this facilitator settles and charges its fee in
// ═══════════════════════════════════════════════════════════════

/**
 * How a buyer authorizes moving a token. USDC and EURC implement EIP-3009
 * (`transferWithAuthorization`); EURe does not, so it is paid through Permit2 — with an EIP-2612
 * permit to Permit2 bundled in, so the buyer needs no separate approval transaction.
 */
export type TransferMethod = "eip3009" | "permit2";

export interface FeeToken {
  symbol: string;
  address: `0x${string}`;
  /** ERC-20 decimals: 6 for USDC/EURC, 18 for EURe. Never assume 6. */
  decimals: number;
  transferMethod: TransferMethod;
}

/**
 * Monerium EURe. Facilitator-local for now: the sellers (`scw_js`) do not offer it yet, and the
 * shared `@fretchen/chain-utils` registry they read must not list a token they cannot sell. It
 * moves there with the seller-side PR.
 *
 * Addresses from Monerium's token API (api.monerium.app; api.monerium.dev for the sandbox),
 * confirmed on-chain 2026-10-04: name() "Monerium EURe", decimals() 18, EIP-712 version "1",
 * EIP-2612 permit present, EIP-3009 absent. No Optimism deployment.
 */
export const EURE_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:8453": "0xbf6e2966A9C3D99C9E4D069E04f7Bdb9C8aa762C", // Base
  "eip155:84532": "0x29F37F6adCa168B79B8d9567eab9BE3fBF21db85", // Base Sepolia (Monerium sandbox)
};
export const EURE_DECIMALS = 18;

/** Every token this facilitator settles on `network`: USDC everywhere, EURC and EURe on Base. */
export function getFeeTokens(network: string): FeeToken[] {
  const tokens: FeeToken[] = getStablecoins(network).map((coin) => ({
    symbol: coin.symbol,
    address: coin.address,
    decimals: 6,
    transferMethod: "eip3009",
  }));
  const eure = EURE_ADDRESSES[network];
  if (eure) {
    tokens.push({
      symbol: "EURe",
      address: eure,
      decimals: EURE_DECIMALS,
      transferMethod: "permit2",
    });
  }
  return tokens;
}

/** The fee token at `address` on `network`, case-insensitively; null for any other token. */
export function findFeeToken(network: string, address: string): FeeToken | null {
  const wanted = address.toLowerCase();
  return getFeeTokens(network).find((token) => token.address.toLowerCase() === wanted) ?? null;
}
