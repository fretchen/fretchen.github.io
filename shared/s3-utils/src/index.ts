/**
 * @fretchen/s3-utils
 *
 * SigV4-signed GET/PUT client for the fretchen.github.io Scaleway Object
 * Storage bucket. Deliberately not a generic S3 client — bucket and region
 * are fixed, matching every current call site across this monorepo.
 */
import {
  buildAuthorizationHeader,
  buildCanonicalRequest,
  buildStringToSign,
  calculateSignature,
  deriveSigningKey,
  encodeCanonicalUri,
  formatAmzDate,
  sha256Hex,
  uriEncode,
} from "./sigv4.js";

const SERVICE = "s3";
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 200;

function getS3Config(): { bucket: string; region: string } {
  return {
    bucket: process.env.SCW_S3_BUCKET ?? "my-imagestore",
    region: process.env.SCW_S3_REGION ?? "nl-ams",
  };
}

/** The public base URL for objects in this bucket, e.g. for building a returned object's public link. */
export function getS3BaseUrl(): string {
  const { bucket, region } = getS3Config();
  return `https://${bucket}.s3.${region}.scw.cloud/`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries a single signed-request attempt on transient failures: a thrown network
 * error, or a 5xx response. Does not retry 4xx — those are deterministic (bad
 * signature, missing key) and retrying would only mask a real problem. Each retry
 * calls `attempt` again from scratch, so requests are re-signed with a fresh
 * timestamp rather than replayed.
 */
async function fetchWithRetry(
  attempt: () => Promise<Response>,
  maxAttempts = MAX_ATTEMPTS
): Promise<Response> {
  let lastError: unknown;
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const res = await attempt();
      if (res.status >= 500 && i < maxAttempts) {
        lastError = new Error(`S3 request failed: ${res.status} ${res.statusText}`);
        await sleep(RETRY_BASE_DELAY_MS * 2 ** (i - 1));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (i < maxAttempts) {
        await sleep(RETRY_BASE_DELAY_MS * 2 ** (i - 1));
        continue;
      }
    }
  }
  throw lastError;
}

/**
 * Builds a SigV4 canonical query string: sorted by key, each key/value
 * URI-encoded per the spec. Used only by `listObjects` (a query on the bucket
 * root); GET/PUT/DELETE on an object key never carry a query string.
 */
function buildCanonicalQueryString(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((k) => `${uriEncode(k)}=${uriEncode(params[k])}`)
    .join("&");
}

