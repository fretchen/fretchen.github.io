import { describe, test, expect } from "vitest";
import {
  buildAuthorizationHeader,
  buildCanonicalRequest,
  buildStringToSign,
  calculateSignature,
  deriveSigningKey,
  encodeCanonicalUri,
  sha256Hex,
  uriEncode,
} from "../src/sigv4.js";

// ===== AWS's official SigV4 test suite — "get-vanilla" case =====
// Fetched verbatim from the AWS-published test suite (region us-east-1,
// service "service", used identically across every case in that suite):
// https://docs.aws.amazon.com/general/latest/gr/signature-v4-test-suite.html
// (mirrored at github.com/mongodb/libmongocrypt kms-message/aws-sig-v4-test-suite/get-vanilla)
//
// This is the load-bearing correctness check for writing a signer in-house
// instead of depending on a third-party library: every stage of the pipeline
// (canonical request -> string to sign -> derived key -> signature) is
// checked against AWS's own published expected output, not a self-check.

const ACCESS_KEY_ID = "AKIDEXAMPLE";
const SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY";
const REGION = "us-east-1";
const SERVICE = "service";
const AMZ_DATE = "20150830T123600Z";
const DATE_STAMP = "20150830";

const EXPECTED_CANONICAL_REQUEST = [
  "GET",
  "/",
  "",
  "host:example.amazonaws.com",
  "x-amz-date:20150830T123600Z",
  "",
  "host;x-amz-date",
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
].join("\n");

const EXPECTED_STRING_TO_SIGN = [
  "AWS4-HMAC-SHA256",
  "20150830T123600Z",
  "20150830/us-east-1/service/aws4_request",
  "bb579772317eb040ac9ed261061d46c1f17a8133879d6129b6e1c25292927e63",
].join("\n");

const EXPECTED_SIGNATURE = "5fa00fa31553b73ebf1942676e86291e8372ff2a2260956d9b8aae1d763fbf31";

const EXPECTED_AUTHORIZATION =
  "AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/service/aws4_request, " +
  "SignedHeaders=host;x-amz-date, Signature=5fa00fa31553b73ebf1942676e86291e8372ff2a2260956d9b8aae1d763fbf31";

