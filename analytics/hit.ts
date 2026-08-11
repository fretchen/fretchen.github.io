/**
 * Anonymous pageview hit counter — one JSON object per site per UTC hour,
 * incremented via a conditional-write compare-and-swap loop against storage.
 */
import { type HitStorage, S3HitStorage, FileHitStorage } from "./storage.js";

export interface ScalewayEvent {
  httpMethod: string;
  headers?: Record<string, string>;
  body?: string | Record<string, unknown>;
}

export interface HandlerResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const ALLOWED_SITE = "fretchen.eu";
const MAX_PATH_LENGTH = 200;
const MAX_PAGES_PER_BUCKET = 200; // caps distinct paths tracked per hour bucket
const MAX_CAS_ATTEMPTS = 3;

// `vike dev` serves on 3000; 5173 covers a plain `vite dev` fallback.
const ALLOWED_ORIGINS = ["https://www.fretchen.eu", "http://localhost:3000", "http://localhost:5173"];

// Local dev/sandbox (`npm run dev`) uses a file store with no credentials;
// production and `npm test` (both leave ANALYTICS_STORAGE unset) use real S3.
const storage: HitStorage = process.env.ANALYTICS_STORAGE === "file" ? new FileHitStorage() : new S3HitStorage();

/**
 * Note: this whitelist is a consistency/defence-in-depth measure, not a spam
 * control. CORS is browser-enforced only, and the pageview beacon is a
 * `sendBeacon` simple request (text/plain, no preflight), so a cross-origin
 * write is not actually blocked by it. Write abuse is bounded by path
 * validation and MAX_PAGES_PER_BUCKET instead.
 */
function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin ?? "") ? origin! : "https://www.fretchen.eu";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

interface HourBucket {
  hits: number;
  pages: Record<string, number>;
}

function sanitizePath(path: unknown): string | null {
  if (typeof path !== "string") {
    return null;
  }
  const clean = path
    .replace(/\p{Cc}/gu, "")
    .trim()
    .slice(0, MAX_PATH_LENGTH);
  if (!clean || !/^\/[\w/.\-~%]*$/.test(clean)) {
    return null;
  }
  return clean;
}

function hourKey(site: string, now: Date = new Date()): string {
  return `counts/${site}/${now.toISOString().slice(0, 13)}.json`; // UTC hour, e.g. 2026-08-09T17
}

/**
 * Increments hits/pages for the current hour bucket. Retries from a fresh
 * read on a CAS conflict; after MAX_CAS_ATTEMPTS gives up silently — a lost
 * count is fine, never worth failing the request over.
 */
async function incrementHit(store: HitStorage, site: string, path: string): Promise<void> {
  const key = hourKey(site);

  for (let attempt = 1; attempt <= MAX_CAS_ATTEMPTS; attempt++) {
    const existing = await store.getWithMeta(key);
    const bucket: HourBucket = existing ? (JSON.parse(existing.body) as HourBucket) : { hits: 0, pages: {} };

    bucket.hits += 1;
    if (bucket.pages[path] !== undefined || Object.keys(bucket.pages).length < MAX_PAGES_PER_BUCKET) {
      bucket.pages[path] = (bucket.pages[path] ?? 0) + 1;
    }

    const result = await store.putConditional(key, JSON.stringify(bucket), {
      ...(existing ? { ifMatch: existing.etag } : { ifNoneMatch: "*" }),
    });
    if (result.ok) {
      return;
    }
    // 412: another writer won the race — retry from a fresh read.
  }
}

export async function handle(event: ScalewayEvent, _context: unknown): Promise<HandlerResponse> {
  const origin = event.headers?.origin ?? event.headers?.Origin;
  const corsHeaders = getCorsHeaders(origin);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Missing request body" }),
    };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = typeof event.body === "string" ? (JSON.parse(event.body) as Record<string, unknown>) : event.body;
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }

  const path = sanitizePath(parsed.path);
  if (parsed.site !== ALLOWED_SITE || !path) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Missing or invalid site/path" }),
    };
  }

  await incrementHit(storage, ALLOWED_SITE, path);

  return { statusCode: 204, headers: corsHeaders, body: "" };
}

/* Local dev server — only when run directly: npm run dev / npm run dev:live */
const isEntrypoint =
  typeof process.argv[1] === "string" && import.meta.url.endsWith(process.argv[1].replace(/.*\//, ""));

if (isEntrypoint && process.env.NODE_ENV === "test") {
  (async () => {
    const dotenvModule = await import("dotenv");
    dotenvModule.config();

    const scw = await import("@scaleway/serverless-functions");
    // ScalewayEvent's stricter headers type (Record<string, string>) isn't
    // structurally assignable to the package's own looser Event type — same
    // cast scw_js/llm_x402_cron.ts uses for the identical mismatch.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    scw.serveHandler(handle as any, 8086);
  })().catch((err) => console.error("Error starting local server", err));
}
