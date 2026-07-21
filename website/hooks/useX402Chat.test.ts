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
import { useX402Chat, WebStorageClientChannelStorage } from "./useX402Chat";
import type { X402ChatMessage } from "../types/x402";

const mockRegister = vi.fn();
const mockGetPaymentSettleResponse = vi.fn();
const mockBatchSettlementEvmScheme = vi.fn();
const mockToClientEvmSigner = vi.fn((signer: unknown) => signer);

vi.mock("../hooks/useConfiguredPublicClient", () => ({
  useConfiguredPublicClient: vi.fn(() => ({ readContract: vi.fn() })),
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
      vi.mocked(useWalletClient).mockReturnValue({ data: undefined } as ReturnType<typeof useWalletClient>);
      vi.mocked(useAccount).mockReturnValue({ isConnected: false } as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useX402Chat(NETWORK));

      expect(result.current.status).toBe("idle");
      expect(result.current.isReady).toBe(false);
    });

    it("should be ready when wallet is connected", () => {
      vi.mocked(useWalletClient).mockReturnValue({ data: mockWalletClient } as ReturnType<typeof useWalletClient>);
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useX402Chat(NETWORK));

      expect(result.current.isReady).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should throw when sendMessage called without a wallet", async () => {
      vi.mocked(useWalletClient).mockReturnValue({ data: undefined } as ReturnType<typeof useWalletClient>);
      vi.mocked(useAccount).mockReturnValue({ isConnected: false } as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useX402Chat(NETWORK));
      const prompt: X402ChatMessage[] = [{ role: "user", content: "Hi" }];

      await expect(result.current.sendMessage(prompt)).rejects.toThrow("Wallet not connected");
    });
  });

  describe("Paid request (mocked SDK)", () => {
    beforeEach(() => {
      vi.mocked(useWalletClient).mockReturnValue({ data: mockWalletClient } as ReturnType<typeof useWalletClient>);
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);
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
        }),
      );
      expect(mockRegister).toHaveBeenCalledWith(NETWORK, expect.anything());
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
        vi
          .fn()
          .mockResolvedValue(
            new Response(JSON.stringify({ content: "Paris is the capital of France." }), { status: 200 }),
          ),
      );

      const { result } = renderHook(() => useX402Chat(NETWORK));

      let response: { content: string } | undefined;
      await act(async () => {
        response = await result.current.sendMessage([{ role: "user", content: "Capital of France?" }]);
      });

      expect(response?.content).toBe("Paris is the capital of France.");
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

  describe("Reset Functionality", () => {
    it("should reset state to initial values", () => {
      vi.mocked(useWalletClient).mockReturnValue({ data: mockWalletClient } as ReturnType<typeof useWalletClient>);
      vi.mocked(useAccount).mockReturnValue({ isConnected: true } as ReturnType<typeof useAccount>);

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
