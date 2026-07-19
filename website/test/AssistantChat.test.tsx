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
  })),
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
    network: "eip155:84532",
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
    mockSendMessage.mockResolvedValue({ content: "Paris is the capital of France." });
    vi.mocked(useX402Chat).mockReturnValue({
      sendMessage: mockSendMessage,
      status: "idle",
      error: null,
      paymentReceipt: null,
      reset: vi.fn(),
      isReady: true,
    });
    vi.mocked(useWalletConnection).mockReturnValue({
      address: "0x1234567890123456789012345678901234567890",
      hasMounted: true,
      isConnected: true,
      connectWallet: mockConnectWallet,
    });
    vi.mocked(useAutoNetwork).mockReturnValue({
      network: "eip155:84532",
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
      network: "eip155:84532",
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
      paymentReceipt: { transaction: "0xdeposit", network: "eip155:84532" },
      reset: vi.fn(),
      isReady: true,
    });

    render(<AssistantChat />);

    const link = screen.getByRole("link", { name: /assistent\.viewPayment/ });
    expect(link).toHaveAttribute("href", "https://sepolia.basescan.org/tx/0xdeposit");
  });

  it("does not render a payment receipt link before any payment has settled", () => {
    render(<AssistantChat />);

    expect(screen.queryByRole("link", { name: /assistent\.viewPayment/ })).not.toBeInTheDocument();
  });
});
