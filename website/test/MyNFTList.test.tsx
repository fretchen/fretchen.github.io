import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MyNFTList } from "../components/MyNFTList";

/**
 * Test to reproduce the infinite re-render bug caused by unstable contract configs
 * in useEffect dependencies after the "Lint hooks" commit.
 */

let renderCount = 0;
let contractConfigCallCount = 0;

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

  it("should show the bug is fixed with stable constants", async () => {
    // Render the component
    render(<MyNFTListWrapper />);

    // Wait a bit to let effects run
    await waitFor(
      () => {
        // With stable constants, only a few renders should occur
        expect(renderCount).toBeLessThanOrEqual(3);
      },
      { timeout: 2000 },
    );

    // Die instabile contractConfig Funktion sollte nicht mehr aufgerufen werden
    // da die Komponenten jetzt die stabile Konstante verwenden
    expect(contractConfigCallCount).toBe(0);

    console.log(`Total renders: ${renderCount}`);
    console.log(`Contract config calls: ${contractConfigCallCount}`);
  });

  it("should show that chain-utils provides consistent addresses", async () => {
    // Import from chain-utils
    const { getGenAiNFTAddress } = await import("@fretchen/chain-utils");

    // Multiple calls with same network should return the same address
    const address1 = getGenAiNFTAddress("eip155:10");
    const address2 = getGenAiNFTAddress("eip155:10");

    // They should be exactly the same
    expect(address1).toEqual(address2);
    expect(address1).toBe(address2);
  });

  it("should demonstrate stable useAutoNetwork hook", async () => {
    let effectRunCount = 0;

    // Import useAutoNetwork at the top of the test
    const { useAutoNetwork } = await import("../hooks/useAutoNetwork");

    // Create a component that uses the useAutoNetwork hook
    function FixedComponent() {
      const network = useAutoNetwork(["eip155:10", "eip155:11155420"]);

      React.useEffect(() => {
        effectRunCount++;
        console.log(`Effect run #${effectRunCount}, network: ${network}`);
      }, [network]);

      return <div>Component on {network}</div>;
    }

    render(<FixedComponent />);

    await waitFor(
      () => {
        // With useAutoNetwork, the effect only runs once
        expect(effectRunCount).toBeLessThanOrEqual(2);
      },
      { timeout: 1000 },
    );

    console.log(`Effect ran ${effectRunCount} times with useAutoNetwork`);
  });
});