describe("SigV4 against AWS's official get-vanilla test vector", () => {
  test("sha256Hex of empty string matches the well-known payload hash", () => {
    expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  test("buildCanonicalRequest matches AWS's published canonical request", () => {
    const payloadHash = sha256Hex("");
    const { canonicalRequest, signedHeaders } = buildCanonicalRequest({
      method: "GET",
      canonicalUri: "/",
      canonicalQueryString: "",
      headers: [
        ["host", "example.amazonaws.com"],
        ["x-amz-date", AMZ_DATE],
      ],
      hashedPayload: payloadHash,
    });
    expect(canonicalRequest).toBe(EXPECTED_CANONICAL_REQUEST);
    expect(signedHeaders).toBe("host;x-amz-date");
  });

  test("buildStringToSign matches AWS's published string to sign", () => {
    const hashedCanonicalRequest = sha256Hex(EXPECTED_CANONICAL_REQUEST);
    const credentialScope = `${DATE_STAMP}/${REGION}/${SERVICE}/aws4_request`;
    const stringToSign = buildStringToSign(AMZ_DATE, credentialScope, hashedCanonicalRequest);
    expect(stringToSign).toBe(EXPECTED_STRING_TO_SIGN);
  });

  test("deriveSigningKey + calculateSignature match AWS's published signature", () => {
    const signingKey = deriveSigningKey(SECRET_ACCESS_KEY, DATE_STAMP, REGION, SERVICE);
    const signature = calculateSignature(signingKey, EXPECTED_STRING_TO_SIGN);
    expect(signature).toBe(EXPECTED_SIGNATURE);
  });

  test("buildAuthorizationHeader matches AWS's published Authorization header", () => {
    const credentialScope = `${DATE_STAMP}/${REGION}/${SERVICE}/aws4_request`;
    const authorization = buildAuthorizationHeader(
      ACCESS_KEY_ID,
      credentialScope,
      "host;x-amz-date",
      EXPECTED_SIGNATURE
    );
    expect(authorization).toBe(EXPECTED_AUTHORIZATION);
  });

  test("end-to-end: canonical request -> string to sign -> signing key -> signature, from raw inputs only", () => {
    // No intermediate expected values reused — this re-derives everything
    // from the same raw inputs AWS published, independent of the step tests above.
    const payloadHash = sha256Hex("");
    const { canonicalRequest, signedHeaders } = buildCanonicalRequest({
      method: "GET",
      canonicalUri: "/",
      canonicalQueryString: "",
      headers: [
        ["host", "example.amazonaws.com"],
        ["x-amz-date", AMZ_DATE],
      ],
      hashedPayload: payloadHash,
    });
    const credentialScope = `${DATE_STAMP}/${REGION}/${SERVICE}/aws4_request`;
    const stringToSign = buildStringToSign(AMZ_DATE, credentialScope, sha256Hex(canonicalRequest));
    const signingKey = deriveSigningKey(SECRET_ACCESS_KEY, DATE_STAMP, REGION, SERVICE);
    const signature = calculateSignature(signingKey, stringToSign);
    const authorization = buildAuthorizationHeader(
      ACCESS_KEY_ID,
      credentialScope,
      signedHeaders,
      signature
    );
    expect(authorization).toBe(EXPECTED_AUTHORIZATION);
  });
});

// ===== Self-consistency properties (no external oracle needed) =====

describe("SigV4 signer — sensitivity and determinism", () => {
  test("changing the secret key changes the derived signing key", () => {
    const keyA = deriveSigningKey(SECRET_ACCESS_KEY, DATE_STAMP, REGION, SERVICE);
    const keyB = deriveSigningKey("different-secret-key", DATE_STAMP, REGION, SERVICE);
    expect(keyA.equals(keyB)).toBe(false);
  });

  test("changing the date changes the derived signing key", () => {
    const keyA = deriveSigningKey(SECRET_ACCESS_KEY, "20150830", REGION, SERVICE);
    const keyB = deriveSigningKey(SECRET_ACCESS_KEY, "20150831", REGION, SERVICE);
    expect(keyA.equals(keyB)).toBe(false);
  });

  test("changing the payload changes the payload hash and thus the canonical request", () => {
    const emptyHash = sha256Hex("");
    const bodyHash = sha256Hex("hello world");
    expect(emptyHash).not.toBe(bodyHash);
  });

  test("signing is deterministic for identical inputs", () => {
    const signingKey = deriveSigningKey(SECRET_ACCESS_KEY, DATE_STAMP, REGION, SERVICE);
    const sigA = calculateSignature(signingKey, EXPECTED_STRING_TO_SIGN);
    const sigB = calculateSignature(signingKey, EXPECTED_STRING_TO_SIGN);
    expect(sigA).toBe(sigB);
  });
});

describe("uriEncode / encodeCanonicalUri", () => {
  test("leaves unreserved characters unescaped", () => {
    expect(uriEncode("abcXYZ012-_.~")).toBe("abcXYZ012-_.~");
  });

  test("escapes characters encodeURIComponent leaves unescaped but SigV4 requires escaped", () => {
    expect(uriEncode("!*'()")).toBe("%21%2A%27%28%29");
  });

  test("preserves '/' as a path separator across segments", () => {
    expect(encodeCanonicalUri("growth-agent/content_queue.json")).toBe(
      "/growth-agent/content_queue.json"
    );
  });

  test("encodes special characters within a single segment", () => {
    expect(encodeCanonicalUri("metadata/file with space.json")).toBe(
      "/metadata/file%20with%20space.json"
    );
  });
});
