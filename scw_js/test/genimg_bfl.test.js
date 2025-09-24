/**
 * Tests für genimg_bfl.js - BFL-basierte Bildgenerierung
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

describe("genimg_bfl.js Tests", () => {
  let handle;
  let mockContract;

  beforeAll(async () => {
    // Create mock contract
    mockContract = createMockContract();

    // Setup default mocks
    setupDefaultMocks(mockContract);

    // Dynamischer Import nach dem Setup der Mocks
    const module = await import("../genimg_bfl.js");
    handle = module.handle;
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

  describe("handle() - Hauptfunktion Tests", () => {
    test("sollte Fehler zurückgeben wenn kein Prompt bereitgestellt wird", async () => {
      const event = {
        httpMethod: "POST",
        body: JSON.stringify({}),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe("No prompt provided");
    });

    test("sollte Fehler zurückgeben wenn keine tokenId bereitgestellt wird", async () => {
      const event = {
        httpMethod: "POST",
        body: JSON.stringify({ prompt: "test prompt" }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe("No tokenId provided");
    });

    test("sollte Fehler zurückgeben wenn Token nicht existiert", async () => {
      mockContract.read.ownerOf.mockRejectedValue(new Error("Token does not exist"));

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({ prompt: "test prompt", tokenId: "999" }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe("Token does not exist");
    });

    test("sollte Fehler zurückgeben wenn Bild bereits aktualisiert wurde (generate mode)", async () => {
      mockContract.read.isImageUpdated.mockResolvedValue(true);

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({ prompt: "test prompt", tokenId: "1", mode: "generate" }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe("Image already updated");
    });

    test("sollte edit mode erlauben auch wenn Bild bereits aktualisiert wurde", async () => {
      mockContract.read.isImageUpdated.mockResolvedValue(true);

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          prompt: "change color to red",
          tokenId: "1",
          mode: "edit",
          referenceImage:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
        }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.message).toBe("Bild erfolgreich bearbeitet und Token aktualisiert (BFL)");
    });

    test("sollte erfolgreich Bild generieren und Token aktualisieren", async () => {
      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          prompt: "beautiful landscape",
          tokenId: "1",
          size: "1024x1024",
        }),
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
        "generate",
        null,
      );
      expect(mockContract.write.requestImageUpdate).toHaveBeenCalledWith([
        BigInt(1),
        "https://my-imagestore.s3.nl-ams.scw.cloud/metadata/metadata_test_123456.json",
      ]);
    });

    test("sollte Fehler behandeln wenn Bildgenerierung fehlschlägt", async () => {
      mockGenerateAndUploadImage.mockRejectedValue(new Error("Image generation failed"));

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({ prompt: "test prompt", tokenId: "1" }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toContain("Operation fehlgeschlagen");
    });

    test("sollte Fehler behandeln wenn private key fehlt", async () => {
      delete process.env.NFT_WALLET_PRIVATE_KEY;

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({ prompt: "test prompt", tokenId: "1" }),
      };

      await expect(handle(event, {}, () => {})).rejects.toThrow(
        "NFT_WALLET_PRIVATE_KEY nicht konfiguriert",
      );
    });

    test("sollte Fehler behandeln wenn Metadaten-Fetch fehlschlägt", async () => {
      // Mock fetch to simulate metadata fetch failure
      const { mockFetchError } = await import("./setup.js");
      mockFetchError("Network error");

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({ prompt: "test prompt", tokenId: "1" }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toContain("Operation fehlgeschlagen");
    });

    test("sollte Fehler zurückgeben wenn ungültige size bereitgestellt wird", async () => {
      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          prompt: "test prompt",
          tokenId: "1",
          size: "invalid_size",
        }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain("Invalid size parameter");
    });

    test("sollte standard size verwenden wenn keine size bereitgestellt wird", async () => {
      const event = {
        httpMethod: "POST",
        body: JSON.stringify({ prompt: "test prompt", tokenId: "1" }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);

      // Verifikation dass BFL Provider mit Standard-Size verwendet wurde
      expect(mockGenerateAndUploadImage).toHaveBeenCalledWith(
        "test prompt",
        "1",
        "bfl",
        "1024x1024",
        "generate",
        null,
      );
    });

    test("sollte custom size verwenden wenn gültige size bereitgestellt wird", async () => {
      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          prompt: "test prompt",
          tokenId: "1",
          size: "1792x1024",
        }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);

      // Verifikation dass BFL Provider mit custom Size verwendet wurde
      expect(mockGenerateAndUploadImage).toHaveBeenCalledWith(
        "test prompt",
        "1",
        "bfl",
        "1792x1024",
        "generate",
        null,
      );
    });

    test("sollte edit mode korrekt handhaben", async () => {
      const referenceImageBase64 =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          prompt: "change color to red",
          tokenId: "1",
          mode: "edit",
          referenceImage: referenceImageBase64,
        }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);
      expect(mockGenerateAndUploadImage).toHaveBeenCalledWith(
        "change color to red",
        "1",
        "bfl",
        "1024x1024",
        "edit",
        referenceImageBase64,
      );

      const responseBody = JSON.parse(result.body);
      expect(responseBody.message).toBe("Bild erfolgreich bearbeitet und Token aktualisiert (BFL)");
    });

    test("sollte Fehler zurückgeben wenn edit mode ohne referenceImage verwendet wird", async () => {
      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          prompt: "change color to red",
          tokenId: "1",
          mode: "edit",
        }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe("Edit mode requires referenceImage parameter");
    });
  });

  describe("Contract Interaction Tests", () => {
    test("sollte mintPrice korrekt abrufen", async () => {
      const event = {
        httpMethod: "POST",
        body: JSON.stringify({ prompt: "test prompt", tokenId: "1" }),
      };

      await handle(event, {}, () => {});

      expect(mockContract.read.mintPrice).toHaveBeenCalled();
    });

    test("sollte Contract mit korrekten Parametern initialisieren", async () => {
      const event = {
        httpMethod: "POST",
        body: JSON.stringify({ prompt: "test prompt", tokenId: "1" }),
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
        httpMethod: "POST",
        body: JSON.stringify({
          prompt: "test prompt",
          tokenId: largeTokenId,
        }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);

      // Verifikation dass große Token-ID korrekt verarbeitet wurde
      expect(mockGenerateAndUploadImage).toHaveBeenCalledWith(
        "test prompt",
        largeTokenId,
        "bfl",
        "1024x1024",
        "generate",
        null,
      );
    });

    test("sollte leere Prompts ablehnen", async () => {
      const event = {
        httpMethod: "POST",
        body: JSON.stringify({ prompt: "", tokenId: "1" }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe("No prompt provided");
    });

    test("sollte sehr lange Prompts verarbeiten", async () => {
      const longPrompt = "a".repeat(1000);

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          prompt: longPrompt,
          tokenId: "1",
        }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);

      // Verifikation dass langer Prompt korrekt verarbeitet wurde
      expect(mockGenerateAndUploadImage).toHaveBeenCalledWith(
        longPrompt,
        "1",
        "bfl",
        "1024x1024",
        "generate",
        null,
      );
    });
  });
});
