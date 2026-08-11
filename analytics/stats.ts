/**
 * `GET /stats` — the owner's read endpoint for the dashboard. Routed from
 * `analytics.ts`, which owns the function entrypoint.
 *
 * Counters are private (no public-read ACL), so this is the only way to see
 * them without S3 credentials. Gated by an EIP-191 owner signature, the same
 * bearer scheme the Growth API uses — see `auth.ts`.
 *
 * **Always serves the trailing year, unwindowed.** A full year of daily counts
 * with per-day page maps measures ~15KB (3KB gzipped) against real data, so
 * range parameters were never worth their complexity: the dashboard fetches
 * once and slices client-side. Days are returned as a sparse map — the client
 * walks a calendar anyway to build weekly/monthly buckets, so it fills the
 * gaps itself.
 *
 * Reads in two passes: monthly rollups for the range, then hourly buckets for
 * any recent day the weekly cron hasn't compacted yet. The second pass is what
 * decouples this endpoint from the cron's cadence.
 */
import { type HitStorage, defaultStorage } from "./storage.js";
import { parseBearerToken, verifySignedMessage } from "@fretchen/chain-utils";
import {
  HOURLY_FALLBACK_DAYS,
  addDays,
  daysInRange,
  readRollupDays,
  rebuildDays,
  toIsoDate,
  type DayBucket,
} from "./buckets.js";

const SITE = "fretchen.eu";

/** Scopes a token to this service — one minted for the growth API won't work here. */
const AUTH_PREFIX = "analytics-api";

/** The window served, in days. One year, always. */
const WINDOW_DAYS = 365;

// `vike dev` serves on 3000 (matching comment_service's list); 5173 covers a
// plain `vite dev` fallback. Unlike hit.ts's whitelist this one actually gates
// the browser: /stats is a preflighted GET with an Authorization header, so an
// origin missing here fails the preflight and the dashboard shows nothing.
const ALLOWED_ORIGINS = ["https://www.fretchen.eu", "http://localhost:3000", "http://localhost:5173"];

export interface StatsEvent {
  httpMethod: string;
  headers?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
}

export interface StatsResponse {
  site: string;
  from: string;
  to: string;
  /** Sparse — days with no traffic are absent, not zero rows. */
  days: Record<string, DayBucket>;
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

/**
 * Collects the range, preferring rollups and falling back to hourly buckets
 * for recent days that aren't compacted yet.
 *
 * **Which days get probed.** Compaction runs in date order, so every day up to
 * the newest one present in the rollups is settled: present means traffic,
 * absent means none. Only days after that need their 24 hourly keys read —
 * without this the fallback would re-probe every no-traffic day on every load,
 * and a quiet week would cost 168 GETs forever. `HOURLY_FALLBACK_DAYS` still
 * caps it, for the cold-start case where the rollups are empty.
 *
 * Whatever it has to rebuild, it also compacts — see `rebuildDays`. Without
 * that, every dashboard load would repeat 24 GETs per day the cron hasn't
 * reached yet.
 */
export async function collectRange(
  store: HitStorage,
  site: string,
  from: string,
  to: string,
  now: Date = new Date(),
): Promise<Record<string, DayBucket>> {
  const days = await readRollupDays(store, site, from, to);

  const today = toIsoDate(now);
  const windowStart = addDays(today, -(HOURLY_FALLBACK_DAYS - 1));
  const newestCompacted = Object.keys(days).sort().at(-1);
  const probeFrom = newestCompacted && newestCompacted >= windowStart ? addDays(newestCompacted, 1) : windowStart;

  const candidates = daysInRange(from, to).filter((day) => !days[day] && day >= probeFrom);
  const { rebuilt } = await rebuildDays(store, site, candidates, today);

  return { ...days, ...rebuilt };
}

export async function buildStats(store: HitStorage, site: string, now: Date = new Date()): Promise<StatsResponse> {
  const to = toIsoDate(now);
  const from = addDays(to, -(WINDOW_DAYS - 1));

  return { site, from, to, days: await collectRange(store, site, from, to, now) };
}

export async function handleStats(
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

  const ownerAddress = process.env.OWNER_ETH_ADDRESS;
  const authError = ownerAddress
    ? await verifySignedMessage(token.address, token.signature, token.message, AUTH_PREFIX, ownerAddress)
    : "Owner address not configured";
  if (authError) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: authError }) };
  }

  try {
    const stats = await buildStats(defaultStorage, SITE);
    return { statusCode: 200, headers, body: JSON.stringify(stats) };
  } catch (err) {
    console.error("stats failed", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal server error" }) };
  }
}
