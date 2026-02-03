import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { PublicNFTList } from "../components/PublicNFTList";

/**
 * Tests for PublicNFTList component with multi-chain support.
 * 
 * The component now uses useMultiChainPublicNFTs hook which fetches
 * public NFTs from all configured chains in parallel.
 */

// Mock the multi-chain public NFT hook
const mockUseMultiChainPublicNFTs = vi.fn();
vi.mock("../hooks/useMultiChainNFTs", () => ({
  useMultiChainPublicNFTs: () => mockUseMultiChainPublicNFTs(),
}));

// Mock NFTCard - now requires network prop
vi.mock("../components/NFTCard", () => ({
  NFTCard: vi.fn(({ tokenId, network }) => (
    <div data-testid={`nft-card-${tokenId}`} data-network={network}>
      NFT {tokenId.toString()} on {network}
    </div>
  )),
}));

// Mock ImageModal
vi.mock("../components/ImageModal", () => ({
  ImageModal: vi.fn(() => <div data-testid="image-modal">Mock Image Modal</div>),
}));

// Mock styles
vi.mock("../layouts/styles", () => ({
  nftList: {
    loadingContainer: "loading-container",
    emptyStateContainer: "empty-state-container",
    emptyStateText: "empty-state-text",
    grid: "nft-grid",
  },
  spinner: "spinner",
}));

describe("PublicNFTList Multi-Chain Support", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: some public NFTs from multiple chains
    mockUseMultiChainPublicNFTs.mockReturnValue({
      tokens: [
        { tokenId: 26n, network: "eip155:10" },   // Optimism
        { tokenId: 1n, network: "eip155:8453" },  // Base
      ],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("should be importable", () => {
    expect(typeof PublicNFTList).toBe("function");
  });

  it("should render NFT cards from multiple chains", async () => {
    render(<PublicNFTList />);

    await waitFor(() => {
      expect(screen.getByTestId("nft-card-26")).toBeInTheDocument();
      expect(screen.getByTestId("nft-card-1")).toBeInTheDocument();
    });

    // Verify chain information is passed to cards
    expect(screen.getByTestId("nft-card-26")).toHaveAttribute("data-network", "eip155:10");
    expect(screen.getByTestId("nft-card-1")).toHaveAttribute("data-network", "eip155:8453");
  });

  it("should show loading state while fetching", () => {
    mockUseMultiChainPublicNFTs.mockReturnValue({
      tokens: [],
      isLoading: true,
      error: null,
      reload: vi.fn(),
    });

    render(<PublicNFTList />);

    expect(screen.getByText(/loading public artworks/i)).toBeInTheDocument();
  });

  it("should show empty state when no public NFTs", async () => {
    mockUseMultiChainPublicNFTs.mockReturnValue({
      tokens: [],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });

    render(<PublicNFTList />);

    await waitFor(() => {
      expect(screen.getByText(/no public artworks available/i)).toBeInTheDocument();
    });
  });

  it("should display NFTs from Optimism only when hook returns only Optimism NFTs", async () => {
    mockUseMultiChainPublicNFTs.mockReturnValue({
      tokens: [
        { tokenId: 1n, network: "eip155:10" },
        { tokenId: 2n, network: "eip155:10" },
        { tokenId: 3n, network: "eip155:10" },
      ],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });

    render(<PublicNFTList />);

    await waitFor(() => {
      expect(screen.getByTestId("nft-card-1")).toHaveAttribute("data-network", "eip155:10");
      expect(screen.getByTestId("nft-card-2")).toHaveAttribute("data-network", "eip155:10");
      expect(screen.getByTestId("nft-card-3")).toHaveAttribute("data-network", "eip155:10");
    });
  });

  it("should display NFTs from Base only when hook returns only Base NFTs", async () => {
    mockUseMultiChainPublicNFTs.mockReturnValue({
      tokens: [
        { tokenId: 1n, network: "eip155:8453" },
        { tokenId: 2n, network: "eip155:8453" },
      ],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });

    render(<PublicNFTList />);

    await waitFor(() => {
      expect(screen.getByTestId("nft-card-1")).toHaveAttribute("data-network", "eip155:8453");
      expect(screen.getByTestId("nft-card-2")).toHaveAttribute("data-network", "eip155:8453");
    });
  });

  it("should render NFTs sorted by tokenId descending (newest first)", async () => {
    mockUseMultiChainPublicNFTs.mockReturnValue({
      tokens: [
        { tokenId: 100n, network: "eip155:10" },
        { tokenId: 50n, network: "eip155:8453" },
        { tokenId: 1n, network: "eip155:10" },
      ],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });

    render(<PublicNFTList />);

    await waitFor(() => {
      const cards = screen.getAllByTestId(/nft-card-/);
      expect(cards).toHaveLength(3);
      // Verify order matches what the hook returns (hook handles sorting)
      expect(cards[0]).toHaveAttribute("data-testid", "nft-card-100");
      expect(cards[1]).toHaveAttribute("data-testid", "nft-card-50");
      expect(cards[2]).toHaveAttribute("data-testid", "nft-card-1");
    });
  });
});
