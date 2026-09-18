import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Channel, ChannelStorage } from "@x402/evm/batch-settlement/server";

const { mockReadContract } = vi.hoisted(() => ({ mockReadContract: vi.fn() }));

vi.mock("viem", async () => {
  const actual = await vi.importActual("viem");
  return { ...actual, createPublicClient: vi.fn(() => ({ readContract: mockReadContract })) };
});

vi.mock("@fretchen/chain-utils", () => ({
  getViemChain: vi.fn(() => ({ id: 10 })),
  getRpcUrl: vi.fn(() => "https://rpc.example"),
}));

import { resyncChannelBalances } from "../x402_channel_sync.js";

const OP = "eip155:10";

function makeChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    channelId: "0x397fe7b50624f0e6cd64fbea71327a2f9de70834fe02f9bc38bc0e45be629e34",
    channelConfig: {} as Channel["channelConfig"],
    chargedCumulativeAmount: "35147",
    signedMaxClaimable: "40000",
    signature: "0xsig",
    balance: "0",
    totalClaimed: "0",
    withdrawRequestedAt: 0,
    refundNonce: 0,
    lastRequestTimestamp: Date.now(),
    ...overrides,
  };
}

function makeStorage(channels: Channel[]) {
  const updateChannel = vi.fn(
    async (channelId: string, update: (c: Channel | undefined) => Channel | undefined) => {
      const idx = channels.findIndex((c) => c.channelId === channelId);
      const next = update(channels[idx]);
      if (next) channels[idx] = next;
      return { channel: next, status: "updated" as const };
    },
  );
  return {
    storage: {
      get: vi.fn(),
      list: vi.fn(async () => channels),
      updateChannel,
    } as unknown as ChannelStorage,
    updateChannel,
    channels,
  };
}

describe("resyncChannelBalances", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * The production case this exists for: two Optimism channels holding 1.0 and 6.5 USDC both
   * cached `balance: "0"`. The SDK refunds `balance - chargedCumulativeAmount` from that cache
   * and skips channels whose cached balance is zero — so without this correction the refund
   * either passes them over or computes a negative amount, and the escrow stays locked.
   */
  it("corrects a stale-zero cached balance from the chain", async () => {
    const { storage, updateChannel, channels } = makeStorage([makeChannel()]);
    mockReadContract.mockResolvedValue([1_000_000n, 0n]);

    const results = await resyncChannelBalances(storage, OP);

    expect(results[0].corrected).toBe(true);
    expect(results[0].storedBalance).toBe("0");
    expect(results[0].chainBalance).toBe("1000000");
    expect(updateChannel).toHaveBeenCalledTimes(1);
    expect(channels[0].balance).toBe("1000000");
  });

  it("leaves an already-correct record untouched", async () => {
    const { storage, updateChannel } = makeStorage([makeChannel({ balance: "400000" })]);
    mockReadContract.mockResolvedValue([400_000n, 0n]);

    const results = await resyncChannelBalances(storage, OP);

    expect(results[0].corrected).toBe(false);
    expect(updateChannel).not.toHaveBeenCalled();
  });

  it("writes nothing in dry-run mode but still reports the drift", async () => {
    const { storage, updateChannel } = makeStorage([makeChannel()]);
    mockReadContract.mockResolvedValue([6_500_000n, 0n]);

    const results = await resyncChannelBalances(storage, OP, { dryRun: true });

    expect(results[0].corrected).toBe(true);
    expect(results[0].chainBalance).toBe("6500000");
    expect(updateChannel).not.toHaveBeenCalled();
  });

  it("leaves a record alone when the chain read fails", async () => {
    // A bad read must never overwrite a good record — the same rule as the client-side fix.
    const { storage, updateChannel, channels } = makeStorage([makeChannel({ balance: "400000" })]);
    mockReadContract.mockRejectedValue(new Error("RPC down"));

    const results = await resyncChannelBalances(storage, OP);

    expect(results).toHaveLength(0);
    expect(updateChannel).not.toHaveBeenCalled();
    expect(channels[0].balance).toBe("400000");
  });

  it("also corrects totalClaimed, so outstanding vouchers are not re-claimed", async () => {
    const { storage, channels } = makeStorage([makeChannel({ balance: "0", totalClaimed: "0" })]);
    mockReadContract.mockResolvedValue([1_000_000n, 35_147n]);

    await resyncChannelBalances(storage, OP);

    expect(channels[0].totalClaimed).toBe("35147");
  });
});
