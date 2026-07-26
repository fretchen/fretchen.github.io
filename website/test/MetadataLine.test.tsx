import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, act } from "@testing-library/react";
import { renderWithQuery } from "./testUtils";
import MetadataLine from "../components/MetadataLine";
import React from "react";
import "@testing-library/jest-dom";

// Mock vike-react/usePageContext
vi.mock("vike-react/usePageContext", () => ({
  usePageContext: () => ({
    urlPathname: "/blog/1/",
  }),
}));

// Mock useUmami (used by MetadataLine)
vi.mock("../hooks/useUmami", () => ({
  useUmami: () => ({
    trackEvent: vi.fn(),
    isDisabled: true,
    isDebugMode: false,
  }),
}));

const mockHandleSupport = vi.fn();
const mockSwitchToSupportedChain = vi.fn();
const mockConnectWallet = vi.fn();

// Mutable mock state for useSupportAction so each test can steer isOnSupportedChain
let mockSupportActionState: {
  isOnSupportedChain: boolean;
  errorMessage: string | null;
};

// Mutable mock state for useWalletConnection (the quick-connect hook MetadataLine now
// sources isConnected/connectWallet from, matching ImageGenerator/assistant/growth).
let mockWalletConnectionState: {
  isConnected: boolean;
};

vi.mock("../hooks/useSupportAction", () => ({
  useSupportAction: () => ({
    supportCount: "0",
    isLoading: false,
    isSuccess: false,
    errorMessage: mockSupportActionState.errorMessage,
    isOnSupportedChain: mockSupportActionState.isOnSupportedChain,
    handleSupport: mockHandleSupport,
    switchToSupportedChain: mockSwitchToSupportedChain,
    isReadPending: false,
    readError: null,
  }),
}));

vi.mock("../hooks/useWalletConnection", () => ({
  useWalletConnection: () => ({
    isConnected: mockWalletConnectionState.isConnected,
    connectWallet: mockConnectWallet,
  }),
}));

describe("MetadataLine — unsupported-chain guidance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupportActionState = {
      isOnSupportedChain: true,
      errorMessage: null,
    };
    mockWalletConnectionState = {
      isConnected: true,
    };
  });

  it("clicking Support on a supported chain calls handleSupport directly, no modal", () => {
    renderWithQuery(<MetadataLine showSupport={true} publishingDate="2024-01-01" />);

    fireEvent.click(screen.getByRole("button", { name: /metadataLine\.support/ }));

    expect(mockHandleSupport).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("metadataLine.modalTitle")).not.toBeInTheDocument();
  });

  it("clicking Support on an unsupported chain opens the guided modal instead of donating", () => {
    mockSupportActionState.isOnSupportedChain = false;

    renderWithQuery(<MetadataLine showSupport={true} publishingDate="2024-01-01" />);

    fireEvent.click(screen.getByRole("button", { name: /metadataLine\.support/ }));

    expect(mockHandleSupport).not.toHaveBeenCalled();
    expect(screen.getByText("metadataLine.modalTitle")).toBeInTheDocument();
    expect(screen.getByText("metadataLine.modalBody")).toBeInTheDocument();
    // Motivation line + chain links to learn more
    expect(screen.getByText(/metadataLine\.modalWhy/)).toBeInTheDocument();
    const optimismLink = screen.getByRole("link", { name: "metadataLine.modalLearnMoreOptimism" });
    const baseLink = screen.getByRole("link", { name: "metadataLine.modalLearnMoreBase" });
    expect(optimismLink).toHaveAttribute("href", "https://optimism.io");
    expect(baseLink).toHaveAttribute("href", "https://base.org");
  });

  it("modal's switch button calls switchToSupportedChain", async () => {
    mockSupportActionState.isOnSupportedChain = false;
    mockSwitchToSupportedChain.mockResolvedValue(undefined);

    renderWithQuery(<MetadataLine showSupport={true} publishingDate="2024-01-01" />);

    fireEvent.click(screen.getByRole("button", { name: /metadataLine\.support/ }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "metadataLine.modalSwitchButton" }));
    });

    expect(mockSwitchToSupportedChain).toHaveBeenCalledTimes(1);
  });

  it("modal can be dismissed via the ✕ close button", () => {
    mockSupportActionState.isOnSupportedChain = false;

    renderWithQuery(<MetadataLine showSupport={true} publishingDate="2024-01-01" />);

    fireEvent.click(screen.getByRole("button", { name: /metadataLine\.support/ }));
    expect(screen.getByText("metadataLine.modalTitle")).toBeInTheDocument();

    // The shared Modal shell's ✕ carries the localized close aria-label (echoed as the raw
    // key by the global useLocale mock in test/setup.ts).
    fireEvent.click(screen.getByRole("button", { name: "metadataLine.modalCloseAria" }));
    expect(screen.queryByText("metadataLine.modalTitle")).not.toBeInTheDocument();
  });

  it("triggers the wallet connect flow when disconnected, instead of doing nothing", () => {
    mockWalletConnectionState.isConnected = false;

    renderWithQuery(<MetadataLine showSupport={true} publishingDate="2024-01-01" />);

    fireEvent.click(screen.getByRole("button", { name: /metadataLine\.support/ }));

    expect(mockConnectWallet).toHaveBeenCalledWith("support");
    expect(mockHandleSupport).not.toHaveBeenCalled();
    expect(screen.queryByText("metadataLine.modalTitle")).not.toBeInTheDocument();
  });
});
