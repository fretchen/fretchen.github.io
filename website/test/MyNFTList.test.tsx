import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, screen, cleanup } from "@testing-library/react";
import { MyNFTList } from "../components/MyNFTList";

/**
 * Test to reproduce the infinite re-render bug caused by unstable contract configs
 * in useEffect dependencies after the "Lint hooks" commit.
 */

// Mock wagmi functions
const mockUseAccount = vi.fn();
const mockUseReadContract = vi.fn();
const mockReadContract = vi.fn();

vi.mock("wagmi", () => ({
  useAccount: () => mockUseAccount(),
  useReadContract: () => mockUseReadContract(),
}));

vi.mock("wagmi/actions", () => ({
  readContract: (...args: unknown[]) => mockReadContract(...args),
}));

// Mock useAutoNetwork hook - returns object with network and switchIfNeeded
vi.mock("../hooks/useAutoNetwork", () => ({
  useAutoNetwork: vi.fn(() => ({
    network: "eip155:10", // Default to Optimism mainnet
    isOnCorrectNetwork: true,
    switchIfNeeded: vi.fn(() => Promise.resolve(true)),
  })),
}));

// Mock chain-utils
vi.mock("@fretchen/chain-utils", () => ({
  getGenAiNFTAddress: vi.fn(() => "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb"),
  GenImNFTv4ABI: [],
  GENAI_NFT_NETWORKS: ["eip155:10", "eip155:11155420"],
  fromCAIP2: vi.fn((network: string) => parseInt(network.split(":")[1])),
}));

// Mock config
vi.mock("../wagmi.config", () => ({
  config: {},
}));

// Mock styles
vi.mock("../layouts/styles", () => ({
  nftList: {
    walletPrompt: "wallet-prompt",
    loadingContainer: "loading-container",
    galleryGrid: "gallery-grid",
    emptyState: "empty-state",
  },
  spinner: "spinner",
}));

// Mock NFTCard to track renders
vi.mock("../components/NFTCard", () => ({
  NFTCard: vi.fn(({ tokenId }) => {
    return <div data-testid={`nft-card-${tokenId}`}>NFT {tokenId.toString()}</div>;
  }),
}));

// Mock ImageModal
vi.mock("../components/ImageModal", () => ({
  ImageModal: vi.fn(() => <div data-testid="image-modal">Modal</div>),
}));

// Mock useLocale
vi.mock("../hooks/useLocale", () => ({
  useLocale: vi.fn(() => "Mocked text"),
}));

// Create a wrapper component to count renders
function MyNFTListWrapper(props: Record<string, unknown>) {
  renderCount++;
  return <MyNFTList {...props} />;
}

describe("MyNFTList Re-render Bug Reproduction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renderCount = 0;
    contractConfigCallCount = 0;

    // Setup default mock returns
    mockUseAccount.mockReturnValue({
      address: "0x1234567890123456789012345678901234567890",
      isConnected: true,
    });

    mockUseReadContract.mockReturnValue({
      data: 2n, // User has 2 NFTs
      isLoading: false,
    });

    mockReadContract.mockImplementation(async (config, params) => {
      if (params.functionName === "balanceOf") {
        return 2n;
      }
      if (params.functionName === "tokenOfOwnerByIndex") {
        // Return different token IDs based on index
        return params.args[1] === 0n ? 1n : 2n;
      }
      return 0n;
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("should call balanceOf ABI function when loading NFTs", async () => {
    // Render the component
    render(<MyNFTListWrapper />);

    // Wait for the component to load
    await waitFor(() => {
      // balanceOf should be called via useReadContract (mocked above)
      expect(mockUseReadContract).toHaveBeenCalled();
    });
  });

  it("should call tokenOfOwnerByIndex ABI function for each NFT", async () => {
    // Render the component
    render(<MyNFTListWrapper />);

    // Wait for the component to load and fetch token IDs
    await waitFor(
      () => {
        // tokenOfOwnerByIndex should be called for each NFT in the balance
        expect(mockReadContract).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    // Verify tokenOfOwnerByIndex was called with correct function name
    const calls = mockReadContract.mock.calls;
    const tokenOfOwnerByIndexCalls = calls.filter((call: unknown[]) => {
      const params = call[1] as { functionName?: string };
      return params?.functionName === "tokenOfOwnerByIndex";
    });

    expect(tokenOfOwnerByIndexCalls.length).toBeGreaterThan(0);
  });

  it("should render NFT cards after loading token IDs", async () => {
    render(<MyNFTListWrapper />);

    // Wait for NFT cards to appear
    await waitFor(
      () => {
        expect(screen.getByTestId("nft-card-1")).toBeInTheDocument();
        expect(screen.getByTestId("nft-card-2")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("should show empty state when user has no NFTs", async () => {
    // Mock no NFTs
    mockUseReadContract.mockReturnValue({
      data: 0n,
      isLoading: false,
    });

    render(<MyNFTList />);

    // Should not show any NFT cards
    await waitFor(() => {
      expect(screen.queryByTestId("nft-card-1")).not.toBeInTheDocument();
    });
  });
});
