/**
 * Storage abstraction for the hit counter: real Scaleway S3 in production,
 * a local file store for dev/sandbox use with no credentials.
 */
import { getS3ObjectWithMeta, putS3ObjectConditional } from "@fretchen/s3-utils";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface GetResult {
  body: string;
  etag: string;
}

export type PutResult = { ok: true; etag: string } | { ok: false; status: 412 };

export interface PutOpts {
  ifMatch?: string;
  ifNoneMatch?: "*";
}

export interface HitStorage {
  getWithMeta(key: string): Promise<GetResult | null>;
  putConditional(key: string, body: string, opts: PutOpts): Promise<PutResult>;
}

/** Production storage: real Scaleway Object Storage via @fretchen/s3-utils. */
export class S3HitStorage implements HitStorage {
  async getWithMeta(key: string): Promise<GetResult | null> {
    return getS3ObjectWithMeta(key);
  }

  async putConditional(key: string, body: string, opts: PutOpts): Promise<PutResult> {
    return putS3ObjectConditional(key, body, { contentType: "application/json", ...opts });
  }
}

/**
 * Local dev/sandbox storage: JSON files under notebooks/state/, sharing the
 * exact directory and key layout analytics/notebooks/storage.py's
 * LocalStorage already reads — so the Python notebook and this server see
 * the same data with zero extra wiring. ETag is an MD5 of the body content,
 * matching how S3's own ETag works for non-multipart objects, so CAS
 * semantics (If-Match / If-None-Match) behave the same as production.
 */
export class FileHitStorage implements HitStorage {
  constructor(private baseDir: string = "notebooks/state") {}

  private pathFor(key: string): string {
    return path.join(this.baseDir, key);
  }

  private etagOf(body: string): string {
    return createHash("md5").update(body).digest("hex");
  }

  async getWithMeta(key: string): Promise<GetResult | null> {
    const filePath = this.pathFor(key);
    if (!existsSync(filePath)) {
      return null;
    }
    const body = await readFile(filePath, "utf8");
    return { body, etag: this.etagOf(body) };
  }

  async putConditional(key: string, body: string, opts: PutOpts): Promise<PutResult> {
    const existing = await this.getWithMeta(key);
    if (opts.ifNoneMatch === "*" && existing) {
      return { ok: false, status: 412 };
    }
    if (opts.ifMatch && (!existing || existing.etag !== opts.ifMatch)) {
      return { ok: false, status: 412 };
    }
    const filePath = this.pathFor(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, body, "utf8");
    return { ok: true, etag: this.etagOf(body) };
  }
}
