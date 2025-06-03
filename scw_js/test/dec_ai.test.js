/**
 * Tests für dec_ai.js - Serverless-Funktion für AI-Bildgenerierung
 * Adaptiert von readhandler_v2.test.js ohne Blockchain-Komponenten
 */
import { describe, test, expect, beforeAll, beforeEach, vi } from "vitest";

// Mock der image service Funktion
const mockGenerateAndUploadImage = vi.fn();

// Setup der Mocks
vi.mock("../image_service.js", () => ({
  generateAndUploadImage: mockGenerateAndUploadImage,
}));

describe("dec_ai.js Tests", () => {
  let handle;

  beforeAll(async () => {
    // Dynamischer Import nach dem Setup der Mocks
    const module = await import("../dec_ai.js");
    handle = module.handle;
  });

  beforeEach(() => {
    // Reset aller Mocks
    vi.clearAllMocks();

    // Standard-Mock-Rückgabewerte
    mockGenerateAndUploadImage.mockResolvedValue(
      "https://my-imagestore.s3.nl-ams.scw.cloud/metadata/metadata_test_0.json",
    );
  });

  describe("handle() - Hauptfunktion Tests", () => {
    test("sollte Fehler zurückgeben wenn kein Prompt bereitgestellt wird", async () => {
      const event = {
        queryStringParameters: {},
      };

      const result = await handle(event, {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe("Kein Prompt angegeben.");
    });

    test("sollte Fehler zurückgeben wenn ungültige size bereitgestellt wird", async () => {
      const event = {
        queryStringParameters: {
          prompt: "test prompt",
          size: "invalid_size",
        },
      };

      const result = await handle(event, {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe("Ungültige Bildgröße. Erlaubt sind: 1024x1024, 1792x1024");
    });

    test("sollte standard size verwenden wenn keine size bereitgestellt wird", async () => {
      const event = {
        queryStringParameters: {
          prompt: "test prompt",
        },
      };

      const result = await handle(event, {});

      expect(result.statusCode).toBe(200);
      expect(mockGenerateAndUploadImage).toHaveBeenCalledWith("test prompt", "0", "1024x1024");
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.metadata_url).toBe("https://my-imagestore.s3.nl-ams.scw.cloud/metadata/metadata_test_0.json");
      expect(responseBody.token_id).toBe("0");
      expect(responseBody.size).toBe("1024x1024");
    });

    test("sollte custom size verwenden wenn gültige size bereitgestellt wird", async () => {
      const event = {
        queryStringParameters: {
          prompt: "beautiful landscape",
          size: "1792x1024",
        },
      };

      const result = await handle(event, {});

      expect(result.statusCode).toBe(200);
      expect(mockGenerateAndUploadImage).toHaveBeenCalledWith("beautiful landscape", "0", "1792x1024");
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.metadata_url).toBe("https://my-imagestore.s3.nl-ams.scw.cloud/metadata/metadata_test_0.json");
      expect(responseBody.token_id).toBe("0");
      expect(responseBody.size).toBe("1792x1024");
    });

    test("sollte Fehler behandeln wenn Bildgenerierung fehlschlägt", async () => {
      // Mock dass Bildgenerierung fehlschlägt
      mockGenerateAndUploadImage.mockRejectedValue(new Error("Image generation failed"));

      const event = {
        queryStringParameters: {
          prompt: "test prompt",
        },
      };

      const result = await handle(event, {});

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe("Image generation failed");
    });
  });
});