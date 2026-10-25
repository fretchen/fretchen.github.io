/**
 * Response-conversion helpers shared by every router in this package. The ported x402
 * helpers still speak the {statusCode, headers, body} envelope from scw_js — these convert
 * it to web-standard Responses and harden the two things the edge platform demands.
 */
import type { HttpResponse } from "./x402_server.js";

/**
 * A web-standard Response cannot carry non-latin1 header bytes (the Headers API rejects them
 * as "not a valid ByteString"), and the 402's X-Payment / the 200's X-Payment-Response are
 * raw JSON whose bazaar metadata contains em-dashes, arrows and ellipses. JSON \uXXXX escapes
 * decode to the exact same string, so escaping non-latin1 codepoints keeps the header's
 * meaning identical for any JSON-parsing client — the base64 Payment-Required /
 * Payment-Response headers are ASCII and pass through untouched.
 */
export function byteStringHeaderValue(value: string): string {
  return value.replace(/[\u0100-\uFFFF]/g, (ch) => {
    return `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
}

/**
 * The ported x402 helpers still speak the {statusCode, headers, body} envelope.
 * Cache-Control: no-store is pinned here: the pull zone in front of this script is a real
 * CDN, and a cached paid 200 would replay a purchased result — with its Payment-Response
 * receipt — to the next caller. (The platform normalizes no-store to no-cache, which is
 * equally safe: no validators on these responses, so every hit revalidates at origin.)
 */
export function toResponse(http: HttpResponse): Response {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(http.headers)) {
    headers[key] = byteStringHeaderValue(value);
  }
  headers["Cache-Control"] ??= "no-store";
  return new Response(http.body, { status: http.statusCode, headers });
}
