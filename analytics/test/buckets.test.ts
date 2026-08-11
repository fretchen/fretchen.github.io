import { describe, it, expect } from "vitest";
import {
  addDays,
  daysInRange,
  hourKeys,
  monthsInRange,
  readDayFromHourly,
  readRollupDays,
  rollupKey,
  toIsoDate,
  topPages,
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

  it("enumerates every month a range touches, including a year boundary", () => {
    expect(monthsInRange("2026-07-11", "2026-08-10")).toEqual(["2026-07", "2026-08"]);
    expect(monthsInRange("2026-03-04", "2026-03-05")).toEqual(["2026-03"]);
    expect(monthsInRange("2025-11-20", "2026-02-03")).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });

  it("computes 24 zero-padded hour keys and never lists", () => {
    const keys = hourKeys(SITE, "2026-08-10");
    expect(keys).toHaveLength(24);
    expect(keys[0]).toBe("counts/fretchen.eu/2026-08-10T00.json");
    expect(keys[23]).toBe("counts/fretchen.eu/2026-08-10T23.json");
  });
});

describe("topPages", () => {
  it("sorts by count descending, ties broken by path", () => {
    expect(topPages({ "/b/": 2, "/a/": 2, "/c/": 9 })).toEqual({ "/c/": 9, "/a/": 2, "/b/": 2 });
  });

  it("truncates to the limit", () => {
    const many = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`/p${i}/`, i]));
    expect(Object.keys(topPages(many, 3))).toEqual(["/p9/", "/p8/", "/p7/"]);
  });
});

describe("readDayFromHourly", () => {
  it("sums hits and merges pages across the day's buckets", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-08-10T00.json": hourBucket(5, { "/": 3, "/blog/": 2 }),
      "counts/fretchen.eu/2026-08-10T13.json": hourBucket(2, { "/": 1, "/x402/": 1 }),
    });

    const day = await readDayFromHourly(store, SITE, "2026-08-10");

    expect(day).toEqual({ hits: 7, pages: { "/": 4, "/blog/": 2, "/x402/": 1 }, source: "beacon" });
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
