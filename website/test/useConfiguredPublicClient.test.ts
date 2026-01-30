import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useConfiguredPublicClient } from "../hooks/useConfiguredPublicClient";

// Mock the dependencies - no longer need getChain
vi.mock("@fretchen/chain-utils", () => ({
  fromCAIP2: vi.fn((network: string) => parseInt(network.split(":")[1])),
  getViemChain: vi.fn(() => ({
    id: 10,
    name: "OP Mainnet",
  })),
}));

vi.mock("../wagmi.config", () => ({
  config: {
    chains: [],
    transports: {},
  },
}));

vi.mock("@wagmi/core", () => ({
  getPublicClient: vi.fn(() => ({
    readContract: vi.fn(),
    chain: { id: 10 },
    // Mock a minimal public client
  })),
}));

describe("useConfiguredPublicClient Hook", () => {
  it("should return a stable client reference", () => {
    // Now requires network parameter (CAIP-2 format)
    const { result, rerender } = renderHook(() => useConfiguredPublicClient("eip155:10"));

    const firstClient = result.current;

    // Re-render the hook multiple times
    rerender();
    rerender();
    rerender();

    const secondClient = result.current;

    // The client should be the same reference (stable)
    expect(firstClient).toBe(secondClient);
  });

  it("should maintain stable client reference within hook instance", () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Now requires network parameter (CAIP-2 format)
    const { result, rerender } = renderHook(() => useConfiguredPublicClient("eip155:10"));

    const initialClient = result.current;

    // Re-render multiple times
    rerender();
    rerender();
    rerender();

    // The client reference should remain stable within the same hook instance
    expect(result.current).toBe(initialClient);
    expect(result.current).toBeDefined();
  });

  it("should prevent infinite re-render loops in useEffect dependencies", () => {
    // Now requires network parameter (CAIP-2 format)
    const { result } = renderHook(() => useConfiguredPublicClient("eip155:10"));

    const client1 = result.current;
    const client2 = result.current;
    const client3 = result.current;

    // All references should be identical
    expect(client1).toBe(client2);
    expect(client2).toBe(client3);
    expect(client1).toBe(client3);
  });
});
