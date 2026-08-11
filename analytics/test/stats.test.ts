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

import { buildStats, collectRange, handle, type StatsEvent, type StatsResponse } from "../stats.js";
import { rollupKey } from "../buckets.js";
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

    expect(Object.keys(days)).toEqual(["2026-08-08", "2026-08-09", "2026-08-10"]);
    expect(days["2026-08-09"]).toEqual({ hits: 4, pages: { "/blog/": 4 }, source: "beacon" });
  });

  it("gives identical totals whether or not the recent days have been rolled up", async () => {
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

    const before = await buildStats(uncompacted, SITE, 7, NOW);
    const after = await buildStats(compacted, SITE, 7, NOW);

    expect(before.totalHits).toBe(10);
    expect(after).toEqual(before);
  });

  it("does not reach past the 14-day fallback window", async () => {
    const store = new MemoryHitStorage({
      // 15 days before "now" — the cron has already had its chance at this day.
      "counts/fretchen.eu/2026-07-27T09.json": hourBucket(50, { "/": 50 }),
      "counts/fretchen.eu/2026-07-28T09.json": hourBucket(7, { "/": 7 }),
    });

    const days = await collectRange(store, SITE, "2026-07-20", "2026-08-10", NOW);

    expect(days["2026-07-27"]).toBeUndefined();
    expect(days["2026-07-28"]?.hits).toBe(7);
  });
});

describe("buildStats", () => {
  it("zero-fills days with no traffic and leaves their source unset", async () => {
    const store = new MemoryHitStorage({
      "counts/fretchen.eu/2026-08-10T05.json": hourBucket(2, { "/": 2 }),
    });

    const stats = await buildStats(store, SITE, 3, NOW);

    expect(stats.from).toBe("2026-08-08");
    expect(stats.to).toBe("2026-08-10");
    expect(stats.days).toEqual([
      { date: "2026-08-08", hits: 0 },
      { date: "2026-08-09", hits: 0 },
      { date: "2026-08-10", hits: 2, source: "beacon" },
    ]);
    expect(stats.totalHits).toBe(2);
  });

  it("merges pages across the range, most-hit first", async () => {
    const store = new MemoryHitStorage({
      [rollupKey(SITE, "2026-08")]: {
        site: SITE,
        month: "2026-08",
        days: {
          "2026-08-01": { hits: 5, pages: { "/": 3, "/blog/": 2 }, source: "beacon" },
          "2026-08-02": { hits: 4, pages: { "/blog/": 4 }, source: "beacon" },
        },
      },
    });

    const stats = await buildStats(store, SITE, 30, NOW);

    expect(stats.pages).toEqual([
      { path: "/blog/", hits: 6 },
      { path: "/", hits: 3 },
    ]);
  });

  it("carries the umami source through so the seam can be labelled", async () => {
    const store = new MemoryHitStorage({
      [rollupKey(SITE, "2026-08")]: {
        site: SITE,
        month: "2026-08",
        days: { "2026-08-01": { hits: 5, pages: { "/": 5 }, source: "umami" } },
      },
    });

    const stats = await buildStats(store, SITE, 30, NOW);

    expect(stats.days.find((d) => d.date === "2026-08-01")?.source).toBe("umami");
  });

  it("spans months", async () => {
    const store = new MemoryHitStorage({
      [rollupKey(SITE, "2026-07")]: {
        site: SITE,
        month: "2026-07",
        days: { "2026-07-20": { hits: 3, pages: { "/": 3 }, source: "umami" } },
      },
      [rollupKey(SITE, "2026-08")]: {
        site: SITE,
        month: "2026-08",
        days: { "2026-08-01": { hits: 4, pages: { "/": 4 }, source: "beacon" } },
      },
    });

    const stats = await buildStats(store, SITE, 30, NOW);

    expect(stats.totalHits).toBe(7);
    expect(stats.days).toHaveLength(30);
  });
});

