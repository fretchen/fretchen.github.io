import { describe, it, expect } from "vitest";
import {
  addDays,
  daysInRange,
  readDayFromHourly,
  readRollupDays,
  rebuildDays,
  rollupKey,
  toIsoDate,
  writeDay,
  type MonthRollup,
} from "../buckets.js";
import { MemoryHitStorage, hourBucket } from "./memoryStorage.js";

const SITE = "fretchen.eu";

describe("date helpers", () => {
  it("walks days across a month boundary", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("is UTC, not local — a late-evening local time still reports the UTC day", () => {
    expect(toIsoDate(new Date("2026-08-10T23:30:00Z"))).toBe("2026-08-10");
    expect(toIsoDate(new Date("2026-08-11T00:30:00Z"))).toBe("2026-08-11");
  });

  it("enumerates an inclusive day range", () => {
    expect(daysInRange("2026-08-09", "2026-08-11")).toEqual(["2026-08-09", "2026-08-10", "2026-08-11"]);
    expect(daysInRange("2026-08-09", "2026-08-09")).toEqual(["2026-08-09"]);
  });
});

describe("key computation", () => {
  it("reads a day as 24 zero-padded hour keys, and never lists a prefix", async () => {
    const store = new MemoryHitStorage();

    await readDayFromHourly(store, SITE, "2026-08-10");

    expect(store.gets).toHaveLength(24);
    expect(store.gets[0]).toBe("counts/fretchen.eu/2026-08-10T00.json");
    expect(store.gets[23]).toBe("counts/fretchen.eu/2026-08-10T23.json");
  });

  it("reads one rollup object per month a range touches, across a year boundary", async () => {
    const store = new MemoryHitStorage();

    await readRollupDays(store, SITE, "2025-11-20", "2026-02-03");

    expect(store.gets).toEqual([
      rollupKey(SITE, "2025-11"),
      rollupKey(SITE, "2025-12"),
      rollupKey(SITE, "2026-01"),
      rollupKey(SITE, "2026-02"),
    ]);
  });
});

describe("readDayFromHourly", () => {
  it("sums hits and merges pages across the day's buckets, most-hit first", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-08-10T00.json": hourBucket(5, { "/": 3, "/blog/": 2 }),
      "counts/fretchen.eu/2026-08-10T13.json": hourBucket(2, { "/": 1, "/x402/": 1 }),
    });

    const day = await readDayFromHourly(store, SITE, "2026-08-10");

    expect(day).toEqual({ hits: 7, landings: 0, pages: { "/": 4, "/blog/": 2, "/x402/": 1 }, source: "beacon" });
    expect(Object.keys(day!.pages)).toEqual(["/", "/blog/", "/x402/"]);
  });

  it("sums landings across the day's buckets alongside hits", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-08-10T00.json": hourBucket(5, { "/": 5 }, 3),
      "counts/fretchen.eu/2026-08-10T13.json": hourBucket(2, { "/": 2 }, 1),
    });

    const day = await readDayFromHourly(store, SITE, "2026-08-10");

    expect(day).toMatchObject({ hits: 7, landings: 4 });
  });

  it("treats an hourly bucket written before landings existed as landings: 0", async () => {
    const store = new MemoryHitStorage({
      // No `landings` key at all — simulates a real pre-migration S3 object.
      "counts/fretchen.eu/2026-08-10T00.json": { hits: 5, pages: { "/": 5 } },
    });

    const day = await readDayFromHourly(store, SITE, "2026-08-10");

    expect(day).toMatchObject({ hits: 5, landings: 0 });
  });

  it("returns null for a day with no objects, so no-traffic is distinguishable from not-compacted", async () => {
    const store = new MemoryHitStorage();
    expect(await readDayFromHourly(store, SITE, "2026-08-10")).toBeNull();
  });

  it("ignores buckets belonging to other days", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-08-09T23.json": hourBucket(9, { "/": 9 }),
      "counts/fretchen.eu/2026-08-10T00.json": hourBucket(1, { "/": 1 }),
    });
    expect((await readDayFromHourly(store, SITE, "2026-08-10"))?.hits).toBe(1);
  });
});

describe("readRollupDays", () => {
  it("collects days across the months a range spans, clipped to the range", async () => {
    const store = new MemoryHitStorage({
      [rollupKey(SITE, "2026-07")]: {
        site: SITE,
        month: "2026-07",
        days: {
          "2026-07-30": { hits: 3, pages: { "/": 3 }, source: "umami" },
          "2026-07-31": { hits: 2, pages: { "/a/": 2 }, source: "umami" },
        },
      },
      [rollupKey(SITE, "2026-08")]: {
        site: SITE,
        month: "2026-08",
        days: { "2026-08-01": { hits: 4, pages: { "/": 4 }, source: "beacon" } },
      },
    });

    const days = await readRollupDays(store, SITE, "2026-07-31", "2026-08-01");

    expect(Object.keys(days)).toEqual(["2026-07-31", "2026-08-01"]);
  });

  it("tolerates months with no rollup object", async () => {
    const store = new MemoryHitStorage();
    expect(await readRollupDays(store, SITE, "2026-07-01", "2026-08-01")).toEqual({});
  });
});

