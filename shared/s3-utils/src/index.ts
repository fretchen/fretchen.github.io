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

const REGION = "nl-ams";
const SERVICE = "s3";
const BUCKET = "my-imagestore";
const HOST = `${BUCKET}.s3.${REGION}.scw.cloud`;

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

  const canonicalUri = encodeCanonicalUri(key);
  const payloadHash = sha256Hex(body ?? "");
  const { amzDate, dateStamp } = formatAmzDate(new Date());

  const normalizedExtra: [string, string][] = Object.entries(extraHeaders).map(([name, value]) => [
    name.toLowerCase(),
    value.trim().replace(/\s+/g, " "),
  ]);

  const headers: [string, string][] = [
    ["host", HOST],
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

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = buildStringToSign(amzDate, credentialScope, sha256Hex(canonicalRequest));
  const signingKey = deriveSigningKey(secretAccessKey, dateStamp, REGION, SERVICE);
  const signature = calculateSignature(signingKey, stringToSign);
  const authorization = buildAuthorizationHeader(
    accessKeyId,
    credentialScope,
    signedHeaders,
    signature
  );

  const requestHeaders: Record<string, string> = Object.fromEntries(headers);
  requestHeaders.authorization = authorization;

  return fetch(`https://${HOST}${canonicalUri}`, {
    method,
    headers: requestHeaders,
    body: body as BodyInit | undefined,
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
  /** Reserved for a future cache-header phase; unused today. */
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
