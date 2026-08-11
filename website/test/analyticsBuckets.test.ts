import { describe, it, expect } from "vitest";
import { RANGES, addDays, bucketize, daysInRange, sliceStats, topPages, totalHits } from "../utils/analyticsBuckets";
import type { DayBucket, Stats } from "../types/analytics";

const TODAY = "2026-08-11"; // a Tuesday

function day(hits: number, pages: Record<string, number> = { "/": hits }, source = "beacon"): DayBucket {
  return { hits, pages, source };
}

const range = (days: number) => RANGES.find((r) => r.days === days)!;

describe("date helpers", () => {
  it("crosses month and year boundaries in UTC", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("enumerates an inclusive range", () => {
    expect(daysInRange("2026-08-09", "2026-08-11")).toEqual(["2026-08-09", "2026-08-10", "2026-08-11"]);
  });
});

describe("RANGES", () => {
  it("offers one range per granularity — 7 days was noise, 90 daily bars unreadable", () => {
    expect(RANGES.map((r) => [r.days, r.granularity])).toEqual([
      [30, "day"],
      [90, "week"],
      [365, "month"],
    ]);
  });
});

describe("bucketize", () => {
  it("gives one bucket per day over 30 days", () => {
    const { buckets, from, to } = bucketize({}, range(30), TODAY);
    expect(buckets).toHaveLength(30);
    expect(from).toBe("2026-07-13");
    expect(to).toBe(TODAY);
  });

  it("groups 90 days into Monday-start weeks", () => {
    const { buckets } = bucketize({ [TODAY]: day(5) }, range(90), TODAY);

    // 2026-08-11 is a Tuesday, so its week starts Monday 2026-08-10.
    const last = buckets[buckets.length - 1];
    expect(last.key).toBe("2026-08-10");
    expect(last.label).toBe("Week of Aug 10");
    expect(last.hits).toBe(5);
    expect(buckets.length).toBeGreaterThanOrEqual(13);
    expect(buckets.length).toBeLessThanOrEqual(14);
  });

  it("sums a whole week into one bucket", () => {
    const days = {
      "2026-08-03": day(1), // Monday
      "2026-08-06": day(2),
      "2026-08-09": day(4), // Sunday — same week
      "2026-08-10": day(8), // next Monday — different bucket
    };

    const { buckets } = bucketize(days, range(90), TODAY);
    const byKey = Object.fromEntries(buckets.map((b) => [b.key, b.hits]));

    expect(byKey["2026-08-03"]).toBe(7);
    expect(byKey["2026-08-10"]).toBe(8);
  });

  it("groups a year into 12 or 13 calendar months", () => {
    const { buckets } = bucketize({ "2026-03-04": day(18) }, range(365), TODAY);

    const march = buckets.find((b) => b.key === "2026-03-01");
    expect(march?.hits).toBe(18);
    expect(march?.label).toBe("Mar 2026");
    expect(buckets.length).toBeGreaterThanOrEqual(12);
    expect(buckets.length).toBeLessThanOrEqual(13);
  });

  it("keeps empty buckets so the axis stays evenly spaced", () => {
    const { buckets } = bucketize({ [TODAY]: day(3) }, range(30), TODAY);
    expect(buckets.filter((b) => b.hits === 0)).toHaveLength(29);
  });

  it("ignores days outside the window", () => {
    const days = { "2026-01-01": day(999), [TODAY]: day(2) };
    const { buckets } = bucketize(days, range(30), TODAY);
    expect(buckets.reduce((sum, b) => sum + b.hits, 0)).toBe(2);
  });

  it("marks a bucket historic when any day in it predates the counter", () => {
    const days = {
      "2026-08-10": day(4, { "/": 4 }, "umami"),
      "2026-08-11": day(6, { "/": 6 }, "beacon"),
    };

    const { buckets } = bucketize(days, range(90), TODAY);
    const seam = buckets.find((b) => b.key === "2026-08-10");

    // Both days fall in the same week — mixed, so not comparable, so flagged.
    expect(seam?.hits).toBe(10);
    expect(seam?.historic).toBe(true);
  });

  it("leaves a purely beacon-sourced bucket unflagged", () => {
    const { buckets } = bucketize({ [TODAY]: day(6) }, range(30), TODAY);
    expect(buckets.some((b) => b.historic)).toBe(false);
  });
});

describe("totalHits and topPages", () => {
  const days = {
    "2026-08-09": day(5, { "/": 3, "/blog/": 2 }),
    "2026-08-10": day(4, { "/blog/": 4 }),
    "2026-07-01": day(99, { "/old/": 99 }),
  };

  it("sums only the window", () => {
    expect(totalHits(days, "2026-08-09", "2026-08-11")).toBe(9);
  });

  it("merges page counts across the window, most-hit first", () => {
    expect(topPages(days, "2026-08-09", "2026-08-11")).toEqual([
      { path: "/blog/", hits: 6 },
      { path: "/", hits: 3 },
    ]);
  });

  it("excludes pages whose traffic falls outside the window", () => {
    expect(topPages(days, "2026-08-09", "2026-08-11").map((p) => p.path)).not.toContain("/old/");
  });

  it("respects the limit", () => {
    const many = { "2026-08-10": day(6, { "/a/": 3, "/b/": 2, "/c/": 1 }) };
    expect(topPages(many, "2026-08-01", "2026-08-11", 2)).toHaveLength(2);
  });
});

describe("sliceStats", () => {
  const stats: Stats = {
    site: "fretchen.eu",
    from: "2025-08-12",
    to: TODAY,
    days: {
      "2026-02-14": day(20, { "/old/": 20 }, "umami"),
      "2026-08-10": day(5, { "/": 5 }),
      "2026-08-11": day(7, { "/blog/": 7 }),
    },
  };

  it("narrows the totals and pages as the range shrinks", () => {
    const year = sliceStats(stats, range(365));
    const month = sliceStats(stats, range(30));

    expect(year.totalHits).toBe(32);
    expect(month.totalHits).toBe(12);
    expect(year.pages.map((p) => p.path)).toContain("/old/");
    expect(month.pages.map((p) => p.path)).not.toContain("/old/");
  });

  it("reports historic data only when the range reaches back into it", () => {
    expect(sliceStats(stats, range(365)).hasHistoric).toBe(true);
    expect(sliceStats(stats, range(30)).hasHistoric).toBe(false);
  });

  it("anchors the window on the response's `to`, not the local clock", () => {
    const slice = sliceStats(stats, range(30));
    expect(slice.to).toBe(TODAY);
    expect(slice.from).toBe("2026-07-13");
  });
});
