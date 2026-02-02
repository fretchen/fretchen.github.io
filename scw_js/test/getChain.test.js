/**
 * Tests for getChain.js - Chain Configuration and USDC Domain Validation
 *
 * This test file validates:
 * 1. USDC configuration for all supported networks
 * 2. EIP-712 domain names match on-chain USDC contracts (CRITICAL)
 * 3. Network validation functions
 *
 * Note: Chain utilities (getViemChain, CAIP-2 conversion) are tested in @fretchen/chain-utils
 *
 * Background: CVE-2025-12-26 (USDC Domain Name Mismatch)
 * - USDC contracts use different EIP-712 domain names on different networks
 * - Optimism Mainnet: "USD Coin" (official Circle deployment)
 * - Optimism Sepolia: "USDC" (testnet deployment)
 * - Mismatch causes settlement to fail AFTER expensive operations complete
 */
import { describe, test, expect } from "vitest";
import { createPublicClient, http } from "viem";
import { optimism, optimismSepolia, base, baseSepolia } from "viem/chains";

// Import functions under test
import { getExpectedNetwork, getExpectedNetworks, validatePaymentNetwork } from "../getChain.js";
import { getGenAiNFTMainnetNetworks, getGenAiNFTTestnetNetworks } from "@fretchen/chain-utils";

// Import from chain-utils
import { getViemChain, getUSDCConfig } from "@fretchen/chain-utils";

// USDC contracts expose name() and version() functions for EIP-712 domain
// Note: They do NOT implement EIP-5267 eip712Domain(), so we read individual functions
const USDC_ABI = [
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "version",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
];

