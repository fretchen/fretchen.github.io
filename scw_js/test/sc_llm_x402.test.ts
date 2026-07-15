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
  mockVerifyPayment,
  mockSettlePayment,
} = vi.hoisted(() => ({
  mockCallLLMAPI: vi.fn(),
  // Called once at module load to compute USDC_PRICE_PER_MESSAGE — must have a
  // usable default here (not just in beforeEach, which runs after import).
  mockConvertTokensToUsdcCost: vi.fn().mockReturnValue(1420n),
  mockCreateLLMResourceServer: vi.fn(),
  mockCreateBatchSettlementPaymentRequirements: vi.fn(),
  mockCreate402Response: vi.fn(),
  mockExtractPaymentPayload: vi.fn(),
  mockCreateSettlementHeaders: vi.fn(),
  mockGetBatchSettlementNetworks: vi.fn(),
  mockGetUSDCConfig: vi.fn(),
  mockVerifyPayment: vi.fn(),
  mockSettlePayment: vi.fn(),
}));

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
}));

vi.mock("@fretchen/chain-utils", () => ({
  getUSDCConfig: mockGetUSDCConfig,
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
      resourceServer: { verifyPayment: mockVerifyPayment, settlePayment: mockSettlePayment },
      scheme: {},
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

    it("returns 400 for a non-POST method", async () => {
      const res = await handle(makeEvent({ httpMethod: "GET" }) as never, {});
      expect(res.statusCode).toBe(400);
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
      expect(mockCreateBatchSettlementPaymentRequirements).toHaveBeenCalledWith(
        expect.objectContaining({ payTo: VALID_ADDRESS, scheme: {}, amount: "1420" }),
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
      mockVerifyPayment.mockResolvedValue({ isValid: false, invalidReason: "cap_exceeded" });
      const res = await handle(makeEvent() as never, {});
      expect(res.statusCode).toBe(402);
      expect(JSON.parse(res.body).reason).toBe("cap_exceeded");
      expect(mockCallLLMAPI).not.toHaveBeenCalled();
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
  });
});
