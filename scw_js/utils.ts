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
 * CORS headers shared by every x402 function handler (genimg, sc_llm_x402). Must cover
 * every header @x402/fetch sets on the paid retry request, or the browser preflight fails
 * with "... is not allowed by Access-Control-Allow-Headers":
 * - PAYMENT-SIGNATURE: x402 v2 payment header (we negotiate x402Version: 2)
 * - X-PAYMENT: x402 v1 payment header (fallback)
 * - Access-Control-Expose-Headers: set on the request by @x402/fetch (spec-odd but real)
 * Keep this in sync with @x402/fetch; each handler's OPTIONS test enforces it.
 */
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type, PAYMENT-SIGNATURE, X-PAYMENT, Access-Control-Expose-Headers",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
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
 */
export function openAiError(
  statusCode: number,
  message: string,
  type: string,
  code: string | null = null,
): ScwResponse {
  return {
    body: JSON.stringify({ error: { message, type, code } }),
    headers: CORS_HEADERS,
    statusCode,
  };
}
