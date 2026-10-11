/**
 * Pins the stateless MCP endpoint (docs.x402.org → MCP; modelcontextprotocol.io spec):
 * the JSON-RPC surface a no-session server must answer, and the translation layer that
 * relays tools/call to the REAL handlers — so these tests exercise the actual challenge
 * configs, cost rules, and payment paths of `search_api.ts` / `sc_llm_x402.ts`, not a
 * parallel implementation. The x402 SDK surface is mocked the way the handlers' own
 * suites mock it (S3 and secrets stay out); everything between the MCP request and the
 * SDK — event synthesis, the payment-header encoding, the 402/200 translation — is REAL.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

const USDC_TESTNET = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
/** The seller's own address (`NFT_WALLET_PUBLIC_KEY`) — Anvil account #2, as elsewhere. */
const RECEIVER = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

const {
  mockVerifyPayment,
  mockSettlePayment,
  mockCreatePaymentRequiredResponse,
  mockEnhancePaymentRequirements,
  mockCreateLLMResourceServer,
  mockReleaseLock,
  mockCallLLMAPI,
  mockSearchWeb,
} = vi.hoisted(() => ({
  mockVerifyPayment: vi.fn(),
  mockSettlePayment: vi.fn(),
  mockCreatePaymentRequiredResponse: vi.fn(),
  // Echoes the base requirements back, as the handlers' own suites do — enough for the
  // REAL createBatchSettlementPaymentRequirements to build accepts from the real config.
  mockEnhancePaymentRequirements: vi.fn(),
  mockCreateLLMResourceServer: vi.fn(),
  mockReleaseLock: vi.fn(),
  mockCallLLMAPI: vi.fn(),
  mockSearchWeb: vi.fn(),
}));

// The seller SDK surface is mocked exactly as far as the handlers need (the resource
// server wants S3 and a receiver-authorizer key); everything else in x402_server.ts —
// createBatchSettlementPaymentRequirements, create402Response, extractPaymentPayload,
// createSettlementHeaders — runs REAL, so the challenge configs that flow through the
// translation are the production ones.
vi.mock("../x402_server.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../x402_server.js")>();
  return {
    ...actual,
    createLLMResourceServer: mockCreateLLMResourceServer,
    releaseLock: mockReleaseLock,
  };
});

vi.mock("../llm_service.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../llm_service.js")>();
  return {
    ...actual,
    callLLMAPI: mockCallLLMAPI,
    // Real formula (matches llm_service.ts's actual tokensToCost — see
    // test/sc_llm_x402.test.ts's mock for the rationale): the settlement-amount tests
    // depend on it computing, not on a fixed stub.
    tokensToCost: (
      usage: {
        prompt_tokens: bigint | number | string;
        completion_tokens: bigint | number | string;
      },
      provider: string,
      symbol: "USDC" | "EURC" | "EURe",
      decimals: number,
    ) => {
      const RATES: Record<string, Record<string, { in: bigint; out: bigint; den: bigint }>> = {
        mistral: {
          USDC: { in: 50n, out: 150n, den: 100n },
          EURC: { in: 44n, out: 150n, den: 100n },
          EURe: { in: 44n, out: 150n, den: 100n },
        },
      };
      const rate = RATES[provider]?.[symbol];
      if (!rate) throw new Error(`Unknown LLM provider: ${provider}`);
      const p = BigInt(usage.prompt_tokens);
      const c = BigInt(usage.completion_tokens);
      const base = (p * rate.in + c * rate.out) / rate.den;
      return decimals === 6 ? base : base * 10n ** BigInt(decimals - 6);
    },
  };
});

vi.mock("../search_service.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../search_service.js")>();
  return { ...actual, searchWeb: mockSearchWeb };
});

type Handle = (typeof import("../mcp_server.js"))["handle"];
type JsonRpcResponse = import("../mcp_server.js").JsonRpcResponse;

