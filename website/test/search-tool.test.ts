/**
 * `tools/search.ts` sits behind an endpoint that already projects Brave's payload, so what is
 * tested here is this module's own contribution: the second cap, the shape guard, and the query
 * normalisation that keeps a malformed argument from costing a round trip to a metered API.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  fetchSearch,
  selectSearch,
  normalizeQuery,
  searchWebTool,
  type SearchResult,
  type SearchToolResult,
} from "../tools/search";
import { TOOL_REGISTRY } from "../components/AssistantChat";
import { PaymentError } from "../utils/x402PaidFetch";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Narrows the result union to its "ok" shape, asserting that status along the way. */
function assertOk(result: SearchToolResult): asserts result is { status: "ok"; results: SearchResult[] } {
  expect(result.status).toBe("ok");
}

function payload(count: number, text = "Some extracted context.") {
  return {
    results: Array.from({ length: count }, (_, i) => ({
      url: `https://example.com/${i}`,
      title: `Result ${i}`,
      date: "2026-04-13",
      text,
    })),
  };
}

describe("normalizeQuery", () => {
  it.each([
    ["  x402 payments  ", "x402 payments"],
    ["x402", "x402"],
  ])("trims %s", (input, expected) => {
    expect(normalizeQuery(input)).toBe(expected);
  });

  it.each([
    ["an empty string", ""],
    ["whitespace only", "   "],
    ["a non-string", 42],
    ["a query past Brave's 600-character limit", "x".repeat(601)],
  ])("rejects %s without spending a request", (_label, input) => {
    expect(normalizeQuery(input)).toBeNull();
  });
});

describe("selectSearch", () => {
  it("passes a well-formed payload through", () => {
    const result = selectSearch(payload(2), "x402");

    assertOk(result);
    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toMatchObject({ url: "https://example.com/0", date: "2026-04-13" });
  });

  it("caps the result count even if the endpoint returns more", () => {
    const result = selectSearch(payload(20), "x402");

    assertOk(result);
    expect(result.results).toHaveLength(5);
  });

  it("caps a single result's text", () => {
    const result = selectSearch(payload(1, "x".repeat(2000)), "x402");

    assertOk(result);
    expect(result.results[0].text.length).toBeLessThanOrEqual(901);
  });

  it("omits the date when the endpoint has none", () => {
    const result = selectSearch({ results: [{ url: "u", title: "t", text: "x" }] }, "x402");

    assertOk(result);
    expect(result.results[0]).not.toHaveProperty("date");
  });

  it("reports an empty result set as an answer, not a malfunction", () => {
    expect(selectSearch({ results: [] }, "x402")).toEqual({ status: "no_results", query: "x402" });
  });

  it.each([
    ["an error object served with a 200", { error: "Internal server error" }],
    ["results of the wrong shape", { results: [{ url: 1, title: "t", text: "x" }] }],
    ["an HTML page", "<!doctype html>"],
    ["null", null],
  ])("refuses %s rather than inventing sources", (_label, raw) => {
    expect(selectSearch(raw, "x402").status).toBe("invalid_response");
  });
});

describe("fetchSearch", () => {
  /** The paid fetch, not the global one: this route costs $0.01 and the payment is the SDK's job.
   *  What this module still owns is the url it asks for. */
  it("pays for the request and url-encodes the query", async () => {
    const paidFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => payload(1) });

    await fetchSearch("x402 & payments", paidFetch);

    expect(String(paidFetch.mock.calls[0][0])).toContain("/search?q=x402%20%26%20payments");
  });

  it("throws on a non-ok response so the runner can report it", async () => {
    const paidFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(fetchSearch("x402", paidFetch)).rejects.toThrow("HTTP 500");
  });

  /** A payment failure is the paid fetch's to throw, and it must travel unchanged — the runner
   *  maps it to a status of its own, and wrapping it here would lose that. */
  it("lets a PaymentError through untouched", async () => {
    const paidFetch = vi.fn().mockRejectedValue(new PaymentError(402, '{"error":"channel_busy"}'));

    await expect(fetchSearch("x402", paidFetch)).rejects.toBeInstanceOf(PaymentError);
  });
});

describe("registry", () => {
  /** Offered to everyone — a visitor pays for their own searches — but never to a stranger's
   *  agent, which would be spending that visitor's escrow on prompts of its own. */
  it("offers search_web to any visitor, and only on the default agent", () => {
    const entry = TOOL_REGISTRY.find((t) => t.tool.function.name === searchWebTool.function.name);

    expect(entry?.ownerScope).toBeNull();
    expect(entry?.defaultAgentOnly).toBe(true);
    expect(entry?.source).toBe("brave");
  });
});
