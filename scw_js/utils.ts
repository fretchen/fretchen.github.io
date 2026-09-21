export function parseJsonBody(raw: unknown): Record<string, unknown> | null {
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

interface ScwResponse {
  body: string;
  statusCode: number;
  headers: Record<string, string>;
  isBase64Encoded?: boolean;
}

/**
 * x402 response headers a browser client must be able to READ.
 *
 * Only CORS-safelisted response headers are readable cross-origin; everything else needs
 * naming here or `response.headers.get(...)` just returns null, with no error anywhere.
 * `Payment-Response` was the one that mattered and the one that was missing: the client
 * SDK updates its cached channel balance from it, so without it every browser buyer's
 * record went stale, the client believed its channel was unfunded, and it signed a fresh
 * $0.50 deposit per message. Node buyers (the notebooks) were unaffected — CORS does not
 * apply there — which is why this validated cleanly off-browser for months.
 *
 * Header-name matching here is case-insensitive, so one spelling per name is enough; these
 * match what `createSettlementHeaders`/`create402Response` actually emit. Not `*`: that
 * stops working the moment a request goes credentialed.
 */
export const EXPOSED_X402_HEADERS =
  "Payment-Response, X-Payment-Response, Payment-Required, X-Payment";

/**
 * CORS headers shared by every x402 function handler (genimg, sc_llm_x402).
 *
 * `Allow-Headers` must cover every header @x402/fetch sets on the paid retry REQUEST, or the
 * browser preflight fails with "... is not allowed by Access-Control-Allow-Headers":
 * - PAYMENT-SIGNATURE: x402 v2 payment header (we negotiate x402Version: 2)
 * - X-PAYMENT: x402 v1 payment header (fallback)
 * - Access-Control-Expose-Headers: set on the request by @x402/fetch (spec-odd but real)
 *
 * `Expose-Headers` is the other direction — which RESPONSE headers the client may read. The
 * two are unrelated despite the shared name above, and conflating them is what left
 * `Payment-Response` unreadable; see EXPOSED_X402_HEADERS.
 *
 * Keep this in sync with @x402/fetch; each handler's OPTIONS test enforces it.
 */
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type, PAYMENT-SIGNATURE, X-PAYMENT, Access-Control-Expose-Headers",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Expose-Headers": EXPOSED_X402_HEADERS,
  "Content-Type": "application/json",
};

export function errorResponse(statusCode: number, error: string): ScwResponse {
  return { body: JSON.stringify({ error }), headers: CORS_HEADERS, statusCode };
}

/**
 * OpenAI-shaped error body ({ error: { message, type, code } }) for request/model validation
 * failures, so callers reusing OpenAI response types parse our errors too. Payment (402) and
 * internal (500) errors keep the plain x402-style `errorResponse` above — those are not part
 * of the OpenAI request contract.
 *
 * `param` names the offending request field, as OpenAI's own errors do. It is omitted from the
 * body entirely when not supplied, so callers that never pass it (sc_llm_x402) keep their exact
 * previous shape.
 */
export function openAiError(
  statusCode: number,
  message: string,
  type: string,
  code: string | null = null,
  param?: string,
): ScwResponse {
  return {
    body: JSON.stringify({ error: { message, type, code, ...(param && { param }) } }),
    headers: CORS_HEADERS,
    statusCode,
  };
}
