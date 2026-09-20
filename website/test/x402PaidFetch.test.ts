/**
 * Tests for the paid-fetch client itself.
 *
 * `useX402Chat.test.ts` drives this module through the hook; the tools' tests mock `paidFetch`
 * wholesale. Neither covers the parts below, which is a gap worth closing on its own: this is the
 * client-side cache of the very channel state whose SERVER-side copy caused the September incident
 * (a facilitator `/verify` that omitted `extra`, so the seller cached zeros and funded channels
 * reported "payment channel too low"). The recovery path here is what stands between that class of
 * drift and a user who cannot spend an escrow they already funded.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRegister = vi.fn();
const mockSetSpendControls = vi.fn();
const mockBatchSettlementEvmScheme = vi.fn();
/** The wrapped transport. Returning it from `wrapFetchWithPayment` lets each case script the
 *  402/200 sequence and — more to the point — COUNT the attempts. */
const mockPaidTransport = vi.fn();
const mockReadChannelBalanceAndTotalClaimed = vi.fn(async (): Promise<readonly [bigint, bigint]> => [1_000_000n, 0n]);

vi.mock("@x402/fetch", () => ({
  // vi.fn() needs a real `function`, not an arrow, to stay usable via `new`.
  x402Client: vi.fn(function MockX402Client() {
    return { register: mockRegister, setSpendControls: mockSetSpendControls };
  }),
  wrapFetchWithPayment: vi.fn(() => mockPaidTransport),
  x402HTTPClient: vi.fn(function MockX402HTTPClient() {
    return { getPaymentSettleResponse: vi.fn() };
  }),
}));

vi.mock("@x402/evm", () => ({
  toClientEvmSigner: vi.fn((...args: unknown[]) => args[0]),
}));

vi.mock("@x402/evm/batch-settlement/client", () => ({
  BatchSettlementEvmScheme: mockBatchSettlementEvmScheme,
  readChannelBalanceAndTotalClaimed: () => mockReadChannelBalanceAndTotalClaimed(),
}));

import { createPaidFetch, PaymentError, WebStorageClientChannelStorage } from "../utils/x402PaidFetch";

const NETWORK = "eip155:10";
const CHANNEL_ID = "0xdd9e576d5d30096bce8ed29916ee2d3faaf3a34269011b881eccfb0e082719d7";

const walletClient = {
  account: { address: "0x1234567890123456789012345678901234567890" },
  signTypedData: vi.fn(),
};

