/**
 * Weekly compaction cron: folds complete days of hourly buckets into their
 * monthly rollup.
 *
 * This is a *compaction* step, not the source of truth. `stats.ts` reads recent
 * days straight from the hourly buckets when they aren't rolled up yet, so the
 * cadence only affects read cost — a late run changes what the dashboard costs
 * to render, never what it shows.
 *
 * It is still load-bearing, though: `stats.ts` only looks back
 * `HOURLY_FALLBACK_DAYS`, so days that go uncompacted for longer drop out of
 * the dashboard even though their hourly objects are still in the bucket.
 * `ROLLUP_WINDOW_DAYS` widens the window for exactly that recovery — set it and
 * invoke the function once to pull a gap back in.
 */
import { type HitStorage, defaultStorage } from "./storage.js";
import { HOURLY_FALLBACK_DAYS, addDays, daysInRange, readRollupDays, rebuildDays, toIsoDate } from "./buckets.js";

const SITE = "fretchen.eu";

/**
 * Days back to compact. Defaults to double the weekly cadence so one missed run
 * self-heals on the next; raise it to recover a longer gap.
 */
function windowDays(): number {
  const configured = Number.parseInt(process.env.ROLLUP_WINDOW_DAYS ?? "", 10);
  return Number.isFinite(configured) && configured > 0 ? configured : HOURLY_FALLBACK_DAYS;
}

export interface RollupSummary {
  from: string;
  to: string;
  written: string[];
  empty: string[];
  skipped: string[];
  failed: string[];
}

/**
 * Compacts every complete day in the window that isn't in a rollup yet. Today
 * is excluded — it is still being written to.
 */
export async function rollupRecentDays(
  store: HitStorage,
  site: string,
  now: Date = new Date(),
  days: number = windowDays(),
): Promise<RollupSummary> {
  const to = addDays(toIsoDate(now), -1); // yesterday: the most recent complete UTC day
  const from = addDays(to, -(days - 1));

  const compacted = await readRollupDays(store, site, from, to);
  const all = daysInRange(from, to);
  const candidates = all.filter((day) => !compacted[day]);

  const { written, empty, failed } = await rebuildDays(store, site, candidates, toIsoDate(now));

  return {
    from,
    to,
    written,
    empty,
    skipped: all.filter((day) => compacted[day]),
    failed,
  };
}

export async function handle(
  _event: unknown,
  _context: unknown,
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  const headers = { "Content-Type": "application/json" };

  try {
    const summary = await rollupRecentDays(defaultStorage, SITE);
    console.log("rollup complete", JSON.stringify(summary));
    return {
      statusCode: summary.failed.length > 0 ? 500 : 200,
      headers,
      body: JSON.stringify(summary),
    };
  } catch (err) {
    console.error("rollup failed", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: (err as Error).message }) };
  }
}

/* Local dev server — only when run directly: npm run dev:rollup */
const isEntrypoint =
  typeof process.argv[1] === "string" && import.meta.url.endsWith(process.argv[1].replace(/.*\//, ""));

if (isEntrypoint && process.env.NODE_ENV === "test") {
  (async () => {
    const dotenvModule = await import("dotenv");
    dotenvModule.config();

    const scw = await import("@scaleway/serverless-functions");

    scw.serveHandler(handle, 8088);
  })().catch((err) => console.error("Error starting local server", err));
}
