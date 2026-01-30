import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import WalletOptions from "../components/WalletOptions";
import * as wagmi from "wagmi";

// Mock wagmi hooks
vi.mock("wagmi", () => ({
  useAccount: vi.fn(),
  useEnsName: vi.fn(),
  useConnect: vi.fn(),
  useDisconnect: vi.fn(),
}));

// Mock the styles import
vi.mock("../layouts/styles", () => ({
  walletOptions: {
    dropdown: "dropdown-class",
    button: "button-class",
    menu: "menu-class",
    menuItem: "menu-item-class",
    menuItemHover: "menu-item-hover-class",
  },
}));

/**
 * Simplified tests for WalletOptions component focusing on hydration safety
 */
describe("WalletOptions Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks for hooks
    vi.mocked(wagmi.useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
      addresses: undefined,
      chain: undefined,
      chainId: undefined,
      connector: undefined,
      isConnecting: false,
      isDisconnected: true,
      isReconnecting: false,
      status: "disconnected",
    });

    vi.mocked(wagmi.useEnsName).mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isPending: false,
      isLoading: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: false,
      isPlaceholderData: false,
      status: "idle",
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      fetchStatus: "idle",
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: false,
      isInitialLoading: false,
      isRefetching: false,
      isStale: false,
      refetch: vi.fn(),
      queryKey: ["ensName"],
    });

    vi.mocked(wagmi.useConnect).mockReturnValue({
      connectors: [],
      connect: vi.fn(),
      error: null,
      data: undefined,
      isError: false,
      isPending: false,
      isSuccess: false,
      status: "idle",
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      reset: vi.fn(),
      connectAsync: vi.fn(),
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      submittedAt: 0,
      variables: undefined,
    });

    vi.mocked(wagmi.useDisconnect).mockReturnValue({
      disconnect: vi.fn(),
      error: null,
      data: undefined,
      isError: false,
      isPending: false,
      isSuccess: false,
      status: "idle",
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      reset: vi.fn(),
      disconnectAsync: vi.fn(),
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      submittedAt: 0,
      variables: undefined,
    });
  });

  it("always shows 'Connect Account' initially (hydration safety)", () => {
    render(<WalletOptions />);
    expect(screen.getByRole("button")).toHaveTextContent("walletoptions.connectAccount");
  });

  it("prevents hydration mismatch when wallet is connected", async () => {
    vi.mocked(wagmi.useAccount).mockReturnValue({
      address: "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`,
      isConnected: true,
      addresses: ["0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`],
      chain: undefined,
      chainId: undefined,
      connector: undefined,
      isConnecting: false,
      isDisconnected: false,
      isReconnecting: false,
      status: "connected",
    });

    render(<WalletOptions />);

    // Component should handle hydration correctly and show the address
    // The isMounted check ensures this doesn't cause hydration mismatches
    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveTextContent("0x1234...5678");
    });
  });

  it("shows ENS name when available after mount", async () => {
    vi.mocked(wagmi.useAccount).mockReturnValue({
      address: "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`,
      isConnected: true,
      addresses: ["0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`],
      chain: undefined,
      chainId: undefined,
      connector: undefined,
      isConnecting: false,
      isDisconnected: false,
      isReconnecting: false,
      status: "connected",
    });

    vi.mocked(wagmi.useEnsName).mockReturnValue({
      data: "test.eth",
      error: null,
      isError: false,
      isPending: false,
      isLoading: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      isPlaceholderData: false,
      status: "success",
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      fetchStatus: "idle",
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isInitialLoading: false,
      isRefetching: false,
      isStale: false,
      refetch: vi.fn(),
      queryKey: ["ensName"],
    });

    render(<WalletOptions />);

    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveTextContent("test.eth");
    });
  });
});