describe("writeDay", () => {
  const bucket = { hits: 7, pages: { "/": 7 }, source: "beacon" };

  it("creates the month object when it does not exist", async () => {
    const store = new MemoryHitStorage();

    expect(await writeDay(store, SITE, "2026-08-09", bucket)).toBe("written");
    expect(store.read<MonthRollup>(rollupKey(SITE, "2026-08"))).toEqual({
      site: SITE,
      month: "2026-08",
      days: { "2026-08-09": bucket },
    });
  });

  it("leaves an already-stored day untouched, so backfilled Umami days survive", async () => {
    const umamiDay = { hits: 42, pages: { "/": 42 }, source: "umami" };
    const store = new MemoryHitStorage({
      [rollupKey(SITE, "2026-08")]: { site: SITE, month: "2026-08", days: { "2026-08-09": umamiDay } },
    });

    expect(await writeDay(store, SITE, "2026-08-09", bucket)).toBe("exists");
    expect(store.read<MonthRollup>(rollupKey(SITE, "2026-08"))?.days["2026-08-09"]).toEqual(umamiDay);
  });

  it("keeps days sorted as it appends", async () => {
    const store = new MemoryHitStorage();
    await writeDay(store, SITE, "2026-08-09", bucket);
    await writeDay(store, SITE, "2026-08-02", bucket);

    expect(Object.keys(store.read<MonthRollup>(rollupKey(SITE, "2026-08"))!.days)).toEqual([
      "2026-08-02",
      "2026-08-09",
    ]);
  });

  it("retries from a fresh read after a 412 and still lands the write", async () => {
    const store = new MemoryHitStorage();
    store.failNextPuts = 2;

    expect(await writeDay(store, SITE, "2026-08-09", bucket)).toBe("written");
  });

  it("gives up after three conflicts rather than looping", async () => {
    const store = new MemoryHitStorage();
    store.failNextPuts = 99;

    expect(await writeDay(store, SITE, "2026-08-09", bucket)).toBe("conflict");
  });
});

// The single compaction path behind both rollup.ts and stats.ts.
describe("rebuildDays", () => {
  const TODAY = "2026-08-10";

  it("rebuilds a complete day and compacts it", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-08-09T08.json": hourBucket(3, { "/": 3 }),
    });

    const result = await rebuildDays(store, SITE, ["2026-08-09"], TODAY);

    expect(result.written).toEqual(["2026-08-09"]);
    expect(result.rebuilt["2026-08-09"]?.hits).toBe(3);
    expect(store.read<MonthRollup>(rollupKey(SITE, "2026-08"))?.days["2026-08-09"]?.hits).toBe(3);
  });

  it("returns today's numbers but never compacts them", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-08-10T05.json": hourBucket(2, { "/": 2 }),
    });

    const result = await rebuildDays(store, SITE, [TODAY], TODAY);

    expect(result.rebuilt[TODAY]?.hits).toBe(2);
    expect(result.written).toEqual([]);
    expect(store.read(rollupKey(SITE, "2026-08"))).toBeNull();
  });

  it("reports days with no traffic as empty rather than storing zero rows", async () => {
    const store = new MemoryHitStorage();

    const result = await rebuildDays(store, SITE, ["2026-08-08", "2026-08-09"], TODAY);

    expect(result.empty).toEqual(expect.arrayContaining(["2026-08-08", "2026-08-09"]));
    expect(result.written).toEqual([]);
    expect(store.objects.size).toBe(0);
  });

  it("treats an already-compacted day as neither written nor failed", async () => {
    const existing = { hits: 42, pages: { "/": 42 }, source: "umami" };
    const store = new MemoryHitStorage({
      [rollupKey(SITE, "2026-08")]: { site: SITE, month: "2026-08", days: { "2026-08-09": existing } },
      "counts/fretchen.eu/2026-08-09T08.json": hourBucket(3, { "/": 3 }),
    });

    const result = await rebuildDays(store, SITE, ["2026-08-09"], TODAY);

    expect(result.written).toEqual([]);
    expect(result.failed).toEqual([]);
    expect(store.read<MonthRollup>(rollupKey(SITE, "2026-08"))?.days["2026-08-09"]).toEqual(existing);
  });

  it("records a storage failure without throwing — the data still comes back", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-08-09T08.json": hourBucket(3, { "/": 3 }),
    });
    store.throwOnPut = true;

    const result = await rebuildDays(store, SITE, ["2026-08-09"], TODAY);

    expect(result.failed).toEqual(["2026-08-09"]);
    expect(result.rebuilt["2026-08-09"]?.hits).toBe(3);
  });
});
