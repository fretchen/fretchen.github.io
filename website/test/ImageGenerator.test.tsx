import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageGenerator } from "../components/ImageGenerator";

// Mock wagmi hooks
const mockUseAccount = vi.fn();
const mockUseReadContract = vi.fn();
const mockUseWriteContract = vi.fn();

vi.mock("wagmi", () => ({
  useAccount: () => mockUseAccount(),
  useReadContract: () => mockUseReadContract(),
  useWriteContract: () => mockUseWriteContract(),
}));

// Mock utils
const mockGetChain = vi.fn();
const mockGetGenAiNFTContractConfig = vi.fn();

vi.mock("../utils/getChain", () => ({
  getChain: () => mockGetChain(),
  getGenAiNFTContractConfig: () => mockGetGenAiNFTContractConfig(),
}));

// Mock window.ethereum
Object.defineProperty(window, "ethereum", {
  value: {
    request: vi.fn(),
  },
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

describe("ImageGenerator Component", () => {
  const mockContractConfig = {
    address: "0xTestContract",
    abi: [],
  };

  const mockChain = {
    id: 10,
    name: "Optimism",
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Set up default mock returns
    mockGetGenAiNFTContractConfig.mockReturnValue(mockContractConfig);
    mockGetChain.mockReturnValue(mockChain);

    mockUseAccount.mockReturnValue({
      address: "0x123456789abcdef",
      isConnected: true,
    });

    mockUseReadContract.mockReturnValue({
      data: BigInt("10000000000000000"), // 0.01 ETH
      error: null,
      isLoading: false,
    });

    mockUseWriteContract.mockReturnValue({
      writeContractAsync: vi.fn(),
      isPending: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders the basic component structure", () => {
      render(<ImageGenerator />);

      expect(screen.getByText("Create Your Image")).toBeInTheDocument();
      expect(screen.getByText("Your Generated Image")).toBeInTheDocument();
      expect(screen.getByText("Enter a descriptive prompt below")).toBeInTheDocument();
      expect(screen.getByText('Click "Mint & Generate" (costs ~10¢ in ETH)')).toBeInTheDocument();
      expect(screen.getByText("Wait ~30s for your image to appear")).toBeInTheDocument();
    });

    it("renders the prompt textarea", () => {
      render(<ImageGenerator />);

      const textarea = screen.getByPlaceholderText(/Describe your image in detail/);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute("placeholder", expect.stringContaining("A futuristic city skyline"));
    });

    it("renders the mint button", () => {
      render(<ImageGenerator />);

      const button = screen.getByRole("button", { name: "Mint & Generate" });
      expect(button).toBeInTheDocument();
    });

    it("shows placeholder message when no image is generated", () => {
      render(<ImageGenerator />);

      expect(screen.getByText("Your image will appear here")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("allows entering text in the prompt textarea", () => {
      render(<ImageGenerator />);

      const textarea = screen.getByPlaceholderText(/Describe your image in detail/);
      fireEvent.change(textarea, { target: { value: "A beautiful sunset" } });

      expect(textarea).toHaveValue("A beautiful sunset");
    });

    it("shows visual feedback when wallet is not connected", () => {
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false,
      });

      render(<ImageGenerator />);

      const button = screen.getByRole("button", { name: "Mint & Generate" });
      expect(button).not.toBeDisabled(); // Button is clickable but shows error when clicked
      expect(screen.getByText("Connect your wallet to create an NFT")).toBeInTheDocument();
    });

    it("shows visual feedback when prompt is empty", () => {
      render(<ImageGenerator />);

      const button = screen.getByRole("button", { name: "Mint & Generate" });
      expect(button).not.toBeDisabled(); // Button is clickable but shows error when clicked
    });

    it("enables button when wallet is connected and prompt is provided", () => {
      render(<ImageGenerator />);

      const textarea = screen.getByPlaceholderText(/Describe your image in detail/);
      fireEvent.change(textarea, { target: { value: "A test prompt" } });

      const button = screen.getByRole("button", { name: "Mint & Generate" });
      expect(button).not.toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    it("shows error when wallet is not connected", async () => {
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false,
      });

      const onError = vi.fn();
      render(<ImageGenerator onError={onError} />);

      const textarea = screen.getByPlaceholderText(/Describe your image in detail/);
      fireEvent.change(textarea, { target: { value: "Test prompt" } });

      const button = screen.getByRole("button", { name: "Mint & Generate" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith("Please connect your wallet first");
      });
    });

    it("shows error when prompt is empty", async () => {
      const onError = vi.fn();
      render(<ImageGenerator onError={onError} />);

      const button = screen.getByRole("button", { name: "Mint & Generate" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith("Please enter a prompt");
      });
    });

    it("shows error when mint price is not available", async () => {
      mockUseReadContract.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
      });

      const onError = vi.fn();
      render(<ImageGenerator onError={onError} />);

      const textarea = screen.getByPlaceholderText(/Describe your image in detail/);
      fireEvent.change(textarea, { target: { value: "Test prompt" } });

      const button = screen.getByRole("button", { name: "Mint & Generate" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith("Could not load mint price from contract");
      });
    });
  });

  describe("Blockchain Integration", () => {
    const mockWriteContractAsync = vi.fn();
    const mockTransactionHash = "0x1234567890abcdef";
    const mockTokenId = "123"; // This matches the hex value 0x7b

    beforeEach(() => {
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        isPending: false,
        error: null,
      });

      // Mock successful transaction
      mockWriteContractAsync.mockResolvedValue(mockTransactionHash);

      // Mock ethereum.request for transaction receipt
      vi.mocked(window.ethereum.request).mockResolvedValue({
        logs: [
          {
            topics: [
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              "0x0000000000000000000000000000000000000000000000000000000000000000",
              "0x000000000000000000000000123456789abcdef000000000000000000000000",
              "0x000000000000000000000000000000000000000000000000000000000000007b", // 123 in hex
            ],
          },
        ],
      });
    });

    it("calls writeContractAsync with correct parameters", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ image_url: "https://example.com/image.png" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      render(<ImageGenerator />);

      const textarea = screen.getByPlaceholderText(/Describe your image in detail/);
      fireEvent.change(textarea, { target: { value: "Test prompt" } });

      const button = screen.getByRole("button", { name: "Mint & Generate" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockWriteContractAsync).toHaveBeenCalledWith({
          ...mockContractConfig,
          functionName: "safeMint",
          args: [expect.stringMatching(/^ipfs:\/\/tempURI\/\d+$/)],
          value: BigInt("10000000000000000"),
          chainId: 10,
        });
      });
    });

    it("handles successful minting and image generation", async () => {
      const mockFetch = vi.mocked(global.fetch);
      const mockImageUrl = "https://example.com/generated-image.png";

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ image_url: mockImageUrl }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const onSuccess = vi.fn();
      render(<ImageGenerator onSuccess={onSuccess} />);

      const textarea = screen.getByPlaceholderText(/Describe your image in detail/);
      fireEvent.change(textarea, { target: { value: "Test prompt" } });

      const button = screen.getByRole("button", { name: "Mint & Generate" });
      fireEvent.click(button);

      // Should show minting status
      await waitFor(() => {
        expect(screen.getByText("Creating your NFT...")).toBeInTheDocument();
      });

      // Should show generating status or success message (since it happens quickly)
      await waitFor(() => {
        const hasGeneratingText = screen.queryByText("Generating your image...");
        const hasSuccessText = screen.queryByText("🎉 NFT successfully created!");
        expect(hasGeneratingText || hasSuccessText).toBeTruthy();
      });

      // Should call onSuccess callback
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(BigInt(mockTokenId), mockImageUrl);
      });

      // Should display success message
      await waitFor(() => {
        expect(screen.getByText("🎉 NFT successfully created!")).toBeInTheDocument();
        expect(screen.getByText(mockTokenId.toString())).toBeInTheDocument();
      });
    });

    it("handles API errors gracefully", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue(
        new Response("Internal Server Error", {
          status: 500,
          statusText: "Internal Server Error",
        }),
      );

      const onError = vi.fn();
      render(<ImageGenerator onError={onError} />);

      const textarea = screen.getByPlaceholderText(/Describe your image in detail/);
      fireEvent.change(textarea, { target: { value: "Test prompt" } });

      const button = screen.getByRole("button", { name: "Mint & Generate" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith("Error: 500 Internal Server Error");
      });
    });
  });

  describe("Custom API URL", () => {
    it("uses custom API URL when provided", async () => {
      const customApiUrl = "https://custom-api.example.com";
      const mockFetch = vi.mocked(global.fetch);

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ image_url: "https://example.com/image.png" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const mockWriteContractAsync = vi.fn().mockResolvedValue("0x123");
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        isPending: false,
        error: null,
      });

      vi.mocked(window.ethereum.request).mockResolvedValue({
        logs: [
          {
            topics: [
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              "0x0000000000000000000000000000000000000000000000000000000000000000",
              "0x000000000000000000000000123456789abcdef000000000000000000000000",
              "0x000000000000000000000000000000000000000000000000000000000000007b", // 123 in hex
            ],
          },
        ],
      });

      render(<ImageGenerator apiUrl={customApiUrl} />);

      const textarea = screen.getByPlaceholderText(/Describe your image in detail/);
      fireEvent.change(textarea, { target: { value: "Test prompt" } });

      const button = screen.getByRole("button", { name: "Mint & Generate" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining(customApiUrl));
      });
    });
  });

  describe("Component States", () => {
    it("shows loading state during minting", async () => {
      const mockWriteContractAsync = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve("0x123"), 100)));

      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        isPending: false,
        error: null,
      });

      render(<ImageGenerator />);

      const textarea = screen.getByPlaceholderText(/Describe your image in detail/);
      fireEvent.change(textarea, { target: { value: "Test prompt" } });

      const button = screen.getByRole("button", { name: "Mint & Generate" });
      fireEvent.click(button);

      // Should show loading state immediately
      expect(screen.getAllByText("Creating NFT...").length).toBeGreaterThan(0);
      expect(screen.getByText("Confirm the transaction in your wallet")).toBeInTheDocument();
    });

    it("disables form elements during loading", async () => {
      const mockWriteContractAsync = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve("0x123"), 100)));

      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        isPending: false,
        error: null,
      });

      render(<ImageGenerator />);

      const textarea = screen.getByPlaceholderText(/Describe your image in detail/);
      fireEvent.change(textarea, { target: { value: "Test prompt" } });

      const button = screen.getByRole("button", { name: "Mint & Generate" });
      fireEvent.click(button);

      // Should disable textarea and button during loading
      expect(textarea).toBeDisabled();
      expect(button).toBeDisabled();
    });
  });
});
