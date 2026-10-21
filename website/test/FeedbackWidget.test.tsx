/**
 * FeedbackWidget tests. The wagmi hooks are the global setup.ts mocks, overridden per test;
 * useLocale is the global key-passthrough mock, so locale strings are asserted by their keys
 * (the AssistantChat tests document this habit). The interaction is quiet-trigger → explain at
 * the moment of commitment → confirm: at rest the widget is five glyphs and nothing else, and
 * the disclosure, details, Send and Cancel appear together once a star is picked. One star
 * pick is sent as one giveFeedback transaction per target, in order — what matters here is
 * that argument shape per agent, the sequential loop, and the honest partial-failure state.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { useAccount, useWriteContract } from "wagmi";
import { useLocale } from "../hooks/useLocale";
import { useWalletConnection } from "../hooks/useWalletConnection";
import { buildAccountData, mockSwitchChainAsync } from "./setup";
import { renderWithQuery } from "./testUtils";
import {
  FeedbackWidget,
  FEEDBACK,
  FEEDBACK_TARGETS,
  REPUTATION_REGISTRY_ABI,
  type FeedbackTarget,
} from "../components/FeedbackWidget";

const mockConnectWallet = vi.fn();
const mockWriteContractAsync = vi.fn();

vi.mock("../hooks/useWalletConnection", () => ({
  useWalletConnection: vi.fn(() => ({
    address: "0x1234567890123456789012345678901234567890" as const,
    hasMounted: true,
    isConnected: true,
    connectWallet: mockConnectWallet,
  })),
}));

/** Builder pattern per setup.ts (`buildAccountData`): the literal is loose, the builder owns the
 *  cast to the wagmi hook's return type. */
function writeContractData() {
  return {
    writeContract: vi.fn(),
    writeContractAsync: mockWriteContractAsync,
    isPending: false,
    error: null,
    data: undefined,
  } as unknown as ReturnType<typeof useWriteContract>;
}

/** The connected, on-Base default every test starts from, with a wallet that confirms every
 *  transaction and returns a distinct hash per submission. */
function connectOnBase() {
  vi.mocked(useAccount).mockReturnValue(buildAccountData({ isConnected: true, chainId: 8453 }));
  vi.mocked(useWriteContract).mockReturnValue(writeContractData());
  let n = 0;
  mockWriteContractAsync.mockImplementation(async () => `0xhash${n++}` as `0x${string}`);
}

const ZERO_HASH = `0x${"0".repeat(64)}`;

const SINGLE: readonly FeedbackTarget[] = [FEEDBACK_TARGETS.assistent];
const BUNDLED: readonly FeedbackTarget[] = [FEEDBACK_TARGETS.assistent, FEEDBACK_TARGETS.search];

function renderWidget(targets: readonly FeedbackTarget[] = SINGLE) {
  return renderWithQuery(<FeedbackWidget targets={targets} />);
}

const stars = () => screen.getAllByRole("button", { name: "assistent.rateStars" });

