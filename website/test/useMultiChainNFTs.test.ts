import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";

/**
 * Tests for useMultiChainNFTs hooks.
 *
 * These hooks fetch NFTs from multiple chains in parallel.
 * We mock the wagmi dependencies to test the hook logic.
 */

// Mock wagmi
const mockUseAccount = vi.fn();
vi.mock("wagmi", () => ({
  useAccount: () => mockUseAccount(),
}));

// Mock wagmi/actions
const mockReadContract = vi.fn();
vi.mock("wagmi/actions", () => ({
  readContract: (...args: unknown[]) => mockReadContract(...args),
}));

// Mock wagmi.config
vi.mock("../wagmi.config", () => ({
  config: {},
}));

// Mock chain-utils
vi.mock("@fretchen/chain-utils", () => ({
  GENAI_NFT_NETWORKS: ["eip155:10", "eip155:8453"],
  getGenAiNFTAddress: vi.fn((network: string) => {
    if (network === "eip155:10") return "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb";
    if (network === "eip155:8453") return "0xa5d6a3eEDADc3346E22dF9556dc5B99f2777ab68";
    return "0x0000000000000000000000000000000000000000";
  }),
  GenImNFTv4ABI: [],
  fromCAIP2: vi.fn((network: string) => parseInt(network.split(":")[1])),
  isTestnet: vi.fn(() => false),
}));

// Import after mocks are set up
import { useMultiChainUserNFTs, useMultiChainPublicNFTs } from "../hooks/useMultiChainNFTs";

describe("useMultiChainUserNFTs", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: connected wallet
    mockUseAccount.mockReturnValue({
      address: "0x1234567890123456789012345678901234567890",
      isConnected: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("should return empty tokens when wallet is disconnected", async () => {
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
    });

    const { result } = renderHook(() => useMultiChainUserNFTs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tokens).toEqual([]);
  });

  it("should fetch NFTs from multiple chains", async () => {
    // Mock balanceOf returns
    mockReadContract.mockImplementation(async (_config, params) => {
      if (params.functionName === "balanceOf") {
        // 1 NFT on each chain
        return 1n;
      }
      if (params.functionName === "tokenOfOwnerByIndex") {
        // Return different token IDs per chain
        if (params.chainId === 10) return 26n; // Optimism
        if (params.chainId === 8453) return 1n; // Base
      }
      return 0n;
    });

    const { result } = renderHook(() => useMultiChainUserNFTs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have NFTs from both chains
    expect(result.current.tokens).toContainEqual({ tokenId: 26n, network: "eip155:10" });
    expect(result.current.tokens).toContainEqual({ tokenId: 1n, network: "eip155:8453" });
  });

  it("should handle chains with no NFTs", async () => {
    mockReadContract.mockImplementation(async (_config, params) => {
      if (params.functionName === "balanceOf") {
        // Only Optimism has NFTs
        if (params.chainId === 10) return 1n;
        return 0n;
      }
      if (params.functionName === "tokenOfOwnerByIndex") {
        return 5n;
      }
      return 0n;
    });

    const { result } = renderHook(() => useMultiChainUserNFTs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only have Optimism NFT
    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.tokens[0]).toEqual({ tokenId: 5n, network: "eip155:10" });
  });

  it("should handle contract errors gracefully", async () => {
    mockReadContract.mockRejectedValue(new Error("Contract call failed"));

    const { result } = renderHook(() => useMultiChainUserNFTs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should return empty array on error
    expect(result.current.tokens).toEqual([]);
  });

  it("should sort tokens by tokenId descending", async () => {
    mockReadContract.mockImplementation(async (_config, params) => {
      if (params.functionName === "balanceOf") {
        return 2n;
      }
      if (params.functionName === "tokenOfOwnerByIndex") {
        // Return tokens in ascending order
        if (params.chainId === 10) {
          return params.args[1] === 0n ? 1n : 10n;
        }
        if (params.chainId === 8453) {
          return params.args[1] === 0n ? 5n : 20n;
        }
      }
      return 0n;
    });

    const { result } = renderHook(() => useMultiChainUserNFTs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should be sorted descending (20, 10, 5, 1)
    const tokenIds = result.current.tokens.map((t) => t.tokenId);
    expect(tokenIds).toEqual([20n, 10n, 5n, 1n]);
  });
});

describe("useMultiChainPublicNFTs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should fetch public NFTs from multiple chains", async () => {
    mockReadContract.mockImplementation(async (_config, params) => {
      if (params.functionName === "getAllPublicTokens") {
        if (params.chainId === 10) return [1n, 2n, 3n]; // Optimism
        if (params.chainId === 8453) return [5n, 6n]; // Base
      }
      return [];
    });

    const { result } = renderHook(() => useMultiChainPublicNFTs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have NFTs from both chains
    expect(result.current.tokens).toHaveLength(5);
    expect(result.current.tokens).toContainEqual({ tokenId: 1n, network: "eip155:10" });
    expect(result.current.tokens).toContainEqual({ tokenId: 6n, network: "eip155:8453" });
  });

  it("should handle empty public NFT lists", async () => {
    mockReadContract.mockResolvedValue([]);

    const { result } = renderHook(() => useMultiChainPublicNFTs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tokens).toEqual([]);
  });

  it("should handle contract errors gracefully", async () => {
    mockReadContract.mockRejectedValue(new Error("Contract call failed"));

    const { result } = renderHook(() => useMultiChainPublicNFTs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tokens).toEqual([]);
  });

  it("should sort tokens by tokenId descending", async () => {
    mockReadContract.mockImplementation(async (_config, params) => {
      if (params.functionName === "getAllPublicTokens") {
        if (params.chainId === 10) return [1n, 100n];
        if (params.chainId === 8453) return [50n];
      }
      return [];
    });

    const { result } = renderHook(() => useMultiChainPublicNFTs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should be sorted descending (100, 50, 1)
    const tokenIds = result.current.tokens.map((t) => t.tokenId);
    expect(tokenIds).toEqual([100n, 50n, 1n]);
  });
});
