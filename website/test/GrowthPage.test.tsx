import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { useAccount, useConnect } from "wagmi";

const OWNER_ADDRESS = "0xA37729CF2201c01C74bC868834c7cf8dC13CAE19";

// Mock useGrowthApi
const mockFetchDrafts = vi.fn();
const mockFetchInsights = vi.fn();
const mockApproveDraft = vi.fn();
const mockRejectDraft = vi.fn();
const mockUpdateDraft = vi.fn();

vi.mock("../hooks/useGrowthApi", () => ({
  useGrowthApi: () => ({
    fetchDrafts: mockFetchDrafts,
    fetchInsights: mockFetchInsights,
    fetchPerformance: vi.fn().mockResolvedValue({ posts: [] }),
    approveDraft: mockApproveDraft,
    rejectDraft: mockRejectDraft,
    updateDraft: mockUpdateDraft,
  }),
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
    mockFetchDrafts.mockResolvedValue(sampleQueue);
    mockFetchInsights.mockResolvedValue({
      growth_opportunities: [],
      last_analysis: null,
      social_metrics: {},
      website_analytics: {},
    });
    mockApproveDraft.mockResolvedValue({ ...sampleQueue.drafts[0], status: "approved" });
    mockRejectDraft.mockResolvedValue({ ...sampleQueue.drafts[0], status: "rejected" });
    mockUpdateDraft.mockResolvedValue({ ...sampleQueue.drafts[0], content: "Updated content" });
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
      expect(mockFetchDrafts).toHaveBeenCalled();
    });

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
      expect(mockApproveDraft).toHaveBeenCalledWith("draft_1", undefined);
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
      expect(mockRejectDraft).toHaveBeenCalledWith("draft_1");
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
    mockFetchDrafts.mockRejectedValueOnce(new Error("Network error"));

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
});
