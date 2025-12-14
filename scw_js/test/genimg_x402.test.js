/**
 * Tests für genimg_x402.js - x402 Payment Protocol Integration
 *
 * Note: x402 npm package is NOT used in implementation due to export issues.
 * Tests verify manual x402-style implementation instead.
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

describe("genimg_x402.js Tests", () => {
  let handle;
  let create402Response;
  let verifyMintPayment;
  let mockContract;

  beforeAll(async () => {
    // Create mock contract
    mockContract = createMockContract();

    // Setup default mocks
    setupDefaultMocks(mockContract);

    // Dynamischer Import nach dem Setup der Mocks
    const module = await import("../genimg_x402.js");
    handle = module.handle;
    create402Response = module.create402Response;
    verifyMintPayment = module.verifyMintPayment;
  });

  beforeEach(() => {
    // Environment-Setup für Tests
    setupTestEnvironment();

    // Reset aller Mocks
    vi.clearAllMocks();

    // Setup default mock values
    setupDefaultMocks(mockContract);

    // Mock fetch for metadata retrieval
    mockFetchResponse(mockMetadataResponse);
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe("create402Response()", () => {
    test("sollte 402 Response mit korrektem Payment-Format erstellen", () => {
      const response = create402Response();

      expect(response.statusCode).toBe(402);
      expect(response.headers["X-Payment"]).toBeDefined();

      const payment = JSON.parse(response.headers["X-Payment"]);
      expect(payment.scheme).toBe("exact");
      expect(payment.network).toBe("optimism");
      expect(payment.maxAmountRequired).toBe("500000000000000");
      expect(payment.recipient).toBe("0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb");
      expect(payment.metadata.resource).toBe("genimg");
    });

    test("sollte korrekte CORS headers enthalten", () => {
      const response = create402Response();

      expect(response.headers["Access-Control-Allow-Origin"]).toBe("*");
      expect(response.headers["Access-Control-Allow-Headers"]).toBe("*");
      expect(response.headers["Access-Control-Allow-Methods"]).toBe("*");
      expect(response.headers["Content-Type"]).toBe("application/json");
    });

    test("sollte Payment-Instruktionen im Body enthalten", () => {
      const response = create402Response();
      const body = JSON.parse(response.body);

      expect(body.error).toBe("Payment required");
      expect(body.message).toBe("Please mint an NFT to generate your image");
      expect(body.payment).toBeDefined();
    });
  });

  describe("verifyMintPayment()", () => {
    let mockPublicClient;

    beforeEach(() => {
      mockPublicClient = {
        getTransactionReceipt: vi.fn(),
        getTransaction: vi.fn(),
      };
    });

    test("sollte Transaction verifizieren und TokenId extrahieren", async () => {
      // Setup mock receipt with mint event
      mockPublicClient.getTransactionReceipt.mockResolvedValue({
        status: "success",
        logs: [
          {
            address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
            topics: [
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", // Transfer
              "0x0000000000000000000000000000000000000000000000000000000000000000", // from=0x0
              "0x000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f0bEb", // to
              "0x0000000000000000000000000000000000000000000000000000000000000001", // tokenId=1
            ],
          },
        ],
      });

      mockPublicClient.getTransaction.mockResolvedValue({
        to: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
        value: "500000000000000",
      });

      const result = await verifyMintPayment(
        mockPublicClient,
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      );

      expect(result.valid).toBe(true);
      expect(result.tokenId).toBe(1);
    });

    test("sollte ungültig zurückgeben bei fehlgeschlagener Transaction", async () => {
      mockPublicClient.getTransactionReceipt.mockResolvedValue({
        status: "reverted",
      });

      const result = await verifyMintPayment(
        mockPublicClient,
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Transaction failed or not found");
    });

    test("sollte ungültig zurückgeben bei falschem Recipient", async () => {
      mockPublicClient.getTransactionReceipt.mockResolvedValue({
        status: "success",
        logs: [],
      });

      mockPublicClient.getTransaction.mockResolvedValue({
        to: "0xWrongAddress",
        value: "500000000000000",
      });

      const result = await verifyMintPayment(mockPublicClient, "0xabc123");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Transaction not sent to correct contract");
    });

    test("sollte ungültig zurückgeben bei zu geringem Payment", async () => {
      mockPublicClient.getTransactionReceipt.mockResolvedValue({
        status: "success",
        logs: [],
      });

      mockPublicClient.getTransaction.mockResolvedValue({
        to: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
        value: "100", // Too low
      });

      const result = await verifyMintPayment(mockPublicClient, "0xabc123");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Insufficient payment");
    });

    test("sollte TokenId und Minter aus Mint-Event extrahieren", async () => {
      mockPublicClient.getTransactionReceipt.mockResolvedValue({
        status: "success",
        logs: [
          {
            address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
            topics: [
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              "0x0000000000000000000000000000000000000000000000000000000000000000",
              "0x000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
              "0x000000000000000000000000000000000000000000000000000000000000007b", // tokenId=123
            ],
          },
        ],
      });

      mockPublicClient.getTransaction.mockResolvedValue({
        to: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
        value: "500000000000000",
      });

      const result = await verifyMintPayment(mockPublicClient, "0xabc123");

      expect(result.valid).toBe(true);
      expect(result.tokenId).toBe(123);
      expect(result.payer).toBe("0x742d35cc6634c0532925a3b844bc9e7595f0beb");
    });

    test("sollte ungültig zurückgeben wenn kein Mint-Event gefunden wird", async () => {
      mockPublicClient.getTransactionReceipt.mockResolvedValue({
        status: "success",
        logs: [], // No mint event
      });

      mockPublicClient.getTransaction.mockResolvedValue({
        to: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
        value: "500000000000000",
      });

      const result = await verifyMintPayment(mockPublicClient, "0xabc123");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("No mint event found in transaction");
    });

    test("sollte Fehler bei Exception behandeln", async () => {
      mockVerifyPayment.mockRejectedValue(new Error("Network error"));

      const result = await verifyMintPayment(mockPublicClient, "0xabc123");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Verification failed");
    });
  });

  describe("handle() - x402 Payment Flow", () => {
    test("sollte 402 zurückgeben wenn kein Payment Proof vorhanden ist", async () => {
      const event = {
        httpMethod: "POST",
        headers: {},
        body: JSON.stringify({ prompt: "test prompt" }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(402);
      expect(result.headers["X-Payment"]).toBeDefined();
      const payment = JSON.parse(result.headers["X-Payment"]);
      expect(payment.scheme).toBe("exact");
    });

    test("sollte 402 zurückgeben bei ungültigem Payment Proof", async () => {
      const mockPublicClient = {
        getTransactionReceipt: vi.fn().mockResolvedValue({
          status: "reverted",
        }),
      };

      mockViemFunctions.createPublicClient.mockReturnValue(mockPublicClient);

      const event = {
        httpMethod: "POST",
        headers: {
          "x-payment": JSON.stringify({
            txHash: "0xbadtransaction",
          }),
        },
        body: JSON.stringify({ prompt: "test prompt" }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(402);
      expect(JSON.parse(result.body).error).toBe("Payment verification failed");
    });

    test("sollte Bild generieren bei gültigem Payment", async () => {
      // Setup successful mint verification
      const mockPublicClient = {
        getTransactionReceipt: vi.fn().mockResolvedValue({
          status: "success",
          logs: [
            {
              address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
              topics: [
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                "0x0000000000000000000000000000000000000000000000000000000000000001",
              ],
            },
          ],
        }),
      };

      mockViemFunctions.createPublicClient.mockReturnValue(mockPublicClient);
      mockVerifyPayment.mockResolvedValue({ valid: true });

      const event = {
        httpMethod: "POST",
        headers: {
          "x-payment": JSON.stringify({
            txHash: "0xvalid123",
          }),
        },
        body: JSON.stringify({ prompt: "beautiful landscape" }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);
      expect(mockGenerateAndUploadImage).toHaveBeenCalled();
      expect(mockContract.write.requestImageUpdate).toHaveBeenCalled();

      const body = JSON.parse(result.body);
      expect(body.tokenId).toBe(1);
      expect(body.message).toContain("successfully");
    });

    test("sollte OPTIONS requests korrekt behandeln", async () => {
      const event = {
        httpMethod: "OPTIONS",
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);
      expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
    });

    test("sollte Fehler bei fehlendem Prompt zurückgeben", async () => {
      const event = {
        httpMethod: "POST",
        headers: {},
        body: JSON.stringify({}),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe("No prompt provided");
    });

    test("sollte ungültige Size Parameter ablehnen", async () => {
      const event = {
        httpMethod: "POST",
        headers: {},
        body: JSON.stringify({ prompt: "test", size: "invalid" }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain("Invalid size parameter");
    });

    test("sollte Edit-Mode ohne Reference Image ablehnen", async () => {
      const event = {
        httpMethod: "POST",
        headers: {},
        body: JSON.stringify({ prompt: "test", mode: "edit" }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain("Edit mode requires referenceImage");
    });

    test("sollte bereits aktualisierte Bilder ablehnen (generate mode)", async () => {
      mockContract.read.isImageUpdated.mockResolvedValue(true);

      const mockPublicClient = {
        getTransactionReceipt: vi.fn().mockResolvedValue({
          status: "success",
          logs: [
            {
              address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
              topics: [
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                "0x0000000000000000000000000000000000000000000000000000000000000001",
              ],
            },
          ],
        }),
      };

      mockViemFunctions.createPublicClient.mockReturnValue(mockPublicClient);
      mockVerifyPayment.mockResolvedValue({ valid: true });

      const event = {
        httpMethod: "POST",
        headers: {
          "x-payment": JSON.stringify({ txHash: "0xvalid123" }),
        },
        body: JSON.stringify({ prompt: "test", mode: "generate" }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe("Image already updated");
    });

    test("sollte Payment Proof aus Body akzeptieren", async () => {
      const mockPublicClient = {
        getTransactionReceipt: vi.fn().mockResolvedValue({
          status: "success",
          logs: [
            {
              address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
              topics: [
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                "0x0000000000000000000000000000000000000000000000000000000000000001",
              ],
            },
          ],
        }),
      };

      mockViemFunctions.createPublicClient.mockReturnValue(mockPublicClient);
      mockVerifyPayment.mockResolvedValue({ valid: true });

      const event = {
        httpMethod: "POST",
        headers: {},
        body: JSON.stringify({
          prompt: "test",
          payment: { txHash: "0xvalid123" },
        }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);
    });

    test("sollte Fehler bei Bildgenerierung behandeln", async () => {
      mockGenerateAndUploadImage.mockRejectedValue(new Error("Image generation failed"));

      const mockPublicClient = {
        getTransactionReceipt: vi.fn().mockResolvedValue({
          status: "success",
          logs: [
            {
              address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
              topics: [
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                "0x0000000000000000000000000000000000000000000000000000000000000001",
              ],
            },
          ],
        }),
      };

      mockViemFunctions.createPublicClient.mockReturnValue(mockPublicClient);
      mockVerifyPayment.mockResolvedValue({ valid: true });

      const event = {
        httpMethod: "POST",
        headers: {
          "x-payment": JSON.stringify({ txHash: "0xvalid123" }),
        },
        body: JSON.stringify({ prompt: "test" }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe("Operation failed");
    });
  });

  describe("Payment Proof Parsing", () => {
    test("sollte txHash aus verschiedenen Formaten extrahieren", async () => {
      const testCases = [{ txHash: "0x123" }, { transactionHash: "0x456" }, { hash: "0x789" }];

      const mockPublicClient = {
        getTransactionReceipt: vi.fn().mockResolvedValue({
          status: "reverted",
        }),
      };

      for (const testCase of testCases) {
        mockViemFunctions.createPublicClient.mockReturnValue(mockPublicClient);

        const event = {
          httpMethod: "POST",
          headers: {
            "x-payment": JSON.stringify(testCase),
          },
          body: JSON.stringify({ prompt: "test" }),
        };

        await handle(event, {}, () => {});

        expect(mockPublicClient.getTransactionReceipt).toHaveBeenCalled();
      }
    });

    test("sollte Fehler bei fehlendem txHash zurückgeben", async () => {
      const event = {
        httpMethod: "POST",
        headers: {
          "x-payment": JSON.stringify({ invalidField: "0x123" }),
        },
        body: JSON.stringify({ prompt: "test" }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(402);
      expect(JSON.parse(result.body).error).toBe("Invalid payment proof");
    });
  });
});
