/**
 * useX402Chat Hook Tests
 *
 * Focuses on the agent-URL decoupling (the open-agent-platform change): the hook must POST
 * to the `agentUrl` it is given, and fall back to the default fretchen endpoint when none is
 * passed. The batch-settlement SDK is mocked at the `@x402/fetch` seam so the paid-fetch URL
 * can be captured without standing up the real channel machinery.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWalletClient, useAccount } from "wagmi";

// Capture the URL the SDK-wrapped fetch is called with.
const paidFetchSpy = vi.fn(async () => ({
  ok: true,
  status: 200,
  headers: { get: () => null },
  json: async () => ({ message: "hi", usage: { prompt_tokens: 1, completion_tokens: 1 } }),
  text: async () => "",
}));

vi.mock("@x402/fetch", () => ({
  x402Client: class {
    register() {}
  },
  x402HTTPClient: class {
    getPaymentSettleResponse() {
      return null;
    }
  },
  // wrapFetchWithPayment(fetchImpl, client) normally returns a fetch that pays on 402;
  // here it just returns our spy so we can assert the URL the hook targets.
  wrapFetchWithPayment: () => paidFetchSpy,
}));

vi.mock("@x402/evm", () => ({ toClientEvmSigner: () => ({}) }));
vi.mock("@x402/evm/batch-settlement/client", () => ({
  BatchSettlementEvmScheme: class {},
}));

vi.mock("wagmi", () => ({
  useWalletClient: vi.fn(),
  useAccount: vi.fn(),
}));

vi.mock("../hooks/useConfiguredPublicClient", () => ({
  useConfiguredPublicClient: () => ({}),
}));

import { useX402Chat } from "../hooks/useX402Chat";

const NETWORK = "eip155:84532";

function connectWallet() {
  vi.mocked(useWalletClient).mockReturnValue({
    data: {
      account: { address: "0x1234567890123456789012345678901234567890" },
      signTypedData: vi.fn(),
    },
  } as unknown as ReturnType<typeof useWalletClient>);
  vi.mocked(useAccount).mockReturnValue({
    isConnected: true,
    address: "0x1234567890123456789012345678901234567890",
  } as ReturnType<typeof useAccount>);
}

describe("useX402Chat agent-URL decoupling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectWallet();
  });

  it("POSTs to the provided agentUrl", async () => {
    const agentUrl = "https://someone-elses-agent.example";
    const { result } = renderHook(() => useX402Chat(NETWORK, agentUrl));

    await act(async () => {
      await result.current.sendMessage([{ role: "user", content: "hi" }]);
    });

    expect(paidFetchSpy).toHaveBeenCalledTimes(1);
    expect(paidFetchSpy.mock.calls[0][0]).toBe(agentUrl);
  });

  it("falls back to the default fretchen endpoint when no agentUrl is given", async () => {
    const { result } = renderHook(() => useX402Chat(NETWORK));

    await act(async () => {
      await result.current.sendMessage([{ role: "user", content: "hi" }]);
    });

    expect(paidFetchSpy).toHaveBeenCalledTimes(1);
    expect(paidFetchSpy.mock.calls[0][0]).toBe("https://llm-agent.fretchen.eu");
  });
});
