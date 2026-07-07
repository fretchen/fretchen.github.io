/**
 * Minimal AWS Signature Version 4 (SigV4) signing primitives.
 *
 * Scoped deliberately: this is not a general-purpose AWS signer. It only
 * implements what's needed to sign a GET/PUT request against a fixed
 * S3-compatible endpoint with static credentials. See shared/s3-utils/README.md
 * for why this exists instead of a third-party dependency.
 *
 * Algorithm reference: https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html
 */
import { createHash, createHmac } from "node:crypto";

const ALGORITHM = "AWS4-HMAC-SHA256";

export function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

/**
 * URI-encode a single path segment per the SigV4 spec: encode every byte
 * except unreserved characters (A-Z a-z 0-9 - _ . ~). `encodeURIComponent`
 * already does this except it leaves `! * ' ( )` unescaped, so those are
 * additionally escaped here.
 */
export function uriEncode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!*'()]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

/** Encode an object key as a canonical URI path: "/" is preserved as the segment separator. */
export function encodeCanonicalUri(key: string): string {
  return "/" + key.split("/").map(uriEncode).join("/");
}

export interface CanonicalRequestInput {
  method: string;
  canonicalUri: string;
  canonicalQueryString: string;
  /** Header name/value pairs, lowercase names + normalized values. Sorted internally by name. */
  headers: [string, string][];
  hashedPayload: string;
}

export function buildCanonicalRequest(input: CanonicalRequestInput): {
  canonicalRequest: string;
  signedHeaders: string;
} {
  const sorted = [...input.headers].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const canonicalHeaders = sorted.map(([name, value]) => `${name}:${value}\n`).join("");
  const signedHeaders = sorted.map(([name]) => name).join(";");
  const canonicalRequest = [
    input.method,
    input.canonicalUri,
    input.canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    input.hashedPayload,
  ].join("\n");
  return { canonicalRequest, signedHeaders };
}

export function buildStringToSign(
  amzDate: string,
  credentialScope: string,
  hashedCanonicalRequest: string
): string {
  return [ALGORITHM, amzDate, credentialScope, hashedCanonicalRequest].join("\n");
}

export function deriveSigningKey(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service: string
): Buffer {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

export function calculateSignature(signingKey: Buffer, stringToSign: string): string {
  return hmac(signingKey, stringToSign).toString("hex");
}

export function buildAuthorizationHeader(
  accessKeyId: string,
  credentialScope: string,
  signedHeaders: string,
  signature: string
): string {
  return `${ALGORITHM} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

/** Format a Date as SigV4's amz-date ("YYYYMMDDTHHMMSSZ") plus its date-only prefix. */
export function formatAmzDate(date: Date): { amzDate: string; dateStamp: string } {
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}
