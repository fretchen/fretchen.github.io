import type { X402Tool } from "../types/x402";
import { SEARCH_URL } from "../utils/searchApi";
import type { PaidFetch } from "../utils/x402PaidFetch";
import type { PaymentFailure } from "./failure";

/**
 * Web search as a tool for the chat model, bought from the `searchapi` function
 * (`scw_js/search_api.ts`), which proxies Brave's LLM Context API.
 *
 * Paid rather than gated: Brave bills per query, and x402 is how a visitor covers that without an
 * allowlist. $0.01 a call, settled as a voucher on the channel the chat already opened, so it costs
 * no wallet prompt. The paid fetch arrives as a parameter rather than from a hook, so this module
 * stays React-free and testable without a wallet.
 *
 * The server already projects Brave's payload down. This module caps it again — not from distrust
 * of our own endpoint, but because the size of a tool result is this module's promise to the chat
 * loop, and a deploy lagging behind a config change should not quietly widen it.
 */

/** Brave's own limit, mirrored so an over-long query fails here instead of costing a round trip. */
const MAX_QUERY_CHARS = 600;

/** Tool results are input tokens on every later hop, so the ceiling is a cost, not a layout. */
const MAX_RESULTS = 5;
const MAX_CHARS_PER_RESULT = 900;

export const searchWebTool: X402Tool = {
  type: "function",
  function: {
    name: "search_web",
    description:
      "Search the live web and get back extracted page content, not just links. Use this for " +
      "anything current, external, or absent from this site — news, documentation, other " +
      "people's writing. For what fretchen.eu itself says, use get_page instead. Always link " +
      "the url of any result you rely on. Source: Brave Search.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What to search for, phrased as a search query rather than a question.",
        },
      },
      required: ["query"],
    },
  },
};

// --- Result contract -------------------------------------------------------------------------
//
// Returned rather than thrown, so the tool loop keeps running and the model can explain a
// failure instead of the whole chat message crashing.

export interface SearchResult {
  url: string;
  title: string;
  date?: string;
  text: string;
}

export type SearchToolResult =
  | { status: "ok"; results: SearchResult[] }
  | { status: "no_query" }
  | { status: "no_results"; query: string }
  | { status: "invalid_response" }
  | { status: "fetch_failed"; reason: string }
  | PaymentFailure;

/** Turns a fetch-time error (thrown by `fetchSearch`) into a result. */
export { fetchFailed } from "./failure";
export type { PaymentFailure } from "./failure";

// --- Fetcher: paid fetch, no cache, throws on failure ------------------------------------------

/**
 * `paidFetch` rather than a bearer token: the endpoint sells this route for $0.01 in USDC, billed
 * onto the channel the chat already opened (`utils/x402PaidFetch.ts`). A payment that fails throws
 * `PaymentError`, which the runner reports to the model as its own status; a non-OK response here
 * is the resource's own failure, and stays a plain error.
 */
export async function fetchSearch(query: string, paidFetch: PaidFetch): Promise<unknown> {
  const res = await paidFetch(`${SEARCH_URL}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error(`Search request failed: HTTP ${res.status}`);
  }
  return res.json();
}

// --- Selector: pure, synchronous, operates on already-parsed JSON ------------------------------

/**
 * Is this actually a search payload?
 *
 * Worth the lines because the output is stated back to the user as fact, often with a link: an
 * error object served with a 200, or a response from a differently-versioned deploy, would
 * otherwise be summarised into confident, invented sources.
 */
function isSearchPayload(raw: unknown): raw is { results: SearchResult[] } {
  const candidate = raw as { results?: unknown } | null;
  return (
    !!candidate &&
    typeof candidate === "object" &&
    Array.isArray(candidate.results) &&
    candidate.results.every(
      (entry: unknown) =>
        !!entry &&
        typeof (entry as SearchResult).url === "string" &&
        typeof (entry as SearchResult).title === "string" &&
        typeof (entry as SearchResult).text === "string",
    )
  );
}

export function normalizeQuery(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_QUERY_CHARS) return null;
  return trimmed;
}

export function selectSearch(raw: unknown, query: string): SearchToolResult {
  if (!isSearchPayload(raw)) {
    return { status: "invalid_response" };
  }
  if (raw.results.length === 0) {
    // An answer, not a malfunction — the model should rephrase rather than give up.
    return { status: "no_results", query };
  }

  return {
    status: "ok",
    results: raw.results.slice(0, MAX_RESULTS).map((result) => ({
      url: result.url,
      title: result.title,
      ...(result.date ? { date: result.date } : {}),
      text: result.text.length > MAX_CHARS_PER_RESULT ? `${result.text.slice(0, MAX_CHARS_PER_RESULT)}…` : result.text,
    })),
  };
}
