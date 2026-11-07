import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { handleFacilitatorRequest, handleSupportedRequest } from "../src/facilitator_routes.js";
import type { verifyPayment as verifyPaymentType } from "../src/x402_verify.js";
import type { settlePayment as settlePaymentType } from "../src/x402_settle.js";

// Native port of x402_facilitator/test/x402_facilitator.test.ts — the same cases, asserted
// against web-standard Request/Response instead of the Scaleway event envelope. Two envelope
// cases do not survive the port: a pre-parsed object body (an edge request body is always
// text), and rawUrl-based routing (there is one URL here, and routing uses its pathname).

// Mock the dependencies — the payment core's behavior is tested in its own ported suite.
vi.mock("../src/x402_verify.js", () => ({
  verifyPayment: vi.fn(),
}));

vi.mock("../src/x402_settle.js", () => ({
  settlePayment: vi.fn(),
}));

vi.mock("../src/x402_supported.js", () => ({
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

const BASE = "https://facilitator.fretchen.eu";

function request(method: string, path = "/", body?: string, headers?: HeadersInit): Request {
  return new Request(`${BASE}${path}`, { method, body, headers });
}

describe("facilitator routes (verify + settle)", () => {
  let verifyPayment: Mock<typeof verifyPaymentType>;
  let settlePayment: Mock<typeof settlePaymentType>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const verifyModule = await import("../src/x402_verify.js");
    const settleModule = await import("../src/x402_settle.js");
    verifyPayment = verifyModule.verifyPayment as Mock<typeof verifyPaymentType>;
    settlePayment = settleModule.settlePayment as Mock<typeof settlePaymentType>;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("/verify", () => {
    it("should handle CORS preflight OPTIONS request", async () => {
      const res = await handleFacilitatorRequest(request("OPTIONS", "/verify"));

      expect(res.status).toBe(200);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(res.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
      expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, OPTIONS");
      expect(await res.text()).toBe("");
    });

    it("should reject non-POST requests", async () => {
      const res = await handleFacilitatorRequest(request("GET", "/verify"));

      expect(res.status).toBe(405);
      expect(await res.json()).toEqual({
        error: "Method not allowed. Use POST.",
      });
    });

    it("should handle invalid JSON body", async () => {
      const res = await handleFacilitatorRequest(request("POST", "/verify", "not-valid-json{"));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: "Invalid JSON in request body",
      });
    });

    it("should reject missing paymentPayload", async () => {
      const res = await handleFacilitatorRequest(
        request(
          "POST",
          "/verify",
          JSON.stringify({
            paymentRequirements: { amount: "1000000" },
          }),
        ),
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: "Request must include both paymentPayload and paymentRequirements",
      });
    });

    it("should reject missing paymentRequirements", async () => {
      const res = await handleFacilitatorRequest(
        request(
          "POST",
          "/verify",
          JSON.stringify({
            paymentPayload: { accepted: { network: "eip155:10" } },
          }),
        ),
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: "Request must include both paymentPayload and paymentRequirements",
      });
    });

    it("should return valid payment result", async () => {
      verifyPayment.mockResolvedValue({
        isValid: true,
        payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      });

      const res = await handleFacilitatorRequest(
        request(
          "POST",
          "/verify",
          JSON.stringify({
            paymentPayload: { accepted: { network: "eip155:10" } },
            paymentRequirements: { amount: "1000000" },
          }),
        ),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
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

      const res = await handleFacilitatorRequest(
        request(
          "POST",
          "/verify",
          JSON.stringify({
            paymentPayload: { accepted: { network: "eip155:10" } },
            paymentRequirements: { amount: "1000000" },
          }),
        ),
      );

      // Verbatim: the seller reads these keys directly, so a reshaped or partial copy is as
      // damaging as none at all.
      expect((await res.json()).extra).toEqual(channelState);
    });

    it("omits extra entirely when the scheme produced none", async () => {
      verifyPayment.mockResolvedValue({
        isValid: true,
        payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      });

      const res = await handleFacilitatorRequest(
        request(
          "POST",
          "/verify",
          JSON.stringify({
            paymentPayload: { accepted: { network: "eip155:10" } },
            paymentRequirements: { amount: "1000000" },
          }),
        ),
      );

      // Absent, not `extra: null` — an explicit null is a claim we have none.
      expect(await res.json()).not.toHaveProperty("extra");
    });

    it("should return invalid payment result with reason", async () => {
      verifyPayment.mockResolvedValue({
        isValid: false,
        invalidReason: "insufficient_funds",
        payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      });

      const res = await handleFacilitatorRequest(
        request(
          "POST",
          "/verify",
          JSON.stringify({
            paymentPayload: { accepted: { network: "eip155:10" } },
            paymentRequirements: { amount: "1000000" },
          }),
        ),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.isValid).toBe(false);
      expect(body.invalidReason).toBe("insufficient_funds");
    });

    it("should handle unexpected verification error", async () => {
      verifyPayment.mockRejectedValue(new Error("Unexpected error"));

      const res = await handleFacilitatorRequest(
        request(
          "POST",
          "/verify",
          JSON.stringify({
            paymentPayload: { accepted: { network: "eip155:10" } },
            paymentRequirements: { amount: "1000000" },
          }),
        ),
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Internal server error");
      expect(body.isValid).toBe(false);
      expect(body.invalidReason).toBe("unexpected_verify_error");
    });

    it("forwards the original payload object, not the validated clone", async () => {
      // safeParse on a looseObject returns a deep clone, and verify/settle read keys the schema
      // does not model. Passing validation.data would pass today and break the first time the
      // schema gains a transform, coercion or default.
      verifyPayment.mockResolvedValue({ isValid: true, payer: "0xabc" });

      const payload = {
        paymentPayload: {
          accepted: { network: "eip155:10" },
          payload: { signature: "0xdeadbeef" },
        },
        paymentRequirements: { amount: "1000000" },
      };
      await handleFacilitatorRequest(request("POST", "/verify", JSON.stringify(payload)));

      expect(verifyPayment.mock.calls[0][0]).toEqual(payload.paymentPayload);
      expect(verifyPayment.mock.calls[0][1]).toEqual(payload.paymentRequirements);
    });

    it("rejects a payload with no accepted envelope", async () => {
      // @x402/core requires `accepted`, and so does the facilitator: settle derives
      // isBatchSettlement from accepted.scheme. This used to reach the SDK and return
      // isValid:false — an invalid payment, when it was really a malformed request.
      const res = await handleFacilitatorRequest(
        request(
          "POST",
          "/verify",
          JSON.stringify({
            paymentPayload: { payload: { signature: "0xdeadbeef" } },
            paymentRequirements: { amount: "1000000" },
          }),
        ),
      );

      expect(res.status).toBe(400);
      expect(verifyPayment).not.toHaveBeenCalled();
    });
  });

  describe("/settle", () => {
    it("should handle CORS preflight OPTIONS request", async () => {
      const res = await handleFacilitatorRequest(request("OPTIONS", "/settle"));

      expect(res.status).toBe(200);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(res.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
      expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, OPTIONS");
      expect(await res.text()).toBe("");
    });

    it("should reject non-POST requests", async () => {
      const res = await handleFacilitatorRequest(request("GET", "/settle"));

      expect(res.status).toBe(405);
    });

    it("should return successful settlement", async () => {
      settlePayment.mockResolvedValue({
        success: true,
        payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        transaction: "0xabc123",
        network: "eip155:10",
      });

      const res = await handleFacilitatorRequest(
        request(
          "POST",
          "/settle",
          JSON.stringify({
            paymentPayload: { accepted: { network: "eip155:10" } },
            paymentRequirements: { amount: "1000000" },
          }),
        ),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
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

      const res = await handleFacilitatorRequest(
        request(
          "POST",
          "/settle",
          JSON.stringify({
            paymentPayload: { accepted: { network: "eip155:10" } },
            paymentRequirements: { amount: "1000000" },
          }),
        ),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
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

      const res = await handleFacilitatorRequest(
        request(
          "POST",
          "/settle",
          JSON.stringify({
            paymentPayload: { accepted: { network: "eip155:10" } },
            paymentRequirements: { amount: "1000000" },
          }),
        ),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.errorReason).toBe("insufficient_funds");
      expect(body.transaction).toBe("");
    });

    /**
     * The contrast to the case above. `settlement_pending` is the one `success: false` that is
     * recoverable: the transaction was broadcast and only the receipt wait timed out, so the
     * hash has to survive the HTTP boundary — blanking it leaves the caller unable to tell a
     * settlement that never happened from one that may already have confirmed, and retrying is
     * then a double payment.
     */
    it("forwards the broadcast hash on settlement_pending instead of blanking it", async () => {
      settlePayment.mockResolvedValue({
        success: false,
        errorReason: "settlement_pending",
        payer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        transaction: "0xbroadcastbutunconfirmed",
        network: "eip155:10",
      });

      const res = await handleFacilitatorRequest(
        request(
          "POST",
          "/settle",
          JSON.stringify({
            paymentPayload: { accepted: { network: "eip155:10" } },
            paymentRequirements: { amount: "1000000" },
          }),
        ),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.errorReason).toBe("settlement_pending");
      expect(body.transaction).toBe("0xbroadcastbutunconfirmed");
    });

    it("should handle unexpected settlement error", async () => {
      settlePayment.mockRejectedValue(new Error("Unexpected error"));

      const res = await handleFacilitatorRequest(
        request(
          "POST",
          "/settle",
          JSON.stringify({
            paymentPayload: { accepted: { network: "eip155:10" } },
            paymentRequirements: { amount: "1000000" },
          }),
        ),
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Internal server error");
      expect(body.success).toBe(false);
      expect(body.errorReason).toBe("unexpected_settlement_error");
    });
  });

  describe("/supported", () => {
    it("should handle CORS preflight OPTIONS request", async () => {
      const res = await handleSupportedRequest(request("OPTIONS", "/supported"));

      expect(res.status).toBe(200);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(res.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
      expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, OPTIONS");
      expect(await res.text()).toBe("");
    });

    it("should reject non-GET requests", async () => {
      const res = await handleSupportedRequest(request("POST", "/supported"));

      expect(res.status).toBe(405);
      expect(await res.json()).toEqual({
        error: "Method not allowed. Use GET.",
      });
    });

    it("should return supported capabilities", async () => {
      const res = await handleSupportedRequest(request("GET", "/supported"));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.x402Version).toBe(2);
      expect(body.networks).toContain("eip155:10");
    });
  });

  describe("routing", () => {
    it("should route /supported", async () => {
      const res = await handleFacilitatorRequest(request("GET", "/supported"));

      expect(res.status).toBe(200);
      expect((await res.json()).x402Version).toBe(2);
    });

    it("should route /verify", async () => {
      const res = await handleFacilitatorRequest(request("OPTIONS", "/verify"));

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("");
    });

    it("should route /settle", async () => {
      const res = await handleFacilitatorRequest(request("OPTIONS", "/settle"));

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("");
    });

    it("routes by the URL pathname — a query string does not disturb routing", async () => {
      const res = await handleFacilitatorRequest(request("GET", "/supported?detail=1"));

      expect(res.status).toBe(200);
    });

    it("should return 404 for unknown endpoints", async () => {
      const res = await handleFacilitatorRequest(request("GET", "/unknown"));

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({
        error: "Endpoint not found. Use /verify, /settle, or /supported",
      });
    });

    it("redirects a browser hitting the root to the documentation page", async () => {
      const res = await handleFacilitatorRequest(
        request("GET", "/", undefined, { Accept: "text/html" }),
      );

      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("https://www.fretchen.eu/x402/");
    });

    it("matches the Accept header case-insensitively", async () => {
      const res = await handleFacilitatorRequest(
        request("GET", "/", undefined, { accept: "text/html,application/xhtml+xml" }),
      );

      expect(res.status).toBe(302);
    });

    it("gives a machine client at the root a JSON body with an onward path", async () => {
      const res = await handleFacilitatorRequest(request("GET", "/"));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.documentation).toBe("https://www.fretchen.eu/x402/");
      expect(body.supported).toBe("/supported");
    });

    it("does not redirect a JSON Accept header at the root", async () => {
      const res = await handleFacilitatorRequest(
        request("GET", "/", undefined, { Accept: "application/json" }),
      );

      expect(res.status).toBe(200);
      expect(res.headers.get("Location")).toBeNull();
    });

    it("routes /openapi.json to its handler", async () => {
      const res = await handleFacilitatorRequest(request("GET", "/openapi.json"));

      expect(res.status).toBe(200);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
      const body = await res.json();
      expect(body.openapi).toBe("3.1.0");
      expect(body.info.title).toBe("fretchen x402 Facilitator");
    });

    it("handles CORS preflight on /openapi.json", async () => {
      const res = await handleFacilitatorRequest(request("OPTIONS", "/openapi.json"));

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("");
    });

    it("advertises the openapi link in the root's machine-readable body", async () => {
      // The /supported equivalent (links.openapi) is covered in x402_supported.test.ts against
      // the real getSupportedCapabilities() — this file mocks that module with a fixture that
      // does not carry `links`, so asserting it here would test the mock.
      const res = await handleFacilitatorRequest(request("GET", "/"));
      expect((await res.json()).openapi).toBe("/openapi.json");
    });
  });
});
