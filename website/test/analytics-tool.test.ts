/**
 * The selector is pure over a `Stats` map, so these are plain function tests — the windowing and
 * aggregation come from `utils/analyticsBuckets.ts`, which has its own coverage. What is tested
 * here is the tool's own contribution: the projection, the shape guard, and the payload budget.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchStats, selectAnalytics, fetchFailed, type AnalyticsResult } from "../tools/analytics";
import type { Stats } from "../types/analytics";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Narrows the result union to its "ok" shape, asserting that status along the way. */
function assertOk<T extends object>(result: AnalyticsResult): asserts result is { status: "ok" } & T {
  expect(result.status).toBe("ok");
}

/** `to` anchors the window, so the fixture's days are built backwards from a fixed date. */
const TO = "2026-09-14";

function dayKey(daysAgo: number): string {
  const date = new Date(`${TO}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function buildStats(overrides: Partial<Stats> = {}): Stats {
  const days: Stats["days"] = {};
  // 20 days of traffic with 15 distinct paths, so the top-pages cut has something to cut.
  for (let i = 0; i < 20; i++) {
    const pages: Record<string, number> = {};
    for (let p = 0; p < 15; p++) {
      pages[`/blog/post-${p}`] = p + 1;
    }
    days[dayKey(i)] = { hits: 120, landings: 40, pages, source: "beacon" };
  }
  return { site: "fretchen.eu", from: dayKey(364), to: TO, days, ...overrides };
}

describe("selectAnalytics", () => {
  it("caps topPages at 10, even though the dashboard shows up to 50", () => {
    const result = selectAnalytics(buildStats(), "30d");
    assertOk<{ topPages: unknown[] }>(result);
    expect(result.topPages).toHaveLength(10);
  });

  it("ranks topPages by hits, most first", () => {
    const result = selectAnalytics(buildStats(), "30d");
    assertOk<{ topPages: { path: string; hits: number }[] }>(result);
    const hits = result.topPages.map((p) => p.hits);
    expect(hits).toEqual([...hits].sort((a, b) => b - a));
    expect(result.topPages[0].path).toBe("/blog/post-14"); // the highest per-day count
  });

  it("carries only label and hits per bucket, not the internal key or flag", () => {
    const result = selectAnalytics(buildStats(), "30d");
    assertOk<{ buckets: Record<string, unknown>[] }>(result);
    expect(result.buckets.length).toBeGreaterThan(0);
    for (const bucket of result.buckets) {
      expect(Object.keys(bucket).sort()).toEqual(["hits", "label"]);
    }
  });

  it("reports totalHits over the window", () => {
    const result = selectAnalytics(buildStats(), "30d");
    assertOk<{ totalHits: number }>(result);
    expect(result.totalHits).toBe(20 * 120);
  });

  // The two eras are not the same measurement — Umami filtered bots and sessionised — so the
  // model has to be able to caveat instead of presenting one comparable number.
  it("flags a window that reaches into backfilled Umami data", () => {
    const stats = buildStats();
    stats.days[dayKey(5)] = { ...stats.days[dayKey(5)], source: "umami" };
    const result = selectAnalytics(stats, "30d");
    assertOk<{ hasHistoric: boolean }>(result);
    expect(result.hasHistoric).toBe(true);
  });

  it("does not flag a window made only of the site's own counter", () => {
    const result = selectAnalytics(buildStats(), "30d");
    assertOk<{ hasHistoric: boolean }>(result);
    expect(result.hasHistoric).toBe(false);
  });

  it("accepts each of the three ranges and reports the window it used", () => {
    for (const [key, label] of [
      ["30d", "30 days"],
      ["90d", "90 days"],
      ["1y", "1 year"],
    ] as const) {
      const result = selectAnalytics(buildStats(), key);
      assertOk<{ range: string; from: string; to: string }>(result);
      expect(result.range).toBe(label);
      expect(result.to).toBe(TO);
      expect(result.from < result.to).toBe(true);
    }
  });

  it("defaults to the 30-day window when no range is given", () => {
    const result = selectAnalytics(buildStats(), undefined);
    assertOk<{ range: string }>(result);
    expect(result.range).toBe("30 days");
  });

  it("falls back to the default window for an unknown range rather than crashing", () => {
    const result = selectAnalytics(buildStats(), "all-time");
    assertOk<{ range: string }>(result);
    expect(result.range).toBe("30 days");
  });

  // Regression guard for the reason the shape check exists at all: anything that is not Stats
  // must become an error, never a confidently invented statistic.
  it("rejects an error object served with a 200 instead of inventing numbers", () => {
    expect(selectAnalytics({ error: "Missing or invalid Authorization header" }, "30d")).toEqual({
      status: "invalid_response",
    });
  });

  it("rejects null and a missing days map", () => {
    expect(selectAnalytics(null, "30d")).toEqual({ status: "invalid_response" });
    expect(selectAnalytics({ site: "x", to: "2026-09-14" }, "30d")).toEqual({ status: "invalid_response" });
  });

  it("stays within the per-hop payload budget", () => {
    const result = selectAnalytics(buildStats(), "1y");
    expect(Buffer.byteLength(JSON.stringify(result), "utf8")).toBeLessThan(4000);
  });

  it("result is JSON-round-trippable", () => {
    const result = selectAnalytics(buildStats(), "30d");
    expect(() => JSON.parse(JSON.stringify(result))).not.toThrow();
  });
});

describe("fetchStats", () => {
  it("sends the Authorization header through", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => buildStats() });
    vi.stubGlobal("fetch", fetchMock);

    await fetchStats("Bearer token123");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token123");
  });

  it("throws a readable error on a non-2xx response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(fetchStats("Bearer nope")).rejects.toThrow(/401/);
  });
});

describe("fetchFailed", () => {
  it("wraps a thrown Error as a fetch_failed result", () => {
    expect(fetchFailed(new Error("offline"))).toEqual({ status: "fetch_failed", reason: "offline" });
  });
});
