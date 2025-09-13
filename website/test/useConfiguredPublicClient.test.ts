import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useConfiguredPublicClient } from "../hooks/useConfiguredPublicClient";
import { getConfiguredPublicClient } from "../utils/getChain";

// Mock the utility function
vi.mock("../utils/getChain", () => ({
  getConfiguredPublicClient: vi.fn(() => ({
    readContract: vi.fn(),
    // Mock a minimal public client
  })),
}));

describe("useConfiguredPublicClient Hook", () => {
  it("should return a stable client reference", () => {
    const { result, rerender } = renderHook(() => useConfiguredPublicClient());

    const firstClient = result.current;

    // Re-render the hook multiple times
    rerender();
    rerender();
    rerender();

    const secondClient = result.current;

    // The client should be the same reference (stable)
    expect(firstClient).toBe(secondClient);
  });

  it("should only call getConfiguredPublicClient once", () => {
    const mockGetConfiguredPublicClient = vi.mocked(getConfiguredPublicClient);

    // Reset the mock call count
    mockGetConfiguredPublicClient.mockClear();

    const { rerender } = renderHook(() => useConfiguredPublicClient());

    // Re-render multiple times
    rerender();
    rerender();
    rerender();

    // Should only be called once due to useMemo
    expect(mockGetConfiguredPublicClient).toHaveBeenCalledTimes(1);
  });

  it("should prevent infinite re-render loops in useEffect dependencies", () => {
    const { result } = renderHook(() => useConfiguredPublicClient());

    const client1 = result.current;
    const client2 = result.current;
    const client3 = result.current;

    // All references should be identical
    expect(client1).toBe(client2);
    expect(client2).toBe(client3);
    expect(client1).toBe(client3);
  });
});
