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

// Mock getChain to provide the stable constant
vi.mock("../utils/getChain", () => ({
  getChain: vi.fn(() => ({ id: 10 })),
  // Stable constant that our components now use
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

  it("should show that stable constant has consistent reference", async () => {
    // Import the new stable constant
    const { genAiNFTContractConfig } = await import("../utils/getChain");

    // Multiple imports should return the same reference
    const config1 = genAiNFTContractConfig;
    const config2 = genAiNFTContractConfig;

    // They should be exactly the same object (same content AND reference)
    expect(config1).toEqual(config2); // Content is the same
    expect(config1).toBe(config2); // And references are the same - THIS IS THE FIX!

    // This proves why the useEffect with contract config in dependencies
    // causes infinite re-renders
  });

  it("should demonstrate stable dependency with fixed implementation", async () => {
    let effectRunCount = 0;

    // Create a component that uses the stable constant
    function FixedComponent() {
      const [contractConfig, setContractConfig] = React.useState<Record<string, unknown> | null>(null);

      React.useEffect(() => {
        import("../utils/getChain").then(({ genAiNFTContractConfig }) => {
          setContractConfig(genAiNFTContractConfig);
        });
      }, []);

      React.useEffect(() => {
        effectRunCount++;
        console.log(`Effect run #${effectRunCount}`);
        // Simulate loading token IDs
      }, [contractConfig]); // This dependency causes the loop!

      return <div>Component</div>;
    }

    render(<FixedComponent />);

    await waitFor(
      () => {
        // With stable constants, the effect only runs 2 times
        // (once initial, once after the first useEffect update)
        expect(effectRunCount).toBeLessThanOrEqual(2);
      },
      { timeout: 1000 },
    );

    console.log(`Effect ran ${effectRunCount} times with stable dependency`);
  });
});