describe("getChain.js - Chain Configuration Tests", () => {
  // Note: getViemChain() tests moved to @fretchen/chain-utils
  // Note: getChainNameFromEIP155() removed - use getViemChain(network).name directly

  describe("getUSDCConfig()", () => {
    test("should return valid config for Optimism Mainnet", () => {
      const config = getUSDCConfig("eip155:10");

      expect(config.chainId).toBe(10);
      expect(config.address).toBe("0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85");
      expect(config.decimals).toBe(6);
      expect(config.usdcName).toBe("USD Coin"); // CRITICAL: Must match on-chain
      expect(config.usdcVersion).toBe("2");
    });

    test("should return valid config for Optimism Sepolia", () => {
      const config = getUSDCConfig("eip155:11155420");

      expect(config.chainId).toBe(11155420);
      expect(config.address).toBe("0x5fd84259d66Cd46123540766Be93DFE6D43130D7");
      expect(config.decimals).toBe(6);
      expect(config.usdcName).toBe("USDC"); // CRITICAL: Different from mainnet!
      expect(config.usdcVersion).toBe("2");
    });

    test("should return valid config for Base Mainnet", () => {
      const config = getUSDCConfig("eip155:8453");

      expect(config.chainId).toBe(8453);
      expect(config.address).toBe("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
      expect(config.decimals).toBe(6);
      // Note: Needs verification against on-chain contract
      expect(config.usdcName).toBeDefined();
      expect(config.usdcVersion).toBe("2");
    });

    test("should return valid config for Base Sepolia", () => {
      const config = getUSDCConfig("eip155:84532");

      expect(config.chainId).toBe(84532);
      expect(config.address).toBe("0x036CbD53842c5426634e7929541eC2318f3dCF7e");
      expect(config.decimals).toBe(6);
      expect(config.usdcName).toBeDefined();
      expect(config.usdcVersion).toBe("2");
    });

    test("should throw for unconfigured network", () => {
      expect(() => getUSDCConfig("eip155:1")).toThrow("Unsupported network: eip155:1");
    });

    test("should have consistent chainId between viem chain and USDC config", () => {
      const networks = ["eip155:10", "eip155:11155420", "eip155:8453", "eip155:84532"];

      for (const network of networks) {
        const viemChain = getViemChain(network);
        const usdcConfig = getUSDCConfig(network);

        expect(usdcConfig.chainId).toBe(viemChain.id);
      }
    });
  });

  // NOTE: getGenImgContractConfig() tests moved to @fretchen/chain-utils
  // See shared/chain-utils/test/index.test.ts

  describe("getExpectedNetworks()", () => {
    test("should return mainnet networks from chain-utils", () => {
      const result = getExpectedNetworks(false);
      const expected = getGenAiNFTMainnetNetworks();
      expect(result).toEqual(expected);
      // Verify actual networks (these should match chain-utils deployment)
      expect(result).toContain("eip155:10"); // Optimism
      expect(result).toContain("eip155:8453"); // Base
    });

    test("should return testnet networks from chain-utils", () => {
      const result = getExpectedNetworks(true);
      const expected = getGenAiNFTTestnetNetworks();
      expect(result).toEqual(expected);
      // Verify actual networks (these should match chain-utils deployment)
      expect(result).toContain("eip155:11155420"); // Optimism Sepolia
    });

    test("mainnet should have multiple networks (multi-chain support)", () => {
      const result = getExpectedNetworks(false);
      expect(result.length).toBeGreaterThanOrEqual(2); // At least Optimism + Base
    });
  });

  describe("getExpectedNetwork() - legacy", () => {
    test("should return first testnet for sepoliaTest=true", () => {
      expect(getExpectedNetwork(true)).toBe("eip155:11155420");
    });

    test("should return first mainnet for sepoliaTest=false", () => {
      expect(getExpectedNetwork(false)).toBe("eip155:10");
    });
  });

  describe("validatePaymentNetwork()", () => {
    test("should reject missing network", () => {
      const result = validatePaymentNetwork(undefined, false);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("missing_network");
    });

    test("should accept correct network for production", () => {
      const result = validatePaymentNetwork("eip155:10", false);
      expect(result.valid).toBe(true);
    });

    test("should accept correct network for test mode", () => {
      const result = validatePaymentNetwork("eip155:11155420", true);
      expect(result.valid).toBe(true);
    });

    test("should reject wrong network for production", () => {
      const result = validatePaymentNetwork("eip155:11155420", false);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("invalid_network_for_production");
      expect(result.expected).toEqual(["eip155:10", "eip155:8453"]);
      expect(result.received).toBe("eip155:11155420");
    });

    test("should accept Base network for production", () => {
      const result = validatePaymentNetwork("eip155:8453", false);
      expect(result.valid).toBe(true);
    });

    test("should reject wrong network for test mode", () => {
      const result = validatePaymentNetwork("eip155:10", true);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("invalid_network_for_test_mode");
    });
  });
});

/**
 * Integration Tests: Validate EIP-712 Domain Against On-Chain Contracts
 *
 * These tests read the actual EIP-712 domain from deployed USDC contracts
 * and verify our configuration matches. This prevents CVE-2025-12-26 type bugs.
 *
 * Requirements:
 * - Network access to RPC endpoints
 * - May be slow due to RPC calls
 *
 * Run with: npm test -- --run getChain.test.js
 * Skip in CI without RPC: Set SKIP_RPC_TESTS=true
 */
describe("EIP-712 Domain Validation (On-Chain)", () => {
  // Skip if no RPC access configured
  const skipRpcTests = process.env.SKIP_RPC_TESTS === "true";

  /**
   * Helper to wait for a specified time
   * @param {number} ms - Milliseconds to wait
   */
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Helper to retry an async function with exponential backoff
   * Useful for handling rate limits from public RPCs
   * @param {Function} fn - Async function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} baseDelay - Base delay in ms (doubles each retry)
   */
  async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        // Check if it's a rate limit error (429)
        if (error.message?.includes("429") || error.message?.includes("rate limit")) {
          if (attempt < maxRetries) {
            const waitTime = baseDelay * Math.pow(2, attempt);
            await delay(waitTime);
            continue;
          }
        }
        throw error;
      }
    }
    throw lastError;
  }

  /**
   * Helper to read EIP-712 domain (name + version) from a USDC contract
   * @param {import("viem/chains").Chain} chain
   * @param {string} contractAddress
   * @returns {Promise<{name: string, version: string}>}
   */
  async function readOnChainDomain(chain, contractAddress) {
    const client = createPublicClient({
      chain,
      transport: http(),
    });

    const name = await withRetry(() =>
      client.readContract({
        address: contractAddress,
        abi: USDC_ABI,
        functionName: "name",
      }),
    );

    // Small delay between calls to avoid hitting rate limits
    await delay(200);

    const version = await withRetry(() =>
      client.readContract({
        address: contractAddress,
        abi: USDC_ABI,
        functionName: "version",
      }),
    );

    return { name, version };
  }

  test(
    "Optimism Mainnet USDC domain should match configuration",
    { skip: skipRpcTests, timeout: 30000 },
    async () => {
      const config = getUSDCConfig("eip155:10");
      const onChainDomain = await readOnChainDomain(optimism, config.address);

      expect(config.usdcName).toBe(onChainDomain.name);
      expect(config.usdcVersion).toBe(onChainDomain.version);
    },
  );

  test(
    "Optimism Sepolia USDC domain should match configuration",
    { skip: skipRpcTests, timeout: 30000 },
    async () => {
      const config = getUSDCConfig("eip155:11155420");
      const onChainDomain = await readOnChainDomain(optimismSepolia, config.address);

      expect(config.usdcName).toBe(onChainDomain.name);
      expect(config.usdcVersion).toBe(onChainDomain.version);
    },
  );

  test(
    "Base Mainnet USDC domain should match configuration",
    { skip: skipRpcTests, timeout: 30000 },
    async () => {
      const config = getUSDCConfig("eip155:8453");
      const onChainDomain = await readOnChainDomain(base, config.address);

      expect(config.usdcName).toBe(onChainDomain.name);
      expect(config.usdcVersion).toBe(onChainDomain.version);
    },
  );

  test(
    "Base Sepolia USDC domain should match configuration",
    { skip: skipRpcTests, timeout: 30000 },
    async () => {
      const config = getUSDCConfig("eip155:84532");
      const onChainDomain = await readOnChainDomain(baseSepolia, config.address);

      expect(config.usdcName).toBe(onChainDomain.name);
      expect(config.usdcVersion).toBe(onChainDomain.version);
    },
  );

  /**
   * Summary test that validates ALL networks at once
   * This is useful for CI to get a quick overview
   */
  test(
    "All configured USDC domains should match on-chain contracts",
    { skip: skipRpcTests, timeout: 60000 },
    async () => {
      const networks = [
        { network: "eip155:10", chain: optimism },
        { network: "eip155:11155420", chain: optimismSepolia },
        { network: "eip155:8453", chain: base },
        { network: "eip155:84532", chain: baseSepolia },
      ];

      const results = [];

      for (const { network, chain } of networks) {
        const config = getUSDCConfig(network);
        try {
          const onChainDomain = await readOnChainDomain(chain, config.address);
          const nameMatch = config.usdcName === onChainDomain.name;
          const versionMatch = config.usdcVersion === onChainDomain.version;

          results.push({
            network,
            configured: { name: config.usdcName, version: config.usdcVersion },
            onChain: onChainDomain,
            valid: nameMatch && versionMatch,
          });
        } catch (error) {
          results.push({
            network,
            error: error.message,
            valid: false,
          });
        }
        // Small delay between networks to avoid rate limiting
        await delay(300);
      }

      // Log results for debugging
      console.log("\n📋 EIP-712 Domain Validation Results:");
      console.table(
        results.map((r) => ({
          Network: r.network,
          "Config Name": r.configured?.name || "N/A",
          "OnChain Name": r.onChain?.name || r.error || "N/A",
          Valid: r.valid ? "✅" : "❌",
        })),
      );

      // Assert all passed
      const failures = results.filter((r) => !r.valid);
      expect(failures).toHaveLength(0);
    },
  );
});
