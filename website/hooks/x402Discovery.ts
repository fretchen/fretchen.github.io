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

/**
 * The `llm/v1` interop floor: the scheme, and the set of networks of which an agent must
 * offer at least ONE, for a client here to be able to pay it. Mirrors `x-interop-floor` in
 * `scw_js/openapi.llm.json` — keep the two in sync.
 *
 * Optimism is listed first because it is this site's default chat network (see
 * CHAT_NETWORKS in AssistantChat.tsx); the floor itself is order-independent, but callers
 * that pick a single network from it (`negotiateNetwork`) use this order as their tiebreak.
 */
export const LLM_V1_FLOOR = {
  networks: ["eip155:10", "eip155:8453"] as readonly string[], // Optimism, Base
  scheme: "batch-settlement",
} as const;

/** True if `entry` is a batch-settlement offer on one of the floor's networks. */
function isFloorEntry(entry: AcceptsEntry): boolean {
  return (
    entry.scheme === LLM_V1_FLOOR.scheme && entry.network !== undefined && LLM_V1_FLOOR.networks.includes(entry.network)
  );
}

/**
 * Pick the network to pay an agent on: the caller's `preferred` network when the agent
 * offers it, else the first floor network the agent does offer. Returns `null` when the
 * agent offers none of them (the caller reports the mismatch).
 *
 * This is what lets a wallet sitting on Optimism still pay a Base-only third-party agent
 * (and vice versa) instead of dead-ending on a network mismatch.
 *
 * @param accepts - The agent's decoded `accepts[]`, or null if it couldn't be read.
 * @param preferred - The network the caller would rather use, if the agent allows it.
 */
export function negotiateNetwork(accepts: AcceptsEntry[] | null, preferred: string): string | null {
  if (!accepts) return null;
  const offered = accepts.filter(isFloorEntry).map((a) => a.network!);
  if (offered.includes(preferred)) return preferred;
  return LLM_V1_FLOOR.networks.find((n) => offered.includes(n)) ?? null;
}

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

/**
 * True if any `accepts[]` entry satisfies the llm/v1 interop floor: batch-settlement on
 * Optimism *or* Base. One of the two is enough — an agent need not offer both.
 */
export function meetsLlmV1Floor(accepts: AcceptsEntry[] | null): boolean {
  if (!accepts) return false;
  return accepts.some(isFloorEntry);
}

/** Normalise an agent URL to its origin (scheme + host, no path/trailing slash). */
export function agentOrigin(agentUrl: string): string {
  return new URL(agentUrl).origin;
}

/**
 * The unpaid probe body every discovery path sends: the OpenAI chat-completions shape of the
 * llm/v1 wire contract (see `scw_js/sc_llm_x402.ts`). `model` is a placeholder — any
 * 402-returning agent should challenge for payment before validating it, but a well-formed
 * body avoids relying on that ordering.
 */
const PROBE_BODY = JSON.stringify({ model: "probe", messages: [] });

/**
 * Send one unpaid request and return the agent's decoded `accepts[]`, or `null` if it did not
 * answer with a readable 402 (unreachable, CORS-blocked, wrong status, or undecodable header).
 * Never throws — every caller treats `null` as "unknown".
 */
export async function probeAccepts(agentUrl: string): Promise<AcceptsEntry[] | null> {
  try {
    const res = await fetch(agentUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: PROBE_BODY,
    });
    if (res.status !== 402) return null;
    return decodePaymentRequired(res.headers.get("Payment-Required"));
  } catch {
    return null;
  }
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
 * Best-effort provenance for display (no pass/fail gate): reads the agent's `/openapi.json`
 * for operator/title and probes once for the live `payTo`/network from the 402. Returns
 * `null` only if the origin is unusable; otherwise returns whatever it could read (fields it
 * couldn't resolve are left null). Use this for the sidebar's "who you pay" disclosure of the
 * agent already in use — `precheckLlmV1Agent` is the stricter gate for *adding* a new agent.
 */
export async function fetchAgentCard(agentUrl: string): Promise<AgentCard | null> {
  let origin: string;
  try {
    origin = agentOrigin(agentUrl);
  } catch {
    return null;
  }

  let doc: OpenApiDoc = {};
  try {
    const res = await fetch(`${origin}/openapi.json`, { method: "GET" });
    if (res.ok) doc = (await res.json()) as OpenApiDoc;
  } catch {
    // Leave doc empty — still return a card with the origin so the UI shows something.
  }

  // No live 402 — payTo/network stay null.
  const match = (await probeAccepts(agentUrl))?.find(isFloorEntry);

  return {
    origin,
    title: doc.info?.title ?? null,
    operator: doc.info?.contact?.name ?? null,
    contactUrl: doc.info?.contact?.url ?? null,
    payTo: match?.payTo ?? null,
    network: match?.network ?? null,
  };
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
      body: PROBE_BODY,
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
      reason: `This agent does not offer the required payment option (USDC on Optimism or Base, batch-settlement).`,
    };
  }

  const match = accepts!.find(isFloorEntry);
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

// ---------------------------------------------------------------------------
// Build-your-own-agent checker: a per-step diagnostic (vs. precheckLlmV1Agent's
// first-fail gate). Runs the exact checks the assistant applies, but reports every
// step so a builder can see all their problems at once. Powers AgentChecker.tsx.
// ---------------------------------------------------------------------------

export type CheckStatus = "pass" | "fail" | "warn";

export interface CheckStep {
  id: string;
  /** Short imperative label, e.g. "Serves /openapi.json". */
  label: string;
  status: CheckStatus;
  /** One-line explanation / fix hint shown under the label. */
  detail: string;
}

export interface CheckReport {
  /** True only if every non-warn step passed. */
  ok: boolean;
  steps: CheckStep[];
}

