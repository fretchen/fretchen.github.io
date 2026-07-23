import { describe, it, expect, vi, beforeEach } from "vitest";

// ===== Mocks (vi.hoisted ensures these are available when vi.mock factories run) =====

const {
  mockCallLLMAPI,
  mockConvertTokensToUsdcCost,
  mockCreateLLMResourceServer,
  mockCreateBatchSettlementPaymentRequirements,
  mockCreate402Response,
  mockExtractPaymentPayload,
  mockCreateSettlementHeaders,
  mockGetBatchSettlementNetworks,
  mockGetUSDCConfig,
  mockIsTestnet,
  mockVerifyPayment,
  mockSettlePayment,
  mockCreatePaymentRequiredResponse,
  mockEnhancePaymentRequirements,
  mockScheme,
} = vi.hoisted(() => {
  // enhancePaymentRequirements() is called for real verify/settle calls (not just the
  // 402-building path) — see sc_llm_x402.ts's paymentRequirements construction. Echo the
  // base requirements back unchanged, which is enough for the handler-logic tests here.
  const mockEnhancePaymentRequirements = vi.fn().mockImplementation(async (base: unknown) => base);
  return {
    mockCallLLMAPI: vi.fn(),
    // Real formula (matches llm_service.ts's actual convertTokensToUsdcCost: separate
    // input/output rates per provider — see LLM_PROVIDERS there), not a fixed stub — so
    // tests can verify the settlement amount actually tracks whatever usage callLLMAPI
    // returns, not just the flat ceiling. Called once at module load (for the ceiling,
    // USDC_MAX_PRICE_PER_MESSAGE) — must work before beforeEach runs. Simplified to a
    // single shared denominator (valid since both providers below have inDen === outDen
    // === 100n today; the real implementation cross-multiplies to not assume that).
    mockConvertTokensToUsdcCost: vi.fn().mockImplementation(
      (
        usage: {
          prompt_tokens: bigint | number | string;
          completion_tokens: bigint | number | string;
        },
        provider: string,
      ) => {
        const RATES: Record<string, { in: bigint; out: bigint; den: bigint }> = {
          ionos: { in: 71n, out: 71n, den: 100n },
          mistral: { in: 50n, out: 150n, den: 100n },
        };
        const rate = RATES[provider];
        if (!rate) throw new Error(`Unknown LLM provider: ${provider}`);
        const p = BigInt(usage.prompt_tokens);
        const c = BigInt(usage.completion_tokens);
        return (p * rate.in + c * rate.out) / rate.den;
      },
    ),
    mockCreateLLMResourceServer: vi.fn(),
    mockCreateBatchSettlementPaymentRequirements: vi.fn(),
    mockCreate402Response: vi.fn(),
    mockExtractPaymentPayload: vi.fn(),
    mockCreateSettlementHeaders: vi.fn(),
    mockGetBatchSettlementNetworks: vi.fn(),
    mockGetUSDCConfig: vi.fn(),
    // Testnet networks (Base/Optimism Sepolia) must take the mock-LLM path — see the
    // useMock gate in sc_llm_x402.ts. Default matches chain-utils' TESTNET_NETWORKS.
    mockIsTestnet: vi
      .fn()
      .mockImplementation((net: string) => net === "eip155:84532" || net === "eip155:11155420"),
    mockVerifyPayment: vi.fn(),
    mockSettlePayment: vi.fn(),
    mockCreatePaymentRequiredResponse: vi.fn(),
    mockEnhancePaymentRequirements,
    mockScheme: { enhancePaymentRequirements: mockEnhancePaymentRequirements },
  };
});

vi.mock("../llm_service.js", () => ({
  callLLMAPI: mockCallLLMAPI,
  convertTokensToUsdcCost: mockConvertTokensToUsdcCost,
}));

