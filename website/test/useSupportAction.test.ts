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

// Mock wagmi/chains - needed for aggregated reads
vi.mock("wagmi/chains", () => ({
  optimism: { id: 10, name: "OP Mainnet" },
  optimismSepolia: { id: 11155420, name: "OP Sepolia" },
  base: { id: 8453, name: "Base" },
  baseSepolia: { id: 84532, name: "Base Sepolia" },
}));

// Mock the getChain module - simulates mainnet mode (VITE_USE_TESTNET not set)
vi.mock("../utils/getChain", async () => {
  const optimism = { id: 10, name: "OP Mainnet" };
  const base = { id: 8453, name: "Base" };

  return {
    DEFAULT_SUPPORT_CHAIN: optimism,
    SUPPORT_RECIPIENT_ADDRESS: "0x073f26F0C3FC100e7b075C3DC3cDE0A777497D20",
    SUPPORT_V2_CHAINS: [optimism, base],
    getSupportV2Config: vi.fn((chainId: number) => {
      const addresses: Record<number, string> = {
        [optimism.id]: "0x4ca63f8A4Cd56287E854f53E18ca482D74391316",
        [base.id]: "0xB70EA4d714Fed01ce20E93F9033008BadA1c8694",
      };
      const address = addresses[chainId];
      if (!address) return null;
      return { address, abi: [] };
    }),
    isSupportV2Chain: vi.fn((chainId: number) => {
      return chainId === optimism.id || chainId === base.id;
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

    // Default mock implementations - use Optimism Mainnet (10)
    vi.mocked(useAccount).mockReturnValue({
      isConnected: true,
      chainId: 10, // Optimism Mainnet
      address: "0x1234567890abcdef1234567890abcdef12345678",
      connector: { name: "MetaMask" },
    } as ReturnType<typeof useAccount>);

    vi.mocked(useChainId).mockReturnValue(10);

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

    // Mock useReadContract - called twice (Optimism + Base)
    // Each call returns data for its respective chain
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
    it("should initialize hook when on Optimism Mainnet", () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 10, // Optimism Mainnet
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      // Hook should initialize without errors
      expect(result.current.isConnected).toBe(true);
      expect(result.current.errorMessage).toBeNull();
    });

    it("should initialize hook when on Base Mainnet", () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 8453, // Base Mainnet
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      expect(result.current.isConnected).toBe(true);
      expect(result.current.errorMessage).toBeNull();
    });

    it("should initialize hook when on unsupported chain", () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 1, // Ethereum mainnet - not supported
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      // Hook should still initialize, chain check happens on handleSupport
      expect(result.current.isConnected).toBe(true);
    });

    it("should read from BOTH chains for aggregated count", () => {
      renderHook(() => useSupportAction("/blog/test"));

      // useReadContract is called twice - once for Optimism, once for Base
      expect(useReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: 10, // Optimism
        })
      );
      expect(useReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: 8453, // Base
        })
      );
    });
  });

  describe("Contract Config", () => {
    it("should get correct contract config for Optimism Mainnet", () => {
      const config = getSupportV2Config(10);
      expect(config).not.toBeNull();
      expect(config?.address).toBe("0x4ca63f8A4Cd56287E854f53E18ca482D74391316");
    });

    it("should get correct contract config for Base Mainnet", () => {
      const config = getSupportV2Config(8453);
      expect(config).not.toBeNull();
      expect(config?.address).toBe("0xB70EA4d714Fed01ce20E93F9033008BadA1c8694");
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
        chainId: 10, // Optimism Mainnet
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      await act(async () => {
        await result.current.handleSupport();
      });

      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "0x4ca63f8A4Cd56287E854f53E18ca482D74391316", // Optimism Mainnet
          functionName: "donate",
          args: [expect.stringContaining("/blog/test"), SUPPORT_RECIPIENT_ADDRESS],
        })
      );
    });

    it("should use Base Mainnet contract when on Base Mainnet", async () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 8453, // Base Mainnet
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      await act(async () => {
        await result.current.handleSupport();
      });

      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "0xB70EA4d714Fed01ce20E93F9033008BadA1c8694", // Base Mainnet
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
        chainId: 8453, // Base Mainnet (supported)
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

  describe("Support Count (Aggregated from Mainnets)", () => {
    it("should aggregate support counts from both Optimism and Base", () => {
      // Mock returns BigInt(5) for each call, so aggregated should be 10
      vi.mocked(useReadContract).mockReturnValue({
        data: BigInt(5),
        error: null,
        isPending: false,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useReadContract>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      // 5 from Optimism + 5 from Base = 10
      expect(result.current.supportCount).toBe("10");
    });

    it("should return '0' when no data from either chain", () => {
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
