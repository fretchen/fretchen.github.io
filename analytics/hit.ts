/**
 * `POST /hit` — anonymous pageview counter. One JSON object per site per UTC
 * hour, incremented via a conditional-write compare-and-swap loop.
 *
 * Routed from `analytics.ts`, which owns the function entrypoint.
 */
import { type HitStorage, defaultStorage } from "./storage.js";

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

/**
 * Self-identifying crawlers only — catches honest bots, not the chronic
 * evasive crawler found in analytics/notebooks/05_traffic_bursts.ipynb (that
 * one never announces itself; see the notebook's "Tier 2" note on why an IP/CIDR
 * approach was parked instead of built speculatively). Nothing is stored: the
 * UA is inspected per-request to decide whether to write, then discarded —
 * same privacy posture as everything else here.
 */
const BOT_USER_AGENTS = [
  "googlebot",
  "bingbot",
  "ahrefsbot",
  "semrushbot",
  "mj12bot",
  "gptbot",
  "ccbot",
  "claudebot",
  "perplexitybot",
  "yandexbot",
  "petalbot",
  "bytespider",
];

function isKnownBot(userAgent: string | undefined): boolean {
  if (!userAgent) {
    return false;
  }
  const lower = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => lower.includes(bot));
}

// `vike dev` serves on 3000; 5173 covers a plain `vite dev` fallback.
const ALLOWED_ORIGINS = ["https://www.fretchen.eu", "http://localhost:3000", "http://localhost:5173"];

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
  /** Fresh page loads only (onHydrationEnd), not in-app navigations — see hitTracker.ts. */
  landings: number;
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
async function incrementHit(store: HitStorage, site: string, path: string, landing: boolean): Promise<void> {
  const key = hourKey(site);

  for (let attempt = 1; attempt <= MAX_CAS_ATTEMPTS; attempt++) {
    const existing = await store.getWithMeta(key);
    // Stored data can predate `landings` even though the type says it's
    // always there — read it as partial and default explicitly, rather than
    // asserting the parsed JSON matches HourBucket outright.
    const parsed = existing ? (JSON.parse(existing.body) as Partial<HourBucket>) : null;
    const bucket: HourBucket = {
      hits: parsed?.hits ?? 0,
      landings: parsed?.landings ?? 0,
      pages: parsed?.pages ?? {},
    };

    bucket.hits += 1;
    if (landing) {
      bucket.landings += 1;
    }
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

export async function handleHit(event: ScalewayEvent, _context: unknown): Promise<HandlerResponse> {
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

  if (isKnownBot(event.headers?.["user-agent"] ?? event.headers?.["User-Agent"])) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Not tracked" }),
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

  // Defaults to false rather than rejecting the request: an old cached client
  // bundle without this field should keep counting hits, just without the
  // landing/navigation split.
  const landing = parsed.landing === true;

  await incrementHit(defaultStorage, ALLOWED_SITE, path, landing);

  return { statusCode: 204, headers: corsHeaders, body: "" };
}
