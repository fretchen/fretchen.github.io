import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount, useReadContract } from "wagmi";
import NFTList from "../components/NFTList";

// Component-specific mocks (don't re-mock wagmi as it's already mocked in setup.ts)
vi.mock("../utils/getChain", () => ({
  getChain: vi.fn(() => ({ id: 1 })),
  getGenAiNFTContractConfig: vi.fn(() => ({
    address: "0x123",
    abi: [],
  })),
}));

vi.mock("../layouts/styles", () => ({
  imageGen: {
    columnHeading: "mock-heading-class",
    spinner: "mock-spinner-class",
  },
}));

vi.mock("../styled-system/css", () => ({
  css: vi.fn((styles) => `mock-css-${JSON.stringify(styles)}`),
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render wallet connection message when not connected", () => {
    // Override the global mock for this specific test
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      addresses: undefined,
      chainId: undefined,
      connector: undefined,
      isConnected: false,
      isConnecting: false,
      isDisconnected: true,
      isReconnecting: false,
      status: "disconnected",
      chain: undefined,
    });

    vi.mocked(useReadContract).mockReturnValue({
      data: undefined,
      error: null,
      isPending: false,
      isError: false,
      isSuccess: false,
      status: "pending",
      refetch: vi.fn(),
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      fetchStatus: "idle",
      isFetching: false,
      isInitialLoading: false,
      isLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: false,
    });

    render(
      <TestWrapper>
        <NFTList />
      </TestWrapper>,
    );

    expect(screen.getByText("Connect your wallet to view your NFTs")).toBeInTheDocument();
  });

  it("should render empty state when user has no NFTs", () => {
    vi.mocked(useAccount).mockReturnValue({
      address: "0x123",
      addresses: undefined,
      chainId: 1,
      connector: undefined,
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
      isReconnecting: false,
      status: "connected",
      chain: undefined,
    });

    vi.mocked(useReadContract).mockReturnValue({
      data: 0n,
      error: null,
      isPending: false,
      isError: false,
      isSuccess: true,
      status: "success",
      refetch: vi.fn(),
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      fetchStatus: "idle",
      isFetching: false,
      isInitialLoading: false,
      isLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: false,
    });

    render(
      <TestWrapper>
        <NFTList />
      </TestWrapper>,
    );

    expect(screen.getByText(/You haven't created any NFTs yet/)).toBeInTheDocument();
  });

  it("should render NFT count when user has NFTs", () => {
    vi.mocked(useAccount).mockReturnValue({
      address: "0x123",
      addresses: undefined,
      chainId: 1,
      connector: undefined,
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
      isReconnecting: false,
      status: "connected",
      chain: undefined,
    });

    vi.mocked(useReadContract).mockReturnValue({
      data: 3n,
      error: null,
      isPending: false,
      isError: false,
      isSuccess: true,
      status: "success",
      refetch: vi.fn(),
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      fetchStatus: "idle",
      isFetching: false,
      isInitialLoading: false,
      isLoading: false,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: false,
    });

    render(
      <TestWrapper>
        <NFTList />
      </TestWrapper>,
    );

    expect(screen.getByText("Your Generated NFTs (3)")).toBeInTheDocument();
  });
});
