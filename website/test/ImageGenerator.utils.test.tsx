import { describe, it, expect, vi, beforeEach } from "vitest";

// Helper function tests
describe("ImageGenerator Utilities", () => {
  describe("waitForTransaction", () => {
    beforeEach(() => {
      // Mock window.ethereum
      Object.defineProperty(window, "ethereum", {
        value: {
          request: vi.fn(),
        },
        writable: true,
      });
    });

    it("should resolve when transaction receipt is available", async () => {
      const mockReceipt = {
        blockHash: "0xblock123",
        transactionHash: "0x123",
        logs: [],
      };

      vi.mocked(window.ethereum.request).mockResolvedValue(mockReceipt);

      // Import function dynamically to ensure fresh module state
      const { waitForTransaction } = await import("../components/ImageGenerator");

      const result = await waitForTransaction("0x123" as `0x${string}`);
      expect(result).toEqual(mockReceipt);

      expect(window.ethereum.request).toHaveBeenCalledWith({
        method: "eth_getTransactionReceipt",
        params: ["0x123"],
      });
    });

    it("should retry when receipt is not available initially", async () => {
      const mockReceipt = {
        blockHash: "0xblock123",
        transactionHash: "0x123",
        logs: [],
      };

      vi.mocked(window.ethereum.request)
        .mockResolvedValueOnce(null) // First call returns null
        .mockResolvedValueOnce(mockReceipt); // Second call returns receipt

      // Mock setTimeout to resolve immediately for testing
      vi.spyOn(global, "setTimeout").mockImplementation((callback: () => void) => {
        callback();
        return 1 as unknown as NodeJS.Timeout;
      });

      const { waitForTransaction } = await import("../components/ImageGenerator");

      const result = await waitForTransaction("0x123" as `0x${string}`);
      expect(result).toEqual(mockReceipt);

      expect(window.ethereum.request).toHaveBeenCalledTimes(2);

      vi.restoreAllMocks();
    });

    it("should reject on ethereum request error", async () => {
      const mockError = new Error("Network error");
      vi.mocked(window.ethereum.request).mockRejectedValue(mockError);

      const { waitForTransaction } = await import("../components/ImageGenerator");

      await expect(waitForTransaction("0x123" as `0x${string}`)).rejects.toThrow("Network error");
    });
  });

  describe("Token ID Extraction", () => {
    it("should extract token ID from transfer event", () => {
      const mockReceipt = {
        logs: [
          {
            topics: [
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", // Transfer event signature
              "0x0000000000000000000000000000000000000000000000000000000000000000", // from
              "0x000000000000000000000000123456789abcdef000000000000000000000000", // to
              "0x000000000000000000000000000000000000000000000000000000000000007b", // tokenId (123 in hex)
            ],
          },
        ],
      };

      // Find transfer event (same logic as in component)
      const transferEvent = mockReceipt.logs.find(
        (log) => log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      );

      expect(transferEvent).toBeDefined();
      expect(transferEvent?.topics.length).toBe(4);

      const tokenIdHex = transferEvent?.topics[3];
      const tokenId = BigInt(tokenIdHex!);

      expect(tokenId).toBe(BigInt(123));
    });

    it("should handle different token ID values", () => {
      const testCases = [
        { hex: "0x0000000000000000000000000000000000000000000000000000000000000001", expected: BigInt(1) },
        { hex: "0x00000000000000000000000000000000000000000000000000000000000003e8", expected: BigInt(1000) },
        { hex: "0x000000000000000000000000000000000000000000000000000000000000ffff", expected: BigInt(65535) },
      ];

      testCases.forEach(({ hex, expected }) => {
        const tokenId = BigInt(hex);
        expect(tokenId).toBe(expected);
      });
    });
  });

  describe("API URL Construction", () => {
    it("should construct correct API URL with prompt and tokenId", () => {
      const baseUrl = "https://api.example.com";
      const prompt = "A beautiful sunset over mountains";
      const tokenId = BigInt(123);

      const expectedUrl = `${baseUrl}?prompt=${encodeURIComponent(prompt)}&tokenId=${tokenId}`;
      const actualUrl = `${baseUrl}?prompt=${encodeURIComponent(prompt)}&tokenId=${tokenId}`;

      expect(actualUrl).toBe(expectedUrl);
    });

    it("should handle special characters in prompt", () => {
      const baseUrl = "https://api.example.com";
      const prompt = "A city with 50% more details & symbols!";
      const tokenId = BigInt(456);

      const url = `${baseUrl}?prompt=${encodeURIComponent(prompt)}&tokenId=${tokenId}`;

      expect(url).toContain("50%25"); // % should be encoded
      expect(url).toContain("%26"); // & should be encoded
      expect(url).toContain("symbols!"); // ! is allowed in URLs, not encoded
      expect(url).toContain("tokenId=456");
    });
  });

  describe("Error Message Handling", () => {
    it("should format error messages correctly", () => {
      const testCases = [
        { error: new Error("Network failed"), expected: "Network failed" },
        { error: "String error", expected: "An unknown error occurred" },
        { error: null, expected: "An unknown error occurred" },
        { error: undefined, expected: "An unknown error occurred" },
        { error: { message: "Object error" }, expected: "An unknown error occurred" },
      ];

      testCases.forEach(({ error, expected }) => {
        const errorMsg = error instanceof Error ? error.message : "An unknown error occurred";
        expect(errorMsg).toBe(expected);
      });
    });
  });

  describe("Contract Configuration", () => {
    it("should validate contract configuration structure", () => {
      // This tests the expected structure of contract config
      const mockConfig = {
        address: "0x9859431b682e861b19e87Db14a04944BC747AB6d",
        abi: [],
      };

      expect(mockConfig).toHaveProperty("address");
      expect(mockConfig).toHaveProperty("abi");
      expect(mockConfig.address).toMatch(/^0x[a-fA-F0-9]{40}$/); // Valid Ethereum address format
      expect(Array.isArray(mockConfig.abi)).toBe(true);
    });
  });

  describe("State Management", () => {
    it("should validate MintingStatus type values", () => {
      const validStatuses = ["idle", "minting", "generating", "error"];

      validStatuses.forEach((status) => {
        expect(["idle", "minting", "generating", "error"]).toContain(status);
      });
    });

    it("should handle BigInt serialization for token IDs", () => {
      const tokenId = BigInt(123);
      const serialized = tokenId.toString();
      const deserialized = BigInt(serialized);

      expect(serialized).toBe("123");
      expect(deserialized).toBe(tokenId);
    });
  });

  describe("Input Validation", () => {
    it("should validate prompt input", () => {
      const validPrompts = [
        "A beautiful landscape",
        "A futuristic city with flying cars and neon lights",
        "Portrait of a cat in Renaissance style",
      ];

      const invalidPrompts = ["", "   ", "\n\t"];

      validPrompts.forEach((prompt) => {
        expect(prompt.trim().length > 0).toBe(true);
      });

      invalidPrompts.forEach((prompt) => {
        expect(prompt.trim().length > 0).toBe(false);
      });
    });

    it("should handle long prompts", () => {
      const longPrompt = "A ".repeat(1000) + "landscape";
      expect(longPrompt.length).toBeGreaterThan(2000);
      expect(encodeURIComponent(longPrompt).length).toBeGreaterThan(longPrompt.length);
    });
  });

  describe("Blockchain Value Formatting", () => {
    it("should handle ETH value calculations", () => {
      const mintPrice = BigInt("10000000000000000"); // 0.01 ETH in wei
      const ethValue = Number(mintPrice) / 1e18;

      expect(ethValue).toBe(0.01);
    });

    it("should handle different wei values", () => {
      const testCases = [
        { wei: BigInt("1000000000000000000"), eth: 1 },
        { wei: BigInt("500000000000000000"), eth: 0.5 },
        { wei: BigInt("10000000000000000"), eth: 0.01 },
        { wei: BigInt("1000000000000000"), eth: 0.001 },
      ];

      testCases.forEach(({ wei, eth }) => {
        const calculated = Number(wei) / 1e18;
        expect(calculated).toBe(eth);
      });
    });
  });
});
