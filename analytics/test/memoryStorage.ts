import { createHash } from "node:crypto";
import type { GetResult, HitStorage, PutOpts, PutResult } from "../storage.js";

/**
 * In-memory `HitStorage` for the read-layer tests. Same MD5 ETag and
 * compare-and-swap semantics as `FileHitStorage`, so `writeDay`'s CAS loop is
 * exercised for real rather than against a mock that always succeeds.
 */
export class MemoryHitStorage implements HitStorage {
  readonly objects = new Map<string, string>();
  /** Every key read, in order — lets tests assert how much work a call did. */
  readonly gets: string[] = [];
  /** Forces the next N `putConditional` calls to report a 412, to drive the retry path. */
  failNextPuts = 0;
  /** Makes every `putConditional` throw, to prove a failed cache warm can't fail a read. */
  throwOnPut = false;

  constructor(seed: Record<string, unknown> = {}) {
    for (const [key, value] of Object.entries(seed)) {
      this.objects.set(key, JSON.stringify(value));
    }
  }

  private etagOf(body: string): string {
    return createHash("md5").update(body).digest("hex");
  }

  async getWithMeta(key: string): Promise<GetResult | null> {
    this.gets.push(key);
    const body = this.objects.get(key);
    return body === undefined ? null : { body, etag: this.etagOf(body) };
  }

  async putConditional(key: string, body: string, opts: PutOpts): Promise<PutResult> {
    if (this.throwOnPut) {
      throw new Error("S3 write failed");
    }
    if (this.failNextPuts > 0) {
      this.failNextPuts -= 1;
      return { ok: false, status: 412 };
    }
    const existing = this.objects.get(key);
    if (opts.ifNoneMatch === "*" && existing !== undefined) {
      return { ok: false, status: 412 };
    }
    if (opts.ifMatch && (existing === undefined || this.etagOf(existing) !== opts.ifMatch)) {
      return { ok: false, status: 412 };
    }
    this.objects.set(key, body);
    return { ok: true, etag: this.etagOf(body) };
  }

  read<T>(key: string): T | null {
    const body = this.objects.get(key);
    return body === undefined ? null : (JSON.parse(body) as T);
  }
}

/** Seeds one hour bucket, in the layout `hit.ts` writes. */
export function hourBucket(hits: number, pages: Record<string, number>, landings = 0) {
  return { hits, landings, pages };
}
