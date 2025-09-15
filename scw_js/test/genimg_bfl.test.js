/**
 * Tests für genimg_bfl.js - BFL-basierte Bildgenerierung
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
// Mock für fetch (global)
global.fetch = vi.fn();

vi.mock("../image_service.js", () => ({
  generateAndUploadImage: mockGenerateAndUploadImage,
  JSON_BASE_PATH: "https://my-imagestore.s3.nl-ams.scw.cloud/",
}));

describe("genimg_bfl.js Tests", () => {
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
    const module = await import("../genimg_bfl.js");
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
      "https://my-imagestore.s3.nl-ams.scw.cloud/metadata/metadata_test_123456.json",
    );
    mockContract.write.requestImageUpdate.mockResolvedValue(
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    );

    // Mock fetch for metadata retrieval
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        name: "AI Generated Art #1",
        description: "AI generated artwork based on the prompt: \"beautiful landscape\"",
        image: "https://my-imagestore.s3.nl-ams.scw.cloud/images/image_1_test.png",
        attributes: [
          {
            trait_type: "Prompt",
            value: "beautiful landscape",
          },
          {
            trait_type: "Model",
            value: "flux-pro-1.1",
          },
          {
            trait_type: "Image Size",
            value: "1024x1024",
          },
        ],
      }),
    });
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
      mockContract.read.ownerOf.mockRejectedValue(new Error("Token does not exist"));

      const event = {
        queryStringParameters: { prompt: "test prompt", tokenId: "999" },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe("Token does not exist");
    });

    test("sollte Fehler zurückgeben wenn Bild bereits aktualisiert wurde", async () => {
      mockContract.read.isImageUpdated.mockResolvedValue(true);

      const event = {
        queryStringParameters: { prompt: "test prompt", tokenId: "1" },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe("Image already updated");
    });

    test("sollte erfolgreich Bild generieren und Token aktualisieren", async () => {
      const event = {
        queryStringParameters: {
          prompt: "beautiful landscape",
          tokenId: "1",
          size: "1024x1024",
        },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.metadata_url).toBe(
        "https://my-imagestore.s3.nl-ams.scw.cloud/metadata/metadata_test_123456.json",
      );
      expect(responseBody.size).toBe("1024x1024");
      expect(responseBody.mintPrice).toBe("1000000000000000000");
      expect(responseBody.message).toBe("Bild erfolgreich generiert und Token aktualisiert (BFL)");
      expect(responseBody.transaction_hash).toBe(
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      );

      // Verifikation der Funktionsaufrufe - BFL Provider verwenden
      expect(mockGenerateAndUploadImage).toHaveBeenCalledWith(
        "beautiful landscape",
        "1",
        "bfl",
        "1024x1024",
      );
      expect(mockContract.write.requestImageUpdate).toHaveBeenCalledWith([
        BigInt(1),
        "https://my-imagestore.s3.nl-ams.scw.cloud/metadata/metadata_test_123456.json",
      ]);
    });

    test("sollte Fehler behandeln wenn Bildgenerierung fehlschlägt", async () => {
      mockGenerateAndUploadImage.mockRejectedValue(new Error("Image generation failed"));

      const event = {
        queryStringParameters: { prompt: "test prompt", tokenId: "1" },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toContain("Operation fehlgeschlagen");
    });

    test("sollte Fehler behandeln wenn private key fehlt", async () => {
      delete process.env.NFT_WALLET_PRIVATE_KEY;

      const event = {
        queryStringParameters: { prompt: "test prompt", tokenId: "1" },
      };

      await expect(handle(event, {}, () => {})).rejects.toThrow(
        "NFT_WALLET_PRIVATE_KEY nicht konfiguriert",
      );
    });

    test("sollte Fehler behandeln wenn Metadaten-Fetch fehlschlägt", async () => {
      // Mock fetch to simulate metadata fetch failure
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const event = {
        queryStringParameters: { prompt: "test prompt", tokenId: "1" },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toContain("Operation fehlgeschlagen");
    });

    test("sollte Fehler zurückgeben wenn ungültige size bereitgestellt wird", async () => {
      const event = {
        queryStringParameters: {
          prompt: "test prompt",
          tokenId: "1",
          size: "invalid_size",
        },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain("Invalid size parameter");
    });

    test("sollte standard size verwenden wenn keine size bereitgestellt wird", async () => {
      const event = {
        queryStringParameters: { prompt: "test prompt", tokenId: "1" },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);

      // Verifikation dass BFL Provider mit Standard-Size verwendet wurde
      expect(mockGenerateAndUploadImage).toHaveBeenCalledWith(
        "test prompt",
        "1",
        "bfl",
        "1024x1024",
      );
    });

    test("sollte custom size verwenden wenn gültige size bereitgestellt wird", async () => {
      const event = {
        queryStringParameters: {
          prompt: "test prompt",
          tokenId: "1",
          size: "1792x1024",
        },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);

      // Verifikation dass BFL Provider mit custom Size verwendet wurde
      expect(mockGenerateAndUploadImage).toHaveBeenCalledWith(
        "test prompt",
        "1",
        "bfl",
        "1792x1024",
      );
    });
  });

  describe("Contract Interaction Tests", () => {
    test("sollte mintPrice korrekt abrufen", async () => {
      const event = {
        queryStringParameters: { prompt: "test prompt", tokenId: "1" },
      };

      await handle(event, {}, () => {});

      expect(mockContract.read.mintPrice).toHaveBeenCalled();
    });

    test("sollte Contract mit korrekten Parametern initialisieren", async () => {
      const event = {
        queryStringParameters: { prompt: "test prompt", tokenId: "1" },
      };

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
      const largeTokenId = "999999999999999999";

      const event = {
        queryStringParameters: {
          prompt: "test prompt",
          tokenId: largeTokenId,
        },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);

      // Verifikation dass große Token-ID korrekt verarbeitet wurde
      expect(mockGenerateAndUploadImage).toHaveBeenCalledWith(
        "test prompt",
        largeTokenId,
        "bfl",
        "1024x1024",
      );
    });

    test("sollte leere Prompts ablehnen", async () => {
      const event = {
        queryStringParameters: { prompt: "", tokenId: "1" },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe("No prompt provided");
    });

    test("sollte sehr lange Prompts verarbeiten", async () => {
      const longPrompt = "a".repeat(1000);

      const event = {
        queryStringParameters: {
          prompt: longPrompt,
          tokenId: "1",
        },
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);

      // Verifikation dass langer Prompt korrekt verarbeitet wurde
      expect(mockGenerateAndUploadImage).toHaveBeenCalledWith(
        longPrompt,
        "1",
        "bfl",
        "1024x1024",
      );
    });
  });
});