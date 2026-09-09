/**
 * Tests für image_service.js - Bildgenerierung und S3-Upload-Funktionen
 */

import { describe, test, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";

// Mock für @fretchen/s3-utils
const mockPutS3Object = vi.fn();

vi.mock("@fretchen/s3-utils", () => {
  return {
    putS3Object: mockPutS3Object,
    getS3BaseUrl: () => "https://my-imagestore.s3.nl-ams.scw.cloud/",
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
    process.env.BFL_API_TOKEN = "test-bfl-token";

    // Reset aller Mocks
    vi.clearAllMocks();

    // Standard-Mock-Rückgabewerte
    mockPutS3Object.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete process.env.SCW_ACCESS_KEY;
    delete process.env.SCW_SECRET_KEY;
    delete process.env.BFL_API_TOKEN;
  });

  describe("uploadToS3() Tests", () => {
    test("sollte JSON-Daten erfolgreich hochladen", async () => {
      const testData = { name: "Test NFT", description: "Test description" };
      const fileName = "test.json";

      const result = await uploadToS3(testData, fileName);

      expect(result).toBe("https://my-imagestore.s3.nl-ams.scw.cloud/test.json");
      expect(mockPutS3Object).toHaveBeenCalled();
      const [key, body, opts] = mockPutS3Object.mock.calls[0];
      expect(key).toBe(fileName);
      expect(body).toBe(JSON.stringify(testData));
      expect(opts).toMatchObject({
        contentType: "application/json",
        acl: "public-read",
        cacheControl: "public, max-age=31536000, immutable",
      });
    });

    test("sollte Buffer-Daten erfolgreich hochladen", async () => {
      const testBuffer = Buffer.from("test image data");
      const fileName = "test.png";

      const result = await uploadToS3(testBuffer, fileName, "image/png");

      expect(result).toBe("https://my-imagestore.s3.nl-ams.scw.cloud/test.png");
      expect(mockPutS3Object).toHaveBeenCalled();
      const [key, body, opts] = mockPutS3Object.mock.calls[0];
      expect(key).toBe(fileName);
      expect(body).toBe(testBuffer);
      expect(opts).toMatchObject({
        contentType: "image/png",
        acl: "public-read",
        cacheControl: "public, max-age=31536000, immutable",
      });
    });

    test("sollte String-Daten hochladen", async () => {
      const testString = "plain text data";
      const fileName = "test.txt";

      const result = await uploadToS3(testString, fileName, "text/plain");

      expect(result).toBe("https://my-imagestore.s3.nl-ams.scw.cloud/test.txt");
      expect(mockPutS3Object).toHaveBeenCalled();
      const [key, body, opts] = mockPutS3Object.mock.calls[0];
      expect(key).toBe(fileName);
      expect(body).toBe(testString);
      expect(opts).toMatchObject({
        contentType: "text/plain",
        acl: "public-read",
        cacheControl: "public, max-age=31536000, immutable",
      });
    });

    test("sollte Fehler bei S3-Upload-Problemen werfen", async () => {
      mockPutS3Object.mockRejectedValue(new Error("S3 Upload failed"));

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
      mockPutS3Object.mockRejectedValue(new Error("Missing AWS credentials"));

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
    // BFL is a three-request flow, unlike a single-shot image API: submit returns a polling
    // URL, the poll returns a delivery URL once status is "Ready", and the image itself is
    // downloaded from there. Dispatching the mock on URL rather than chaining
    // mockResolvedValueOnce keeps tests that call the function twice honest.
    const BFL_ENDPOINT = "https://api.bfl.ai/v1/flux-kontext-pro";
    const POLL_URL = "https://api.bfl.ai/v1/get_result?id=req-1";
    const IMAGE_URL = "https://delivery.bfl.ai/req-1/sample.jpg";
    const IMAGE_BYTES = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);

    function mockBfl({ pollStatus = "Ready", submit = { ok: true } } = {}) {
      global.fetch.mockImplementation((url) => {
        const u = String(url);
        if (u === BFL_ENDPOINT) {
          return Promise.resolve({
            ...submit,
            json: () => Promise.resolve({ id: "req-1", polling_url: POLL_URL }),
          });
        }
        if (u === POLL_URL) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ status: pollStatus, result: { sample: IMAGE_URL } }),
          });
        }
        if (u === IMAGE_URL) {
          return Promise.resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(IMAGE_BYTES.buffer),
          });
        }
        return Promise.reject(new Error(`unexpected fetch: ${u}`));
      });
    }

    /** The submit call's parsed body — what BFL was actually asked to generate. */
    function submitBody() {
      const call = global.fetch.mock.calls.find((c) => String(c[0]) === BFL_ENDPOINT);
      return JSON.parse(call[1].body);
    }

    beforeEach(() => {
      mockBfl();
      mockPutS3Object.mockResolvedValue(undefined);
    });

    test("sollte erfolgreich Bild generieren und hochladen", async () => {
      const result = await generateAndUploadImage("beautiful landscape", "123", "bfl");

      expect(global.fetch).toHaveBeenCalledWith(
        BFL_ENDPOINT,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            // BFL authenticates with a non-standard x-key header, not Bearer.
            "x-key": "test-bfl-token",
            "Content-Type": "application/json",
          }),
        }),
      );
      expect(submitBody()).toEqual({
        prompt: "beautiful landscape",
        aspect_ratio: "1:1",
        output_format: "jpeg",
      });

      // Polled, then downloaded from the delivery URL the poll returned.
      expect(global.fetch).toHaveBeenCalledWith(
        POLL_URL,
        expect.objectContaining({ method: "GET" }),
      );
      expect(global.fetch).toHaveBeenCalledWith(IMAGE_URL);

      expect(mockPutS3Object).toHaveBeenCalledTimes(2);
      expect(result).toMatch(
        /^https:\/\/my-imagestore\.s3\.nl-ams\.scw\.cloud\/metadata\/metadata_123_[a-f0-9]{12}\.json$/,
      );
    });

    test("sollte Fehler werfen wenn kein Prompt bereitgestellt wird", async () => {
      await expect(generateAndUploadImage("", "123", "bfl")).rejects.toThrow("No prompt provided.");
      await expect(generateAndUploadImage(null, "123", "bfl")).rejects.toThrow(
        "No prompt provided.",
      );
      await expect(generateAndUploadImage(undefined, "123", "bfl")).rejects.toThrow(
        "No prompt provided.",
      );
    });

    test("sollte Fehler werfen wenn BFL API Token fehlt", async () => {
      delete process.env.BFL_API_TOKEN;

      await expect(generateAndUploadImage("test prompt", "123", "bfl")).rejects.toThrow(
        "API token not found. Please configure the BFL_API_TOKEN environment variable.",
      );
    });

    test("sollte Fehler bei BFL API-Problemen behandeln", async () => {
      mockBfl({ submit: { ok: false, status: 401, statusText: "Unauthorized" } });

      await expect(generateAndUploadImage("test prompt", "123", "bfl")).rejects.toThrow(
        "Could not reach BFL: 401 Unauthorized",
      );
    });

    test("sollte sofort fehlschlagen wenn BFL die Generierung als Failed meldet", async () => {
      // Regression guard: this used to be thrown inside the poll loop's own try, caught by its
      // sibling catch, and retried for all 60 attempts — surfacing five minutes later as a
      // *timeout* rather than the real reason. It must fail fast, on the first poll.
      mockBfl({ pollStatus: "Failed" });

      await expect(generateAndUploadImage("test prompt", "123", "bfl")).rejects.toThrow(
        /BFL generation failed/,
      );
      // One submit + exactly one poll: no retry storm.
      expect(global.fetch.mock.calls.filter((c) => String(c[0]) === POLL_URL)).toHaveLength(1);
    });

    test("sollte einen einzelnen Bild-Download-Fehler überstehen und beim nächsten Poll erneut versuchen", async () => {
      // Regression guard, the counterpart to the test above: fixing the Error/Failed swallow-bug
      // moved that check outside the poll's try/catch, but the image-download step sits in the
      // same "Ready" branch — moving it out too (as an earlier version of this fix did) would
      // have removed retry tolerance for a transient failure fetching BFL's delivery CDN, which
      // used to self-heal on the next 5s poll cycle rather than aborting the whole request.
      let imageFetchAttempts = 0;
      global.fetch.mockImplementation((url) => {
        const u = String(url);
        if (u === BFL_ENDPOINT) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: "req-1", polling_url: POLL_URL }),
          });
        }
        if (u === POLL_URL) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ status: "Ready", result: { sample: IMAGE_URL } }),
          });
        }
        if (u === IMAGE_URL) {
          imageFetchAttempts += 1;
          if (imageFetchAttempts === 1) {
            return Promise.resolve({ ok: false, status: 503 });
          }
          return Promise.resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(IMAGE_BYTES.buffer),
          });
        }
        return Promise.reject(new Error(`unexpected fetch: ${u}`));
      });

      vi.useFakeTimers();
      try {
        const pending = generateAndUploadImage("test prompt", "123", "bfl");
        // Drains the 5s wait before the next poll attempt, which is where the retry happens.
        await vi.advanceTimersByTimeAsync(5000);
        const result = await pending;

        expect(result).toMatch(/metadata_123/);
      } finally {
        vi.useRealTimers();
      }

      // First download attempt failed, second succeeded — not zero, and not more than needed.
      expect(imageFetchAttempts).toBe(2);
    });

    test("sollte korrekte ERC-721 Metadaten erstellen", async () => {
      const prompt = "beautiful sunset";
      const tokenId = "456";

      await generateAndUploadImage(prompt, tokenId, "bfl");

      const metadataCall = mockPutS3Object.mock.calls.find((call) =>
        call[0].startsWith("metadata/"),
      );

      expect(metadataCall).toBeDefined();

      const metadata = JSON.parse(metadataCall[1]);
      expect(metadata).toEqual({
        name: `AI Generated Art #${tokenId}`,
        description: `AI generated artwork based on the prompt: "${prompt}"`,
        image: expect.stringMatching(
          /^https:\/\/my-imagestore\.s3\.nl-ams\.scw\.cloud\/images\/image_456_[a-f0-9]{12}\.jpg$/,
        ),
        attributes: [
          { trait_type: "Prompt", value: prompt },
          { trait_type: "Model", value: "flux-kontext-pro" },
          { trait_type: "Image Size", value: "1024x1024" },
          {
            trait_type: "Creation Date",
            value: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          },
        ],
      });
    });

    test("sollte einzigartige Dateinamen generieren", async () => {
      await generateAndUploadImage("test prompt", "789", "bfl");
      await generateAndUploadImage("test prompt", "789", "bfl");

      const imageCalls = mockPutS3Object.mock.calls.filter((call) => call[0].startsWith("images/"));
      const metadataCalls = mockPutS3Object.mock.calls.filter((call) =>
        call[0].startsWith("metadata/"),
      );

      expect(imageCalls).toHaveLength(2);
      expect(metadataCalls).toHaveLength(2);
      expect(imageCalls[0][0]).not.toBe(imageCalls[1][0]);
      expect(metadataCalls[0][0]).not.toBe(metadataCalls[1][0]);
    });

    test("sollte Base64-zu-Buffer-Konvertierung korrekt handhaben", async () => {
      await generateAndUploadImage("test prompt", "999", "bfl");

      const imageCall = mockPutS3Object.mock.calls.find(
        (call) => call[0].startsWith("images/") && call[2].contentType === "image/jpeg",
      );

      expect(imageCall).toBeDefined();
      expect(Buffer.isBuffer(imageCall[1])).toBe(true);
      // Round-trips the downloaded bytes rather than just being non-empty.
      expect(Uint8Array.from(imageCall[1])).toEqual(IMAGE_BYTES);
    });

    test("sollte mit default tokenId umgehen", async () => {
      const result = await generateAndUploadImage("test without tokenId", "unknown", "bfl");

      expect(result).toMatch(/metadata_unknown_[a-f0-9]{12}\.json$/);

      const metadataCall = mockPutS3Object.mock.calls.find((call) =>
        call[0].startsWith("metadata/"),
      );
      const metadata = JSON.parse(metadataCall[1]);
      expect(metadata.name).toBe("AI Generated Art #unknown");
    });

    test("sollte Netzwerk-Timeouts handhaben", async () => {
      global.fetch.mockRejectedValue(new Error("Network timeout"));

      await expect(generateAndUploadImage("test prompt", "123", "bfl")).rejects.toThrow(
        "Network timeout",
      );
    });

    test("sollte size auf das BFL aspect_ratio abbilden", async () => {
      // BFL takes an aspect ratio, not pixel dimensions — this mapping is where a size change
      // would silently produce the wrong shape.
      await generateAndUploadImage("beautiful landscape", "123", "bfl", "1792x1024");
      expect(submitBody().aspect_ratio).toBe("16:9");

      vi.clearAllMocks();
      mockBfl();
      await generateAndUploadImage("beautiful landscape", "123", "bfl", "1024x1024");
      expect(submitBody().aspect_ratio).toBe("1:1");
    });

    test("sollte standard size verwenden wenn keine size angegeben", async () => {
      await generateAndUploadImage("beautiful landscape", "123", "bfl");
      expect(submitBody().aspect_ratio).toBe("1:1");
    });

    test("sollte Fehler werfen bei ungültiger size", async () => {
      await expect(
        generateAndUploadImage("beautiful landscape", "123", "bfl", "invalid_size"),
      ).rejects.toThrow("Invalid size parameter. Must be one of: 1024x1024, 1792x1024");
    });

    test("sollte im edit-Modus das Referenzbild mitschicken", async () => {
      // The mode/referenceImage vendor extension — previously untested anywhere, and the reason
      // a second provider cannot be advertised without honouring it.
      const referenceImage = "dGVzdC1yZWZlcmVuY2UtaW1hZ2U=";

      await generateAndUploadImage(
        "make it sunset",
        "123",
        "bfl",
        "1024x1024",
        "edit",
        referenceImage,
      );

      expect(submitBody().input_image).toBe(referenceImage);
    });

    test("sollte im generate-Modus kein Referenzbild mitschicken", async () => {
      await generateAndUploadImage("a cat", "123", "bfl", "1024x1024", "generate", null);

      expect(submitBody()).not.toHaveProperty("input_image");
    });

    test("sollte size Parameter in Metadaten-Attributen einschließen", async () => {
      await generateAndUploadImage("test prompt", "123", "bfl", "1024x1024");

      const metadataCall = mockPutS3Object.mock.calls.find((call) =>
        call[0].startsWith("metadata/"),
      );
      expect(metadataCall).toBeDefined();
      const sizeAttribute = JSON.parse(metadataCall[1]).attributes.find(
        (attr) => attr.trait_type === "Image Size",
      );
      expect(sizeAttribute.value).toBe("1024x1024");

      vi.clearAllMocks();
      mockPutS3Object.mockResolvedValue(undefined);
      mockBfl();

      await generateAndUploadImage("test prompt", "456", "bfl", "1792x1024");

      const metadataCall2 = mockPutS3Object.mock.calls.find((call) =>
        call[0].startsWith("metadata/"),
      );
      const sizeAttribute2 = JSON.parse(metadataCall2[1]).attributes.find(
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

        const lastCall = mockPutS3Object.mock.calls[mockPutS3Object.mock.calls.length - 1];
        expect(lastCall[2].contentType).toBe(testCase.contentType);
      }
    });

    test("sollte große Dateien verarbeiten können", async () => {
      // Simuliere große Datei (1MB)
      const largeBuffer = Buffer.alloc(1024 * 1024, "a");

      const result = await uploadToS3(largeBuffer, "large-file.bin", "application/octet-stream");

      expect(result).toBe("https://my-imagestore.s3.nl-ams.scw.cloud/large-file.bin");
      expect(mockPutS3Object).toHaveBeenCalled();
    });
  });
});
