import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockGetS3ObjectWithMeta, mockPutS3ObjectConditional } = vi.hoisted(() => ({
  mockGetS3ObjectWithMeta: vi.fn(),
  mockPutS3ObjectConditional: vi.fn(),
}));

vi.mock("@fretchen/s3-utils", () => ({
  getS3ObjectWithMeta: mockGetS3ObjectWithMeta,
  putS3ObjectConditional: mockPutS3ObjectConditional,
}));

import { handle, type AnalyticsEvent } from "../analytics.js";

const OWNER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

function makeEvent(overrides: Partial<AnalyticsEvent> = {}): AnalyticsEvent {
  return { httpMethod: "GET", ...overrides };
}

describe("analytics router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetS3ObjectWithMeta.mockResolvedValue(null);
    mockPutS3ObjectConditional.mockResolvedValue({ ok: true, etag: '"e"' });
    process.env.OWNER_ETH_ADDRESS = OWNER;
  });

  afterEach(() => {
    delete process.env.OWNER_ETH_ADDRESS;
  });

  it("routes POST /hit to the counter", async () => {
    const res = await handle(
      makeEvent({
        httpMethod: "POST",
        path: "/hit",
        body: JSON.stringify({ site: "fretchen.eu", path: "/blog/" }),
      }),
      {},
    );

    expect(res.statusCode).toBe(204);
    expect(mockPutS3ObjectConditional).toHaveBeenCalled();
  });

  it("routes GET /stats to the readout, which demands a token", async () => {
    const res = await handle(makeEvent({ path: "/stats" }), {});

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toMatch(/Authorization/i);
  });

  it("tolerates trailing and duplicated slashes", async () => {
    for (const path of ["/hit/", "//hit", "/hit//"]) {
      const res = await handle(
        makeEvent({ httpMethod: "POST", path, body: JSON.stringify({ site: "fretchen.eu", path: "/blog/" }) }),
        {},
      );
      expect(res.statusCode, path).toBe(204);
    }
  });

  it("404s anything that is not a known route", async () => {
    for (const path of ["", "/", "/unknown", "/hits", "/stat", "/hit/extra", "/api/hit"]) {
      const res = await handle(makeEvent({ path }), {});
      expect(res.statusCode, path).toBe(404);
    }
  });

  it("echoes a whitelisted dev origin on a 404, instead of always the production origin", async () => {
    const res = await handle(makeEvent({ path: "/unknown", headers: { origin: "http://localhost:3000" } }), {});
    expect(res.statusCode).toBe(404);
    expect(res.headers["Access-Control-Allow-Origin"]).toBe("http://localhost:3000");
  });

  it("falls back to the production origin on a 404 from an unknown origin", async () => {
    const res = await handle(makeEvent({ path: "/unknown", headers: { origin: "https://evil.com" } }), {});
    expect(res.headers["Access-Control-Allow-Origin"]).toBe("https://www.fretchen.eu");
  });

  // Scaleway passes the query separately, but a proxy that folds it into `path`
  // must not change which route matches.
  it("ignores a query string when matching", async () => {
    const res = await handle(makeEvent({ path: "/stats?days=7" }), {});
    expect(res.statusCode).toBe(401); // reached /stats, then failed auth
  });

  // The reason this router matches exactly instead of using path.includes():
  // /hit is an anonymous write sitting next to an owner-gated read, so no
  // URL shape may reach /stats handling without passing its auth check, and
  // none may reach /hit's unauthenticated write while looking like /stats.
  it("never serves stats data without a token, whatever the path is spelled like", async () => {
    const spellings = [
      "/stats",
      "/stats/",
      "//stats",
      "/stats?days=7",
      "/hit/../stats",
      "/STATS",
      "/stats/../hit",
      "/hit/stats",
      "/stats/extra",
    ];

    for (const path of spellings) {
      const res = await handle(makeEvent({ path }), {});
      expect([401, 404, 405], `${path} -> ${res.statusCode}`).toContain(res.statusCode);
      expect(res.body, path).not.toMatch(/"days"/);
    }
  });

  it("does not let a stats-shaped path reach the unauthenticated write", async () => {
    const res = await handle(
      makeEvent({
        httpMethod: "POST",
        path: "/stats/hit",
        body: JSON.stringify({ site: "fretchen.eu", path: "/blog/" }),
      }),
      {},
    );

    expect(res.statusCode).toBe(404);
    expect(mockPutS3ObjectConditional).not.toHaveBeenCalled();
  });

  it("passes OPTIONS through to the matched handler's CORS block", async () => {
    const hit = await handle(makeEvent({ httpMethod: "OPTIONS", path: "/hit" }), {});
    const stats = await handle(makeEvent({ httpMethod: "OPTIONS", path: "/stats" }), {});

    expect(hit.statusCode).toBe(200);
    expect(hit.headers["Access-Control-Allow-Methods"]).toContain("POST");
    expect(stats.statusCode).toBe(200);
    expect(stats.headers["Access-Control-Allow-Headers"]).toContain("Authorization");
  });

  it("rejects the wrong method on a known route", async () => {
    expect((await handle(makeEvent({ httpMethod: "GET", path: "/hit" }), {})).statusCode).toBe(405);
    expect((await handle(makeEvent({ httpMethod: "POST", path: "/stats" }), {})).statusCode).toBe(405);
  });
});
