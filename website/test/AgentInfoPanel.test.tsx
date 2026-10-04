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
import { render, screen, fireEvent } from "@testing-library/react";
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
  GENAI_NFT_NETWORKS: ["eip155:10", "eip155:11155420"],
}));

// Mock styles
vi.mock("../styled-system/css", () => ({
  css: () => "mock-css-class",
}));

const REGISTRATION_URL = "https://imagegen-agent.fretchen.eu/.well-known/agent-registration.json";

const registeredAgent = {
  name: "Test Agent",
  description: "",
  image: "",
  agentId: 97598,
  agentRegistry: "eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  registrationUrl: REGISTRATION_URL,
  endpointHost: "imagegen-agent.fretchen.eu",
  openApiUrl: "https://imagegen-agent.fretchen.eu/openapi.json",
  supportedTrust: ["reputation"],
  raw: null,
};

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
        agent: { agentId: null },
        isLoading: false,
        error: new Error("Failed to fetch"),
      });

      expect(() => render(<AgentInfoPanel />)).not.toThrow();
      expect(screen.getByText("Optimism")).toBeInTheDocument();
    });

    it("should render without hooks error in success state", () => {
      mockUseAgentInfo.mockReturnValue({
        agent: registeredAgent,
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
        agent: registeredAgent,
        isLoading: false,
        error: null,
      });
      expect(() => rerender(<AgentInfoPanel />)).not.toThrow();

      // Then: error
      mockUseAgentInfo.mockReturnValue({
        agent: { agentId: null },
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
        agent: registeredAgent,
        isLoading: false,
        error: null,
      });

      expect(() => render(<AgentInfoPanel variant="footer" />)).not.toThrow();
    });

    it("should render sidebar variant", () => {
      mockUseAgentInfo.mockReturnValue({
        agent: registeredAgent,
        isLoading: false,
        error: null,
      });

      expect(() => render(<AgentInfoPanel variant="sidebar" />)).not.toThrow();
    });
  });

  describe("Service Types", () => {
    it("should render genimg service", () => {
      mockUseAgentInfo.mockReturnValue({
        agent: registeredAgent,
        isLoading: false,
        error: null,
      });

      expect(() => render(<AgentInfoPanel service="genimg" />)).not.toThrow();
    });

    it("should render llm service", () => {
      mockUseAgentInfo.mockReturnValue({
        agent: registeredAgent,
        isLoading: false,
        error: null,
      });

      expect(() => render(<AgentInfoPanel service="llm" />)).not.toThrow();
    });
  });

  describe("ERC-8004 identity", () => {
    it("shows the agent id instead of a wallet, and links the live registration file", () => {
      mockUseAgentInfo.mockReturnValue({ agent: registeredAgent, isLoading: false, error: null });

      render(<AgentInfoPanel service="genimg" />);
      expect(screen.getByText(/ERC-8004 #97598/)).toBeInTheDocument();

      fireEvent.click(screen.getByText(/ERC-8004 #97598/));
      expect(screen.getByText(/ERC-8004 registration/).closest("a")).toHaveAttribute("href", REGISTRATION_URL);
      expect(document.querySelector('a[href="/agent-registration.json"]')).toBeNull();
    });

    it("falls back to the plain Optimism line while the file lists no registration", () => {
      mockUseAgentInfo.mockReturnValue({
        agent: { ...registeredAgent, agentId: null, agentRegistry: null },
        isLoading: false,
        error: null,
      });

      render(<AgentInfoPanel service="genimg" />);
      expect(screen.queryByText(/ERC-8004 #/)).toBeNull();
      expect(screen.getByText("Optimism")).toBeInTheDocument();
    });
  });
});
