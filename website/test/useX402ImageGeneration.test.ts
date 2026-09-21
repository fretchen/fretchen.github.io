/**
 * useX402ImageGeneration Hook Tests
 *
 * Tests for the x402 payment-based image generation hook.
 * Verifies hook state management, error handling, and wallet integration.
 *
 * Most tests below route around the dynamic `@x402/*` imports entirely (no wallet, or
 * asserting synchronously without awaiting generateImage()). The "Spend controls" describe
 * block is the exception: it mocks `@x402/fetch` and `@x402/evm/exact/client` (mirroring
 * `useX402Chat.test.ts`'s pattern) so generateImage()'s real client-setup code runs.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useX402ImageGeneration } from "../hooks/useX402ImageGeneration";
import { buildUsdcAllowedAssets } from "../hooks/x402SpendControls";
import { useWalletClient, useAccount } from "wagmi";
import type { X402GenImgRequest } from "../types/x402";
import { buildAccountData, buildWalletClientData } from "./setup";

const mockSetSpendControls = vi.fn();
const mockRegisterExactEvmScheme = vi.fn();
const mockGetPaymentSettleResponse = vi.fn();

vi.mock("@x402/fetch", () => ({
  // vi.fn() needs a real `function`, not an arrow, to remain usable via `new`.
  x402Client: vi.fn(function MockX402Client() {
    return { setSpendControls: mockSetSpendControls };
  }),
  // Pass the caller's fetch straight through — drives the real validatingFetch → global
  // fetch path from the hook without a real SDK.
  wrapFetchWithPayment: vi.fn((fetchFn: typeof fetch) => fetchFn),
  x402HTTPClient: vi.fn(function MockX402HTTPClient() {
    return { getPaymentSettleResponse: mockGetPaymentSettleResponse };
  }),
}));

vi.mock("@x402/evm/exact/client", () => ({
  registerExactEvmScheme: (...args: unknown[]) => mockRegisterExactEvmScheme(...args),
}));

/** A minimal valid images/v1 envelope — what genimg_x402_token.ts actually returns. */
function envelopeResponse(nft: Record<string, unknown> = { status: "minted", token_id: 42 }) {
  return new Response(
    JSON.stringify({
      created: 1757260000,
      data: [{ url: "https://example.com/img.jpg", revised_prompt: null }],
      model: "flux-kontext-pro",
      x_nft: nft,
    }),
    { status: 200 },
  );
}

function connectWallet() {
  const mockWalletClient = {
    account: { address: "0x1234567890123456789012345678901234567890" as `0x${string}` },
    signTypedData: vi.fn(),
  };
  vi.mocked(useWalletClient).mockReturnValue(buildWalletClientData({ data: mockWalletClient }));
  vi.mocked(useAccount).mockReturnValue(
    buildAccountData({ isConnected: true, address: mockWalletClient.account.address }),
  );
  return mockWalletClient;
}

describe("useX402ImageGeneration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with idle status when wallet not connected", () => {
      vi.mocked(useWalletClient).mockReturnValue(buildWalletClientData());
      vi.mocked(useAccount).mockReturnValue(buildAccountData({ isConnected: false, address: undefined }));

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

      vi.mocked(useWalletClient).mockReturnValue(buildWalletClientData({ data: mockWalletClient }));
      vi.mocked(useAccount).mockReturnValue(
        buildAccountData({ isConnected: true, address: "0x1234567890123456789012345678901234567890" }),
      );

      const { result } = renderHook(() => useX402ImageGeneration());

      expect(result.current.isReady).toBe(true);
      expect(result.current.status).toBe("idle");
    });
  });

  describe("Error Handling", () => {
    it("should throw error when generateImage called without wallet", async () => {
      vi.mocked(useWalletClient).mockReturnValue(buildWalletClientData());
      vi.mocked(useAccount).mockReturnValue(buildAccountData({ isConnected: false, address: undefined }));

      const { result } = renderHook(() => useX402ImageGeneration());

      const request: X402GenImgRequest = {
        prompt: "Test image",
        network: "eip155:10",
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

      vi.mocked(useWalletClient).mockReturnValue(buildWalletClientData({ data: mockWalletClient }));
      vi.mocked(useAccount).mockReturnValue(
        buildAccountData({ isConnected: true, address: "0x1234567890123456789012345678901234567890" }),
      );

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
        network: "eip155:10",
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

  // Regression guard for the production incident where an unconfigured x402Client's
  // default spend controls rejected Optimism USDC (see x402SpendControls.ts).
  describe("Spend controls", () => {
    it("allowlists USDC on every site network via setSpendControls before registering the scheme", async () => {
      const mockWalletClient = {
        account: { address: "0x1234567890123456789012345678901234567890" as `0x${string}` },
        signTypedData: vi.fn(),
      };
      vi.mocked(useWalletClient).mockReturnValue(buildWalletClientData({ data: mockWalletClient }));
      vi.mocked(useAccount).mockReturnValue(
        buildAccountData({ isConnected: true, address: mockWalletClient.account.address }),
      );
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(envelopeResponse()));

      const { result } = renderHook(() => useX402ImageGeneration());
      await act(async () => {
        await result.current.generateImage({ prompt: "A dog on Optimism", network: "eip155:10" });
      });

      expect(mockSetSpendControls).toHaveBeenCalledWith({ allowedAssets: buildUsdcAllowedAssets() });
      expect(mockSetSpendControls.mock.invocationCallOrder[0]).toBeLessThan(
        mockRegisterExactEvmScheme.mock.invocationCallOrder[0],
      );
    });
  });

  describe("Response envelope", () => {
    // wrapFetchWithPayment is mocked to pass the caller's fetch straight through, so these drive
    // the hook's real validatingFetch -> global.fetch -> normalizeImageResponse path.
    it("resolves to the normalized result, not the raw envelope", async () => {
      connectWallet();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(envelopeResponse()));

      const { result } = renderHook(() => useX402ImageGeneration());

      let generated: Awaited<ReturnType<typeof result.current.generateImage>> | undefined;
      await act(async () => {
        generated = await result.current.generateImage({ prompt: "A dog", network: "eip155:10" });
      });

      expect(generated?.imageUrl).toBe("https://example.com/img.jpg");
      expect(generated?.tokenId).toBe(42n);
      expect(result.current.status).toBe("success");
    });

    it("surfaces a mint failure without a token id, and still returns the image", async () => {
      connectWallet();
      mockGetPaymentSettleResponse.mockReturnValue(null);
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(envelopeResponse({ status: "mint_failed", reason: "no mint event" })),
      );

      const { result } = renderHook(() => useX402ImageGeneration());

      let generated: Awaited<ReturnType<typeof result.current.generateImage>> | undefined;
      await act(async () => {
        generated = await result.current.generateImage({ prompt: "A dog", network: "eip155:10" });
      });

      expect(generated?.imageUrl).toBe("https://example.com/img.jpg");
      expect(generated?.tokenId).toBeUndefined();
      expect(generated?.mintFailedReason).toBe("no mint event");
      // A mint failure is not a request failure — the caller got what it asked for.
      expect(result.current.status).toBe("success");
      // Nothing settled, so there is no receipt to show.
      expect(result.current.paymentReceipt).toBeNull();
    });

    it("rejects a response that does not match the contract", async () => {
      connectWallet();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ nope: true }), { status: 200 })));

      const { result } = renderHook(() => useX402ImageGeneration());

      await act(async () => {
        await expect(result.current.generateImage({ prompt: "A dog", network: "eip155:10" })).rejects.toThrow(
          /images\/v1/,
        );
      });

      expect(result.current.status).toBe("error");
    });
  });
});