vi.mock("../x402_server.js", () => ({
  createLLMResourceServer: mockCreateLLMResourceServer,
  createBatchSettlementPaymentRequirements: mockCreateBatchSettlementPaymentRequirements,
  create402Response: mockCreate402Response,
  extractPaymentPayload: mockExtractPaymentPayload,
  createSettlementHeaders: mockCreateSettlementHeaders,
  getBatchSettlementNetworks: mockGetBatchSettlementNetworks,
  // Real constant (not a mock fn) — imported by sc_llm_x402.ts for the verify-time
  // maxTimeoutSeconds; keep in sync with x402_server.ts's exported value.
  LLM_MAX_TIMEOUT_SECONDS: 120,
  // Real implementation (pure bigint math, no side effects) — keep in sync with
  // x402_server.ts's actual formatUsdcAtomicAsDecimalUsd.
  formatUsdcAtomicAsDecimalUsd: (atomicAmount: string) => {
    const atomic = BigInt(atomicAmount);
    const divisor = 1_000_000n;
    const whole = atomic / divisor;
    const fraction = (atomic % divisor).toString().padStart(6, "0");
    const trimmedFraction = fraction.replace(/0+$/, "");
    return trimmedFraction ? `${whole}.${trimmedFraction}` : whole.toString();
  },
}));

vi.mock("@fretchen/chain-utils", () => ({
  getUSDCConfig: mockGetUSDCConfig,
  isTestnet: mockIsTestnet,
}));

// ===== Import after mocks =====

import { handle } from "../sc_llm_x402.js";

// ===== Helpers =====

const VALID_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    httpMethod: "POST",
    headers: {},
    body: JSON.stringify({ data: { prompt: [{ role: "user", content: "hi" }] } }),
    path: "/llmx402",
    ...overrides,
  };
}

const samplePaymentPayload = {
  accepted: { network: "eip155:84532", scheme: "batch-settlement" },
  payload: { type: "voucher" },
};

// ===== Tests =====

