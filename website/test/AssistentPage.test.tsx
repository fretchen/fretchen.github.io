import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { mockConnectedWallet, mockDisconnectedWallet } from "./setup";

// Must be hoisted before the page import so the module factory runs first.
const mockGetAuth = vi.fn().mockResolvedValue("Bearer test-token-123");

vi.mock("../hooks/useWalletAuth", () => ({
  useWalletAuth: vi.fn(() => mockGetAuth),
  clearAuthCacheForTesting: vi.fn(),
}));

vi.mock("../styled-system/css", () => ({
  css: () => "mock-css-class",
}));

vi.mock("../hooks/useUmami", () => ({
  useUmami: () => ({ trackEvent: vi.fn() }),
}));

vi.mock("../components/LeafHistorySidebar", () => ({
  default: () => null,
}));

vi.mock("../components/AgentInfoPanel", () => ({
  AgentInfoPanel: () => null,
}));

import Page from "../pages/assistent/+Page";

describe("AssistentPage — auth wiring", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuth.mockResolvedValue("Bearer test-token-123");
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ content: "Hello from assistant" }),
    });
    vi.stubGlobal("fetch", mockFetch);
    mockConnectedWallet();
  });

  it("sends the Bearer token as Authorization header", async () => {
    render(<Page />);

    fireEvent.change(screen.getByPlaceholderText("assistent.placeholder"), {
      target: { value: "What is quantum computing?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /assistent\.send/ }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce());

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>).Authorization).toBe("Bearer test-token-123");
  });

  it("does not put auth data (address/signature) in the request body", async () => {
    render(<Page />);

    fireEvent.change(screen.getByPlaceholderText("assistent.placeholder"), {
      target: { value: "Tell me about blockchain" },
    });
    fireEvent.click(screen.getByRole("button", { name: /assistent\.send/ }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce());

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string) as Record<string, unknown>;
    expect(body).not.toHaveProperty("auth");
    expect(body).not.toHaveProperty("address");
    expect(body).not.toHaveProperty("signature");
  });

  it("includes the user message in the prompt array", async () => {
    render(<Page />);

    fireEvent.change(screen.getByPlaceholderText("assistent.placeholder"), {
      target: { value: "Explain Merkle trees" },
    });
    fireEvent.click(screen.getByRole("button", { name: /assistent\.send/ }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce());

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string) as {
      data: { prompt: { role: string; content: string }[] };
    };
    expect(body.data.prompt).toEqual(
      expect.arrayContaining([expect.objectContaining({ role: "user", content: "Explain Merkle trees" })]),
    );
  });

  it("shows error bubble in chat when auth fails, and does not call fetch", async () => {
    mockGetAuth.mockRejectedValue(new Error("Wallet not connected"));

    render(<Page />);

    fireEvent.change(screen.getByPlaceholderText("assistent.placeholder"), {
      target: { value: "Hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: /assistent\.send/ }));

    await waitFor(() => {
      expect(screen.getByText(/Wallet not connected/)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not call fetch when wallet is disconnected", () => {
    mockDisconnectedWallet();
    render(<Page />);

    fireEvent.change(screen.getByPlaceholderText("assistent.placeholder"), {
      target: { value: "Hello" },
    });
    // Button is in "connect" state — its label is connectWalletMessage, not send
    fireEvent.click(screen.getByRole("button", { name: /connectWalletMessage/ }));

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
