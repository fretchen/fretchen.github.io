/**
 * The read layer: hourly buckets in, monthly rollups out.
 *
 * `hit.ts` writes one object per UTC hour. That layout can't be read directly
 * for a dashboard — `listObjects` (`@fretchen/s3-utils`) issues a single
 * un-paginated ListObjectsV2 (max 1000 keys, silently truncated) and hourly
 * objects accrue at 8760/year, so a 30-day window would also be 720 GETs.
 *
 * So reads go through `rollup/{site}/{YYYY-MM}.json`: one object per month
 * holding a per-day `{hits, pages, source}`. Every key here is **computed**
 * from a date range, never listed, which is what removes the ceiling.
 *
 * Hourly buckets stay the source of truth and are never deleted — `stats.ts`
 * falls back to them for recent days the weekly `rollup.ts` cron hasn't
 * compacted yet, which is what makes that cadence safe.
 */
import type { HitStorage } from "./storage.js";

/** Caps a rolled-up day, mirroring `hit.ts`'s per-hour `MAX_PAGES_PER_BUCKET`. */
const MAX_PAGES_PER_DAY = 500;

const MAX_CAS_ATTEMPTS = 3;

/**
 * How far back `stats.ts` will reconstruct a day from its hourly buckets when
 * it's missing from the rollups, and how far back the cron looks for holes to
 * fill. Deliberately double the weekly cron cadence, so one missed run
 * self-heals on the next; beyond it, a gap is treated as a no-traffic day.
 */
export const HOURLY_FALLBACK_DAYS = 14;

export interface HourBucket {
  hits: number;
  /** Fresh page loads only (onHydrationEnd), not in-app navigations — see hit.ts. */
  landings: number;
  pages: Record<string, number>;
}

export interface DayBucket {
  hits: number;
  /**
   * Absent on any day written before this field existed — every "umami" day
   * and any older "beacon" day. Not retrofittable (see
   * analytics/notebooks/umami_backfill.py's scoping note); treat a missing
   * value as unknown, not zero.
   */
  landings?: number;
  pages: Record<string, number>;
  /** `"beacon"` for anything this service counted; `"umami"` for backfilled history. */
  source: string;
}

export interface MonthRollup {
  site: string;
  month: string;
  days: Record<string, DayBucket>;
}

// ===== Date helpers (UTC throughout — the hour keys are UTC, so these must be too) =====

/** `YYYY-MM-DD` for a Date, in UTC. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function fromIsoDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

export function addDays(day: string, delta: number): string {
  const date = fromIsoDate(day);
  date.setUTCDate(date.getUTCDate() + delta);
  return toIsoDate(date);
}

/** Every day from `from` to `to`, inclusive. */
export function daysInRange(from: string, to: string): string[] {
  const days: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

/** Every `YYYY-MM` touched by the range, inclusive. */
function monthsInRange(from: string, to: string): string[] {
  const months: string[] = [];
  let cursor = `${from.slice(0, 7)}-01`;
  while (cursor.slice(0, 7) <= to.slice(0, 7)) {
    months.push(cursor.slice(0, 7));
    cursor = addDays(cursor, 32).slice(0, 7) + "-01";
  }
  return months;
}

// ===== Keys =====

export function rollupKey(site: string, month: string): string {
  return `rollup/${site}/${month}.json`;
}

/** The 24 hour-bucket keys for one UTC day — computed, so no listing is needed. */
function hourKeys(site: string, day: string): string[] {
  return Array.from({ length: 24 }, (_, hour) => `counts/${site}/${day}T${String(hour).padStart(2, "0")}.json`);
}

// ===== Reads =====

function mergePages(target: Record<string, number>, source: Record<string, number>): void {
  for (const [path, count] of Object.entries(source)) {
    target[path] = (target[path] ?? 0) + count;
  }
}

/** Sorts descending by count and truncates to `limit`. */
function topPages(pages: Record<string, number>, limit = MAX_PAGES_PER_DAY): Record<string, number> {
  return Object.fromEntries(
    Object.entries(pages)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit),
  );
}

/**
 * Reconstructs one day from its 24 hourly buckets. Returns null when the day
 * has no objects at all — a day with no traffic is absent, never a zero row,
 * so the cron can tell "nothing happened" from "not compacted yet".
 */
