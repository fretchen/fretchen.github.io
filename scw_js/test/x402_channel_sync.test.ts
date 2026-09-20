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

import { resyncChannelState } from "../x402_channel_sync.js";

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

/**
 * Two reads per channel now — `channels()` and `refundNonce()` — so the mock routes on
 * functionName. `setChain` is the only way tests should drive it: a positional mock would silently
 * feed the nonce to the balance read the moment the call order changed.
 */
function setChain({
  balance = 0n,
  totalClaimed = 0n,
  refundNonce = 0n,
}: { balance?: bigint; totalClaimed?: bigint; refundNonce?: bigint } = {}) {
  mockReadContract.mockImplementation(({ functionName }: { functionName: string }) =>
    Promise.resolve(functionName === "refundNonce" ? refundNonce : [balance, totalClaimed]),
  );
}

describe("resyncChannelState", () => {
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
    setChain({ balance: 1_000_000n });

    const results = await resyncChannelState(storage, OP);

    expect(results[0].corrected).toBe(true);
    expect(results[0].storedBalance).toBe("0");
    expect(results[0].chainBalance).toBe("1000000");
    expect(updateChannel).toHaveBeenCalledTimes(1);
    expect(channels[0].balance).toBe("1000000");
  });

  it("leaves an already-correct record untouched", async () => {
    const { storage, updateChannel } = makeStorage([makeChannel({ balance: "400000" })]);
    setChain({ balance: 400_000n });

    const results = await resyncChannelState(storage, OP);

    expect(results[0].corrected).toBe(false);
    expect(updateChannel).not.toHaveBeenCalled();
  });

  it("writes nothing in dry-run mode but still reports the drift", async () => {
    const { storage, updateChannel } = makeStorage([makeChannel()]);
    setChain({ balance: 6_500_000n });

    const results = await resyncChannelState(storage, OP, { dryRun: true });

    expect(results[0].corrected).toBe(true);
    expect(results[0].chainBalance).toBe("6500000");
    expect(updateChannel).not.toHaveBeenCalled();
  });

  it("leaves a record alone when the chain read fails", async () => {
    // A bad read must never overwrite a good record — the same rule as the client-side fix.
    const { storage, updateChannel, channels } = makeStorage([makeChannel({ balance: "400000" })]);
    mockReadContract.mockRejectedValue(new Error("RPC down"));

    const results = await resyncChannelState(storage, OP);

    expect(results).toHaveLength(0);
    expect(updateChannel).not.toHaveBeenCalled();
    expect(channels[0].balance).toBe("400000");
  });

  it("also corrects totalClaimed, so outstanding vouchers are not re-claimed", async () => {
    const { storage, channels } = makeStorage([makeChannel({ balance: "0", totalClaimed: "0" })]);
    setChain({ balance: 1_000_000n, totalClaimed: 35_147n });

    const results = await resyncChannelState(storage, OP);

    expect(channels[0].totalClaimed).toBe("35147");
    expect(results[0].storedTotalClaimed).toBe("0");
    expect(results[0].chainTotalClaimed).toBe("35147");
  });

  /**
   * `corrected` is true when any of the three chain-owned fields drifted, so the result has to
   * carry all three: with only the balance and nonce pairs reported, a channel whose totalClaimed
   * alone had moved came out of `scripts/recover_channels.ts` as a bare id with no reason after it.
   */
  it("reports a totalClaimed-only drift, which nothing else in the result would show", async () => {
    const { storage } = makeStorage([
      makeChannel({ balance: "544239", totalClaimed: "0", refundNonce: 1 }),
    ]);
    setChain({ balance: 544_239n, totalClaimed: 52_897n, refundNonce: 1n });

    const results = await resyncChannelState(storage, OP);

    expect(results[0].corrected).toBe(true);
    expect(results[0].storedBalance).toBe(results[0].chainBalance);
    expect(results[0].storedRefundNonce).toBe(results[0].chainRefundNonce);
    expect(results[0].storedTotalClaimed).toBe("0");
    expect(results[0].chainTotalClaimed).toBe("52897");
  });

  /**
   * The bug this function grew a second read for. A successful refund deletes the channel record;
   * a later deposit with the same voucher signer recreates it with `refundNonce: 0` while the chain
   * has moved to 1. The SDK then signs every refund against a consumed nonce, the contract reverts
   * with 0x164f1afe, and since its refund loop has no per-channel catch, that one channel blocks
   * the whole sweep. Two Optimism channels sat like that with 2.08 USDC behind them.
   */
  it("corrects a stale refundNonce, which is what makes a refund signable at all", async () => {
    const { storage, updateChannel, channels } = makeStorage([
      makeChannel({ balance: "544239", totalClaimed: "52897", refundNonce: 0 }),
    ]);
    setChain({ balance: 544_239n, totalClaimed: 52_897n, refundNonce: 1n });

    const results = await resyncChannelState(storage, OP);

    // The balance agrees with the chain; the nonce alone is the drift, and it must still count.
    expect(results[0].corrected).toBe(true);
    expect(results[0].storedRefundNonce).toBe(0);
    expect(results[0].chainRefundNonce).toBe(1);
    expect(updateChannel).toHaveBeenCalledTimes(1);
    expect(channels[0].refundNonce).toBe(1);
  });

  it("leaves a record alone when only the nonce read fails", async () => {
    const { storage, updateChannel, channels } = makeStorage([makeChannel({ balance: "400000" })]);
    mockReadContract.mockImplementation(({ functionName }: { functionName: string }) =>
      functionName === "refundNonce"
        ? Promise.reject(new Error("RPC down"))
        : Promise.resolve([1_000_000n, 0n]),
    );

    const results = await resyncChannelState(storage, OP);

    // Half-corrected is its own flavour of drift, so a partial read writes nothing at all.
    expect(results).toHaveLength(0);
    expect(updateChannel).not.toHaveBeenCalled();
    expect(channels[0].balance).toBe("400000");
  });

  it("reports an in-sync nonce without correcting anything", async () => {
    const { storage, updateChannel } = makeStorage([
      makeChannel({ balance: "400000", refundNonce: 2 }),
    ]);
    setChain({ balance: 400_000n, refundNonce: 2n });

    const results = await resyncChannelState(storage, OP);

    expect(results[0].corrected).toBe(false);
    expect(results[0].chainRefundNonce).toBe(2);
    expect(updateChannel).not.toHaveBeenCalled();
  });
});
