/**
 * ImageGenerator Component Tests
 *
 * This test suite verifies the functionality of the ImageGenerator component,
 * which allows users to create AI-generated artwork and mint it as NFTs on the blockchain.
 *
 * Key Features Tested:
 * - Component rendering with and without props
 * - Automatic chain switching when user is on wrong network
 * - User interaction simulation (form input and button clicks)
 * - Integration with wagmi hooks for blockchain operations
 * - Progressive disclosure: Connect Wallet → Create Artwork flow
 *
 * Testing Strategy:
 * - Mocks external dependencies (wagmi hooks, utilities, styles)
 * - Focuses on component behavior rather than implementation details
 * - Uses semantic selectors (roles, accessible names) for reliable element selection
 * - Simulates real user interactions to test complete workflows
 *
 * Mock Setup:
 * - wagmi hooks: Mocked to simulate blockchain state and operations (useAccount, useChainId, useSwitchChain, useConnect, useReadContract, useWriteContract)
 * - getChain utility: Returns Optimism network (chain ID 10)
 * - Styles: Minimal mocking to avoid brittleness
 * - Locale components: Simplified to return predictable test IDs
 *
 * Test Scenarios:
 * 1. Basic rendering - Verifies component mounts correctly
 * 2. Props handling - Ensures component accepts and uses props
 * 3. Chain switching - Tests automatic network switching before minting
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImageGenerator } from "../components/ImageGenerator";
import { useAccount, useConnect, useWalletClient } from "wagmi";

// No need to mock getChain - it's just reading env vars and returning constants
// The real implementation works fine in tests

vi.mock("../layouts/styles", () => ({
  imageGen: {},
  nftCard: {},
  spinner: "mock-spinner",
  primaryButton: "mock-primary-button",
  primaryButtonDisabled: "mock-primary-button-disabled",
  successMessage: "mock-success-message",
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

describe("ImageGenerator Component", () => {
  describe("Collapsed State (First-time visitors)", () => {
    it("should render collapsed state when wallet is not connected", () => {
      // Mock disconnected wallet to ensure collapsed state
      vi.mocked(useAccount).mockReturnValueOnce({
        address: undefined,
        isConnected: false,
        status: "disconnected",
      } as ReturnType<typeof useAccount>);

      render(<ImageGenerator />);

      // Check for collapsed state content
      expect(screen.getByText(/🎨.*mocked-imagegen\.title/)).toBeInTheDocument();
      expect(screen.getByText(/mocked-imagegen\.collapsedDescription/)).toBeInTheDocument();

      // Should show connect wallet button
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent(/mocked-imagegen\.connectWalletButton/);

      // Should NOT show expanded form elements
      expect(screen.queryByPlaceholderText("mocked-imagegen.promptPlaceholder")).not.toBeInTheDocument();
      expect(screen.queryByTestId("drop-zone")).not.toBeInTheDocument();
    });

    it("should render collapsed state with props", () => {
      const mockProps = {
        apiUrl: "https://test-api.com",
        onSuccess: vi.fn(),
        onError: vi.fn(),
      };

      // Ensure disconnected state
      vi.mocked(useAccount).mockReturnValueOnce({
        address: undefined,
        isConnected: false,
        status: "disconnected",
      } as ReturnType<typeof useAccount>);

      render(<ImageGenerator {...mockProps} />);

      // Should still show collapsed state
      expect(screen.getByText(/🎨.*mocked-imagegen\.title/)).toBeInTheDocument();
      expect(screen.getByRole("button")).toHaveTextContent(/mocked-imagegen\.connectWalletButton/);
    });

    it("should trigger wallet connection when expand button is clicked", async () => {
      // Start in disconnected state (collapsed)
      // Create a new mock that we can track
      const mockConnect = vi.fn();

      vi.mocked(useAccount).mockReturnValue({
        address: undefined,
        isConnected: false,
        status: "disconnected",
      } as ReturnType<typeof useAccount>);

      vi.mocked(useConnect).mockReturnValue({
        connect: mockConnect,
        connectors: [{ id: "mockConnector", name: "Mock Wallet" }],
      } as unknown as ReturnType<typeof useConnect>);

      render(<ImageGenerator />);

      // Verify we start in collapsed state
      expect(screen.getByText(/mocked-imagegen\.collapsedDescription/)).toBeInTheDocument();
      expect(screen.queryByTestId("drop-zone")).not.toBeInTheDocument();

      // Click expand button - should trigger wallet connection
      const expandButton = screen.getByRole("button");
      fireEvent.click(expandButton);

      // Verify wallet connection was attempted
      expect(mockConnect).toHaveBeenCalled();
    });
  });

  describe("Expanded State (Connected users)", () => {
    it("should render expanded state when wallet is connected", () => {
      // Mock connected wallet to ensure expanded state
      vi.mocked(useAccount).mockReturnValue({
        address: "0x1234567890123456789012345678901234567890" as `0x${string}`,
        isConnected: true,
        status: "connected",
      } as ReturnType<typeof useAccount>);

      // Mock wallet client for x402 hook

      vi.mocked(useWalletClient).mockReturnValue({
        data: {
          account: { address: "0x1234567890123456789012345678901234567890" },
          signTypedData: vi.fn(),
        },
      } as ReturnType<typeof useWalletClient>);

      render(<ImageGenerator />);

      // Should show expanded form elements
      expect(screen.getByPlaceholderText("mocked-imagegen.promptPlaceholder")).toBeInTheDocument();
      expect(screen.getByTestId("drop-zone")).toBeInTheDocument();

      // Should show the LocaleText title in expanded form
      expect(screen.getByTestId("locale-imagegen.title")).toBeInTheDocument();

      // Should NOT show collapsed state content
      expect(screen.queryByText(/Create unique AI artwork you actually own/)).not.toBeInTheDocument();
    });
  });

  // Note: Chain switching behavior is tested in useAutoNetwork.test.ts
  // The switchIfNeeded() function is called before transactions and is
  // thoroughly covered there (see "switchIfNeeded() should switch when on wrong network")
});
