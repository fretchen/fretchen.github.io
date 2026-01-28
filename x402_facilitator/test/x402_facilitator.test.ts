import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  handleVerify,
  handleSettle,
  handleSupported,
  handle,
} from "../x402_facilitator.ts";

// Mock the dependencies
vi.mock("../x402_verify.js", () => ({
  verifyPayment: vi.fn(),
}));

vi.mock("../x402_settle.js", () => ({
  settlePayment: vi.fn(),
}));

vi.mock("../x402_supported.js", () => ({
  getSupportedCapabilities: vi.fn(() => ({
    x402Version: 2,
    kinds: ["exact"],
    networks: ["eip155:10", "eip155:11155420"],
    assets: {
      "eip155:10": ["USDC"],
      "eip155:11155420": ["USDC"],
    },
  })),
}));

describe("x402_facilitator handlers", () => {
  let verifyPayment;
  let settlePayment;

  beforeEach(async () => {
    vi.clearAllMocks();
    const verifyModule = await import("../x402_verify.js");
    const settleModule = await import("../x402_settle.js");
    verifyPayment = verifyModule.verifyPayment;
    settlePayment = settleModule.settlePayment;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("handleVerify", () => {
    it("should handle CORS preflight OPTIONS request", async () => {
      const event = { httpMethod: "OPTIONS" };
      const result = await handleVerify(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
      expect(result.body).toBe("");
    });

    it("should reject non-POST requests", async () => {
      const event = { httpMethod: "GET" };
      const result = await handleVerify(event, {});

      expect(result.statusCode).toBe(405);
      expect(JSON.parse(result.body)).toEqual({
        error: "Method not allowed. Use POST.",
      });
    });

    it("should handle invalid JSON body", async () => {
      const event = {
        httpMethod: "POST",
        body: "not-valid-json{",
      };
      const result = await handleVerify(event, {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: "Invalid JSON in request body",
      });
    });

    it("should reject missing paymentPayload", async () => {
      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          paymentRequirements: { amount: "1000000" },
        }),
      };
      const result = await handleVerify(event, {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: "Request must include both paymentPayload and paymentRequirements",
      });
    });

    it("should reject missing paymentRequirements", async () => {
      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          paymentPayload: { accepted: { network: "eip155:10" } },
        }),
      };
      const result = await handleVerify(event, {});

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: "Request must include both paymentPayload and paymentRequirements",
      });
    });

    it("should return valid payment result", async () => {
      verifyPayment.mockResolvedValue({
        isValid: true,
        payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      });

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          paymentPayload: { accepted: { network: "eip155:10" } },
          paymentRequirements: { amount: "1000000" },
        }),
      };
      const result = await handleVerify(event, {});

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.isValid).toBe(true);
      expect(body.payer).toBe("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    });

    it("should return invalid payment result with reason", async () => {
      verifyPayment.mockResolvedValue({
        isValid: false,
        invalidReason: "insufficient_funds",
        payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      });

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          paymentPayload: { accepted: { network: "eip155:10" } },
          paymentRequirements: { amount: "1000000" },
        }),
      };
      const result = await handleVerify(event, {});

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.isValid).toBe(false);
      expect(body.invalidReason).toBe("insufficient_funds");
    });

    it("should handle unexpected verification error", async () => {
      verifyPayment.mockRejectedValue(new Error("Unexpected error"));

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          paymentPayload: { accepted: { network: "eip155:10" } },
          paymentRequirements: { amount: "1000000" },
        }),
      };
      const result = await handleVerify(event, {});

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toBe("Internal server error");
      expect(body.isValid).toBe(false);
      expect(body.invalidReason).toBe("unexpected_verify_error");
    });

    it("should handle object body (pre-parsed)", async () => {
      verifyPayment.mockResolvedValue({
        isValid: true,
        payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      });

      const event = {
        httpMethod: "POST",
        body: {
          paymentPayload: { accepted: { network: "eip155:10" } },
          paymentRequirements: { amount: "1000000" },
        },
      };
      const result = await handleVerify(event, {});

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).isValid).toBe(true);
    });
  });

  describe("handleSettle", () => {
    it("should handle CORS preflight OPTIONS request", async () => {
      const event = { httpMethod: "OPTIONS" };
      const result = await handleSettle(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe("");
    });

    it("should reject non-POST requests", async () => {
      const event = { httpMethod: "GET" };
      const result = await handleSettle(event, {});

      expect(result.statusCode).toBe(405);
    });

    it("should return successful settlement", async () => {
      settlePayment.mockResolvedValue({
        success: true,
        payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        transaction: "0xabc123",
        network: "eip155:10",
      });

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          paymentPayload: { accepted: { network: "eip155:10" } },
          paymentRequirements: { amount: "1000000" },
        }),
      };
      const result = await handleSettle(event, {});

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.payer).toBe("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
      expect(body.transaction).toBe("0xabc123");
    });

    it("should return failed settlement with error reason", async () => {
      settlePayment.mockResolvedValue({
        success: false,
        errorReason: "insufficient_funds",
        payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        network: "eip155:10",
      });

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          paymentPayload: { accepted: { network: "eip155:10" } },
          paymentRequirements: { amount: "1000000" },
        }),
      };
      const result = await handleSettle(event, {});

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.errorReason).toBe("insufficient_funds");
      expect(body.transaction).toBe("");
    });

    it("should handle unexpected settlement error", async () => {
      settlePayment.mockRejectedValue(new Error("Unexpected error"));

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          paymentPayload: { accepted: { network: "eip155:10" } },
          paymentRequirements: { amount: "1000000" },
        }),
      };
      const result = await handleSettle(event, {});

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toBe("Internal server error");
      expect(body.success).toBe(false);
      expect(body.errorReason).toBe("unexpected_settlement_error");
    });
  });

  describe("handleSupported", () => {
    it("should handle CORS preflight OPTIONS request", async () => {
      const event = { httpMethod: "OPTIONS" };
      const result = await handleSupported(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe("");
    });

    it("should reject non-GET requests", async () => {
      const event = { httpMethod: "POST" };
      const result = await handleSupported(event, {});

      expect(result.statusCode).toBe(405);
      expect(JSON.parse(result.body)).toEqual({
        error: "Method not allowed. Use GET.",
      });
    });

    it("should return supported capabilities", async () => {
      const event = { httpMethod: "GET" };
      const result = await handleSupported(event, {});

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.x402Version).toBe(2);
      expect(body.networks).toContain("eip155:10");
    });
  });

  describe("handle (router)", () => {
    it("should route /supported to handleSupported", async () => {
      const event = { httpMethod: "GET", path: "/supported" };
      const result = await handle(event, {});

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).x402Version).toBe(2);
    });

    it("should route /verify to handleVerify", async () => {
      const event = { httpMethod: "OPTIONS", path: "/verify" };
      const result = await handle(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe("");
    });

    it("should route /settle to handleSettle", async () => {
      const event = { httpMethod: "OPTIONS", path: "/settle" };
      const result = await handle(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe("");
    });

    it("should use rawUrl for routing", async () => {
      const event = { httpMethod: "GET", rawUrl: "https://api.example.com/supported" };
      const result = await handle(event, {});

      expect(result.statusCode).toBe(200);
    });

    it("should return 404 for unknown endpoints", async () => {
      const event = { httpMethod: "GET", path: "/unknown" };
      const result = await handle(event, {});

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({
        error: "Endpoint not found. Use /verify, /settle, or /supported",
      });
    });

    it("should return 404 for empty path", async () => {
      const event = { httpMethod: "GET" };
      const result = await handle(event, {});

      expect(result.statusCode).toBe(404);
    });
  });
});
