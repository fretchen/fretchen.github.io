/**
 * `tools/failure.ts` turns a thrown error into a tool result. The payment half is new with PR 2:
 * a tool that could not be paid for must not report itself as a tool that found nothing.
 */
import { describe, it, expect } from "vitest";
import { fetchFailed, paymentFailed } from "../tools/failure";
import { PaymentError } from "../utils/x402PaidFetch";

describe("paymentFailed", () => {
  /** The per-channel lock clears in seconds, so the next hop can succeed — the one payment
   *  failure worth another attempt. */
  it("reports a busy channel as its own retryable status", () => {
    const result = paymentFailed(new PaymentError(402, JSON.stringify({ error: "channel_busy" })));

    expect(result).toEqual({ status: "channel_busy", reason: expect.stringMatching(/busy|seconds/i) });
  });

  it("reports any other payment failure as payment_failed, with the wallet's reason", () => {
    const result = paymentFailed(new PaymentError(402, JSON.stringify({ error: "insufficient_balance" })));

    expect(result?.status).toBe("payment_failed");
    expect(result?.reason).toMatch(/USDC/i);
  });

  /** Not every failure is a payment failure — a 500 from Brave is the request failing, and the
   *  caller falls through to `fetchFailed` for those. */
  it("returns null for an error that is not a payment failure", () => {
    expect(paymentFailed(new Error("Search request failed: HTTP 500"))).toBeNull();
    expect(paymentFailed("not even an error")).toBeNull();
  });

  /** Both paths truncate: a tool result is billed as input tokens on every later hop, and wallet
   *  errors are routinely enormous. */
  it("keeps the reason short, like fetchFailed does", () => {
    const long = new PaymentError(402, `{"error":"${"x".repeat(500)}"}`);

    expect(paymentFailed(long)!.reason.length).toBeLessThanOrEqual(201);
    expect(fetchFailed(new Error("y".repeat(500))).reason.length).toBeLessThanOrEqual(201);
  });
});
