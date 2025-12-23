/**
 * Tests for Pre-Flight Checks in genimg_x402_token.js
 *
 * These tests verify that the service performs infrastructure validation
 * BEFORE starting expensive operations (BFL image generation).
 *
 * Prevents financial loss by checking:
 * 1. Server wallet has sufficient ETH balance
 * 2. NFT contract is deployed on the target chain
 * 3. RPC connectivity is working
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import {
  setupGlobalMocks,
  setupTestEnvironment,
  cleanupTestEnvironment,
  mockViemFunctions,
} from "./setup.js";

// Initialize global mocks
setupGlobalMocks();

// Import handler after mocks are set up
const { handle } = await import("../genimg_x402_token.js");

describe("Pre-Flight Checks: Insufficient Funds", () => {
  beforeAll(() => {
    setupTestEnvironment();
  });

  beforeEach(() => {
    // Setup default environment
    process.env.BFL_API_KEY = "test-bfl-key";
    process.env.NFT_WALLET_PRIVATE_KEY =
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    process.env.FACILITATOR_URL = "http://localhost:8080";
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it("should fail BEFORE image generation when server wallet has insufficient ETH", async () => {
    // Mock publicClient with VERY LOW balance
    // Required: 0.01 ETH (MINT_PRICE) + 0.001 ETH (gas) = 0.011 ETH
    // Available: Only 0.0001 ETH (clearly insufficient!)

    const mockPublicClient = {
      getBalance: vi.fn().mockResolvedValue(BigInt("100000000000000")), // 0.0001 ETH
      getBytecode: vi.fn().mockResolvedValue("0x608060..."), // Contract exists
    };

    // Make sure createPublicClient ALWAYS returns our mock
    mockViemFunctions.createPublicClient = vi.fn(() => mockPublicClient);
    mockViemFunctions.createWalletClient.mockReturnValue({
      account: { address: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C" },
    });

    mockViemFunctions.getContract.mockReturnValue({
      write: { safeMintWithRoyalty: vi.fn() },
    });

    // Mock successful payment verification
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isValid: true,
        payer: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      }),
    });

    const event = {
      httpMethod: "POST",
      headers: {
        "Payment-Signature": Buffer.from(
          JSON.stringify({
            scheme: "exact",
            network: "eip155:11155420", // Optimism Sepolia
            authorization: { v: 27, r: "0xabc", s: "0xdef" },
            transfer: {
              from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
              to: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
              value: "10000000000000000", // 0.01 ETH payment
            },
          }),
        ).toString("base64"),
      },
      body: JSON.stringify({ prompt: "Test image" }),
    };

    const response = await handle(event);

    // Should return 500 with clear error message
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);

    // Check error structure and details
    expect(body.reason).toBe("insufficient_server_funds");
    expect(body.message).toContain("Server wallet has insufficient funds");
    expect(body.message).toContain("Optimism Sepolia");
    expect(body.serverAddress).toBe("0xAAEBC1441323B8ad6Bdf6793A8428166b510239C");
    expect(body.currentBalance).toMatch(/0\.000100 ETH/);
    expect(body.requiredBalance).toMatch(/0\.011000 ETH/);
    expect(body.deficit).toMatch(/0\.010900 ETH/);
    expect(body.chain).toBe("Optimism Sepolia");

    // Pre-flight checks should have been called
    expect(mockPublicClient.getBalance).toHaveBeenCalledWith({
      address: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
    });
  });

  it("should fail when NFT contract not deployed on chain", async () => {
    // Mock publicClient with SUFFICIENT balance but NO contract
    const mockPublicClient = {
      getBalance: vi.fn().mockResolvedValue(BigInt("100000000000000000")), // 0.1 ETH (plenty!)
      getBytecode: vi.fn().mockResolvedValue("0x"), // No contract bytecode!
    };

    mockViemFunctions.createPublicClient = vi.fn(() => mockPublicClient);

    mockViemFunctions.createWalletClient.mockReturnValue({
      account: { address: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C" },
    });

    mockViemFunctions.getContract.mockReturnValue({
      write: { safeMintWithRoyalty: vi.fn() },
    });

    // Mock successful payment verification
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isValid: true,
        payer: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      }),
    });

    const event = {
      httpMethod: "POST",
      headers: {
        "Payment-Signature": Buffer.from(
          JSON.stringify({
            scheme: "exact",
            network: "eip155:84532", // Base Sepolia
            authorization: { v: 27, r: "0xabc", s: "0xdef" },
            transfer: {
              from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
              to: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
              value: "10000000000000000",
            },
          }),
        ).toString("base64"),
      },
      body: JSON.stringify({ prompt: "Test" }),
    };

    const response = await handle(event);

    // Should return 500 with contract deployment error
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);

    expect(body.reason).toBe("contract_not_deployed");
    expect(body.message).toContain("NFT contract not deployed");
    expect(body.message).toContain("Base Sepolia");
    expect(body.contractAddress).toBe("0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb");
    expect(body.chain).toBe("Base Sepolia");

    // Balance check should have passed, bytecode check failed
    expect(mockPublicClient.getBalance).toHaveBeenCalled();
    expect(mockPublicClient.getBytecode).toHaveBeenCalledWith({
      address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
    });
  });

  it("should provide detailed balance information across all 4 chains", async () => {
    const testChains = [
      { network: "eip155:10", name: "Optimism", balance: BigInt("5000000000000000") }, // 0.005 ETH
      { network: "eip155:11155420", name: "Optimism Sepolia", balance: BigInt("2000000000000000") }, // 0.002 ETH
      { network: "eip155:8453", name: "Base", balance: BigInt("3000000000000000") }, // 0.003 ETH
      { network: "eip155:84532", name: "Base Sepolia", balance: BigInt("1000000000000000") }, // 0.001 ETH
    ];

    for (const chain of testChains) {
      const mockPublicClient = {
        getBalance: vi.fn().mockResolvedValue(chain.balance),
        getBytecode: vi.fn().mockResolvedValue("0x608060"),
      };

      mockViemFunctions.createPublicClient = vi.fn(() => mockPublicClient);

      mockViemFunctions.createWalletClient.mockReturnValue({
        account: { address: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C" },
      });

      mockViemFunctions.getContract.mockReturnValue({
        write: { safeMintWithRoyalty: vi.fn() },
      });

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isValid: true,
          payer: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        }),
      });

      const event = {
        httpMethod: "POST",
        headers: {
          "Payment-Signature": Buffer.from(
            JSON.stringify({
              scheme: "exact",
              network: chain.network,
              authorization: { v: 27, r: "0xabc", s: "0xdef" },
              transfer: {
                from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                to: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
                value: "10000000000000000",
              },
            }),
          ).toString("base64"),
        },
        body: JSON.stringify({ prompt: "Test" }),
      };

      const response = await handle(event);
      const body = JSON.parse(response.body);

      // All should fail due to insufficient balance
      expect(response.statusCode).toBe(500);
      expect(body.chain).toBe(chain.name);
      expect(body.reason).toBe("insufficient_server_funds");
      expect(body.currentBalance).toBeDefined();
      expect(body.requiredBalance).toMatch(/0\.011000 ETH/);
      expect(body.deficit).toBeDefined();

      vi.clearAllMocks();
    }
  });

  it("should handle RPC errors gracefully", async () => {
    // Mock RPC connection failure
    const mockPublicClient = {
      getBalance: vi.fn().mockRejectedValue(new Error("RPC connection failed")),
      getBytecode: vi.fn().mockResolvedValue("0x608060"),
    };

    mockViemFunctions.createPublicClient = vi.fn(() => mockPublicClient);

    mockViemFunctions.createWalletClient.mockReturnValue({
      account: { address: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C" },
    });

    mockViemFunctions.getContract.mockReturnValue({
      write: { safeMintWithRoyalty: vi.fn() },
    });

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isValid: true,
        payer: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      }),
    });

    const event = {
      httpMethod: "POST",
      headers: {
        "Payment-Signature": Buffer.from(
          JSON.stringify({
            scheme: "exact",
            network: "eip155:11155420",
            authorization: { v: 27, r: "0xabc", s: "0xdef" },
            transfer: {
              from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
              to: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
              value: "10000000000000000",
            },
          }),
        ).toString("base64"),
      },
      body: JSON.stringify({ prompt: "Test" }),
    };

    const response = await handle(event);

    // Should return 500 with pre-flight check error
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);

    expect(body.reason).toBe("preflight_check_failed");
    expect(body.message).toContain("Failed to perform pre-flight checks");
    expect(body.message).toContain("Optimism Sepolia");
    expect(body.chain).toBe("Optimism Sepolia");

    // Balance check should have been attempted
    expect(mockPublicClient.getBalance).toHaveBeenCalled();
  });
});
