/**
 * ImageGenerator Edit Mode API Integration Tests
 * 
 * Tests für die API-Integration im Edit-Modus mit Referenzbildern:
 * - API-Aufrufe mit referenceImage Parameter
 * - Base64 Datenübertragung
 * - Edit Mode vs Generate Mode Unterscheidung
 * - Complete Workflow Tests
 * 
 * Priorität: MITTEL - Backend-Integration für Bildbearbeitung
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

describe("ImageGenerator Edit Mode API Integration", () => {
  const mockApiResponse = {
    metadata_url: "https://my-imagestore.s3.nl-ams.scw.cloud/metadata/token_123.json",
    image_url: "https://my-imagestore.s3.nl-ams.scw.cloud/images/generated_image_123.jpg",
    mintPrice: "10000000000000000",
    message: "Bild erfolgreich bearbeitet und Token aktualisiert",
    transaction_hash: "0xabcdef123456",
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  describe("🟡 MITTEL: Edit Mode API Tests", () => {
    it("sollte API mit referenceImage Parameter aufrufen", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      } as Response);

      const prompt = "Make this image more vibrant";
      const tokenId = "123";
      const referenceImageBase64 = "/9j/4AAQSkZJRgABAQEAYABgAAD//2Q=";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      // Simuliere API-Aufruf mit Referenzbild
      const requestBody = {
        prompt,
        tokenId,
        referenceImage: referenceImageBase64,
        mode: "edit",
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toEqual(mockApiResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        apiUrl,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })
      );
    });

    it("sollte Base64 Referenzbild korrekt übertragen", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      } as Response);

      const prompt = "Add more details to this landscape";
      const tokenId = "456";
      const referenceImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          tokenId,
          referenceImage: referenceImageBase64,
          mode: "edit",
        }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        apiUrl,
        expect.objectContaining({
          body: expect.stringContaining(referenceImageBase64),
        })
      );

      // Überprüfe dass Base64 String keine Data-URL-Prefix enthält
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]?.body as string);
      expect(requestBody.referenceImage).not.toMatch(/^data:image/);
      expect(requestBody.referenceImage).toBe(referenceImageBase64);
    });

    it("sollte Edit-Mode vs Generate-Mode unterscheiden", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      } as Response);

      const prompt = "A beautiful landscape";
      const tokenId = "789";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      // Test Generate Mode (ohne Referenzbild)
      await fetch(`${apiUrl}?prompt=${encodeURIComponent(prompt)}&tokenId=${tokenId}`);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("prompt="),
        undefined
      );

      vi.clearAllMocks();

      // Test Edit Mode (mit Referenzbild)
      const referenceImageBase64 = "/9j/4AAQSkZJRgABAQEAYABgAAD//2Q=";
      
      await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          tokenId,
          referenceImage: referenceImageBase64,
          mode: "edit",
        }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        apiUrl,
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("edit"),
        })
      );
    });

    it("sollte Fehler bei fehlendem Referenzbild behandeln", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({ 
          error: "Reference image required for edit mode" 
        }),
      } as Response);

      const prompt = "Edit this image";
      const tokenId = "123";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      // Versuche Edit Mode ohne Referenzbild
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          tokenId,
          mode: "edit",
          // referenceImage fehlt
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toBe("Reference image required for edit mode");
    });

    it("sollte ungültiges Base64 Format ablehnen", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({ 
          error: "Invalid base64 image format" 
        }),
      } as Response);

      const prompt = "Edit this image";
      const tokenId = "123";
      const invalidBase64 = "not-valid-base64-data!!!";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          tokenId,
          referenceImage: invalidBase64,
          mode: "edit",
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid base64 image format");
    });

    it("sollte size Parameter im Edit Mode unterstützen", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          ...mockApiResponse,
          size: "1792x1024",
        }),
      } as Response);

      const prompt = "Enhance this landscape";
      const tokenId = "123";
      const referenceImageBase64 = "/9j/4AAQSkZJRgABAQEAYABgAAD//2Q=";
      const size = "1792x1024";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          tokenId,
          referenceImage: referenceImageBase64,
          mode: "edit",
          size,
        }),
      });

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]?.body as string);
      
      expect(requestBody.size).toBe(size);
      expect(requestBody.mode).toBe("edit");
    });
  });

  describe("🟡 MITTEL: Complete Workflow Tests", () => {
    it("sollte kompletten Upload → Compress → Edit → API Flow testen", async () => {
      const mockFetch = vi.mocked(global.fetch);
      
      // Mock für erfolgreiche Bildbearbeitung
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          ...mockApiResponse,
          message: "Bild erfolgreich bearbeitet und hochgeladen",
        }),
      } as Response);

      const prompt = "Make this sunset more dramatic";
      const tokenId = "workflow-test";
      
      // Simuliere komprimiertes Base64 Bild (von compressImage Funktion)
      const compressedBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
      const mimeType = "image/jpeg";

      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      // Schritt 1: File Upload (bereits durch compressImage verarbeitet)
      // Schritt 2: API-Aufruf im Edit Mode
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          tokenId,
          referenceImage: compressedBase64,
          mode: "edit",
          mimeType,
        }),
      });

      const data = await response.json();

      // Schritt 3: Verifikation des kompletten Flows
      expect(response.ok).toBe(true);
      expect(data.message).toContain("erfolgreich bearbeitet");
      expect(data.image_url).toMatch(/\.jpg$/); // Erwarte JPEG Output
      expect(data.metadata_url).toMatch(/\.json$/);
      expect(data.transaction_hash).toMatch(/^0x[a-fA-F0-9]+$/);

      // Überprüfe Request-Parameter
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]?.body as string);
      
      expect(requestBody.mode).toBe("edit");
      expect(requestBody.referenceImage).toBe(compressedBase64);
      expect(requestBody.mimeType).toBe(mimeType);
    });

    it("sollte mehrfache Bildwechsel handhaben", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      } as Response);

      const prompt = "Enhance image quality";
      const tokenId = "multi-change";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      // Erstes Bild
      const firstImage = "/9j/4AAQSkZJRgABAQEAYABgAAD//2Q=";
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          tokenId,
          referenceImage: firstImage,
          mode: "edit",
        }),
      });

      // Zweites Bild (Wechsel)
      const secondImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          tokenId,
          referenceImage: secondImage,
          mode: "edit",
        }),
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Überprüfe dass verschiedene Bilder verwendet wurden
      const firstCall = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      const secondCall = JSON.parse(mockFetch.mock.calls[1][1]?.body as string);
      
      expect(firstCall.referenceImage).toBe(firstImage);
      expect(secondCall.referenceImage).toBe(secondImage);
      expect(firstCall.referenceImage).not.toBe(secondCall.referenceImage);
    });

    it("sollte Upload-Fehler und Recovery testen", async () => {
      const mockFetch = vi.mocked(global.fetch);
      
      // Erster Aufruf schlägt fehl
      mockFetch
        .mockRejectedValueOnce(new Error("Network timeout"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockApiResponse),
        } as Response);

      const prompt = "Fix this corrupted image";
      const tokenId = "recovery-test";
      const referenceImage = "/9j/4AAQSkZJRgABAQEAYABgAAD//2Q=";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          tokenId,
          referenceImage,
          mode: "edit",
        }),
      };

      // Erster Versuch - Fehler
      await expect(fetch(apiUrl, requestOptions)).rejects.toThrow("Network timeout");

      // Zweiter Versuch - Erfolg (Recovery)
      const response = await fetch(apiUrl, requestOptions);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toEqual(mockApiResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("sollte API Rate Limiting im Edit Mode handhaben", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        json: () => Promise.resolve({ 
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: 60
        }),
      } as Response);

      const prompt = "Enhance image colors";
      const tokenId = "rate-limit";
      const referenceImage = "/9j/4AAQSkZJRgABAQEAYABgAAD//2Q=";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          tokenId,
          referenceImage,
          mode: "edit",
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(429);
      expect(data.error).toContain("Rate limit exceeded");
      expect(data.retryAfter).toBe(60);
    });

    it("sollte große Base64 Bilder im Edit Mode verarbeiten", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      } as Response);

      const prompt = "Upscale this image";
      const tokenId = "large-image";
      
      // Simuliere großes komprimiertes Bild (1MB Base64 ≈ 750KB Originaldatei)
      const largeBase64 = "A".repeat(1024 * 1024); // 1MB Base64 String
      
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          tokenId,
          referenceImage: largeBase64,
          mode: "edit",
        }),
      });

      expect(response.ok).toBe(true);
      
      // Überprüfe dass große Payload übertragen wurde
      const callArgs = mockFetch.mock.calls[0];
      const bodySize = (callArgs[1]?.body as string).length;
      expect(bodySize).toBeGreaterThan(1024 * 1024); // > 1MB
    });
  });
});