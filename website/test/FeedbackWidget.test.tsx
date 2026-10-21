/**
 * FeedbackWidget tests. The wagmi hooks are the global setup.ts mocks, overridden per test;
 * useLocale is the global key-passthrough mock, so locale strings are asserted by their keys
 * (the AssistantChat tests document this habit). What matters here is the on-chain argument
 * shape — the widget's whole job is one correct giveFeedback transaction.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useLocale } from "../hooks/useLocale";
import { useWalletConnection } from "../hooks/useWalletConnection";
import { buildAccountData, mockSwitchChainAsync } from "./setup";
import { renderWithQuery } from "./testUtils";
import { FeedbackWidget, FEEDBACK, FEEDBACK_TARGETS, REPUTATION_REGISTRY_ABI } from "../components/FeedbackWidget";

const mockConnectWallet = vi.fn();

vi.mock("../hooks/useWalletConnection", () => ({
  useWalletConnection: vi.fn(() => ({
    address: "0x1234567890123456789012345678901234567890" as const,
    hasMounted: true,
    isConnected: true,
    connectWallet: mockConnectWallet,
  })),
}));

const mockWriteContract = vi.fn();

/** Builder pattern per setup.ts (`buildAccountData`): the literal is loose, the builder owns the
 *  cast to the wagmi hook's return type. */
function writeContractData(overrides: { isPending?: boolean; error?: Error | null; data?: `0x${string}` } = {}) {
  return {
    writeContract: mockWriteContract,
    writeContractAsync: vi.fn(),
    isPending: false,
    error: null,
    data: undefined,
    ...overrides,
  } as unknown as ReturnType<typeof useWriteContract>;
}

function receiptData(overrides: { isLoading?: boolean; isSuccess?: boolean } = {}) {
  return { isLoading: false, isSuccess: false, data: undefined, ...overrides } as unknown as ReturnType<
    typeof useWaitForTransactionReceipt
  >;
}

/** The connected, on-Base default every test starts from. */
function connectOnBase() {
  vi.mocked(useAccount).mockReturnValue(buildAccountData({ isConnected: true, chainId: 8453 }));
  vi.mocked(useWriteContract).mockReturnValue(writeContractData());
  vi.mocked(useWaitForTransactionReceipt).mockReturnValue(receiptData());
}

const ZERO_HASH = `0x${"0".repeat(64)}`;

function renderWidget() {
  return renderWithQuery(
    <FeedbackWidget agentId={FEEDBACK_TARGETS.assistent.agentId} endpoint={FEEDBACK_TARGETS.assistent.endpoint} />,
  );
}

describe("FeedbackWidget", () => {
  beforeEach(() => {
    connectOnBase();
  });

  it("renders five stars, the pre-send disclosure, and the details block", () => {
    renderWidget();

    // All five star buttons share the mocked label key; the {n} placeholder is only filled in
    // the real locale, so the row is asserted by count, not by distinct names.
    expect(screen.getAllByRole("button", { name: "assistent.rateStars" })).toHaveLength(5);
    expect(screen.getByText("assistent.rateDisclosure")).toBeInTheDocument();
    expect(screen.getByText("assistent.rateDetailsSummary")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "assistent.rateSend" })).toBeDisabled();
  });

  it("sends the exact giveFeedback transaction for a 4-star rating of the assistent", () => {
    renderWidget();

    fireEvent.click(screen.getAllByRole("button", { name: "assistent.rateStars" })[3]);
    fireEvent.click(screen.getByRole("button", { name: "assistent.rateSend" }));

    expect(mockWriteContract).toHaveBeenCalledWith({
      address: FEEDBACK.registry,
      abi: REPUTATION_REGISTRY_ABI,
      functionName: "giveFeedback",
      chainId: FEEDBACK.chainId,
      args: [97599n, 4n, 0, "", "", "https://llm-agent.fretchen.eu", "", ZERO_HASH],
    });
  });

  it("records the search service's endpoint and agentId when rating it", () => {
    renderWithQuery(
      <FeedbackWidget agentId={FEEDBACK_TARGETS.search.agentId} endpoint={FEEDBACK_TARGETS.search.endpoint} />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "assistent.rateStars" })[4]);
    fireEvent.click(screen.getByRole("button", { name: "assistent.rateSend" }));

    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        args: [97600n, 5n, 0, "", "", "https://web-agent.fretchen.eu", "", ZERO_HASH],
      }),
    );
  });

  it("offers a switch to Base when the wallet is on another chain", () => {
    vi.mocked(useAccount).mockReturnValue(buildAccountData({ isConnected: true, chainId: 10 }));
    renderWidget();

    const switchButton = screen.getByRole("button", { name: "assistent.rateSwitch" });
    fireEvent.click(switchButton);

    expect(mockSwitchChainAsync).toHaveBeenCalledWith({ chainId: 8453 });
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it("maps the self-feedback revert to its own sentence", () => {
    vi.mocked(useWriteContract).mockReturnValue(
      writeContractData({ error: new Error("execution reverted: Self-feedback not allowed") }),
    );
    renderWidget();

    expect(screen.getByText("assistent.rateSelfBlocked")).toBeInTheDocument();
  });

  it("truncates any other error to one line", () => {
    // The passthrough mock returns the key, which contains no {error} placeholder — so this one
    // test overrides it with the real English shape to exercise the replace-and-truncate path.
    vi.mocked(useLocale).mockImplementation(({ label }) =>
      label === "assistent.rateFailed" ? "Rating failed: {error}" : (label as string),
    );
    vi.mocked(useWriteContract).mockReturnValue(writeContractData({ error: new Error("e".repeat(300)) }));
    renderWidget();

    // 200-char cap: the 300-char message arrives as 199 chars plus the ellipsis.
    expect(screen.getByText(/^Rating failed: e{199}…$/)).toBeInTheDocument();
  });

  it("shows the confirmed state with a basescan link once the transaction lands", () => {
    const hash = "0xabc123" as `0x${string}`;
    vi.mocked(useWriteContract).mockReturnValue(writeContractData({ data: hash }));
    vi.mocked(useWaitForTransactionReceipt).mockReturnValue(receiptData({ isSuccess: true }));
    renderWidget();

    expect(screen.getByText("assistent.rateDone")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", `https://basescan.org/tx/${hash}`);
  });

  it("asks to connect when no wallet is connected", () => {
    vi.mocked(useWalletConnection).mockReturnValue({
      address: undefined,
      hasMounted: true,
      isConnected: false,
      connectWallet: mockConnectWallet,
    });
    renderWidget();

    fireEvent.click(screen.getByRole("button", { name: "assistent.rateConnect" }));
    expect(mockConnectWallet).toHaveBeenCalledWith("feedback");
  });
});
