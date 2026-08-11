import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { useAccount, useConnect } from "wagmi";
import { OWNER_ADDRESS } from "../utils/getChain";
import { buildAccountData, buildConnectData } from "./setup";
import type { Stats } from "../types/analytics";

const mockUseAnalyticsStats = vi.fn();
const mockPrewarmAnalyticsApi = vi.fn();

vi.mock("../hooks/useAnalyticsStats", () => ({
  useAnalyticsStats: (...args: unknown[]) => mockUseAnalyticsStats(...args),
  prewarmAnalyticsApi: () => mockPrewarmAnalyticsApi(),
}));

vi.mock("../styled-system/css", () => ({
  css: () => "mock-css-class",
}));

import Page from "../pages/analytics/+Page";

const TODAY = "2026-08-11";

const sampleStats: Stats = {
  site: "fretchen.eu",
  from: "2025-08-12",
  to: TODAY,
  days: {
    // Inside the year but outside 30 days — only the 1-year view should see it.
    "2026-02-14": { hits: 500, pages: { "/old/": 500 }, source: "umami" },
    "2026-08-10": { hits: 240, pages: { "/": 200, "/x402/": 40 }, source: "beacon" },
    "2026-08-11": { hits: 507, pages: { "/": 312, "/x402/": 22, "/blog/": 173 }, source: "beacon" },
  },
};

function connectAs(address: string | undefined) {
  vi.mocked(useAccount).mockReturnValue(
    buildAccountData({
      address: address as `0x${string}` | undefined,
      isConnected: address !== undefined,
      status: address !== undefined ? "connected" : "disconnected",
    }),
  );
  vi.mocked(useConnect).mockReturnValue(buildConnectData({ connectors: [{ name: "MetaMask" }] }));
}

describe("Analytics Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAnalyticsStats.mockReturnValue({ data: sampleStats, isPending: false, error: null });
  });

  afterEach(() => {
    cleanup();
  });

  it("prompts to connect when no wallet is attached", () => {
    connectAs(undefined);
    render(<Page />);
    expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
  });

  it("prewarms the stats function on mount, before any wallet is connected", () => {
    connectAs(undefined);
    render(<Page />);
    expect(mockPrewarmAnalyticsApi).toHaveBeenCalledOnce();
  });

  it("refuses a connected wallet that is not the owner", () => {
    connectAs("0x1111111111111111111111111111111111111111");
    render(<Page />);
    expect(screen.getByText("This page is restricted to the site owner.")).toBeInTheDocument();
    expect(screen.queryByText(/views/)).not.toBeInTheDocument();
  });

  it("does not request stats for a non-owner", () => {
    connectAs("0x1111111111111111111111111111111111111111");
    render(<Page />);
    expect(mockUseAnalyticsStats).toHaveBeenCalledWith(false);
  });

  it("offers the three granularities and no 7-day view", () => {
    connectAs(OWNER_ADDRESS);
    render(<Page />);
    expect(screen.getByText("30 days")).toBeInTheDocument();
    expect(screen.getByText("90 days")).toBeInTheDocument();
    expect(screen.getByText("1 year")).toBeInTheDocument();
    expect(screen.queryByText("7 days")).not.toBeInTheDocument();
  });

  it("defaults to 30 days, one bar per day, totals scoped to that window", () => {
    connectAs(OWNER_ADDRESS);
    const { container } = render(<Page />);

    expect(screen.getByText("747 views")).toBeInTheDocument(); // 240 + 507, not the 500 from February
    expect(container.querySelectorAll("[title$='views']")).toHaveLength(30);
  });

  // The whole point of the rework: the range selector re-slices one payload.
  it("never refetches when the range changes", () => {
    connectAs(OWNER_ADDRESS);
    render(<Page />);
    const callsBefore = mockUseAnalyticsStats.mock.calls.length;

    fireEvent.click(screen.getByText("1 year"));

    expect(mockUseAnalyticsStats.mock.calls.slice(callsBefore).every(([enabled]) => enabled === true)).toBe(true);
    // The hook takes no range argument at all, so there is nothing to key a refetch on.
    expect(mockUseAnalyticsStats).toHaveBeenLastCalledWith(true);
  });

  it("switches 90 days to weekly buckets", () => {
    connectAs(OWNER_ADDRESS);
    const { container } = render(<Page />);

    fireEvent.click(screen.getByText("90 days"));

    const bars = container.querySelectorAll("[title$='views']");
    expect(bars.length).toBeGreaterThanOrEqual(13);
    expect(bars.length).toBeLessThanOrEqual(14);
    expect(container.querySelector("[title^='Week of ']")).toBeInTheDocument();
  });

  it("switches 1 year to monthly buckets and picks up the older data", () => {
    connectAs(OWNER_ADDRESS);
    const { container } = render(<Page />);

    fireEvent.click(screen.getByText("1 year"));

    const bars = container.querySelectorAll("[title$='views']");
    expect(bars.length).toBeGreaterThanOrEqual(12);
    expect(bars.length).toBeLessThanOrEqual(13);
    expect(container.querySelector("[title='Feb 2026: 500 views']")).toBeInTheDocument();
    expect(screen.getByText("1,247 views")).toBeInTheDocument(); // now including February
  });

  it("rescopes the top-pages table to the selected range", () => {
    connectAs(OWNER_ADDRESS);
    render(<Page />);
    expect(screen.queryByRole("link", { name: "/old/" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("1 year"));

    expect(screen.getByRole("link", { name: "/old/" })).toBeInTheDocument();
  });

  it("lists the top pages with links to the live site", () => {
    connectAs(OWNER_ADDRESS);
    render(<Page />);
    const row = screen.getByRole("link", { name: "/x402/" });
    expect(row).toHaveAttribute("href", "https://www.fretchen.eu/x402/");
    expect(within(row.closest("tr")!).getByText("62")).toBeInTheDocument();
  });

  it("flags the Umami seam only when the range reaches into it", () => {
    connectAs(OWNER_ADDRESS);
    render(<Page />);
    expect(screen.queryByText(/backfilled from Umami/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("1 year"));

    expect(screen.getByText(/backfilled from Umami/)).toBeInTheDocument();
  });

  it("surfaces an auth failure from the endpoint", () => {
    connectAs(OWNER_ADDRESS);
    mockUseAnalyticsStats.mockReturnValue({ data: undefined, isPending: false, error: new Error("Token expired") });
    render(<Page />);
    expect(screen.getByText("Token expired")).toBeInTheDocument();
  });

  it("says so when the range has no traffic", () => {
    connectAs(OWNER_ADDRESS);
    mockUseAnalyticsStats.mockReturnValue({
      data: { ...sampleStats, days: {} },
      isPending: false,
      error: null,
    });
    render(<Page />);
    expect(screen.getByText("No traffic recorded in this range.")).toBeInTheDocument();
  });
});
