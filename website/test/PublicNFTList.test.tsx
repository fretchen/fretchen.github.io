import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { PublicNFTList } from "../components/PublicNFTList";

/**
 * Mock complex dependencies to focus on component logic
 */

// Mock useAutoNetwork - must return object with network
vi.mock("../hooks/useAutoNetwork", () => ({
  useAutoNetwork: vi.fn(() => ({
    network: "eip155:10",
    isOnCorrectNetwork: true,
    switchIfNeeded: vi.fn(() => Promise.resolve(true)),
  })),
}));

// Mock useConfiguredPublicClient - returns a mock client
const mockReadContract = vi.fn();
vi.mock("../hooks/useConfiguredPublicClient", () => ({
  useConfiguredPublicClient: vi.fn(() => ({
    readContract: mockReadContract,
  })),
}));

// Mock chain-utils
vi.mock("@fretchen/chain-utils", () => ({
  getGenAiNFTAddress: vi.fn(() => "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb"),
  GenImNFTv4ABI: [
    { name: "getAllPublicTokens", type: "function", inputs: [], outputs: [{ type: "uint256[]" }] },
  ],
  GENAI_NFT_NETWORKS: ["eip155:10", "eip155:11155420"],
}));

vi.mock("../components/NFTCard", () => ({
  NFTCard: vi.fn(({ tokenId }) => <div data-testid={`nft-card-${tokenId}`}>NFT {tokenId.toString()}</div>),
}));

vi.mock("../components/ImageModal", () => ({
  ImageModal: vi.fn(() => <div data-testid="image-modal">Mock Image Modal</div>),
}));

vi.mock("../layouts/styles", () => ({
  nftList: {
    container: "nft-list-container",
    loadingContainer: "loading-container",
    emptyStateContainer: "empty-state-container",
    emptyStateText: "empty-state-text",
    galleryGrid: "gallery-grid",
    grid: "nft-grid",
  },
  spinner: "spinner",
}));

vi.mock("../hooks/useLocale", () => ({
  useLocale: vi.fn(() => "Mocked text"),
}));

global.fetch = vi.fn();

/**
 * Tests for the PublicNFTList component
 * Focuses on component structure, props handling, and architecture
 */
describe("PublicNFTList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: return empty array (no public NFTs)
    mockReadContract.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Tests component importability
   */
  it("should be importable", () => {
    expect(typeof PublicNFTList).toBe("function");
  });

  /**
   * CRITICAL: Tests that component actually renders without errors
   * This catches ABI mismatches like missing getAllPublicTokens function
   */
  describe("Rendering (Bug Prevention)", () => {
    it("should render loading state initially", () => {
      // Don't resolve the promise immediately
      mockReadContract.mockReturnValue(new Promise(() => {}));
      
      render(<PublicNFTList />);
      
      expect(screen.getByText(/Loading public artworks/i)).toBeInTheDocument();
    });

    it("should render empty state when no public NFTs", async () => {
      mockReadContract.mockResolvedValue([]);
      
      render(<PublicNFTList />);
      
      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });
    });

    it("should render NFT cards when public NFTs exist", async () => {
      mockReadContract.mockResolvedValue([1n, 2n, 3n]);
      
      render(<PublicNFTList />);
      
      // Wait for NFTs to load
      await waitFor(() => {
        expect(screen.getByTestId("nft-card-3")).toBeInTheDocument();
        expect(screen.getByTestId("nft-card-2")).toBeInTheDocument();
        expect(screen.getByTestId("nft-card-1")).toBeInTheDocument();
      });
    });

    it("should call getAllPublicTokens ABI function", async () => {
      mockReadContract.mockResolvedValue([1n, 2n]);
      
      render(<PublicNFTList />);
      
      await waitFor(() => {
        // Verify the correct ABI function is called
        expect(mockReadContract).toHaveBeenCalledWith(
          expect.objectContaining({
            functionName: "getAllPublicTokens",
          })
        );
      });
    });

    it("should handle contract errors gracefully", async () => {
      mockReadContract.mockRejectedValue(new Error("Contract call failed"));
      
      // Should not throw
      expect(() => render(<PublicNFTList />)).not.toThrow();
      
      // Wait for error handling
      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });
    });
  });

  /**
   * Tests component structure and React element creation
   */
  it("should be a React component", () => {
    expect(PublicNFTList).toBeDefined();
    expect(typeof PublicNFTList).toBe("function");
  });

  /**
   * Tests className prop from BaseComponentProps
   */
  it("should accept className prop", async () => {
    render(<PublicNFTList className="custom-class" />);
    // Wait for async operations to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
  });
});

