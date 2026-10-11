/**
 * Pins the stateless MCP endpoint (docs.x402.org → MCP; modelcontextprotocol.io spec):
 * the JSON-RPC surface a no-session server must answer, and the x402 payment gate
 * around the two tools (@x402/mcp's createPaymentWrapper — the official convention:
 * unpaid tools/call returns a payment-required result, payment travels in
 * params._meta["x402/payment"], settlement comes back in _meta["x402/payment-response"]).
 *
 * The x402 seller stack is mocked the way sc_llm_x402.test.ts mocks it (S3 and secrets
 * stay out of unit tests); the payment wrapper itself is REAL — the no-free-path
 * assertions rely on its gating, not on a mock of it.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

/** The seller's own address (`NFT_WALLET_PUBLIC_KEY`) — Anvil account #2, as elsewhere. */
const RECEIVER = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

const FAKE_ACCEPTS = [
  {
    scheme: "batch-settlement",
    network: "eip155:8453",
    amount: "10000",
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    payTo: RECEIVER,
    maxTimeoutSeconds: 120,
    extra: { name: "USD Coin", version: "2" },
  },
];

/** A payment payload the wrapper accepts as present: {x402Version, payload} in _meta. */
const PAID_META = {
  "x402/payment": {
    x402Version: 2,
    payload: {
      type: "voucher",
      x402Version: 2,
      scheme: "batch-settlement",
      network: "eip155:8453",
    },
  },
} as Record<string, unknown>;

const {
  mockCreatePaymentRequiredResponse,
  mockVerifyPayment,
  mockSettlePayment,
  mockResourceServer,
  mockCreateLLMResourceServer,
  mockCreateBatchSettlementPaymentRequirements,
  mockSearchWeb,
  mockCallLLMAPI,
} = vi.hoisted(() => {
  const mockCreatePaymentRequiredResponse = vi.fn();
  const mockVerifyPayment = vi.fn();
  const mockSettlePayment = vi.fn();
  return {
    mockCreatePaymentRequiredResponse,
    mockVerifyPayment,
    mockSettlePayment,
    // Every method starts as a bare vi.fn(); applyMocks() owns ALL implementations, so a
    // clearAllMocks() + applyMocks() cycle can never leave a half-wiped mock behind.
    mockResourceServer: {
      getRegisteredScheme: vi.fn(),
      createPaymentRequiredResponse: mockCreatePaymentRequiredResponse,
      findMatchingRequirements: vi.fn(),
      validateExtensions: vi.fn(),
      getPaymentFlow: vi.fn(),
      verifyPayment: mockVerifyPayment,
      settlePayment: mockSettlePayment,
      createPaymentCancellationDispatcher: vi.fn(),
    },
    mockCreateLLMResourceServer: vi.fn(),
    mockCreateBatchSettlementPaymentRequirements: vi.fn(),
    mockSearchWeb: vi.fn(),
    mockCallLLMAPI: vi.fn(),
  };
});

// The fake accepts reach the wrapper through the mocked requirements builder below.
function applyMocks(): void {
  mockCreateBatchSettlementPaymentRequirements.mockImplementation(
    async (opts: { extensions?: Record<string, unknown> }) => ({
      x402Version: 2,
      resource: { url: "mcp://tool/x" },
      accepts: FAKE_ACCEPTS,
      extensions: opts.extensions,
    }),
  );
  mockCreateLLMResourceServer.mockImplementation(() => ({
    resourceServer: mockResourceServer,
    scheme: { enhancePaymentRequirements: async (base: object) => base },
    schemeFor: vi.fn(),
    claimSchemeFor: vi.fn(),
  }));
  mockCreatePaymentRequiredResponse.mockImplementation(
    (accepts: unknown[], resource: Record<string, unknown>, error?: string) => ({
      x402Version: 2,
      resource,
      accepts,
      ...(error ? { error } : {}),
    }),
  );
  mockVerifyPayment.mockImplementation(async () => ({ isValid: true, payer: RECEIVER }));
  mockSettlePayment.mockImplementation(async () => ({ success: true, transaction: "0xsettled" }));
  // The scheme stub the wrapper's flow resolution needs (@x402/core's real resolvePaymentFlow
  // reads scheme.paymentFlows[assetTransferMethod] — a bare {} would throw). "authorization"
  // is the verify → handler → settle phase order these tests assert.
  mockResourceServer.getRegisteredScheme.mockImplementation(() => ({
    scheme: "batch-settlement",
    defaultAssetTransferMethod: "eip3009",
    paymentFlows: {
      eip3009: { default: "authorization", supported: ["authorization"] },
    },
  }));
  mockResourceServer.findMatchingRequirements.mockImplementation(() => FAKE_ACCEPTS[0]);
  mockResourceServer.validateExtensions.mockImplementation(() => ({ valid: true }));
  // The wrapper asks the resource server for the flow NAME at call time (then maps it
  // through @x402/core's phase table); "authorization" = verify → handler → settle.
  mockResourceServer.getPaymentFlow.mockImplementation(() => "authorization");
  mockResourceServer.createPaymentCancellationDispatcher.mockImplementation(() => ({
    cancel: async () => ({}),
  }));
  mockSearchWeb.mockImplementation(async (q: string) => ({
    results: [{ title: q, url: "https://example.com/", content: "…" }],
  }));
  mockCallLLMAPI.mockImplementation(async () => ({
    id: "chatcmpl-test",
    object: "chat.completion",
    created: 1_760_000_000,
    model: "mistral-large-latest",
    choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  }));
}
applyMocks();