describe("FeedbackWidget", () => {
  beforeEach(() => {
    connectOnBase();
  });

  it("shows nothing but five stars at rest — no disclosure, no buttons", () => {
    renderWidget();

    // All five star buttons share the mocked label key; the row is asserted by count, not by
    // distinct names.
    expect(stars()).toHaveLength(5);
    expect(screen.queryByText("assistent.rateDisclosure")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "assistent.rateSend" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "assistent.cancel" })).not.toBeInTheDocument();
    expect(screen.queryByText("assistent.rateDetailsSummary")).not.toBeInTheDocument();
  });

  it("reveals the disclosure, details question, Send and Cancel the moment a star is picked", () => {
    renderWidget();

    fireEvent.click(stars()[3]);

    expect(screen.getByText("assistent.rateDisclosure")).toBeInTheDocument();
    expect(screen.getByText("assistent.rateDetailsSummary")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "assistent.rateSend" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "assistent.cancel" })).toBeInTheDocument();

    // The details stay one level deeper until the question is clicked.
    fireEvent.click(screen.getByText("assistent.rateDetailsSummary"));
    expect(screen.getByText("assistent.rateDetailsBody")).toBeInTheDocument();
  });

  it("says the rating covers the web search too when a web tool served the chat", () => {
    renderWidget(BUNDLED);

    fireEvent.click(stars()[3]);

    expect(screen.queryByText("assistent.rateDisclosure")).not.toBeInTheDocument();
    expect(screen.getByText("assistent.rateDisclosureBundled")).toBeInTheDocument();
  });

  it("sends the exact giveFeedback transaction for a 4-star single-target rating", async () => {
    renderWidget(SINGLE);

    fireEvent.click(stars()[3]);
    fireEvent.click(screen.getByRole("button", { name: "assistent.rateSend" }));

    await waitFor(() => expect(screen.getByText("assistent.rateDone")).toBeInTheDocument());
    expect(mockWriteContractAsync).toHaveBeenCalledTimes(1);
    expect(mockWriteContractAsync).toHaveBeenCalledWith({
      address: FEEDBACK.registry,
      abi: REPUTATION_REGISTRY_ABI,
      functionName: "giveFeedback",
      chainId: FEEDBACK.chainId,
      // The EIP-8004 "starred" convention: tag1 names the semantic, value on a 0-100 scale
      // (4 stars -> 80, 5 stars -> 100) — see the widget's args comment.
      args: [97599n, 80n, 0, "starred", "", "https://llm-agent.fretchen.eu", "", ZERO_HASH],
    });
  });

  it("sends one transaction per bundled target, in order, with a link per submission", async () => {
    renderWidget(BUNDLED);

    fireEvent.click(stars()[5 - 1]);
    fireEvent.click(screen.getByRole("button", { name: "assistent.rateSend" }));

    await waitFor(() => expect(screen.getByText("assistent.rateDone")).toBeInTheDocument());
    expect(mockWriteContractAsync).toHaveBeenCalledTimes(2);
    expect(mockWriteContractAsync).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        args: [97599n, 100n, 0, "starred", "", "https://llm-agent.fretchen.eu", "", ZERO_HASH],
      }),
    );
    expect(mockWriteContractAsync).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        args: [97600n, 100n, 0, "starred", "", "https://web-agent.fretchen.eu", "", ZERO_HASH],
      }),
    );

    // One explorer link per submitted transaction, in order. Submission, not inclusion —
    // the links are the status source (see the widget's send comment).
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "https://basescan.org/tx/0xhash0");
    expect(links[1]).toHaveAttribute("href", "https://basescan.org/tx/0xhash1");
    // The stars stay, filled to the picked value, and can no longer be changed.
    expect(stars()[4].textContent).toBe("★");
    expect(stars()[0]).toBeDisabled();
  });

  it("keeps what was submitted and says what failed when the second prompt is rejected", async () => {
    mockWriteContractAsync
      .mockResolvedValueOnce("0xhash0")
      .mockRejectedValueOnce(new Error("User rejected the request"));

    renderWidget(BUNDLED);
    fireEvent.click(stars()[3]);
    fireEvent.click(screen.getByRole("button", { name: "assistent.rateSend" }));

    await waitFor(() => expect(screen.getByText(/assistent\.ratePartialFailed/)).toBeInTheDocument());
    // The assistent's transaction was submitted and is linked; the failed one is not retried.
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getAllByRole("link")[0]).toHaveAttribute("href", "https://basescan.org/tx/0xhash0");
    expect(screen.queryByRole("button", { name: "assistent.rateSend" })).not.toBeInTheDocument();
  });

  it("maps the self-feedback revert to its own sentence and offers no links", async () => {
    mockWriteContractAsync.mockRejectedValueOnce(new Error("execution reverted: Self-feedback not allowed"));

    renderWidget(SINGLE);
    fireEvent.click(stars()[3]);
    fireEvent.click(screen.getByRole("button", { name: "assistent.rateSend" }));

    await waitFor(() => expect(screen.getByText("assistent.rateSelfBlocked")).toBeInTheDocument());
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("truncates any other error to one line", async () => {
    // The passthrough mock returns the key, which contains no {error} placeholder — so this one
    // test overrides it with the real English shape to exercise the replace-and-truncate path.
    vi.mocked(useLocale).mockImplementation(({ label }) =>
      label === "assistent.rateFailed" ? "Rating failed: {error}" : (label as string),
    );
    mockWriteContractAsync.mockRejectedValueOnce(new Error("e".repeat(300)));

    renderWidget(SINGLE);
    fireEvent.click(stars()[3]);
    fireEvent.click(screen.getByRole("button", { name: "assistent.rateSend" }));

    // 200-char cap: the 300-char message arrives as 199 chars plus the ellipsis.
    await waitFor(() => expect(screen.getByText(/^Rating failed: e{199}…$/)).toBeInTheDocument());
  });

  it("Cancel clears the confirm area and empties the stars again", () => {
    renderWidget();

    fireEvent.click(stars()[2]);
    expect(screen.getByText("assistent.rateDisclosure")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "assistent.cancel" }));

    expect(screen.queryByText("assistent.rateDisclosure")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "assistent.rateSend" })).not.toBeInTheDocument();
    // The third star is empty again — the glyph is back to ☆.
    expect(stars()[2].textContent).toBe("☆");
  });

  it("offers a switch to Base once a star is picked on another chain", () => {
    vi.mocked(useAccount).mockReturnValue(buildAccountData({ isConnected: true, chainId: 10 }));
    renderWidget();

    // Nothing asks for a switch at rest — the affordance is a reaction to intent.
    expect(screen.queryByRole("button", { name: "assistent.rateSwitch" })).not.toBeInTheDocument();

    fireEvent.click(stars()[4]);
    fireEvent.click(screen.getByRole("button", { name: "assistent.rateSwitch" }));

    expect(mockSwitchChainAsync).toHaveBeenCalledWith({ chainId: 8453 });
    expect(mockWriteContractAsync).not.toHaveBeenCalled();
  });

  it("asks to connect once a star is picked without a wallet", () => {
    vi.mocked(useWalletConnection).mockReturnValue({
      address: undefined,
      hasMounted: true,
      isConnected: false,
      connectWallet: mockConnectWallet,
    });
    renderWidget();

    // Stars are visible at rest even without a wallet — the prompt is a reaction to intent.
    expect(stars()).toHaveLength(5);
    expect(screen.queryByRole("button", { name: "assistent.rateConnect" })).not.toBeInTheDocument();

    fireEvent.click(stars()[4]);
    fireEvent.click(screen.getByRole("button", { name: "assistent.rateConnect" }));

    expect(mockConnectWallet).toHaveBeenCalledWith("feedback");
  });
});
