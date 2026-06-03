import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { useAccount, useConnect } from "wagmi";
import { OWNER_ADDRESS } from "../utils/getChain";

// Mock the new TQ-based growth hooks
const mockUseGrowthDrafts = vi.fn();
const mockUseGrowthInsights = vi.fn();
const mockApproveMutateAsync = vi.fn();
const mockRejectMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();
const mockApproveReset = vi.fn();
const mockRejectReset = vi.fn();
const mockUpdateReset = vi.fn();
// Mutable error state for approve mutation (used in tab-switch test)
let mockApproveError: Error | null = null;

vi.mock("../hooks/useGrowthApi", () => ({
  useGrowthDrafts: (...args: unknown[]) => mockUseGrowthDrafts(...args),
  useGrowthInsights: (...args: unknown[]) => mockUseGrowthInsights(...args),
  useApproveDraft: () => ({
    mutateAsync: mockApproveMutateAsync,
    isPending: false,
    error: mockApproveError,
    reset: mockApproveReset,
  }),
  useRejectDraft: () => ({ mutateAsync: mockRejectMutateAsync, isPending: false, error: null, reset: mockRejectReset }),
  useUpdateDraft: () => ({ mutateAsync: mockUpdateMutateAsync, isPending: false, error: null, reset: mockUpdateReset }),
}));

// Mock styled-system
vi.mock("../styled-system/css", () => ({
  css: () => "mock-css-class",
}));

import Page from "../pages/growth/+Page";

const sampleQueue = {
  drafts: [
    {
      id: "draft_1",
      created: "2026-04-12T08:00:00Z",
      channel: "mastodon",
      language: "en",
      content: "Check out this blog post about game theory!",
      source_blog_post: "prisoners_dilemma",
      hashtags: ["#GameTheory", "#Economics"],
      link: "https://fretchen.eu/blog/prisoners_dilemma",
      status: "pending_approval",
      scheduled_at: null,
    },
  ],
  approved: [],
  published: [],
  rejected: [],
};

