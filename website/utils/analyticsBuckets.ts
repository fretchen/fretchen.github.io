/**
 * Slicing and bucketing for the `/analytics` dashboard.
 *
 * `GET /stats` returns the trailing year as a sparse day map and nothing else —
 * no windowing, no totals, no top-pages list. All of that is range-dependent,
 * and the range lives here, in the browser. These are pure functions over that
 * map so the page stays a rendering concern.
 *
 * Buckets are **calendar-aligned** (Monday-start ISO weeks, calendar months)
 * rather than trailing N-day chunks: labels then stay stable across reloads,
 * and monthly buckets line up with the `rollup/{site}/{YYYY-MM}.json` objects
 * the data came from. Leading and trailing partial buckets are kept as they
 * are — the current week or month is genuinely incomplete, and hiding it would
 * be worse than showing it short.
 */
import type { DayBucket, Stats } from "../types/analytics";

export type Granularity = "day" | "week" | "month";

export interface Range {
  days: number;
  granularity: Granularity;
  label: string;
}

/**
 * 7 days is noise at this traffic level, and 90 days of daily bars is
 * unreadable — hence one range per granularity rather than one per duration.
 */
export const RANGES: Range[] = [
  { days: 30, granularity: "day", label: "30 days" },
  { days: 90, granularity: "week", label: "90 days" },
  { days: 365, granularity: "month", label: "1 year" },
];

export interface Bucket {
  /** Stable identity for React keys and tests, e.g. `2026-08-03`. */
  key: string;
  label: string;
  hits: number;
  /** True when any day in the bucket predates the counter — see `DayBucket.source`. */
  historic: boolean;
}

// ===== Date helpers (UTC — the day keys are UTC, so these must be too) =====

function parseDay(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: string, delta: number): string {
  const date = parseDay(day);
  date.setUTCDate(date.getUTCDate() + delta);
  return toIsoDate(date);
}

/** Inclusive. */
export function daysInRange(from: string, to: string): string[] {
  const days: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

/** The Monday on or before `day`. */
function weekStart(day: string): string {
  const date = parseDay(day);
  const dow = (date.getUTCDay() + 6) % 7; // Monday = 0
  return addDays(day, -dow);
}

// ===== Slicing =====

/** The inclusive window a range covers, ending today. */
export function windowFor(range: Range, today: string): { from: string; to: string } {
  return { from: addDays(today, -(range.days - 1)), to: today };
}

export function totalHits(days: Record<string, DayBucket>, from: string, to: string): number {
  return Object.entries(days).reduce((sum, [day, bucket]) => (day >= from && day <= to ? sum + bucket.hits : sum), 0);
}

/** Merged path counts over the window, most-hit first. Ties broken by path. */
export function topPages(
  days: Record<string, DayBucket>,
  from: string,
  to: string,
  limit = 50,
): { path: string; hits: number }[] {
  const pages: Record<string, number> = {};
  for (const [day, bucket] of Object.entries(days)) {
    if (day < from || day > to) {
      continue;
    }
    for (const [path, count] of Object.entries(bucket.pages)) {
      pages[path] = (pages[path] ?? 0) + count;
    }
  }
  return Object.entries(pages)
    .map(([path, hits]) => ({ path, hits }))
    .sort((a, b) => b.hits - a.hits || a.path.localeCompare(b.path))
    .slice(0, limit);
}

function bucketKeyFor(day: string, granularity: Granularity): string {
  if (granularity === "week") {
    return weekStart(day);
  }
  if (granularity === "month") {
    return `${day.slice(0, 7)}-01`;
  }
  return day;
}

function labelFor(key: string, granularity: Granularity): string {
  const date = parseDay(key);
  if (granularity === "month") {
    return date.toLocaleDateString(undefined, { month: "short", year: "numeric", timeZone: "UTC" });
  }
  const short = date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
  return granularity === "week" ? `Week of ${short}` : short;
}

/**
 * Groups the window into calendar buckets, including empty ones — a gap in
 * traffic is information, so the axis stays evenly spaced.
 */
export function bucketize(
  days: Record<string, DayBucket>,
  range: Range,
  today: string,
): { buckets: Bucket[]; from: string; to: string } {
  const { from, to } = windowFor(range, today);

  const buckets: Bucket[] = [];
  const byKey = new Map<string, Bucket>();

  for (const day of daysInRange(from, to)) {
    const key = bucketKeyFor(day, range.granularity);
    let bucket = byKey.get(key);
    if (!bucket) {
      bucket = { key, label: labelFor(key, range.granularity), hits: 0, historic: false };
      byKey.set(key, bucket);
      buckets.push(bucket);
    }

    const entry = days[day];
    if (entry) {
      bucket.hits += entry.hits;
      bucket.historic ||= entry.source === "umami";
    }
  }

  return { buckets, from, to };
}

/** Convenience for the page: everything it needs for one selected range. */
export function sliceStats(stats: Stats, range: Range) {
  const { buckets, from, to } = bucketize(stats.days, range, stats.to);
  return {
    buckets,
    from,
    to,
    totalHits: totalHits(stats.days, from, to),
    pages: topPages(stats.days, from, to),
    hasHistoric: buckets.some((bucket) => bucket.historic),
  };
}
