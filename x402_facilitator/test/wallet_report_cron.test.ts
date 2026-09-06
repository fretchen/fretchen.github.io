import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ===== Mocks (vi.hoisted so factories can reference them) =====

const {
  mockGetFacilitatorAddress,
  mockGetFeeAmount,
  mockGetChainConfig,
  mockGetRpcUrl,
  mockCreatePublicClient,
  mockGetContract,
} = vi.hoisted(() => ({
  mockGetFacilitatorAddress: vi.fn(),
  mockGetFeeAmount: vi.fn(),
  mockGetChainConfig: vi.fn(),
  mockGetRpcUrl: vi.fn(),
  mockCreatePublicClient: vi.fn(),
  mockGetContract: vi.fn(),
}));

vi.mock("../x402_fee", () => ({
  getFacilitatorAddress: mockGetFacilitatorAddress,
  getFeeAmount: mockGetFeeAmount,
}));

vi.mock("../chain_utils", () => ({
  getChainConfig: mockGetChainConfig,
  getRpcUrl: mockGetRpcUrl,
}));

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return {
    ...actual,
    createPublicClient: mockCreatePublicClient,
    getContract: mockGetContract,
  };
});

// ===== Import after mocks =====

import { handle } from "../wallet_report_cron";

// ===== Helpers =====

const FACILITATOR = "0x1234567890abcdef1234567890abcdef12345678" as const;

// Comfortably above LOOKBACK_BLOCKS (302_400) so the activity code path always runs
// unless a test deliberately wants to exercise the "too young" guard.
const DEFAULT_CURRENT_BLOCK = 10_000_000n;

function makeEvent() {
  return { httpMethod: "GET", headers: {}, body: undefined };
}

interface ActivityRow {
  txCount: number;
  usdcDelta: string;
  ethDelta: string;
  estimatedSettlements?: number;
}

interface ReportRow {
  network: string;
  eth?: string;
  usdc?: string;
  lowGas?: boolean;
  error?: string;
  activity?: ActivityRow;
}

/**
 * Configure the viem publicClient mock.
 *
 * `getBalance`/`getTransactionCount` are called twice each — once with no `blockNumber`
 * (current) and once with one (the ~7-day-ago lookback) — so the stub distinguishes on
 * that argument. Defaults make "now" equal "past" (zero activity) unless a test overrides
 * the past values, matching the real zero-traffic state this was built against.
 */
function setupClient(opts: {
  ethBalance: bigint;
  pastEthBalance?: bigint;
  currentNonce?: number;
  pastNonce?: number;
  currentBlock?: bigint;
  throwOn?: "getBalance" | "getBlockNumber" | "getTransactionCount";
  /** Only the historical (blockNumber-scoped) calls fail — current-state calls still work. */
  throwOnHistoryOnly?: boolean;
}) {
  const getBalance = vi.fn((args: { blockNumber?: bigint } = {}) => {
    const isHistorical = args.blockNumber !== undefined;
    if (opts.throwOn === "getBalance" && (!opts.throwOnHistoryOnly || isHistorical)) {
      return Promise.reject(new Error("rpc down"));
    }
    return Promise.resolve(
      isHistorical ? (opts.pastEthBalance ?? opts.ethBalance) : opts.ethBalance,
    );
  });

  const getBlockNumber = vi.fn(() => {
    if (opts.throwOn === "getBlockNumber") {
      return Promise.reject(new Error("no archive state"));
    }
    return Promise.resolve(opts.currentBlock ?? DEFAULT_CURRENT_BLOCK);
  });

  const getTransactionCount = vi.fn((args: { blockNumber?: bigint } = {}) => {
    const isHistorical = args.blockNumber !== undefined;
    if (opts.throwOn === "getTransactionCount" && (!opts.throwOnHistoryOnly || isHistorical)) {
      return Promise.reject(new Error("rpc down"));
    }
    return Promise.resolve(isHistorical ? (opts.pastNonce ?? 0) : (opts.currentNonce ?? 0));
  });

  return { getBalance, getBlockNumber, getTransactionCount };
}

