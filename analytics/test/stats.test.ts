import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { privateKeyToAccount } from "viem/accounts";

// The handler's module-level storage is S3HitStorage; the range logic below is
// tested directly against MemoryHitStorage instead.
const { mockGetS3ObjectWithMeta, mockPutS3ObjectConditional } = vi.hoisted(() => ({
  mockGetS3ObjectWithMeta: vi.fn(),
  mockPutS3ObjectConditional: vi.fn(),
}));

vi.mock("@fretchen/s3-utils", () => ({
  getS3ObjectWithMeta: mockGetS3ObjectWithMeta,
  putS3ObjectConditional: mockPutS3ObjectConditional,
}));

import { buildStats, collectRange, handleStats, type StatsEvent, type StatsResponse } from "../stats.js";
import { rollupKey, type MonthRollup } from "../buckets.js";
import { MemoryHitStorage, hourBucket } from "./memoryStorage.js";

const SITE = "fretchen.eu";
const NOW = new Date("2026-08-10T06:00:00Z");

// Anvil account #0 — a well-known test key, never used for anything real.
const OWNER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const owner = privateKeyToAccount(OWNER_KEY);
const OTHER_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const other = privateKeyToAccount(OTHER_KEY);

async function bearer(account: typeof owner, timestamp = Math.floor(Date.now() / 1000)): Promise<string> {
  const message = `analytics-api:${timestamp}`;
  const signature = await account.signMessage({ message });
  return `Bearer ${Buffer.from(JSON.stringify({ address: account.address, signature, message })).toString("base64")}`;
}

function makeEvent(overrides: Partial<StatsEvent> = {}): StatsEvent {
  return { httpMethod: "GET", ...overrides };
}

describe("collectRange", () => {
  it("prefers the rollups and falls back to hourly only for the gaps", async () => {
    const store = new MemoryHitStorage({
      [rollupKey(SITE, "2026-08")]: {
        site: SITE,
        month: "2026-08",
        days: { "2026-08-08": { hits: 11, pages: { "/": 11 }, source: "beacon" } },
      },
      // 2026-08-09 was never compacted; 2026-08-10 is today.
      "counts/fretchen.eu/2026-08-09T09.json": hourBucket(4, { "/blog/": 4 }),
      "counts/fretchen.eu/2026-08-10T05.json": hourBucket(2, { "/x402/": 2 }),
    });

    const days = await collectRange(store, SITE, "2026-08-08", "2026-08-10", NOW);

    expect(Object.keys(days).sort()).toEqual(["2026-08-08", "2026-08-09", "2026-08-10"]);
    expect(days["2026-08-09"]).toEqual({ hits: 4, pages: { "/blog/": 4 }, source: "beacon" });
  });

  it("returns the same days whether or not they have been rolled up", async () => {
    const hourly = {
      "counts/fretchen.eu/2026-08-09T09.json": hourBucket(4, { "/blog/": 4 }),
      "counts/fretchen.eu/2026-08-08T09.json": hourBucket(6, { "/": 6 }),
    };
    const uncompacted = new MemoryHitStorage(hourly);
    const compacted = new MemoryHitStorage({
      ...hourly,
      [rollupKey(SITE, "2026-08")]: {
        site: SITE,
        month: "2026-08",
        days: {
          "2026-08-08": { hits: 6, pages: { "/": 6 }, source: "beacon" },
          "2026-08-09": { hits: 4, pages: { "/blog/": 4 }, source: "beacon" },
        },
      },
    });

    const before = await collectRange(uncompacted, SITE, "2026-08-04", "2026-08-10", NOW);
    const after = await collectRange(compacted, SITE, "2026-08-04", "2026-08-10", NOW);

    expect(Object.values(before).reduce((sum, d) => sum + d.hits, 0)).toBe(10);
    expect(after).toEqual(before);
  });

  it("does not reach past the 14-day fallback window on a cold start", async () => {
    const store = new MemoryHitStorage({
      // 15 days before "now" — the cron has already had its chance at this day.
      "counts/fretchen.eu/2026-07-27T09.json": hourBucket(50, { "/": 50 }),
      "counts/fretchen.eu/2026-07-28T09.json": hourBucket(7, { "/": 7 }),
    });

    const days = await collectRange(store, SITE, "2026-07-20", "2026-08-10", NOW);

    expect(days["2026-07-27"]).toBeUndefined();
    expect(days["2026-07-28"]?.hits).toBe(7);
  });

  it("only probes days after the newest compacted one — quiet days are settled, not re-read", async () => {
    const store = new MemoryHitStorage({
      [rollupKey(SITE, "2026-08")]: {
        site: SITE,
        month: "2026-08",
        days: { "2026-08-07": { hits: 1, pages: { "/": 1 }, source: "beacon" } },
      },
      // 08-08 and 08-09 were quiet; there is nothing to find and nothing to store.
      "counts/fretchen.eu/2026-08-10T05.json": hourBucket(2, { "/": 2 }),
    });

    await collectRange(store, SITE, "2026-08-01", "2026-08-10", NOW);

    // 08-08, 08-09, 08-10 — the three days after the newest compacted one.
    expect(store.gets.filter((key) => key.startsWith("counts/")).length).toBe(3 * 24);
    expect(store.gets.some((key) => key.startsWith("counts/fretchen.eu/2026-08-06"))).toBe(false);
  });
});

