/**
 * useX402Chat Hook Tests
 *
 * Unlike useX402ImageGeneration.test.ts (which routes around the dynamic @x402/*
 * imports entirely), this mocks @x402/fetch, @x402/evm, and
 * @x402/evm/batch-settlement/client so sendMessage()'s real pay-and-fetch logic
 * runs end-to-end against a mocked SDK — closing the SDK-mocking gap the sibling
 * test leaves open.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWalletClient, useAccount } from "wagmi";
import { useX402Chat } from "../hooks/useX402Chat";
import { WebStorageClientChannelStorage } from "../utils/x402PaidFetch";
import { buildUsdcAllowedAssets } from "../hooks/x402SpendControls";
import { resetAcceptsCache } from "../hooks/x402Discovery";
import type { X402ChatMessage } from "../types/x402";
import { buildAccountData, buildWalletClientData } from "./setup";

const mockRegister = vi.fn();
const mockSetSpendControls = vi.fn();
const mockGetPaymentSettleResponse = vi.fn();
const mockBatchSettlementEvmScheme = vi.fn();
// Chain read behind resyncFromChain: [balance, totalClaimed]. Default is a funded channel,
// so a drained-channel retry re-reads the truth rather than blindly depositing.
const mockReadChannelBalanceAndTotalClaimed = vi.fn(
  async (_signer: unknown, _channelId: unknown): Promise<readonly [bigint, bigint]> => [1_000_000n, 0n],
);
const mockToClientEvmSigner = vi.fn((...args: unknown[]) => args[0]);

vi.mock("../hooks/useConfiguredPublicClient", () => ({
  useConfiguredPublicClient: vi.fn(() => ({ readContract: vi.fn() })),
  // The hook resolves the client after negotiating, so it uses the plain function form.
  getConfiguredPublicClient: vi.fn(() => ({ readContract: vi.fn() })),
}));

vi.mock("@x402/fetch", () => ({
  // vi.fn() needs a real `function`, not an arrow, to remain usable via `new`.
  x402Client: vi.fn(function MockX402Client() {
    return { register: mockRegister, setSpendControls: mockSetSpendControls };
  }),
  // Pass the caller's fetch straight through — lets us drive the real
  // validatingFetch → global fetch path from the hook without a real SDK.
  wrapFetchWithPayment: vi.fn((fetchFn: typeof fetch) => fetchFn),
  x402HTTPClient: vi.fn(function MockX402HTTPClient() {
    return { getPaymentSettleResponse: mockGetPaymentSettleResponse };
  }),
}));

vi.mock("@x402/evm", () => ({
  toClientEvmSigner: (...args: unknown[]) => mockToClientEvmSigner(...args),
}));

vi.mock("@x402/evm/batch-settlement/client", () => ({
  BatchSettlementEvmScheme: mockBatchSettlementEvmScheme,
  readChannelBalanceAndTotalClaimed: (signer: unknown, channelId: unknown) =>
    mockReadChannelBalanceAndTotalClaimed(signer, channelId),
}));

const NETWORK = "eip155:84532";
const mockWalletClient = {
  account: { address: "0x1234567890123456789012345678901234567890" },
  signTypedData: vi.fn(),
};

describe("useX402Chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    // Every case here probes the same agent URL; a cached hit would serve the previous case's
    // accepts[] and silently defeat the per-case fetch mocks.
    resetAcceptsCache();
    mockGetPaymentSettleResponse.mockReturnValue({
      success: true,
      transaction: "0xdeposit",
      network: NETWORK,
    });
  });

  describe("Initial State", () => {
    it("should not be ready when wallet not connected", () => {
      vi.mocked(useWalletClient).mockReturnValue(buildWalletClientData());
      vi.mocked(useAccount).mockReturnValue(buildAccountData({ isConnected: false }));

      const { result } = renderHook(() => useX402Chat(NETWORK));

      expect(result.current.status).toBe("idle");
      expect(result.current.isReady).toBe(false);
    });

    it("should be ready when wallet is connected", () => {
      vi.mocked(useWalletClient).mockReturnValue(buildWalletClientData({ data: mockWalletClient }));
      vi.mocked(useAccount).mockReturnValue(buildAccountData({ isConnected: true }));

      const { result } = renderHook(() => useX402Chat(NETWORK));

      expect(result.current.isReady).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should throw when sendMessage called without a wallet", async () => {
      vi.mocked(useWalletClient).mockReturnValue(buildWalletClientData());
      vi.mocked(useAccount).mockReturnValue(buildAccountData({ isConnected: false }));

      const { result } = renderHook(() => useX402Chat(NETWORK));
      const prompt: X402ChatMessage[] = [{ role: "user", content: "Hi" }];

      await expect(result.current.sendMessage(prompt)).rejects.toThrow("Wallet not connected");
    });
  });

  describe("Paid request (mocked SDK)", () => {
    beforeEach(() => {
      vi.mocked(useWalletClient).mockReturnValue(buildWalletClientData({ data: mockWalletClient }));
      vi.mocked(useAccount).mockReturnValue(buildAccountData({ isConnected: true }));
    });

    it("registers the batch-settlement scheme on the requested network", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: "hi" }), { status: 200 })),
      );

      const { result } = renderHook(() => useX402Chat(NETWORK));
      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "Hi" }]);
      });

      expect(mockToClientEvmSigner).toHaveBeenCalled();
      expect(mockBatchSettlementEvmScheme).toHaveBeenCalledWith(
        expect.objectContaining({ address: mockWalletClient.account.address }),
        expect.objectContaining({
          storage: expect.any(WebStorageClientChannelStorage),
          voucherSigner: expect.objectContaining({ address: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/) }),
          depositStrategy: expect.any(Function),
        }),
      );
      expect(mockRegister).toHaveBeenCalledWith(NETWORK, expect.anything());
    });

    // Regression guard for the production incident where an unconfigured x402Client's
    // default spend controls rejected Optimism USDC (see x402SpendControls.ts).
    it("allowlists USDC on every site network via setSpendControls before registering the scheme", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: "hi" }), { status: 200 })),
      );

      const { result } = renderHook(() => useX402Chat(NETWORK));
      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "Hi" }]);
      });

      expect(mockSetSpendControls).toHaveBeenCalledWith({ allowedAssets: buildUsdcAllowedAssets() });
      expect(mockSetSpendControls.mock.invocationCallOrder[0]).toBeLessThan(mockRegister.mock.invocationCallOrder[0]);
    });

    it("deposit strategy floors deposits/top-ups at $0.50, ignoring the SDK's smaller default", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: "hi" }), { status: 200 })),
      );

      const { result } = renderHook(() => useX402Chat(NETWORK));
      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "Hi" }]);
      });

      const { depositStrategy } = mockBatchSettlementEvmScheme.mock.calls[0][1] as {
        depositStrategy: (ctx: { minimumDepositAmount: string }) => string;
      };

      // Below the floor (e.g. the SDK's own ~1-3 cent default): clamp up to $0.50.
      expect(depositStrategy({ minimumDepositAmount: "15000" })).toBe("500000");
      // Above the floor (an unusually expensive top-up): the SDK requires >= this amount,
      // so it must be respected, not clamped down.
      expect(depositStrategy({ minimumDepositAmount: "600000" })).toBe("600000");
      // Exactly at the floor: either value is correct; assert it's still >= minimum.
      expect(BigInt(depositStrategy({ minimumDepositAmount: "500000" }))).toBeGreaterThanOrEqual(500_000n);
    });

    it("reuses the same delegated voucher signer across multiple messages", async () => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ content: "hi" }), { status: 200 }))),
      );

      const { result } = renderHook(() => useX402Chat(NETWORK));

      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "First" }]);
      });
      const firstVoucherSigner = mockBatchSettlementEvmScheme.mock.calls[0][1].voucherSigner as {
        address: string;
      };

      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "Second" }]);
      });
      const secondVoucherSigner = mockBatchSettlementEvmScheme.mock.calls[1][1].voucherSigner as {
        address: string;
      };

      // Same delegate key both times — proves it's persisted (localStorage), not regenerated
      // per call. A fresh key each call would silently open a brand-new channel every message.
      expect(secondVoucherSigner.address).toBe(firstVoucherSigner.address);
    });

    it("returns the parsed response and sets status through success", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              choices: [{ message: { role: "assistant", content: "Paris is the capital of France." } }],
            }),
            { status: 200 },
          ),
        ),
      );

      const { result } = renderHook(() => useX402Chat(NETWORK));

      let response: Awaited<ReturnType<typeof result.current.sendMessage>> | undefined;
      await act(async () => {
        response = await result.current.sendMessage([{ role: "user", content: "Capital of France?" }]);
      });

      expect(response?.choices[0].message.content).toBe("Paris is the capital of France.");
      expect(result.current.status).toBe("success");
      expect(result.current.error).toBeNull();
    });

    it("extracts the settlement receipt from the response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: "hi" }), { status: 200 })),
      );

      const { result } = renderHook(() => useX402Chat(NETWORK));
      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "Hi" }]);
      });

      expect(result.current.paymentReceipt).toEqual({ transaction: "0xdeposit", network: NETWORK });
    });

    it("keeps the deposit receipt after a later voucher-only message returns an empty transaction", async () => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ content: "hi" }), { status: 200 }))),
      );

      const { result } = renderHook(() => useX402Chat(NETWORK));

      // First message: channel deposit, real tx hash.
      mockGetPaymentSettleResponse.mockReturnValueOnce({
        success: true,
        transaction: "0xdeposit",
        network: NETWORK,
      });
      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "First" }]);
      });
      expect(result.current.paymentReceipt).toEqual({ transaction: "0xdeposit", network: NETWORK });

      // Second message: voucher-only settlement — real server returns transaction: "".
      mockGetPaymentSettleResponse.mockReturnValueOnce({
        success: true,
        transaction: "",
        network: NETWORK,
      });
      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "Second" }]);
      });

      // The deposit receipt must survive — it's still the valid, open channel's tx.
      expect(result.current.paymentReceipt).toEqual({ transaction: "0xdeposit", network: NETWORK });
    });

    it("sets status to error and rethrows when the server responds with a failure", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("payment failed", { status: 402 })));

      const { result } = renderHook(() => useX402Chat(NETWORK));

      let thrown: Error | undefined;
      await act(async () => {
        try {
          await result.current.sendMessage([{ role: "user", content: "Hi" }]);
        } catch (err) {
          thrown = err as Error;
        }
      });

      expect(thrown?.message).toContain("402");
      expect(result.current.status).toBe("error");
      expect(result.current.error).toContain("402");
    });

    it("surfaces a friendly, actionable message for a channel_busy 402", async () => {
      // The transient per-channel lock the server holds across verify→settle. The raw code
      // is opaque and the client SDK does not auto-recover from it, so the hook maps it to
      // a "wait and retry" line instead of dumping the reason code.
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ error: "invalid_batch_settlement_evm_channel_busy" }), {
            status: 402,
          }),
        ),
      );

      const { result } = renderHook(() => useX402Chat(NETWORK));

      let thrown: Error | undefined;
      await act(async () => {
        try {
          await result.current.sendMessage([{ role: "user", content: "Hi" }]);
        } catch (err) {
          thrown = err as Error;
        }
      });

      expect(thrown?.message).toMatch(/still being settled/i);
      expect(thrown?.message).not.toContain("channel_busy");
      expect(result.current.status).toBe("error");
      expect(result.current.error).toMatch(/wait a few seconds/i);
    });

    /**
     * A drained channel is recoverable and the SDK knows how: it tops up inside
     * createPaymentPayload. It decides whether to from the `balance` on our cached record though,
     * so a stale record suppresses it — and its corrective-402 recovery covers
     * cumulative_amount_mismatch and below_claimed but not this reason. Zeroing that balance
     * forces the deposit, while keeping the cumulative the chain cannot restore.
     *
     * Each stub returns a FRESH Response per call: a body is single-use, and a shared
     * mockResolvedValue object would fail the retry with "Body has already been read" — an
     * artifact of the mock, not of the code.
     */
    const drained402 = () =>
      new Response(
        JSON.stringify({
          x402Version: 2,
          error: "invalid_batch_settlement_evm_cumulative_exceeds_balance",
          accepts: [{ scheme: "batch-settlement", network: NETWORK, amount: "9000" }],
        }),
        { status: 402 },
      );

    it("re-syncs the cached balance from chain and retries once when the channel is drained", async () => {
      window.localStorage.setItem(
        "x402-channel:0xstalechannel",
        JSON.stringify({ balance: "500000", chargedCumulativeAmount: "7062" }),
      );
      // sendMessage issues an unpaid discovery probe first, so "first call" and "first paid call"
      // are not the same thing — count only the paid ones, or the drained 402 lands on the probe
      // and the real request sails through unaffected.
      let paidCalls = 0;
      const fetchMock = vi.fn((_input: string, init?: RequestInit) => {
        const isProbe = (() => {
          try {
            return (JSON.parse(init?.body as string) as { model?: string }).model === "probe";
          } catch {
            return false;
          }
        })();
        if (isProbe) return Promise.resolve(new Response("{}", { status: 200 }));
        paidCalls += 1;
        return Promise.resolve(
          paidCalls === 1 ? drained402() : new Response(JSON.stringify({ content: "hi" }), { status: 200 }),
        );
      });
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useX402Chat(NETWORK));

      let returned: unknown;
      await act(async () => {
        returned = await result.current.sendMessage([{ role: "user", content: "Hi" }]);
      });

      // The record survives, re-synced to the chain's real balance. It must NOT be zeroed:
      // `updateChannelFromSettle` only ever does `balance += depositAmount`, so a zero is
      // permanent, and the SDK then re-deposits $0.50 on every subsequent message.
      // `chargedCumulativeAmount` keeps the local figure because it is ahead of the chain's
      // lagging `totalClaimed` — adopting the lag yields cumulative_amount_mismatch.
      const record = JSON.parse(window.localStorage.getItem("x402-channel:0xstalechannel") ?? "{}") as {
        balance?: string;
        chargedCumulativeAmount?: string;
        totalClaimed?: string;
      };
      expect(record.balance).toBe("1000000");
      expect(record.totalClaimed).toBe("0");
      expect(record.chargedCumulativeAmount).toBe("7062");
      // And the message went through rather than dead-ending on the 402.
      expect(returned).toEqual({ content: "hi" });
      expect(result.current.status).toBe("success");
      expect(result.current.error).toBeNull();
    });

    it("retries a drained channel only once, then reports it honestly", async () => {
      // If the top-up itself cannot complete — a declined signature, an empty wallet — looping
      // would sign a fresh real deposit on every pass.
      const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(drained402()));
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useX402Chat(NETWORK));

      let thrown: Error | undefined;
      await act(async () => {
        try {
          await result.current.sendMessage([{ role: "user", content: "Hi" }]);
        } catch (err) {
          thrown = err as Error;
        }
      });

      const paidCalls = fetchMock.mock.calls.filter((args: unknown[]) => {
        const init = args[1] as RequestInit | undefined;
        try {
          return (JSON.parse(init?.body as string) as { model?: string }).model !== "probe";
        } catch {
          return false;
        }
      });
      expect(paidCalls).toHaveLength(2); // the original and exactly one retry
      expect(thrown?.message).toMatch(/needs topping up/i);
      expect(thrown?.message).not.toContain("cumulative_exceeds_balance");
      expect(thrown?.message).not.toContain("x402Version");
      // The wallet balance is NOT the suspect here: the facilitator has a separate code for that
      // (insufficient_balance), so pointing at USDC would send the user to check a non-problem.
      expect(thrown?.message).not.toMatch(/has USDC/i);
    });

    it("re-syncs every channel record from chain without deleting any of them", async () => {
      window.localStorage.setItem(
        "x402-channel:0xone",
        JSON.stringify({ balance: "500000", chargedCumulativeAmount: "10" }),
      );
      window.localStorage.setItem(
        "x402-channel:0xtwo",
        JSON.stringify({ balance: "250000", chargedCumulativeAmount: "20" }),
      );
      window.localStorage.setItem("unrelated-key", "keep me");
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(() => Promise.resolve(drained402())),
      );

      const { result } = renderHook(() => useX402Chat(NETWORK));
      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "Hi" }]).catch(() => {});
      });

      for (const [key, charged] of [
        ["x402-channel:0xone", "10"],
        ["x402-channel:0xtwo", "20"],
      ] as const) {
        const stored = window.localStorage.getItem(key);
        expect(stored).not.toBeNull();
        const record = JSON.parse(stored!) as { balance: string; chargedCumulativeAmount: string };
        expect(record.balance).toBe("1000000");
        expect(record.chargedCumulativeAmount).toBe(charged);
      }
      expect(window.localStorage.getItem("unrelated-key")).toBe("keep me");
    });

    it("leaves a record untouched when the chain read fails", async () => {
      // An RPC hiccup must not corrupt a good record. The predecessor zeroed unconditionally,
      // and a zeroed balance is unrecoverable — every later message then re-deposits $0.50.
      const original = JSON.stringify({ balance: "500000", chargedCumulativeAmount: "7062" });
      window.localStorage.setItem("x402-channel:0xone", original);
      mockReadChannelBalanceAndTotalClaimed.mockRejectedValueOnce(new Error("RPC down"));
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(() => Promise.resolve(drained402())),
      );

      const { result } = renderHook(() => useX402Chat(NETWORK));
      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "Hi" }]).catch(() => {});
      });

      expect(window.localStorage.getItem("x402-channel:0xone")).toBe(original);
    });

    it("leaves another network's record untouched when its chain balance reads zero", async () => {
      // Every network's channels share one localStorage namespace. A zero balance means the
      // channel does not exist on the chain being read — overwriting it would strand that
      // channel's escrow, which is exactly what the blunt zeroing used to do.
      const foreign = JSON.stringify({ balance: "500000", chargedCumulativeAmount: "42" });
      window.localStorage.setItem("x402-channel:0xforeign", foreign);
      window.localStorage.setItem(
        "x402-channel:0xlocal",
        JSON.stringify({ balance: "500000", chargedCumulativeAmount: "10" }),
      );
      // Signature is (signer, channelId) — the channel is the SECOND argument.
      mockReadChannelBalanceAndTotalClaimed.mockImplementation(async (_signer: unknown, channelId: unknown) =>
        String(channelId).includes("foreign") ? ([0n, 0n] as const) : ([1_000_000n, 0n] as const),
      );
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(() => Promise.resolve(drained402())),
      );

      const { result } = renderHook(() => useX402Chat(NETWORK));
      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "Hi" }]).catch(() => {});
      });

      expect(window.localStorage.getItem("x402-channel:0xforeign")).toBe(foreign);
      const local = JSON.parse(window.localStorage.getItem("x402-channel:0xlocal")!) as {
        balance: string;
      };
      expect(local.balance).toBe("1000000");
    });

    it("leaves an unparseable channel record alone instead of throwing", async () => {
      window.localStorage.setItem("x402-channel:0xbroken", "{not json");
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(() => Promise.resolve(drained402())),
      );

      const { result } = renderHook(() => useX402Chat(NETWORK));
      let thrown: Error | undefined;
      await act(async () => {
        try {
          await result.current.sendMessage([{ role: "user", content: "Hi" }]);
        } catch (err) {
          thrown = err as Error;
        }
      });

      // It fails on the payment, not on a JSON parse of our own storage.
      expect(thrown?.message).toMatch(/needs topping up/i);
      expect(window.localStorage.getItem("x402-channel:0xbroken")).toBe("{not json");
    });

    it("names the real problem when the wallet itself is short of USDC", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(() =>
          Promise.resolve(
            new Response(
              JSON.stringify({
                x402Version: 2,
                error: "invalid_batch_settlement_evm_insufficient_balance",
                accepts: [{ scheme: "batch-settlement", network: NETWORK, amount: "9000" }],
              }),
              { status: 402 },
            ),
          ),
        ),
      );

      const { result } = renderHook(() => useX402Chat(NETWORK));
      let thrown: Error | undefined;
      await act(async () => {
        try {
          await result.current.sendMessage([{ role: "user", content: "Hi" }]);
        } catch (err) {
          thrown = err as Error;
        }
      });

      expect(thrown?.message).toMatch(/Not enough USDC/i);
      expect(thrown?.message).toMatch(/USDC\.e/);
    });

    it("does not clear or retry for an unrelated 402", async () => {
      window.localStorage.setItem("x402-channel:0xkeepme", JSON.stringify({ balance: "500000" }));
      const fetchMock = vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(
            new Response(JSON.stringify({ error: "invalid_batch_settlement_evm_channel_busy" }), { status: 402 }),
          ),
        );
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useX402Chat(NETWORK));

      let thrown: Error | undefined;
      await act(async () => {
        try {
          await result.current.sendMessage([{ role: "user", content: "Hi" }]);
        } catch (err) {
          thrown = err as Error;
        }
      });

      expect(window.localStorage.getItem("x402-channel:0xkeepme")).not.toBeNull();
      expect(thrown?.message).toMatch(/still being settled/i);
    });
  });

  describe("Agent URL targeting (open-agent-platform)", () => {
    beforeEach(() => {
      vi.mocked(useWalletClient).mockReturnValue(buildWalletClientData({ data: mockWalletClient }));
      vi.mocked(useAccount).mockReturnValue(buildAccountData({ isConnected: true }));
    });

    it("POSTs to the provided agentUrl", async () => {
      const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: "hi" }), { status: 200 }));
      vi.stubGlobal("fetch", fetchSpy);
      const agentUrl = "https://someone-elses-agent.example";

      const { result } = renderHook(() => useX402Chat(NETWORK, agentUrl));
      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "Hi" }]);
      });

      expect(fetchSpy).toHaveBeenCalledWith(agentUrl, expect.objectContaining({ method: "POST" }));
    });

    it("falls back to the default fretchen endpoint when no agentUrl is given", async () => {
      const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: "hi" }), { status: 200 }));
      vi.stubGlobal("fetch", fetchSpy);

      const { result } = renderHook(() => useX402Chat(NETWORK));
      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "Hi" }]);
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://llm-agent.fretchen.eu",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  /**
   * Network negotiation. With two payable chains, "the agent doesn't offer my chain" is a
   * routine case (a Base-only third-party agent, an Optimism wallet) rather than a
   * misconfiguration — so the hook resolves it instead of dead-ending.
   */
  describe("Network negotiation", () => {
    const OPTIMISM = "eip155:10";
    const BASE = "eip155:8453";

    /**
     * Identify the discovery probe by its placeholder model rather than by an exact body
     * string — the probe body is an implementation detail of x402Discovery and matching it
     * literally makes these tests break whenever it changes.
     */
    function isProbeRequest(init?: RequestInit): boolean {
      if (typeof init?.body !== "string") return false;
      try {
        return (JSON.parse(init.body) as { model?: string }).model === "probe";
      } catch {
        return false;
      }
    }

    /** A fetch that answers the unpaid probe with a 402 offering `networks`, then succeeds. */
    function stubAgentOffering(networks: string[]) {
      const accepts = networks.map((network) => ({ scheme: "batch-settlement", network, payTo: "0xabc" }));
      const header = btoa(JSON.stringify({ accepts }));
      const fetchSpy = vi.fn((_input: string, init?: RequestInit) =>
        Promise.resolve(
          isProbeRequest(init)
            ? new Response("{}", { status: 402, headers: { "Payment-Required": header } })
            : new Response(JSON.stringify({ content: "hi" }), { status: 200 }),
        ),
      );
      vi.stubGlobal("fetch", fetchSpy);
      return fetchSpy;
    }

    beforeEach(() => {
      vi.mocked(useWalletClient).mockReturnValue(buildWalletClientData({ data: mockWalletClient }));
      vi.mocked(useAccount).mockReturnValue(buildAccountData({ isConnected: true }));
    });

    it("pays on the preferred network when the agent offers it", async () => {
      stubAgentOffering([OPTIMISM, BASE]);

      const { result } = renderHook(() => useX402Chat(OPTIMISM));
      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "Hi" }]);
      });

      expect(mockRegister).toHaveBeenCalledWith(OPTIMISM, expect.anything());
      expect(result.current.paymentNetwork).toBe(OPTIMISM);
    });

    it("negotiates down to the network the agent does offer instead of failing", async () => {
      stubAgentOffering([BASE]);

      const { result } = renderHook(() => useX402Chat(OPTIMISM));
      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "Hi" }]);
      });

      expect(mockRegister).toHaveBeenCalledWith(BASE, expect.anything());
      expect(result.current.paymentNetwork).toBe(BASE);
    });

    it("throws with both sides listed when the agent offers nothing payable", async () => {
      stubAgentOffering(["eip155:42161"]);

      const { result } = renderHook(() => useX402Chat(OPTIMISM));

      let thrown: Error | undefined;
      await act(async () => {
        try {
          await result.current.sendMessage([{ role: "user", content: "Hi" }]);
        } catch (err) {
          thrown = err as Error;
        }
      });

      expect(thrown?.message).toContain("eip155:42161");
      expect(thrown?.message).toContain(OPTIMISM);
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it("proceeds on the preferred network when the agent can't be read (CORS/offline)", async () => {
      // A probe that throws must not block payment — the real 402 is the judge.
      vi.stubGlobal(
        "fetch",
        vi.fn((_input: string, init?: RequestInit) => {
          return isProbeRequest(init)
            ? Promise.reject(new TypeError("Failed to fetch"))
            : Promise.resolve(new Response(JSON.stringify({ content: "hi" }), { status: 200 }));
        }),
      );

      const { result } = renderHook(() => useX402Chat(OPTIMISM));
      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "Hi" }]);
      });

      expect(mockRegister).toHaveBeenCalledWith(OPTIMISM, expect.anything());
    });
  });

  describe("Request body — tools (additive)", () => {
    beforeEach(() => {
      vi.mocked(useWalletClient).mockReturnValue(buildWalletClientData({ data: mockWalletClient }));
      vi.mocked(useAccount).mockReturnValue(buildAccountData({ isConnected: true }));
    });

    const tool = {
      type: "function" as const,
      function: { name: "generate_image", parameters: { type: "object" } },
    };

    // sendMessage also issues an unpaid discovery probe (a body with model: "probe") before
    // the real paid POST — see the "Network negotiation" describe block above. Every assertion
    // here needs the real request, not whichever the mock happened to see first.
    function paidRequestBody(fetchMock: ReturnType<typeof vi.fn>): Record<string, unknown> {
      const call = fetchMock.mock.calls.find((args: unknown[]) => {
        const init = args[1] as RequestInit | undefined;
        try {
          return (JSON.parse(init?.body as string) as { model?: string }).model !== "probe";
        } catch {
          return false;
        }
      }) as [string, RequestInit] | undefined;
      if (!call) throw new Error("no non-probe fetch call recorded");
      return JSON.parse(call[1].body as string) as Record<string, unknown>;
    }

    it("omits tools/tool_choice entirely when no options are given", async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: "hi" }), { status: 200 }));
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useX402Chat(NETWORK));
      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "Hi" }]);
      });

      const body = paidRequestBody(fetchMock);
      expect(body).not.toHaveProperty("tools");
      expect(body).not.toHaveProperty("tool_choice");
    });

    it("includes tools and defaults tool_choice to auto when tools are offered", async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: "hi" }), { status: 200 }));
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useX402Chat(NETWORK));
      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "Hi" }], { tools: [tool] });
      });

      const body = paidRequestBody(fetchMock);
      expect(body.tools).toEqual([tool]);
      expect(body.tool_choice).toBe("auto");
    });

    it("forwards an explicit tool_choice", async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: "hi" }), { status: 200 }));
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useX402Chat(NETWORK));
      await act(async () => {
        await result.current.sendMessage([{ role: "user", content: "Hi" }], {
          tools: [tool],
          tool_choice: "none",
        });
      });

      const body = paidRequestBody(fetchMock);
      expect(body.tool_choice).toBe("none");
    });
  });

  describe("Reset Functionality", () => {
    it("should reset state to initial values", () => {
      vi.mocked(useWalletClient).mockReturnValue(buildWalletClientData({ data: mockWalletClient }));
      vi.mocked(useAccount).mockReturnValue(buildAccountData({ isConnected: true }));

      const { result } = renderHook(() => useX402Chat(NETWORK));

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe("idle");
      expect(result.current.error).toBeNull();
      expect(result.current.paymentReceipt).toBeNull();
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});

describe("WebStorageClientChannelStorage", () => {
  const backend = window.localStorage;

  afterEach(() => {
    backend.clear();
  });

  it("returns undefined for a channel that was never stored", async () => {
    const storage = new WebStorageClientChannelStorage(backend);
    await expect(storage.get("0xabc")).resolves.toBeUndefined();
  });

  it("round-trips a channel context through get/set", async () => {
    const storage = new WebStorageClientChannelStorage(backend);
    const context = { chargedCumulativeAmount: "1420", balance: "7100" };

    await storage.set("0xABC", context);

    await expect(storage.get("0xabc")).resolves.toEqual(context);
  });

  it("lowercases the channel id so lookups are case-insensitive", async () => {
    const storage = new WebStorageClientChannelStorage(backend);
    await storage.set("0xAbCdEf", { chargedCumulativeAmount: "1420" });

    expect(backend.getItem("x402-channel:0xabcdef")).not.toBeNull();
    await expect(storage.get("0xABCDEF")).resolves.toEqual({ chargedCumulativeAmount: "1420" });
  });

  it("removes a stored channel on delete", async () => {
    const storage = new WebStorageClientChannelStorage(backend);
    await storage.set("0xabc", { chargedCumulativeAmount: "1420" });

    await storage.delete("0xabc");

    await expect(storage.get("0xabc")).resolves.toBeUndefined();
  });

  /**
   * Records are tagged with their chain, which is what lets `resyncFromChain` read a zero on-chain
   * balance as "this channel is fiction" rather than "this channel is on another chain". Every
   * network's records share one localStorage namespace, so without the tag the two are identical.
   */
  describe("network tagging", () => {
    const OPTIMISM = "eip155:10";
    const BASE = "eip155:8453";
    const FUNDED = [1_000_000n, 40_000n] as const;
    const EMPTY = [0n, 0n] as const;

    /** What the SDK stores, plus the tag we add. Written raw so a record can be posed as untagged,
     *  which is how every record written before tagging shipped looks. */
    function writeRecord(id: string, record: Record<string, unknown>) {
      backend.setItem(`x402-channel:${id}`, JSON.stringify(record));
    }
    const readRecord = (id: string) => JSON.parse(backend.getItem(`x402-channel:${id}`) ?? "null");

    it("tags a written record with its network, and hides the tag from the SDK", async () => {
      const storage = new WebStorageClientChannelStorage(backend, OPTIMISM);
      const context = { chargedCumulativeAmount: "1420", balance: "7100" };

      await storage.set("0xabc", context);

      expect(readRecord("0xabc")).toMatchObject({ network: OPTIMISM });
      // The SDK gets back exactly what it wrote — the tag is our bookkeeping, not part of its
      // channel context.
      await expect(storage.get("0xabc")).resolves.toEqual(context);
    });

    it("leaves another network's record alone, without even reading the chain for it", async () => {
      writeRecord("0xbase", { network: BASE, balance: "500000", chargedCumulativeAmount: "100" });
      const read = vi.fn();

      await new WebStorageClientChannelStorage(backend, OPTIMISM).resyncFromChain(read);

      expect(read).not.toHaveBeenCalled();
      expect(readRecord("0xbase")).toMatchObject({ balance: "500000" });
    });

    /**
     * A zero read is not evidence that the record is wrong, tagged or not. This briefly deleted
     * such records: the incident that prompted it turned out to be the *server's* cached balance
     * reading 0 while the chain held 544239 and this record said so correctly, so deleting would
     * have thrown away the accurate copy. `scw_js/x402_channel_sync.ts` documents the drift.
     */
    it.each([
      ["tagged for this network", { network: OPTIMISM, balance: "544239", chargedCumulativeAmount: "52897" }],
      ["untagged, written before tagging shipped", { balance: "544239", chargedCumulativeAmount: "52897" }],
    ])("leaves a record %s alone when the chain reads zero", async (_label, record) => {
      writeRecord("0xquiet", record);

      await new WebStorageClientChannelStorage(backend, OPTIMISM).resyncFromChain(() => Promise.resolve(EMPTY));

      expect(readRecord("0xquiet")).toMatchObject({ balance: "544239", chargedCumulativeAmount: "52897" });
    });

    /** A real balance is itself proof of which chain the record belongs to, so the resync is also
     *  where an untagged record gets its tag — no need to wait for the next settle. */
    it("tags an untagged record once the chain confirms it", async () => {
      writeRecord("0xlegacy", { balance: "1", chargedCumulativeAmount: "52897" });

      await new WebStorageClientChannelStorage(backend, OPTIMISM).resyncFromChain(() => Promise.resolve(FUNDED));

      expect(readRecord("0xlegacy")).toMatchObject({
        network: OPTIMISM,
        balance: "1000000",
        // Kept because it is ahead of the chain's totalClaimed — settlement here is batched.
        chargedCumulativeAmount: "52897",
      });
    });
  });
});
