import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, screen, cleanup } from "@testing-library/react";
import { MyNFTList } from "../components/MyNFTList";

/**
 * Tests for MyNFTList component with multi-chain support.
 *
 * The component now uses useMultiChainUserNFTs hook which fetches NFTs
 * from all configured chains in parallel. We mock this hook directly
 * for cleaner, faster tests.
 */

// Mock wagmi useAccount
const mockUseAccount = vi.fn();
vi.mock("wagmi", () => ({
  useAccount: () => mockUseAccount(),
}));

// Mock the multi-chain NFT hook - this is the key mock
const mockUseMultiChainUserNFTs = vi.fn();
vi.mock("../hooks/useMultiChainNFTs", () => ({
  useMultiChainUserNFTs: () => mockUseMultiChainUserNFTs(),
  // Re-export the type for TypeScript
  MultiChainNFTToken: {},
}));

// Mock styles
vi.mock("../layouts/styles", () => ({
  nftList: {
    walletPrompt: "wallet-prompt",
    loadingContainer: "loading-container",
    grid: "grid",
    emptyStateContainer: "empty-state-container",
    emptyStateText: "empty-state-text",
  },
  spinner: "spinner",
}));

// Mock NFTCard - now requires network prop
vi.mock("../components/NFTCard", () => ({
  NFTCard: vi.fn(({ tokenId, network }) => {
    return (
      <div data-testid={`nft-card-${tokenId}`} data-network={network}>
        NFT {tokenId.toString()} on {network}
      </div>
    );
  }),
}));

// Mock ImageModal
vi.mock("../components/ImageModal", () => ({
  ImageModal: vi.fn(() => <div data-testid="image-modal">Modal</div>),
}));

describe("MyNFTList Multi-Chain Support", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: connected wallet
    mockUseAccount.mockReturnValue({
      address: "0x1234567890123456789012345678901234567890",
      isConnected: true,
    });

    // Default: some NFTs from multiple chains
    mockUseMultiChainUserNFTs.mockReturnValue({
      tokens: [
        { tokenId: 26n, network: "eip155:10" }, // Optimism
        { tokenId: 1n, network: "eip155:8453" }, // Base
      ],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("should render NFT cards from multiple chains", async () => {
    render(<MyNFTList />);

    await waitFor(() => {
      expect(screen.getByTestId("nft-card-26")).toBeInTheDocument();
      expect(screen.getByTestId("nft-card-1")).toBeInTheDocument();
    });

    // Verify chain information is passed to cards
    expect(screen.getByTestId("nft-card-26")).toHaveAttribute("data-network", "eip155:10");
    expect(screen.getByTestId("nft-card-1")).toHaveAttribute("data-network", "eip155:8453");
  });

  it("should show loading state while fetching", async () => {
    mockUseMultiChainUserNFTs.mockReturnValue({
      tokens: [],
      isLoading: true,
      error: null,
      reload: vi.fn(),
    });

    render(<MyNFTList />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should show empty state when user has no NFTs", async () => {
    mockUseMultiChainUserNFTs.mockReturnValue({
      tokens: [],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });

    render(<MyNFTList />);

    await waitFor(() => {
      expect(screen.getByText(/haven't created any artworks/i)).toBeInTheDocument();
    });
  });

  it("should show wallet prompt when disconnected", async () => {
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
    });

    render(<MyNFTList />);

    // Multiple elements contain this text, so use getAllByText
    expect(screen.getAllByText(/connect your wallet/i).length).toBeGreaterThan(0);
  });

  it("should highlight newly created NFT", async () => {
    const newNFT = {
      tokenId: 27n,
      imageUrl: "https://example.com/image.png",
      metadata: { name: "New Artwork" },
      network: "eip155:8453", // Created on Base
    };

    render(<MyNFTList newlyCreatedNFT={newNFT} />);

    await waitFor(() => {
      // The new NFT should be added to the list
      expect(screen.getByTestId("nft-card-27")).toBeInTheDocument();
      expect(screen.getByTestId("nft-card-27")).toHaveAttribute("data-network", "eip155:8453");
    });
  });

  it("should display NFTs from Optimism only when hook returns only Optimism NFTs", async () => {
    mockUseMultiChainUserNFTs.mockReturnValue({
      tokens: [
        { tokenId: 1n, network: "eip155:10" },
        { tokenId: 2n, network: "eip155:10" },
      ],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });

    render(<MyNFTList />);

    await waitFor(() => {
      expect(screen.getByTestId("nft-card-1")).toHaveAttribute("data-network", "eip155:10");
      expect(screen.getByTestId("nft-card-2")).toHaveAttribute("data-network", "eip155:10");
    });
  });

  it("should display NFTs from Base only when hook returns only Base NFTs", async () => {
    mockUseMultiChainUserNFTs.mockReturnValue({
      tokens: [
        { tokenId: 1n, network: "eip155:8453" },
        { tokenId: 2n, network: "eip155:8453" },
      ],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });

    render(<MyNFTList />);

    await waitFor(() => {
      expect(screen.getByTestId("nft-card-1")).toHaveAttribute("data-network", "eip155:8453");
      expect(screen.getByTestId("nft-card-2")).toHaveAttribute("data-network", "eip155:8453");
    });
  });
});

describe("MyNFTList callback behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAccount.mockReturnValue({
      address: "0x1234567890123456789012345678901234567890",
      isConnected: true,
    });

    mockUseMultiChainUserNFTs.mockReturnValue({
      tokens: [],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("should call onNewNFTDisplayed after highlighting timeout", async () => {
    vi.useFakeTimers();

    const onNewNFTDisplayed = vi.fn();
    const newNFT = {
      tokenId: 1n,
      imageUrl: "https://example.com/image.png",
      network: "eip155:10",
    };

    render(<MyNFTList newlyCreatedNFT={newNFT} onNewNFTDisplayed={onNewNFTDisplayed} />);

    // Callback should not be called immediately
    expect(onNewNFTDisplayed).not.toHaveBeenCalled();

    // Fast-forward 5 seconds (the highlighting timeout)
    await vi.advanceTimersByTimeAsync(5000);

    expect(onNewNFTDisplayed).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
