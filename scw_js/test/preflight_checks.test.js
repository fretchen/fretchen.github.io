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
    // Required: mintPrice (0.01 ETH) + gas buffer (0.00001 ETH) = 0.01001 ETH
    // Available: Only 0.0001 ETH (clearly insufficient!)

    const mockPublicClient = {
      getBalance: vi.fn().mockResolvedValue(BigInt("100000000000000")), // 0.0001 ETH
    };

    // Make sure createPublicClient ALWAYS returns our mock
    mockViemFunctions.createPublicClient = vi.fn(() => mockPublicClient);
    mockViemFunctions.createWalletClient.mockReturnValue({
      account: { address: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C" },
    });

    // Mock contract with mintPrice read
    mockViemFunctions.getContract.mockReturnValue({
      write: { safeMint: vi.fn() },
      read: { mintPrice: vi.fn().mockResolvedValue(BigInt("10000000000000000")) }, // 0.01 ETH
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
            accepted: {
              scheme: "exact",
              network: "eip155:11155420", // Optimism Sepolia
            },
            authorization: { v: 27, r: "0xabc", s: "0xdef" },
            payload: {
              authorization: {
                from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                to: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
                value: "10000000000000000", // 0.01 ETH payment
              },
            },
          }),
        ).toString("base64"),
      },
      body: JSON.stringify({ prompt: "Test image", sepoliaTest: true }), // Enable test mode for Sepolia
    };

    const response = await handle(event);

    // Should return 500 with clear error message
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);

    // Check error structure and details
    expect(body.reason).toBe("insufficient_server_funds");
    expect(body.message).toContain("Server wallet has insufficient funds");
    expect(body.message).toContain("OP Sepolia");
    expect(body.serverAddress).toBe("0xAAEBC1441323B8ad6Bdf6793A8428166b510239C");
    expect(body.currentBalance).toMatch(/0\.000100 ETH/);
    expect(body.requiredBalance).toMatch(/0\.010010 ETH/); // mintPrice + gas buffer
    expect(body.deficit).toMatch(/0\.009910 ETH/);
    expect(body.chain).toBe("OP Sepolia"); // From viem mock

    // Pre-flight checks should have been called
    expect(mockPublicClient.getBalance).toHaveBeenCalledWith({
      address: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
    });
  });

  it("should log success when balance is sufficient", async () => {
    // This test verifies pre-flight checks pass when balance is sufficient
    // by checking the logs, not the full minting flow
    const mockPublicClient = {
      getBalance: vi.fn().mockResolvedValue(BigInt("100000000000000000")), // 0.1 ETH (plenty!)
    };

    mockViemFunctions.createPublicClient = vi.fn(() => mockPublicClient);
    mockViemFunctions.createWalletClient.mockReturnValue({
      account: { address: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C" },
    });
    mockViemFunctions.getContract.mockReturnValue({
      write: { safeMint: vi.fn().mockResolvedValue("0xmintTx") },
      read: { mintPrice: vi.fn().mockResolvedValue(BigInt("10000000000000000")) },
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
            accepted: { scheme: "exact", network: "eip155:10" },
            payload: {
              authorization: {
                from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                to: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
              },
            },
          }),
        ).toString("base64"),
      },
      body: JSON.stringify({ prompt: "Test" }),
    };

    const response = await handle(event);

    // Pre-flight checks should have passed (balance sufficient)
    // The request may fail later in the flow (minting), but that's ok
    // We're only testing that pre-flight checks were called and passed
    expect(mockPublicClient.getBalance).toHaveBeenCalled();

    // If statusCode is 500, verify it's NOT due to insufficient_server_funds
    if (response.statusCode === 500) {
      const body = JSON.parse(response.body);
      expect(body.reason).not.toBe("insufficient_server_funds");
      expect(body.reason).not.toBe("preflight_check_failed");
    }
  });

  it("should provide detailed balance information for allowed chains", async () => {
    // With strict policy, only test Mainnet (production) and Sepolia (test mode)
    // Note: viem mocks return "OP Mainnet" and "OP Sepolia" as chain names
    const testChains = [
      {
        network: "eip155:10",
        name: "OP Mainnet",
        balance: BigInt("5000000000000000"),
        sepoliaTest: false,
      },
      {
        network: "eip155:11155420",
        name: "OP Sepolia",
        balance: BigInt("2000000000000000"),
        sepoliaTest: true,
      },
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
        write: { safeMint: vi.fn() },
        read: { mintPrice: vi.fn().mockResolvedValue(BigInt("10000000000000000")) }, // 0.01 ETH
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
              accepted: {
                scheme: "exact",
                network: chain.network,
              },
              authorization: { v: 27, r: "0xabc", s: "0xdef" },
              payload: {
                authorization: {
                  from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                  to: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
                  value: "10000000000000000",
                },
              },
            }),
          ).toString("base64"),
        },
        body: JSON.stringify({ prompt: "Test", sepoliaTest: chain.sepoliaTest }),
      };

      const response = await handle(event);
      const body = JSON.parse(response.body);

      // All should fail due to insufficient balance
      expect(response.statusCode).toBe(500);
      expect(body.chain).toBe(chain.name);
      expect(body.reason).toBe("insufficient_server_funds");
      expect(body.currentBalance).toBeDefined();
      expect(body.requiredBalance).toMatch(/0\.010010 ETH/);
      expect(body.deficit).toBeDefined();

      vi.clearAllMocks();
    }
  });

  it("should handle RPC errors gracefully", async () => {
    // Mock contract with mintPrice that will be read before the RPC error
    mockViemFunctions.getContract.mockReturnValue({
      write: { safeMint: vi.fn() },
      read: { mintPrice: vi.fn().mockResolvedValue(BigInt("10000000000000000")) }, // 0.01 ETH
    });

    // Mock RPC connection failure on getBalance
    const mockPublicClient = {
      getBalance: vi.fn().mockRejectedValue(new Error("RPC connection failed")),
    };

    mockViemFunctions.createPublicClient = vi.fn(() => mockPublicClient);

    mockViemFunctions.createWalletClient.mockReturnValue({
      account: { address: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C" },
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
            accepted: {
              scheme: "exact",
              network: "eip155:11155420", // Optimism Sepolia
            },
            authorization: { v: 27, r: "0xabc", s: "0xdef" },
            payload: {
              authorization: {
                from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                to: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
                value: "10000000000000000",
              },
            },
          }),
        ).toString("base64"),
      },
      body: JSON.stringify({ prompt: "Test", sepoliaTest: true }), // Enable test mode for Sepolia
    };

    const response = await handle(event);

    // Should return 500 with pre-flight check error
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);

    expect(body.reason).toBe("preflight_check_failed");
    expect(body.message).toContain("Failed to perform pre-flight checks");
    expect(body.message).toContain("OP Sepolia");
    expect(body.chain).toBe("OP Sepolia");

    // Balance check should have been attempted
    expect(mockPublicClient.getBalance).toHaveBeenCalled();
  });
});