async function signedFetch(
  method: "GET" | "PUT" | "DELETE",
  key: string,
  body: string | Uint8Array | undefined,
  extraHeaders: Record<string, string>,
  query: Record<string, string> = {}
): Promise<Response> {
  const accessKeyId = process.env.SCW_ACCESS_KEY;
  const secretAccessKey = process.env.SCW_SECRET_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Missing S3 credentials: SCW_ACCESS_KEY and SCW_SECRET_KEY must be set");
  }
  const { bucket, region } = getS3Config();
  const host = `${bucket}.s3.${region}.scw.cloud`;

  return fetchWithRetry(() => {
    const canonicalUri = encodeCanonicalUri(key);
    const canonicalQueryString = buildCanonicalQueryString(query);
    const payloadHash = sha256Hex(body ?? "");
    const { amzDate, dateStamp } = formatAmzDate(new Date());

    const normalizedExtra: [string, string][] = Object.entries(extraHeaders).map(
      ([name, value]) => [name.toLowerCase(), value.trim().replace(/\s+/g, " ")]
    );

    const headers: [string, string][] = [
      ["host", host],
      ["x-amz-content-sha256", payloadHash],
      ["x-amz-date", amzDate],
      ...normalizedExtra,
    ];

    const { canonicalRequest, signedHeaders } = buildCanonicalRequest({
      method,
      canonicalUri,
      canonicalQueryString,
      headers,
      hashedPayload: payloadHash,
    });

    const credentialScope = `${dateStamp}/${region}/${SERVICE}/aws4_request`;
    const stringToSign = buildStringToSign(amzDate, credentialScope, sha256Hex(canonicalRequest));
    const signingKey = deriveSigningKey(secretAccessKey, dateStamp, region, SERVICE);
    const signature = calculateSignature(signingKey, stringToSign);
    const authorization = buildAuthorizationHeader(
      accessKeyId,
      credentialScope,
      signedHeaders,
      signature
    );

    const requestHeaders: Record<string, string> = Object.fromEntries(headers);
    requestHeaders.authorization = authorization;

    const url = canonicalQueryString
      ? `https://${host}${canonicalUri}?${canonicalQueryString}`
      : `https://${host}${canonicalUri}`;

    return fetch(url, {
      method,
      headers: requestHeaders,
      body: body as BodyInit | undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  });
}

/**
 * GET an object. Returns null on 404 (NoSuchKey equivalent). Throws on any
 * other non-2xx status or network failure.
 */
export async function getS3Object(key: string): Promise<string | null> {
  const res = await signedFetch("GET", key, undefined, {});
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`S3 GetObject failed for ${key}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

export interface GetS3ObjectMetaResult {
  body: string;
  etag: string;
}

/**
 * GET an object along with its ETag, for callers implementing an
 * optimistic-concurrency read-modify-write loop (see `putS3ObjectConditional`).
 * Returns null on 404. Throws on any other non-2xx status or network failure.
 */
export async function getS3ObjectWithMeta(key: string): Promise<GetS3ObjectMetaResult | null> {
  const res = await signedFetch("GET", key, undefined, {});
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`S3 GetObject failed for ${key}: ${res.status} ${res.statusText}`);
  }
  const body = await res.text();
  const etag = res.headers.get("etag");
  if (!etag) {
    // A successful GET of an existing object must carry an ETag; without one the
    // caller's CAS loop would silently degrade to an unconditional write (the
    // `ifMatch` truthy guards in putS3ObjectConditional/deleteS3Object drop an empty
    // string), defeating the compare-and-swap guarantee. Fail loud instead.
    throw new Error(`S3 GetObject for ${key} returned no ETag; cannot honor compare-and-swap`);
  }
  return { body, etag };
}

export interface PutS3ObjectOptions {
  contentType: string;
  acl?: "public-read";
  cacheControl?: string;
}

/** PUT an object. Throws on any non-2xx status or network failure. */
export async function putS3Object(
  key: string,
  body: string | Uint8Array,
  opts: PutS3ObjectOptions
): Promise<void> {
  const extraHeaders: Record<string, string> = { "content-type": opts.contentType };
  if (opts.acl) extraHeaders["x-amz-acl"] = opts.acl;
  if (opts.cacheControl) extraHeaders["cache-control"] = opts.cacheControl;

  const res = await signedFetch("PUT", key, body, extraHeaders);
  if (!res.ok) {
    throw new Error(`S3 PutObject failed for ${key}: ${res.status} ${res.statusText}`);
  }
}

export interface PutS3ObjectConditionalOptions extends PutS3ObjectOptions {
  /** Require the object's current ETag to match (compare-and-swap on an existing object). */
  ifMatch?: string;
  /** Require the object to not already exist. Only `"*"` is meaningful per the S3 spec. */
  ifNoneMatch?: "*";
}

export type PutS3ObjectConditionalResult = { ok: true; etag: string } | { ok: false; status: 412 };

/**
 * Conditional PUT for optimistic-concurrency callers (e.g. a `ChannelStorage`
 * CAS loop): pass `ifMatch` to update only if the object is unchanged since a
 * prior `getS3ObjectWithMeta`, or `ifNoneMatch: "*"` to create only if absent.
 * On a precondition mismatch, returns `{ ok: false, status: 412 }` instead of
 * throwing — the caller re-reads and retries. Any other non-2xx still throws.
 */
export async function putS3ObjectConditional(
  key: string,
  body: string | Uint8Array,
  opts: PutS3ObjectConditionalOptions
): Promise<PutS3ObjectConditionalResult> {
  const extraHeaders: Record<string, string> = { "content-type": opts.contentType };
  if (opts.acl) extraHeaders["x-amz-acl"] = opts.acl;
  if (opts.cacheControl) extraHeaders["cache-control"] = opts.cacheControl;
  if (opts.ifMatch) extraHeaders["if-match"] = opts.ifMatch;
  if (opts.ifNoneMatch) extraHeaders["if-none-match"] = opts.ifNoneMatch;

  const res = await signedFetch("PUT", key, body, extraHeaders);
  if (res.status === 412) return { ok: false, status: 412 };
  if (!res.ok) {
    throw new Error(
      `S3 PutObject (conditional) failed for ${key}: ${res.status} ${res.statusText}`
    );
  }
  return { ok: true, etag: res.headers.get("etag") ?? "" };
}

export interface DeleteS3ObjectOptions {
  /** Require the object's current ETag to match before deleting. */
  ifMatch?: string;
}

export type DeleteS3ObjectResult = { ok: true } | { ok: false; status: 412 };

/**
 * DELETE an object. A missing object (404) is treated as success (the end
 * state — "not present" — is already achieved). With `ifMatch` set, a stale
 * ETag returns `{ ok: false, status: 412 }` instead of throwing.
 */
export async function deleteS3Object(
  key: string,
  opts: DeleteS3ObjectOptions = {}
): Promise<DeleteS3ObjectResult> {
  const extraHeaders: Record<string, string> = {};
  if (opts.ifMatch) extraHeaders["if-match"] = opts.ifMatch;

  const res = await signedFetch("DELETE", key, undefined, extraHeaders);
  if (res.status === 412) return { ok: false, status: 412 };
  if (!res.ok && res.status !== 404) {
    throw new Error(`S3 DeleteObject failed for ${key}: ${res.status} ${res.statusText}`);
  }
  return { ok: true };
}

/**
 * Lists object keys under a prefix (S3 `ListObjectsV2`, one unpaginated page —
 * fine at the modest object counts this monorepo's callers deal with; a
 * caller needing more than 1000 keys under one prefix should paginate via
 * `continuation-token`, not something any current caller needs).
 */
export async function listObjects(prefix: string): Promise<string[]> {
  const res = await signedFetch("GET", "", undefined, {}, { "list-type": "2", prefix });
  if (!res.ok) {
    throw new Error(
      `S3 ListObjectsV2 failed for prefix ${prefix}: ${res.status} ${res.statusText}`
    );
  }
  const xml = await res.text();
  const keys: string[] = [];
  const keyTagPattern = /<Key>([^<]*)<\/Key>/g;
  for (const match of xml.matchAll(keyTagPattern)) {
    keys.push(decodeXmlEntities(match[1]));
  }
  return keys;
}

/** Decodes the small set of XML entities S3 actually emits in `<Key>` text content. */
function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