describe("sc_llm_x402", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NFT_WALLET_PUBLIC_KEY = VALID_ADDRESS;

    mockCreateLLMResourceServer.mockReturnValue({
      resourceServer: {
        verifyPayment: mockVerifyPayment,
        settlePayment: mockSettlePayment,
        createPaymentRequiredResponse: mockCreatePaymentRequiredResponse,
      },
      scheme: mockScheme,
    });
    mockGetBatchSettlementNetworks.mockReturnValue(["eip155:10", "eip155:8453", "eip155:84532"]);
    mockGetUSDCConfig.mockReturnValue({
      address: "0xusdc",
      usdcName: "USDC",
      usdcVersion: "2",
    });
    mockExtractPaymentPayload.mockReturnValue(null);
    mockCreateBatchSettlementPaymentRequirements.mockResolvedValue({
      x402Version: 2,
      resource: { url: "/llmx402", description: "", mimeType: "application/json" },
      accepts: [],
    });
    mockCreate402Response.mockReturnValue({
      statusCode: 402,
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    mockCreatePaymentRequiredResponse.mockResolvedValue({
      x402Version: 2,
      error: "cap_exceeded",
      resource: { url: "/llmx402", description: "", mimeType: "application/json" },
      accepts: [],
    });
    mockCreateSettlementHeaders.mockReturnValue({ "Payment-Response": "encoded" });
    mockCallLLMAPI.mockResolvedValue({
      content: "answer",
      usage: { prompt_tokens: 5, completion_tokens: 7, total_tokens: 12 },
      model: "test-model",
    });
    mockVerifyPayment.mockResolvedValue({ isValid: true, payer: "0xpayer" });
    mockSettlePayment.mockResolvedValue({
      success: true,
      transaction: "",
      network: "eip155:84532",
    });
  });

  describe("basic request validation", () => {
    it("returns 200 for OPTIONS preflight", async () => {
      const res = await handle(makeEvent({ httpMethod: "OPTIONS" }) as never, {});
      expect(res.statusCode).toBe(200);
    });

    it("includes GET in the OPTIONS preflight allow-list", async () => {
      // Regression guard: GET must stay allowed so GET /openapi.json passes preflight
      // for browser-based x402 discovery crawlers.
      const res = await handle(makeEvent({ httpMethod: "OPTIONS" }) as never, {});
      expect(res.headers["Access-Control-Allow-Methods"]).toContain("GET");
    });

    it("returns 400 for a non-POST method", async () => {
      const res = await handle(makeEvent({ httpMethod: "GET" }) as never, {});
      expect(res.statusCode).toBe(400);
    });

    it("serves the OpenAPI discovery document on GET /openapi.json", async () => {
      const res = await handle(
        makeEvent({ httpMethod: "GET", path: "/openapi.json" }) as never,
        {},
      );
      expect(res.statusCode).toBe(200);
      expect(res.headers["Content-Type"]).toBe("application/json");
      expect(res.headers["Access-Control-Allow-Origin"]).toBe("*");

      const body = JSON.parse(res.body);
      expect(body.openapi).toBe("3.1.0");
      expect(body.info.title).toBeTruthy();
      expect(body.paths["/"].post["x-payment-info"]).toEqual({
        protocols: ["x402"],
        price: { mode: "dynamic", currency: "USD", min: "0", max: "0.003" },
      });
      expect(body.paths["/"].post.responses["402"]).toBeDefined();
    });

    it("serves openapi.json without a leading slash in the path too", async () => {
      const res = await handle(makeEvent({ httpMethod: "GET", path: "openapi.json" }) as never, {});
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).openapi).toBe("3.1.0");
    });

    // /favicon.ico is swallowed by the Scaleway gateway before the function runs, so we
    // serve the icon at /favicon.png (a COMMON_FAVICON_PATHS fallback that reaches us).
    it("serves the favicon as a base64 image on GET /favicon.png", async () => {
      const res = await handle(makeEvent({ httpMethod: "GET", path: "/favicon.png" }) as never, {});
      expect(res.statusCode).toBe(200);
      expect(res.headers["Content-Type"]).toBe("image/jpeg");
      expect(res.headers["Access-Control-Allow-Origin"]).toBe("*");
      expect(res.isBase64Encoded).toBe(true);
      // Valid base64 that decodes to a JPEG (SOI marker 0xFFD8).
      const bytes = Buffer.from(res.body, "base64");
      expect(bytes.length).toBeGreaterThan(0);
      expect(bytes[0]).toBe(0xff);
      expect(bytes[1]).toBe(0xd8);
    });

    it("answers a HEAD /favicon.png probe with 200 and an image content-type", async () => {
      const res = await handle(
        makeEvent({ httpMethod: "HEAD", path: "/favicon.png" }) as never,
        {},
      );
      expect(res.statusCode).toBe(200);
      expect(res.headers["Content-Type"]).toBe("image/jpeg");
      expect(res.body).toBe("");
    });

    // x402scan fetches the origin root and parses <link rel="icon"> before probing any
    // favicon path. An HTML-accepting GET on "/" must return that discovery HTML.
    it("serves favicon-discovery HTML on GET / when the client accepts HTML", async () => {
      const res = await handle(
        makeEvent({
          httpMethod: "GET",
          path: "/",
          headers: { accept: "text/html,application/xhtml+xml" },
        }) as never,
        {},
      );
      expect(res.statusCode).toBe(200);
      expect(res.headers["Content-Type"]).toContain("text/html");
      expect(res.body).toContain('rel="icon"');
      expect(res.body).toContain("/favicon.png");
    });

    // An x402 payment client GETs / without an HTML Accept header — it must fall through
    // to the normal "only POST" rejection, not receive HTML.
    it("does NOT serve HTML on GET / without an HTML Accept header", async () => {
      const res = await handle(
        makeEvent({ httpMethod: "GET", path: "/", headers: {} }) as never,
        {},
      );
      expect(res.statusCode).toBe(400);
    });

    // Regression guard: x-payment-info.price.max must track the real, live price
    // ceiling (USDC_MAX_PRICE_PER_MESSAGE), not a value hardcoded in openapi.llm.json —
    // otherwise the served discovery doc silently drifts from actual 402 behavior if
    // LLM_ESTIMATED_TOKENS_PER_MESSAGE or the provider's rate card ever changes. Proves
    // this by re-importing the module with a different token estimate and checking the
    // served price.max changes accordingly, rather than coincidentally matching a literal.
    it("serves a price.max that tracks LLM_ESTIMATED_TOKENS_PER_MESSAGE, not a hardcoded value", async () => {
      const originalEstimate = process.env.LLM_ESTIMATED_TOKENS_PER_MESSAGE;
      process.env.LLM_ESTIMATED_TOKENS_PER_MESSAGE = "4000";
      vi.resetModules();
      try {
        const mod = await import("../sc_llm_x402.js");
        const res = await mod.handle(
          makeEvent({ httpMethod: "GET", path: "/openapi.json" }) as never,
          {},
        );
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        // 4000 tokens * 150n/100n (mistral output rate, mocked to match llm_service.ts) = 6000n
        // atomic units = "0.006" decimal USD -- distinct from the static file's "0.003".
        expect(body.paths["/"].post["x-payment-info"].price.max).toBe("0.006");
      } finally {
        if (originalEstimate === undefined) {
          delete process.env.LLM_ESTIMATED_TOKENS_PER_MESSAGE;
        } else {
          process.env.LLM_ESTIMATED_TOKENS_PER_MESSAGE = originalEstimate;
        }
        vi.resetModules();
      }
    });

    it("returns 400 for malformed JSON body", async () => {
      const res = await handle(makeEvent({ body: "{ not valid" }) as never, {});
      expect(res.statusCode).toBe(400);
    });

    it("returns 400 when prompt is missing", async () => {
      const res = await handle(makeEvent({ body: JSON.stringify({ data: {} }) }) as never, {});
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).error).toBe("No prompt provided");
    });

    it("returns 400 for an invalid useDummyData flag", async () => {
      const res = await handle(
        makeEvent({
          body: JSON.stringify({
            data: { prompt: [{ role: "user", content: "hi" }], useDummyData: "yes" },
          }),
        }) as never,
        {},
      );
      expect(res.statusCode).toBe(400);
    });

    it("returns 500 when NFT_WALLET_PUBLIC_KEY is missing", async () => {
      delete process.env.NFT_WALLET_PUBLIC_KEY;
      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(500);
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
  });

  describe("missing payment", () => {
    it("returns a 402 built from createBatchSettlementPaymentRequirements", async () => {
      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(402);
      // Ceiling: the whole 2000-token estimate priced as completion (output) tokens
      // at Mistral's $1.50/M rate — 2000 * 150 / 100 = 3000.
      expect(mockCreateBatchSettlementPaymentRequirements).toHaveBeenCalledWith(
        expect.objectContaining({ payTo: VALID_ADDRESS, scheme: mockScheme, amount: "3000" }),
      );
      expect(mockCreate402Response).toHaveBeenCalled();
    });
  });

  describe("network validation", () => {
    it("returns 402 when the payload has no accepted network", async () => {
      mockExtractPaymentPayload.mockReturnValue({ payload: { type: "voucher" } });
      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(402);
      expect(mockVerifyPayment).not.toHaveBeenCalled();
    });

    it("returns 402 when the network is not a batch-settlement network", async () => {
      mockExtractPaymentPayload.mockReturnValue({
        accepted: { network: "eip155:11155420" },
        payload: { type: "voucher" },
      });
      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(402);
      expect(mockVerifyPayment).not.toHaveBeenCalled();
    });
  });

  describe("payment verification", () => {
    beforeEach(() => {
      mockExtractPaymentPayload.mockReturnValue(samplePaymentPayload);
    });

    it("returns 402 when verification is invalid", async () => {
      mockVerifyPayment.mockResolvedValue({
        isValid: false,
        invalidReason: "cap_exceeded",
        payer: "0xpayer",
      });
      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(402);
      expect(mockCallLLMAPI).not.toHaveBeenCalled();

      // The failed paymentPayload must be passed through — that's what triggers the SDK's
      // response-time scheme enrichment (e.g. cumulative-amount-mismatch channelState) for
      // the client's corrective-retry flow to have anything to recover from.
      expect(mockCreatePaymentRequiredResponse).toHaveBeenCalledWith(
        [expect.objectContaining({ scheme: "batch-settlement" })],
        expect.objectContaining({ mimeType: "application/json" }),
        "cap_exceeded",
        { payer: "0xpayer" },
        undefined,
        samplePaymentPayload,
      );
      expect(mockCreate402Response).toHaveBeenCalledWith(
        await mockCreatePaymentRequiredResponse.mock.results[0].value,
      );
    });

    it("returns 402 when verification is invalid and omits payer from extensions if absent", async () => {
      mockVerifyPayment.mockResolvedValue({ isValid: false, invalidReason: "cap_exceeded" });
      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(402);
      expect(mockCreatePaymentRequiredResponse).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "cap_exceeded",
        undefined,
        undefined,
        samplePaymentPayload,
      );
    });

    it("returns 402 when verifyPayment throws", async () => {
      mockVerifyPayment.mockRejectedValue(new Error("facilitator unreachable"));
      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(402);
      expect(mockCallLLMAPI).not.toHaveBeenCalled();
    });
  });

  describe("LLM call", () => {
    beforeEach(() => {
      mockExtractPaymentPayload.mockReturnValue(samplePaymentPayload);
    });

    it("returns 401 when the LLM API token is missing", async () => {
      mockCallLLMAPI.mockRejectedValue(new Error("API Token nicht gefunden"));
      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(401);
      expect(mockSettlePayment).not.toHaveBeenCalled();
    });

    it("returns 500 for other LLM API errors", async () => {
      mockCallLLMAPI.mockRejectedValue(new Error("upstream exploded"));
      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(500);
    });

    it("forces the mock LLM path on a testnet payment (no real inference spend)", async () => {
      // Base Sepolia payment is valueless, so callLLMAPI must be invoked with dummy=true
      // even though the request did not ask for it — mirrors genimg's useMockImage.
      mockExtractPaymentPayload.mockReturnValue(samplePaymentPayload); // eip155:84532
      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(200);
      // Third arg is the fixed provider — this endpoint always uses Mistral, live or mock.
      expect(mockCallLLMAPI).toHaveBeenCalledWith(expect.anything(), true, "mistral");
    });

    it("uses the real LLM path on a mainnet payment", async () => {
      mockExtractPaymentPayload.mockReturnValue({
        accepted: { network: "eip155:8453", scheme: "batch-settlement" },
        payload: { type: "voucher" },
      });
      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(200);
      expect(mockCallLLMAPI).toHaveBeenCalledWith(expect.anything(), false, "mistral");
    });

    // ═══════════════════════════════════════════════════════════
    // SECURITY: testnet must never reach the real Mistral API — see the guard
    // in sc_llm_x402.ts. Absent/true stay mocked (unaffected, both real callers
    // — website + notebook — never send useDummyData at all); an explicit
    // false is a caller error, rejected outright rather than silently downgraded.
    // ═══════════════════════════════════════════════════════════

    it("rejects an explicit useDummyData=false on a testnet network", async () => {
      const res = await handle(
        makeEvent({
          body: JSON.stringify({
            data: { prompt: [{ role: "user", content: "hi" }], useDummyData: false },
          }),
        }) as never,
        {},
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).error).toMatch(/Real inference is not available on testnet/);
      expect(mockVerifyPayment).not.toHaveBeenCalled();
      expect(mockCallLLMAPI).not.toHaveBeenCalled();
    });

    it("allows an explicit useDummyData=true on a testnet network (still mocks)", async () => {
      const res = await handle(
        makeEvent({
          body: JSON.stringify({
            data: { prompt: [{ role: "user", content: "hi" }], useDummyData: true },
          }),
        }) as never,
        {},
      );
      expect(res.statusCode).toBe(200);
      expect(mockCallLLMAPI).toHaveBeenCalledWith(expect.anything(), true, "mistral");
    });

    it("allows an explicit useDummyData=false on a mainnet network (real path proceeds)", async () => {
      mockExtractPaymentPayload.mockReturnValue({
        accepted: { network: "eip155:8453", scheme: "batch-settlement" },
        payload: { type: "voucher" },
      });
      const res = await handle(
        makeEvent({
          body: JSON.stringify({
            data: { prompt: [{ role: "user", content: "hi" }], useDummyData: false },
          }),
        }) as never,
        {},
      );
      expect(res.statusCode).toBe(200);
      expect(mockCallLLMAPI).toHaveBeenCalledWith(expect.anything(), false, "mistral");
    });
  });

  describe("settlement", () => {
    beforeEach(() => {
      mockExtractPaymentPayload.mockReturnValue(samplePaymentPayload);
    });

    it("returns 200 with the LLM response and settlement headers on success", async () => {
      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).content).toBe("answer");
      expect(res.headers["Payment-Response"]).toBe("encoded");
      expect(mockSettlePayment).toHaveBeenCalledTimes(1);

      // The requirements passed to verify/settle must go through the scheme's own
      // enhancePaymentRequirements() — a raw, un-enhanced object is missing
      // extra.receiverAuthorizer/withdrawDelay, which makes the facilitator reject every
      // real deposit with receiver_authorizer_mismatch (found via a live Base Sepolia run).
      expect(mockEnhancePaymentRequirements).toHaveBeenCalledWith(
        expect.objectContaining({ scheme: "batch-settlement", network: "eip155:84532" }),
        expect.objectContaining({ scheme: "batch-settlement", network: "eip155:84532" }),
        [],
      );
      const enhancedRequirements = await mockEnhancePaymentRequirements.mock.results[0]?.value;
      expect(mockVerifyPayment).toHaveBeenCalledWith(samplePaymentPayload, enhancedRequirements);
    });

    it("returns 402 when settlement reports success:false", async () => {
      mockSettlePayment.mockResolvedValue({ success: false, errorReason: "cap_exceeded" });
      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(402);
      expect(JSON.parse(res.body).error).toMatch(/cap_exceeded/);
    });

    it("returns 402 when settlePayment throws", async () => {
      mockSettlePayment.mockRejectedValue(new Error("channel_busy"));
      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(402);
      expect(JSON.parse(res.body).error).toMatch(/channel_busy/);
    });

    // ═══════════════════════════════════════════════════════════
    // Usage-based billing: settlement amount must track the LLM's real token
    // usage, not the flat ceiling advertised at 402/verify time.
    // ═══════════════════════════════════════════════════════════

    it("settles for the LLM's actual token usage, not the ceiling", async () => {
      // 200 prompt + 800 completion -> 0.5*200 + 1.5*800 = 100 + 1200 = 1300 (Mistral
      // rates), well under the 3000 ceiling (2000 tokens, all priced as completion).
      mockCallLLMAPI.mockResolvedValue({
        content: "answer",
        usage: { prompt_tokens: 200, completion_tokens: 800, total_tokens: 1000 },
        model: "test-model",
      });

      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(200);

      // verifyPayment must still see the pre-authorized ceiling (3000) — the client signed
      // its voucher against that, and handleBeforeVerify requires an exact match.
      const enhancedRequirements = await mockEnhancePaymentRequirements.mock.results[0]?.value;
      expect(mockVerifyPayment).toHaveBeenCalledWith(
        samplePaymentPayload,
        expect.objectContaining({ amount: "3000" }),
      );

      // settlePayment must see the real, usage-derived amount instead.
      expect(mockSettlePayment).toHaveBeenCalledWith(
        samplePaymentPayload,
        expect.objectContaining({ ...enhancedRequirements, amount: "1300" }),
      );
    });

    it("caps the settlement amount at the ceiling when usage runs over the estimate", async () => {
      // 500 prompt + 2500 completion -> 0.5*500 + 1.5*2500 = 250 + 3750 = 4000, which
      // exceeds the 3000 ceiling — must be capped there rather than settling for more
      // than the client authorized (or aborting).
      mockCallLLMAPI.mockResolvedValue({
        content: "answer",
        usage: { prompt_tokens: 500, completion_tokens: 2500, total_tokens: 3000 },
        model: "test-model",
      });

      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(200);
      expect(mockSettlePayment).toHaveBeenCalledWith(
        samplePaymentPayload,
        expect.objectContaining({ amount: "3000" }),
      );
    });

    it("settles for zero when the mock LLM path reports its placeholder usage", async () => {
      // Matches genimg's useMockImage convention (never real inference spend) — a testnet/
      // dummy response should bill for what it actually cost: effectively nothing.
      mockCallLLMAPI.mockResolvedValue({
        content: "I am a placeholder for the LLM response",
        usage: { prompt_tokens: 5, completion_tokens: 15, total_tokens: 15 },
        model: "placeholder model",
      });

      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(200);
      // 5 prompt + 15 completion -> 0.5*5 + 1.5*15 = 2.5 + 22.5 = 25 exactly.
      expect(mockSettlePayment).toHaveBeenCalledWith(
        samplePaymentPayload,
        expect.objectContaining({ amount: "25" }),
      );
    });
  });
});
