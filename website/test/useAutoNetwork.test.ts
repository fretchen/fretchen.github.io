import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock wagmi hooks
const mockSwitchChain = vi.fn();
vi.mock("wagmi", () => ({
  useChainId: vi.fn(() => 10), // Default: Optimism mainnet
  useAccount: vi.fn(() => ({ isConnected: true })),
  useSwitchChain: vi.fn(() => ({ switchChain: mockSwitchChain })),
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
  });

  describe("when on a supported network", () => {
    it("should return the current network as CAIP-2", () => {
      vi.mocked(useChainId).mockReturnValue(10); // Optimism
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10", "eip155:11155420"];
      const { result } = renderHook(() => useAutoNetwork(supportedNetworks));

      expect(result.current).toBe("eip155:10");
      expect(mockSwitchChain).not.toHaveBeenCalled();
    });

    it("should return testnet network when on testnet", () => {
      vi.mocked(useChainId).mockReturnValue(11155420); // Optimism Sepolia
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10", "eip155:11155420"];
      const { result } = renderHook(() => useAutoNetwork(supportedNetworks));

      expect(result.current).toBe("eip155:11155420");
      expect(mockSwitchChain).not.toHaveBeenCalled();
    });
  });

  describe("when on an unsupported network", () => {
    it("should switch to default network when connected", () => {
      vi.mocked(useChainId).mockReturnValue(1); // Ethereum mainnet (unsupported)
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10", "eip155:11155420"];
      renderHook(() => useAutoNetwork(supportedNetworks));

      expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: 10 });
    });

    it("should return default network while switching", () => {
      vi.mocked(useChainId).mockReturnValue(1); // Ethereum mainnet (unsupported)
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10", "eip155:11155420"];
      const { result } = renderHook(() => useAutoNetwork(supportedNetworks));

      // Returns default even though switch is pending
      expect(result.current).toBe("eip155:10");
    });

    it("should switch to first network in list as default", () => {
      vi.mocked(useChainId).mockReturnValue(137); // Polygon (unsupported)
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      // First network is testnet
      const supportedNetworks = ["eip155:11155420", "eip155:10"];
      renderHook(() => useAutoNetwork(supportedNetworks));

      expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: 11155420 });
    });
  });

  describe("when wallet is not connected", () => {
    it("should not attempt to switch chain", () => {
      vi.mocked(useChainId).mockReturnValue(1); // Unsupported chain
      vi.mocked(useAccount).mockReturnValue({ isConnected: false } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10", "eip155:11155420"];
      renderHook(() => useAutoNetwork(supportedNetworks));

      expect(mockSwitchChain).not.toHaveBeenCalled();
    });

    it("should return default network", () => {
      vi.mocked(useChainId).mockReturnValue(1); // Unsupported chain
      vi.mocked(useAccount).mockReturnValue({ isConnected: false } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10", "eip155:11155420"];
      const { result } = renderHook(() => useAutoNetwork(supportedNetworks));

      expect(result.current).toBe("eip155:10");
    });
  });

  describe("chain switching behavior", () => {
    it("should only switch once per render cycle", () => {
      vi.mocked(useChainId).mockReturnValue(1);
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10"];
      const { rerender } = renderHook(() => useAutoNetwork(supportedNetworks));

      // Initial switch
      expect(mockSwitchChain).toHaveBeenCalledTimes(1);

      // Re-render with same props should not trigger another switch
      rerender();
      expect(mockSwitchChain).toHaveBeenCalledTimes(1);
    });

    it("should switch when user connects wallet on unsupported chain", () => {
      vi.mocked(useChainId).mockReturnValue(1);
      vi.mocked(useAccount).mockReturnValue({ isConnected: false } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10"];
      const { rerender } = renderHook(() => useAutoNetwork(supportedNetworks));

      expect(mockSwitchChain).not.toHaveBeenCalled();

      // User connects wallet
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);
      rerender();

      expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: 10 });
    });
  });

  describe("edge cases", () => {
    it("should handle single network in list", () => {
      vi.mocked(useChainId).mockReturnValue(10);
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10"];
      const { result } = renderHook(() => useAutoNetwork(supportedNetworks));

      expect(result.current).toBe("eip155:10");
    });

    it("should handle Base network", () => {
      vi.mocked(useChainId).mockReturnValue(8453); // Base mainnet
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const supportedNetworks = ["eip155:10", "eip155:8453"];
      const { result } = renderHook(() => useAutoNetwork(supportedNetworks));

      expect(result.current).toBe("eip155:8453");
      expect(mockSwitchChain).not.toHaveBeenCalled();
    });
  });
});
