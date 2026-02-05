/**
 * useX402ImageGeneration Hook Tests
 *
 * Tests for the x402 payment-based image generation hook.
 * Verifies hook state management, error handling, and wallet integration.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useX402ImageGeneration } from "../hooks/useX402ImageGeneration";
import { useWalletClient, useAccount } from "wagmi";
import type { X402GenImgRequest } from "../types/x402";

describe("useX402ImageGeneration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with idle status when wallet not connected", () => {
      vi.mocked(useWalletClient).mockReturnValue({ data: undefined } as ReturnType<typeof useWalletClient>);
      vi.mocked(useAccount).mockReturnValue({
        isConnected: false,
        address: undefined,
      } as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useX402ImageGeneration());

      expect(result.current.status).toBe("idle");
      expect(result.current.error).toBeNull();
      expect(result.current.paymentReceipt).toBeNull();
      expect(result.current.isReady).toBe(false);
    });

    it("should be ready when wallet is connected", () => {
      const mockWalletClient = {
        account: { address: "0x1234567890123456789012345678901234567890" },
        signTypedData: vi.fn(),
      };

      vi.mocked(useWalletClient).mockReturnValue({ data: mockWalletClient } as ReturnType<typeof useWalletClient>);
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        address: "0x1234567890123456789012345678901234567890",
      } as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useX402ImageGeneration());

      expect(result.current.isReady).toBe(true);
      expect(result.current.status).toBe("idle");
    });
  });

  describe("Error Handling", () => {
    it("should throw error when generateImage called without wallet", async () => {
      vi.mocked(useWalletClient).mockReturnValue({ data: undefined } as ReturnType<typeof useWalletClient>);
      vi.mocked(useAccount).mockReturnValue({
        isConnected: false,
        address: undefined,
      } as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useX402ImageGeneration());

      const request: X402GenImgRequest = {
        prompt: "Test image",
      };

      await expect(result.current.generateImage(request)).rejects.toThrow("Wallet not connected");
    });
  });

  describe("Reset Functionality", () => {
    it("should reset state to initial values", () => {
      const mockWalletClient = {
        account: { address: "0x1234567890123456789012345678901234567890" },
        signTypedData: vi.fn(),
      };

      vi.mocked(useWalletClient).mockReturnValue({ data: mockWalletClient } as ReturnType<typeof useWalletClient>);
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        address: "0x1234567890123456789012345678901234567890",
      } as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useX402ImageGeneration());

      // Call reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe("idle");
      expect(result.current.error).toBeNull();
      expect(result.current.paymentReceipt).toBeNull();
    });
  });

  describe("Request Validation", () => {
    it("should accept valid request with prompt only", () => {
      const request: X402GenImgRequest = {
        prompt: "A beautiful sunset over mountains",
      };

      expect(request.prompt).toBeDefined();
      expect(request.size).toBeUndefined();
      expect(request.mode).toBeUndefined();
    });

    it("should accept request with all optional parameters", () => {
      const request: X402GenImgRequest = {
        prompt: "Edit this image",
        size: "1792x1024",
        mode: "edit",
        referenceImage: "base64encodedimage",
        network: "eip155:11155420",
        expectedChainId: 11155420,
        isListed: true,
      };

      expect(request.prompt).toBe("Edit this image");
      expect(request.size).toBe("1792x1024");
      expect(request.mode).toBe("edit");
      expect(request.referenceImage).toBeDefined();
      expect(request.network).toBe("eip155:11155420");
      expect(request.expectedChainId).toBe(11155420);
      expect(request.isListed).toBe(true);
    });

    it("should have isListed default to undefined when not specified", () => {
      const request: X402GenImgRequest = {
        prompt: "Test image",
        network: "eip155:10",
      };

      expect(request.isListed).toBeUndefined();
    });
  });

  describe("Request Body Transformation", () => {
    it("should keep network in requestBody but remove expectedChainId", () => {
      // This test verifies the transformation logic:
      // const { expectedChainId, ...requestBody } = request;
      // network must stay in requestBody, expectedChainId must be removed

      const request: X402GenImgRequest = {
        prompt: "Test image",
        network: "eip155:8453",
        expectedChainId: 8453,
        size: "1024x1024",
      };

      // Simulate the transformation from the hook
      const { expectedChainId, ...requestBody } = request;

      // network MUST be in requestBody (sent to server)
      expect(requestBody.network).toBe("eip155:8453");
      expect(requestBody.prompt).toBe("Test image");
      expect(requestBody.size).toBe("1024x1024");

      // expectedChainId MUST NOT be in requestBody (client-side only)
      expect("expectedChainId" in requestBody).toBe(false);
      expect(expectedChainId).toBe(8453); // still available for validation
    });

    it("should work with Base network", () => {
      const request: X402GenImgRequest = {
        prompt: "A dog on Base",
        network: "eip155:8453",
        expectedChainId: 8453,
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { expectedChainId, ...requestBody } = request;

      expect(requestBody.network).toBe("eip155:8453");
      expect(JSON.stringify(requestBody)).toContain("eip155:8453");
      expect(JSON.stringify(requestBody)).not.toContain("expectedChainId");
    });

    it("should work with Optimism network", () => {
      const request: X402GenImgRequest = {
        prompt: "A dog on Optimism",
        network: "eip155:10",
        expectedChainId: 10,
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { expectedChainId, ...requestBody } = request;

      expect(requestBody.network).toBe("eip155:10");
      expect(JSON.stringify(requestBody)).toContain("eip155:10");
    });
  });
});
