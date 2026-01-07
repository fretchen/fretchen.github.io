/**
 * Tests for genimg_x402_token.js - x402 v2 Token Payment Implementation
 *
 * x402 v2 Architecture (Pull Model):
 * - Server offers multiple networks in 402 response (accepts array)
 * - Client selects locally from offered networks (default: accepts[0])
 * - Server can restrict offered networks via `networks` parameter
 * - New: `sepoliaTest` body flag controls server-side network offering
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
} from "./setup.js";

// Setup global mocks
setupGlobalMocks();

describe("genimg_x402_token.js - x402 v2 Token Payment Tests", () => {
  let handle;
  let create402Response;
  let createPaymentRequirements;
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

    // Import x402 helper functions
    const x402Module = await import("../x402_server.js");
    createPaymentRequirements = x402Module.createPaymentRequirements;
  });

  beforeEach(() => {
    setupTestEnvironment({
      NFT_WALLET_PRIVATE_KEY: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      FACILITATOR_URL: "http://localhost:8080",
    });
    vi.clearAllMocks();
    setupDefaultMocks(mockContract);
    mockFetchResponse(mockMetadataResponse);
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  // Helper function to setup successful minting flow
  // @param {number} mockTokenId - Token ID to use in mock
  // @param {string} network - CAIP-2 network ID (e.g., "eip155:10" or "eip155:11155420")
  function setupSuccessfulMintingFlow(mockTokenId = 42, network = "eip155:10") {
    // Determine contract address based on network
    const contractAddress =
      network === "eip155:11155420"
        ? "0x10827cC42a09D0BAD2d43134C69F0e776D853D85" // Sepolia
        : "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb"; // Mainnet

    mockContract.write.safeMint.mockResolvedValue("0xmintTx");
    mockContract.write.safeTransferFrom.mockResolvedValue("0xtransferTx");
    mockContract.read.mintPrice.mockResolvedValue(BigInt("10000000000000000"));

    const mockPublicClient = {
      getBalance: vi.fn().mockResolvedValue(BigInt("1000000000000000000")), // 1 ETH
      readContract: vi.fn().mockResolvedValue(BigInt("10000000")), // 10 USDC
      getBytecode: vi.fn().mockResolvedValue("0x1234..."), // Contract exists
      waitForTransactionReceipt: vi
        .fn()
        .mockResolvedValueOnce({
          status: "success",
          logs: [
            {
              address: contractAddress, // Use network-specific address
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
    };

    mockViemFunctions.createPublicClient.mockReturnValue(mockPublicClient);

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
        json: async () => ({ success: true, transaction: "0xsettlement" }),
      });
  }

  describe("create402Response() - x402 v2 Payment Header", () => {
    test("should create 402 response with x402 v2 payment header", () => {
      const paymentRequirements = createPaymentRequirements({
        resourceUrl: "https://api.example.com/genimg",
        description: "AI Image Generation",
        mimeType: "application/json",
        amount: "1000",
        payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
      });
      const response = create402Response(paymentRequirements);

      expect(response.statusCode).toBe(402);
      expect(response.headers["X-Payment"]).toBeDefined();

      const payment = JSON.parse(response.headers["X-Payment"]);

      // x402 v2 structure
      expect(payment.x402Version).toBe(2);
      expect(payment.resource).toBeDefined();
      expect(payment.accepts).toBeInstanceOf(Array);
      expect(payment.accepts.length).toBeGreaterThan(0);

      const accept = payment.accepts[0];
      expect(accept.scheme).toBe("exact");
      expect(accept.network).toBe("eip155:11155420"); // Optimism Sepolia (jetzt ZUERST)
      expect(accept.amount).toBe("1000"); // 0.001 USDC (6 decimals)
      expect(accept.asset).toBe("0x5fd84259d66Cd46123540766Be93DFE6D43130D7"); // USDC Sepolia
      expect(accept.extra).toEqual({
        name: "USDC",
        version: "2",
      });
    });

    test("should offer multiple networks in 402 response (Sepolia first)", () => {
      const paymentRequirements = createPaymentRequirements({
        resourceUrl: "/genimg",
        description: "AI Image Generation",
        mimeType: "application/json",
        amount: "1000",
        payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
      });
      const response = create402Response(paymentRequirements);
      const payment = JSON.parse(response.headers["X-Payment"]);

      expect(payment.accepts).toBeInstanceOf(Array);
      expect(payment.accepts.length).toBeGreaterThanOrEqual(2); // Multiple networks!

      // ⚠️ ORDER CHANGED: Sepolia is now FIRST in NETWORK_CONFIG
      // This matters because default x402 client selects accepts[0]

      // Optimism Sepolia - NOW FIRST
      const sepolia = payment.accepts[0];
      expect(sepolia.network).toBe("eip155:11155420");
      expect(sepolia.asset).toBe("0x5fd84259d66Cd46123540766Be93DFE6D43130D7");
      expect(sepolia.amount).toBe("1000");

      // Optimism Mainnet - NOW SECOND
      const mainnet = payment.accepts[1];
      expect(mainnet.network).toBe("eip155:10");
      expect(mainnet.asset).toBe("0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85");
      expect(mainnet.amount).toBe("1000");
    });

    test("should include CORS headers", () => {
      const paymentRequirements = createPaymentRequirements({
        resourceUrl: "/genimg",
        description: "AI Image Generation",
        mimeType: "application/json",
        amount: "1000",
        payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
      });
      const response = create402Response(paymentRequirements);

      expect(response.headers["Access-Control-Allow-Origin"]).toBe("*");
      expect(response.headers["Access-Control-Allow-Headers"]).toBe("*");
      expect(response.headers["Access-Control-Allow-Methods"]).toBe("*");
      expect(response.headers["Content-Type"]).toBe("application/json");
    });

    test("should include payment in response body", () => {
      const paymentRequirements = createPaymentRequirements({
        resourceUrl: "/genimg",
        description: "AI Image Generation",
        mimeType: "application/json",
        amount: "1000",
        payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
      });
      const response = create402Response(paymentRequirements);
      const body = JSON.parse(response.body);

      // x402 Client expects payment fields directly in body (not nested)
      expect(body.x402Version).toBe(2);
      expect(body.accepts).toBeDefined();
      expect(body.resource).toBeDefined();
    });

    test("should restrict to Sepolia only when networks parameter is set", () => {
      // Test server-side network restriction via networks parameter
      const paymentRequirements = createPaymentRequirements({
        resourceUrl: "/genimg",
        description: "AI Image Generation",
        mimeType: "application/json",
        amount: "1000",
        payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
        networks: ["eip155:11155420"], // Only Sepolia
      });
      const response = create402Response(paymentRequirements);
      const payment = JSON.parse(response.headers["X-Payment"]);

      // Should only offer Sepolia
      expect(payment.accepts).toBeInstanceOf(Array);
      expect(payment.accepts.length).toBe(1);
      expect(payment.accepts[0].network).toBe("eip155:11155420");
      expect(payment.accepts[0].asset).toBe("0x5fd84259d66Cd46123540766Be93DFE6D43130D7");
    });

    test("should offer all networks when networks parameter is undefined", () => {
      // Test default behavior: offer all networks
      const paymentRequirements = createPaymentRequirements({
        resourceUrl: "/genimg",
        description: "AI Image Generation",
        mimeType: "application/json",
        amount: "1000",
        payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
        networks: undefined, // Default: all networks
      });
      const response = create402Response(paymentRequirements);
      const payment = JSON.parse(response.headers["X-Payment"]);

      // Should offer all configured networks (Optimism + Base, Mainnet + Testnet)
      expect(payment.accepts).toBeInstanceOf(Array);
      expect(payment.accepts.length).toBeGreaterThanOrEqual(4);
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
      // Body now contains payment fields directly (x402 v2 format)
      expect(body.x402Version).toBe(2);
      expect(body.accepts).toBeDefined();
    });

    test("should restrict to Sepolia when sepoliaTest flag is true", async () => {
      const event = {
        httpMethod: "POST",
        headers: {},
        body: JSON.stringify({
          prompt: "Test image",
          sepoliaTest: true, // Request Sepolia-only
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});

      expect(response.statusCode).toBe(402);
      const body = JSON.parse(response.body);

      // Should only offer Sepolia network
      expect(body.accepts).toBeInstanceOf(Array);
      expect(body.accepts.length).toBe(1);
      expect(body.accepts[0].network).toBe("eip155:11155420");
    });

    test("should offer Mainnet only when sepoliaTest flag is false (production mode)", async () => {
      const event = {
        httpMethod: "POST",
        headers: {},
        body: JSON.stringify({
          prompt: "Production image",
          sepoliaTest: false, // Production: Mainnet only
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});

      expect(response.statusCode).toBe(402);
      const body = JSON.parse(response.body);

      // Production mode: only Mainnet
      expect(body.accepts).toBeInstanceOf(Array);
      expect(body.accepts.length).toBe(1);
      expect(body.accepts[0].network).toBe("eip155:10"); // Optimism Mainnet
    });

    test("should offer Mainnet only when sepoliaTest flag is omitted (default: production)", async () => {
      const event = {
        httpMethod: "POST",
        headers: {},
        body: JSON.stringify({
          prompt: "Default behavior",
          // sepoliaTest omitted - default to production (Mainnet only)
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});

      expect(response.statusCode).toBe(402);
      const body = JSON.parse(response.body);

      // Default is production mode: only Mainnet
      expect(body.accepts).toBeInstanceOf(Array);
      expect(body.accepts.length).toBe(1);
      expect(body.accepts[0].network).toBe("eip155:10"); // Optimism Mainnet
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
        network: "eip155:10", // Optimism Mainnet
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
      // Setup successful minting flow
      const mockTokenId = 42;
      setupSuccessfulMintingFlow(mockTokenId);

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

      const mockTokenId = 99;
      setupSuccessfulMintingFlow(mockTokenId);

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
      const mockTokenId = 77;
      setupSuccessfulMintingFlow(mockTokenId);

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

  describe("handle() - Multi-Network Support (x402 v2 Pull Model)", () => {
    // x402 v2: Server offers networks, client selects locally
    // These tests verify that server correctly processes payments from different networks

    test("should verify Optimism Mainnet payment", async () => {
      const mockTokenId = 100;
      setupSuccessfulMintingFlow(mockTokenId);

      const mainnetPayment = {
        x402Version: 2,
        accepted: {
          scheme: "exact",
          network: "eip155:10", // Optimism Mainnet
          amount: "1000",
          asset: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // Mainnet USDC
          payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
        },
        payload: {
          authorization: {
            from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
            to: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
            value: "1000",
          },
        },
        network: "eip155:10", // Client gewähltes Network
      };

      const event = {
        httpMethod: "POST",
        headers: {
          "x-payment": JSON.stringify(mainnetPayment),
        },
        body: JSON.stringify({
          prompt: "Test Mainnet",
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});
      expect(response.statusCode).toBe(200);

      // Verify facilitator was called with correct network
      const verifyCall = global.fetch.mock.calls.find((call) => call[0].includes("/verify"));
      expect(verifyCall).toBeDefined();

      const verifyBody = JSON.parse(verifyCall[1].body);
      expect(verifyBody.paymentRequirements.network).toBe("eip155:10");
      expect(verifyBody.paymentRequirements.asset).toBe(
        "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      );
    });

    test("should verify Optimism Sepolia payment (test mode)", async () => {
      const mockTokenId = 101;
      setupSuccessfulMintingFlow(mockTokenId, "eip155:11155420"); // Specify Sepolia network

      const sepoliaPayment = {
        x402Version: 2,
        accepted: {
          scheme: "exact",
          network: "eip155:11155420", // Optimism Sepolia
          amount: "1000",
          asset: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7", // Sepolia USDC
          payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
        },
        payload: {
          authorization: {
            from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
            to: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
            value: "1000",
          },
        },
        network: "eip155:11155420", // Client gewähltes Network
      };

      const event = {
        httpMethod: "POST",
        headers: {
          "x-payment": JSON.stringify(sepoliaPayment),
        },
        body: JSON.stringify({
          prompt: "Test Sepolia",
          sepoliaTest: true, // REQUIRED: Enable test mode for Sepolia
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});
      expect(response.statusCode).toBe(200);

      // Verify facilitator was called with correct network
      const verifyCall = global.fetch.mock.calls.find((call) => call[0].includes("/verify"));
      expect(verifyCall).toBeDefined();

      const verifyBody = JSON.parse(verifyCall[1].body);
      expect(verifyBody.paymentRequirements.network).toBe("eip155:11155420");
      expect(verifyBody.paymentRequirements.asset).toBe(
        "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
      );
    });

    test("should reject unsupported network (production only accepts Mainnet)", async () => {
      const unsupportedPayment = {
        x402Version: 2,
        accepted: {
          scheme: "exact",
          network: "eip155:1", // Ethereum Mainnet (not supported)
          amount: "1000",
          asset: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
        },
        payload: {
          authorization: {
            from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
            to: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
            value: "1000",
          },
        },
        network: "eip155:1", // Unsupported network
      };

      const event = {
        httpMethod: "POST",
        headers: {
          "x-payment": JSON.stringify(unsupportedPayment),
        },
        body: JSON.stringify({
          prompt: "Test unsupported",
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});
      expect(response.statusCode).toBe(402);

      const body = JSON.parse(response.body);
      expect(body.error).toBe("Payment verification failed");
      // Production mode rejects all networks except Mainnet
      expect(body.reason).toBe("invalid_network_for_production");
      expect(body.expected).toBe("eip155:10");
      expect(body.received).toBe("eip155:1");
    });

    test("should reject payment when network not specified (no default to Mainnet)", async () => {
      // Payment without network field - MUST be rejected (security requirement)
      const paymentWithoutNetwork = {
        x402Version: 2,
        accepted: {
          scheme: "exact",
          amount: "1000",
          asset: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
          payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
        },
        payload: {
          authorization: {
            from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
            to: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
            value: "1000",
          },
        },
        // network field missing - no default allowed!
      };

      const event = {
        httpMethod: "POST",
        headers: {
          "x-payment": JSON.stringify(paymentWithoutNetwork),
        },
        body: JSON.stringify({
          prompt: "Test default",
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});

      // Must return 402 with missing_network error
      expect(response.statusCode).toBe(402);
      const body = JSON.parse(response.body);
      expect(body.reason).toBe("missing_network");
    });
  });

  describe("Token ID Extraction from Mint Event", () => {
    // These tests ensure the TRANSFER_EVENT_HASH bug doesn't reappear
    // Bug context: parseAbiItem().id returns undefined, not the event hash

    test("TRANSFER_EVENT_HASH should match known keccak256 hash", () => {
      // keccak256("Transfer(address,address,uint256)") = 0xddf252ad...
      // This is the well-known ERC721 Transfer event signature
      // If this changes, token ID extraction will break
      const TRANSFER_EVENT_HASH =
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

      // Verify the hash matches what's used in mocks and production
      expect(TRANSFER_EVENT_HASH).toBe(
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      );
      expect(TRANSFER_EVENT_HASH.length).toBe(66); // 0x + 64 hex chars
      expect(TRANSFER_EVENT_HASH.startsWith("0x")).toBe(true);
    });

    test("should extract tokenId correctly from various hex formats", () => {
      // Test the parseInt(topics[3], 16) logic works for various token IDs
      const testCases = [
        { hex: "0x0000000000000000000000000000000000000000000000000000000000000001", expected: 1 },
        { hex: "0x000000000000000000000000000000000000000000000000000000000000002a", expected: 42 },
        { hex: "0x0000000000000000000000000000000000000000000000000000000000000003", expected: 3 },
        {
          hex: "0x00000000000000000000000000000000000000000000000000000000000003e8",
          expected: 1000,
        },
        {
          hex: "0x000000000000000000000000000000000000000000000000000000000000ffff",
          expected: 65535,
        },
      ];

      testCases.forEach(({ hex, expected }) => {
        const tokenId = parseInt(hex, 16);
        expect(tokenId).toBe(expected);
      });
    });

    test("should fail gracefully when mint event is not found", async () => {
      // Setup mock that returns logs without Transfer event from zero address
      mockContract.write.safeMint.mockResolvedValue("0xmintTx");
      mockContract.read.mintPrice.mockResolvedValue(BigInt("10000000000000000"));

      const mockPublicClient = {
        getBalance: vi.fn().mockResolvedValue(BigInt("1000000000000000000")),
        readContract: vi.fn().mockResolvedValue(BigInt("10000000")),
        getBytecode: vi.fn().mockResolvedValue("0x1234..."),
        waitForTransactionReceipt: vi.fn().mockResolvedValue({
          status: "success",
          logs: [], // Empty logs - no Transfer event
        }),
      };

      mockViemFunctions.createPublicClient.mockReturnValue(mockPublicClient);

      // Mock facilitator verification AND image service response
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
            payload: { authorization: { from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" } },
          }),
        },
        body: JSON.stringify({ prompt: "Test" }),
        path: "/genimg",
      };

      const response = await handle(event, {});
      expect(response.statusCode).toBe(500);
      // Error is wrapped as "Operation failed" in handle()
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Operation failed");
    });

    test("should correctly identify mint event by zero address in topics[1]", async () => {
      // This tests that we properly filter for Transfer FROM zero address (mint)
      // vs regular transfers between addresses
      const mockTokenId = 123;
      const contractAddress = "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb";
      const TRANSFER_EVENT_HASH =
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
      const zeroAddress = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const regularAddress = "0x000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

      mockContract.write.safeMint.mockResolvedValue("0xmintTx");
      mockContract.write.safeTransferFrom.mockResolvedValue("0xtransferTx");
      mockContract.read.mintPrice.mockResolvedValue(BigInt("10000000000000000"));

      const mockPublicClient = {
        getBalance: vi.fn().mockResolvedValue(BigInt("1000000000000000000")),
        readContract: vi.fn().mockResolvedValue(BigInt("10000000")),
        getBytecode: vi.fn().mockResolvedValue("0x1234..."),
        waitForTransactionReceipt: vi
          .fn()
          .mockResolvedValueOnce({
            status: "success",
            logs: [
              // Regular transfer (NOT a mint) - should be skipped
              {
                address: contractAddress,
                topics: [
                  TRANSFER_EVENT_HASH,
                  regularAddress, // FROM regular address (not zero)
                  regularAddress,
                  "0x0000000000000000000000000000000000000000000000000000000000000001",
                ],
              },
              // Actual mint event (FROM zero address)
              {
                address: contractAddress,
                topics: [
                  TRANSFER_EVENT_HASH,
                  zeroAddress, // FROM zero address = MINT
                  regularAddress,
                  `0x${mockTokenId.toString(16).padStart(64, "0")}`,
                ],
              },
            ],
          })
          .mockResolvedValueOnce({ status: "success", logs: [] }),
      };

      mockViemFunctions.createPublicClient.mockReturnValue(mockPublicClient);

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ isValid: true, payer: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" }),
        })
        .mockResolvedValueOnce({ ok: true, json: async () => mockMetadataResponse })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, transaction: "0xsettlement" }),
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
            payload: { authorization: { from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" } },
          }),
        },
        body: JSON.stringify({ prompt: "Test" }),
        path: "/genimg",
      };

      const response = await handle(event, {});
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.tokenId).toBe(mockTokenId); // Should pick the mint, not the regular transfer
    });
  });

  // ============================================================================
  // Pre-Flight Checks Tests (consolidated from preflight_checks.test.js)
  // ============================================================================

  describe("Pre-Flight Checks", () => {
    test("should fail BEFORE image generation when server wallet has insufficient ETH", async () => {
      // Mock publicClient with VERY LOW balance
      const mockPublicClient = {
        getBalance: vi.fn().mockResolvedValue(BigInt("100000000000000")), // 0.0001 ETH
        readContract: vi.fn().mockResolvedValue(BigInt("10000000")),
        getBytecode: vi.fn().mockResolvedValue("0x1234..."),
      };

      mockViemFunctions.createPublicClient.mockReturnValue(mockPublicClient);

      mockContract.read.mintPrice.mockResolvedValue(BigInt("10000000000000000")); // 0.01 ETH

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
          "x-payment": JSON.stringify({
            accepted: {
              network: "eip155:11155420",
              asset: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
            },
            payload: { authorization: { from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" } },
          }),
        },
        body: JSON.stringify({ prompt: "Test image", sepoliaTest: true }),
      };

      const response = await handle(event, {});

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.reason).toBe("insufficient_server_funds");
      expect(body.chain).toBe("OP Sepolia");
    });

    test("should handle RPC errors gracefully during pre-flight checks", async () => {
      const mockPublicClient = {
        getBalance: vi.fn().mockRejectedValue(new Error("RPC connection failed")),
        readContract: vi.fn().mockResolvedValue(BigInt("10000000")),
        getBytecode: vi.fn().mockResolvedValue("0x1234..."),
      };

      mockViemFunctions.createPublicClient.mockReturnValue(mockPublicClient);
      mockContract.read.mintPrice.mockResolvedValue(BigInt("10000000000000000"));

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isValid: true, payer: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" }),
      });

      const event = {
        httpMethod: "POST",
        headers: {
          "x-payment": JSON.stringify({
            accepted: {
              network: "eip155:11155420",
              asset: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
            },
            payload: { authorization: { from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" } },
          }),
        },
        body: JSON.stringify({ prompt: "Test", sepoliaTest: true }),
      };

      const response = await handle(event, {});

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.reason).toBe("preflight_check_failed");
    });
  });

  // ============================================================================
  // Security Tests (consolidated from x402_security.test.js)
  // ============================================================================

  describe("Security: Header Encoding", () => {
    test("should decode base64-encoded PAYMENT-SIGNATURE header", async () => {
      const { extractPaymentPayload } = await import("../x402_server.js");

      const paymentPayload = {
        scheme: "exact",
        network: "eip155:11155420",
        authorization: { v: 27, r: "0xabc", s: "0xdef" },
      };

      const base64Encoded = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");
      const headers = { "Payment-Signature": base64Encoded };

      const result = extractPaymentPayload(headers);

      expect(result).not.toBeNull();
      expect(result.scheme).toBe("exact");
      expect(result.network).toBe("eip155:11155420");
    });

    test("should handle malformed base64 gracefully", async () => {
      const { extractPaymentPayload } = await import("../x402_server.js");

      const headers = { "Payment-Signature": "not-valid-base64!!!" };
      const result = extractPaymentPayload(headers);

      expect(result).toBeNull();
    });

    test("should still support v1 X-PAYMENT header (plain JSON)", async () => {
      const { extractPaymentPayload } = await import("../x402_server.js");

      const paymentPayload = { scheme: "exact", network: "eip155:11155420" };
      const headers = { "X-Payment": JSON.stringify(paymentPayload) };

      const result = extractPaymentPayload(headers);

      expect(result).not.toBeNull();
      expect(result.network).toBe("eip155:11155420");
    });
  });

  describe("Security: Payment Requirements", () => {
    test("should create payment requirements with all supported networks", async () => {
      const { createPaymentRequirements } = await import("../x402_server.js");
      const { getUSDCConfig } = await import("../getChain.js");

      const requirements = createPaymentRequirements({
        resourceUrl: "/test",
        description: "Test Resource",
        mimeType: "application/json",
        amount: "1000",
        payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
      });

      expect(requirements.x402Version).toBe(2);
      expect(requirements.accepts).toHaveLength(4);

      const networks = requirements.accepts.map((a) => a.network);
      expect(networks).toContain("eip155:10");
      expect(networks).toContain("eip155:11155420");

      for (const accept of requirements.accepts) {
        const config = getUSDCConfig(accept.network);
        expect(accept.asset).toBe(config.address);
      }
    });

    test("should validate all supported networks are configured", async () => {
      const { getSupportedNetworks } = await import("../x402_server.js");
      const { getUSDCConfig } = await import("../getChain.js");

      const supportedNetworks = getSupportedNetworks();

      expect(supportedNetworks).toContain("eip155:10");
      expect(supportedNetworks).toContain("eip155:11155420");

      for (const network of supportedNetworks) {
        const config = getUSDCConfig(network);
        expect(config.chainId).toBeDefined();
        expect(config.address).toBeDefined();
      }
    });

    /**
     * CRITICAL: EIP-712 Domain Name Validation
     *
     * Background on CVE-2025-12-26 (USDC Domain Name Mismatch):
     * - USDC contracts use different EIP-712 domain names on different networks
     * - Optimism Mainnet: "USD Coin" (official Circle deployment)
     * - Optimism Sepolia: "USDC" (testnet deployment)
     *
     * Why this matters:
     * 1. Client creates EIP-3009 signature using extra.name from 402 response
     * 2. Server verifies using same extra.name (off-chain, passes if both match)
     * 3. Settlement executes on-chain where contract uses its ACTUAL domain name
     *
     * If extra.name is wrong:
     * - Verification PASSES (both sides use same wrong value)
     * - Expensive operations complete (image generation, etc.)
     * - Settlement FAILS (on-chain domain mismatch)
     * - User loses money without receiving service!
     */
    test("should use correct EIP-712 domain names for USDC contracts", async () => {
      const { getUSDCConfig } = await import("../getChain.js");

      // Optimism Mainnet uses "USD Coin" (official Circle USDC deployment)
      const mainnetConfig = getUSDCConfig("eip155:10");
      expect(mainnetConfig.usdcName).toBe("USD Coin");

      // Optimism Sepolia uses "USDC" (testnet deployment)
      const sepoliaConfig = getUSDCConfig("eip155:11155420");
      expect(sepoliaConfig.usdcName).toBe("USDC");
    });

    test("should include EIP-712 domain info in payment requirements extra field", async () => {
      const { createPaymentRequirements } = await import("../x402_server.js");

      const requirements = createPaymentRequirements({
        resourceUrl: "/test",
        description: "Test",
        mimeType: "application/json",
        amount: "1000",
        payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
      });

      // Find mainnet and sepolia accepts
      const mainnetAccept = requirements.accepts.find((a) => a.network === "eip155:10");
      const sepoliaAccept = requirements.accepts.find((a) => a.network === "eip155:11155420");

      // Verify extra field contains correct EIP-712 domain info
      expect(mainnetAccept.extra).toEqual({
        name: "USD Coin", // Critical: Must match on-chain contract domain
        version: "2",
      });

      expect(sepoliaAccept.extra).toEqual({
        name: "USDC", // Different from mainnet!
        version: "2",
      });
    });
  });

  describe("isListed Parameter", () => {
    test("should pass isListed=true to safeMint when specified", async () => {
      const mockTokenId = 55;
      setupSuccessfulMintingFlow(mockTokenId);

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
          prompt: "Test with isListed",
          isListed: true,
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.isListed).toBe(true);
      expect(body.tokenId).toBe(mockTokenId);
    });

    test("should default isListed to false when not specified", async () => {
      const mockTokenId = 56;
      setupSuccessfulMintingFlow(mockTokenId);

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
          prompt: "Test without isListed",
          // isListed not specified
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.isListed).toBe(false);
    });

    test("should treat non-boolean isListed values as false", async () => {
      const mockTokenId = 57;
      setupSuccessfulMintingFlow(mockTokenId);

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
          prompt: "Test with string isListed",
          isListed: "true", // String instead of boolean
        }),
        path: "/genimg",
      };

      const response = await handle(event, {});
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      // Should be false because "true" !== true (strict comparison)
      expect(body.isListed).toBe(false);
    });
  });

  describe("Settlement flow", () => {
    test("should settle payment via facilitator (async)", async () => {
      const mockTokenId = 88;
      setupSuccessfulMintingFlow(mockTokenId);

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

      // Verify settlement endpoint was called (3rd fetch call)
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});
