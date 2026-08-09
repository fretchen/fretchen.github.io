/**
 * Anonymous pageview hit counter — one JSON object per site per UTC hour,
 * incremented via a conditional-write compare-and-swap loop against S3.
 */
import { getS3ObjectWithMeta, putS3ObjectConditional } from "@fretchen/s3-utils";

export interface ScalewayEvent {
  httpMethod: string;
  headers?: Record<string, string>;
  body?: string | Record<string, unknown>;
}

export interface HandlerResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const ALLOWED_SITE = "fretchen.eu";
const MAX_PATH_LENGTH = 200;
const MAX_PAGES_PER_BUCKET = 200; // caps distinct paths tracked per hour bucket
const MAX_CAS_ATTEMPTS = 3;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

interface HourBucket {
  hits: number;
  pages: Record<string, number>;
}

function sanitizePath(path: unknown): string | null {
  if (typeof path !== "string") {
    return null;
  }
  const clean = path
    .replace(/\p{Cc}/gu, "")
    .trim()
    .slice(0, MAX_PATH_LENGTH);
  if (!clean || !/^\/[\w/.\-~%]*$/.test(clean)) {
    return null;
  }
  return clean;
}

function hourKey(site: string, now: Date = new Date()): string {
  return `counts/${site}/${now.toISOString().slice(0, 13)}.json`; // UTC hour, e.g. 2026-08-09T17
}

/**
 * Increments hits/pages for the current hour bucket. Retries from a fresh
 * read on a CAS conflict; after MAX_CAS_ATTEMPTS gives up silently — a lost
 * count is fine, never worth failing the request over.
 */
async function incrementHit(site: string, path: string): Promise<void> {
  const key = hourKey(site);

  for (let attempt = 1; attempt <= MAX_CAS_ATTEMPTS; attempt++) {
    const existing = await getS3ObjectWithMeta(key);
    const bucket: HourBucket = existing ? (JSON.parse(existing.body) as HourBucket) : { hits: 0, pages: {} };

    bucket.hits += 1;
    if (bucket.pages[path] !== undefined || Object.keys(bucket.pages).length < MAX_PAGES_PER_BUCKET) {
      bucket.pages[path] = (bucket.pages[path] ?? 0) + 1;
    }

    const result = await putS3ObjectConditional(key, JSON.stringify(bucket), {
      contentType: "application/json",
      ...(existing ? { ifMatch: existing.etag } : { ifNoneMatch: "*" }),
    });
    if (result.ok) {
      return;
    }
    // 412: another writer won the race — retry from a fresh read.
  }
}

export async function handle(event: ScalewayEvent, _context: unknown): Promise<HandlerResponse> {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Missing request body" }),
    };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = typeof event.body === "string" ? (JSON.parse(event.body) as Record<string, unknown>) : event.body;
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }

  const path = sanitizePath(parsed.path);
  if (parsed.site !== ALLOWED_SITE || !path) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Missing or invalid site/path" }),
    };
  }

  await incrementHit(ALLOWED_SITE, path);

  return { statusCode: 204, headers: CORS_HEADERS, body: "" };
}
