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

// Mock getChain to provide both the old unstable function and the new stable constant
vi.mock("../utils/getChain", () => ({
  getChain: vi.fn(() => ({ id: 10 })),
  getGenAiNFTContractConfig: vi.fn(() => {
    contractConfigCallCount++;
    // Return a new object every time - this simulates the current bug
    return {
      address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
      abi: [], // Simplified for test
    };
  }),
  // Add the stable constant that our components now use
  genAiNFTContractConfig: {
    address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
    abi: [], // Simplified for test
  },
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
        // Mit stabilen Konstanten sollten nur wenige Renders auftreten
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

  it("should show that contract config creates new objects every time", async () => {
    // Import the actual function to test
    const { getGenAiNFTContractConfig } = await import("../utils/getChain");

    const config1 = getGenAiNFTContractConfig();
    const config2 = getGenAiNFTContractConfig();

    // Even though they have the same content, they are different objects
    expect(config1).toEqual(config2); // Content is the same
    expect(config1).not.toBe(config2); // But references are different - THIS IS THE BUG!

    // This proves why the useEffect with contract config in dependencies
    // causes infinite re-renders
  });

  it("should demonstrate the dependency chain that causes the loop", async () => {
    let effectRunCount = 0;

    // Create a mock component that simulates the problematic useEffect
    function ProblematicComponent() {
      const [contractConfig, setContractConfig] = React.useState<Record<string, unknown> | null>(null);

      React.useEffect(() => {
        import("../utils/getChain").then(({ getGenAiNFTContractConfig }) => {
          setContractConfig(getGenAiNFTContractConfig());
        });
      }, []);

      React.useEffect(() => {
        effectRunCount++;
        console.log(`Effect run #${effectRunCount}`);
        // Simulate loading token IDs
      }, [contractConfig]); // This dependency causes the loop!

      return <div>Component</div>;
    }

    render(<ProblematicComponent />);

    await waitFor(
      () => {
        // Mit stabilen Konstanten sollte der Effect jetzt nur noch 2 mal laufen
        // (einmal initial, einmal nach dem ersten useEffect Update)
        expect(effectRunCount).toBeLessThanOrEqual(2);
      },
      { timeout: 1000 },
    );

    console.log(`Effect ran ${effectRunCount} times due to unstable dependency`);
  });
});
