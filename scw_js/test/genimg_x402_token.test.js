/**
 * Tests for genimg_x402_token.js - x402 v2 Token Payment Implementation
 *
 * Tests the complete x402 token payment flow:
 * 1. Client requests without payment → 402 with x402 v2 payment header
 * 2. Client provides payment → Facilitator verification
 * 3. Generate image + Mint NFT to client
 * 4. Settle payment via facilitator
 */
import { describe, test, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";

// Import common setup
import {
  setupGlobalMocks,
  createMockContract,
  setupTestEnvironment,
  cleanupTestEnvironment,
  setupDefaultMocks,
  mockFetchResponse,
  mockMetadataResponse,
  mockViemFunctions,
  mockGenerateAndUploadImage,
} from "./setup.js";

// Setup global mocks
setupGlobalMocks();

describe("genimg_x402_token.js - x402 v2 Token Payment Tests", () => {
  let handle;
  let create402Response;
  let mockContract;

  beforeAll(async () => {
    // Create mock contract
    mockContract = createMockContract();

    // Setup default mocks
    setupDefaultMocks(mockContract);

    // Dynamic import after mocks
    const module = await import("../genimg_x402_token.js");
    handle = module.handle;
    create402Response = module.create402Response;
  });

  beforeEach(() => {
    setupTestEnvironment({
      NFT_WALLET_ADDRESS: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
      NFT_WALLET_PRIVATE_KEY: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      FACILITATOR_URL: "http://localhost:8080",
    });
    vi.clearAllMocks();
    setupDefaultMocks(mockContract);
    mockFetchResponse(mockMetadataResponse);
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe("create402Response() - x402 v2 Payment Header", () => {
    test("should create 402 response with x402 v2 payment header", () => {
      const response = create402Response("https://api.example.com/genimg");

      expect(response.statusCode).toBe(402);
      expect(response.headers["X-Payment"]).toBeDefined();

      const payment = JSON.parse(response.headers["X-Payment"]);

      // x402 v2 structure (from preparePaymentHeader mock)
      expect(payment.x402Version).toBe(2);
      expect(payment.resource).toBeDefined();
      expect(payment.accepts).toBeInstanceOf(Array);
      expect(payment.accepts.length).toBeGreaterThan(0);

      const accept = payment.accepts[0];
      expect(accept.scheme).toBe("exact");
      expect(accept.network).toBe("eip155:10"); // Optimism Mainnet
      expect(accept.amount).toBe("1000"); // 0.001 USDC (6 decimals)
      expect(accept.asset).toBe("0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"); // USDC
      expect(accept.extra).toEqual({
        name: "USDC",
        version: "2",
      });
    });

    test("should include CORS headers", () => {
      const response = create402Response();

      expect(response.headers["Access-Control-Allow-Origin"]).toBe("*");
      expect(response.headers["Access-Control-Allow-Headers"]).toBe("*");
      expect(response.headers["Access-Control-Allow-Methods"]).toBe("*");
      expect(response.headers["Content-Type"]).toBe("application/json");
    });

    test("should include payment in response body", () => {
      const response = create402Response();
      const body = JSON.parse(response.body);

      expect(body.error).toBe("Payment required");
      expect(body.message).toContain("USDC payment");
      expect(body.payment).toBeDefined();
      expect(body.payment.x402Version).toBe(2);
      expect(body.payment.accepts).toBeDefined();
    });
  });

  describe("handle() - Request without payment", () => {
    test("should return 402 when no payment provided", async () => {
      const event = {
        httpMethod: "POST",
        headers: {},
        body: JSON.stringify({
          prompt: "A beautiful sunset",
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});

      expect(response.statusCode).toBe(402);
      expect(response.headers["X-Payment"]).toBeDefined();

      const body = JSON.parse(response.body);
      expect(body.error).toBe("Payment required");
    });

    test("should handle OPTIONS request (CORS preflight)", async () => {
      const event = {
        httpMethod: "OPTIONS",
        headers: {},
        body: "",
        path: "/genimg",
      };

      const response = await handle(event, {});

      expect(response.statusCode).toBe(200);
      expect(response.headers["Access-Control-Allow-Origin"]).toBe("*");
      expect(response.body).toBe("");
    });

    test("should reject non-POST requests", async () => {
      const event = {
        httpMethod: "GET",
        headers: {},
        body: "",
        path: "/genimg",
      };

      const response = await handle(event, {});

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("Only POST");
    });

    test("should reject invalid JSON body", async () => {
      const event = {
        httpMethod: "POST",
        headers: {},
        body: "invalid json{",
        path: "/genimg",
      };

      const response = await handle(event, {});

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("Invalid JSON");
    });

    test("should reject missing prompt", async () => {
      const event = {
        httpMethod: "POST",
        headers: {},
        body: JSON.stringify({}),
        path: "/genimg",
      };

      const response = await handle(event, {});

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("No prompt");
    });
  });

  describe("handle() - Payment verification", () => {
    const validPaymentPayload = {
      x402Version: 2,
      resource: {
        url: "https://api.example.com/genimg",
        description: "AI Image Generation with NFT Certificate",
      },
      accepted: {
        scheme: "exact",
        network: "eip155:10",
        amount: "1000",
        asset: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
        maxTimeoutSeconds: 60,
        extra: {
          name: "USDC",
          version: "2",
        },
      },
      payload: {
        signature: "0x1234567890abcdef...",
        authorization: {
          from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
          to: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
          value: "1000",
          validAfter: "1700000000",
          validBefore: "9999999999",
          nonce: "0xabc123...",
        },
      },
    };

    test("should verify payment with facilitator", async () => {
      // Mock complete workflow
      const mockMintTxHash = "0xmint123";
      const mockTransferTxHash = "0xtransfer456";
      const mockTokenId = 42;

      // Mock contract write operations
      mockContract.write.safeMint = vi.fn().mockResolvedValue(mockMintTxHash);
      mockContract.write.safeTransferFrom = vi.fn().mockResolvedValue(mockTransferTxHash);
      mockContract.read.mintPrice = vi.fn().mockResolvedValue(BigInt("10000000000000000"));

      // Mock public client with transaction receipts
      const mockPublicClient = {
        waitForTransactionReceipt: vi
          .fn()
          .mockResolvedValueOnce({
            // Mint receipt
            status: "success",
            logs: [
              {
                address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
                topics: [
                  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                  "0x0000000000000000000000000000000000000000000000000000000000000000",
                  "0x000000000000000000000000AAEBC1441323B8ad6Bdf6793A8428166b510239C",
                  `0x${mockTokenId.toString(16).padStart(64, "0")}`,
                ],
              },
            ],
          })
          .mockResolvedValueOnce({
            // Transfer receipt
            status: "success",
            logs: [],
          }),
      };

      mockViemFunctions.createPublicClient.mockReturnValue(mockPublicClient);

      // Mock facilitator responses
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          // Verification
          ok: true,
          status: 200,
          json: async () => ({
            isValid: true,
            payer: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
          }),
        })
        .mockResolvedValueOnce({
          // Metadata fetch
          ok: true,
          json: async () => mockMetadataResponse,
        })
        .mockResolvedValueOnce({
          // Settlement
          ok: true,
          json: async () => ({
            success: true,
            transaction: "0xsettlement123",
          }),
        });

      const event = {
        httpMethod: "POST",
        headers: {
          "x-payment": JSON.stringify(validPaymentPayload),
        },
        body: JSON.stringify({
          prompt: "A beautiful sunset",
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});

      expect(response.statusCode).toBe(200);

      // Verify facilitator was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/verify"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("paymentPayload"),
        }),
      );

      const body = JSON.parse(response.body);
      expect(body.payer).toBe("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
      expect(body.image_url).toBeDefined();
      expect(body.tokenId).toBeDefined();
      expect(body.mintTxHash).toBeDefined();
      expect(body.transferTxHash).toBeDefined();
    });

    test("should reject invalid payment", async () => {
      // Mock facilitator verification failure
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          isValid: false,
          invalidReason: "invalid_exact_evm_payload_signature",
          payer: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        }),
      });

      const event = {
        httpMethod: "POST",
        headers: {
          "x-payment": JSON.stringify(validPaymentPayload),
        },
        body: JSON.stringify({
          prompt: "A beautiful sunset",
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});

      expect(response.statusCode).toBe(402);

      const body = JSON.parse(response.body);
      expect(body.error).toBe("Payment verification failed");
      expect(body.reason).toBe("invalid_exact_evm_payload_signature");
    });

    test("should handle facilitator error", async () => {
      // Mock facilitator network error
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      });

      const event = {
        httpMethod: "POST",
        headers: {
          "x-payment": JSON.stringify(validPaymentPayload),
        },
        body: JSON.stringify({
          prompt: "A beautiful sunset",
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});

      expect(response.statusCode).toBe(402);

      const body = JSON.parse(response.body);
      expect(body.error).toBe("Payment verification failed");
      expect(body.reason).toContain("facilitator_error");
    });

    test("should reject unauthorized recipient (not whitelisted)", async () => {
      // Mock facilitator rejection for unauthorized recipient
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          isValid: false,
          invalidReason: "unauthorized_agent",
          recipient: "0xUnauthorized123",
        }),
      });

      const event = {
        httpMethod: "POST",
        headers: {
          "x-payment": JSON.stringify(validPaymentPayload),
        },
        body: JSON.stringify({
          prompt: "A beautiful sunset",
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});

      expect(response.statusCode).toBe(402);

      const body = JSON.parse(response.body);
      expect(body.error).toBe("Payment verification failed");
      expect(body.reason).toBe("unauthorized_agent");
    });
  });

  describe("handle() - Payment from body", () => {
    test("should accept payment from request body", async () => {
      const validPaymentPayload = {
        x402Version: 2,
        accepted: {
          scheme: "exact",
          network: "eip155:10",
          amount: "1000",
          asset: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
          payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
        },
        payload: {
          signature: "0x123...",
          authorization: {
            from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
            to: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
            value: "1000",
            validAfter: "1700000000",
            validBefore: "9999999999",
            nonce: "0xabc...",
          },
        },
      };

      // Mock complete workflow
      const mockTokenId = 99;
      mockContract.write.safeMint.mockResolvedValue("0xmintTx");
      mockContract.write.safeTransferFrom.mockResolvedValue("0xtransferTx");
      mockContract.read.mintPrice.mockResolvedValue(BigInt("10000000000000000"));

      mockViemFunctions.createPublicClient.mockReturnValue({
        waitForTransactionReceipt: vi
          .fn()
          .mockResolvedValueOnce({
            status: "success",
            logs: [
              {
                address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
                topics: [
                  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                  "0x0000000000000000000000000000000000000000000000000000000000000000",
                  "0x000000000000000000000000AAEBC1441323B8ad6Bdf6793A8428166b510239C",
                  `0x${mockTokenId.toString(16).padStart(64, "0")}`,
                ],
              },
            ],
          })
          .mockResolvedValueOnce({
            status: "success",
            logs: [],
          }),
      });

      // Mock facilitator responses
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            isValid: true,
            payer: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMetadataResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, transaction: "0xabc" }),
        });

      const event = {
        httpMethod: "POST",
        headers: {},
        body: JSON.stringify({
          prompt: "A beautiful sunset",
          payment: validPaymentPayload,
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.payer).toBe("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
      expect(body.tokenId).toBe(mockTokenId);
    });
  });

  describe("handle() - Size and mode parameters", () => {
    test("should accept valid size parameter", async () => {
      // Mock successful flow
      const mockTokenId = 77;
      mockContract.write.safeMint.mockResolvedValue("0xmintTx");
      mockContract.write.safeTransferFrom.mockResolvedValue("0xtransferTx");
      mockContract.read.mintPrice.mockResolvedValue(BigInt("10000000000000000"));

      mockViemFunctions.createPublicClient.mockReturnValue({
        waitForTransactionReceipt: vi
          .fn()
          .mockResolvedValueOnce({
            status: "success",
            logs: [
              {
                address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
                topics: [
                  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                  "0x0000000000000000000000000000000000000000000000000000000000000000",
                  "0x000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                  `0x${mockTokenId.toString(16).padStart(64, "0")}`,
                ],
              },
            ],
          })
          .mockResolvedValueOnce({
            status: "success",
            logs: [],
          }),
      });

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            isValid: true,
            payer: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMetadataResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, transaction: "0xabc" }),
        });

      const event = {
        httpMethod: "POST",
        headers: {
          "x-payment": JSON.stringify({
            accepted: {
              network: "eip155:10",
              asset: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
              payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
            },
            payload: {
              authorization: {
                from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                to: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
              },
            },
          }),
        },
        body: JSON.stringify({
          prompt: "Test",
          size: "1792x1024",
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.size).toBe("1792x1024");
    });

    test("should reject invalid size parameter", async () => {
      const event = {
        httpMethod: "POST",
        headers: {},
        body: JSON.stringify({
          prompt: "Test",
          size: "invalid",
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});
      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.error).toContain("Invalid size");
    });

    test("should require referenceImage for edit mode", async () => {
      const event = {
        httpMethod: "POST",
        headers: {},
        body: JSON.stringify({
          prompt: "Test",
          mode: "edit",
          // missing referenceImage
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});
      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.error).toContain("referenceImage");
    });
  });

  describe("Settlement flow", () => {
    test("should settle payment via facilitator (async)", async () => {
      const mockTokenId = 88;
      mockContract.write.safeMint.mockResolvedValue("0xmintTx");
      mockContract.write.safeTransferFrom.mockResolvedValue("0xtransferTx");
      mockContract.read.mintPrice.mockResolvedValue(BigInt("10000000000000000"));

      mockViemFunctions.createPublicClient.mockReturnValue({
        waitForTransactionReceipt: vi
          .fn()
          .mockResolvedValueOnce({
            status: "success",
            logs: [
              {
                address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
                topics: [
                  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                  "0x0000000000000000000000000000000000000000000000000000000000000000",
                  "0x000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                  `0x${mockTokenId.toString(16).padStart(64, "0")}`,
                ],
              },
            ],
          })
          .mockResolvedValueOnce({
            status: "success",
            logs: [],
          }),
      });

      const settleFetchCall = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          transaction: "0xsettlement123",
        }),
      });

      // Mock all fetch calls
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            isValid: true,
            payer: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMetadataResponse,
        })
        .mockImplementationOnce(settleFetchCall);

      const event = {
        httpMethod: "POST",
        headers: {
          "x-payment": JSON.stringify({
            accepted: {
              network: "eip155:10",
              asset: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
              payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
            },
            payload: {
              authorization: {
                from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
              },
            },
          }),
        },
        body: JSON.stringify({
          prompt: "Test",
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});
      expect(response.statusCode).toBe(200);

      // Settlement is async, so we check that it was initiated
      // Wait a bit for async settlement
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(settleFetchCall).toHaveBeenCalled();
    });
  });
});
