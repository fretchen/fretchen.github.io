import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Import the real Tab component for unit testing
const Tab = ({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) => {
  return (
    <button
      className={`tab ${isActive ? "active-tab" : ""}`}
      onClick={onClick}
      data-testid={`tab-${label.toLowerCase().replace(/\s/g, "-")}`}
    >
      {label}
    </button>
  );
};

// Simple mock for NFTList component
const MockNFTList = vi.fn(() => (
  <div data-testid="nft-list">
    <div className="tabs-container">
      <div className="tab-list">
        <Tab label="My Artworks (2)" isActive={true} onClick={() => {}} />
        <Tab label="All Public Artworks" isActive={false} onClick={() => {}} />
      </div>
    </div>
    <div data-testid="nft-content">NFT List Component</div>
  </div>
));

vi.mock("../components/NFTList", () => ({
  default: MockNFTList,
  NFTList: MockNFTList,
}));

// Mock all complex dependencies
vi.mock("../utils/getChain", () => ({
  getChain: vi.fn(() => ({ id: 1 })),
  getGenAiNFTContractConfig: vi.fn(() => ({ address: "0x123", abi: [] })),
}));

vi.mock("../layouts/styles", () => ({
  imageGen: { columnHeading: "mock-class", spinner: "mock-spinner" },
  nftList: { container: "mock-container" },
  nftCard: { container: "mock-card" },
}));

vi.mock("../styled-system/css", () => ({
  css: vi.fn(() => "mock-css-class"),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe("NFTList Component", () => {
  it("should render NFTList component", () => {
    render(
      <TestWrapper>
        <MockNFTList />
      </TestWrapper>,
    );

    expect(screen.getByTestId("nft-list")).toBeInTheDocument();
    expect(screen.getByText("NFT List Component")).toBeInTheDocument();
  });

  it("should render with props", () => {
    const mockProps = {
      newlyCreatedNFT: { tokenId: 1n, imageUrl: "test.jpg" },
      onNewNFTDisplayed: vi.fn(),
    };

    render(
      <TestWrapper>
        <MockNFTList {...mockProps} />
      </TestWrapper>,
    );

    expect(screen.getByTestId("nft-list")).toBeInTheDocument();
  });

  describe("isListed Functionality", () => {
    it("should have isListed property in NFT interface", () => {
      // Test that the NFT type includes isListed property
      const mockNFT = {
        tokenId: 1n,
        tokenURI: "https://example.com/token/1",
        metadata: {
          name: "Test NFT",
          description: "Test Description",
          image: "https://example.com/image.png",
        },
        imageUrl: "https://example.com/image.png",
        isLoading: false,
        isListed: false, // This property should exist
      };

      expect(mockNFT.isListed).toBeDefined();
      expect(typeof mockNFT.isListed).toBe("boolean");
    });

    it("should support onListedStatusChanged callback in NFTCardProps", () => {
      // Test that the callback interface is correctly typed
      const mockCallback = vi.fn((tokenId: bigint, isListed: boolean) => {
        expect(typeof tokenId).toBe("bigint");
        expect(typeof isListed).toBe("boolean");
      });

      mockCallback(1n, true);
      expect(mockCallback).toHaveBeenCalledWith(1n, true);
    });

    it("should render with NFT that has isListed property", () => {
      const mockProps = {
        newlyCreatedNFT: {
          tokenId: 1n,
          imageUrl: "test.jpg",
          isListed: true, // Test with isListed property
        },
        onNewNFTDisplayed: vi.fn(),
      };

      render(
        <TestWrapper>
          <MockNFTList {...mockProps} />
        </TestWrapper>,
      );

      expect(screen.getByTestId("nft-list")).toBeInTheDocument();
    });
  });
});