describe("mcp_server (stateless paid MCP endpoint)", () => {
  let handle: Handle;

  beforeAll(async () => {
    process.env.NFT_WALLET_PUBLIC_KEY = RECEIVER;
    ({ handle } = await import("../mcp_server.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    applyMocks();
  });

  /** POST one JSON-RPC message through the event handler. */
  async function rpc(message: unknown, meta?: Record<string, unknown>): Promise<JsonRpcResponse> {
    const body =
      typeof message === "string"
        ? message
        : JSON.stringify(
            typeof meta === "object" && message !== null && typeof message === "object"
              ? { ...message, params: { ...(message as { params?: object }).params, _meta: meta } }
              : message,
          );
    const res = await handle({ httpMethod: "POST", headers: {}, body, path: "/mcp" }, {});
    expect(res.statusCode).toBe(200);
    return JSON.parse(res.body) as JsonRpcResponse;
  }

  const INIT = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "t", version: "0" },
    },
  };

  describe("transport surface (stateless Streamable HTTP)", () => {
    it("answers OPTIONS with CORS", async () => {
      const res = await handle({ httpMethod: "OPTIONS", headers: {}, body: "" }, {});
      expect(res.statusCode).toBe(200);
      expect(res.headers["Access-Control-Allow-Origin"]).toBe("*");
    });

    it("answers GET and DELETE with 405 Allow: POST — no sessions, no server-initiated streams", async () => {
      for (const method of ["GET", "DELETE"]) {
        const res = await handle({ httpMethod: method, headers: {}, body: "" }, {});
        expect(res.statusCode).toBe(405);
        expect(res.headers.Allow).toBe("POST");
      }
    });

    it("answers a parse failure with JSON-RPC error -32700", async () => {
      const res = await rpc("not json{");
      if (!("error" in res)) throw new Error("expected error response");
      expect(res.error.code).toBe(-32700);
      expect(res.id).toBeNull();
    });

    it("rejects JSON-RPC batches — this server speaks single messages", async () => {
      const res = await rpc([{ jsonrpc: "2.0", id: 1, method: "ping" }]);
      if (!("error" in res)) throw new Error("expected error response");
      expect(res.error.code).toBe(-32600);
    });

    it("answers a notification with 202 and an empty body", async () => {
      const res = await handle(
        {
          httpMethod: "POST",
          headers: {},
          body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
          path: "/mcp",
        },
        {},
      );
      expect(res.statusCode).toBe(202);
      expect(res.body).toBe("");
    });
  });

  describe("initialize", () => {
    it("negotiates a supported protocol version and announces tool capability", async () => {
      const res = await rpc(INIT);
      if ("error" in res) throw new Error("expected result");
      expect(res.result.protocolVersion).toBe("2025-06-18");
      expect(res.result.capabilities).toEqual({ tools: {} });
      expect(res.result.serverInfo).toEqual({ name: "fretchen-mcp", version: "1.0.0" });
    });

    it("falls back to its own version for an unknown client version", async () => {
      const res = await rpc({ ...INIT, params: { ...INIT.params, protocolVersion: "1999-01-01" } });
      if ("error" in res) throw new Error("expected result");
      expect(res.result.protocolVersion).toBe("2025-06-18");
    });
  });

  describe("tools/list", () => {
    it("lists llm_complete and web_search with the real API's input schemas", async () => {
      const res = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
      if ("error" in res) throw new Error("expected result");
      const tools = res.result.tools as Array<{
        name: string;
        inputSchema: Record<string, unknown>;
      }>;
      expect(tools.map((t) => t.name).sort()).toEqual(["llm_complete", "web_search"]);
      const llm = tools.find((t) => t.name === "llm_complete");
      const search = tools.find((t) => t.name === "web_search");
      expect(Object.keys((llm?.inputSchema.properties ?? {}) as object)).toContain("messages");
      expect(Object.keys((search?.inputSchema.properties ?? {}) as object)).toEqual(["q"]);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // The translation layer: tools/call relays to the REAL handlers, so the security and
  // cost rules below are the handlers' own, flowing through the real challenge configs.
  // ════════════════════════════════════════════════════════════════════════════

  describe("tools/call — the payment gate (no free path, by the real handlers)", () => {
    it("answers an unpaid web_search with the real mainnet-only demands and never touches Brave", async () => {
      const res = await rpc({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "web_search", arguments: { q: "x402" } },
      });
      if ("error" in res)
        throw new Error(`expected result, got: ${JSON.stringify(res).slice(0, 300)}`);
      const result = res.result as {
        isError: boolean;
        structuredContent: { x402Version: number; accepts: Array<{ network: string }> };
      };
      expect(result.isError).toBe(true);
      expect(result.structuredContent.x402Version).toBe(2);
      expect(result.structuredContent.accepts.length).toBeGreaterThan(0);
      // The security pin, on the real challenge path: search is mainnet-only — testnet
      // coins must never buy metered Brave queries. A translation layer that minted its
      // own accepts broke this once; it cannot anymore.
      for (const accept of result.structuredContent.accepts) {
        expect(["eip155:10", "eip155:8453"]).toContain(accept.network);
      }
      expect(mockSearchWeb).not.toHaveBeenCalled();
    });

    it("answers an unpaid llm_complete with demands that DO include testnet", async () => {
      const res = await rpc({
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "llm_complete",
          arguments: { model: "mistral-large-latest", messages: [{ role: "user", content: "hi" }] },
        },
      });
      if ("error" in res)
        throw new Error(`expected result, got: ${JSON.stringify(res).slice(0, 300)}`);
      const result = res.result as {
        isError: boolean;
        structuredContent: { accepts: Array<{ network: string }> };
      };
      expect(result.isError).toBe(true);
      // The intentional asymmetry: the chat offers testnet because completions mock there.
      expect(result.structuredContent.accepts.map((a) => a.network)).toContain("eip155:84532");
      expect(mockCallLLMAPI).not.toHaveBeenCalled();
    });

    it("runs and settles a paid llm_complete on testnet via the handler's own mock rule", async () => {
      const res = await rpc(
        {
          jsonrpc: "2.0",
          id: 5,
          method: "tools/call",
          params: {
            name: "llm_complete",
            arguments: {
              model: "mistral-large-latest",
              messages: [{ role: "user", content: "hi" }],
            },
          },
        },
        paymentMeta("eip155:84532", USDC_TESTNET),
      );
      if ("error" in res)
        throw new Error(`expected result, got: ${JSON.stringify(res).slice(0, 300)}`);
      expect(mockVerifyPayment).toHaveBeenCalledTimes(1);
      expect(mockSettlePayment).toHaveBeenCalledTimes(1);
      // The REAL testnet-mock rule, exercised through MCP: a worthless-coin payment
      // must buy a mock completion, never real Mistral spend.
      expect(mockCallLLMAPI.mock.calls[0][1]).toBe(true);
      // And the REAL usage-derived settlement: the mock completion's usage (5 prompt +
      // 7 completion tokens) settles for (5*50 + 7*150)/100 = 13 atomic USDC, not the
      // advertised ceiling — the parity the REST chat has, inherited by construction.
      const settleRequirements = mockSettlePayment.mock.calls[0][1] as { amount: string };
      expect(settleRequirements.amount).toBe("13");
      const result = res.result as {
        isError?: boolean;
        structuredContent: { choices: Array<{ message: { content: string } }> };
        _meta: Record<string, unknown>;
      };
      expect(result.isError).not.toBe(true);
      expect(result.structuredContent.choices[0].message.content).toBeDefined();
      // The settlement receipt, decoded from the handler's Payment-Response header.
      expect(result._meta["x402/payment-response"]).toMatchObject({ success: true });
    });

    it("rejects a paid web_search on testnet with the handler's own network refusal", async () => {
      const res = await rpc(
        {
          jsonrpc: "2.0",
          id: 6,
          method: "tools/call",
          params: { name: "web_search", arguments: { q: "x402" } },
        },
        paymentMeta("eip155:84532", USDC_TESTNET),
      );
      if ("error" in res)
        throw new Error(`expected result, got: ${JSON.stringify(res).slice(0, 300)}`);
      const result = res.result as {
        isError: boolean;
        structuredContent: { error: string };
      };
      expect(result.isError).toBe(true);
      expect(result.structuredContent.error).toContain("Unsupported or missing network");
      // Refused before anything metered runs.
      expect(mockSearchWeb).not.toHaveBeenCalled();
      expect(mockVerifyPayment).not.toHaveBeenCalled();
    });

    it("runs and settles a paid web_search on mainnet and returns the receipt", async () => {
      const res = await rpc(
        {
          jsonrpc: "2.0",
          id: 7,
          method: "tools/call",
          params: { name: "web_search", arguments: { q: "x402" } },
        },
        paymentMeta("eip155:8453", USDC_BASE),
      );
      if ("error" in res)
        throw new Error(`expected result, got: ${JSON.stringify(res).slice(0, 300)}`);
      expect(mockVerifyPayment).toHaveBeenCalledTimes(1);
      expect(mockSearchWeb).toHaveBeenCalledWith("x402");
      expect(mockSettlePayment).toHaveBeenCalledTimes(1);
      const result = res.result as {
        isError?: boolean;
        structuredContent: { results: unknown[] };
        _meta: Record<string, unknown>;
      };
      expect(result.isError).not.toBe(true);
      expect(Array.isArray(result.structuredContent.results)).toBe(true);
      expect(result._meta["x402/payment-response"]).toMatchObject({ success: true });
    });

    it("answers a call for an unknown tool with -32602", async () => {
      const res = await rpc({
        jsonrpc: "2.0",
        id: 8,
        method: "tools/call",
        params: { name: "no_such_tool", arguments: {} },
      });
      if (!("error" in res)) throw new Error("expected error");
      expect(res.error.code).toBe(-32602);
    });
  });
});

/** The canonical PaymentPayload shape, as the official client puts it in `_meta` and the
 * REST buyers put in the PAYMENT-SIGNATURE header (accepted at the top level — see the
 * handlers' own `payment()` fixtures). */
function paymentMeta(network: string, asset: string): Record<string, unknown> {
  return {
    "x402/payment": {
      x402Version: 2,
      accepted: { network, asset },
      payload: { type: "voucher", voucher: "0xsigned" },
    },
  };
}

/** Re-applies every mock implementation clearAllMocks() wipes. */
function applyMocks(): void {
  mockVerifyPayment.mockImplementation(async () => ({
    isValid: true,
    payer: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7",
  }));
  mockSettlePayment.mockImplementation(async () => ({ success: true, transaction: "0xsettled" }));
  mockCreatePaymentRequiredResponse.mockImplementation((accepts: unknown[]) => ({
    x402Version: 2,
    resource: { url: "test://x" },
    accepts,
    error: "Payment verification failed",
  }));
  mockEnhancePaymentRequirements.mockImplementation(async (base: unknown) => base);
  mockCreateLLMResourceServer.mockImplementation(() => ({
    resourceServer: {
      verifyPayment: mockVerifyPayment,
      settlePayment: mockSettlePayment,
      createPaymentRequiredResponse: mockCreatePaymentRequiredResponse,
      createPaymentCancellationDispatcher: vi.fn(() => ({ cancel: async () => ({}) })),
    },
    scheme: { enhancePaymentRequirements: mockEnhancePaymentRequirements },
    schemeFor: vi.fn(),
    claimSchemeFor: vi.fn(),
  }));
  mockCallLLMAPI.mockImplementation(async () => ({
    id: "chatcmpl-test",
    object: "chat.completion",
    created: 1_760_000_000,
    model: "mistral-large-latest",
    choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }],
    usage: { prompt_tokens: 5, completion_tokens: 7, total_tokens: 12 },
  }));
  mockSearchWeb.mockImplementation(async (q: string) => ({
    results: [{ title: q, url: "https://example.com/", content: "…" }],
  }));
}
applyMocks();
