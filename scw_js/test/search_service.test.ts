import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchBraveContext,
  selectSearchResults,
  searchWeb,
  QueryError,
  MAX_QUERY_CHARS,
} from "../search_service.js";

/**
 * The projection and the pinned cost knobs.
 *
 * Both exist for the same reason and neither is cosmetic: a tool result is charged as input tokens
 * on every later hop of a chat turn, so Brave's defaults (8192 tokens across 20 urls) would be paid
 * for repeatedly inside one turn. The "pins the cost knobs" test is the one that matters most —
 * nothing else stops those from drifting back to the defaults.
 */

/** Brave's documented response shape: grounding.generic plus a sources map keyed by url. */
function braveResponse(
  urlCount: number,
  snippetsPerUrl = 2,
  snippetText = "A snippet of context.",
) {
  const generic = Array.from({ length: urlCount }, (_, i) => ({
    url: `https://example.com/${i}`,
    title: `Result ${i}`,
    snippets: Array.from({ length: snippetsPerUrl }, () => snippetText),
  }));
  const sources = Object.fromEntries(
    generic.map((entry) => [
      entry.url,
      {
        title: entry.title,
        hostname: "example.com",
        age: ["13 April 2026", "2026-04-13", "5 days ago", ""],
      },
    ]),
  );
  return { grounding: { generic, poi: null, map: [] }, sources };
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.BRAVE_API_KEY;
});

describe("selectSearchResults", () => {
  test("projects Brave's payload to url, title, date and text", () => {
    const { results } = selectSearchResults(braveResponse(1));

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      url: "https://example.com/0",
      title: "Result 0",
      date: "2026-04-13",
    });
    expect(results[0].text).toBe("A snippet of context. A snippet of context.");
  });

  test("caps the number of results regardless of how many Brave returns", () => {
    expect(selectSearchResults(braveResponse(20)).results).toHaveLength(5);
  });

  test("caps the text of a single result", () => {
    const { results } = selectSearchResults(braveResponse(1, 50, "x".repeat(100)));

    expect(results[0].text.length).toBeLessThanOrEqual(801); // 800 + the ellipsis
    expect(results[0].text.endsWith("…")).toBe(true);
  });

  test("keeps a full projected payload small enough to re-bill on every hop", () => {
    const serialized = JSON.stringify(selectSearchResults(braveResponse(20, 50, "x".repeat(100))));

    expect(serialized.length).toBeLessThan(4500);
  });

  test("omits the date rather than guessing when Brave has no age for a url", () => {
    const payload = braveResponse(1);
    payload.sources = {};

    expect(selectSearchResults(payload).results[0]).not.toHaveProperty("date");
  });

  test("falls back to the url when a result has no title", () => {
    const payload = braveResponse(1);
    payload.grounding.generic[0].title = null as unknown as string;

    expect(selectSearchResults(payload).results[0].title).toBe("https://example.com/0");
  });

  test.each([
    ["no grounding at all", { sources: {} }],
    ["a null generic array", { grounding: { generic: null }, sources: {} }],
    ["an empty result set", { grounding: { generic: [] }, sources: {} }],
  ])("returns no results for %s", (_label, payload) => {
    expect(selectSearchResults(payload).results).toEqual([]);
  });

  test("tolerates unknown fields, because the provider owns its contract", () => {
    const payload = braveResponse(1) as Record<string, unknown>;
    payload.some_new_field = { added: "without notice" };

    expect(selectSearchResults(payload).results).toHaveLength(1);
  });

  test("throws on a response that is not Brave's shape", () => {
    expect(() => selectSearchResults({ grounding: { generic: [{ no_url: true }] } })).toThrow(
      /unusable/i,
    );
  });
});

describe("fetchBraveContext", () => {
  beforeEach(() => {
    process.env.BRAVE_API_KEY = "test-token";
  });

  test("pins the cost knobs and ignores nothing to the caller's discretion", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => braveResponse(1) });
    vi.stubGlobal("fetch", fetchMock);

    await fetchBraveContext("what is x402");

    const url = new URL(fetchMock.mock.calls[0][0] as URL);
    expect(url.origin + url.pathname).toBe("https://api.search.brave.com/res/v1/llm/context");
    expect(url.searchParams.get("q")).toBe("what is x402");
    // Brave's defaults are 8192 and 20; these are the whole point of proxying.
    expect(url.searchParams.get("maximum_number_of_tokens")).toBe("2048");
    expect(url.searchParams.get("maximum_number_of_urls")).toBe("5");
    expect(url.searchParams.get("maximum_number_of_tokens_per_url")).toBe("512");
    expect(url.searchParams.get("count")).toBe("10");
  });

  test("sends the key in the header Brave expects, and nowhere else", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => braveResponse(1) });
    vi.stubGlobal("fetch", fetchMock);

    await fetchBraveContext("query");

    const init = fetchMock.mock.calls[0][1] as {
      headers: Record<string, string>;
      signal: AbortSignal;
    };
    expect(init.headers["X-Subscription-Token"]).toBe("test-token");
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("test-token");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  test.each([
    ["an empty query", ""],
    ["a whitespace-only query", "   "],
  ])("rejects %s as a caller error", async (_label, query) => {
    vi.stubGlobal("fetch", vi.fn());

    await expect(fetchBraveContext(query)).rejects.toThrow(QueryError);
  });

  test("rejects a query past Brave's own limit, so it is our 400 and not their 422", async () => {
    vi.stubGlobal("fetch", vi.fn());

    await expect(fetchBraveContext("x".repeat(MAX_QUERY_CHARS + 1))).rejects.toThrow(QueryError);
  });

  test("throws a plain error when the key is not configured", async () => {
    delete process.env.BRAVE_API_KEY;
    vi.stubGlobal("fetch", vi.fn());

    await expect(fetchBraveContext("query")).rejects.toThrow(/BRAVE_API_KEY/);
  });

  test("throws on a non-ok upstream response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429, statusText: "Too Many Requests" }),
    );

    await expect(fetchBraveContext("query")).rejects.toThrow(
      "Could not reach Brave: 429 Too Many Requests",
    );
  });
});

describe("searchWeb", () => {
  test("fetches and projects in one call", async () => {
    process.env.BRAVE_API_KEY = "test-token";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => braveResponse(20) }),
    );

    expect((await searchWeb("query")).results).toHaveLength(5);
  });
});
