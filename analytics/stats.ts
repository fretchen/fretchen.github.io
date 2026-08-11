/**
 * `GET /stats?days=N` — the owner's read endpoint for the dashboard.
 *
 * Counters are private (no public-read ACL), so this is the only way to see
 * them without S3 credentials. Gated by an EIP-191 owner signature, the same
 * bearer scheme the Growth API uses — see `auth.ts`.
 *
 * Reads in two passes: monthly rollups for the range, then hourly buckets for
 * any recent day the weekly cron hasn't compacted yet. The second pass is what
 * decouples this endpoint from the cron's cadence.
 */
import { type HitStorage, S3HitStorage, FileHitStorage } from "./storage.js";
import { parseBearerToken, verifyOwner } from "./auth.js";
import {
  HOURLY_FALLBACK_DAYS,
  addDays,
  daysInRange,
  readDayFromHourly,
  readRollupDays,
  toIsoDate,
  topPages,
  type DayBucket,
} from "./buckets.js";

const SITE = "fretchen.eu";

const DEFAULT_DAYS = 30;
const MAX_DAYS = 90;
const TOP_PAGES = 50;

// `vike dev` serves on 3000 (matching comment_service's list); 5173 covers a
// plain `vite dev` fallback. Unlike hit.ts's whitelist this one actually gates
// the browser: /stats is a preflighted GET with an Authorization header, so an
// origin missing here fails the preflight and the dashboard shows nothing.
const ALLOWED_ORIGINS = ["https://www.fretchen.eu", "http://localhost:3000", "http://localhost:5173"];

const storage: HitStorage = process.env.ANALYTICS_STORAGE === "file" ? new FileHitStorage() : new S3HitStorage();

export interface StatsEvent {
  httpMethod: string;
  headers?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
}

export interface StatsDay {
  date: string;
  hits: number;
  /** Absent for zero-filled days — nothing measured them. */
  source?: string;
}

export interface StatsResponse {
  site: string;
  from: string;
  to: string;
  totalHits: number;
  days: StatsDay[];
  pages: { path: string; hits: number }[];
}

/** Same whitelist as `hit.ts`, plus the Authorization header this endpoint needs. */
function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin ?? "") ? origin! : "https://www.fretchen.eu";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };
}

function parseDays(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_DAYS;
  }
  return Math.min(Math.max(parsed, 1), MAX_DAYS);
}

/**
 * Collects the range, preferring rollups and falling back to hourly buckets
 * for days inside the fallback window. Days older than that window which are
 * missing from the rollups are genuine no-traffic days — the cron has already
 * had its chance at them.
 */
export async function collectRange(
  store: HitStorage,
  site: string,
  from: string,
  to: string,
  now: Date = new Date(),
): Promise<Record<string, DayBucket>> {
  const days = await readRollupDays(store, site, from, to);

  const fallbackFrom = addDays(toIsoDate(now), -(HOURLY_FALLBACK_DAYS - 1));
  const missing = daysInRange(from, to).filter((day) => !days[day] && day >= fallbackFrom);

  const recovered = await Promise.all(missing.map((day) => readDayFromHourly(store, site, day)));
  missing.forEach((day, index) => {
    const bucket = recovered[index];
    if (bucket) {
      days[day] = bucket;
    }
  });

  return days;
}

export async function buildStats(
  store: HitStorage,
  site: string,
  requestedDays: number,
  now: Date = new Date(),
): Promise<StatsResponse> {
  const to = toIsoDate(now);
  const from = addDays(to, -(requestedDays - 1));

  const buckets = await collectRange(store, site, from, to, now);

  const pages: Record<string, number> = {};
  for (const bucket of Object.values(buckets)) {
    for (const [path, count] of Object.entries(bucket.pages)) {
      pages[path] = (pages[path] ?? 0) + count;
    }
  }

  // Zero-fill so the frontend can map days straight onto bars.
  const days: StatsDay[] = daysInRange(from, to).map((date) => {
    const bucket = buckets[date];
    return bucket ? { date, hits: bucket.hits, source: bucket.source } : { date, hits: 0 };
  });

  return {
    site,
    from,
    to,
    totalHits: days.reduce((sum, day) => sum + day.hits, 0),
    days,
    pages: Object.entries(topPages(pages, TOP_PAGES)).map(([path, hits]) => ({ path, hits })),
  };
}

export async function handle(
  event: StatsEvent,
  _context: unknown,
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  const origin = event.headers?.origin ?? event.headers?.Origin;
  const headers = getCorsHeaders(origin);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const token = parseBearerToken(event.headers?.authorization ?? event.headers?.Authorization);
  if (!token) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Missing or invalid Authorization header" }) };
  }

  const authError = await verifyOwner(token);
  if (authError) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: authError }) };
  }

  try {
    const stats = await buildStats(storage, SITE, parseDays(event.queryStringParameters?.days));
    return { statusCode: 200, headers, body: JSON.stringify(stats) };
  } catch (err) {
    console.error("stats failed", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal server error" }) };
  }
}

/* Local dev server — only when run directly: npm run dev:stats */
const isEntrypoint =
  typeof process.argv[1] === "string" && import.meta.url.endsWith(process.argv[1].replace(/.*\//, ""));

if (isEntrypoint && process.env.NODE_ENV === "test") {
  (async () => {
    const dotenvModule = await import("dotenv");
    dotenvModule.config();

    const scw = await import("@scaleway/serverless-functions");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    scw.serveHandler(handle as any, 8087);
  })().catch((err) => console.error("Error starting local server", err));
}