function makeClient(network = NETWORK) {
  return createPaidFetch({
    walletClient,
    publicClient: { readContract: vi.fn() },
    network,
  });
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

/** A cached channel record, shaped as `WebStorageClientChannelStorage.set` writes it. */
function seedChannel(network: string = NETWORK, overrides: Record<string, unknown> = {}) {
  window.localStorage.setItem(
    `x402-channel:${CHANNEL_ID}`,
    JSON.stringify({
      balance: "0",
      totalClaimed: "0",
      chargedCumulativeAmount: "5000",
      network,
      ...overrides,
    }),
  );
}

describe("PaymentError", () => {
  /**
   * Both getters read a reason code out of a JSON body, and the two callers act on them very
   * differently — `channel_busy` is retried by the tool loop, a drained channel is not. A
   * misclassification is therefore either a retry storm or a dead end, neither of which shows up
   * as a thrown error anywhere.
   */
  it("recognises the transient per-channel lock", () => {
    const err = new PaymentError(402, JSON.stringify({ error: "channel_busy" }));
    expect(err.isChannelBusy).toBe(true);
    expect(err.isDrainedChannel).toBe(false);
  });

  it("recognises a drained channel", () => {
    const err = new PaymentError(
      402,
      JSON.stringify({ error: "invalid_batch_settlement_evm_cumulative_exceeds_balance" }),
    );
    expect(err.isDrainedChannel).toBe(true);
    expect(err.isChannelBusy).toBe(false);
  });

  it("claims neither for an unrelated payment failure", () => {
    const err = new PaymentError(402, JSON.stringify({ error: "invalid_signature" }));
    expect(err.isChannelBusy).toBe(false);
    expect(err.isDrainedChannel).toBe(false);
  });

  /** Bodies are not guaranteed to be JSON — a gateway can return HTML. Classification must fail
   *  closed rather than throw out of a getter, which would surface as a crash instead of a
   *  payment failure. */
  it("survives a non-JSON body without throwing", () => {
    const err = new PaymentError(502, "<html>Bad Gateway</html>");
    expect(err.isChannelBusy).toBe(false);
    expect(err.isDrainedChannel).toBe(false);
    expect(err.status).toBe(502);
    expect(err.body).toBe("<html>Bad Gateway</html>");
  });
});

describe("createPaidFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockReadChannelBalanceAndTotalClaimed.mockResolvedValue([1_000_000n, 0n]);
  });

  /**
   * The plan called this "critical": a channel's id hashes its config, so paying on a network the
   * caller did not choose is not a slow path — it is a DIFFERENT channel, and the user is asked to
   * sign a second deposit for escrow they already have. Nothing else in the suite pins it.
   */
  it("registers the scheme on the network it was given, never renegotiating", async () => {
    await makeClient("eip155:8453");

    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockRegister).toHaveBeenCalledWith("eip155:8453", expect.anything());
  });

  it("returns a successful response untouched, with no recovery attempted", async () => {
    mockPaidTransport.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const { paidFetch } = await makeClient();
    const res = await paidFetch("https://web-agent.fretchen.eu/search?q=x");

    expect(res.ok).toBe(true);
    expect(mockPaidTransport).toHaveBeenCalledTimes(1);
    expect(mockReadChannelBalanceAndTotalClaimed).not.toHaveBeenCalled();
  });

  /**
   * The drained-channel path, and the reason it exists: the SDK tops up from the `balance` on our
   * own cached record rather than from the chain, so a record that has drifted low suppresses the
   * top-up and the call fails on an escrow that is actually funded. Re-reading the chain and
   * retrying once is the fix.
   */
  it("resyncs from chain and retries once when the channel reports drained", async () => {
    seedChannel();
    mockPaidTransport
      .mockResolvedValueOnce(jsonResponse(402, { error: "invalid_batch_settlement_evm_cumulative_exceeds_balance" }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const { paidFetch } = await makeClient();
    const res = await paidFetch("https://web-agent.fretchen.eu/search?q=x");

    expect(res.ok).toBe(true);
    expect(mockReadChannelBalanceAndTotalClaimed).toHaveBeenCalled();
    expect(mockPaidTransport).toHaveBeenCalledTimes(2);
  });

  /**
   * ONCE, not until it works. Looping would re-read the chain on every pass when the true problem
   * is something else entirely, turning one bad request into an RPC hammer — and the comment in
   * the implementation says so, which is worth a test rather than trust.
   */
  it("does not retry a second time when the resynced retry also fails", async () => {
    seedChannel();
    // A fresh Response per call, not one shared instance: a body is single-use, and the
    // implementation reads it on both the first attempt and the retry.
    mockPaidTransport.mockImplementation(() =>
      Promise.resolve(jsonResponse(402, { error: "invalid_batch_settlement_evm_cumulative_exceeds_balance" })),
    );

    const { paidFetch } = await makeClient();
    await expect(paidFetch("https://web-agent.fretchen.eu/search?q=x")).rejects.toThrow(PaymentError);

    expect(mockPaidTransport).toHaveBeenCalledTimes(2);
  });

  it("throws without resyncing for a payment failure that is not a drained channel", async () => {
    seedChannel();
    mockPaidTransport.mockResolvedValueOnce(jsonResponse(402, { error: "channel_busy" }));

    const { paidFetch } = await makeClient();
    const err = await paidFetch("https://web-agent.fretchen.eu/search?q=x").catch((e: unknown) => e);

    expect(err).toBeInstanceOf(PaymentError);
    expect((err as PaymentError).isChannelBusy).toBe(true);
    expect(mockPaidTransport).toHaveBeenCalledTimes(1);
    expect(mockReadChannelBalanceAndTotalClaimed).not.toHaveBeenCalled();
  });

  it("reports the top-up so a caller can say a deposit is happening", async () => {
    seedChannel();
    const onTopUp = vi.fn();
    mockPaidTransport
      .mockResolvedValueOnce(jsonResponse(402, { error: "invalid_batch_settlement_evm_cumulative_exceeds_balance" }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const { paidFetch } = await createPaidFetch({
      walletClient,
      publicClient: { readContract: vi.fn() },
      network: NETWORK,
      onTopUp,
    });
    await paidFetch("https://web-agent.fretchen.eu/search?q=x");

    expect(onTopUp).toHaveBeenCalledTimes(1);
  });
});

describe("WebStorageClientChannelStorage.resyncFromChain", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("writes the chain's balance over a record that had drifted low", async () => {
    seedChannel(NETWORK, { balance: "0" });
    const storage = new WebStorageClientChannelStorage(window.localStorage, NETWORK);

    await storage.resyncFromChain(() => Promise.resolve([1_000_000n, 2_000n] as const));

    const stored = JSON.parse(window.localStorage.getItem(`x402-channel:${CHANNEL_ID}`)!) as Record<string, string>;
    expect(stored.balance).toBe("1000000");
    expect(stored.totalClaimed).toBe("2000");
  });

  /**
   * `chargedCumulativeAmount` keeps the LOCAL figure when it leads. Settlement is batched by the
   * 12-hourly cron, so on-chain `totalClaimed` legitimately lags; adopting the lagging number
   * makes the next voucher sign below the server's state and collect `cumulative_amount_mismatch`.
   */
  it("keeps the local cumulative when it leads the chain's totalClaimed", async () => {
    seedChannel(NETWORK, { chargedCumulativeAmount: "5000" });
    const storage = new WebStorageClientChannelStorage(window.localStorage, NETWORK);

    await storage.resyncFromChain(() => Promise.resolve([1_000_000n, 2_000n] as const));

    const stored = JSON.parse(window.localStorage.getItem(`x402-channel:${CHANNEL_ID}`)!) as Record<string, string>;
    expect(stored.chargedCumulativeAmount).toBe("5000");
  });

  /** Another chain's escrow is real, just invisible from the chain being read — so a zero there
   *  is not evidence of anything and must not overwrite the record. */
  it("leaves a record belonging to another network alone", async () => {
    seedChannel("eip155:8453", { balance: "777" });
    const storage = new WebStorageClientChannelStorage(window.localStorage, NETWORK);
    const read = vi.fn(() => Promise.resolve([1_000_000n, 0n] as const));

    await storage.resyncFromChain(read);

    expect(read).not.toHaveBeenCalled();
    const stored = JSON.parse(window.localStorage.getItem(`x402-channel:${CHANNEL_ID}`)!) as Record<string, string>;
    expect(stored.balance).toBe("777");
  });

  /** An RPC failure corrupting a good record was the previous implementation's sin — it zeroed
   *  `balance`, which no later write could restore, and every message then signed a fresh $0.50
   *  deposit. */
  it("leaves a record untouched when the chain read throws", async () => {
    seedChannel(NETWORK, { balance: "42" });
    const storage = new WebStorageClientChannelStorage(window.localStorage, NETWORK);

    await storage.resyncFromChain(() => Promise.reject(new Error("RPC down")));

    const stored = JSON.parse(window.localStorage.getItem(`x402-channel:${CHANNEL_ID}`)!) as Record<string, string>;
    expect(stored.balance).toBe("42");
  });
});
