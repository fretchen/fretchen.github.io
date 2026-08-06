import { describe, it, expect, vi, beforeEach } from "vitest";

// ===== Mocks (vi.hoisted ensures these are available when vi.mock factories run) =====

const { mockCreateLLMResourceServer, mockCreateFacilitatorClient, mockGetBatchSettlementNetworks } =
  vi.hoisted(() => ({
    mockCreateLLMResourceServer: vi.fn(),
    mockCreateFacilitatorClient: vi.fn(),
    mockGetBatchSettlementNetworks: vi.fn(),
  }));

vi.mock("../x402_server.js", () => ({
  createLLMResourceServer: mockCreateLLMResourceServer,
  createFacilitatorClient: mockCreateFacilitatorClient,
  getBatchSettlementNetworks: mockGetBatchSettlementNetworks,
}));

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

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NFT_WALLET_PUBLIC_KEY = VALID_ADDRESS;

    mockClaimAndSettle = vi.fn().mockResolvedValue({
      claims: [{ vouchers: 2, transaction: "0xclaimtx" }],
      settle: { transaction: "0xsettletx" },
    });
    mockCreateChannelManager = vi.fn().mockReturnValue({ claimAndSettle: mockClaimAndSettle });

    mockCreateLLMResourceServer.mockReturnValue({
      resourceServer: {},
      scheme: { createChannelManager: mockCreateChannelManager },
    });
    mockCreateFacilitatorClient.mockReturnValue({});
    mockGetBatchSettlementNetworks.mockReturnValue(["eip155:10", "eip155:8453", "eip155:84532"]);
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
    expect(body.results[0]).toEqual({ network: "eip155:10", claims: 1, settled: true });
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
    expect(body.results[0]).toEqual({ network: "eip155:10", claims: 0, settled: false });
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
});