describe("collectRange write-back", () => {
  it("compacts a complete day it had to rebuild from hourly buckets", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-08-09T09.json": hourBucket(4, { "/blog/": 4 }),
    });

    await collectRange(store, SITE, "2026-08-01", "2026-08-10", NOW);

    expect(store.read<MonthRollup>(rollupKey(SITE, "2026-08"))?.days["2026-08-09"]).toEqual({
      hits: 4,
      pages: { "/blog/": 4 },
      source: "beacon",
    });
  });

  it("never compacts today — it is still being written to", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-08-10T05.json": hourBucket(2, { "/": 2 }),
    });

    await collectRange(store, SITE, "2026-08-01", "2026-08-10", NOW);

    expect(store.read<MonthRollup>(rollupKey(SITE, "2026-08"))?.days["2026-08-10"]).toBeUndefined();
  });

  it("cannot clobber a backfilled Umami day", async () => {
    const umamiDay = { hits: 42, pages: { "/": 42 }, source: "umami" };
    const store = new MemoryHitStorage({
      [rollupKey(SITE, "2026-08")]: { site: SITE, month: "2026-08", days: { "2026-08-09": umamiDay } },
      "counts/fretchen.eu/2026-08-09T09.json": hourBucket(4, { "/blog/": 4 }),
    });

    const days = await collectRange(store, SITE, "2026-08-01", "2026-08-10", NOW);

    expect(days["2026-08-09"]).toEqual(umamiDay);
    expect(store.read<MonthRollup>(rollupKey(SITE, "2026-08"))?.days["2026-08-09"]).toEqual(umamiDay);
  });

  it("makes the second call cheap — rollup GETs instead of 24 hourly ones", async () => {
    const seed = {
      "counts/fretchen.eu/2026-08-08T09.json": hourBucket(6, { "/": 6 }),
      "counts/fretchen.eu/2026-08-09T09.json": hourBucket(4, { "/blog/": 4 }),
    };
    const store = new MemoryHitStorage(seed);

    await collectRange(store, SITE, "2026-08-01", "2026-08-10", NOW);
    const firstCallGets = store.gets.length;
    store.gets.length = 0;

    const second = await collectRange(store, SITE, "2026-08-01", "2026-08-10", NOW);

    // Only today still needs its 24 hourly keys; the two rebuilt days are now rollup reads.
    expect(store.gets.filter((key) => key.startsWith("counts/")).length).toBe(24);
    expect(store.gets.length).toBeLessThan(firstCallGets);
    expect(second["2026-08-09"]).toEqual({ hits: 4, pages: { "/blog/": 4 }, source: "beacon" });
  });

  it("still serves the data when the write-back fails", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-08-09T09.json": hourBucket(4, { "/blog/": 4 }),
    });
    store.throwOnPut = true;

    const days = await collectRange(store, SITE, "2026-08-01", "2026-08-10", NOW);

    expect(days["2026-08-09"]?.hits).toBe(4);
  });
});

