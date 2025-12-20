// @ts-check

/**
 * Tests for x402 Agent Whitelist Module
 */
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isAgentWhitelisted,
  clearWhitelistCache,
  getWhitelistCacheStats,
} from "../x402_whitelist.js";

// Mock viem
vi.mock("viem", async () => {
  const actual = await vi.importActual("viem");

  // Mock contract responses
  const mockContractRead = {
    isAuthorizedAgent: vi.fn(async ([address]) => {
      // Simulate GenImNFTv4 authorization
      if (address.toLowerCase() === "0xaaebcd87d01234567890123456789012345678ab") {
        return true; // Authorized agent
      }
      return false; // Not authorized
    }),
  };

  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      // Mock public client
    })),
    getContract: vi.fn(() => ({
      read: mockContractRead,
    })),
  };
});

describe("x402 Agent Whitelist", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear cache before each test
    clearWhitelistCache();

    // Reset environment variables
    process.env.GENIMG_V4_MAINNET_ADDRESS = "0x1111111111111111111111111111111111111111";
    process.env.GENIMG_V4_SEPOLIA_ADDRESS = "0x2222222222222222222222222222222222222222";
    process.env.TEST_WALLETS = "";
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
    clearWhitelistCache();
  });

  describe("Manual Whitelist", () => {
    test("whitelists manually added address on Mainnet", async () => {
      const manualWallet = "0x1234567890123456789012345678901234567890";
      process.env.MANUAL_WHITELIST = manualWallet;

      const result = await isAgentWhitelisted(manualWallet, "eip155:10");

      expect(result.isWhitelisted).toBe(true);
      expect(result.source).toBe("manual");
    });

    test("whitelists manually added address on Sepolia", async () => {
      const manualWallet = "0x1234567890123456789012345678901234567890";
      process.env.MANUAL_WHITELIST = manualWallet;

      const result = await isAgentWhitelisted(manualWallet, "eip155:11155420");

      expect(result.isWhitelisted).toBe(true);
      expect(result.source).toBe("manual");
    });

    test("handles multiple manual whitelist addresses", async () => {
      const wallet1 = "0x1111111111111111111111111111111111111111";
      const wallet2 = "0x2222222222222222222222222222222222222222";
      process.env.MANUAL_WHITELIST = `${wallet1},${wallet2}`;

      const result1 = await isAgentWhitelisted(wallet1, "eip155:10");
      const result2 = await isAgentWhitelisted(wallet2, "eip155:11155420");

      expect(result1.isWhitelisted).toBe(true);
      expect(result2.isWhitelisted).toBe(true);
    });

    test("is case-insensitive for manual whitelist", async () => {
      const manualWallet = "0xAaBbCcDdEeFf11223344556677889900AaBbCcDd";
      process.env.MANUAL_WHITELIST = manualWallet;

      const result = await isAgentWhitelisted(manualWallet.toUpperCase(), "eip155:10");

      expect(result.isWhitelisted).toBe(true);
      expect(result.source).toBe("manual");
    });

    test("manual whitelist has higher priority than contracts", async () => {
      const manualWallet = "0x9999999999999999999999999999999999999999";
      process.env.MANUAL_WHITELIST = manualWallet;
      process.env.GENIMG_V4_SEPOLIA_ADDRESS = "0x2222222222222222222222222222222222222222";

      // Should use manual source, not check contract
      const result = await isAgentWhitelisted(manualWallet, "eip155:11155420");

      expect(result.isWhitelisted).toBe(true);
      expect(result.source).toBe("manual");
    });
  });

  describe("Test Wallets", () => {
    test("whitelists test wallet on Sepolia", async () => {
      const testWallet = "0x1234567890123456789012345678901234567890";
      process.env.TEST_WALLETS = testWallet;

      const result = await isAgentWhitelisted(testWallet, "eip155:11155420");

      expect(result.isWhitelisted).toBe(true);
      expect(result.source).toBe("test_wallets");
    });

    test("does not whitelist test wallet on Mainnet", async () => {
      const testWallet = "0x1234567890123456789012345678901234567890";
      process.env.TEST_WALLETS = testWallet;

      const result = await isAgentWhitelisted(testWallet, "eip155:10");

      expect(result.isWhitelisted).toBe(false);
    });

    test("handles multiple test wallets", async () => {
      const wallet1 = "0x1111111111111111111111111111111111111111";
      const wallet2 = "0x2222222222222222222222222222222222222222";
      process.env.TEST_WALLETS = `${wallet1},${wallet2}`;

      const result1 = await isAgentWhitelisted(wallet1, "eip155:11155420");
      const result2 = await isAgentWhitelisted(wallet2, "eip155:11155420");

      expect(result1.isWhitelisted).toBe(true);
      expect(result2.isWhitelisted).toBe(true);
    });

    test("is case-insensitive for test wallets", async () => {
      const testWallet = "0xAaBbCcDdEeFf11223344556677889900AaBbCcDd";
      process.env.TEST_WALLETS = testWallet;

      const result = await isAgentWhitelisted(testWallet.toUpperCase(), "eip155:11155420");

      expect(result.isWhitelisted).toBe(true);
    });
  });

  describe("GenImNFTv4 Contract", () => {
    test("whitelists authorized agent from GenImNFTv4 on Mainnet", async () => {
      const authorizedAgent = "0xAAEBCD87D01234567890123456789012345678AB";

      const result = await isAgentWhitelisted(authorizedAgent, "eip155:10");

      expect(result.isWhitelisted).toBe(true);
      expect(result.source).toBe("genimg_v4");
    });

    test("rejects unauthorized agent from GenImNFTv4 on Mainnet", async () => {
      const unauthorizedAgent = "0x0000000000000000000000000000000000000000";

      const result = await isAgentWhitelisted(unauthorizedAgent, "eip155:10");

      expect(result.isWhitelisted).toBe(false);
      expect(result.source).toBeUndefined();
    });

    test("uses correct contract address for mainnet", async () => {
      const agent = "0xAAEBCD87D01234567890123456789012345678AB";

      // Mainnet has contracts deployed
      const mainnetResult = await isAgentWhitelisted(agent, "eip155:10");
      expect(mainnetResult).toBeDefined();
      expect(mainnetResult.isWhitelisted).toBe(true);
      expect(mainnetResult.source).toBe("genimg_v4");
    });
  });

  describe("Multi-Source Whitelist (OR Logic)", () => {
    test("whitelists if ANY source returns true", async () => {
      const testWallet = "0x1234567890123456789012345678901234567890";
      process.env.TEST_WALLETS = testWallet;

      // Should be whitelisted via test_wallets even if GenImNFTv4 returns false
      const result = await isAgentWhitelisted(testWallet, "eip155:11155420");

      expect(result.isWhitelisted).toBe(true);
      expect(result.source).toBe("test_wallets");
    });

    test("checks multiple sources when first fails (Mainnet)", async () => {
      const authorizedAgent = "0xAAEBCD87D01234567890123456789012345678AB";
      process.env.TEST_WALLETS = "0x9999999999999999999999999999999999999999";

      // Not in test_wallets, but should be found in GenImNFTv4 on Mainnet
      const result = await isAgentWhitelisted(authorizedAgent, "eip155:10");

      expect(result.isWhitelisted).toBe(true);
      expect(result.source).toBe("genimg_v4");
    });

    test("rejects if ALL sources return false", async () => {
      const unauthorizedAgent = "0x0000000000000000000000000000000000000000";
      process.env.TEST_WALLETS = "0x9999999999999999999999999999999999999999";

      const result = await isAgentWhitelisted(unauthorizedAgent, "eip155:11155420");

      expect(result.isWhitelisted).toBe(false);
    });
  });

  describe("Caching", () => {
    test("caches whitelist results", async () => {
      const agent = "0xAAEBCD87D01234567890123456789012345678AB";

      // First call
      const result1 = await isAgentWhitelisted(agent, "eip155:11155420");

      // Second call should use cache
      const result2 = await isAgentWhitelisted(agent, "eip155:11155420");

      expect(result1.isWhitelisted).toBe(result2.isWhitelisted);
      expect(result1.source).toBe(result2.source);

      // Check cache stats
      const stats = getWhitelistCacheStats();
      expect(stats.size).toBe(1);
    });

    test("cache is case-insensitive", async () => {
      const agent = "0xAAEBCD87D01234567890123456789012345678AB";

      await isAgentWhitelisted(agent.toLowerCase(), "eip155:11155420");
      await isAgentWhitelisted(agent.toUpperCase(), "eip155:11155420");

      const stats = getWhitelistCacheStats();
      expect(stats.size).toBe(1); // Same cache entry
    });

    test("clearWhitelistCache() empties cache", async () => {
      const agent = "0xAAEBCD87D01234567890123456789012345678AB";

      await isAgentWhitelisted(agent, "eip155:11155420");

      let stats = getWhitelistCacheStats();
      expect(stats.size).toBe(1);

      clearWhitelistCache();

      stats = getWhitelistCacheStats();
      expect(stats.size).toBe(0);
    });

    test("different networks have separate cache entries", async () => {
      const agent = "0xAAEBCD87D01234567890123456789012345678AB";

      await isAgentWhitelisted(agent, "eip155:10");
      await isAgentWhitelisted(agent, "eip155:11155420");

      const stats = getWhitelistCacheStats();
      expect(stats.size).toBe(2);
    });
  });

  describe("Cache Statistics", () => {
    test("getWhitelistCacheStats() returns correct structure", () => {
      const stats = getWhitelistCacheStats();

      expect(stats).toHaveProperty("size");
      expect(stats).toHaveProperty("entries");
      expect(Array.isArray(stats.entries)).toBe(true);
    });

    test("cache entries include age", async () => {
      const agent = "0xAAEBCD87D01234567890123456789012345678AB";

      await isAgentWhitelisted(agent, "eip155:11155420");

      const stats = getWhitelistCacheStats();
      expect(stats.entries[0]).toHaveProperty("age");
      expect(typeof stats.entries[0].age).toBe("number");
      expect(stats.entries[0].age).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Error Handling", () => {
    test("handles invalid network gracefully", async () => {
      const agent = "0xAAEBCD87D01234567890123456789012345678AB";

      // Invalid network should be caught and return false
      const result = await isAgentWhitelisted(agent, "eip155:999999");

      expect(result.isWhitelisted).toBe(false);
    });
  });
});
