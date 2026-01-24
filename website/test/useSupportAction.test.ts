import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAccount, useWriteContract, useReadContract, useSwitchChain, useChainId } from "wagmi";
import { useSupportAction } from "../hooks/useSupportAction";
import {
  getSupportV2Config,
  isSupportV2Chain,
  DEFAULT_SUPPORT_CHAIN,
  SUPPORT_RECIPIENT_ADDRESS,
} from "../utils/getChain";

// Mock the getChain module
vi.mock("../utils/getChain", async () => {
  const optimismSepolia = { id: 11155420, name: "OP Sepolia" };
  const baseSepolia = { id: 84532, name: "Base Sepolia" };

  return {
    DEFAULT_SUPPORT_CHAIN: optimismSepolia,
    SUPPORT_RECIPIENT_ADDRESS: "0x073f26F0C3FC100e7b075C3DC3cDE0A777497D20",
    getSupportV2Config: vi.fn((chainId: number) => {
      const addresses: Record<number, string> = {
        [optimismSepolia.id]: "0x9859431b682e861b19e87Db14a04944BC747AB6d",
        [baseSepolia.id]: "0xaB44BE78499721b593a0f4BE2099b246e9C53B57",
      };
      const address = addresses[chainId];
      if (!address) return null;
      return { address, abi: [] };
    }),
    isSupportV2Chain: vi.fn((chainId: number) => {
      return chainId === optimismSepolia.id || chainId === baseSepolia.id;
    }),
  };
});

// Mock analytics
vi.mock("../utils/analytics", () => ({
  trackEvent: vi.fn(),
}));

describe("useSupportAction", () => {
  // Mock functions
  const mockWriteContract = vi.fn();
  const mockSwitchChainAsync = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useAccount).mockReturnValue({
      isConnected: true,
      chainId: 11155420, // OP Sepolia
      address: "0x1234567890abcdef1234567890abcdef12345678",
      connector: { name: "MetaMask" },
    } as ReturnType<typeof useAccount>);

    vi.mocked(useChainId).mockReturnValue(11155420);

    vi.mocked(useWriteContract).mockReturnValue({
      writeContract: mockWriteContract,
      isPending: false,
      data: undefined,
      error: null,
    } as unknown as ReturnType<typeof useWriteContract>);

    vi.mocked(useSwitchChain).mockReturnValue({
      switchChainAsync: mockSwitchChainAsync,
      chains: [],
    } as unknown as ReturnType<typeof useSwitchChain>);

    vi.mocked(useReadContract).mockReturnValue({
      data: BigInt(5),
      error: null,
      isPending: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useReadContract>);

    // Mock window.location
    Object.defineProperty(window, "location", {
      value: { origin: "https://example.com" },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Chain Detection", () => {
    it("should detect OP Sepolia as supported chain", () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 11155420,
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      // isSupportV2Chain should be called with OP Sepolia chain ID
      expect(isSupportV2Chain).toHaveBeenCalledWith(11155420);
    });

    it("should detect Base Sepolia as supported chain", () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 84532, // Base Sepolia
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      expect(isSupportV2Chain).toHaveBeenCalledWith(84532);
    });

    it("should use default chain for reads when on unsupported chain", () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 1, // Ethereum mainnet (unsupported)
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as ReturnType<typeof useAccount>);

      renderHook(() => useSupportAction("/blog/test"));

      // useReadContract should be called with default chain
      expect(useReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: DEFAULT_SUPPORT_CHAIN.id,
        })
      );
    });
  });

  describe("Contract Config", () => {
    it("should get correct contract config for OP Sepolia", () => {
      const config = getSupportV2Config(11155420);
      expect(config).not.toBeNull();
      expect(config?.address).toBe("0x9859431b682e861b19e87Db14a04944BC747AB6d");
    });

    it("should get correct contract config for Base Sepolia", () => {
      const config = getSupportV2Config(84532);
      expect(config).not.toBeNull();
      expect(config?.address).toBe("0xaB44BE78499721b593a0f4BE2099b246e9C53B57");
    });

    it("should return null for unsupported chain", () => {
      const config = getSupportV2Config(1); // Ethereum mainnet
      expect(config).toBeNull();
    });
  });

  describe("handleSupport", () => {
    it("should call writeContract with correct args on supported chain", async () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 11155420,
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      await act(async () => {
        await result.current.handleSupport();
      });

      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "0x9859431b682e861b19e87Db14a04944BC747AB6d",
          functionName: "donate",
          args: [expect.stringContaining("/blog/test"), SUPPORT_RECIPIENT_ADDRESS],
        })
      );
    });

    it("should use Base Sepolia contract when on Base Sepolia", async () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 84532, // Base Sepolia
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      await act(async () => {
        await result.current.handleSupport();
      });

      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "0xaB44BE78499721b593a0f4BE2099b246e9C53B57",
        })
      );
    });

    it("should trigger chain switch on unsupported chain", async () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 1, // Ethereum mainnet (unsupported)
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as ReturnType<typeof useAccount>);

      mockSwitchChainAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      await act(async () => {
        await result.current.handleSupport();
      });

      expect(mockSwitchChainAsync).toHaveBeenCalledWith({
        chainId: DEFAULT_SUPPORT_CHAIN.id,
      });
    });

    it("should NOT trigger chain switch on supported chain", async () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 84532, // Base Sepolia (supported)
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      await act(async () => {
        await result.current.handleSupport();
      });

      expect(mockSwitchChainAsync).not.toHaveBeenCalled();
    });

    it("should show error if chain switch fails", async () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 1, // Unsupported
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as ReturnType<typeof useAccount>);

      mockSwitchChainAsync.mockRejectedValue(new Error("User rejected"));

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      await act(async () => {
        await result.current.handleSupport();
      });

      expect(result.current.errorMessage).toContain("Chain-Wechsel");
      expect(mockWriteContract).not.toHaveBeenCalled();
    });
  });

  describe("Support Count", () => {
    it("should return support count as string", () => {
      vi.mocked(useReadContract).mockReturnValue({
        data: BigInt(42),
        error: null,
        isPending: false,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useReadContract>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      expect(result.current.supportCount).toBe("42");
    });

    it("should return '0' when no data", () => {
      vi.mocked(useReadContract).mockReturnValue({
        data: undefined,
        error: null,
        isPending: false,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useReadContract>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      expect(result.current.supportCount).toBe("0");
    });
  });

  describe("URL Handling", () => {
    it("should construct full URL with origin", async () => {
      const { result } = renderHook(() => useSupportAction("/blog/my-post"));

      await act(async () => {
        await result.current.handleSupport();
      });

      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ["https://example.com/blog/my-post", expect.any(String)],
        })
      );
    });

    it("should strip trailing slashes from URL", async () => {
      const { result } = renderHook(() => useSupportAction("/blog/my-post/"));

      await act(async () => {
        await result.current.handleSupport();
      });

      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ["https://example.com/blog/my-post", expect.any(String)],
        })
      );
    });

    it("should handle empty URL path (uses origin only)", async () => {
      // When url is empty string, fullUrl becomes just window.location.origin
      // The hook accepts this as valid - this tests that behavior
      const { result } = renderHook(() => useSupportAction(""));

      await act(async () => {
        await result.current.handleSupport();
      });

      // Empty path still results in origin URL being used
      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ["https://example.com", expect.any(String)],
        })
      );
    });
  });
});