describe("stats handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetS3ObjectWithMeta.mockResolvedValue(null);
    process.env.OWNER_ETH_ADDRESS = owner.address;
  });

  afterEach(() => {
    delete process.env.OWNER_ETH_ADDRESS;
  });

  it("responds to OPTIONS with CORS headers, unauthenticated", async () => {
    const res = await handle(makeEvent({ httpMethod: "OPTIONS" }), {});
    expect(res.statusCode).toBe(200);
    expect(res.headers["Access-Control-Allow-Headers"]).toContain("Authorization");
    expect(mockGetS3ObjectWithMeta).not.toHaveBeenCalled();
  });

  // The preflight is real here — /stats is a GET carrying Authorization — so an
  // origin missing from the whitelist blocks the dashboard outright.
  it.each(["http://localhost:3000", "http://localhost:5173", "https://www.fretchen.eu"])(
    "passes preflight for %s",
    async (origin) => {
      const res = await handle(makeEvent({ httpMethod: "OPTIONS", headers: { origin } }), {});
      expect(res.headers["Access-Control-Allow-Origin"]).toBe(origin);
    },
  );

  it("does not echo an unknown origin", async () => {
    const res = await handle(makeEvent({ httpMethod: "OPTIONS", headers: { origin: "https://evil.com" } }), {});
    expect(res.headers["Access-Control-Allow-Origin"]).toBe("https://www.fretchen.eu");
  });

  it("rejects non-GET methods with 405", async () => {
    const res = await handle(makeEvent({ httpMethod: "POST" }), {});
    expect(res.statusCode).toBe(405);
  });

  it("rejects a missing Authorization header with 401", async () => {
    const res = await handle(makeEvent(), {});
    expect(res.statusCode).toBe(401);
    expect(mockGetS3ObjectWithMeta).not.toHaveBeenCalled();
  });

  it("rejects a malformed bearer token with 401", async () => {
    const res = await handle(makeEvent({ headers: { authorization: "Bearer not-base64-json" } }), {});
    expect(res.statusCode).toBe(401);
  });

  it("rejects a signature from a wallet that is not the owner", async () => {
    const res = await handle(makeEvent({ headers: { authorization: await bearer(other) } }), {});
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toBe("Address mismatch");
  });

  it("rejects a stale token, so a captured one cannot be replayed", async () => {
    const tenMinutesAgo = Math.floor(Date.now() / 1000) - 600;
    const res = await handle(makeEvent({ headers: { authorization: await bearer(owner, tenMinutesAgo) } }), {});
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toBe("Token expired");
  });

  it("rejects a message that is not an analytics-api challenge", async () => {
    const message = `growth-api:${Math.floor(Date.now() / 1000)}`;
    const signature = await owner.signMessage({ message });
    const token = Buffer.from(JSON.stringify({ address: owner.address, signature, message })).toString("base64");

    const res = await handle(makeEvent({ headers: { authorization: `Bearer ${token}` } }), {});

    expect(res.statusCode).toBe(401);
  });

  it("refuses to serve when no owner address is configured", async () => {
    delete process.env.OWNER_ETH_ADDRESS;
    const res = await handle(makeEvent({ headers: { authorization: await bearer(owner) } }), {});
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toBe("Owner address not configured");
  });

  it("serves the owner a zero-filled default window", async () => {
    const res = await handle(makeEvent({ headers: { authorization: await bearer(owner) } }), {});

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as StatsResponse;
    expect(body.site).toBe(SITE);
    expect(body.days).toHaveLength(30);
    expect(body.totalHits).toBe(0);
  });

  it("clamps the requested range", async () => {
    const auth = await bearer(owner);

    const tooLong = JSON.parse(
      (await handle(makeEvent({ headers: { authorization: auth }, queryStringParameters: { days: "5000" } }), {})).body,
    ) as StatsResponse;
    const tooShort = JSON.parse(
      (await handle(makeEvent({ headers: { authorization: auth }, queryStringParameters: { days: "-3" } }), {})).body,
    ) as StatsResponse;
    const garbage = JSON.parse(
      (await handle(makeEvent({ headers: { authorization: auth }, queryStringParameters: { days: "abc" } }), {})).body,
    ) as StatsResponse;

    expect(tooLong.days).toHaveLength(90);
    expect(tooShort.days).toHaveLength(1);
    expect(garbage.days).toHaveLength(30);
  });

  it("returns 500 without leaking the underlying error", async () => {
    mockGetS3ObjectWithMeta.mockRejectedValue(new Error("S3 exploded"));

    const res = await handle(makeEvent({ headers: { authorization: await bearer(owner) } }), {});

    expect(res.statusCode).toBe(500);
    expect(res.body).not.toContain("S3 exploded");
  });
});
