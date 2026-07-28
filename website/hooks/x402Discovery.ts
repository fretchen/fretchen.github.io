/**
 * x402 / llm/v1 discovery utilities.
 *
 * Shared helpers for reading an llm/v1 agent's published contract (`/openapi.json`) and its
 * live `402` payment requirements, so the frontend can (a) show provenance before paying and
 * (b) pre-check a pasted custom agent before enabling the chat box. See the open-agent-platform
 * design in `open_agent_platform_plan.md` and the contract in `scw_js/README.md` / `openapi.llm.json`.
 */

/** A single entry of the x402 402-response `accepts[]` array (the fields we read). */
export interface AcceptsEntry {
  scheme?: string;
  network?: string;
  amount?: string;
  asset?: string;
  payTo?: string;
  extra?: { name?: string; version?: string };
}

/** The `llm/v1` interop floor: the scheme/network a client here must be able to fulfil. */
export const LLM_V1_FLOOR = {
  network: "eip155:8453", // Base mainnet
  scheme: "batch-settlement",
} as const;

/**
 * Decode the base64 `Payment-Required` header of a 402 response into its `accepts[]` array.
 * Returns `null` if the header is absent or unparseable (callers treat that as "unknown").
 */
export function decodePaymentRequired(headerValue: string | null): AcceptsEntry[] | null {
  if (!headerValue) return null;
  try {
    const decoded = JSON.parse(atob(headerValue)) as { accepts?: AcceptsEntry[] };
    return decoded.accepts ?? null;
  } catch {
    return null;
  }
}

/** True if any `accepts[]` entry satisfies the llm/v1 interop floor (Base + batch-settlement). */
export function meetsLlmV1Floor(accepts: AcceptsEntry[] | null): boolean {
  if (!accepts) return false;
  return accepts.some((a) => a.network === LLM_V1_FLOOR.network && a.scheme === LLM_V1_FLOOR.scheme);
}

/** Normalise an agent URL to its origin (scheme + host, no path/trailing slash). */
export function agentOrigin(agentUrl: string): string {
  return new URL(agentUrl).origin;
}

/** Provenance derived from an agent's OpenAPI doc + live 402, for pre-payment disclosure. */
export interface AgentCard {
  origin: string;
  title: string | null;
  operator: string | null;
  contactUrl: string | null;
  /** The receiving address from the floor-matching accepts[] entry, if seen. */
  payTo: string | null;
  /** Price in USDC atomic units (6 decimals) from x-payment-info, best-effort. */
  network: string | null;
}

export interface PreCheckResult {
  ok: boolean;
  reason?: string;
  card?: AgentCard;
}

interface OpenApiDoc {
  "x-service-type"?: string;
  info?: { title?: string; contact?: { name?: string; url?: string } };
}

/**
 * Liveness + contract pre-check for a (possibly third-party) llm/v1 agent URL:
 *   1. fetch `<origin>/openapi.json`, require `x-service-type === "llm/v1"`;
 *   2. send a bare POST and require a 402 whose accepts[] meets the interop floor.
 * On success, returns the provenance card for disclosure. Never throws — failures come back
 * as `{ ok: false, reason }` so the caller can show a clear message and keep the box disabled.
 */
export async function precheckLlmV1Agent(agentUrl: string): Promise<PreCheckResult> {
  let origin: string;
  try {
    origin = agentOrigin(agentUrl);
  } catch {
    return { ok: false, reason: "That does not look like a valid URL." };
  }

  // 1. Contract doc.
  let doc: OpenApiDoc;
  try {
    const res = await fetch(`${origin}/openapi.json`, { method: "GET" });
    if (!res.ok) return { ok: false, reason: `No OpenAPI document at ${origin}/openapi.json (${res.status}).` };
    doc = (await res.json()) as OpenApiDoc;
  } catch {
    return { ok: false, reason: `Could not fetch ${origin}/openapi.json.` };
  }
  if (doc["x-service-type"] !== "llm/v1") {
    return { ok: false, reason: `${origin} is not an llm/v1 agent (missing x-service-type: "llm/v1").` };
  }

  // 2. Live 402 meeting the interop floor.
  let accepts: AcceptsEntry[] | null;
  try {
    const res = await fetch(agentUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { prompt: [] } }),
    });
    if (res.status !== 402) {
      return { ok: false, reason: `Expected a 402 payment challenge, got ${res.status}.` };
    }
    accepts = decodePaymentRequired(res.headers.get("Payment-Required"));
  } catch {
    return { ok: false, reason: `Could not reach ${agentUrl} for a payment challenge.` };
  }
  if (!meetsLlmV1Floor(accepts)) {
    return {
      ok: false,
      reason: `This agent does not offer the required payment option (USDC on Base, batch-settlement).`,
    };
  }

  const match = accepts!.find((a) => a.network === LLM_V1_FLOOR.network && a.scheme === LLM_V1_FLOOR.scheme);
  return {
    ok: true,
    card: {
      origin,
      title: doc.info?.title ?? null,
      operator: doc.info?.contact?.name ?? null,
      contactUrl: doc.info?.contact?.url ?? null,
      payTo: match?.payTo ?? null,
      network: match?.network ?? null,
    },
  };
}
