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

const sampleStats: Stats = {
  site: "fretchen.eu",
  from: "2026-08-08",
  to: "2026-08-10",
  totalHits: 1247,
  days: [
    { date: "2026-08-08", hits: 500, source: "umami" },
    { date: "2026-08-09", hits: 0 },
    { date: "2026-08-10", hits: 747, source: "beacon" },
  ],
  pages: [
    { path: "/", hits: 512 },
    { path: "/x402/", hits: 62 },
  ],
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
    expect(mockUseAnalyticsStats).toHaveBeenCalledWith(false, 30);
  });

  it("shows the total and the range for the owner", () => {
    connectAs(OWNER_ADDRESS);
    render(<Page />);
    expect(screen.getByText("1,247 views")).toBeInTheDocument();
    expect(screen.getByText(/across 2 pages/)).toBeInTheDocument();
  });

  it("renders one bar per day, including zero days", () => {
    connectAs(OWNER_ADDRESS);
    const { container } = render(<Page />);
    expect(container.querySelectorAll("[title$='views']")).toHaveLength(3);
    expect(container.querySelector("[title='Aug 9: 0 views']")).toBeInTheDocument();
  });

  it("lists the top pages with links to the live site", () => {
    connectAs(OWNER_ADDRESS);
    render(<Page />);
    const row = screen.getByRole("link", { name: "/x402/" });
    expect(row).toHaveAttribute("href", "https://www.fretchen.eu/x402/");
    expect(within(row.closest("tr")!).getByText("62")).toBeInTheDocument();
  });

  it("flags the Umami seam when the range includes backfilled days", () => {
    connectAs(OWNER_ADDRESS);
    render(<Page />);
    expect(screen.getByText(/backfilled from Umami/)).toBeInTheDocument();
  });

  it("omits the Umami note when every day came from the counter", () => {
    connectAs(OWNER_ADDRESS);
    mockUseAnalyticsStats.mockReturnValue({
      data: { ...sampleStats, days: [{ date: "2026-08-10", hits: 5, source: "beacon" }] },
      isPending: false,
      error: null,
    });
    render(<Page />);
    expect(screen.queryByText(/backfilled from Umami/)).not.toBeInTheDocument();
  });

  it("re-requests when the range changes", () => {
    connectAs(OWNER_ADDRESS);
    render(<Page />);

    fireEvent.click(screen.getByText("7 days"));

    expect(mockUseAnalyticsStats).toHaveBeenLastCalledWith(true, 7);
  });

  it("surfaces an auth failure from the endpoint", () => {
    connectAs(OWNER_ADDRESS);
    mockUseAnalyticsStats.mockReturnValue({
      data: undefined,
      isPending: false,
      error: new Error("Token expired"),
    });
    render(<Page />);
    expect(screen.getByText("Token expired")).toBeInTheDocument();
  });

  it("says so when the range has no traffic", () => {
    connectAs(OWNER_ADDRESS);
    mockUseAnalyticsStats.mockReturnValue({
      data: { ...sampleStats, totalHits: 0, days: [{ date: "2026-08-10", hits: 0 }], pages: [] },
      isPending: false,
      error: null,
    });
    render(<Page />);
    expect(screen.getByText("No traffic recorded in this range.")).toBeInTheDocument();
  });
});