export async function readDayFromHourly(store: HitStorage, site: string, day: string): Promise<DayBucket | null> {
  const results = await Promise.all(hourKeys(site, day).map((key) => store.getWithMeta(key)));

  let hits = 0;
  let landings = 0;
  let found = false;
  const pages: Record<string, number> = {};

  for (const result of results) {
    if (!result) {
      continue;
    }
    found = true;
    const bucket = JSON.parse(result.body) as HourBucket;
    hits += bucket.hits ?? 0;
    landings += bucket.landings ?? 0; // 0 for hours written before this field existed
    mergePages(pages, bucket.pages ?? {});
  }

  return found ? { hits, landings, pages: topPages(pages), source: "beacon" } : null;
}

async function readRollup(store: HitStorage, site: string, month: string): Promise<MonthRollup | null> {
  const existing = await store.getWithMeta(rollupKey(site, month));
  return existing ? (JSON.parse(existing.body) as MonthRollup) : null;
}

/** Every stored day across the months a range touches, keyed by `YYYY-MM-DD`. */
export async function readRollupDays(
  store: HitStorage,
  site: string,
  from: string,
  to: string,
): Promise<Record<string, DayBucket>> {
  const rollups = await Promise.all(monthsInRange(from, to).map((month) => readRollup(store, site, month)));

  const days: Record<string, DayBucket> = {};
  for (const rollup of rollups) {
    for (const [day, bucket] of Object.entries(rollup?.days ?? {})) {
      if (day >= from && day <= to) {
        days[day] = bucket;
      }
    }
  }
  return days;
}

// ===== Writes =====

export type WriteDayResult = "written" | "exists" | "conflict";

/**
 * Adds one day to its month rollup, compare-and-swap, same loop shape as
 * `hit.ts`'s `incrementHit`.
 *
 * **An already-stored day always wins.** That makes the cron idempotent and,
 * more importantly, means it can never overwrite a day backfilled from the
 * Umami export (see `notebooks/umami_backfill.py`, whose `merge_into_existing`
 * follows the same rule).
 */
export async function writeDay(
  store: HitStorage,
  site: string,
  day: string,
  bucket: DayBucket,
): Promise<WriteDayResult> {
  const month = day.slice(0, 7);
  const key = rollupKey(site, month);

  for (let attempt = 1; attempt <= MAX_CAS_ATTEMPTS; attempt++) {
    const existing = await store.getWithMeta(key);
    const rollup: MonthRollup = existing ? (JSON.parse(existing.body) as MonthRollup) : { site, month, days: {} };

    if (rollup.days[day]) {
      return "exists";
    }

    rollup.days = Object.fromEntries(Object.entries({ ...rollup.days, [day]: bucket }).sort());

    const result = await store.putConditional(key, JSON.stringify(rollup), {
      ...(existing ? { ifMatch: existing.etag } : { ifNoneMatch: "*" }),
    });
    if (result.ok) {
      return "written";
    }
    // 412: another writer won the race — retry from a fresh read.
  }

  return "conflict";
}

export interface RebuildResult {
  /** The days that had traffic, whether or not storing them succeeded. */
  rebuilt: Record<string, DayBucket>;
  written: string[];
  /** Complete days with no hourly objects at all — nothing happened, nothing stored. */
  empty: string[];
  failed: string[];
}

/**
 * Rebuilds each candidate day from its 24 hourly buckets and compacts the
 * complete ones into their monthly rollup.
 *
 * The single implementation behind both callers: `rollup.ts` runs it over a
 * trailing window on a schedule, `stats.ts` runs it over whatever the dashboard
 * asked for that isn't compacted yet. They differ only in how they pick
 * candidates.
 *
 * `today` is rebuilt when asked for but never stored — it is still being
 * written to, and compacting it would freeze a partial count. Storage failures
 * land in `failed` rather than throwing: for `stats.ts` this is a cache warm,
 * and a cache that didn't warm must not fail the read.
 */
export async function rebuildDays(
  store: HitStorage,
  site: string,
  candidates: string[],
  today: string,
): Promise<RebuildResult> {
  const result: RebuildResult = { rebuilt: {}, written: [], empty: [], failed: [] };

  const buckets = await Promise.all(candidates.map((day) => readDayFromHourly(store, site, day)));

  const writes = candidates.map(async (day, index) => {
    const bucket = buckets[index];
    if (!bucket) {
      result.empty.push(day);
      return;
    }
    result.rebuilt[day] = bucket;
    if (day === today) {
      return;
    }
    try {
      const outcome = await writeDay(store, site, day, bucket);
      if (outcome === "written") {
        result.written.push(day);
      } else if (outcome === "conflict") {
        result.failed.push(day);
      }
      // outcome === "exists": the cron or a backfill got there first — not a failure.
    } catch {
      result.failed.push(day);
    }
  });
  await Promise.all(writes);

  return result;
}
