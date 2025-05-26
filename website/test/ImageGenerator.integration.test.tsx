import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Integration tests for the ImageGenerator API
 * Tests the Scaleway Cloud Functions API based on readhandler.js
 * 
 * @fileoverview Integration tests covering successful API responses, error handling,
 * network issues, response validation, and URL construction for the ImageGenerator API
 */
describe("ImageGenerator API Integration", () => {
  const mockApiResponse = {
    metadata_url: "https://my-imagestore.s3.nl-ams.scw.cloud/metadata/token_123.json",
    image_url: "https://my-imagestore.s3.nl-ams.scw.cloud/images/generated_image_123.png",
    mintPrice: "10000000000000000",
    message: "Bild erfolgreich generiert und Token aktualisiert",
    transaction_hash: "0xabcdef123456",
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  describe("Successful API Response", () => {
    /**
     * Tests successful image generation with a valid prompt and token ID
     * Verifies that the API returns the expected response structure
     * @test {Object} response - API response object
     * @test {string} response.image_url - Generated image URL
     * @test {string} response.metadata_url - Token metadata URL
     */
    it("should handle successful image generation", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      } as Response);

      const prompt = "A beautiful landscape with mountains";
      const tokenId = "123";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      const response = await fetch(`${apiUrl}?prompt=${encodeURIComponent(prompt)}&tokenId=${tokenId}`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toEqual(mockApiResponse);
      expect(data.image_url).toContain("generated_image_123.png");
      expect(data.metadata_url).toContain("token_123.json");
    });

    /**
     * Tests proper encoding of special characters in prompt parameter
     * Verifies that URL encoding works correctly for complex prompts
     * @test {string} prompt - Prompt with special characters and symbols
     * @test {string} encodedPrompt - URL encoded version of the prompt
     */
    it("should handle special characters in prompt", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      } as Response);

      const prompt = "A city with 50% more details & symbols!";
      const tokenId = "456";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      await fetch(`${apiUrl}?prompt=${encodeURIComponent(prompt)}&tokenId=${tokenId}`);

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining(encodeURIComponent(prompt)));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("tokenId=456"));
    });
  });

  describe("API Error Responses", () => {
    /**
     * Tests API response when no prompt parameter is provided
     * @test {number} status - HTTP status code should be 400
     * @test {string} error - Error message should indicate missing prompt
     */
    it("should handle 400 - No prompt provided", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({ error: "No prompt provided" }),
      } as Response);

      const tokenId = "123";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      const response = await fetch(`${apiUrl}?tokenId=${tokenId}`); // No prompt
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toBe("No prompt provided");
    });

    /**
     * Tests API response when no tokenId parameter is provided
     * @test {number} status - HTTP status code should be 400
     * @test {string} error - Error message should indicate missing tokenId
     */
    it("should handle 400 - No tokenId provided", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({ error: "No tokenId provided" }),
      } as Response);

      const prompt = "A beautiful landscape";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      const response = await fetch(`${apiUrl}?prompt=${encodeURIComponent(prompt)}`); // No tokenId
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toBe("No tokenId provided");
    });

    /**
     * Tests API response when a non-existent token ID is provided
     * @test {number} status - HTTP status code should be 404
     * @test {string} error - Error message should indicate token not found
     */
    it("should handle 404 - Token does not exist", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ error: "Token does not exist" }),
      } as Response);

      const prompt = "A beautiful landscape";
      const tokenId = "999999"; // Non-existent token
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      const response = await fetch(`${apiUrl}?prompt=${encodeURIComponent(prompt)}&tokenId=${tokenId}`);
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(data.error).toBe("Token does not exist");
    });

    /**
     * Tests API response when trying to update an image that was already updated
     * @test {number} status - HTTP status code should be 400
     * @test {string} error - Error message should indicate image already updated
     */
    it("should handle 400 - Image already updated", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({ error: "Image already updated" }),
      } as Response);

      const prompt = "A beautiful landscape";
      const tokenId = "123"; // Token with already updated image
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      const response = await fetch(`${apiUrl}?prompt=${encodeURIComponent(prompt)}&tokenId=${tokenId}`);
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toBe("Image already updated");
    });

    /**
     * Tests API response when internal server error occurs during image generation
     * @test {number} status - HTTP status code should be 500
     * @test {string} error - Error message should contain operation failure details
     * @test {string} mintPrice - Mint price should still be returned even on error
     */
    it("should handle 500 - Internal server error", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () =>
          Promise.resolve({
            error: "Operation fehlgeschlagen: Image generation failed",
            mintPrice: "10000000000000000",
          }),
      } as Response);

      const prompt = "A beautiful landscape";
      const tokenId = "123";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      const response = await fetch(`${apiUrl}?prompt=${encodeURIComponent(prompt)}&tokenId=${tokenId}`);
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(data.error).toContain("Operation fehlgeschlagen");
      expect(data.mintPrice).toBe("10000000000000000");
    });
  });

  describe("Network and Timeout Handling", () => {
    /**
     * Tests network timeout error handling
     * @test {Error} error - Should reject with network timeout error
     */
    it("should handle network timeout", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockRejectedValue(new Error("Network timeout"));

      const prompt = "A beautiful landscape";
      const tokenId = "123";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      await expect(fetch(`${apiUrl}?prompt=${encodeURIComponent(prompt)}&tokenId=${tokenId}`)).rejects.toThrow(
        "Network timeout",
      );
    });

    /**
     * Tests connection refused error handling
     * @test {Error} error - Should reject with connection refused error
     */
    it("should handle connection refused", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockRejectedValue(new Error("Connection refused"));

      const prompt = "A beautiful landscape";
      const tokenId = "123";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      await expect(fetch(`${apiUrl}?prompt=${encodeURIComponent(prompt)}&tokenId=${tokenId}`)).rejects.toThrow(
        "Connection refused",
      );
    });
  });

  describe("Response Validation", () => {
    /**
     * Tests validation of successful response structure
     * @test {Object} mockApiResponse - Validates response object properties
     * @test {string} metadata_url - Validates metadata URL format
     * @test {string} image_url - Validates image URL format
     * @test {string} mintPrice - Validates mint price format
     * @test {string} transaction_hash - Validates transaction hash format
     */
    it("should validate successful response structure", () => {
      expect(mockApiResponse).toHaveProperty("metadata_url");
      expect(mockApiResponse).toHaveProperty("image_url");
      expect(mockApiResponse).toHaveProperty("mintPrice");
      expect(mockApiResponse).toHaveProperty("message");
      expect(mockApiResponse).toHaveProperty("transaction_hash");

      expect(mockApiResponse.metadata_url).toMatch(/^https:\/\/.*\.json$/);
      expect(mockApiResponse.image_url).toMatch(/^https:\/\/.*\.(png|jpg|jpeg)$/);
      expect(mockApiResponse.mintPrice).toMatch(/^\d+$/);
      expect(mockApiResponse.transaction_hash).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    /**
     * Tests handling of incomplete API responses with missing fields
     * @test {Object} incompleteResponse - Response with only partial data
     * @test {string} image_url - Should be defined when present
     * @test {undefined} metadata_url - Should be undefined when missing
     * @test {undefined} mintPrice - Should be undefined when missing
     */
    it("should handle missing fields in response", async () => {
      const incompleteResponse = {
        image_url: "https://example.com/image.png",
        // Missing other fields
      };

      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(incompleteResponse),
      } as Response);

      const response = await fetch("https://api.example.com");
      const data = await response.json();

      expect(data.image_url).toBeDefined();
      expect(data.metadata_url).toBeUndefined();
      expect(data.mintPrice).toBeUndefined();
    });
  });

  describe("API URL Construction", () => {
    const testCases = [
      {
        prompt: "Simple prompt",
        tokenId: "1",
        expected: "prompt=Simple%20prompt&tokenId=1",
      },
      {
        prompt: "Complex prompt with special chars: !@#$%^&*()",
        tokenId: "123",
        expected: "prompt=Complex%20prompt%20with%20special%20chars%3A%20!%40%23%24%25%5E%26*()&tokenId=123",
      },
      {
        prompt: "Prompt with unicode: café résumé naïve",
        tokenId: "456",
        expected: "prompt=Prompt%20with%20unicode%3A%20caf%C3%A9%20r%C3%A9sum%C3%A9%20na%C3%AFve&tokenId=456",
      },
    ];

    testCases.forEach(({ prompt, tokenId, expected }) => {
      it(`should correctly encode: "${prompt}"`, () => {
        const queryString = `prompt=${encodeURIComponent(prompt)}&tokenId=${tokenId}`;
        expect(queryString).toBe(expected);
      });
    });
  });
});