// The x402 seller stack is mocked the way sc_llm_x402.test.ts mocks it (S3 and secrets
// stay out of unit tests); the payment wrapper itself is REAL — the no-free-path
// assertions rely on its gating, not on a mock of it.
vi.mock("../x402_server.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../x402_server.js")>();
  return {
    ...actual,
    createLLMResourceServer: mockCreateLLMResourceServer,
    createBatchSettlementPaymentRequirements: mockCreateBatchSettlementPaymentRequirements,
  };
});

vi.mock("../search_service.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../search_service.js")>();
  return { ...actual, searchWeb: mockSearchWeb };
});

vi.mock("../llm_service.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../llm_service.js")>();
  return { ...actual, callLLMAPI: mockCallLLMAPI };
});

type Handle = (typeof import("../mcp_server.js"))["handle"];
type JsonRpcResponse = import("../mcp_server.js").JsonRpcResponse;

let handle: Handle;

beforeAll(async () => {
  process.env.NFT_WALLET_PUBLIC_KEY = RECEIVER;
  ({ handle } = await import("../mcp_server.js"));
});

beforeEach(() => {
  vi.clearAllMocks();
  // clearAllMocks() also wipes the implementations set at module level and in
  // applyMocks() — re-apply them, or the first tool-building call after a
  // transport-surface test fails with a wiped mock.
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
    clientInfo: { name: "test", version: "0" },
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

  it("carries CORS on every JSON-RPC response", async () => {
    const res = await handle(
      { httpMethod: "POST", headers: {}, body: JSON.stringify(INIT), path: "/mcp" },
      {},
    );
    expect(res.headers["Access-Control-Allow-Origin"]).toBe("*");
  });
});

describe("initialize", () => {
  it("negotiates a supported protocol version and announces tool capability", async () => {
    const res = await rpc(INIT);
    if ("error" in res)
      throw new Error(`expected result, got: ${JSON.stringify(res).slice(0, 300)}`);
    expect(res.result.protocolVersion).toBe("2025-06-18");
    expect(res.result.capabilities).toEqual({ tools: {} });
    expect(res.result.serverInfo).toEqual({ name: "fretchen-mcp", version: "1.0.0" });
  });

  it("falls back to its own version for an unknown client version", async () => {
    const res = await rpc({ ...INIT, params: { ...INIT.params, protocolVersion: "1999-01-01" } });
    if ("error" in res)
      throw new Error(`expected result, got: ${JSON.stringify(res).slice(0, 300)}`);
    expect(res.result.protocolVersion).toBe("2025-06-18");
  });
});

describe("tools/list", () => {
  it("lists llm_complete and web_search with their input schemas", async () => {
    const res = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    if ("error" in res)
      throw new Error(`expected result, got: ${JSON.stringify(res).slice(0, 300)}`);
    const tools = res.result.tools as Array<{
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
    }>;
    expect(tools.map((t) => t.name).sort()).toEqual(["llm_complete", "web_search"]);
    const llm = tools.find((t) => t.name === "llm_complete");
    const search = tools.find((t) => t.name === "web_search");
    expect(Object.keys((llm?.inputSchema.properties ?? {}) as object)).toContain("messages");
    expect(Object.keys((search?.inputSchema.properties ?? {}) as object)).toEqual(["q"]);
  });
});

describe("tools/call — the payment gate (no free path)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("answers an unpaid web_search with the payment demands and never touches Brave", async () => {
    const res = await rpc({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "web_search", arguments: { q: "x402" } },
    });
    if ("error" in res)
      throw new Error(`expected result, got: ${JSON.stringify(res).slice(0, 300)}`);
    const result = res.result as { isError: boolean; structuredContent: { accepts: unknown[] } };
    expect(result.isError).toBe(true);
    expect(result.structuredContent.accepts).toEqual(FAKE_ACCEPTS);
    expect(mockSearchWeb).not.toHaveBeenCalled();
    expect(mockVerifyPayment).not.toHaveBeenCalled();
  });

  it("answers an unpaid llm_complete the same way and never calls the model API", async () => {
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
    const result = res.result as { isError: boolean };
    expect(result.isError).toBe(true);
    expect(mockCallLLMAPI).not.toHaveBeenCalled();
  });

  it("runs and settles a paid web_search, returning the receipt in _meta", async () => {
    const res = await rpc(
      {
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: { name: "web_search", arguments: { q: "x402" } },
      },
      PAID_META,
    );
    if ("error" in res)
      throw new Error(`expected result, got: ${JSON.stringify(res).slice(0, 300)}`);
    expect(mockVerifyPayment).toHaveBeenCalledTimes(1);
    expect(mockSettlePayment).toHaveBeenCalledTimes(1);
    expect(mockSearchWeb).toHaveBeenCalledWith("x402");
    const result = res.result as {
      isError?: boolean;
      content: Array<{ type: string; text: string }>;
      _meta: Record<string, unknown>;
    };
    expect(result.isError).not.toBe(true);
    expect(JSON.parse(result.content[0].text).results[0].title).toBe("x402");
    expect(result._meta["x402/payment-response"]).toEqual({
      success: true,
      transaction: "0xsettled",
    });
  });

  it("answers a call for an unknown tool with -32602", async () => {
    const res = await rpc({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: { name: "no_such_tool", arguments: {} },
    });
    if (!("error" in res)) throw new Error("expected error");
    expect(res.error.code).toBe(-32602);
  });
});
