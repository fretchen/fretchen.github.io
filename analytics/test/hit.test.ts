import { describe, it, expect, vi, beforeEach } from "vitest";

// ===== Mocks (vi.hoisted ensures these are available when vi.mock factories run) =====

const { mockGetS3ObjectWithMeta, mockPutS3ObjectConditional } = vi.hoisted(() => ({
  mockGetS3ObjectWithMeta: vi.fn(),
  mockPutS3ObjectConditional: vi.fn(),
}));

vi.mock("@fretchen/s3-utils", () => ({
  getS3ObjectWithMeta: mockGetS3ObjectWithMeta,
  putS3ObjectConditional: mockPutS3ObjectConditional,
}));

// ===== Import after mocks =====

import { handle, type ScalewayEvent } from "../hit.js";

// ===== Helpers =====

function makeEvent(overrides: Partial<ScalewayEvent> = {}): ScalewayEvent {
  return {
    httpMethod: "POST",
    body: JSON.stringify({ site: "fretchen.eu", path: "/blog/foo" }),
    ...overrides,
  };
}

// ===== Tests =====

describe("hit handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responds to OPTIONS with CORS headers and no body", async () => {
    const res = await handle(makeEvent({ httpMethod: "OPTIONS", body: undefined }), {});
    expect(res.statusCode).toBe(200);
    expect(res.headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(res.body).toBe("");
    expect(mockGetS3ObjectWithMeta).not.toHaveBeenCalled();
  });

  it("rejects non-POST/OPTIONS methods with 405", async () => {
    const res = await handle(makeEvent({ httpMethod: "GET" }), {});
    expect(res.statusCode).toBe(405);
  });

  it("rejects a missing body with 400", async () => {
    const res = await handle(makeEvent({ body: undefined }), {});
    expect(res.statusCode).toBe(400);
    expect(mockGetS3ObjectWithMeta).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await handle(makeEvent({ body: "{not json" }), {});
    expect(res.statusCode).toBe(400);
  });

  it("rejects a wrong or missing site with 400", async () => {
    const res = await handle(makeEvent({ body: JSON.stringify({ site: "evil.com", path: "/x" }) }), {});
    expect(res.statusCode).toBe(400);
    expect(mockGetS3ObjectWithMeta).not.toHaveBeenCalled();
  });

  it.each([
    ["no leading slash", "blog/foo"],
    ["unsafe characters", "/blog/<script>"],
    ["empty string", ""],
    ["not a string", 123],
  ])("rejects an invalid path (%s) with 400", async (_label, path) => {
    const res = await handle(makeEvent({ body: JSON.stringify({ site: "fretchen.eu", path }) }), {});
    expect(res.statusCode).toBe(400);
    expect(mockGetS3ObjectWithMeta).not.toHaveBeenCalled();
  });

  it("truncates an overlong path to MAX_PATH_LENGTH rather than rejecting it", async () => {
    mockGetS3ObjectWithMeta.mockResolvedValue(null);
    mockPutS3ObjectConditional.mockResolvedValue({ ok: true, etag: '"new-etag"' });

    const overlong = `/${"a".repeat(300)}`;
    const res = await handle(makeEvent({ body: JSON.stringify({ site: "fretchen.eu", path: overlong }) }), {});

    expect(res.statusCode).toBe(204);
    const [, body] = mockPutS3ObjectConditional.mock.calls[0];
    const written = JSON.parse(body) as { pages: Record<string, number> };
    const [storedPath] = Object.keys(written.pages);
    expect(storedPath).toHaveLength(200);
  });

  it("creates a new hour bucket with If-None-Match when none exists", async () => {
    mockGetS3ObjectWithMeta.mockResolvedValue(null);
    mockPutS3ObjectConditional.mockResolvedValue({ ok: true, etag: '"new-etag"' });

    const res = await handle(makeEvent(), {});

    expect(res.statusCode).toBe(204);
    const [key, body, opts] = mockPutS3ObjectConditional.mock.calls[0];
    expect(key).toMatch(/^counts\/fretchen\.eu\/\d{4}-\d{2}-\d{2}T\d{2}\.json$/);
    expect(JSON.parse(body)).toEqual({ hits: 1, pages: { "/blog/foo": 1 } });
    expect(opts.ifNoneMatch).toBe("*");
    expect(opts.ifMatch).toBeUndefined();
  });

  it("increments an existing hour bucket with If-Match on its current etag", async () => {
    mockGetS3ObjectWithMeta.mockResolvedValue({
      body: JSON.stringify({ hits: 5, pages: { "/blog/foo": 2, "/": 3 } }),
      etag: '"etag-1"',
    });
    mockPutS3ObjectConditional.mockResolvedValue({ ok: true, etag: '"etag-2"' });

    const res = await handle(makeEvent(), {});

    expect(res.statusCode).toBe(204);
    const [, body, opts] = mockPutS3ObjectConditional.mock.calls[0];
    expect(JSON.parse(body)).toEqual({ hits: 6, pages: { "/blog/foo": 3, "/": 3 } });
    expect(opts.ifMatch).toBe('"etag-1"');
  });

  it("still increments hits but stops adding new distinct paths once the pages cap is reached", async () => {
    const pages: Record<string, number> = {};
    for (let i = 0; i < 200; i++) {
      pages[`/page-${i}`] = 1;
    }
    mockGetS3ObjectWithMeta.mockResolvedValue({
      body: JSON.stringify({ hits: 200, pages }),
      etag: '"etag-1"',
    });
    mockPutS3ObjectConditional.mockResolvedValue({ ok: true, etag: '"etag-2"' });

    const res = await handle(makeEvent({ body: JSON.stringify({ site: "fretchen.eu", path: "/new-page" }) }), {});

    expect(res.statusCode).toBe(204);
    const [, body] = mockPutS3ObjectConditional.mock.calls[0];
    const written = JSON.parse(body) as { hits: number; pages: Record<string, number> };
    expect(written.hits).toBe(201);
    expect(written.pages["/new-page"]).toBeUndefined();
    expect(Object.keys(written.pages)).toHaveLength(200);
  });

  it("still increments a path already tracked even when the pages cap is reached", async () => {
    const pages: Record<string, number> = { "/blog/foo": 1 };
    for (let i = 0; i < 199; i++) {
      pages[`/page-${i}`] = 1;
    }
    mockGetS3ObjectWithMeta.mockResolvedValue({
      body: JSON.stringify({ hits: 200, pages }),
      etag: '"etag-1"',
    });
    mockPutS3ObjectConditional.mockResolvedValue({ ok: true, etag: '"etag-2"' });

    const res = await handle(makeEvent(), {});

    expect(res.statusCode).toBe(204);
    const [, body] = mockPutS3ObjectConditional.mock.calls[0];
    const written = JSON.parse(body) as { hits: number; pages: Record<string, number> };
    expect(written.pages["/blog/foo"]).toBe(2);
  });

  it("retries from a fresh read on a 412 CAS conflict, then succeeds", async () => {
    mockGetS3ObjectWithMeta
      .mockResolvedValueOnce({ body: JSON.stringify({ hits: 1, pages: {} }), etag: '"stale"' })
      .mockResolvedValueOnce({ body: JSON.stringify({ hits: 2, pages: {} }), etag: '"fresh"' });
    mockPutS3ObjectConditional
      .mockResolvedValueOnce({ ok: false, status: 412 })
      .mockResolvedValueOnce({ ok: true, etag: '"final"' });

    const res = await handle(makeEvent(), {});

    expect(res.statusCode).toBe(204);
    expect(mockGetS3ObjectWithMeta).toHaveBeenCalledTimes(2);
    expect(mockPutS3ObjectConditional).toHaveBeenCalledTimes(2);
    const [, finalBody] = mockPutS3ObjectConditional.mock.calls[1];
    expect(JSON.parse(finalBody)).toEqual({ hits: 3, pages: { "/blog/foo": 1 } });
  });

  it("gives up silently after exceeding max CAS attempts, still returning 204", async () => {
    mockGetS3ObjectWithMeta.mockResolvedValue({ body: JSON.stringify({ hits: 1, pages: {} }), etag: '"e"' });
    mockPutS3ObjectConditional.mockResolvedValue({ ok: false, status: 412 });

    const res = await handle(makeEvent(), {});

    expect(res.statusCode).toBe(204);
    expect(mockGetS3ObjectWithMeta).toHaveBeenCalledTimes(3);
    expect(mockPutS3ObjectConditional).toHaveBeenCalledTimes(3);
  });
});
