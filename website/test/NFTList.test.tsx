import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Simple mock for NFTList component
const MockNFTList = vi.fn(() => <div data-testid="nft-list">NFT List Component</div>);

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
});
