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

async function signedFetch(
  method: "GET" | "PUT",
  key: string,
  body: string | Uint8Array | undefined,
  extraHeaders: Record<string, string>
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
      canonicalQueryString: "",
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

    return fetch(`https://${host}${canonicalUri}`, {
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
