/**
 * Tests für readhandler_v2.js - die wichtigsten Serverless-Funktionen
 */
import { describe, test, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";

// Mock der externen Abhängigkeiten
const mockViemFunctions = {
  createPublicClient: vi.fn(),
  createWalletClient: vi.fn(),
  getContract: vi.fn(),
  http: vi.fn(),
  parseEther: vi.fn(),
  privateKeyToAccount: vi.fn(),
};

const mockGenerateAndUploadImage = vi.fn();

// Setup der Mocks
vi.mock("viem", () => mockViemFunctions);
vi.mock("viem/chains", () => ({
  sepolia: { id: 11155111 },
  optimism: { id: 10 },
}));
vi.mock("viem/accounts", () => ({
  privateKeyToAccount: mockViemFunctions.privateKeyToAccount,
}));
vi.mock("../image_service.js", () => ({
  generateAndUploadImage: mockGenerateAndUploadImage,
  JSON_BASE_PATH: "https://my-imagestore.s3.nl-ams.scw.cloud/",
}));

describe("readhandler_v2.js Tests", () => {
  let handle;
  let mockContract;

  beforeAll(async () => {
    // Setup Mock-Contract
    mockContract = {
      read: {
        ownerOf: vi.fn(),
        mintPrice: vi.fn(),
        isImageUpdated: vi.fn(),
      },
      write: {
        requestImageUpdate: vi.fn(),
      },
    };

    mockViemFunctions.getContract.mockReturnValue(mockContract);
    mockViemFunctions.createPublicClient.mockReturnValue({});
    mockViemFunctions.createWalletClient.mockReturnValue({});
    mockViemFunctions.privateKeyToAccount.mockReturnValue({ address: "0x123" });
    mockViemFunctions.http.mockReturnValue({});

    // Dynamischer Import nach dem Setup der Mocks
    const module = await import("../readhandler_v2.js");
    handle = module.handle;
  });

  beforeEach(() => {
    // Environment-Setup für Tests
    process.env.NFT_WALLET_PRIVATE_KEY = "test-private-key";

    // Reset aller Mocks
    vi.clearAllMocks();

    // Standard-Mock-Rückgabewerte
    mockContract.read.mintPrice.mockResolvedValue(BigInt("1000000000000000000")); // 1 ETH
    mockContract.read.isImageUpdated.mockResolvedValue(false);
    mockContract.read.ownerOf.mockResolvedValue("0x123456789");
    mockGenerateAndUploadImage.mockResolvedValue(
      "https://my-imagestore.s3.nl-ams.scw.cloud/metadata/metadata_test_123456.json"
    );
    mockContract.write.requestImageUpdate.mockResolvedValue(
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    );
  });

  afterEach(() => {
    delete process.env.NFT_WALLET_PRIVATE_KEY;
  });

  describe("handle() - Hauptfunktion Tests", () => {
    test("sollte Fehler zurückgeben wenn kein Prompt bereitgestellt wird", async () => {
      const event = {
        queryStringParameters: {},
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe("No prompt provided");
    });

    test("sollte Fehler zurückgeben wenn keine tokenId bereitgestellt wird", async () => {
      const event = {
        queryStringParameters: { prompt: "test prompt" },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe("No tokenId provided");
    });

    test("sollte Fehler zurückgeben wenn Token nicht existiert", async () => {
      // Mock dass Token nicht existiert
      mockContract.read.ownerOf.mockRejectedValue(new Error("Token does not exist"));

      const event = {
        queryStringParameters: {
          prompt: "test prompt",
          tokenId: "999",
        },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe("Token does not exist");
    });

    test("sollte Fehler zurückgeben wenn Bild bereits aktualisiert wurde", async () => {
      // Mock dass Token existiert aber bereits aktualisiert wurde
      mockContract.read.isImageUpdated.mockResolvedValue(true);

      const event = {
        queryStringParameters: {
          prompt: "test prompt",
          tokenId: "1",
        },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe("Image already updated");
    });

    test("sollte erfolgreich Bild generieren und Token aktualisieren", async () => {
      // Mock fetch für Metadaten
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            image: "https://my-imagestore.s3.nl-ams.scw.cloud/images/image_test_123456.png",
            name: "Test NFT",
          }),
      });

      const event = {
        queryStringParameters: {
          prompt: "beautiful landscape",
          tokenId: "1",
        },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.metadata_url).toBe(
        "https://my-imagestore.s3.nl-ams.scw.cloud/metadata/metadata_test_123456.json"
      );
      expect(responseBody.image_url).toBe("https://my-imagestore.s3.nl-ams.scw.cloud/images/image_test_123456.png");
      expect(responseBody.transaction_hash).toBe("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
      expect(responseBody.message).toBe("Bild erfolgreich generiert und Token aktualisiert");

      // Verifikation der Funktionsaufrufe
      expect(mockGenerateAndUploadImage).toHaveBeenCalledWith("beautiful landscape", "1");
      expect(mockContract.write.requestImageUpdate).toHaveBeenCalledWith([
        BigInt("1"),
        "https://my-imagestore.s3.nl-ams.scw.cloud/metadata/metadata_test_123456.json",
      ]);
    });

    test("sollte Fehler behandeln wenn Bildgenerierung fehlschlägt", async () => {
      // Mock dass Bildgenerierung fehlschlägt
      mockGenerateAndUploadImage.mockRejectedValue(new Error("Image generation failed"));

      const event = {
        queryStringParameters: {
          prompt: "test prompt",
          tokenId: "1",
        },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe("Operation fehlgeschlagen: Image generation failed");
    });

    test("sollte Fehler behandeln wenn private key fehlt", async () => {
      delete process.env.NFT_WALLET_PRIVATE_KEY;

      const event = {
        queryStringParameters: {
          prompt: "test prompt",
          tokenId: "1",
        },
      };

      await expect(handle(event, {}, () => {})).rejects.toThrow("NFT_WALLET_PRIVATE_KEY nicht konfiguriert");
    });

    test("sollte Fehler behandeln wenn Metadaten-Fetch fehlschlägt", async () => {
      // Mock fehlgeschlagenen fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const event = {
        queryStringParameters: {
          prompt: "test prompt",
          tokenId: "1",
        },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toContain("Operation fehlgeschlagen");
    });
  });

  describe("Contract Interaction Tests", () => {
    test("sollte mintPrice korrekt abrufen", async () => {
      const expectedPrice = BigInt("2000000000000000000"); // 2 ETH
      mockContract.read.mintPrice.mockResolvedValue(expectedPrice);

      const event = {
        queryStringParameters: {
          prompt: "test prompt",
          tokenId: "1",
        },
      };

      // Mock fetch für erfolgreiche Ausführung
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ image: "https://my-imagestore.s3.nl-ams.scw.cloud/images/image_test_123456.png" }),
      });

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.mintPrice).toBe(expectedPrice.toString());
    });

    test("sollte Contract mit korrekten Parametern initialisieren", async () => {
      const event = {
        queryStringParameters: {
          prompt: "test prompt",
          tokenId: "1",
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ image: "https://my-imagestore.s3.nl-ams.scw.cloud/images/image_test_123456.png" }),
      });

      await handle(event, {}, () => {});

      expect(mockViemFunctions.getContract).toHaveBeenCalledWith({
        address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
        abi: expect.any(Array),
        client: {
          public: expect.any(Object),
          wallet: expect.any(Object),
        },
      });
    });
  });

  describe("Edge Cases", () => {
    test("sollte große Token-IDs korrekt verarbeiten", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ image: "https://my-imagestore.s3.nl-ams.scw.cloud/images/image_test_123456.png" }),
      });

      const event = {
        queryStringParameters: {
          prompt: "test prompt",
          tokenId: "999999999999999999",
        },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);
      expect(mockContract.read.ownerOf).toHaveBeenCalledWith([BigInt("999999999999999999")]);
      expect(mockContract.read.isImageUpdated).toHaveBeenCalledWith([BigInt("999999999999999999")]);
    });

    test("sollte leere Prompts ablehnen", async () => {
      const event = {
        queryStringParameters: {
          prompt: "",
          tokenId: "1",
        },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe("No prompt provided");
    });

    test("sollte sehr lange Prompts verarbeiten", async () => {
      const longPrompt = "a".repeat(1000);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ image: "https://my-imagestore.s3.nl-ams.scw.cloud/images/image_test_123456.png" }),
      });

      const event = {
        queryStringParameters: {
          prompt: longPrompt,
          tokenId: "1",
        },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);
      expect(mockGenerateAndUploadImage).toHaveBeenCalledWith(longPrompt, "1");
    });
  });
});
