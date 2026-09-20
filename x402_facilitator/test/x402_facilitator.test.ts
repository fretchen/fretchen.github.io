import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { handleVerify, handleSettle, handleSupported, handle } from "../x402_facilitator.js";
import type { verifyPayment as verifyPaymentType } from "../x402_verify.js";
import type { settlePayment as settlePaymentType } from "../x402_settle.js";

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
  let verifyPayment: Mock<typeof verifyPaymentType>;
  let settlePayment: Mock<typeof settlePaymentType>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const verifyModule = await import("../x402_verify.js");
    const settleModule = await import("../x402_settle.js");
    verifyPayment = verifyModule.verifyPayment as Mock<typeof verifyPaymentType>;
    settlePayment = settleModule.settlePayment as Mock<typeof settlePaymentType>;
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
      expect(result.headers["Access-Control-Allow-Headers"]).toBe("Content-Type");
      expect(result.headers["Access-Control-Allow-Methods"]).toBe("GET, POST, OPTIONS");
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

    /**
     * The September incident, in one assertion. This endpoint used to build its response from a
     * fixed field list and silently drop `extra`, which for batch-settlement carries the channel
     * state the seller caches. The seller's SDK writes its record from that field WHOLESALE,
     * defaulting each key to zero:
     *
     *   const ex = result.extra ?? {};
     *   const balance     = readExtraString(ex, "balance", "0");
     *   const refundNonce = readExtraNumber(ex, "refundNonce", 0);
     *
     * So dropping it did not leave the seller's record alone — it zeroed the real balance and
     * nonce on every single verify, which surfaced as "payment channel too low" on funded
     * channels and refunds reverting on an already-consumed nonce.
     *
     * Nothing asserted this passthrough before, which is exactly how it was lost.
     */
    it("forwards the scheme's extra, which the seller caches as its channel state", async () => {
      const channelState = {
        channelId: "0xdd9e576d5d30096bce8ed29916ee2d3faaf3a34269011b881eccfb0e082719d7",
        balance: "21300",
        totalClaimed: "5680",
        withdrawRequestedAt: 0,
        refundNonce: "1",
      };
      verifyPayment.mockResolvedValue({
        isValid: true,
        payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        extra: channelState,
      });

      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          paymentPayload: { accepted: { network: "eip155:10" } },
          paymentRequirements: { amount: "1000000" },
        }),
      };
      const result = await handleVerify(event, {});

      // Verbatim: the seller reads these keys directly, so a reshaped or partial copy is as
      // damaging as none at all.
      expect(JSON.parse(result.body).extra).toEqual(channelState);
    });

    it("omits extra entirely when the scheme produced none", async () => {
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

      // Absent, not `"extra": null` — the seller tests `result.extra ?? {}`, and a null would
      // read as "no state" just the same, but an explicit null is a claim we have none.
      expect(JSON.parse(result.body)).not.toHaveProperty("extra");
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

    it("forwards the original payload object, not the validated clone", async () => {
      // safeParse on a looseObject returns a deep clone, and verify/settle read keys the schema
      // does not model. Passing validation.data would pass today and break the first time the
      // schema gains a transform, coercion or default.
      verifyPayment.mockResolvedValue({ isValid: true, payer: "0xabc" });

      const event = {
        httpMethod: "POST",
        body: {
          paymentPayload: {
            accepted: { network: "eip155:10" },
            payload: { signature: "0xdeadbeef" },
          },
          paymentRequirements: { amount: "1000000" },
        },
      };
      await handleVerify(event, {});

      expect(verifyPayment.mock.calls[0][0]).toBe(event.body.paymentPayload);
      expect(verifyPayment.mock.calls[0][1]).toBe(event.body.paymentRequirements);
    });

    it("rejects a payload with no accepted envelope", async () => {
      // @x402/core requires `accepted`, and so does the facilitator: settle derives
      // isBatchSettlement from accepted.scheme. This used to reach the SDK and return
      // isValid:false — an invalid payment, when it was really a malformed request.
      const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          paymentPayload: { payload: { signature: "0xdeadbeef" } },
          paymentRequirements: { amount: "1000000" },
        }),
      };
      const result = await handleVerify(event, {});

      expect(result.statusCode).toBe(400);
      expect(verifyPayment).not.toHaveBeenCalled();
    });
  });

  describe("handleSettle", () => {
    it("should handle CORS preflight OPTIONS request", async () => {
      const event = { httpMethod: "OPTIONS" };
      const result = await handleSettle(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
      expect(result.headers["Access-Control-Allow-Headers"]).toBe("Content-Type");
      expect(result.headers["Access-Control-Allow-Methods"]).toBe("GET, POST, OPTIONS");
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

    it("should include extensions in settle response when present", async () => {
      settlePayment.mockResolvedValue({
        success: true,
        payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        transaction: "0xabc123",
        network: "eip155:10",
        fee: { collected: true, status: "collected", txHash: "0xfee123" },
        extensions: {
          facilitatorFees: {
            info: {
              version: "1",
              facilitatorFeePaid: "10000",
              asset: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
              model: "flat",
              collection: { status: "collected", txHash: "0xfee123" },
            },
          },
        },
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
      expect(body.extensions).toBeDefined();
      expect(body.extensions.facilitatorFees.info.version).toBe("1");
      expect(body.extensions.facilitatorFees.info.facilitatorFeePaid).toBe("10000");
      expect(body.extensions.facilitatorFees.info.model).toBe("flat");
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
      expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
      expect(result.headers["Access-Control-Allow-Headers"]).toBe("Content-Type");
      expect(result.headers["Access-Control-Allow-Methods"]).toBe("GET, POST, OPTIONS");
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

    it("redirects a browser hitting the root to the documentation page", async () => {
      const event = { httpMethod: "GET", path: "/", headers: { Accept: "text/html" } };
      const result = await handle(event, {});

      expect(result.statusCode).toBe(302);
      expect(result.headers.Location).toBe("https://www.fretchen.eu/x402/");
    });

    it("matches the Accept header case-insensitively", async () => {
      const event = {
        httpMethod: "GET",
        path: "/",
        headers: { accept: "text/html,application/xhtml+xml" },
      };
      const result = await handle(event, {});

      expect(result.statusCode).toBe(302);
    });

    it("gives a machine client at the root a JSON body with an onward path", async () => {
      const event = { httpMethod: "GET", path: "/" };
      const result = await handle(event, {});

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.documentation).toBe("https://www.fretchen.eu/x402/");
      expect(body.supported).toBe("/supported");
    });

    it("does not redirect a JSON Accept header at the root", async () => {
      const event = { httpMethod: "GET", path: "/", headers: { Accept: "application/json" } };
      const result = await handle(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.headers.Location).toBeUndefined();
    });

    it("routes /openapi.json to handleOpenApiSpec", async () => {
      const event = { httpMethod: "GET", path: "/openapi.json" };
      const result = await handle(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
      const body = JSON.parse(result.body);
      expect(body.openapi).toBe("3.1.0");
      expect(body.info.title).toBe("fretchen x402 Facilitator");
    });

    it("handles CORS preflight on /openapi.json", async () => {
      const event = { httpMethod: "OPTIONS", path: "/openapi.json" };
      const result = await handle(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe("");
    });

    it("advertises the openapi link in the root's machine-readable body", async () => {
      // The /supported equivalent (links.openapi) is covered in x402_supported.test.js
      // against the real getSupportedCapabilities() — this file mocks that module with a
      // fixture that doesn't carry `links`, so asserting it here would test the mock.
      const rootResult = await handle({ httpMethod: "GET", path: "/" }, {});
      expect(JSON.parse(rootResult.body).openapi).toBe("/openapi.json");
    });
  });
});
