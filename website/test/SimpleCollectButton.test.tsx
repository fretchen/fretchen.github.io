import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { SimpleCollectButton } from "../components/SimpleCollectButton";
import * as wagmi from "wagmi";

// Mock wagmi hooks
vi.mock("wagmi", () => ({
  useAccount: vi.fn(),
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
  useReadContract: vi.fn(),
}));

// Mock useAutoNetwork
vi.mock("../hooks/useAutoNetwork", () => ({
  useAutoNetwork: vi.fn(() => ({
    network: "eip155:10",
    switchIfNeeded: vi.fn(() => Promise.resolve(true)),
  })),
}));

// Mock chain-utils
vi.mock("@fretchen/chain-utils", () => ({
  getCollectorNFTAddress: vi.fn(() => "0x123"),
  CollectorNFTv1ABI: [],
  COLLECTOR_NFT_NETWORKS: ["eip155:10"],
  fromCAIP2: vi.fn(() => 10),
}));

// Mock wagmi config
vi.mock("../utils/wagmi", () => ({
  config: {
    chains: [{ id: 10 }, { id: 11155420 }],
  },
}));

vi.mock("../layouts/styles", () => ({
  nftCard: {
    actionButton: "action-button",
  },
  primaryButton: "primary-button",
}));

vi.mock("../hooks/useLocale", () => ({
  useLocale: vi.fn(() => "Collect"),
}));

vi.mock("viem", () => ({
  formatEther: vi.fn((_value) => "0.001"),
}));

describe("SimpleCollectButton", () => {
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(wagmi.useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof wagmi.useAccount>);
    vi.mocked(wagmi.useWriteContract).mockReturnValue({
      writeContract: vi.fn(),
      isPending: false,
      data: undefined,
      error: null,
      isError: false,
      isIdle: true,
      isSuccess: false,
      status: "idle",
    } as unknown as ReturnType<typeof wagmi.useWriteContract>);
    vi.mocked(wagmi.useWaitForTransactionReceipt).mockReturnValue({
      isLoading: false,
      isSuccess: false,
    } as ReturnType<typeof wagmi.useWaitForTransactionReceipt>);
    vi.mocked(wagmi.useReadContract).mockReturnValue({
      data: [BigInt(5), BigInt(1000000000000000), BigInt(100)],
      error: null,
      isPending: false,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: "success",
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof wagmi.useReadContract>);
  });

  it("should render with initial state showing collect button", () => {
    render(<SimpleCollectButton genImTokenId={BigInt(1)} />);

    const button = screen.getByRole("button");
    expect(button).toBeDefined();
    expect(button.textContent).toContain("📦");
    expect(button.textContent).toContain("Collect");
    expect(button.textContent).toContain("(5)"); // mint count from mock data
  });

  it("should show collecting state when transaction is pending", () => {
    vi.mocked(wagmi.useWriteContract).mockReturnValue({
      writeContract: vi.fn(),
      isPending: true,
      data: "0xhash",
      error: null,
      isError: false,
      isIdle: false,
      isSuccess: false,
      status: "pending",
    } as unknown as ReturnType<typeof wagmi.useWriteContract>);

    render(<SimpleCollectButton genImTokenId={BigInt(1)} />);

    const button = screen.getByRole("button");
    expect(button.textContent).toBe("📦 Collecting...");
    expect(button).toHaveProperty("disabled", true);
  });

  it("should show collecting state when transaction is confirming", () => {
    vi.mocked(wagmi.useWriteContract).mockReturnValue({
      writeContract: vi.fn(),
      isPending: true, // isPending is still true during confirmation
      data: "0xhash",
      error: null,
      isError: false,
      isIdle: false,
      isSuccess: false,
      status: "pending",
    } as unknown as ReturnType<typeof wagmi.useWriteContract>);
    vi.mocked(wagmi.useWaitForTransactionReceipt).mockReturnValue({
      isLoading: true,
      isSuccess: false,
    } as ReturnType<typeof wagmi.useWaitForTransactionReceipt>);

    render(<SimpleCollectButton genImTokenId={BigInt(1)} />);

    const button = screen.getByRole("button");
    expect(button.textContent).toBe("📦 Collecting...");
    expect(button).toHaveProperty("disabled", true);
  });

  it("should show success state when transaction is successful", () => {
    vi.mocked(wagmi.useWaitForTransactionReceipt).mockReturnValue({
      isLoading: false,
      isSuccess: true,
    } as ReturnType<typeof wagmi.useWaitForTransactionReceipt>);

    render(<SimpleCollectButton genImTokenId={BigInt(1)} />);

    const button = screen.getByRole("button");
    expect(button.textContent).toBe("✅ Collected!");
  });

  it("should be disabled when wallet is not connected", () => {
    vi.mocked(wagmi.useAccount).mockReturnValue({ isConnected: false } as ReturnType<typeof wagmi.useAccount>);

    render(<SimpleCollectButton genImTokenId={BigInt(1)} />);

    const button = screen.getByRole("button");
    expect(button).toHaveProperty("disabled", true);
  });
});
