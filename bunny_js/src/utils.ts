/**
 * The platform-neutral half of scw_js/utils.ts. Ported verbatim because every x402 seller
 * needs the exact same CORS contract — the comments there document why each header is
 * load-bearing (browser preflight for @x402/fetch's paid retry, readable Payment-Response).
 *
 * NOT ported: errorResponse/openAiError and the ScwResponse envelope they return — that is
 * the Scaleway handler shape, and bunny_js's routing layer (routes.ts) builds web-standard
 * Response objects directly instead.
 */

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
 * match what the settlement/402 headers actually emit. Not `*`: that stops working the
 * moment a request goes credentialed.
 */
export const EXPOSED_X402_HEADERS =
  "Payment-Response, X-Payment-Response, Payment-Required, X-Payment";

/**
 * CORS headers shared by the seller's routes (see scw_js/utils.ts for the full rationale).
 *
 * `Allow-Headers` must cover every header @x402/fetch sets on the paid retry REQUEST, or
 * the browser preflight fails. `Expose-Headers` is the other direction — which RESPONSE
 * headers the client may read.
 *
 * Keep this in sync with @x402/fetch; the OPTIONS test enforces it.
 */
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type, PAYMENT-SIGNATURE, X-PAYMENT, Access-Control-Expose-Headers",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Expose-Headers": EXPOSED_X402_HEADERS,
  "Content-Type": "application/json",
};
