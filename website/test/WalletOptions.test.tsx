import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
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
  afterEach(() => {
    cleanup();
  });

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

  // --- Dropdown interaction: connector list, connect click, disconnect click ---
  // These exercise the code paths that the connect/disconnect regressions lived in and
  // that the mocked-`connectors: []` tests above never touched.

  const mmConnector = {
    uid: "mm",
    name: "MetaMask",
    type: "injected",
    icon: "data:image/svg+xml;base64,PHN2Zy8+",
  };
  const wcConnector = { uid: "wc", name: "WalletConnect", type: "walletConnect" };

  function openDropdown() {
    // The dropdown opens on mouse-enter of the container (the button's parent).
    fireEvent.mouseEnter(screen.getByRole("button").parentElement as HTMLElement);
  }

  it("renders one menu item per connector, labeled by name", async () => {
    const connect = vi.fn();
    vi.mocked(wagmi.useConnect).mockReturnValue({
      connectors: [wcConnector, mmConnector],
      connect,
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
    } as unknown as ReturnType<typeof wagmi.useConnect>);

    render(<WalletOptions />);
    openDropdown();

    expect(await screen.findByText("MetaMask")).toBeInTheDocument();
    expect(screen.getByText("WalletConnect")).toBeInTheDocument();
  });

  it("shows the connector's own icon when provided, and a fallback icon otherwise", async () => {
    vi.mocked(wagmi.useConnect).mockReturnValue({
      connectors: [wcConnector, mmConnector],
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
    } as unknown as ReturnType<typeof wagmi.useConnect>);

    const { container } = render(<WalletOptions />);
    openDropdown();

    await screen.findByText("MetaMask");
    // MetaMask supplies its own icon (EIP-6963 `.icon`) -> rendered as a decorative <img>
    // (alt="" removes it from the accessibility tree, so query the DOM directly).
    const mmImg = container.querySelector("img");
    expect(mmImg).toHaveAttribute("src", mmConnector.icon);
    // WalletConnect has no `.icon` -> falls back to the generic glyph.
    expect(screen.getByRole("img", { name: "WalletConnect" })).toBeInTheDocument();
  });

  it("clicking a connector calls connect with that exact connector", async () => {
    const connect = vi.fn();
    vi.mocked(wagmi.useConnect).mockReturnValue({
      connectors: [wcConnector, mmConnector],
      connect,
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
    } as unknown as ReturnType<typeof wagmi.useConnect>);

    render(<WalletOptions />);
    openDropdown();

    fireEvent.click(await screen.findByText("MetaMask"));
    expect(connect).toHaveBeenCalledWith({ connector: mmConnector });
  });

  it("clicking disconnect calls disconnect", async () => {
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

    const disconnect = vi.fn();
    vi.mocked(wagmi.useDisconnect).mockReturnValue({
      disconnect,
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
    } as unknown as ReturnType<typeof wagmi.useDisconnect>);

    render(<WalletOptions />);
    // Wait for the mount effect so the connected branch (isMounted && isConnected) renders.
    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("0x1234...5678"));
    openDropdown();

    fireEvent.click(await screen.findByText("walletoptions.disconnect"));
    expect(disconnect).toHaveBeenCalled();
  });
});
