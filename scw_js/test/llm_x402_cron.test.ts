import { describe, it, expect, vi, beforeEach } from "vitest";

// ===== Mocks (vi.hoisted ensures these are available when vi.mock factories run) =====

const {
  mockCreateLLMResourceServer,
  mockCreateFacilitatorClient,
  mockGetBatchSettlementNetworks,
  mockGetFacilitatorFeeConfig,
  mockReadContract,
  mockLoggerWarn,
  mockResyncChannelState,
  mockUseEnhancedRefundRequirements,
} = vi.hoisted(() => ({
  mockCreateLLMResourceServer: vi.fn(),
  mockCreateFacilitatorClient: vi.fn(),
  mockGetBatchSettlementNetworks: vi.fn(),
  mockGetFacilitatorFeeConfig: vi.fn(),
  mockReadContract: vi.fn(),
  mockLoggerWarn: vi.fn(),
  mockResyncChannelState: vi.fn(),
  mockUseEnhancedRefundRequirements: vi.fn(),
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

// The cron's logger is module-private; mock pino so its warnings are observable.
vi.mock("pino", () => ({
  default: vi.fn(() => ({
    info: vi.fn(),
    warn: mockLoggerWarn,
    error: vi.fn(),
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
import { USDC_ADDRESSES, EURC_ADDRESSES } from "@fretchen/chain-utils";

// ===== Helpers =====

const VALID_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";

function makeEvent() {
  return { httpMethod: "GET", headers: {}, body: null };
}

/** One claim run per (network, token): Optimism has USDC only, Base and Base Sepolia both. */
const RUNS: Array<[string, string]> = [
  ["eip155:10", USDC_ADDRESSES["eip155:10"]],
  ["eip155:8453", USDC_ADDRESSES["eip155:8453"]],
  ["eip155:8453", EURC_ADDRESSES["eip155:8453"]],
  ["eip155:84532", USDC_ADDRESSES["eip155:84532"]],
  ["eip155:84532", EURC_ADDRESSES["eip155:84532"]],
];

// ===== Tests =====

describe("llm_x402_cron", () => {
  let mockCreateChannelManager: ReturnType<typeof vi.fn>;
  let mockClaimAndSettle: ReturnType<typeof vi.fn>;
  let mockRefundIdleChannels: ReturnType<typeof vi.fn>;
  let mockClaimSchemeFor: ReturnType<typeof vi.fn>;
  let mockStorageList: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NFT_WALLET_PUBLIC_KEY = VALID_ADDRESS;

    mockClaimAndSettle = vi.fn().mockResolvedValue({
      claims: [{ vouchers: 2, transaction: "0xclaimtx" }],
      settle: { transaction: "0xsettletx" },
    });
    mockRefundIdleChannels = vi.fn().mockResolvedValue([]);
    mockCreateChannelManager = vi.fn().mockReturnValue({
      claimAndSettle: mockClaimAndSettle,
      refundIdleChannels: mockRefundIdleChannels,
    });

    // One scheme per (network, token), each owning storage that lists only that network's
    // prefix and that token's channels.
    // list() is read by the post-condition check after every sweep. Default: nothing left
    // behind, which is what a healthy run looks like.
    mockStorageList = vi.fn().mockResolvedValue([]);
    mockClaimSchemeFor = vi.fn().mockReturnValue({
      createChannelManager: mockCreateChannelManager,
      getStorage: vi.fn().mockReturnValue({ list: mockStorageList }),
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
    // Default: the facilitator charges 0.01 USDC and the approval is healthy (100 claims).
    mockGetFacilitatorFeeConfig.mockResolvedValue({
      recipient: "0x3F8d2Fb6fEA24E70155bC61471936F3c9C30c206",
      flatFee: 10000n,
    });
    mockReadContract.mockResolvedValue(1_000_000n);
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
      ["eip155:84532", "USDC"],
      ["eip155:84532", "EURC"],
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
    mockRefundIdleChannels.mockResolvedValue([{ transaction: "0xrefund1" }]);

    const res = await handle(makeEvent() as never, {});

    expect(mockRefundIdleChannels).toHaveBeenCalledTimes(RUNS.length);
    expect(mockRefundIdleChannels).toHaveBeenCalledWith({ idleSecs: 21600 });

    const body = JSON.parse(res.body) as { results: Array<{ refunds?: number }> };
    expect(body.results[0].refunds).toBe(1);
  });

  it("refunds only after claiming, so an outstanding voucher is never swept into an enriched refund", async () => {
    const order: string[] = [];
    mockClaimAndSettle.mockImplementation(async () => {
      order.push("claim");
      return { claims: [], settle: undefined };
    });
    mockRefundIdleChannels.mockImplementation(async () => {
      order.push("refund");
      return [];
    });

    await handle(makeEvent() as never, {});

    expect(order.slice(0, 2)).toEqual(["claim", "refund"]);
  });

  it("enhances the refund requirements before sweeping, or every refund is rejected", async () => {
    // The SDK's manager builds `extra: {}` and the facilitator fails closed on a missing
    // receiverAuthorizer, so ordering here is load-bearing, not cosmetic.
    await handle(makeEvent() as never, {});

    expect(mockUseEnhancedRefundRequirements).toHaveBeenCalledTimes(RUNS.length);
    expect(mockUseEnhancedRefundRequirements.mock.invocationCallOrder[0]).toBeLessThan(
      mockRefundIdleChannels.mock.invocationCallOrder[0],
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
    await handle(makeEvent() as never, {});

    expect(mockResyncChannelState).toHaveBeenCalled();
    expect(mockResyncChannelState.mock.invocationCallOrder[0]).toBeLessThan(
      mockRefundIdleChannels.mock.invocationCallOrder[0],
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
    expect(mockRefundIdleChannels).not.toHaveBeenCalled();
  });

  /**
   * A failed refund sweep still reports its successful claim — but the RUN fails.
   *
   * It used to return 200: `refundError` is a different key from `error`, and only `error` was
   * counted, so Scaleway recorded a successful invocation. That is how a refund sweep that failed
   * twice a day went unnoticed for weeks. The claim detail below is what must not be masked; the
   * status code is what must not lie.
   */
  it("a failing refund sweep fails the run without masking a successful claim", async () => {
    mockRefundIdleChannels.mockRejectedValue(new Error("facilitator rejected refund"));

    const res = await handle(makeEvent() as never, {});

    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body) as {
      results: Array<{ claims?: number; refunds?: number; refundError?: string }>;
    };
    expect(body.results[0].claims).toBe(1);
    expect(body.results[0].refundError).toBe("facilitator rejected refund");
    expect(body.results[0].refunds).toBeUndefined();
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
    mockRefundIdleChannels.mockResolvedValue([{ transaction: "0xabc" }]);
    mockStorageList.mockResolvedValue([stuckChannel()]);

    const res = await handle(makeEvent() as never, {});

    expect(res.statusCode).toBe(500);
  });

  it("passes a channel that is idle but has nothing left to refund", async () => {
    mockStorageList.mockResolvedValue([stuckChannel({ balance: "52897" })]);

    const res = await handle(makeEvent() as never, {});

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as {
      results: Array<{ stuckChannels?: string[]; escrowHeld?: string }>;
    };
    expect(body.results[0].stuckChannels).toBeUndefined();
    expect(body.results[0].escrowHeld).toBe("52897");
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
