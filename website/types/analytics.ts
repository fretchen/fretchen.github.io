/** Response shape of `GET /stats` — keep in sync with `analytics/stats.ts`. */

export interface DayBucket {
  hits: number;
  /**
   * Fresh page loads only, not in-app navigations. Dwell-gated like every hit
   * (see website/utils/hitTracker.ts), so a visitor who leaves the entry page
   * inside the window contributes no landing at all — these are *engaged*
   * landings, and the ratio to hits reads lower than it did before Sept 2026.
   * Absent on any day written before this field existed (every "umami" day,
   * and any older "beacon" day) — not retrofittable, so treat a missing value
   * as unknown, not zero.
   */
  landings?: number;
  /** Path → count for that day. Summed client-side over whatever range is shown. */
  pages: Record<string, number>;
  /**
   * `"beacon"` for anything the hit counter recorded, `"umami"` for days
   * backfilled from the old Umami export. The two are not the same
   * measurement — Umami filtered bots and sessionised — so the page labels the
   * seam rather than smoothing it over.
   */
  source: string;
}

export interface Stats {
  site: string;
  from: string;
  to: string;
  /**
   * Sparse, keyed `YYYY-MM-DD`: days with no traffic are absent. Always the
   * trailing year — the endpoint takes no range, because the whole thing is
   * ~3KB gzipped and the page slices it locally.
   */
  days: Record<string, DayBucket>;
}