/** Configure the USDC contract mock's balanceOf, distinguishing current vs. historical reads. */
function usdcBalanceOf(current: bigint, past: bigint = current) {
  return vi.fn((_args: unknown[], readOpts?: { blockNumber?: bigint }) =>
    Promise.resolve(readOpts?.blockNumber !== undefined ? past : current),
  );
}

describe("wallet_report_cron", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    process.env.TEM_PROJECT_ID = "proj-123";
    process.env.NOTIFICATION_EMAIL = "me@example.com";
    process.env.SCW_SECRET_KEY = "secret";
    process.env.LOW_GAS_THRESHOLD_ETH = "0.005";

    mockGetFacilitatorAddress.mockReturnValue(FACILITATOR);
    mockGetFeeAmount.mockReturnValue(10000n); // 0.01 USDC
    mockGetChainConfig.mockImplementation((network: string) => ({
      chain: { name: network === "eip155:10" ? "OP Mainnet" : "Base" },
      USDC_ADDRESS: "0xUSDC",
      USDC_NAME: "USD Coin",
      SPLITTER_ADDRESS: null,
    }));
    mockGetRpcUrl.mockReturnValue("https://rpc.example");

    // Default: no USDC change (past === current) — matches the real zero-activity state.
    mockGetContract.mockReturnValue({ read: { balanceOf: usdcBalanceOf(1_500_000n) } });

    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "" });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TEM_PROJECT_ID;
    delete process.env.NOTIFICATION_EMAIL;
    delete process.env.SCW_SECRET_KEY;
    delete process.env.LOW_GAS_THRESHOLD_ETH;
  });

  it("returns 500 when the facilitator wallet is not configured", async () => {
    mockGetFacilitatorAddress.mockReturnValue(null);
    const res = await handle(makeEvent(), {});
    expect(res.statusCode).toBe(500);
    expect(mockCreatePublicClient).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports both mainnets' balances and sends the email", async () => {
    mockCreatePublicClient.mockReturnValue(
      setupClient({ ethBalance: 1_000_000_000_000_000_000n }), // 1 ETH
    );

    const res = await handle(makeEvent(), {});
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body) as { facilitator: string; reports: ReportRow[] };
    expect(body.facilitator).toBe(FACILITATOR);
    expect(body.reports).toHaveLength(2);

    const op = body.reports[0];
    expect(op.network).toBe("eip155:10");
    expect(op.eth).toBe("1");
    expect(op.usdc).toBe("1.5");
    expect(op.lowGas).toBe(false);

    // Email sent once via Scaleway TEM
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("transactional-email");
    const payload = JSON.parse(init.body);
    expect(payload.to[0].email).toBe("me@example.com");
    expect(payload.subject).toContain("Facilitator weekly report");
  });

  it("flags lowGas when native balance is below the threshold", async () => {
    mockCreatePublicClient.mockReturnValue(
      setupClient({ ethBalance: 1_000_000_000_000_000n }), // 0.001 ETH < 0.005
    );

    const res = await handle(makeEvent(), {});
    const body = JSON.parse(res.body) as { reports: ReportRow[] };
    expect(body.reports[0].lowGas).toBe(true);

    // The low-gas warning text is in the email body
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.text).toContain("LOW");
  });

  it("degrades one network to an error but still reports the other and returns 200", async () => {
    mockCreatePublicClient
      .mockReturnValueOnce(setupClient({ ethBalance: 0n, throwOn: "getBalance" }))
      .mockReturnValueOnce(setupClient({ ethBalance: 2_000_000_000_000_000_000n }));

    const res = await handle(makeEvent(), {});
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body) as { reports: ReportRow[] };
    expect(body.reports[0].error).toBe("rpc down");
    expect(body.reports[1].error).toBeUndefined();
    expect(body.reports[1].eth).toBe("2");
  });

  it("returns 500 when every network fails", async () => {
    mockCreatePublicClient.mockReturnValue(setupClient({ ethBalance: 0n, throwOn: "getBalance" }));

    const res = await handle(makeEvent(), {});
    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body) as { reports: ReportRow[] };
    expect(body.reports.every((r) => r.error !== undefined)).toBe(true);
  });

  it("skips the email (but still returns 200) when TEM vars are missing", async () => {
    delete process.env.TEM_PROJECT_ID;
    mockCreatePublicClient.mockReturnValue(setupClient({ ethBalance: 1_000_000_000_000_000_000n }));

    const res = await handle(makeEvent(), {});
    expect(res.statusCode).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // ═══════════════════════════════════════════════════════════
  // Weekly activity (historical balance/nonce diff)
  //
  // Own describe block: this is a second, independently-failing read layered onto the
  // balance report above. Every case here must leave the existing balance/lowGas
  // behavior untouched.
  // ═══════════════════════════════════════════════════════════

  describe("activity", () => {
    it("reports transactions, fee revenue, and an estimated settlement count", async () => {
      mockCreatePublicClient.mockReturnValue(
        setupClient({
          ethBalance: 1_000_000_000_000_000_000n,
          pastEthBalance: 1_000_500_000_000_000_000n, // spent 0.0005 ETH on gas
          currentNonce: 12,
          pastNonce: 0,
        }),
      );
      // +0.12 USDC over the window == 12 settlements at the mocked 0.01 USDC fee.
      mockGetContract.mockReturnValue({
        read: { balanceOf: usdcBalanceOf(1_620_000n, 1_500_000n) },
      });

      const res = await handle(makeEvent(), {});
      const body = JSON.parse(res.body) as { reports: ReportRow[] };
      const op = body.reports[0];

      expect(op.activity).toEqual({
        txCount: 12,
        usdcDelta: "0.12",
        ethDelta: "-0.0005",
        estimatedSettlements: 12,
      });

      const emailText = JSON.parse(fetchMock.mock.calls[0][1].body).text as string;
      expect(emailText).toContain("Transactions:  12");
      expect(emailText).toContain("+0.12 USDC");
      expect(emailText).toContain("≈ 12 settlements");
    });

    it("renders zero activity cleanly — today's real-world state", async () => {
      mockCreatePublicClient.mockReturnValue(
        setupClient({ ethBalance: 1_000_000_000_000_000_000n }),
      );
      // beforeEach's default USDC mock already has past === current (zero delta).

      const res = await handle(makeEvent(), {});
      const body = JSON.parse(res.body) as { reports: ReportRow[] };

      expect(body.reports[0].activity).toEqual({
        txCount: 0,
        usdcDelta: "0",
        ethDelta: "0",
      });
      // No fee delta => no settlement estimate, even though a fee is configured.
      expect(body.reports[0].activity?.estimatedSettlements).toBeUndefined();
    });

    it("renders a net withdrawal as negative, never as fees earned", async () => {
      mockCreatePublicClient.mockReturnValue(
        setupClient({ ethBalance: 1_000_000_000_000_000_000n }),
      );
      // Balance went DOWN over the window — e.g. an operator withdrawal.
      mockGetContract.mockReturnValue({
        read: { balanceOf: usdcBalanceOf(1_000_000n, 1_500_000n) },
      });

      const res = await handle(makeEvent(), {});
      const body = JSON.parse(res.body) as { reports: ReportRow[] };

      expect(body.reports[0].activity?.usdcDelta).toBe("-0.5");
      expect(body.reports[0].activity?.estimatedSettlements).toBeUndefined();

      const emailText = JSON.parse(fetchMock.mock.calls[0][1].body).text as string;
      expect(emailText).toContain("-0.5 USDC");
      expect(emailText).not.toContain("settlements)");
    });

    it("omits activity (but still reports balances) when historical reads fail", async () => {
      mockCreatePublicClient.mockReturnValue(
        setupClient({
          ethBalance: 1_000_000_000_000_000_000n,
          throwOn: "getTransactionCount",
          throwOnHistoryOnly: true,
        }),
      );

      const res = await handle(makeEvent(), {});
      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body) as { reports: ReportRow[] };
      const op = body.reports[0];
      // Balances are completely unaffected by the historical-read failure.
      expect(op.error).toBeUndefined();
      expect(op.eth).toBe("1");
      expect(op.usdc).toBe("1.5");
      expect(op.activity).toBeUndefined();

      const emailText = JSON.parse(fetchMock.mock.calls[0][1].body).text as string;
      expect(emailText).toContain("unavailable");
    });
  });
});
