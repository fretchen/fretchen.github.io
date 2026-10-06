import { logger } from "./logger.js";
import { z } from "zod";

/**
 * Brave's LLM Context API as a search backend for /assistent.
 *
 * `https://api.search.brave.com/res/v1/llm/context` returns pre-extracted page chunks plus source
 * metadata in one call, so unlike an ordinary search API there is no second scraping step: what
 * comes back is already the shape a tool result wants.
 *
 * Why this is proxied at all: the key travels in an `X-Subscription-Token` header, which can never
 * reach a browser. The handler in `search_api.ts` gates it on an owner wallet signature, because
 * Brave bills per query and an open proxy to a metered API is an open tab.
 *
 * Split the same way as `image_service.ts` / `llm_service.ts`: this module owns the upstream call
 * and the projection, the handler owns auth, routing and HTTP shape.
 */

const BRAVE_ENDPOINT = "https://api.search.brave.com/res/v1/llm/context";

/**
 * Neither `image_service.ts` nor `llm_service.ts` sets a timeout, which is defensible there: both
 * are the point of the request that called them. This one is a lookup inside somebody's chat turn,
 * where a hung upstream burns the turn rather than one call, so it follows the
 * `FEE_CONFIG_FETCH_TIMEOUT_MS` precedent in `x402_server.ts` instead.
 */
const REQUEST_TIMEOUT_MS = 8_000;

/** Brave's own limit. Rejected here so an over-long query is our 400 rather than their 422. */
export const MAX_QUERY_CHARS = 600;

/**
 * The cost knobs, pinned here and deliberately NOT accepted from the caller.
 *
 * Brave defaults `maximum_number_of_tokens` to 8192 and `maximum_number_of_urls` to 20. A tool
 * result is charged as input tokens on *every later hop* of a chat turn, and the per-message
 * charge is capped by `USDC_MAX_PRICE_PER_MESSAGE` with the operator absorbing anything above it —
 * so accepting Brave's defaults would mean paying for ~8x more context than an answer needs, again
 * and again within one turn. Half the reason this proxy is ours is that these cannot be overridden
 * from the browser.
 *
 * `safesearch` is the one entry here that costs nothing; it sits with the others because it is
 * pinned for the same reason — the browser does not get to choose it. Brave applies no filtering
 * at all when it is unset, which is not a default anyone picked: results are stated back to the
 * user as fact by a model that cannot decline to read them. `moderate` is the setting, for every
 * caller; `off` and `strict` are the other two values Brave accepts.
 */
const CONTEXT_LIMITS: Record<string, string> = {
  count: "10",
  maximum_number_of_urls: "5",
  maximum_number_of_tokens: "2048",
  maximum_number_of_tokens_per_url: "512",
  maximum_number_of_snippets_per_url: "3",
  context_threshold_mode: "balanced",
  safesearch: "moderate",
};

/** Second line of defence behind CONTEXT_LIMITS: Brave's caps are a request, these are a promise. */
const MAX_RESULTS = 5;
const MAX_CHARS_PER_RESULT = 800;

/** A caller error — a missing or oversized query — as distinct from an upstream failure. */
export class QueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QueryError";
  }
}

// --- Upstream contract ------------------------------------------------------------------------
//
// `looseObject` throughout, like `upstream_schemas.ts`: the provider owns its contract and adds
// fields whenever it likes. `.nullish()` rather than `.optional()` for the same reason documented
// there — providers send present-but-null far more often than they omit a key, and `.optional()`
// accepts only the latter.

const BraveGenericSchema = z.looseObject({
  url: z.string(),
  title: z.string().nullish(),
  snippets: z.array(z.string()).nullish(),
});

/** `age` is positional: [full date, YYYY-MM-DD, relative age, ISO 8601]. */
const BraveSourceSchema = z.looseObject({
  age: z.array(z.string().nullish()).nullish(),
});

const BraveContextSchema = z.looseObject({
  grounding: z
    .looseObject({
      generic: z.array(BraveGenericSchema).nullish(),
    })
    .nullish(),
  sources: z.record(z.string(), BraveSourceSchema).nullish(),
});

export interface SearchResult {
  url: string;
  title: string;
  /** YYYY-MM-DD where Brave knows it. Omitted rather than guessed. */
  date?: string;
  text: string;
}

// --- Fetcher ------------------------------------------------------------------------------------

export async function fetchBraveContext(query: string): Promise<unknown> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new QueryError("Missing required query parameter 'q'");
  }
  if (trimmed.length > MAX_QUERY_CHARS) {
    throw new QueryError(
      `Query too long: ${trimmed.length} characters, maximum is ${MAX_QUERY_CHARS}`,
    );
  }

  const apiToken = process.env.BRAVE_API_KEY;
  if (!apiToken) {
    throw new Error(
      "API token not found. Please configure the BRAVE_API_KEY environment variable.",
    );
  }

  const url = new URL(BRAVE_ENDPOINT);
  url.searchParams.set("q", trimmed);
  for (const [key, value] of Object.entries(CONTEXT_LIMITS)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: { accept: "application/json", "X-Subscription-Token": apiToken },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Could not reach Brave: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// --- Selector: pure, synchronous, operates on already-parsed JSON --------------------------------

/**
 * Projects Brave's payload down to what an answer actually needs.
 *
 * Brave's own caps are a request to a third party; these are what this endpoint promises its
 * caller, which is why both exist. `selectClaims` in the website's Bundestakt tool cuts a payload
 * for the same reason.
 */
export function selectSearchResults(raw: unknown): { results: SearchResult[] } {
  const parsed = BraveContextSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Brave returned an unusable response: ${z.prettifyError(parsed.error)}`);
  }

  const generic = parsed.data.grounding?.generic ?? [];
  const sources = parsed.data.sources ?? {};

  const results = generic.slice(0, MAX_RESULTS).map((entry) => {
    const text = (entry.snippets ?? []).join(" ").replace(/\s+/g, " ").trim();
    const date = sources[entry.url]?.age?.[1];

    return {
      url: entry.url,
      title: entry.title?.trim() || entry.url,
      ...(typeof date === "string" && date ? { date } : {}),
      text: text.length > MAX_CHARS_PER_RESULT ? `${text.slice(0, MAX_CHARS_PER_RESULT)}…` : text,
    };
  });

  return { results };
}

export async function searchWeb(query: string): Promise<{ results: SearchResult[] }> {
  const raw = await fetchBraveContext(query);
  const projected = selectSearchResults(raw);
  logger.info({ resultCount: projected.results.length }, "Brave search completed");
  return projected;
}
