import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { FileHitStorage } from "../storage.js";

function md5(body: string): string {
  return createHash("md5").update(body).digest("hex");
}

describe("FileHitStorage", () => {
  let baseDir: string;
  let storage: FileHitStorage;

  beforeEach(async () => {
    baseDir = await mkdtemp(path.join(tmpdir(), "hit-storage-test-"));
    storage = new FileHitStorage(baseDir);
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it("returns null for a missing key", async () => {
    const result = await storage.getWithMeta("counts/fretchen.eu/2026-08-10T00.json");
    expect(result).toBeNull();
  });

  it("creates a new object with no ifNoneMatch guard needed on an empty store", async () => {
    const body = JSON.stringify({ hits: 1, pages: { "/a": 1 } });
    const result = await storage.putConditional("counts/fretchen.eu/2026-08-10T00.json", body, {});
    expect(result).toEqual({ ok: true, etag: md5(body) });
  });

  it("ifNoneMatch: '*' fails when the object already exists", async () => {
    const key = "counts/fretchen.eu/2026-08-10T00.json";
    await storage.putConditional(key, JSON.stringify({ hits: 1, pages: {} }), {});

    const result = await storage.putConditional(key, JSON.stringify({ hits: 2, pages: {} }), {
      ifNoneMatch: "*",
    });

    expect(result).toEqual({ ok: false, status: 412 });
    const onDisk = await readFile(path.join(baseDir, key), "utf8");
    expect(JSON.parse(onDisk)).toEqual({ hits: 1, pages: {} });
  });

  it("ifMatch with a stale etag fails and leaves the file unchanged", async () => {
    const key = "counts/fretchen.eu/2026-08-10T00.json";
    await storage.putConditional(key, JSON.stringify({ hits: 1, pages: {} }), {});

    const result = await storage.putConditional(key, JSON.stringify({ hits: 2, pages: {} }), {
      ifMatch: "not-the-real-etag",
    });

    expect(result).toEqual({ ok: false, status: 412 });
    const onDisk = await readFile(path.join(baseDir, key), "utf8");
    expect(JSON.parse(onDisk)).toEqual({ hits: 1, pages: {} });
  });

  it("ifMatch with the current etag succeeds and updates the file", async () => {
    const key = "counts/fretchen.eu/2026-08-10T00.json";
    const first = await storage.putConditional(key, JSON.stringify({ hits: 1, pages: {} }), {});
    expect(first.ok).toBe(true);
    const etag = (first as { ok: true; etag: string }).etag;

    const newBody = JSON.stringify({ hits: 2, pages: { "/a": 1 } });
    const result = await storage.putConditional(key, newBody, { ifMatch: etag });

    expect(result).toEqual({ ok: true, etag: md5(newBody) });
    const onDisk = await readFile(path.join(baseDir, key), "utf8");
    expect(onDisk).toBe(newBody);
  });

  it("round-trips: getWithMeta after putConditional returns the same body and etag", async () => {
    const key = "counts/fretchen.eu/2026-08-10T00.json";
    const body = JSON.stringify({ hits: 3, pages: { "/x": 3 } });
    const putResult = await storage.putConditional(key, body, {});

    const getResult = await storage.getWithMeta(key);

    expect(getResult).toEqual({ body, etag: (putResult as { ok: true; etag: string }).etag });
  });
});
