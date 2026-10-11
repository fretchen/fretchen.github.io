import { describe, it, expect, vi, beforeEach } from "vitest";

// ===== Mocks (vi.hoisted ensures these are available when vi.mock factories run) =====

const {
  mockCreateLLMResourceServer,
  mockCreateFacilitatorClient,
  mockGetBatchSettlementNetworks,
  mockGetFacilitatorFeeConfig,
  mockReadContract,
  mockLoggerWarn,
  mockLoggerError,
  mockResyncChannelState,
  mockUseEnhancedRefundRequirements,
  mockRefund,
  mockUpdateChannel,
} = vi.hoisted(() => ({
  mockCreateLLMResourceServer: vi.fn(),
  mockCreateFacilitatorClient: vi.fn(),
  mockGetBatchSettlementNetworks: vi.fn(),
  mockGetFacilitatorFeeConfig: vi.fn(),
  mockReadContract: vi.fn(),
  mockLoggerWarn: vi.fn(),
  mockLoggerError: vi.fn(),
  mockResyncChannelState: vi.fn(),
  mockUseEnhancedRefundRequirements: vi.fn(),
  mockRefund: vi.fn(),
  mockUpdateChannel: vi.fn(),
}));

// Hits a real RPC otherwise. Its own behaviour is covered in x402_channel_sync.test.ts.
vi.mock("../x402_channel_sync.js", () => ({
  resyncChannelState: mockResyncChannelState,
}));

vi.mock("../x402_server.js", () => ({
  createLLMResourceServer: mockCreateLLMResourceServer,
  createFacilitatorClient: mockCreateFacilitatorClient,
  getBatchSettlementNetworks: mockGetBatchSettlementNetworks,
  getFacilitatorFeeConfig: mockGetFacilitatorFeeConfig,
  useEnhancedRefundRequirements: mockUseEnhancedRefundRequirements,
}));

// The cron's logger is module-private; mock pino so its warnings and errors are observable.
vi.mock("pino", () => ({
  default: vi.fn(() => ({
    info: vi.fn(),
    warn: mockLoggerWarn,
    error: mockLoggerError,
    debug: vi.fn(),
  })),
}));

vi.mock("viem", async () => {
  const actual = await vi.importActual("viem");
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({ readContract: mockReadContract })),
  };
});

// ===== Import after mocks =====

import { handle } from "../llm_x402_cron.js";
import { USDC_ADDRESSES, EURC_ADDRESSES, EURE_ADDRESSES } from "@fretchen/chain-utils";

// ===== Helpers =====

const VALID_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";

function makeEvent() {
  return { httpMethod: "GET", headers: {}, body: null };
}

/** A quiet, funded, partially-charged channel: refundable by the sweep. */
function idleRefundableChannel(overrides: Record<string, unknown> = {}) {
  return {
    channelId: "0xrefundme",
    balance: "600000",
    totalClaimed: "100000",
    chargedCumulativeAmount: "100000",
    lastRequestTimestamp: Date.now() - 48 * 3600 * 1000,
    ...overrides,
  };
}

/** One claim run per (network, token): Optimism has USDC only, Base and Base Sepolia all three. */
const RUNS: Array<[string, string]> = [
  ["eip155:10", USDC_ADDRESSES["eip155:10"]],
  ["eip155:8453", USDC_ADDRESSES["eip155:8453"]],
  ["eip155:8453", EURC_ADDRESSES["eip155:8453"]],
  ["eip155:8453", EURE_ADDRESSES["eip155:8453"]],
  ["eip155:84532", USDC_ADDRESSES["eip155:84532"]],
  ["eip155:84532", EURC_ADDRESSES["eip155:84532"]],
  ["eip155:84532", EURE_ADDRESSES["eip155:84532"]],
];

// ===== Tests =====

