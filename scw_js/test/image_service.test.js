/**
 * Tests für image_service.js - Bildgenerierung und S3-Upload-Funktionen
 */

import { describe, test, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";

// Mock für AWS SDK
const mockS3Send = vi.fn();

vi.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: class {
      constructor() {
        this.send = mockS3Send;
      }
    },
    PutObjectCommand: class {
      constructor(params) {
        this.params = params;
      }
    },
  };
});

// Mock für fetch (global)
global.fetch = vi.fn();

describe("image_service.js Tests", () => {
  let uploadToS3, generateAndUploadImage;

  beforeAll(async () => {
    // Dynamischer Import nach Mock-Setup
    const module = await import("../image_service.js");
    uploadToS3 = module.uploadToS3;
    generateAndUploadImage = module.generateAndUploadImage;
  });

  beforeEach(() => {
    // Environment-Setup
    process.env.SCW_ACCESS_KEY = "test-access-key";
    process.env.SCW_SECRET_KEY = "test-secret-key";
    process.env.IONOS_API_TOKEN = "test-ionos-token";

    // Reset aller Mocks
    vi.clearAllMocks();

    // Standard-Mock-Rückgabewerte
    mockS3Send.mockResolvedValue({});
  });

  afterEach(() => {
    delete process.env.SCW_ACCESS_KEY;
    delete process.env.SCW_SECRET_KEY;
    delete process.env.IONOS_API_TOKEN;
  });

  describe("uploadToS3() Tests", () => {
    test("sollte JSON-Daten erfolgreich hochladen", async () => {
      const testData = { name: "Test NFT", description: "Test description" };
      const fileName = "test.json";

      const result = await uploadToS3(testData, fileName);

      expect(result).toBe("https://my-imagestore.s3.nl-ams.scw.cloud/test.json");
      expect(mockS3Send).toHaveBeenCalled();
      const putCommand = mockS3Send.mock.calls[0][0];
      expect(putCommand.params).toMatchObject({
        Bucket: "my-imagestore",
        Key: fileName,
        Body: JSON.stringify(testData),
        ContentType: "application/json",
        ACL: "public-read",
      });
    });

    test("sollte Buffer-Daten erfolgreich hochladen", async () => {
      const testBuffer = Buffer.from("test image data");
      const fileName = "test.png";

      const result = await uploadToS3(testBuffer, fileName, "image/png");

      expect(result).toBe("https://my-imagestore.s3.nl-ams.scw.cloud/test.png");
      expect(mockS3Send).toHaveBeenCalled();
      const putCommand = mockS3Send.mock.calls[0][0];
      expect(putCommand.params).toMatchObject({
        Bucket: "my-imagestore",
        Key: fileName,
        Body: testBuffer,
        ContentType: "image/png",
        ACL: "public-read",
      });
    });

    test("sollte String-Daten hochladen", async () => {
      const testString = "plain text data";
      const fileName = "test.txt";

      const result = await uploadToS3(testString, fileName, "text/plain");

      expect(result).toBe("https://my-imagestore.s3.nl-ams.scw.cloud/test.txt");
      expect(mockS3Send).toHaveBeenCalled();
      const putCommand = mockS3Send.mock.calls[0][0];
      expect(putCommand.params).toMatchObject({
        Bucket: "my-imagestore",
        Key: fileName,
        Body: testString,
        ContentType: "text/plain",
        ACL: "public-read",
      });
    });

    test("sollte Fehler bei S3-Upload-Problemen werfen", async () => {
      mockS3Send.mockRejectedValue(new Error("S3 Upload failed"));

      const testData = { test: "data" };
      const fileName = "test.json";

      await expect(uploadToS3(testData, fileName)).rejects.toThrow("S3 Upload failed");
    });

    test("sollte Fehler werfen wenn AWS-Credentials fehlen", async () => {
      // Backup der ursprünglichen Werte
      const originalAccessKey = process.env.SCW_ACCESS_KEY;
      const originalSecretKey = process.env.SCW_SECRET_KEY;

      // Entferne Credentials
      delete process.env.SCW_ACCESS_KEY;
      delete process.env.SCW_SECRET_KEY;

      // Mock S3 um Authentifizierungsfehler zu simulieren
      mockS3Send.mockRejectedValue(new Error("Missing AWS credentials"));

      const testData = { test: "data" };
      const fileName = "test.json";

      await expect(uploadToS3(testData, fileName)).rejects.toThrow();

      // Stelle ursprüngliche Werte wieder her
      if (originalAccessKey) {
        process.env.SCW_ACCESS_KEY = originalAccessKey;
      }
      if (originalSecretKey) {
        process.env.SCW_SECRET_KEY = originalSecretKey;
      }
    });
  });

  describe("generateAndUploadImage() Tests", () => {
    const mockImageResponse = {
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: [
            {
              b64_json:
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
            },
          ],
        }),
    };

    beforeEach(() => {
      global.fetch.mockResolvedValue(mockImageResponse);
      mockS3Send.mockResolvedValue({});
    });

    test("sollte erfolgreich Bild generieren und hochladen", async () => {
      const prompt = "beautiful landscape";
      const tokenId = "123";

      const result = await generateAndUploadImage(prompt, tokenId, "ionos");

      // Verify IONOS API call
      expect(global.fetch).toHaveBeenCalledWith(
        "https://openai.inference.de-txl.ionos.com/v1/images/generations",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer test-ionos-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "black-forest-labs/FLUX.1-schnell",
            prompt,
            size: "1024x1024",
          }),
        }),
      );

      // Verify S3 uploads (image + metadata)
      expect(mockS3Send).toHaveBeenCalledTimes(2);

      // Check result
      expect(result).toMatch(
        /^https:\/\/my-imagestore\.s3\.nl-ams\.scw\.cloud\/metadata\/metadata_123_[a-f0-9]{12}\.json$/,
      );
    });

    test("sollte Fehler werfen wenn kein Prompt bereitgestellt wird", async () => {
      await expect(generateAndUploadImage("", "123", "ionos")).rejects.toThrow(
        "No prompt provided.",
      );
      await expect(generateAndUploadImage(null, "123", "ionos")).rejects.toThrow(
        "No prompt provided.",
      );
      await expect(generateAndUploadImage(undefined, "123", "ionos")).rejects.toThrow(
        "No prompt provided.",
      );
    });

    test("sollte Fehler werfen wenn IONOS API Token fehlt", async () => {
      delete process.env.IONOS_API_TOKEN;

      await expect(generateAndUploadImage("test prompt", "123", "ionos")).rejects.toThrow(
        "API token not found. Please configure the IONOS_API_TOKEN environment variable.",
      );
    });

    test("sollte Fehler bei IONOS API-Problemen behandeln", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(generateAndUploadImage("test prompt", "123", "ionos")).rejects.toThrow(
        "Could not reach IONOS: 401 Unauthorized",
      );
    });

    test("sollte korrekte ERC-721 Metadaten erstellen", async () => {
      const prompt = "beautiful sunset";
      const tokenId = "456";

      await generateAndUploadImage(prompt, tokenId, "ionos");

      // Überprüfe, dass die Metadaten-Upload mit korrektem Format aufgerufen wurde
      const metadataCall = mockS3Send.mock.calls.find((call) =>
        call[0].params.Key.startsWith("metadata/"),
      );

      expect(metadataCall).toBeDefined();

      const metadata = JSON.parse(metadataCall[0].params.Body);
      expect(metadata).toEqual({
        name: `AI Generated Art #${tokenId}`,
        description: `AI generated artwork based on the prompt: "${prompt}"`,
        image: expect.stringMatching(
          /^https:\/\/my-imagestore\.s3\.nl-ams\.scw\.cloud\/images\/image_456_[a-f0-9]{12}\.jpg$/,
        ),
        attributes: [
          {
            trait_type: "Prompt",
            value: prompt,
          },
          {
            trait_type: "Model",
            value: "black-forest-labs/FLUX.1-schnell",
          },
          {
            trait_type: "Image Size",
            value: "1024x1024",
          },
          {
            trait_type: "Creation Date",
            value: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          },
        ],
      });
    });

    test("sollte einzigartige Dateinamen generieren", async () => {
      const prompt = "test prompt";
      const tokenId = "789";

      // Führe die Funktion zweimal aus
      await generateAndUploadImage(prompt, tokenId, "ionos");
      await generateAndUploadImage(prompt, tokenId, "ionos");

      // Überprüfe, dass verschiedene Dateinamen verwendet wurden
      const imageCalls = mockS3Send.mock.calls.filter((call) =>
        call[0].params.Key.startsWith("images/"),
      );
      const metadataCalls = mockS3Send.mock.calls.filter((call) =>
        call[0].params.Key.startsWith("metadata/"),
      );

      expect(imageCalls).toHaveLength(2);
      expect(metadataCalls).toHaveLength(2);

      // Dateinamen sollten unterschiedlich sein (wegen zufälligem String)
      expect(imageCalls[0][0].params.Key).not.toBe(imageCalls[1][0].params.Key);
      expect(metadataCalls[0][0].params.Key).not.toBe(metadataCalls[1][0].params.Key);
    });

    test("sollte Base64-zu-Buffer-Konvertierung korrekt handhaben", async () => {
      const prompt = "test prompt";
      const tokenId = "999";

      await generateAndUploadImage(prompt, tokenId, "ionos");

      // Finde den Bild-Upload-Aufruf
      const imageCall = mockS3Send.mock.calls.find(
        (call) => call[0].params.Key.startsWith("images/") && call[0].params.ContentType === "image/jpeg",
      );

      expect(imageCall).toBeDefined();
      expect(Buffer.isBuffer(imageCall[0].params.Body)).toBe(true);
    });

    test("sollte mit default tokenId umgehen", async () => {
      const prompt = "test without tokenId";

      const result = await generateAndUploadImage(prompt, "unknown", "ionos");

      expect(result).toMatch(/metadata_unknown_[a-f0-9]{12}\.json$/);

      // Überprüfe Metadaten
      const metadataCall = mockS3Send.mock.calls.find((call) =>
        call[0].params.Key.startsWith("metadata/"),
      );
      const metadata = JSON.parse(metadataCall[0].params.Body);
      expect(metadata.name).toBe("AI Generated Art #unknown");
    });

    test("sollte Netzwerk-Timeouts handhaben", async () => {
      global.fetch.mockRejectedValue(new Error("Network timeout"));

      await expect(generateAndUploadImage("test prompt", "123", "ionos")).rejects.toThrow(
        "Network timeout",
      );
    });

    test("sollte custom size Parameter verwenden", async () => {
      const prompt = "beautiful landscape";
      const tokenId = "123";
      const size = "1792x1024";

      const result = await generateAndUploadImage(prompt, tokenId, "ionos", size);

      // Verify IONOS API call with custom size
      expect(global.fetch).toHaveBeenCalledWith(
        "https://openai.inference.de-txl.ionos.com/v1/images/generations",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer test-ionos-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "black-forest-labs/FLUX.1-schnell",
            prompt,
            size: "1792x1024",
          }),
        }),
      );

      expect(result).toMatch(
        /^https:\/\/my-imagestore\.s3\.nl-ams\.scw\.cloud\/metadata\/metadata_123_[a-f0-9]{12}\.json$/,
      );
    });

    test("sollte standard size verwenden wenn keine size angegeben", async () => {
      const prompt = "beautiful landscape";
      const tokenId = "123";

      await generateAndUploadImage(prompt, tokenId, "ionos");

      // Verify IONOS API call with default size
      expect(global.fetch).toHaveBeenCalledWith(
        "https://openai.inference.de-txl.ionos.com/v1/images/generations",
        expect.objectContaining({
          body: JSON.stringify({
            model: "black-forest-labs/FLUX.1-schnell",
            prompt,
            size: "1024x1024",
          }),
        }),
      );
    });

    test("sollte Fehler werfen bei ungültiger size", async () => {
      const prompt = "beautiful landscape";
      const tokenId = "123";
      const invalidSize = "invalid_size";

      await expect(generateAndUploadImage(prompt, tokenId, "ionos", invalidSize)).rejects.toThrow(
        "Invalid size parameter. Must be one of: 1024x1024, 1792x1024",
      );
    });

    test("sollte beide gültige sizes akzeptieren", async () => {
      const prompt = "test prompt";
      const tokenId = "123";

      // Test 1024x1024
      await generateAndUploadImage(prompt, tokenId, "ionos", "1024x1024");
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            model: "black-forest-labs/FLUX.1-schnell",
            prompt,
            size: "1024x1024",
          }),
        }),
      );

      // Test 1792x1024
      await generateAndUploadImage(prompt, tokenId, "ionos", "1792x1024");
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            model: "black-forest-labs/FLUX.1-schnell",
            prompt,
            size: "1792x1024",
          }),
        }),
      );
    });

    test("sollte size Parameter in Metadaten-Attributen einschließen", async () => {
      // Test mit 1024x1024 size
      await generateAndUploadImage("test prompt", "123", "ionos", "1024x1024");

      // Überprüfe den Metadaten-Upload Call
      const metadataCall = mockS3Send.mock.calls.find((call) =>
        call[0].params.Key.startsWith("metadata/"),
      );

      expect(metadataCall).toBeDefined();
      const metadataJson = JSON.parse(metadataCall[0].params.Body);

      // Überprüfe dass size Attribut vorhanden ist
      const sizeAttribute = metadataJson.attributes.find(
        (attr) => attr.trait_type === "Image Size",
      );

      expect(sizeAttribute).toBeDefined();
      expect(sizeAttribute.value).toBe("1024x1024");

      // Test mit 1792x1024 size
      vi.clearAllMocks();
      mockS3Send.mockResolvedValue({});
      global.fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              {
                b64_json:
                  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
              },
            ],
          }),
      });

      await generateAndUploadImage("test prompt", "456", "ionos", "1792x1024");

      const metadataCall2 = mockS3Send.mock.calls.find((call) =>
        call[0].params.Key.startsWith("metadata/"),
      );

      const metadataJson2 = JSON.parse(metadataCall2[0].params.Body);
      const sizeAttribute2 = metadataJson2.attributes.find(
        (attr) => attr.trait_type === "Image Size",
      );

      expect(sizeAttribute2.value).toBe("1792x1024");
    });
  });

  describe("Utility Function Tests", () => {
    test("sollte verschiedene Content-Types korrekt verarbeiten", async () => {
      // Test verschiedene Dateitypen
      const testCases = [
        { data: { json: "data" }, contentType: "application/json" },
        { data: Buffer.from("image"), contentType: "image/png" },
        { data: "plain text", contentType: "text/plain" },
        { data: "<xml>test</xml>", contentType: "application/xml" },
      ];

      for (const testCase of testCases) {
        await uploadToS3(testCase.data, "test-file", testCase.contentType);

        const lastCall =
          mockS3Send.mock.calls[mockS3Send.mock.calls.length - 1];
        expect(lastCall[0].params.ContentType).toBe(testCase.contentType);
      }
    });

    test("sollte große Dateien verarbeiten können", async () => {
      // Simuliere große Datei (1MB)
      const largeBuffer = Buffer.alloc(1024 * 1024, "a");

      const result = await uploadToS3(largeBuffer, "large-file.bin", "application/octet-stream");

      expect(result).toBe("https://my-imagestore.s3.nl-ams.scw.cloud/large-file.bin");
      expect(mockS3Send).toHaveBeenCalled();
    });
  });
});
