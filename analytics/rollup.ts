/**
 * Weekly compaction cron: folds complete days of hourly buckets into their
 * monthly rollup.
 *
 * This is a *compaction* step, not the source of truth. `stats.ts` reads
 * recent days straight from the hourly buckets when they aren't rolled up yet,
 * so the cadence only affects read cost — a late or missed run changes what
 * the dashboard costs to render, never what it shows.
 */
import { type HitStorage, S3HitStorage, FileHitStorage } from "./storage.js";
import {
  HOURLY_FALLBACK_DAYS,
  addDays,
  daysInRange,
  readDayFromHourly,
  readRollupDays,
  toIsoDate,
  writeDay,
  type WriteDayResult,
} from "./buckets.js";

const SITE = "fretchen.eu";

const storage: HitStorage = process.env.ANALYTICS_STORAGE === "file" ? new FileHitStorage() : new S3HitStorage();

export interface RollupSummary {
  from: string;
  to: string;
  written: string[];
  empty: string[];
  skipped: string[];
  conflicts: string[];
}

/**
 * Compacts every complete day in the trailing window that isn't in a rollup
 * yet. Today is excluded — it is still being written to.
 *
 * The window is `HOURLY_FALLBACK_DAYS` (14) rather than one week, so a single
 * missed run is repaired by the next one. Days already present cost one rollup
 * GET between them all; only genuine holes fan out to 24 hourly GETs.
 */
export async function rollupRecentDays(
  store: HitStorage,
  site: string,
  now: Date = new Date(),
): Promise<RollupSummary> {
  const to = addDays(toIsoDate(now), -1); // yesterday: the most recent complete UTC day
  const from = addDays(to, -(HOURLY_FALLBACK_DAYS - 1));

  const alreadyRolledUp = await readRollupDays(store, site, from, to);
  const summary: RollupSummary = { from, to, written: [], empty: [], skipped: [], conflicts: [] };

  for (const day of daysInRange(from, to)) {
    if (alreadyRolledUp[day]) {
      summary.skipped.push(day);
      continue;
    }

    const bucket = await readDayFromHourly(store, site, day);
    if (!bucket) {
      summary.empty.push(day); // no traffic that day — nothing to store
      continue;
    }

    const result: WriteDayResult = await writeDay(store, site, day, bucket);
    if (result === "written") {
      summary.written.push(day);
    } else if (result === "exists") {
      summary.skipped.push(day);
    } else {
      summary.conflicts.push(day);
    }
  }

  return summary;
}

export async function handle(
  _event: unknown,
  _context: unknown,
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  const headers = { "Content-Type": "application/json" };

  try {
    const summary = await rollupRecentDays(storage, SITE);
    console.log("rollup complete", JSON.stringify(summary));
    return {
      statusCode: summary.conflicts.length > 0 ? 500 : 200,
      headers,
      body: JSON.stringify(summary),
    };
  } catch (err) {
    console.error("rollup failed", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: (err as Error).message }),
    };
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
