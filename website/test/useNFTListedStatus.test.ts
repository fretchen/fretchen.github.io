/**
 * Tests for useNFTListedStatus hook
 *
 * This hook fetches the isListed status from the smart contract.
 * Tests verify the contract call logic and state management.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useNFTListedStatus } from "../hooks/useNFTListedStatus";

// Mock the readContract function from wagmi/actions
const mockReadContract = vi.fn();

vi.mock("wagmi/actions", () => ({
  readContract: (...args: unknown[]) => mockReadContract(...args),
}));

// Mock the wagmi config
vi.mock("../wagmi.config", () => ({
  config: { testConfig: true },
}));

// Mock chain-utils
vi.mock("@fretchen/chain-utils", () => ({
  getGenAiNFTAddress: vi.fn((network: string) => {
    if (network === "eip155:10") return "0xOptimismContract";
    if (network === "eip155:11155420") return "0xSepoliaContract";
    return "0xUnknownContract";
  }),
  GenImNFTv4ABI: [{ name: "isTokenListed", type: "function" }],
  fromCAIP2: vi.fn((network: string) => {
    if (network === "eip155:10") return 10;
    if (network === "eip155:11155420") return 11155420;
    return 1;
  }),
}));

describe("useNFTListedStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Contract Call Behavior", () => {
    it("should call isListed contract function when enabled", async () => {
      mockReadContract.mockResolvedValue(true);

      renderHook(() =>
        useNFTListedStatus({
          tokenId: BigInt(42),
          network: "eip155:10",
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(mockReadContract).toHaveBeenCalledWith(
          expect.anything(), // config
          expect.objectContaining({
            address: "0xOptimismContract",
            functionName: "isTokenListed",
            args: [BigInt(42)],
            chainId: 10,
          })
        );
      });
    });

    it("should NOT call isListed when enabled=false", async () => {
      renderHook(() =>
        useNFTListedStatus({
          tokenId: BigInt(42),
          network: "eip155:10",
          enabled: false,
        })
      );

      // Wait a tick to ensure no async calls are made
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockReadContract).not.toHaveBeenCalled();
    });

    it("should use correct contract address for different networks", async () => {
      mockReadContract.mockResolvedValue(false);

      // Test Optimism
      const { unmount: unmount1 } = renderHook(() =>
        useNFTListedStatus({
          tokenId: BigInt(1),
          network: "eip155:10",
        })
      );

      await waitFor(() => {
        expect(mockReadContract).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            address: "0xOptimismContract",
            chainId: 10,
          })
        );
      });

      unmount1();
      vi.clearAllMocks();

      // Test Sepolia
      renderHook(() =>
        useNFTListedStatus({
          tokenId: BigInt(1),
          network: "eip155:11155420",
        })
      );

      await waitFor(() => {
        expect(mockReadContract).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            address: "0xSepoliaContract",
            chainId: 11155420,
          })
        );
      });
    });
  });

  describe("Return Values", () => {
    it("should return isListed=true when contract returns true", async () => {
      mockReadContract.mockResolvedValue(true);

      const { result } = renderHook(() =>
        useNFTListedStatus({
          tokenId: BigInt(42),
          network: "eip155:10",
        })
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isListed).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isListed).toBe(true);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeUndefined();
      });
    });

    it("should return isListed=false when contract returns false", async () => {
      mockReadContract.mockResolvedValue(false);

      const { result } = renderHook(() =>
        useNFTListedStatus({
          tokenId: BigInt(42),
          network: "eip155:10",
        })
      );

      await waitFor(() => {
        expect(result.current.isListed).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should return error when contract call fails", async () => {
      mockReadContract.mockRejectedValue(new Error("Contract call failed"));

      const { result } = renderHook(() =>
        useNFTListedStatus({
          tokenId: BigInt(42),
          network: "eip155:10",
        })
      );

      await waitFor(() => {
        expect(result.current.error).toBe("Contract call failed");
        expect(result.current.isListed).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle legacy tokens (contract reverts) gracefully without console.error", async () => {
      // Simulate a contract revert error (legacy token without isListed support)
      const revertError = new Error("The contract function \"isListed\" reverted.");
      revertError.name = "ContractFunctionExecutionError";
      mockReadContract.mockRejectedValue(revertError);

      // Spy on console.error to verify it's NOT called for reverts
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useNFTListedStatus({
          tokenId: BigInt(2), // Legacy token ID
          network: "eip155:10",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should set specific error message for legacy tokens
      expect(result.current.error).toBe("isListed not available for this token");
      // isListed should remain undefined (not an error state, just not supported)
      expect(result.current.isListed).toBeUndefined();
      // Should NOT log to console.error for expected contract reverts
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should return undefined isListed when disabled", async () => {
      const { result } = renderHook(() =>
        useNFTListedStatus({
          tokenId: BigInt(42),
          network: "eip155:10",
          enabled: false,
        })
      );

      // Should immediately be undefined, not loading
      expect(result.current.isListed).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Optimistic Updates", () => {
    it("should allow optimistic update via setOptimisticListed", async () => {
      mockReadContract.mockResolvedValue(false);

      const { result } = renderHook(() =>
        useNFTListedStatus({
          tokenId: BigInt(42),
          network: "eip155:10",
        })
      );

      await waitFor(() => {
        expect(result.current.isListed).toBe(false);
      });

      // Optimistically set to true (simulating user toggle)
      act(() => {
        result.current.setOptimisticListed(true);
      });

      expect(result.current.isListed).toBe(true);
    });
  });

  describe("Refetch", () => {
    it("should refetch when refetch() is called", async () => {
      mockReadContract.mockResolvedValue(false);

      const { result } = renderHook(() =>
        useNFTListedStatus({
          tokenId: BigInt(42),
          network: "eip155:10",
        })
      );

      await waitFor(() => {
        expect(result.current.isListed).toBe(false);
      });

      expect(mockReadContract).toHaveBeenCalledTimes(1);

      // Change the mock return value
      mockReadContract.mockResolvedValue(true);

      // Refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(mockReadContract).toHaveBeenCalledTimes(2);
      expect(result.current.isListed).toBe(true);
    });
  });

  describe("Dependency Changes", () => {
    it("should refetch when tokenId changes", async () => {
      mockReadContract.mockResolvedValue(true);

      const { result, rerender } = renderHook(
        ({ tokenId }) =>
          useNFTListedStatus({
            tokenId,
            network: "eip155:10",
          }),
        { initialProps: { tokenId: BigInt(1) } }
      );

      await waitFor(() => {
        expect(result.current.isListed).toBe(true);
      });

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ args: [BigInt(1)] })
      );

      // Change tokenId
      rerender({ tokenId: BigInt(2) });

      await waitFor(() => {
        expect(mockReadContract).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ args: [BigInt(2)] })
        );
      });
    });

    it("should fetch when enabled changes from false to true", async () => {
      mockReadContract.mockResolvedValue(true);

      // Start with enabled=false (simulating isLoading state)
      const { result, rerender } = renderHook(
        ({ enabled }) =>
          useNFTListedStatus({
            tokenId: BigInt(42),
            network: "eip155:10",
            enabled,
          }),
        { initialProps: { enabled: false } }
      );

      // Should not have called contract yet
      expect(mockReadContract).not.toHaveBeenCalled();
      expect(result.current.isListed).toBeUndefined();

      // Simulate NFT data loaded - enabled becomes true
      rerender({ enabled: true });

      // Should now fetch and return isListed
      await waitFor(() => {
        expect(result.current.isListed).toBe(true);
      });

      expect(mockReadContract).toHaveBeenCalledTimes(1);
    });
  });
});
