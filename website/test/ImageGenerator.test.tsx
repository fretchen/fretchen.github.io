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
  imageGen: {
    compactLayout: "compact-layout",
    compactContainer: "compact-container",
    compactHeader: "compact-header",
    compactTitle: "compact-title",
    compactSubtitle: "compact-subtitle",
    compactForm: "compact-form",
    compactTextarea: "compact-textarea",
    controlBar: "control-bar",
    optionsGroup: "options-group",
    compactSelect: "compact-select",
    compactButton: "compact-button",
    compactButtonDisabled: "compact-button-disabled",
    compactStatus: "compact-status",
    compactError: "compact-error",
  },
  nftCard: {
    checkboxLabel: "checkbox-label",
    checkbox: "checkbox",
  },
  spinner: "spinner",
}));

vi.mock("../styled-system/css", () => ({
  css: vi.fn(() => "mock-css-class"),
}));

vi.mock("../components/InfoIcon", () => ({
  default: vi.fn(() => <div data-testid="info-icon" />),
}));

vi.mock("../components/LocaleText", () => ({
  LocaleText: vi.fn(({ label }) => <span data-testid={`locale-${label}`}>{label}</span>),
}));

vi.mock("../hooks/useLocale", () => ({
  useLocale: vi.fn(() => "mocked text"),
}));

// Mock window.ethereum
const mockEthereum = {
  request: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  global.window = Object.create(window);
  global.window.ethereum = mockEthereum;

  // Default mock implementations
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
    const textarea = screen.getByPlaceholderText("mocked text");
    fireEvent.change(textarea, { target: { value: "Test artwork prompt" } });

    // Simulate user interaction: click the create button (find by test ID)
    const createButton = screen.getByTestId("locale-imagegen.createArtwork");
    fireEvent.click(createButton);

    // Verify that switchChain was called with the correct chain ID
    expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: 10 });
  });
});