describe("buildStats", () => {
  it("serves a trailing year, sparse — no zero rows", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-08-10T05.json": hourBucket(2, { "/": 2 }),
    });

    const stats = await buildStats(store, SITE, NOW);

    expect(stats.from).toBe("2025-08-11");
    expect(stats.to).toBe("2026-08-10");
    expect(stats.days).toEqual({ "2026-08-10": { hits: 2, pages: { "/": 2 }, source: "beacon" } });
  });

  it("carries per-day pages and source so the client can slice any range", async () => {
    const store = new MemoryHitStorage({
      [rollupKey(SITE, "2026-08")]: {
        site: SITE,
        month: "2026-08",
        days: {
          "2026-08-01": { hits: 5, pages: { "/": 3, "/blog/": 2 }, source: "umami" },
          "2026-08-02": { hits: 4, pages: { "/blog/": 4 }, source: "beacon" },
        },
      },
    });

    const stats = await buildStats(store, SITE, NOW);

    expect(stats.days["2026-08-01"]).toEqual({ hits: 5, pages: { "/": 3, "/blog/": 2 }, source: "umami" });
    expect(stats.days["2026-08-02"]?.source).toBe("beacon");
  });

  it("spans every month the year touches", async () => {
    const store = new MemoryHitStorage({
      [rollupKey(SITE, "2025-09")]: {
        site: SITE,
        month: "2025-09",
        days: { "2025-09-20": { hits: 3, pages: { "/": 3 }, source: "umami" } },
      },
      [rollupKey(SITE, "2026-08")]: {
        site: SITE,
        month: "2026-08",
        days: { "2026-08-01": { hits: 4, pages: { "/": 4 }, source: "beacon" } },
      },
    });

    const stats = await buildStats(store, SITE, NOW);

    expect(Object.keys(stats.days).sort()).toEqual(["2025-09-20", "2026-08-01"]);
  });

  it("drops days that fall outside the year", async () => {
    const store = new MemoryHitStorage({
      [rollupKey(SITE, "2025-08")]: {
        site: SITE,
        month: "2025-08",
        days: {
          "2025-08-10": { hits: 99, pages: { "/": 99 }, source: "umami" }, // a day too old
          "2025-08-11": { hits: 1, pages: { "/": 1 }, source: "umami" }, // first day in range
        },
      },
    });

    const stats = await buildStats(store, SITE, NOW);

    expect(stats.days["2025-08-10"]).toBeUndefined();
    expect(stats.days["2025-08-11"]?.hits).toBe(1);
  });
});

