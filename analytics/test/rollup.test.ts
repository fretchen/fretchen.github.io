import { describe, it, expect } from "vitest";
import { rollupRecentDays } from "../rollup.js";
import { rollupKey, type MonthRollup } from "../buckets.js";
import { MemoryHitStorage, hourBucket } from "./memoryStorage.js";

const SITE = "fretchen.eu";

// Fixed "now" so the 14-day window is deterministic: yesterday is 2026-08-09,
// and the window runs 2026-07-27 .. 2026-08-09.
const NOW = new Date("2026-08-10T06:00:00Z");

describe("rollupRecentDays", () => {
  it("compacts a day of hourly buckets into its month rollup", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-08-09T08.json": hourBucket(3, { "/": 2, "/blog/": 1 }),
      "counts/fretchen.eu/2026-08-09T17.json": hourBucket(1, { "/blog/": 1 }),
    });

    const summary = await rollupRecentDays(store, SITE, NOW);

    expect(summary.written).toEqual(["2026-08-09"]);
    expect(store.read<MonthRollup>(rollupKey(SITE, "2026-08"))?.days["2026-08-09"]).toEqual({
      hits: 4,
      landings: 0,
      pages: { "/blog/": 2, "/": 2 },
      source: "beacon",
    });
  });

  it("never touches today — it is still being written to", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-08-10T05.json": hourBucket(9, { "/": 9 }),
    });

    const summary = await rollupRecentDays(store, SITE, NOW);

    expect(summary.to).toBe("2026-08-09");
    expect(summary.written).toEqual([]);
    expect(store.read(rollupKey(SITE, "2026-08"))).toBeNull();
  });

  it("is idempotent — a second run writes nothing", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-08-09T08.json": hourBucket(3, { "/": 3 }),
    });

    await rollupRecentDays(store, SITE, NOW);
    const second = await rollupRecentDays(store, SITE, NOW);

    expect(second.written).toEqual([]);
    expect(second.skipped).toContain("2026-08-09");
  });

  it("cannot clobber a backfilled Umami day", async () => {
    const umamiDay = { hits: 42, pages: { "/": 42 }, source: "umami" };
    const store = new MemoryHitStorage({
      [rollupKey(SITE, "2026-08")]: { site: SITE, month: "2026-08", days: { "2026-08-09": umamiDay } },
      "counts/fretchen.eu/2026-08-09T08.json": hourBucket(3, { "/": 3 }),
    });

    const summary = await rollupRecentDays(store, SITE, NOW);

    expect(summary.written).toEqual([]);
    expect(store.read<MonthRollup>(rollupKey(SITE, "2026-08"))?.days["2026-08-09"]).toEqual(umamiDay);
  });

  it("fills only the hole when a run was missed mid-window", async () => {
    const day = { hits: 1, pages: { "/": 1 }, source: "beacon" };
    const store = new MemoryHitStorage({
      [rollupKey(SITE, "2026-08")]: {
        site: SITE,
        month: "2026-08",
        days: { "2026-08-05": day, "2026-08-07": day },
      },
      "counts/fretchen.eu/2026-08-06T10.json": hourBucket(5, { "/x402/": 5 }),
    });

    const summary = await rollupRecentDays(store, SITE, NOW);

    expect(summary.written).toEqual(["2026-08-06"]);
    expect(summary.skipped).toEqual(expect.arrayContaining(["2026-08-05", "2026-08-07"]));
  });

  it("records days with no traffic as empty rather than writing zero rows", async () => {
    const store = new MemoryHitStorage();

    const summary = await rollupRecentDays(store, SITE, NOW);

    expect(summary.written).toEqual([]);
    expect(summary.empty).toHaveLength(14);
    expect(store.objects.size).toBe(0);
  });

  it("spans the month boundary inside the window", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-07-28T12.json": hourBucket(2, { "/": 2 }),
      "counts/fretchen.eu/2026-08-02T12.json": hourBucket(4, { "/": 4 }),
    });

    const summary = await rollupRecentDays(store, SITE, NOW);

    expect(summary.from).toBe("2026-07-27");
    expect(summary.written).toEqual(["2026-07-28", "2026-08-02"]);
    expect(store.read<MonthRollup>(rollupKey(SITE, "2026-07"))?.days["2026-07-28"]?.hits).toBe(2);
    expect(store.read<MonthRollup>(rollupKey(SITE, "2026-08"))?.days["2026-08-02"]?.hits).toBe(4);
  });

  it("reports a day it could not write after repeated conflicts", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-08-09T08.json": hourBucket(3, { "/": 3 }),
    });
    store.failNextPuts = 99;

    const summary = await rollupRecentDays(store, SITE, NOW);

    expect(summary.failed).toEqual(["2026-08-09"]);
  });

  it("widens the window from ROLLUP_WINDOW_DAYS", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-07-15T10.json": hourBucket(8, { "/": 8 }),
    });
    process.env.ROLLUP_WINDOW_DAYS = "40";
    try {
      const summary = await rollupRecentDays(store, SITE, NOW);
      expect(summary.from).toBe("2026-07-01");
      expect(summary.written).toEqual(["2026-07-15"]);
    } finally {
      delete process.env.ROLLUP_WINDOW_DAYS;
    }
  });

  it("ignores a nonsensical ROLLUP_WINDOW_DAYS and keeps the default", async () => {
    const store = new MemoryHitStorage();
    for (const bad of ["abc", "0", "-5", ""]) {
      process.env.ROLLUP_WINDOW_DAYS = bad;
      const summary = await rollupRecentDays(store, SITE, NOW);
      expect(summary.from).toBe("2026-07-27"); // the default 14-day window
    }
    delete process.env.ROLLUP_WINDOW_DAYS;
  });

  // The recovery path for a gap that has aged past stats.ts's fallback window:
  // the hourly objects are still there, they just stopped being reachable.
  it("recovers a day older than the default window when given a wider one", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-07-15T10.json": hourBucket(8, { "/": 8 }),
    });

    const ignored = await rollupRecentDays(store, SITE, NOW);
    expect(ignored.written).toEqual([]);

    const recovered = await rollupRecentDays(store, SITE, NOW, 40);

    expect(recovered.from).toBe("2026-07-01");
    expect(recovered.written).toEqual(["2026-07-15"]);
    expect(store.read<MonthRollup>(rollupKey(SITE, "2026-07"))?.days["2026-07-15"]?.hits).toBe(8);
  });
});
