/**
 * AgentInfoPanel Component Tests
 *
 * Ensures the component renders correctly under all states (loading, error, success)
 * without violating React hooks rules.
 *
 * Bug Prevention: This test catches the "Rendered more hooks than during previous render"
 * error that occurs when hooks are called after early returns.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgentInfoPanel } from "../components/AgentInfoPanel";

// Mock useAgentInfo with different states
const mockUseAgentInfo = vi.fn();
vi.mock("../hooks/useAgentInfo", () => ({
  useAgentInfo: () => mockUseAgentInfo(),
}));

// Mock useLocale
vi.mock("../hooks/useLocale", () => ({
  useLocale: vi.fn(() => "Powered by"),
}));

// Mock useAutoNetwork - must be called consistently regardless of early returns
vi.mock("../hooks/useAutoNetwork", () => ({
  useAutoNetwork: vi.fn(() => ({
    network: "eip155:10",
    isOnCorrectNetwork: true,
    switchIfNeeded: vi.fn(() => Promise.resolve(true)),
  })),
}));

// Mock chain-utils
vi.mock("@fretchen/chain-utils", () => ({
  getGenAiNFTAddress: vi.fn(() => "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb"),
  getLLMv1Address: vi.fn(() => "0x1234567890123456789012345678901234567890"),
  GENAI_NFT_NETWORKS: ["eip155:10", "eip155:11155420"],
  LLM_V1_NETWORKS: ["eip155:10", "eip155:11155420"],
}));

// Mock styles
vi.mock("../styled-system/css", () => ({
  css: () => "mock-css-class",
}));

describe("AgentInfoPanel Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Hooks Consistency (Bug Prevention)", () => {
    /**
     * This test specifically catches the bug where hooks were called after early returns.
     * React requires hooks to be called in the same order on every render.
     * By testing all three states sequentially, we ensure hooks are always called.
     */
    it("should render without hooks error in loading state", () => {
      mockUseAgentInfo.mockReturnValue({
        agent: {},
        isLoading: true,
        error: null,
      });

      // Should not throw "Rendered more hooks than during previous render"
      expect(() => render(<AgentInfoPanel />)).not.toThrow();
      expect(screen.getByText(/Powered by.*Optimism/)).toBeInTheDocument();
    });

    it("should render without hooks error in error state", () => {
      mockUseAgentInfo.mockReturnValue({
        agent: { wallet: null },
        isLoading: false,
        error: new Error("Failed to fetch"),
      });

      expect(() => render(<AgentInfoPanel />)).not.toThrow();
      expect(screen.getByText("Optimism")).toBeInTheDocument();
    });

    it("should render without hooks error in success state", () => {
      mockUseAgentInfo.mockReturnValue({
        agent: {
          wallet: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
          walletShort: "0xAAEB...239C",
          name: "Test Agent",
          genimgEndpoint: "https://genimg.example.com/api",
          llmEndpoint: "https://llm.example.com/api",
        },
        isLoading: false,
        error: null,
      });

      expect(() => render(<AgentInfoPanel />)).not.toThrow();
    });

    it("should render all states in sequence without hooks error", () => {
      // This test simulates what happens during re-renders with changing state
      // If hooks are called after early returns, this will fail

      // First: loading
      mockUseAgentInfo.mockReturnValue({
        agent: {},
        isLoading: true,
        error: null,
      });
      const { rerender } = render(<AgentInfoPanel />);

      // Then: success
      mockUseAgentInfo.mockReturnValue({
        agent: {
          wallet: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
          walletShort: "0xAAEB...239C",
          genimgEndpoint: "https://genimg.example.com/api",
        },
        isLoading: false,
        error: null,
      });
      expect(() => rerender(<AgentInfoPanel />)).not.toThrow();

      // Then: error
      mockUseAgentInfo.mockReturnValue({
        agent: { wallet: null },
        isLoading: false,
        error: new Error("Network error"),
      });
      expect(() => rerender(<AgentInfoPanel />)).not.toThrow();

      // Back to loading
      mockUseAgentInfo.mockReturnValue({
        agent: {},
        isLoading: true,
        error: null,
      });
      expect(() => rerender(<AgentInfoPanel />)).not.toThrow();
    });
  });

  describe("Variants", () => {
    it("should render footer variant", () => {
      mockUseAgentInfo.mockReturnValue({
        agent: {
          wallet: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
          walletShort: "0xAAEB...239C",
          genimgEndpoint: "https://genimg.example.com/api",
        },
        isLoading: false,
        error: null,
      });

      expect(() => render(<AgentInfoPanel variant="footer" />)).not.toThrow();
    });

    it("should render sidebar variant", () => {
      mockUseAgentInfo.mockReturnValue({
        agent: {
          wallet: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
          walletShort: "0xAAEB...239C",
          genimgEndpoint: "https://genimg.example.com/api",
        },
        isLoading: false,
        error: null,
      });

      expect(() => render(<AgentInfoPanel variant="sidebar" />)).not.toThrow();
    });
  });

  describe("Service Types", () => {
    it("should render genimg service", () => {
      mockUseAgentInfo.mockReturnValue({
        agent: {
          wallet: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
          walletShort: "0xAAEB...239C",
          genimgEndpoint: "https://genimg.example.com/api",
        },
        isLoading: false,
        error: null,
      });

      expect(() => render(<AgentInfoPanel service="genimg" />)).not.toThrow();
    });

    it("should render llm service", () => {
      mockUseAgentInfo.mockReturnValue({
        agent: {
          wallet: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
          walletShort: "0xAAEB...239C",
          llmEndpoint: "https://llm.example.com/api",
        },
        isLoading: false,
        error: null,
      });

      expect(() => render(<AgentInfoPanel service="llm" />)).not.toThrow();
    });
  });
});
