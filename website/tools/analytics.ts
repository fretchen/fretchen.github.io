import type { X402Tool } from "../types/x402";
import type { Stats } from "../types/analytics";
import { ANALYTICS_URL } from "../utils/analyticsApi";
import { RANGES, sliceStats, type Range } from "../utils/analyticsBuckets";

/**
 * The site's own traffic figures as a tool for the chat model, read from the `analytics`
 * function's owner-gated `GET /stats`.
 *
 * Deliberately stateless and React-free, like `tools/bundestakt.ts`: the `Authorization` header
 * arrives as a parameter rather than from `useWalletAuth`, so the module is testable without a
 * wallet and a future non-browser caller can reuse it.
 *
 * No arithmetic of its own — `utils/analyticsBuckets.ts` already windows and aggregates the same
 * sparse day map for the `/analytics` dashboard, and the tool answers from exactly those
 * functions so the two can never disagree.
 */

/** Top pages the dashboard would show is 50; that is far too much to carry on every later hop. */
const MAX_TOP_PAGES = 10;

/** Maps the tool's `range` argument onto `RANGES`, which the dashboard's selector also uses. */
const RANGE_BY_KEY: Record<string, Range> = {
  "30d": RANGES[0],
  "90d": RANGES[1],
  "1y": RANGES[2],
};

export const getAnalyticsTool: X402Tool = {
  type: "function",
  function: {
    name: "get_analytics",
    description:
      "Traffic figures for fretchen.eu itself: total hits, the most-visited pages, and a time " +
      "series over a chosen window. Use this for questions about how the site or a particular " +
      "post is doing. If the result sets hasHistoric, the window reaches back into data " +
      "backfilled from a different analytics tool that filtered bots and counted sessions — say " +
      "so rather than presenting both eras as one comparable number.",
    parameters: {
      type: "object",
      properties: {
        range: {
          type: "string",
          enum: ["30d", "90d", "1y"],
          description: "Window to report on. Defaults to 30d.",
        },
      },
    },
  },
};

// --- Result contract -------------------------------------------------------------------------
//
// Returned rather than thrown, so the tool loop keeps running and the model can explain a
// failure instead of the whole chat message crashing.

export type AnalyticsResult =
  | { status: "ok"; [key: string]: unknown }
  | { status: "invalid_response" }
  | { status: "fetch_failed"; reason: string };

/** Turns a fetch-time error (thrown by `fetchStats`) into a result. */
export function fetchFailed(err: unknown): AnalyticsResult {
  return { status: "fetch_failed", reason: err instanceof Error ? err.message : String(err) };
}

// --- Fetcher: plain fetch, no cache, throws on failure -----------------------------------------

export async function fetchStats(auth: string): Promise<unknown> {
  const res = await fetch(`${ANALYTICS_URL}/stats`, { headers: { Authorization: auth } });
  if (!res.ok) {
    throw new Error(`Analytics request failed: HTTP ${res.status}`);
  }
  return res.json();
}

// --- Selector: pure, synchronous, operates on already-parsed JSON ------------------------------

/**
 * Is this actually a Stats payload?
 *
 * Worth the five lines because the tool's output is stated back to the user as fact: an error
 * object served with a 200, or a response from a differently-versioned deploy, would otherwise
 * be summarised into a confident, invented statistic rather than an error.
 */
function isStats(raw: unknown): raw is Stats {
  const candidate = raw as Partial<Stats> | null;
  return (
    !!candidate &&
    typeof candidate === "object" &&
    typeof candidate.to === "string" &&
    !!candidate.days &&
    typeof candidate.days === "object"
  );
}

export function selectAnalytics(raw: unknown, range: string | undefined): AnalyticsResult {
  if (!isStats(raw)) {
    return { status: "invalid_response" };
  }
  const window = RANGE_BY_KEY[range ?? "30d"] ?? RANGES[0];
  const { buckets, from, to, totalHits, pages, hasHistoric } = sliceStats(raw, window);

  return {
    status: "ok",
    range: window.label,
    from,
    to,
    totalHits,
    topPages: pages.slice(0, MAX_TOP_PAGES),
    // Only what a sentence about the trend needs; the dashboard keeps the rest.
    buckets: buckets.map(({ label, hits }) => ({ label, hits })),
    hasHistoric,
  };
}
