import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithQuery } from "./testUtils";
import LeafHistorySidebar from "../components/LeafHistorySidebar";

// Mock the shared auth hook — avoids wagmi setup in this test file
vi.mock("../hooks/useWalletAuth", () => ({
  useWalletAuth: vi.fn(() => vi.fn().mockResolvedValue("Bearer test-token")),
}));

// Mock viem formatEther to avoid bigint formatting in tests
vi.mock("viem", () => ({
  formatEther: vi.fn(() => "0.001"),
}));

// Override useQuery to control data state per test
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, useQuery: vi.fn() };
});

import { useQuery } from "@tanstack/react-query";

const sampleLeafs = [
  {
    id: 1,
    user: "0x1234",
    serviceProvider: "0xprovider",
    tokenCount: "100",
    cost: "1000000000000000",
    timestamp: "2026-01-01T12:00:00Z",
    treeIndex: 0,
    processed: true,
    root: "0xabc",
  },
  {
    id: 2,
    user: "0x1234",
    serviceProvider: "0xprovider",
    tokenCount: "50",
    cost: "500000000000000",
    timestamp: "2026-01-02T12:00:00Z",
    treeIndex: 0,
    processed: false,
  },
];

const defaultProps = {
  address: "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`,
  isOpen: true,
  onClose: vi.fn(),
};

describe("LeafHistorySidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    vi.mocked(useQuery).mockReturnValue({ data: [], isPending: false } as ReturnType<typeof useQuery>);
    const { container } = renderWithQuery(<LeafHistorySidebar {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows loading state when isPending is true", () => {
    vi.mocked(useQuery).mockReturnValue({ data: [], isPending: true } as ReturnType<typeof useQuery>);
    renderWithQuery(<LeafHistorySidebar {...defaultProps} />);
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("shows empty state when data is empty", () => {
    vi.mocked(useQuery).mockReturnValue({ data: [], isPending: false } as ReturnType<typeof useQuery>);
    renderWithQuery(<LeafHistorySidebar {...defaultProps} />);
    expect(screen.getByText("No requests found")).toBeDefined();
  });

  it("shows total count when items are present", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: sampleLeafs,
      isPending: false,
    } as ReturnType<typeof useQuery>);
    renderWithQuery(<LeafHistorySidebar {...defaultProps} />);
    expect(screen.getByText(/Total: 2 requests/)).toBeDefined();
  });

  it('shows "Validated" label for processed leafs', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: [sampleLeafs[0]],
      isPending: false,
    } as ReturnType<typeof useQuery>);
    renderWithQuery(<LeafHistorySidebar {...defaultProps} />);
    expect(screen.getByText(/Validated/)).toBeDefined();
  });

  it('shows "Unprocessed" label for unprocessed leafs', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: [sampleLeafs[1]],
      isPending: false,
    } as ReturnType<typeof useQuery>);
    renderWithQuery(<LeafHistorySidebar {...defaultProps} />);
    expect(screen.getByText(/Unprocessed/)).toBeDefined();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    vi.mocked(useQuery).mockReturnValue({ data: [], isPending: false } as ReturnType<typeof useQuery>);
    renderWithQuery(<LeafHistorySidebar {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText("✕"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows pagination note when more than 10 items", () => {
    const manyLeafs = Array.from({ length: 12 }, (_, i) => ({
      ...sampleLeafs[0],
      id: i + 1,
    }));
    vi.mocked(useQuery).mockReturnValue({
      data: manyLeafs,
      isPending: false,
    } as ReturnType<typeof useQuery>);
    renderWithQuery(<LeafHistorySidebar {...defaultProps} />);
    expect(screen.getByText(/Showing first 10 of 12/)).toBeDefined();
  });
});
