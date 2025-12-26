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
      vi.mocked(useWalletClient).mockReturnValue({ data: undefined } as any);
      vi.mocked(useAccount).mockReturnValue({
        isConnected: false,
        address: undefined,
      } as any);

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

      vi.mocked(useWalletClient).mockReturnValue({ data: mockWalletClient } as any);
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        address: "0x1234567890123456789012345678901234567890",
      } as any);

      const { result } = renderHook(() => useX402ImageGeneration());

      expect(result.current.isReady).toBe(true);
      expect(result.current.status).toBe("idle");
    });
  });

  describe("Error Handling", () => {
    it("should throw error when generateImage called without wallet", async () => {
      vi.mocked(useWalletClient).mockReturnValue({ data: undefined } as any);
      vi.mocked(useAccount).mockReturnValue({
        isConnected: false,
        address: undefined,
      } as any);

      const { result } = renderHook(() => useX402ImageGeneration());

      const request: X402GenImgRequest = {
        prompt: "Test image",
      };

      await expect(result.current.generateImage(request)).rejects.toThrow(
        "Wallet not connected"
      );
    });
  });

  describe("Reset Functionality", () => {
    it("should reset state to initial values", () => {
      const mockWalletClient = {
        account: { address: "0x1234567890123456789012345678901234567890" },
        signTypedData: vi.fn(),
      };

      vi.mocked(useWalletClient).mockReturnValue({ data: mockWalletClient } as any);
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        address: "0x1234567890123456789012345678901234567890",
      } as any);

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
        sepoliaTest: true,
        expectedChainId: 11155420,
        isListed: true,
      };

      expect(request.prompt).toBe("Edit this image");
      expect(request.size).toBe("1792x1024");
      expect(request.mode).toBe("edit");
      expect(request.referenceImage).toBeDefined();
      expect(request.sepoliaTest).toBe(true);
      expect(request.expectedChainId).toBe(11155420);
      expect(request.isListed).toBe(true);
    });

    it("should have isListed default to undefined when not specified", () => {
      const request: X402GenImgRequest = {
        prompt: "Test image",
      };

      expect(request.isListed).toBeUndefined();
    });
  });
});