// A browser cross-origin fetch that the server received but didn't allow throws a
// generic TypeError ("Failed to fetch") — indistinguishable from DNS/network failure at
// the JS level. So we can't *prove* CORS from the client; we name it as the likely cause
// and give the fix, which is far more useful to a builder than a bare "could not reach".
const CORS_HINT =
  "add `Access-Control-Allow-Origin: *` and `Access-Control-Expose-Headers: Payment-Required` to your responses (a browser can't tell a CORS block apart from a network error)";

/**
 * Run all llm/v1 compatibility checks against an agent URL and report each step's result.
 * Never throws — every failure becomes a `fail`/`warn` step with an actionable `detail`.
 */
export async function checkLlmV1Agent(agentUrl: string): Promise<CheckReport> {
  const steps: CheckStep[] = [];
  const push = (id: string, label: string, status: CheckStatus, detail: string) =>
    steps.push({ id, label, status, detail });

  // 1. URL parseable.
  let origin: string;
  try {
    origin = agentOrigin(agentUrl);
  } catch {
    push("url", "Valid URL", "fail", "That does not look like a valid URL (e.g. https://your-agent.example).");
    return { ok: false, steps };
  }
  push("url", "Valid URL", "pass", origin);

  // 2 + 3. /openapi.json reachable cross-origin, with x-service-type: llm/v1.
  let doc: OpenApiDoc | null = null;
  try {
    const res = await fetch(`${origin}/openapi.json`, { method: "GET" });
    if (!res.ok) {
      push("openapi", "Serves /openapi.json", "fail", `GET ${origin}/openapi.json returned ${res.status}.`);
    } else {
      doc = (await res.json().catch(() => null)) as OpenApiDoc | null;
      if (!doc) {
        push("openapi", "Serves /openapi.json", "fail", "The document was reached but is not valid JSON.");
      } else {
        push("openapi", "Serves /openapi.json", "pass", `Reachable at ${origin}/openapi.json.`);
      }
    }
  } catch {
    push(
      "openapi",
      "Serves /openapi.json",
      "fail",
      `Could not read ${origin}/openapi.json from the browser — likely CORS: ${CORS_HINT}.`,
    );
  }

  if (doc) {
    if (doc["x-service-type"] === "llm/v1") {
      push("service-type", 'Declares x-service-type: "llm/v1"', "pass", "The discovery tag is present.");
    } else {
      push(
        "service-type",
        'Declares x-service-type: "llm/v1"',
        "fail",
        `Found x-service-type: ${JSON.stringify(doc["x-service-type"]) ?? "(none)"}. Set it to "llm/v1".`,
      );
    }
  }

  // 4 + 5. Bare POST → 402 with a readable Payment-Required header.
  let accepts: AcceptsEntry[] | null = null;
  let got402 = false;
  try {
    const res = await fetch(agentUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: PROBE_BODY,
    });
    if (res.status === 402) {
      got402 = true;
      push("challenge", "Returns a 402 payment challenge", "pass", "An unpaid request is asked to pay.");
      const header = res.headers.get("Payment-Required");
      if (header === null) {
        push(
          "payment-required",
          "Exposes the Payment-Required header",
          "fail",
          `The 402 has no readable Payment-Required header — if the server sets it, it isn't exposed to the browser: ${CORS_HINT}.`,
        );
      } else {
        accepts = decodePaymentRequired(header);
        push(
          "payment-required",
          "Exposes the Payment-Required header",
          accepts ? "pass" : "fail",
          accepts
            ? "Header present and decodable."
            : "Header present but not valid base64 JSON with an accepts[] array.",
        );
      }
    } else {
      push(
        "challenge",
        "Returns a 402 payment challenge",
        "fail",
        `An unpaid POST returned ${res.status}, expected 402. Let unauthenticated probes reach the payment challenge.`,
      );
    }
  } catch {
    push(
      "challenge",
      "Returns a 402 payment challenge",
      "fail",
      `Could not POST to ${agentUrl} from the browser — likely CORS: ${CORS_HINT}.`,
    );
  }

  // 6. accepts[] meets the payment requirement (USDC on Optimism or Base via batch-settlement).
  const FLOOR_LABEL = "Offers USDC on Optimism or Base via batch-settlement";
  if (got402) {
    if (meetsLlmV1Floor(accepts)) {
      // Name the network(s) actually offered — a builder checking their own agent wants to
      // see which one passed, not just that something did.
      const matched = accepts!.filter(isFloorEntry).map((a) => a.network!);
      push("floor", FLOOR_LABEL, "pass", `accepts[] includes ${LLM_V1_FLOOR.scheme} on ${matched.join(", ")}.`);
    } else {
      push(
        "floor",
        FLOOR_LABEL,
        "fail",
        `accepts[] must include an entry with scheme ${LLM_V1_FLOOR.scheme} on one of: ` +
          `eip155:10 (Optimism), eip155:8453 (Base).`,
      );
    }
  }

  // 7. Ownership proof (warn-only — recommended, not required to be usable).
  if (doc) {
    const proofs = (doc as { "x-discovery"?: { ownershipProofs?: unknown[] } })["x-discovery"]?.ownershipProofs;
    if (Array.isArray(proofs) && proofs.length > 0) {
      push("ownership", "Publishes an ownership proof", "pass", "x-discovery.ownershipProofs is present.");
    } else {
      push(
        "ownership",
        "Publishes an ownership proof",
        "warn",
        "Recommended: sign your origin and add it to x-discovery.ownershipProofs so clients can verify you control the payTo address.",
      );
    }
  }

  const ok = steps.every((s) => s.status !== "fail");
  return { ok, steps };
}
