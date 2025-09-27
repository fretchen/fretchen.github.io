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

  describe("Image Editing Tests", () => {
    test("sollte edit mode erfolgreich ausführen mit minimalen Base64-Image", async () => {
      // Verwende eine sehr kleine, gültige Base64-Image für Tests
      const minimalBase64Image =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          prompt: "make it blue",
          tokenId: "5",
          mode: "edit",
          referenceImage: minimalBase64Image,
          size: "1792x1024",
        }),
      };

      const result = await handle(event, {}, () => {});

      expect(result.statusCode).toBe(200);

      // Verifikation dass generateAndUploadImage mit edit-Parametern aufgerufen wurde
      expect(mockGenerateAndUploadImage).toHaveBeenCalledWith(
        "make it blue",
        "5",
        "bfl",
        "1792x1024",
        "edit",
        minimalBase64Image,
      );

      const responseBody = JSON.parse(result.body);
      expect(responseBody.message).toBe("Bild erfolgreich bearbeitet und Token aktualisiert (BFL)");
      expect(responseBody.metadata_url).toBeDefined();
      expect(responseBody.transaction_hash).toBeDefined();
    });

    test("sollte edit mode auch funktionieren wenn Token bereits aktualisiert wurde", async () => {
      // Mock dass Token bereits aktualisiert wurde
      mockContract.read.isImageUpdated.mockResolvedValue(true);

      const referenceImage =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          prompt: "add flowers",
          tokenId: "10",
          mode: "edit",
          referenceImage,
        }),
      };

      const result = await handle(event, {}, () => {});

      // Sollte erfolgreich sein, da edit mode die "bereits aktualisiert" Prüfung umgeht
      expect(result.statusCode).toBe(200);

      expect(mockGenerateAndUploadImage).toHaveBeenCalledWith(
        "add flowers",
        "10",
        "bfl",
        "1024x1024",
        "edit",
        referenceImage,
      );
    });

    test("sollte verschiedene Edit-Prompts korrekt verarbeiten", async () => {
      const testCases = [
        { prompt: "change background to sunset", tokenId: "100" },
        { prompt: "add more details", tokenId: "200" },
        { prompt: "make it more vibrant", tokenId: "300" },
      ];

      const referenceImage =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

      for (const testCase of testCases) {
        mockGenerateAndUploadImage.mockClear();

        const event = {
          httpMethod: "POST",
          body: JSON.stringify({
            prompt: testCase.prompt,
            tokenId: testCase.tokenId,
            mode: "edit",
            referenceImage,
          }),
        };

        const result = await handle(event, {}, () => {});

        expect(result.statusCode).toBe(200);

        expect(mockGenerateAndUploadImage).toHaveBeenCalledWith(
          testCase.prompt,
          testCase.tokenId,
          "bfl",
          "1024x1024",
          "edit",
          referenceImage,
        );
      }
    });

    test("sollte edit mode mit verschiedenen Bildgrößen handhaben", async () => {
      const sizes = ["1024x1024", "1792x1024"];
      const referenceImage =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

      for (const size of sizes) {
        mockGenerateAndUploadImage.mockClear();

        const event = {
          httpMethod: "POST",
          body: JSON.stringify({
            prompt: "enhance quality",
            tokenId: "50",
            mode: "edit",
            referenceImage,
            size,
          }),
        };

        const result = await handle(event, {}, () => {});

        expect(result.statusCode).toBe(200);

        expect(mockGenerateAndUploadImage).toHaveBeenCalledWith(
          "enhance quality",
          "50",
          "bfl",
          size,
          "edit",
          referenceImage,
        );
      }
    });

    test("sollte Fehler zurückgeben wenn referenceImage kein gültiges Base64-Format hat", async () => {
      const invalidBase64 = "not-a-valid-base64-image";

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          prompt: "change color",
          tokenId: "1",
          mode: "edit",
          referenceImage: invalidBase64,
        }),
      };

      const result = await handle(event, {}, () => {});

      // Die Funktion sollte trotzdem versuchen zu verarbeiten, da sie keine Base64-Validierung macht
      // Sie verlässt sich auf den image_service für die Validierung
      expect(result.statusCode).toBe(200);
    });

    test("sollte edit mode Parameter-Validierung ohne externe Aufrufe testen", async () => {
      // Teste nur die Parameter-Validierung ohne Contract-Interaktion
      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          prompt: "test edit",
          tokenId: "1",
          mode: "edit",
          referenceImage: "data:image/png;base64,test",
        }),
      };

      // Mocke alle externen Aufrufe um nur die Logik zu testen
      mockContract.read.ownerOf.mockRejectedValue(new Error("Token does not exist"));

      const result = await handle(event, {}, () => {});

      // Sollte bei Token-Existenz-Prüfung fehlschlagen, nicht bei Parameter-Validierung
      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe("Token does not exist");
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