describe("stats handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetS3ObjectWithMeta.mockResolvedValue(null);
    mockPutS3ObjectConditional.mockResolvedValue({ ok: true, etag: '"e"' });
    process.env.OWNER_ETH_ADDRESS = owner.address;
  });

  afterEach(() => {
    delete process.env.OWNER_ETH_ADDRESS;
  });

  it("responds to OPTIONS with CORS headers, unauthenticated", async () => {
    const res = await handleStats(makeEvent({ httpMethod: "OPTIONS" }), {});
    expect(res.statusCode).toBe(200);
    expect(res.headers["Access-Control-Allow-Headers"]).toContain("Authorization");
    expect(mockGetS3ObjectWithMeta).not.toHaveBeenCalled();
  });

  // The preflight is real here — /stats is a GET carrying Authorization — so an
  // origin missing from the whitelist blocks the dashboard outright.
  it.each(["http://localhost:3000", "http://localhost:5173", "https://www.fretchen.eu"])(
    "passes preflight for %s",
    async (origin) => {
      const res = await handleStats(makeEvent({ httpMethod: "OPTIONS", headers: { origin } }), {});
      expect(res.headers["Access-Control-Allow-Origin"]).toBe(origin);
    },
  );

  it("does not echo an unknown origin", async () => {
    const res = await handleStats(makeEvent({ httpMethod: "OPTIONS", headers: { origin: "https://evil.com" } }), {});
    expect(res.headers["Access-Control-Allow-Origin"]).toBe("https://www.fretchen.eu");
  });

  it("rejects non-GET methods with 405", async () => {
    const res = await handleStats(makeEvent({ httpMethod: "POST" }), {});
    expect(res.statusCode).toBe(405);
  });

  it("rejects a missing Authorization header with 401", async () => {
    const res = await handleStats(makeEvent(), {});
    expect(res.statusCode).toBe(401);
    expect(mockGetS3ObjectWithMeta).not.toHaveBeenCalled();
  });

  it("rejects a malformed bearer token with 401", async () => {
    const res = await handleStats(makeEvent({ headers: { authorization: "Bearer not-base64-json" } }), {});
    expect(res.statusCode).toBe(401);
  });

  it("rejects a signature from a wallet that is not the owner", async () => {
    const res = await handleStats(makeEvent({ headers: { authorization: await bearer(other) } }), {});
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toBe("Address mismatch");
  });

  it("rejects a stale token, so a captured one cannot be replayed", async () => {
    const tenMinutesAgo = Math.floor(Date.now() / 1000) - 600;
    const res = await handleStats(makeEvent({ headers: { authorization: await bearer(owner, tenMinutesAgo) } }), {});
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toBe("Token expired");
  });

  it("rejects a message that is not an analytics-api challenge", async () => {
    const message = `growth-api:${Math.floor(Date.now() / 1000)}`;
    const signature = await owner.signMessage({ message });
    const token = Buffer.from(JSON.stringify({ address: owner.address, signature, message })).toString("base64");

    const res = await handleStats(makeEvent({ headers: { authorization: `Bearer ${token}` } }), {});

    expect(res.statusCode).toBe(401);
  });

  it("refuses to serve when no owner address is configured", async () => {
    delete process.env.OWNER_ETH_ADDRESS;
    const res = await handleStats(makeEvent({ headers: { authorization: await bearer(owner) } }), {});
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toBe("Owner address not configured");
  });

  it("serves the owner a year-wide envelope", async () => {
    const res = await handleStats(makeEvent({ headers: { authorization: await bearer(owner) } }), {});

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as StatsResponse;
    expect(body.site).toBe(SITE);
    expect(body.days).toEqual({});
    // 365 days inclusive of both ends.
    const span = (Date.parse(`${body.to}T00:00:00Z`) - Date.parse(`${body.from}T00:00:00Z`)) / 86_400_000;
    expect(span).toBe(364);
  });

  it("ignores query parameters — there is no window to ask for", async () => {
    const auth = await bearer(owner);

    const plain = JSON.parse(
      (await handleStats(makeEvent({ headers: { authorization: auth } }), {})).body,
    ) as StatsResponse;
    const withParam = JSON.parse(
      (await handleStats(makeEvent({ headers: { authorization: auth }, queryStringParameters: { days: "7" } }), {}))
        .body,
    ) as StatsResponse;

    expect(withParam).toEqual(plain);
  });

  it("returns 500 without leaking the underlying error", async () => {
    mockGetS3ObjectWithMeta.mockRejectedValue(new Error("S3 exploded"));

    const res = await handleStats(makeEvent({ headers: { authorization: await bearer(owner) } }), {});

    expect(res.statusCode).toBe(500);
    expect(res.body).not.toContain("S3 exploded");
  });
});
