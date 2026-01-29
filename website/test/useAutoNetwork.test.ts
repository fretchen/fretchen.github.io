import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock wagmi hooks
const mockSwitchChainAsync = vi.fn();
vi.mock("wagmi", () => ({
  useChainId: vi.fn(() => 10), // Default: Optimism mainnet
  useAccount: vi.fn(() => ({ isConnected: true })),
  useSwitchChain: vi.fn(() => ({ switchChainAsync: mockSwitchChainAsync })),
}));

// Mock chain-utils
vi.mock("@fretchen/chain-utils", () => ({
  toCAIP2: (chainId: number) => `eip155:${chainId}`,
  fromCAIP2: (network: string) => parseInt(network.split(":")[1]),
}));

import { useAutoNetwork } from "../hooks/useAutoNetwork";
import { useChainId, useAccount } from "wagmi";

describe("useAutoNetwork Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSwitchChainAsync.mockResolvedValue(undefined);
  });

  describe("return value structure", () => {
    it("should return network, isOnCorrectNetwork, and switchIfNeeded", () => {
      const supportedNetworks = ["eip155:10", "eip155:11155420"];
      const { result } = renderHook(() => useAutoNetwork(supportedNetworks));

      expect(result.current).toHaveProperty("network");
      expect(result.current).toHaveProperty("isOnCorrectNetwork");
      expect(result.current).toHaveProperty("switchIfNeeded");
      expect(typeof result.current.switchIfNeeded).toBe("function");
    });
  });

  describe("when on a supported network", () => {
    it("should return the current network as CAIP-2", () => {
      vi.mocked(useChainId).mockReturnValue(10); // Optimism
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10", "eip155:11155420"];
      const { result } = renderHook(() => useAutoNetwork(supportedNetworks));

      expect(result.current.network).toBe("eip155:10");
      expect(result.current.isOnCorrectNetwork).toBe(true);
    });

    it("should return testnet network when on testnet", () => {
      vi.mocked(useChainId).mockReturnValue(11155420); // Optimism Sepolia
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10", "eip155:11155420"];
      const { result } = renderHook(() => useAutoNetwork(supportedNetworks));

      expect(result.current.network).toBe("eip155:11155420");
      expect(result.current.isOnCorrectNetwork).toBe(true);
    });

    it("should NOT auto-switch - no popups on connect", () => {
      vi.mocked(useChainId).mockReturnValue(10);
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10", "eip155:11155420"];
      renderHook(() => useAutoNetwork(supportedNetworks));

      // Key change: NO auto-switch on connect
      expect(mockSwitchChainAsync).not.toHaveBeenCalled();
    });
  });

  describe("when on an unsupported network", () => {
    it("should NOT auto-switch - deferred to interaction", () => {
      vi.mocked(useChainId).mockReturnValue(1); // Ethereum mainnet (unsupported)
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10", "eip155:11155420"];
      renderHook(() => useAutoNetwork(supportedNetworks));

      // Key change: NO auto-switch
      expect(mockSwitchChainAsync).not.toHaveBeenCalled();
    });

    it("should return default network and isOnCorrectNetwork=false", () => {
      vi.mocked(useChainId).mockReturnValue(1); // Unsupported
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10", "eip155:11155420"];
      const { result } = renderHook(() => useAutoNetwork(supportedNetworks));

      expect(result.current.network).toBe("eip155:10"); // Default
      expect(result.current.isOnCorrectNetwork).toBe(false);
    });
  });

  describe("switchIfNeeded() function", () => {
    it("should return true immediately when already on correct network", async () => {
      vi.mocked(useChainId).mockReturnValue(10); // Supported
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10"];
      const { result } = renderHook(() => useAutoNetwork(supportedNetworks));

      let switched: boolean = false;
      await act(async () => {
        switched = await result.current.switchIfNeeded();
      });

      expect(switched).toBe(true);
      expect(mockSwitchChainAsync).not.toHaveBeenCalled();
    });

    it("should switch chain when on unsupported network", async () => {
      vi.mocked(useChainId).mockReturnValue(1); // Unsupported
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10"];
      const { result } = renderHook(() => useAutoNetwork(supportedNetworks));

      let switched: boolean = false;
      await act(async () => {
        switched = await result.current.switchIfNeeded();
      });

      expect(switched).toBe(true);
      expect(mockSwitchChainAsync).toHaveBeenCalledWith({ chainId: 10 });
    });

    it("should return false when user rejects switch", async () => {
      vi.mocked(useChainId).mockReturnValue(1); // Unsupported
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);
      mockSwitchChainAsync.mockRejectedValue(new Error("User rejected"));

      const supportedNetworks = ["eip155:10"];
      const { result } = renderHook(() => useAutoNetwork(supportedNetworks));

      let switched: boolean = true;
      await act(async () => {
        switched = await result.current.switchIfNeeded();
      });

      expect(switched).toBe(false);
    });

    it("should return true when not connected (nothing to switch)", async () => {
      vi.mocked(useChainId).mockReturnValue(1);
      vi.mocked(useAccount).mockReturnValue({ isConnected: false } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10"];
      const { result } = renderHook(() => useAutoNetwork(supportedNetworks));

      let switched: boolean = false;
      await act(async () => {
        switched = await result.current.switchIfNeeded();
      });

      expect(switched).toBe(true);
      expect(mockSwitchChainAsync).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle single network in list", () => {
      vi.mocked(useChainId).mockReturnValue(10);
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10"];
      const { result } = renderHook(() => useAutoNetwork(supportedNetworks));

      expect(result.current.network).toBe("eip155:10");
      expect(result.current.isOnCorrectNetwork).toBe(true);
    });

    it("should handle Base network", () => {
      vi.mocked(useChainId).mockReturnValue(8453); // Base mainnet
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10", "eip155:8453"];
      const { result } = renderHook(() => useAutoNetwork(supportedNetworks));

      expect(result.current.network).toBe("eip155:8453");
      expect(result.current.isOnCorrectNetwork).toBe(true);
    });

    it("should use first network as default when on unsupported", () => {
      vi.mocked(useChainId).mockReturnValue(137); // Polygon (unsupported)
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:11155420", "eip155:10"];
      const { result } = renderHook(() => useAutoNetwork(supportedNetworks));

      // First network is testnet - that's the default
      expect(result.current.network).toBe("eip155:11155420");
    });
  });
});
