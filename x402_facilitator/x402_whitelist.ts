/**
 * x402 Agent Whitelist Module
 * Multi-source whitelist system for agent authorization
 */

import { createPublicClient, http, getContract } from "viem";
import type { Address, Abi } from "viem";
import pino from "pino";
import { getChainConfig } from "./chain_utils.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface WhitelistResult {
  isWhitelisted: boolean;
  source?: string;
}

interface CacheEntry extends WhitelistResult {
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════
// Cache
// ═══════════════════════════════════════════════════════════════

const whitelistCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

// ═══════════════════════════════════════════════════════════════
// Contract ABIs
// ═══════════════════════════════════════════════════════════════

// GenImNFTv4 ABI - isAuthorizedAgent function
const GENIMG_V4_ABI = [
  {
    name: "isAuthorizedAgent",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const satisfies Abi;

// LLMv1 ABI - isAuthorizedAgent function (same signature)
const LLMV1_ABI = [
  {
    name: "isAuthorizedAgent",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const satisfies Abi;

// ═══════════════════════════════════════════════════════════════
// Environment-based whitelist sources
// ═══════════════════════════════════════════════════════════════

/**
 * Get test wallets from environment variable.
 * Format: "0x1234...,0x5678..."
 * Only enabled on testnet (Sepolia).
 */
function getTestWallets(): string[] {
  const wallets = process.env.TEST_WALLETS || "";
  if (!wallets) {
    return [];
  }
  return wallets.split(",").map((w) => w.trim().toLowerCase());
}

/**
 * Get manual whitelist from environment variable.
 * Format: "0x1234...,0x5678..."
 * Works on all networks (Mainnet and Testnet).
 */
function getManualWhitelist(): string[] {
  const wallets = process.env.MANUAL_WHITELIST || "";
  if (!wallets) {
    return [];
  }
  return wallets.split(",").map((w) => w.trim().toLowerCase());
}

/**
 * Check if address is in manual whitelist (all networks)
 */
function isManuallyWhitelisted(address: string): boolean {
  const manualWhitelist = getManualWhitelist();
  return manualWhitelist.includes(address.toLowerCase());
}

/**
 * Check if address is in test wallet list (testnet only)
 */
function isTestWallet(address: string, network: string): boolean {
  // Test wallets only enabled on testnet
  if (network !== "eip155:11155420") {
    return false;
  }

  const testWallets = getTestWallets();
  return testWallets.includes(address.toLowerCase());
}

// ═══════════════════════════════════════════════════════════════
// On-chain whitelist checks
// ═══════════════════════════════════════════════════════════════

/**
 * Check if address is authorized in GenImNFTv4 contract
 */
async function checkGenImgV4(address: string, network: string): Promise<boolean> {
  try {
    const chainConfig = getChainConfig(network);
    const contractAddress = chainConfig.GENIMG_V4_ADDRESS;

    if (!contractAddress) {
      logger.warn({ network }, "GenImNFTv4 contract address not configured");
      return false;
    }

    const publicClient = createPublicClient({
      chain: chainConfig.chain,
      transport: http(),
    });

    const contract = getContract({
      address: contractAddress as Address,
      abi: GENIMG_V4_ABI,
      client: publicClient,
    });

    const isAuthorized = await contract.read.isAuthorizedAgent([address as Address]);

    logger.debug(
      {
        address,
        network,
        contract: contractAddress,
        isAuthorized,
      },
      "GenImNFTv4 whitelist check",
    );

    return isAuthorized;
  } catch (error) {
    logger.error(
      {
        err: error,
        address,
        network,
      },
      "Error checking GenImNFTv4 whitelist",
    );
    return false;
  }
}

/**
 * Check if address is authorized in LLMv1 contract
 */
async function checkLLMv1(address: string, network: string): Promise<boolean> {
  try {
    const chainConfig = getChainConfig(network);
    const contractAddress = chainConfig.LLMV1_ADDRESS;

    if (!contractAddress) {
      logger.debug({ network }, "LLMv1 contract address not configured");
      return false;
    }

    const publicClient = createPublicClient({
      chain: chainConfig.chain,
      transport: http(),
    });

    const contract = getContract({
      address: contractAddress as Address,
      abi: LLMV1_ABI,
      client: publicClient,
    });

    const isAuthorized = await contract.read.isAuthorizedAgent([address as Address]);

    logger.debug(
      {
        address,
        network,
        contract: contractAddress,
        isAuthorized,
      },
      "LLMv1 whitelist check",
    );

    return isAuthorized;
  } catch (error) {
    logger.error(
      {
        err: error,
        address,
        network,
      },
      "Error checking LLMv1 whitelist",
    );
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// Main whitelist check (OR logic with caching)
// ═══════════════════════════════════════════════════════════════

/**
 * Check if agent address is whitelisted (with caching).
 * Uses OR logic: authorized if ANY source returns true.
 */
export async function isAgentWhitelisted(
  address: string,
  network: string,
): Promise<WhitelistResult> {
  const normalizedAddress = address.toLowerCase();
  const cacheKey = `${network}:${normalizedAddress}`;

  // Check cache
  const cached = whitelistCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    logger.debug({ address, network, source: cached.source }, "Whitelist cache hit");
    return { isWhitelisted: cached.isWhitelisted, source: cached.source };
  }

  logger.info({ address, network }, "Checking agent whitelist");

  // Check manual whitelist first (fastest - in-memory, all networks)
  if (isManuallyWhitelisted(normalizedAddress)) {
    const result: WhitelistResult = { isWhitelisted: true, source: "manual" };
    whitelistCache.set(cacheKey, { ...result, timestamp: Date.now() });
    logger.info({ address, network, source: "manual" }, "Agent whitelisted via manual list");
    return result;
  }

  // Check test wallets (testnet only)
  if (isTestWallet(normalizedAddress, network)) {
    const result: WhitelistResult = { isWhitelisted: true, source: "test_wallets" };
    whitelistCache.set(cacheKey, { ...result, timestamp: Date.now() });
    logger.info({ address, network, source: "test_wallets" }, "Agent whitelisted via test wallet");
    return result;
  }

  // Check contracts in parallel for performance
  const checks = [
    checkGenImgV4(normalizedAddress, network).then((authorized) => ({
      authorized,
      source: "genimg_v4",
    })),
    checkLLMv1(normalizedAddress, network).then((authorized) => ({
      authorized,
      source: "llmv1",
    })),
  ];

  // Wait for all checks (OR logic - any true = whitelisted)
  const results = await Promise.all(checks);
  const authorizedCheck = results.find((r) => r.authorized);

  if (authorizedCheck) {
    const result: WhitelistResult = { isWhitelisted: true, source: authorizedCheck.source };
    whitelistCache.set(cacheKey, { ...result, timestamp: Date.now() });
    logger.info(
      { address, network, source: authorizedCheck.source },
      "Agent whitelisted via contract",
    );
    return result;
  }

  // Not whitelisted
  const result: WhitelistResult = { isWhitelisted: false };
  whitelistCache.set(cacheKey, { ...result, timestamp: Date.now() });
  logger.warn({ address, network }, "Agent not whitelisted");
  return result;
}

/**
 * Clear whitelist cache (for testing or manual refresh)
 */
export function clearWhitelistCache(): void {
  whitelistCache.clear();
  logger.info("Whitelist cache cleared");
}

export interface CacheStats {
  size: number;
  entries: Array<{
    key: string;
    isWhitelisted: boolean;
    source?: string;
    age: number;
  }>;
}

/**
 * Get whitelist cache statistics
 */
export function getWhitelistCacheStats(): CacheStats {
  return {
    size: whitelistCache.size,
    entries: Array.from(whitelistCache.entries()).map(([key, value]) => ({
      key,
      isWhitelisted: value.isWhitelisted,
      source: value.source,
      age: Date.now() - value.timestamp,
    })),
  };
}
