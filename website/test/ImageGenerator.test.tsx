import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImageGenerator } from "../components/ImageGenerator";

// Mock wagmi hooks
const mockUseAccount = vi.fn();
const mockUseChainId = vi.fn();
const mockUseSwitchChain = vi.fn();
const mockUseReadContract = vi.fn();
const mockUseWriteContract = vi.fn();

vi.mock("wagmi", () => ({
  useAccount: () => mockUseAccount(),
  useChainId: () => mockUseChainId(),
  useSwitchChain: () => mockUseSwitchChain(),
  useReadContract: () => mockUseReadContract(),
  useWriteContract: () => mockUseWriteContract(),
}));

// Mock other dependencies
vi.mock("../utils/getChain", () => ({
  getChain: vi.fn(() => ({ id: 10 })), // Optimism chain ID
  getGenAiNFTContractConfig: vi.fn(() => ({
    address: "0x1234567890123456789012345678901234567890",
    abi: [],
  })),
}));

vi.mock("../layouts/styles", () => ({
  imageGen: {},
  nftCard: {},
  spinner: "mock-spinner",
}));

vi.mock("../styled-system/css", () => ({
  css: () => "mock-css-class",
}));

vi.mock("../components/LocaleText", () => ({
  LocaleText: ({ label }: { label: string }) => <span data-testid={`locale-${label}`}>{label}</span>,
}));

vi.mock("../hooks/useLocale", () => ({
  useLocale: ({ label }: { label: string }) => `mocked-${label}`,
}));

// Mock window.ethereum
beforeEach(() => {
  vi.clearAllMocks();

  // Mock window.ethereum for blockchain interactions
  global.window = Object.create(window);
  global.window.ethereum = { request: vi.fn() };

  // Set up default wagmi hook mocks
  mockUseAccount.mockReturnValue({
    address: "0x1234567890123456789012345678901234567890",
    isConnected: true,
  });

  mockUseChainId.mockReturnValue(1); // Wrong chain (not Optimism)
  mockUseSwitchChain.mockReturnValue({
    switchChain: vi.fn(),
    isPending: false,
  });

  mockUseReadContract.mockReturnValue({
    data: BigInt("10000000000000000"), // 0.01 ETH in wei
  });

  mockUseWriteContract.mockReturnValue({
    writeContractAsync: vi.fn(),
  });
});

describe("ImageGenerator Component", () => {
  it("should render ImageGenerator component", () => {
    render(<ImageGenerator />);

    expect(screen.getByTestId("locale-imagegen.title")).toBeInTheDocument();
  });

  it("should render with props", () => {
    const mockProps = {
      apiUrl: "https://test-api.com",
      onSuccess: vi.fn(),
      onError: vi.fn(),
    };

    render(<ImageGenerator {...mockProps} />);

    expect(screen.getByTestId("locale-imagegen.title")).toBeInTheDocument();
  });

  it("should call switchChain when user attempts to create artwork on wrong network", async () => {
    const mockSwitchChain = vi.fn().mockResolvedValue(undefined);
    mockUseSwitchChain.mockReturnValue({
      switchChain: mockSwitchChain,
      isPending: false,
    });

    render(<ImageGenerator />);

    // Simulate user interaction: fill in the prompt
    const textarea = screen.getByPlaceholderText("mocked-imagegen.promptPlaceholder");
    fireEvent.change(textarea, { target: { value: "Test artwork prompt" } });

    // Simulate user interaction: click the create button (find by test ID)
    const createButton = screen.getByTestId("locale-imagegen.createArtwork");
    fireEvent.click(createButton);

    // Verify that switchChain was called with the correct chain ID
    expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: 10 });
  });
});
