/**
 * The analytics function: one Scaleway function, two paths.
 *
 *   POST /hit    anonymous pageview counter  (hit.ts)
 *   GET  /stats  owner-gated readout         (stats.ts)
 *
 * Matches the repo convention — one HTTP function per package with path-based
 * routing, as `x402_facilitator` does for `/verify`, `/settle`, `/supported`.
 * The weekly compaction cron stays a separate function (`rollup.ts`): a cron
 * invocation has no path to route on.
 *
 * **Exact matching, deliberately.** `x402_facilitator` can get away with
 * `path.includes()` because all of its endpoints are unauthenticated. Here an
 * anonymous write sits next to an owner-gated read, so a substring or prefix
 * match would be a way to reach `/stats` handling through a `/hit`-shaped URL.
 * Anything that isn't exactly `/hit` or `/stats` gets a 404 and never reaches a
 * handler.
 */
import { handleHit } from "./hit.js";
import { handleStats } from "./stats.js";

export interface AnalyticsEvent {
  httpMethod: string;
  path?: string;
  headers?: Record<string, string>;
  body?: string | Record<string, unknown>;
  queryStringParameters?: Record<string, string>;
}

export interface HandlerResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Collapses only what a router should: a query string (Scaleway passes it
 * separately as `queryStringParameters`, but a proxy that folds it into `path`
 * must not change which route matches) plus repeated and trailing slashes.
 *
 * No `..` resolution, no case folding, no percent-decoding — each of those
 * would widen what counts as a match, and a path needing them is not one of
 * ours.
 */
function normalizeRoute(rawPath: string | undefined): string {
  const collapsed = (rawPath ?? "")
    .split("?")[0]
    .replace(/\/{2,}/g, "/")
    .replace(/\/+$/, "");
  return collapsed === "" ? "/" : collapsed;
}

export async function handle(event: AnalyticsEvent, context: unknown): Promise<HandlerResponse> {
  const route = normalizeRoute(event.path);

  if (route === "/hit") {
    return handleHit(event, context);
  }
  if (route === "/stats") {
    return handleStats(event, context);
  }

  return {
    statusCode: 404,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://www.fretchen.eu" },
    body: JSON.stringify({ error: "Not found. Use POST /hit or GET /stats" }),
  };
}

/* Local dev server — only when run directly: npm run dev / npm run dev:live */
const isEntrypoint =
  typeof process.argv[1] === "string" && import.meta.url.endsWith(process.argv[1].replace(/.*\//, ""));

if (isEntrypoint && process.env.NODE_ENV === "test") {
  (async () => {
    const dotenvModule = await import("dotenv");
    dotenvModule.config();

    const scw = await import("@scaleway/serverless-functions");
    // AnalyticsEvent's stricter headers type (Record<string, string>) isn't
    // structurally assignable to the package's own looser Event type — same
    // cast scw_js/llm_x402_cron.ts uses for the identical mismatch.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    scw.serveHandler(handle as any, 8086);
    console.log("analytics dev server on :8086 — POST /hit, GET /stats");
  })().catch((err) => console.error("Error starting local server", err));
}
