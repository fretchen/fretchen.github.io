import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ===== Mocks (vi.hoisted so factories can reference them) =====

const {
  mockGetFacilitatorAddress,
  mockGetChainConfig,
  mockGetRpcUrl,
  mockCreatePublicClient,
  mockGetContract,
} = vi.hoisted(() => ({
  mockGetFacilitatorAddress: vi.fn(),
  mockGetChainConfig: vi.fn(),
  mockGetRpcUrl: vi.fn(),
  mockCreatePublicClient: vi.fn(),
  mockGetContract: vi.fn(),
}));

vi.mock("../x402_fee", () => ({
  getFacilitatorAddress: mockGetFacilitatorAddress,
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

function makeEvent() {
  return { httpMethod: "GET", headers: {}, body: undefined };
}

interface ReportRow {
  network: string;
  eth?: string;
  usdc?: string;
  lowGas?: boolean;
  error?: string;
}

/**
 * Configure the viem publicClient mock (getBalance). `throwOn` makes a call reject
 * to simulate an RPC failure on a network. USDC balanceOf is stubbed via getContract
 * in beforeEach.
 */
function setupClient(opts: { ethBalance: bigint; throwOn?: "getBalance" }) {
  const getBalance =
    opts.throwOn === "getBalance"
      ? vi.fn().mockRejectedValue(new Error("rpc down"))
      : vi.fn().mockResolvedValue(opts.ethBalance);

  return { getBalance };
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
    mockGetChainConfig.mockImplementation((network: string) => ({
      chain: { name: network === "eip155:10" ? "OP Mainnet" : "Base" },
      USDC_ADDRESS: "0xUSDC",
      USDC_NAME: "USD Coin",
      SPLITTER_ADDRESS: null,
    }));
    mockGetRpcUrl.mockReturnValue("https://rpc.example");

    // USDC contract stub: read.balanceOf
    mockGetContract.mockReturnValue({
      read: { balanceOf: vi.fn().mockResolvedValue(1_500_000n) }, // 1.5 USDC
    });

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
    mockCreatePublicClient.mockReturnValue(
      setupClient({ ethBalance: 1_000_000_000_000_000_000n }),
    );

    const res = await handle(makeEvent(), {});
    expect(res.statusCode).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
