import { describe, it, expect, vi, beforeEach } from "vitest";

// ===== Mocks (vi.hoisted ensures these are available when vi.mock factories run) =====

const {
  mockCreateLLMResourceServer,
  mockCreateFacilitatorClient,
  mockGetBatchSettlementNetworks,
  mockGetFacilitatorFeeConfig,
  mockReadContract,
  mockLoggerWarn,
} = vi.hoisted(() => ({
  mockCreateLLMResourceServer: vi.fn(),
  mockCreateFacilitatorClient: vi.fn(),
  mockGetBatchSettlementNetworks: vi.fn(),
  mockGetFacilitatorFeeConfig: vi.fn(),
  mockReadContract: vi.fn(),
  mockLoggerWarn: vi.fn(),
}));

vi.mock("../x402_server.js", () => ({
  createLLMResourceServer: mockCreateLLMResourceServer,
  createFacilitatorClient: mockCreateFacilitatorClient,
  getBatchSettlementNetworks: mockGetBatchSettlementNetworks,
  getFacilitatorFeeConfig: mockGetFacilitatorFeeConfig,
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

// ===== Helpers =====

const VALID_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";

function makeEvent() {
  return { httpMethod: "GET", headers: {}, body: null };
}

// ===== Tests =====

describe("llm_x402_cron", () => {
  let mockCreateChannelManager: ReturnType<typeof vi.fn>;
  let mockClaimAndSettle: ReturnType<typeof vi.fn>;
  let mockRefundIdleChannels: ReturnType<typeof vi.fn>;
  let mockSchemeFor: ReturnType<typeof vi.fn>;

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

    // One scheme per network, each owning storage scoped to that network's S3 prefix.
    mockSchemeFor = vi.fn().mockReturnValue({ createChannelManager: mockCreateChannelManager });
    mockCreateLLMResourceServer.mockReturnValue({
      resourceServer: {},
      schemeFor: mockSchemeFor,
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

  it("runs claimAndSettle once per batch-settlement network and returns 200", async () => {
    const res = await handle(makeEvent() as never, {});
    expect(res.statusCode).toBe(200);
    expect(mockCreateChannelManager).toHaveBeenCalledTimes(3);
    expect(mockClaimAndSettle).toHaveBeenCalledTimes(3);

    const body = JSON.parse(res.body) as { results: Array<{ network: string; claims: number }> };
    expect(body.results).toHaveLength(3);
    expect(body.results[0]).toEqual({
      network: "eip155:10",
      claims: 1,
      settled: true,
      refunds: 0,
      feeAllowanceClaimsLeft: 100,
    });
  });

  /**
   * Regression guard for the Optimism enablement: `createChannelManager`'s token argument is
   * optional, and omitting it makes the SDK fall back to its `DEFAULT_STABLECOINS` registry —
   * which has no eip155:10 entry and throws "No default asset configured". The cron would
   * then silently stop claiming revenue on Optimism.
   */
  it("passes each network's USDC address explicitly, never relying on the SDK registry", async () => {
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
      claims: 0,
      settled: false,
      refunds: 0,
      feeAllowanceClaimsLeft: 100,
    });
  });

  it("continues to other networks and returns 500 when one network's claimAndSettle throws", async () => {
    mockClaimAndSettle
      .mockRejectedValueOnce(new Error("facilitator unreachable"))
      .mockResolvedValueOnce({ claims: [], settle: undefined })
      .mockResolvedValueOnce({ claims: [], settle: undefined });

    const res = await handle(makeEvent() as never, {});
    expect(res.statusCode).toBe(500);
    expect(mockClaimAndSettle).toHaveBeenCalledTimes(3);

    const body = JSON.parse(res.body) as { results: Array<{ network: string; error?: string }> };
    expect(body.results[0].error).toBe("facilitator unreachable");
    expect(body.results[1].error).toBeUndefined();
  });

  // ═══════════════════════════════════════════════════════════
  // Per-network scoping
  //
  // The outage this guards against: one `S3ChannelStorage` was shared by every network, so
  // `list()` fed Base channels into Optimism claim batches. Every batch reverted with
  // claim_simulation_failed — 3 failures per run, 14 runs, zero claims — while USDC kept
  // accumulating in escrow. Each network must now get its own scheme, and therefore its own
  // storage prefix.
  // ═══════════════════════════════════════════════════════════

  it("asks for a scheme scoped to each network, never reusing one across networks", async () => {
    await handle(makeEvent() as never, {});

    expect(mockSchemeFor).toHaveBeenCalledTimes(3);
    expect(mockSchemeFor.mock.calls.map((c) => c[0])).toEqual([
      "eip155:10",
      "eip155:8453",
      "eip155:84532",
    ]);
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

    expect(mockRefundIdleChannels).toHaveBeenCalledTimes(3);
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

  it("a failing refund sweep never masks a successful claim", async () => {
    mockRefundIdleChannels.mockRejectedValue(new Error("facilitator rejected refund"));

    const res = await handle(makeEvent() as never, {});

    // The claim succeeded, so the run is still a 200 and still reports its claims.
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as {
      results: Array<{ claims?: number; refunds?: number; refundError?: string }>;
    };
    expect(body.results[0].claims).toBe(1);
    expect(body.results[0].refundError).toBe("facilitator rejected refund");
    expect(body.results[0].refunds).toBeUndefined();
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
      expect.objectContaining({ network: "eip155:10", claimsLeft: 5 }),
      expect.stringContaining("insufficient_fee_allowance"),
    );
    // The warning is advisory — collection must still happen.
    expect(mockClaimAndSettle).toHaveBeenCalledTimes(3);
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
    expect(mockClaimAndSettle).toHaveBeenCalledTimes(3);
    // Unreadable is not "low": no warning, and no runway reported rather than a made-up 0.
    const body = JSON.parse(res.body) as { results: Array<Record<string, unknown>> };
    expect(body.results[0].feeAllowanceClaimsLeft).toBeUndefined();
  });

  it("skips the allowance read entirely when the facilitator charges no fee", async () => {
    mockGetFacilitatorFeeConfig.mockResolvedValue(null);

    const res = await handle(makeEvent() as never, {});

    expect(mockReadContract).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(mockClaimAndSettle).toHaveBeenCalledTimes(3);
  });
});
