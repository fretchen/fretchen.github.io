/**
 * AssistantChat Component Tests
 *
 * Renders the real component and mocks useX402Chat / useWalletConnection /
 * useAutoNetwork (the SDK-level mocking already lives in useX402Chat.test.ts) —
 * this file is about UI behavior: typing, sending, message rendering, the
 * payment-receipt link, and error surfacing.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockSendMessage = vi.fn();
const mockConnectWallet = vi.fn();
const mockSwitchIfNeeded = vi.fn();

vi.mock("../hooks/useX402Chat", () => ({
  useX402Chat: vi.fn(() => ({
    sendMessage: mockSendMessage,
    status: "idle",
    error: null,
    paymentReceipt: null,
    reset: vi.fn(),
    isReady: true,
    paymentNetwork: "eip155:10",
  })),
  DEFAULT_LLM_AGENT_URL: "https://llm-agent.fretchen.eu",
}));

vi.mock("../hooks/x402Discovery", () => ({
  fetchAgentCard: vi.fn(() => Promise.resolve(null)),
  precheckLlmV1Agent: vi.fn(() => Promise.resolve({ ok: false, reason: "nope" })),
}));

vi.mock("../hooks/useWalletConnection", () => ({
  useWalletConnection: vi.fn(() => ({
    address: "0x1234567890123456789012345678901234567890",
    hasMounted: true,
    isConnected: true,
    connectWallet: mockConnectWallet,
  })),
}));

vi.mock("../hooks/useAutoNetwork", () => ({
  useAutoNetwork: vi.fn(() => ({
    network: "eip155:8453",
    isOnCorrectNetwork: true,
    switchIfNeeded: mockSwitchIfNeeded,
    switchError: null,
  })),
}));

vi.mock("../hooks/useUmami", () => ({
  useUmami: () => ({ trackEvent: vi.fn() }),
}));

vi.mock("../components/AgentInfoPanel", () => ({
  AgentInfoPanel: () => null,
}));

import { AssistantChat } from "../components/AssistantChat";
import { precheckLlmV1Agent } from "../hooks/x402Discovery";
import { useX402Chat } from "../hooks/useX402Chat";
import { useWalletConnection } from "../hooks/useWalletConnection";
import { useAutoNetwork } from "../hooks/useAutoNetwork";

function sendUserMessage(text: string) {
  fireEvent.change(screen.getByPlaceholderText("assistent.placeholder"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: /assistent\.send/ }));
}

describe("AssistantChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSwitchIfNeeded.mockResolvedValue(true);
    mockSendMessage.mockResolvedValue({
      choices: [{ message: { role: "assistant", content: "Paris is the capital of France." } }],
    });
    vi.mocked(useX402Chat).mockReturnValue({
      sendMessage: mockSendMessage,
      status: "idle",
      error: null,
      paymentReceipt: null,
      reset: vi.fn(),
      isReady: true,
      paymentNetwork: "eip155:10",
    });
    vi.mocked(useWalletConnection).mockReturnValue({
      address: "0x1234567890123456789012345678901234567890",
      hasMounted: true,
      isConnected: true,
      connectWallet: mockConnectWallet,
    });
    vi.mocked(useAutoNetwork).mockReturnValue({
      network: "eip155:8453",
      isOnCorrectNetwork: true,
      switchIfNeeded: mockSwitchIfNeeded,
      switchError: null,
    });
  });

  it("sends the full conversation as the prompt, including the system prompt", async () => {
    render(<AssistantChat />);

    sendUserMessage("What is the capital of France?");

    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledOnce());

    const prompt = mockSendMessage.mock.calls[0][0] as { role: string; content: string }[];
    expect(prompt[0]).toEqual({ role: "system", content: "assistent.systemPrompt" });
    expect(prompt[prompt.length - 1]).toEqual({ role: "user", content: "What is the capital of France?" });
  });

  it("renders the assistant's reply as a message bubble", async () => {
    render(<AssistantChat />);

    sendUserMessage("What is the capital of France?");

    await waitFor(() => {
      expect(screen.getByText("Paris is the capital of France.")).toBeInTheDocument();
    });
  });

  it("switches the network before paying", async () => {
    render(<AssistantChat />);

    sendUserMessage("Hi");

    await waitFor(() => expect(mockSwitchIfNeeded).toHaveBeenCalledOnce());
    expect(mockSendMessage).toHaveBeenCalled();
  });

  it("shows an error bubble with the real switch-failure reason instead of a generic message", async () => {
    mockSwitchIfNeeded.mockResolvedValue(false);
    vi.mocked(useAutoNetwork).mockReturnValue({
      network: "eip155:8453",
      isOnCorrectNetwork: false,
      switchIfNeeded: mockSwitchIfNeeded,
      switchError: "Unrecognized chain ID, please add it in your wallet first",
    });

    render(<AssistantChat />);

    sendUserMessage("Hi");

    await waitFor(() => {
      expect(screen.getByText(/Unrecognized chain ID, please add it in your wallet first/)).toBeInTheDocument();
    });
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("does not call sendMessage when the wallet is disconnected, and prompts connect instead", () => {
    vi.mocked(useWalletConnection).mockReturnValue({
      address: undefined,
      hasMounted: true,
      isConnected: false,
      connectWallet: mockConnectWallet,
    });

    render(<AssistantChat />);

    fireEvent.change(screen.getByPlaceholderText("assistent.placeholder"), { target: { value: "Hi" } });
    fireEvent.click(screen.getByRole("button", { name: /connectWalletMessage/ }));

    expect(mockConnectWallet).toHaveBeenCalledWith("assistant-v2", expect.objectContaining({ hasInput: true }));
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("renders a network-aware payment receipt link after a successful message", async () => {
    vi.mocked(useX402Chat).mockReturnValue({
      sendMessage: mockSendMessage,
      status: "success",
      error: null,
      paymentReceipt: { transaction: "0xdeposit", network: "eip155:8453" },
      reset: vi.fn(),
      isReady: true,
      paymentNetwork: "eip155:8453",
    });

    render(<AssistantChat />);

    const link = screen.getByRole("link", { name: /assistent\.viewPayment/ });
    expect(link).toHaveAttribute("href", "https://basescan.org/tx/0xdeposit");
  });

  it("does not render a payment receipt link before any payment has settled", () => {
    render(<AssistantChat />);

    expect(screen.queryByRole("link", { name: /assistent\.viewPayment/ })).not.toBeInTheDocument();
  });

  /**
   * The network picker. A channel is per (network, receiver) and each one escrows $0.50, so
   * "the choice sticks" is the assertion that actually protects the user's money — without
   * it they'd silently open a second channel on the other chain.
   */
  describe("network picker", () => {
    beforeEach(() => window.localStorage.clear());

    it("defaults to Optimism and pays on it", () => {
      render(<AssistantChat />);

      expect(useX402Chat).toHaveBeenCalledWith("eip155:10", "https://llm-agent.fretchen.eu");
    });

    it("persists the chosen network and pays on it", async () => {
      render(<AssistantChat />);

      fireEvent.click(screen.getByRole("button", { name: "Base" }));

      await waitFor(() => expect(useX402Chat).toHaveBeenLastCalledWith("eip155:8453", "https://llm-agent.fretchen.eu"));
      expect(window.localStorage.getItem("x402-chat-network")).toBe("eip155:8453");
    });

    it("restores a stored choice on the next visit", async () => {
      window.localStorage.setItem("x402-chat-network", "eip155:8453");

      render(<AssistantChat />);

      await waitFor(() => expect(useX402Chat).toHaveBeenLastCalledWith("eip155:8453", "https://llm-agent.fretchen.eu"));
    });

    it("ignores a stored network the site no longer supports", async () => {
      window.localStorage.setItem("x402-chat-network", "eip155:84532");

      render(<AssistantChat />);

      await waitFor(() => expect(useX402Chat).toHaveBeenLastCalledWith("eip155:10", "https://llm-agent.fretchen.eu"));
    });

    it("explains itself when the agent forced a different network than the one chosen", () => {
      // Chose Optimism (the default) but the hook negotiated down to Base — the user is
      // paying on a chain they didn't pick, so the UI has to say so.
      vi.mocked(useX402Chat).mockReturnValue({
        sendMessage: mockSendMessage,
        status: "idle",
        error: null,
        paymentReceipt: null,
        reset: vi.fn(),
        isReady: true,
        paymentNetwork: "eip155:8453",
      });

      render(<AssistantChat />);

      expect(screen.getByText(/assistent\.networkFallback Base/)).toBeInTheDocument();
    });
  });

  /**
   * The custom-agent escape hatch. It is also the only ready-made batch-settlement client,
   * so builders following /agent-onboarding use it to pay their own agent end-to-end —
   * which makes "the pasted URL is what actually gets paid" the load-bearing assertion here.
   */
  describe("custom agent selection", () => {
    const CUSTOM_URL = "https://another-agent.example";
    const CUSTOM_CARD = {
      origin: CUSTOM_URL,
      title: "Another agent",
      operator: "Someone Else",
      contactUrl: null,
      payTo: "0xabcdef0123456789abcdef0123456789abcdef01",
      network: "eip155:8453",
    };

    function pasteAndTry(url: string) {
      fireEvent.change(screen.getByPlaceholderText("https://another-agent.example"), { target: { value: url } });
      fireEvent.click(screen.getByRole("button", { name: "Use this agent" }));
    }

    it("renders the selector and pays the default agent until one is chosen", () => {
      render(<AssistantChat />);

      expect(screen.getByPlaceholderText("https://another-agent.example")).toBeInTheDocument();
      expect(useX402Chat).toHaveBeenCalledWith("eip155:10", "https://llm-agent.fretchen.eu");
    });

    it("pre-checks a pasted URL and then pays that agent instead", async () => {
      vi.mocked(precheckLlmV1Agent).mockResolvedValue({ ok: true, card: CUSTOM_CARD });

      render(<AssistantChat />);
      pasteAndTry(CUSTOM_URL);

      await waitFor(() => expect(precheckLlmV1Agent).toHaveBeenCalledWith(CUSTOM_URL));
      await waitFor(() => expect(useX402Chat).toHaveBeenLastCalledWith("eip155:10", CUSTOM_URL));
      // Provenance of who is about to be paid.
      expect(screen.getByText("Someone Else")).toBeInTheDocument();
    });

    it("shows the reason and keeps the default agent when the pre-check fails", async () => {
      vi.mocked(precheckLlmV1Agent).mockResolvedValue({
        ok: false,
        reason: "Expected a 402 payment challenge, got 200.",
      });

      render(<AssistantChat />);
      pasteAndTry("https://not-an-agent.example");

      expect(await screen.findByText(/Expected a 402 payment challenge/)).toBeInTheDocument();
      expect(useX402Chat).not.toHaveBeenCalledWith(expect.anything(), "https://not-an-agent.example");
    });

    it("returns to the default agent", async () => {
      vi.mocked(precheckLlmV1Agent).mockResolvedValue({ ok: true, card: CUSTOM_CARD });

      render(<AssistantChat />);
      pasteAndTry(CUSTOM_URL);

      const back = await screen.findByRole("button", { name: "Back to default agent" });
      fireEvent.click(back);

      await waitFor(() => expect(useX402Chat).toHaveBeenLastCalledWith("eip155:10", "https://llm-agent.fretchen.eu"));
    });
  });
});
