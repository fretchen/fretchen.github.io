/** Response shape of `GET /stats` — keep in sync with `analytics/stats.ts`. */

export interface StatsDay {
  date: string;
  hits: number;
  /**
   * `"beacon"` for anything the hit counter recorded, `"umami"` for days
   * backfilled from the old Umami export, absent for zero-filled days.
   * The two sources are not the same measurement — Umami filtered bots and
   * sessionised — so the page labels the seam rather than smoothing it over.
   */
  source?: string;
}

export interface StatsPage {
  path: string;
  hits: number;
}

export interface Stats {
  site: string;
  from: string;
  to: string;
  totalHits: number;
  days: StatsDay[];
  pages: StatsPage[];
}