describe("llm_x402_cron", () => {
  let mockCreateChannelManager: ReturnType<typeof vi.fn>;
  let mockClaimAndSettle: ReturnType<typeof vi.fn>;
  let mockClaimSchemeFor: ReturnType<typeof vi.fn>;
  let mockStorageList: ReturnType<typeof vi.fn>;

  /** Storage whose deletions stick, honoring the updater's decision. A real SDK refund and
   *  the sweep's garbage collection both delete through updateChannel's updater contract —
   *  return undefined to delete, return the record to keep it — so the mock applies exactly
   *  that instead of deleting unconditionally. A static mockResolvedValue would resurrect
   *  every refunded channel as stuck escrow. */
  function statefulStorage(channels: Array<Record<string, unknown>>) {
    let current = channels;
    mockStorageList.mockImplementation(async () => current);
    mockUpdateChannel.mockImplementation(
      async (
        channelId: string,
        update: (c: Record<string, unknown> | undefined) => unknown,
      ) => {
        const existing = current.find((c) => c.channelId === channelId);
        const next = update(existing);
        if (next === existing) {
          return { channel: existing, status: "unchanged" };
        }
        if (next) {
          return { channel: next, status: "updated" };
        }
        current = current.filter((c) => c.channelId !== channelId);
        return { channel: undefined, status: existing ? "deleted" : "unchanged" };
      },
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NFT_WALLET_PUBLIC_KEY = VALID_ADDRESS;

    mockClaimAndSettle = vi.fn().mockResolvedValue({
      claims: [{ vouchers: 2, transaction: "0xclaimtx" }],
      settle: { transaction: "0xsettletx" },
    });
    // The sweep refunds one channel per call, each in its own try/catch — see the SDK notes
    // in llm_x402_cron.ts. Default: every attempt succeeds and refunds nothing (no channels).
    mockRefund.mockResolvedValue([]);
    mockUpdateChannel.mockResolvedValue({ channel: undefined, status: "deleted" });
    mockCreateChannelManager = vi.fn().mockReturnValue({
      claimAndSettle: mockClaimAndSettle,
      refund: mockRefund,
    });

    // One scheme per (network, token), each owning storage that lists only that network's
    // prefix and that token's channels.
    // list() is read by the sweep's partition and again by the post-condition check after
    // every run. Default: nothing stored, which is what a healthy run looks like.
    mockStorageList = vi.fn().mockResolvedValue([]);
    mockClaimSchemeFor = vi.fn().mockReturnValue({
      createChannelManager: mockCreateChannelManager,
      getStorage: vi.fn().mockReturnValue({
        list: mockStorageList,
        updateChannel: mockUpdateChannel,
      }),
    });
    mockResyncChannelState.mockResolvedValue([]);
    mockUseEnhancedRefundRequirements.mockResolvedValue(undefined);
    mockCreateLLMResourceServer.mockReturnValue({
      resourceServer: {},
      claimSchemeFor: mockClaimSchemeFor,
      scheme: { createChannelManager: mockCreateChannelManager },
    });
    mockCreateFacilitatorClient.mockReturnValue({});
    mockGetBatchSettlementNetworks.mockReturnValue(["eip155:10", "eip155:8453", "eip155:84532"]);
    // Default: the facilitator charges 0.01 per settlement, published per token — the nominal
    // 10000 for the 6-decimal tokens, 10¹⁶ for EURe, exactly as the deployed /supported's
    // facilitatorFees.assets does. Keyed per RUNS: every (network, token) the cron claims.
    const isEure = (token: string) =>
      Object.values(EURE_ADDRESSES).some((a) => a.toLowerCase() === token.toLowerCase());
    mockGetFacilitatorFeeConfig.mockResolvedValue({
      recipient: "0x3F8d2Fb6fEA24E70155bC61471936F3c9C30c206",
      flatFee: 10000n,
      feeByAsset: new Map(
        RUNS.map(
          ([network, token]) =>
            [
              `${network}:${token.toLowerCase()}`,
              isEure(token) ? 10_000_000_000_000_000n : 10000n,
            ] as const,
        ),
      ),
    });
    // Healthy by default on every token: 1 USDC/EURC-worth (100 claims at 0.01) and 1 EURe
    // (100 claims at the per-token fee). Per-token because the fee's atomic size differs.
    mockReadContract.mockImplementation(
      ({ address }: { address: `0x${string}` }) =>
        isEure(address) ? 1_000_000_000_000_000_000n : 1_000_000n, // 1 EURe : 1 USDC/EURC
    );
  });

  it("returns 500 when NFT_WALLET_PUBLIC_KEY is missing", async () => {
    delete process.env.NFT_WALLET_PUBLIC_KEY;
    const res = await handle(makeEvent() as never, {});
    expect(res.statusCode).toBe(500);
    expect(mockCreateLLMResourceServer).not.toHaveBeenCalled();
  });

  it("returns 500 when NFT_WALLET_PUBLIC_KEY is not a valid hex address", async () => {
    process.env.NFT_WALLET_PUBLIC_KEY = "not-an-address";
    const res = await handle(makeEvent() as never, {});
    expect(res.statusCode).toBe(500);
  });

  it("returns 500 when the resource server fails to configure", async () => {
    mockCreateLLMResourceServer.mockImplementation(() => {
      throw new Error("RECEIVER_AUTHORIZER_PRIVATE_KEY not configured");
    });
    const res = await handle(makeEvent() as never, {});
    expect(res.statusCode).toBe(500);
  });

  it("runs claimAndSettle once per batch-settlement network and token, and returns 200", async () => {
    const res = await handle(makeEvent() as never, {});
    expect(res.statusCode).toBe(200);
    expect(mockCreateChannelManager).toHaveBeenCalledTimes(RUNS.length);
    expect(mockClaimAndSettle).toHaveBeenCalledTimes(RUNS.length);

    const body = JSON.parse(res.body) as {
      results: Array<{ network: string; asset: string; claims: number }>;
    };
    expect(body.results.map((r) => [r.network, r.asset])).toEqual([
      ["eip155:10", "USDC"],
      ["eip155:8453", "USDC"],
      ["eip155:8453", "EURC"],
      ["eip155:8453", "EURe"],
      ["eip155:84532", "USDC"],
      ["eip155:84532", "EURC"],
      ["eip155:84532", "EURe"],
    ]);
    expect(body.results[0]).toEqual({
      network: "eip155:10",
      asset: "USDC",
      claims: 1,
      settled: true,
      refunds: 0,
      feeAllowanceClaimsLeft: 100,
      // Reported on every run, including the healthy one: "we checked and found nothing" is the
      // signal that distinguishes a working sweep from one that never looked.
      driftCorrected: 0,
      garbageCollected: 0,
      escrowHeld: "0",
    });
  });

  /**
   * Regression guard for the Optimism enablement: `createChannelManager`'s token argument is
   * optional, and omitting it makes the SDK fall back to its `DEFAULT_STABLECOINS` registry —
   * which has no eip155:10 entry and throws "No default asset configured". The cron would
   * then silently stop claiming revenue on Optimism.
   */
  it("passes each token address explicitly, never relying on the SDK registry", async () => {
    await handle(makeEvent() as never, {});

    expect(mockCreateChannelManager).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      "eip155:10",
      "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    );
    expect(mockCreateChannelManager).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      "eip155:8453",
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    );
    // The registry would answer USDC for a EURC channel manager — the explicit token is the
    // only thing that makes it settle in EURC.
    expect(mockCreateChannelManager).toHaveBeenNthCalledWith(
      3,
      expect.anything(),
      "eip155:8453",
      "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
    );
    // Every call must have a third argument — the fallback is never acceptable.
    for (const call of mockCreateChannelManager.mock.calls) {
      expect(call[2]).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }
  });

  it("reports settled:false when claimAndSettle returns no settle result", async () => {
    mockClaimAndSettle.mockResolvedValue({ claims: [], settle: undefined });
    const res = await handle(makeEvent() as never, {});
    const body = JSON.parse(res.body) as { results: Array<{ claims: number; settled: boolean }> };
    expect(body.results[0]).toEqual({
      network: "eip155:10",
      asset: "USDC",
      claims: 0,
      settled: false,
      refunds: 0,
      feeAllowanceClaimsLeft: 100,
      driftCorrected: 0,
      garbageCollected: 0,
      escrowHeld: "0",
    });
  });

  it("continues to other networks and returns 500 when one network's claimAndSettle throws", async () => {
    mockClaimAndSettle
      .mockRejectedValueOnce(new Error("facilitator unreachable"))
      .mockResolvedValue({ claims: [], settle: undefined });

    const res = await handle(makeEvent() as never, {});
    expect(res.statusCode).toBe(500);
    expect(mockClaimAndSettle).toHaveBeenCalledTimes(RUNS.length);

    const body = JSON.parse(res.body) as { results: Array<{ network: string; error?: string }> };
    expect(body.results[0].error).toBe("facilitator unreachable");
    expect(body.results[1].error).toBeUndefined();
  });

  // ═══════════════════════════════════════════════════════════
  // Per-(network, token) scoping
  //
  // The outage this guards against: one `S3ChannelStorage` was shared by every network, so
  // `list()` fed Base channels into Optimism claim batches. Every batch reverted with
  // claim_simulation_failed — 3 failures per run, 14 runs, zero claims — while USDC kept
  // accumulating in escrow. Tokens are the same trap one level down: the SDK's manager claims
  // every channel its storage lists and settles them in its one token, and the facilitator
  // refuses a batch that mixes tokens. So each (network, token) gets its own scoped scheme.
  // ═══════════════════════════════════════════════════════════

  it("asks for a scheme scoped to each network and token, never reusing one", async () => {
    await handle(makeEvent() as never, {});

    expect(mockClaimSchemeFor.mock.calls).toEqual(RUNS);
  });

  // ═══════════════════════════════════════════════════════════
  // Cooperative refund sweep
  //
  // Without this, unspent escrow only ever came back via the 24h unilateral withdrawDelay —
  // a path the buyers page promises but no code ever exercised, and which no user completed.
  // ═══════════════════════════════════════════════════════════

  it("sweeps idle channels for refunds on each network, after the claim", async () => {
    statefulStorage([idleRefundableChannel()]);
    mockRefund.mockImplementation(async ([channelId]: string[]) => {
      // The SDK deletes the record on a successful refund — mirrored by statefulStorage, so
      // only the first (network, token) run sees the channel, exactly like production.
      await mockUpdateChannel(channelId, () => undefined);
      return [{ transaction: "0xrefund1" }];
    });

    const res = await handle(makeEvent() as never, {});

    expect(mockRefund).toHaveBeenCalledTimes(1);
    expect(mockRefund).toHaveBeenCalledWith(["0xrefundme"]);
    expect(mockClaimAndSettle.mock.invocationCallOrder[0]).toBeLessThan(
      mockRefund.mock.invocationCallOrder[0],
    );

    const body = JSON.parse(res.body) as { results: Array<{ refunds?: number }> };
    expect(body.results[0].refunds).toBe(1);
  });

  it("refunds only after claiming, so an outstanding voucher is never swept into an enriched refund", async () => {
    const order: string[] = [];
    mockClaimAndSettle.mockImplementation(async () => {
      order.push("claim");
      return { claims: [], settle: undefined };
    });
    statefulStorage([idleRefundableChannel()]);
    mockRefund.mockImplementation(async () => {
      order.push("refund");
      return [];
    });

    await handle(makeEvent() as never, {});

    expect(order.slice(0, 2)).toEqual(["claim", "refund"]);
  });

  it("enhances the refund requirements before sweeping, or every refund is rejected", async () => {
    // The SDK's manager builds `extra: {}` and the facilitator fails closed on a missing
    // receiverAuthorizer, so ordering here is load-bearing, not cosmetic.
    statefulStorage([idleRefundableChannel()]);
    await handle(makeEvent() as never, {});

    expect(mockUseEnhancedRefundRequirements).toHaveBeenCalledTimes(RUNS.length);
    expect(mockUseEnhancedRefundRequirements.mock.invocationCallOrder[0]).toBeLessThan(
      mockRefund.mock.invocationCallOrder[0],
    );
    expect(mockUseEnhancedRefundRequirements).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        network: "eip155:10",
        asset: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      }),
    );
  });

  /**
   * The resync must come FIRST, and this ordering is the whole reason refunds work at all.
   *
   * The SDK refunds `balance - chargedCumulativeAmount` read from the stored record, and signs
   * the refund against the stored `refundNonce`. Both are caches of chain state that the verify
   * path zeroes, so a sweep run against unsynced storage either skips the channel (the SDK's own
   * `balance === 0n` filter) or signs against an already-consumed nonce and reverts on chain.
   *
   * Nothing asserted this before — the ordering held by accident of source order, which is not
   * the same as being guaranteed.
   */
  it("resyncs cached channel state before sweeping, not after", async () => {
    statefulStorage([idleRefundableChannel()]);

    await handle(makeEvent() as never, {});

    expect(mockResyncChannelState).toHaveBeenCalled();
    expect(mockResyncChannelState.mock.invocationCallOrder[0]).toBeLessThan(
      mockRefund.mock.invocationCallOrder[0],
    );
  });

  /**
   * A resync that throws must fail the run rather than let the sweep proceed on stale state.
   * It sits inside the same try as the sweep, so it surfaces as `refundError` — asserted here
   * so that staying true is a deliberate choice, not an accident of where the try block ends.
   */
  it("fails the run when the resync throws, instead of sweeping stale state", async () => {
    mockResyncChannelState.mockRejectedValue(new Error("S3 unavailable"));

    const result = await handle(makeEvent() as never, {});

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.results[0].refundError).toBe("S3 unavailable");
    expect(mockRefund).not.toHaveBeenCalled();
  });

  /**
   * A failed refund still reports its successful claim — but the RUN fails.
   *
   * It used to return 200: `refundError` is a different key from `error`, and only `error` was
   * counted, so Scaleway recorded a successful invocation. That is how a refund sweep that failed
   * twice a day went unnoticed for weeks. The claim detail below is what must not be masked; the
   * status code is what must not lie. Since the sweep went per-channel, a failing channel no
   * longer aborts the loop — `refunds` is reported (as 0) rather than dropped, and `refundError`
   * carries the count summary instead of the raw message.
   */
  it("a failing refund sweep fails the run without masking a successful claim", async () => {
    statefulStorage([idleRefundableChannel()]);
    mockRefund.mockRejectedValue(new Error("facilitator rejected refund"));

    const res = await handle(makeEvent() as never, {});

    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body) as {
      results: Array<{ claims?: number; refunds?: number; refundError?: string }>;
    };
    expect(body.results[0].claims).toBe(1);
    expect(body.results[0].refundError).toBe("1 of 1 refund(s) failed");
    expect(body.results[0].refunds).toBe(0);
  });

  // ═══════════════════════════════════════════════════════════
  // The sweep's post-condition
  //
  // Refunds failed for four unrelated reasons over one period — a stale cached balance, a stale
  // refundNonce, a refund_transaction_failed on Base, a withdraw_delay_mismatch on Base Sepolia.
  // Every one presents identically as escrow that should have gone home and did not, so the check
  // is written against that outcome rather than any of the causes.
  // ═══════════════════════════════════════════════════════════

  /** Idle past the threshold, still holding escrow: the sweep did not do its job, whatever the
   *  reason — including a reason nobody has thought of yet. */
  function stuckChannel(overrides: Record<string, unknown> = {}) {
    return {
      channelId: "0xstuck",
      balance: "544239",
      totalClaimed: "0",
      chargedCumulativeAmount: "52897",
      lastRequestTimestamp: Date.now() - 48 * 3600 * 1000,
      ...overrides,
    };
  }

  it("fails the run when a channel is past the refund threshold and still holds escrow", async () => {
    mockStorageList.mockResolvedValue([stuckChannel()]);

    const res = await handle(makeEvent() as never, {});

    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body) as { results: Array<{ stuckChannels?: string[] }> };
    expect(body.results[0].stuckChannels).toEqual(["0xstuck"]);
  });

  /** Nothing thrown, refunds reported as done — and escrow still sitting there. This is the case
   *  no error-based check can see, and the reason the post-condition is written at all. */
  it("catches stuck escrow even when the sweep reported success", async () => {
    // Static list on purpose: the refund "succeeds" but the record survives, which is the lie
    // the post-condition exists to catch.
    mockStorageList.mockResolvedValue([stuckChannel()]);
    mockRefund.mockResolvedValue([{ transaction: "0xabc" }]);

    const res = await handle(makeEvent() as never, {});

    expect(res.statusCode).toBe(500);
  });

  // ═══════════════════════════════════════════════════════════
  // The sweep's partition: refundable / fully-claimed (garbage-collected) / anomalous
  //
  // The 2026-10-11 incident: a fully-claimed record lingered with balance != 0, so the SDK's
  // batch sweep built a 0-amount refund for it, the contract rejected that with ZeroRefund,
  // and the abort-on-first-failure batch stranded two funded channels' escrow behind it.
  // The sweep now partitions and drives each channel separately.
  // ═══════════════════════════════════════════════════════════

  it("garbage-collects a fully-claimed idle channel and never refunds it", async () => {
    // Every atom deposited was also claimed, so the chain holds nothing for this channel —
    // the record is the only thing keeping the ZeroRefund loop alive.
    const fullyClaimed = idleRefundableChannel({
      channelId: "0xdead",
      balance: "52897",
      totalClaimed: "52897",
      chargedCumulativeAmount: "52897",
    });
    statefulStorage([fullyClaimed]);
    mockResyncChannelState.mockResolvedValue([
      { channelId: "0xdead", chainBalance: "52897", chainTotalClaimed: "52897", corrected: false },
    ]);

    const res = await handle(makeEvent() as never, {});

    expect(mockRefund).not.toHaveBeenCalled();
    expect(mockUpdateChannel).toHaveBeenCalledWith("0xdead", expect.any(Function));
    // The guarded-delete contract, exercised three ways. A still-dead record deletes (the
    // SDK's own updater shape: undefined deletes); a record that changed since the sweep's
    // snapshot — a payment landed and bumped lastRequestTimestamp, or a deposit grew the
    // balance — must come back unchanged, because its voucher is claimable revenue.
    const updater = mockUpdateChannel.mock.calls[0][1] as (c: unknown) => unknown;
    expect(updater(fullyClaimed)).toBeUndefined();
    const raced = { ...fullyClaimed, lastRequestTimestamp: Date.now() };
    expect(updater(raced)).toBe(raced);
    const toppedUp = { ...fullyClaimed, balance: "60000" };
    expect(updater(toppedUp)).toBe(toppedUp);

    const body = JSON.parse(res.body) as {
      results: Array<{
        garbageCollected?: number;
        escrowHeld?: string;
        stuckChannels?: string[];
        anomalousChannels?: string[];
      }>;
    };
    expect(body.results[0].garbageCollected).toBe(1);
    expect(body.results[0].escrowHeld).toBe("0");
    expect(body.results[0].stuckChannels).toBeUndefined();
    expect(body.results[0].anomalousChannels).toBeUndefined();
    expect(res.statusCode).toBe(200);
  });

  it("one channel's refund failure no longer blocks the rest of the sweep", async () => {
    // The incident regression: the SDK's batch sweep aborted on the first failure, so one
    // bad channel stranded every refund behind it. The per-channel loop must attempt all.
    statefulStorage([
      idleRefundableChannel({ channelId: "0xgood1" }),
      idleRefundableChannel({ channelId: "0xbad" }),
      idleRefundableChannel({ channelId: "0xgood2" }),
    ]);
    mockRefund.mockImplementation(async ([channelId]: string[]) => {
      if (channelId === "0xbad") {
        throw new Error("invalid_batch_settlement_evm_refund_simulation_failed");
      }
      await mockUpdateChannel(channelId, () => undefined);
      return [{ transaction: "0xrefund" }];
    });

    const res = await handle(makeEvent() as never, {});

    // All three channels attempted on the first run. The failed one is not deleted (only a
    // successful refund removes a record), so each of the remaining six (network, token) runs
    // retries it alone: 3 + 6 = 9 attempts in total, with the two good refunds safe on run one.
    expect(mockRefund).toHaveBeenCalledTimes(9);
    expect(mockRefund).toHaveBeenCalledWith(["0xbad"]);
    const body = JSON.parse(res.body) as {
      results: Array<{ refunds?: number; refundError?: string }>;
    };
    expect(body.results[0].refunds).toBe(2);
    expect(body.results[0].refundError).toBe("1 of 3 refund(s) failed");
    expect(res.statusCode).toBe(500);
  });

  it("reports a fully charged channel that still holds chain escrow, refunding and deleting nothing", async () => {
    // The payer signed the whole balance away in vouchers and the claim did not move it out:
    // nothing is refundable, yet the chain holds money. Keep the record (a later claim needs
    // its voucher), page via the stuck-escrow alert phrase, fail the run.
    statefulStorage([
      idleRefundableChannel({
        channelId: "0xanomaly",
        balance: "52897",
        totalClaimed: "0",
        chargedCumulativeAmount: "52897",
      }),
    ]);
    mockResyncChannelState.mockResolvedValue([
      { channelId: "0xanomaly", chainBalance: "52897", chainTotalClaimed: "0", corrected: false },
    ]);

    const res = await handle(makeEvent() as never, {});

    expect(mockRefund).not.toHaveBeenCalled();
    expect(mockUpdateChannel).not.toHaveBeenCalled();
    const body = JSON.parse(res.body) as {
      results: Array<{ anomalousChannels?: string[]; garbageCollected?: number }>;
    };
    expect(body.results[0].anomalousChannels).toEqual(["0xanomaly"]);
    expect(body.results[0].garbageCollected).toBe(0);
    expect(res.statusCode).toBe(500);
    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({ channelId: "0xanomaly" }),
      expect.stringContaining("still hold escrow"),
    );
  });

  it("skips channels that are not idle or have no balance", async () => {
    statefulStorage([
      idleRefundableChannel({ channelId: "0xactive", lastRequestTimestamp: Date.now() }),
      idleRefundableChannel({ channelId: "0xempty", balance: "0" }),
    ]);

    const res = await handle(makeEvent() as never, {});

    expect(mockRefund).not.toHaveBeenCalled();
    expect(mockUpdateChannel).not.toHaveBeenCalled();
    const body = JSON.parse(res.body) as { results: Array<{ garbageCollected?: number }> };
    expect(body.results[0].garbageCollected).toBe(0);
    expect(res.statusCode).toBe(200);
  });

  /** `balance` is cumulative deposits, so a channel with claim history holds less than it has
   *  received. Reporting the deposits would overstate the money at risk in the very line the
   *  stuck-escrow alert points a human at. */
  it("reports escrow net of what has already been claimed out", async () => {
    mockStorageList.mockResolvedValue([
      stuckChannel({ balance: "544239", totalClaimed: "52897", chargedCumulativeAmount: "52897" }),
    ]);

    const res = await handle(makeEvent() as never, {});

    const body = JSON.parse(res.body) as { results: Array<{ escrowHeld?: string }> };
    expect(body.results[0].escrowHeld).toBe("491342");
  });

  it("passes a funded channel that is still in active use", async () => {
    mockStorageList.mockResolvedValue([stuckChannel({ lastRequestTimestamp: Date.now() })]);

    const res = await handle(makeEvent() as never, {});

    expect(res.statusCode).toBe(200);
  });

  /** Drift is reported but not escalated: the repair working is the design. What must not happen
   *  is the silence — the stale refundNonce was corrected on every run while refunds failed. */
  it("reports corrected drift without failing the run", async () => {
    mockResyncChannelState.mockResolvedValue([{ corrected: true }, { corrected: false }]);

    const res = await handle(makeEvent() as never, {});

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { results: Array<{ driftCorrected?: number }> };
    expect(body.results[0].driftCorrected).toBe(1);
  });

  // ═══════════════════════════════════════════════════════════
  // Fee-allowance early warning
  //
  // claim/settle skip /verify, so this path never receives `remainingSettlements` the way
  // the exact scheme does. Without this check the approval runs out silently and claims
  // begin failing with insufficient_fee_allowance. The check is advisory: it must surface
  // the problem early and must never itself cost us a claim.
  // ═══════════════════════════════════════════════════════════

  it("warns when the fee allowance is nearly exhausted, and still claims", async () => {
    // 5 claims left, below the 10-claim threshold.
    mockReadContract.mockResolvedValue(50_000n);

    const res = await handle(makeEvent() as never, {});

    expect(mockLoggerWarn).toHaveBeenCalledWith(
      expect.objectContaining({ network: "eip155:10", asset: "USDC", claimsLeft: 5 }),
      expect.stringContaining("insufficient_fee_allowance"),
    );
    // Each token has its own approval, so the warning names the one to top up.
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      expect.objectContaining({ network: "eip155:8453", asset: "EURC" }),
      expect.stringContaining("approve more EURC"),
    );
    // The warning is advisory — collection must still happen.
    expect(mockClaimAndSettle).toHaveBeenCalledTimes(RUNS.length);
    expect(res.statusCode).toBe(200);
  });

  it("does not warn when the allowance is healthy", async () => {
    await handle(makeEvent() as never, {});

    expect(mockLoggerWarn).not.toHaveBeenCalled();
  });

  it("computes EURe claims left with the per-token fee — 0.98 EURe is 98 claims, not 9.8×10¹⁴", async () => {
    // The regression: dividing an 18-decimal allowance by the nominal 6-decimal 10000 once
    // reported a real 0.98-EURe approval as 98000000000000 claims. The fee must come from
    // /supported's per-token assets (10¹⁶ for EURe), so the same wallet reads as 98.
    mockReadContract.mockImplementation(({ address }: { address: `0x${string}` }) =>
      Object.values(EURE_ADDRESSES).some((a) => a.toLowerCase() === address.toLowerCase())
        ? 980_000_000_000_000_000n // 0.98 EURe — the wallet state that printed the wrong figure
        : 1_000_000n,
    );

    const res = await handle(makeEvent() as never, {});
    const body = JSON.parse(res.body) as {
      results: Array<{ network: string; asset: string; feeAllowanceClaimsLeft?: number }>;
    };

    for (const network of ["eip155:8453", "eip155:84532"]) {
      const eure = body.results.find((r) => r.network === network && r.asset === "EURe");
      expect(eure?.feeAllowanceClaimsLeft).toBe(98);
    }
    // The 6-decimal tokens keep their own fee: 1 USDC-worth is still 100 claims.
    expect(body.results.find((r) => r.network === "eip155:10")?.feeAllowanceClaimsLeft).toBe(100);
  });

  it("reports no runway for EURe against a facilitator that publishes no per-token fees", async () => {
    // An old facilitator build has no facilitatorFees.assets. The nominal 10000 would be 10¹²
    // off for EURe, so the honest answer is "unknown" — no number, and no warning.
    mockGetFacilitatorFeeConfig.mockResolvedValue({
      recipient: "0x3F8d2Fb6fEA24E70155bC61471936F3c9C30c206",
      flatFee: 10000n,
      feeByAsset: new Map(),
    });

    const res = await handle(makeEvent() as never, {});
    const body = JSON.parse(res.body) as {
      results: Array<{ network: string; asset: string; feeAllowanceClaimsLeft?: number }>;
    };

    const eure = body.results.find((r) => r.asset === "EURe");
    expect(eure?.feeAllowanceClaimsLeft).toBeUndefined();
    expect(
      mockLoggerWarn.mock.calls.some((call) => String(call[0]?.asset ?? "").includes("EURe")),
    ).toBe(false);
    // The 6-decimal tokens fall back to the nominal fee and still report a runway.
    expect(body.results.find((r) => r.network === "eip155:10")?.feeAllowanceClaimsLeft).toBe(100);
  });

  it("still claims when the allowance read fails — the check must never cost a claim", async () => {
    mockReadContract.mockRejectedValue(new Error("RPC down"));

    const res = await handle(makeEvent() as never, {});

    expect(res.statusCode).toBe(200);
    expect(mockClaimAndSettle).toHaveBeenCalledTimes(RUNS.length);
    // Unreadable is not "low": no warning, and no runway reported rather than a made-up 0.
    const body = JSON.parse(res.body) as { results: Array<Record<string, unknown>> };
    expect(body.results[0].feeAllowanceClaimsLeft).toBeUndefined();
  });

  it("skips the allowance read entirely when the facilitator charges no fee", async () => {
    mockGetFacilitatorFeeConfig.mockResolvedValue(null);

    const res = await handle(makeEvent() as never, {});

    expect(mockReadContract).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(mockClaimAndSettle).toHaveBeenCalledTimes(RUNS.length);
  });
});