describe("Growth Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApproveError = null; // reset mutable error state
    mockUseGrowthDrafts.mockReturnValue({ data: sampleQueue, isPending: false, error: null });
    mockUseGrowthInsights.mockReturnValue({
      data: { growth_opportunities: [], last_analysis: null, social_metrics: {}, website_analytics: {} },
      isPending: false,
      error: null,
    });
    mockApproveMutateAsync.mockResolvedValue({ ...sampleQueue.drafts[0], status: "approved" });
    mockRejectMutateAsync.mockResolvedValue({ ...sampleQueue.drafts[0], status: "rejected" });
    mockUpdateMutateAsync.mockResolvedValue({ ...sampleQueue.drafts[0], content: "Updated content" });
  });

  afterEach(() => {
    cleanup();
  });

  it("shows connect prompt when wallet is not connected", () => {
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
      status: "disconnected",
    } as ReturnType<typeof useAccount>);

    vi.mocked(useConnect).mockReturnValue({
      connectors: [{ name: "MetaMask" }],
      connect: vi.fn(),
    } as unknown as ReturnType<typeof useConnect>);

    render(<Page />);
    expect(screen.getByText("Connect your wallet to manage drafts.")).toBeInTheDocument();
    expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
  });

  it("shows owner-only message for wrong address", () => {
    vi.mocked(useAccount).mockReturnValue({
      address: "0x1111111111111111111111111111111111111111",
      isConnected: true,
      status: "connected",
    } as ReturnType<typeof useAccount>);

    render(<Page />);
    expect(screen.getByText("This page is restricted to the site owner.")).toBeInTheDocument();
  });

  it("fetches and renders drafts for owner wallet", async () => {
    vi.mocked(useAccount).mockReturnValue({
      address: OWNER_ADDRESS,
      isConnected: true,
      status: "connected",
    } as ReturnType<typeof useAccount>);

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText("Check out this blog post about game theory!")).toBeInTheDocument();
    });

    expect(screen.getByText("mastodon")).toBeInTheDocument();
    expect(screen.getByText("EN")).toBeInTheDocument();
    expect(screen.getByText("Pending (1)")).toBeInTheDocument();
  });

  it("toggles edit mode with textarea", async () => {
    vi.mocked(useAccount).mockReturnValue({
      address: OWNER_ADDRESS,
      isConnected: true,
      status: "connected",
    } as ReturnType<typeof useAccount>);

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Edit"));

    expect(screen.getByDisplayValue("Check out this blog post about game theory!")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls approveDraft when approve flow is completed", async () => {
    vi.mocked(useAccount).mockReturnValue({
      address: OWNER_ADDRESS,
      isConnected: true,
      status: "connected",
    } as ReturnType<typeof useAccount>);

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText("Approve")).toBeInTheDocument();
    });

    // First click shows schedule input
    fireEvent.click(screen.getByText("Approve"));
    expect(screen.getByText("Confirm Approve")).toBeInTheDocument();

    // Click confirm without schedule
    fireEvent.click(screen.getByText("Confirm Approve"));

    await waitFor(() => {
      expect(mockApproveMutateAsync).toHaveBeenCalledWith({
        id: "draft_1",
        scheduledAt: undefined,
        reviewComment: undefined,
      });
    });
  });

  it("calls rejectDraft when reject is clicked", async () => {
    vi.mocked(useAccount).mockReturnValue({
      address: OWNER_ADDRESS,
      isConnected: true,
      status: "connected",
    } as ReturnType<typeof useAccount>);

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText("Reject")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Reject"));

    await waitFor(() => {
      expect(mockRejectMutateAsync).toHaveBeenCalledWith({ id: "draft_1", reviewComment: undefined });
    });
  });

  it("shows empty state for tabs with no drafts", async () => {
    vi.mocked(useAccount).mockReturnValue({
      address: OWNER_ADDRESS,
      isConnected: true,
      status: "connected",
    } as ReturnType<typeof useAccount>);

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText(/Approved/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Approved/));

    await waitFor(() => {
      expect(screen.getByText(/No approved drafts/)).toBeInTheDocument();
    });
  });

  it("shows error banner when API call fails", async () => {
    mockUseGrowthDrafts.mockReturnValue({ data: undefined, isPending: false, error: new Error("Network error") });

    vi.mocked(useAccount).mockReturnValue({
      address: OWNER_ADDRESS,
      isConnected: true,
      status: "connected",
    } as ReturnType<typeof useAccount>);

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("shows character counter in edit mode", async () => {
    vi.mocked(useAccount).mockReturnValue({
      address: OWNER_ADDRESS,
      isConnected: true,
      status: "connected",
    } as ReturnType<typeof useAccount>);

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Edit"));

    // Content is "Check out this blog post about game theory!" (43 chars), channel is mastodon (limit 500)
    expect(screen.getByText("43/500")).toBeInTheDocument();
  });

  it("disables save button when content exceeds character limit", async () => {
    const longContent = "x".repeat(501);
    mockUseGrowthDrafts.mockReturnValue({
      data: { ...sampleQueue, drafts: [{ ...sampleQueue.drafts[0], content: longContent }] },
      isPending: false,
      error: null,
    });

    vi.mocked(useAccount).mockReturnValue({
      address: OWNER_ADDRESS,
      isConnected: true,
      status: "connected",
    } as ReturnType<typeof useAccount>);

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Edit"));

    expect(screen.getByText("501/500")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeDisabled();
  });

  it("shows over-limit warning and disables approve for too-long content", async () => {
    const longContent = "y".repeat(501);
    mockUseGrowthDrafts.mockReturnValue({
      data: { ...sampleQueue, drafts: [{ ...sampleQueue.drafts[0], content: longContent }] },
      isPending: false,
      error: null,
    });

    vi.mocked(useAccount).mockReturnValue({
      address: OWNER_ADDRESS,
      isConnected: true,
      status: "connected",
    } as ReturnType<typeof useAccount>);

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText(/Content exceeds mastodon limit/)).toBeInTheDocument();
    });

    // Approve button should be disabled when content exceeds limit
    expect(screen.getByText("Approve")).toBeDisabled();
  });

  it("shows character count in view mode for owner", async () => {
    vi.mocked(useAccount).mockReturnValue({
      address: OWNER_ADDRESS,
      isConnected: true,
      status: "connected",
    } as ReturnType<typeof useAccount>);

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText("43/500 characters")).toBeInTheDocument();
    });
  });

  it("calls reset on all mutations when switching tabs", async () => {
    vi.mocked(useAccount).mockReturnValue({
      address: OWNER_ADDRESS,
      isConnected: true,
      status: "connected",
    } as ReturnType<typeof useAccount>);

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText(/Approved/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Approved/));

    expect(mockApproveReset).toHaveBeenCalledOnce();
    expect(mockRejectReset).toHaveBeenCalledOnce();
    expect(mockUpdateReset).toHaveBeenCalledOnce();
  });

  it("clears approve error banner after switching tabs", async () => {
    // Simulate a mutation error being present
    mockApproveError = new Error("Approve failed");

    vi.mocked(useAccount).mockReturnValue({
      address: OWNER_ADDRESS,
      isConnected: true,
      status: "connected",
    } as ReturnType<typeof useAccount>);

    const { rerender } = render(<Page />);

    await waitFor(() => {
      expect(screen.getByText("Approve failed")).toBeInTheDocument();
    });

    // Clicking a tab calls reset() — simulate the effect by clearing the error
    mockApproveError = null;
    fireEvent.click(screen.getByText(/Approved/));
    rerender(<Page />);

    await waitFor(() => {
      expect(screen.queryByText("Approve failed")).not.toBeInTheDocument();
    });
  });
});
