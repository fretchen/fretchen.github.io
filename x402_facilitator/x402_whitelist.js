// @ts-check

/**
 * x402 Agent Whitelist Module
 * Multi-source whitelist system for agent authorization
 */

import { createPublicClient, http, getContract } from "viem";
import pino from "pino";
import { getChain } from "./chain_utils.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

// Cache for whitelist checks (1 minute TTL)
const whitelistCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

// GenImNFTv4 ABI - isAuthorizedAgent function
const GENIMG_V4_ABI = [
  {
    name: "isAuthorizedAgent",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
];

// LLMv1 ABI - isAuthorizedAgent function (same signature)
const LLMV1_ABI = [
  {
    name: "isAuthorizedAgent",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
];

/**
 * Parse whitelist sources from environment variable
 * Format: "genimg_v4,llmv1,test_wallets"
 * @returns {Array<string>} List of enabled whitelist sources
 */
function getEnabledSources() {
  const sources = process.env.WHITELIST_SOURCES || "genimg_v4";
  return sources.split(",").map((s) => s.trim().toLowerCase());
}

/**
 * Get test wallets from environment variable
 * Format: "0x1234...,0x5678..."
 * Only enabled on testnet (Sepolia)
 * @returns {Array<string>} List of test wallet addresses
 */
function getTestWallets() {
  const wallets = process.env.TEST_WALLETS || "";
  if (!wallets) return [];
  return wallets.split(",").map((w) => w.trim().toLowerCase());
}

/**
 * Check if address is in test wallet list (testnet only)
 * @param {string} address - Agent address to check
 * @param {string} network - Network ID
 * @returns {boolean} True if address is whitelisted test wallet
 */
function isTestWallet(address, network) {
  // Test wallets only enabled on testnet
  if (network !== "eip155:11155420") {
    return false;
  }

  const enabledSources = getEnabledSources();
  if (!enabledSources.includes("test_wallets")) {
    return false;
  }

  const testWallets = getTestWallets();
  return testWallets.includes(address.toLowerCase());
}

/**
 * Check if address is authorized in GenImNFTv4 contract
 * @param {string} address - Agent address to check
 * @param {string} network - Network ID
 * @returns {Promise<boolean>} True if authorized
 */
async function checkGenImgV4(address, network) {
  const enabledSources = getEnabledSources();
  if (!enabledSources.includes("genimg_v4")) {
    return false;
  }

  // Get contract address from environment
  const contractAddress =
    network === "eip155:10"
      ? process.env.GENIMG_V4_MAINNET_ADDRESS
      : process.env.GENIMG_V4_SEPOLIA_ADDRESS;

  if (!contractAddress) {
    logger.warn({ network }, "GenImNFTv4 contract address not configured");
    return false;
  }

  try {
    const chain = getChain(network);
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const contract = getContract({
      address: contractAddress,
      abi: GENIMG_V4_ABI,
      client: publicClient,
    });

    const isAuthorized = await contract.read.isAuthorizedAgent([address]);

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
        contract: contractAddress,
      },
      "Error checking GenImNFTv4 whitelist",
    );
    return false;
  }
}

/**
 * Check if address is authorized in LLMv1 contract
 * @param {string} address - Agent address to check
 * @param {string} network - Network ID
 * @returns {Promise<boolean>} True if authorized
 */
async function checkLLMv1(address, network) {
  const enabledSources = getEnabledSources();
  if (!enabledSources.includes("llmv1")) {
    return false;
  }

  // Get contract address from environment
  const contractAddress =
    network === "eip155:10" ? process.env.LLMV1_MAINNET_ADDRESS : process.env.LLMV1_SEPOLIA_ADDRESS;

  if (!contractAddress) {
    logger.debug({ network }, "LLMv1 contract address not configured");
    return false;
  }

  try {
    const chain = getChain(network);
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const contract = getContract({
      address: contractAddress,
      abi: LLMV1_ABI,
      client: publicClient,
    });

    const isAuthorized = await contract.read.isAuthorizedAgent([address]);

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
        contract: contractAddress,
      },
      "Error checking LLMv1 whitelist",
    );
    return false;
  }
}

/**
 * Check if agent address is whitelisted (with caching)
 * Uses OR logic: authorized if ANY source returns true
 *
 * @param {string} address - Agent address to check (payer address)
 * @param {string} network - Network ID (eip155:10 or eip155:11155420)
 * @returns {Promise<{isWhitelisted: boolean, source?: string}>} Whitelist status and source
 */
export async function isAgentWhitelisted(address, network) {
  const normalizedAddress = address.toLowerCase();
  const cacheKey = `${network}:${normalizedAddress}`;

  // Check cache
  const cached = whitelistCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    logger.debug({ address, network, source: cached.source }, "Whitelist cache hit");
    return { isWhitelisted: cached.isWhitelisted, source: cached.source };
  }

  logger.info({ address, network }, "Checking agent whitelist");

  // Check test wallets first (fastest check)
  if (isTestWallet(normalizedAddress, network)) {
    const result = { isWhitelisted: true, source: "test_wallets" };
    whitelistCache.set(cacheKey, { ...result, timestamp: Date.now() });
    logger.info({ address, network, source: "test_wallets" }, "Agent whitelisted via test wallet");
    return result;
  }

  // Check contracts in parallel for performance
  const checks = [];
  const enabledSources = getEnabledSources();

  if (enabledSources.includes("genimg_v4")) {
    checks.push(
      checkGenImgV4(normalizedAddress, network).then((authorized) => ({
        authorized,
        source: "genimg_v4",
      })),
    );
  }

  if (enabledSources.includes("llmv1")) {
    checks.push(
      checkLLMv1(normalizedAddress, network).then((authorized) => ({
        authorized,
        source: "llmv1",
      })),
    );
  }

  // Wait for all checks (OR logic - any true = whitelisted)
  const results = await Promise.all(checks);
  const authorizedCheck = results.find((r) => r.authorized);

  if (authorizedCheck) {
    const result = { isWhitelisted: true, source: authorizedCheck.source };
    whitelistCache.set(cacheKey, { ...result, timestamp: Date.now() });
    logger.info(
      { address, network, source: authorizedCheck.source },
      "Agent whitelisted via contract",
    );
    return result;
  }

  // Not whitelisted
  const result = { isWhitelisted: false };
  whitelistCache.set(cacheKey, { ...result, timestamp: Date.now() });
  logger.warn({ address, network, sources: enabledSources }, "Agent not whitelisted");
  return result;
}

/**
 * Clear whitelist cache (for testing or manual refresh)
 */
export function clearWhitelistCache() {
  whitelistCache.clear();
  logger.info("Whitelist cache cleared");
}

/**
 * Get whitelist cache statistics
 * @returns {Object} Cache statistics
 */
export function getWhitelistCacheStats() {
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
