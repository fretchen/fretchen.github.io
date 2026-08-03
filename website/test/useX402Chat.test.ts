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
import { useX402Chat, WebStorageClientChannelStorage } from "../hooks/useX402Chat";
import type { X402ChatMessage } from "../types/x402";
import { buildAccountData, buildWalletClientData } from "./setup";

const mockRegister = vi.fn();
const mockGetPaymentSettleResponse = vi.fn();
const mockBatchSettlementEvmScheme = vi.fn();
const mockToClientEvmSigner = vi.fn((...args: unknown[]) => args[0]);

vi.mock("../hooks/useConfiguredPublicClient", () => ({
  useConfiguredPublicClient: vi.fn(() => ({ readContract: vi.fn() })),
  // The hook resolves the client after negotiating, so it uses the plain function form.
  getConfiguredPublicClient: vi.fn(() => ({ readContract: vi.fn() })),
}));

vi.mock("@x402/fetch", () => ({
  // vi.fn() needs a real `function`, not an arrow, to remain usable via `new`.
  x402Client: vi.fn().mockImplementation(function MockX402Client() {
    return { register: mockRegister };
  }),
  // Pass the caller's fetch straight through — lets us drive the real
  // validatingFetch → global fetch path from the hook without a real SDK.
  wrapFetchWithPayment: vi.fn((fetchFn: typeof fetch) => fetchFn),
  x402HTTPClient: vi.fn().mockImplementation(function MockX402HTTPClient() {
    return { getPaymentSettleResponse: mockGetPaymentSettleResponse };
  }),
}));

vi.mock("@x402/evm", () => ({
  toClientEvmSigner: (...args: unknown[]) => mockToClientEvmSigner(...args),
}));

vi.mock("@x402/evm/batch-settlement/client", () => ({
  BatchSettlementEvmScheme: mockBatchSettlementEvmScheme,
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

    /** A fetch that answers the unpaid probe with a 402 offering `networks`, then succeeds. */
    function stubAgentOffering(networks: string[]) {
      const accepts = networks.map((network) => ({ scheme: "batch-settlement", network, payTo: "0xabc" }));
      const header = btoa(JSON.stringify({ accepts }));
      const fetchSpy = vi.fn((_input: string, init?: RequestInit) => {
        const isProbe = init?.body === JSON.stringify({ model: "probe", messages: [] });
        return Promise.resolve(
          isProbe
            ? new Response("{}", { status: 402, headers: { "Payment-Required": header } })
            : new Response(JSON.stringify({ content: "hi" }), { status: 200 }),
        );
      });
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
          const isProbe = init?.body === JSON.stringify({ model: "probe", messages: [] });
          return isProbe
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
});
