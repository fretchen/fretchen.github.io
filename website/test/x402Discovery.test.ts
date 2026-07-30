/**
 * Tests for the llm/v1 discovery helpers: the Payment-Required decode, the interop-floor
 * check, and the agent pre-check (contract doc + live 402 probe).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  decodePaymentRequired,
  meetsLlmV1Floor,
  precheckLlmV1Agent,
  checkLlmV1Agent,
  type AcceptsEntry,
  type CheckReport,
} from "../hooks/x402Discovery";

const floorEntry: AcceptsEntry = {
  scheme: "batch-settlement",
  network: "eip155:8453",
  asset: "0xusdc",
  payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
};

function paymentRequiredHeader(accepts: AcceptsEntry[]): string {
  return btoa(JSON.stringify({ accepts }));
}

describe("decodePaymentRequired", () => {
  it("returns null for a missing header", () => {
    expect(decodePaymentRequired(null)).toBeNull();
  });
  it("returns null for an unparseable header", () => {
    expect(decodePaymentRequired("not-base64-json")).toBeNull();
  });
  it("decodes the accepts array", () => {
    expect(decodePaymentRequired(paymentRequiredHeader([floorEntry]))).toEqual([floorEntry]);
  });
});

describe("meetsLlmV1Floor", () => {
  it("accepts Base + batch-settlement", () => {
    expect(meetsLlmV1Floor([floorEntry])).toBe(true);
  });
  it("rejects a non-Base or non-batch-settlement offer", () => {
    expect(meetsLlmV1Floor([{ scheme: "exact", network: "eip155:8453" }])).toBe(false);
    expect(meetsLlmV1Floor([{ scheme: "batch-settlement", network: "eip155:10" }])).toBe(false);
    expect(meetsLlmV1Floor(null)).toBe(false);
  });
});

describe("precheckLlmV1Agent", () => {
  beforeEach(() => vi.restoreAllMocks());

  function mockFetch(handlers: {
    openapi?: { status: number; body?: unknown };
    probe?: { status: number; accepts?: AcceptsEntry[] };
  }) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string) => {
        const url = String(input);
        if (url.endsWith("/openapi.json")) {
          const h = handlers.openapi ?? { status: 200, body: { "x-service-type": "llm/v1" } };
          return {
            ok: h.status >= 200 && h.status < 300,
            status: h.status,
            json: async () => h.body ?? {},
          };
        }
        // The bare POST probe.
        const p = handlers.probe ?? { status: 402, accepts: [floorEntry] };
        return {
          status: p.status,
          headers: { get: () => (p.accepts ? paymentRequiredHeader(p.accepts) : null) },
        };
      }) as unknown as typeof fetch,
    );
  }

  it("passes a well-formed llm/v1 agent and returns its provenance card", async () => {
    mockFetch({
      openapi: {
        status: 200,
        body: { "x-service-type": "llm/v1", info: { title: "T", contact: { name: "fretchen", url: "https://x" } } },
      },
      probe: { status: 402, accepts: [floorEntry] },
    });
    const res = await precheckLlmV1Agent("https://agent.example");
    expect(res.ok).toBe(true);
    expect(res.card?.operator).toBe("fretchen");
    expect(res.card?.payTo).toBe(floorEntry.payTo);
    expect(res.card?.origin).toBe("https://agent.example");
  });

  it("fails when x-service-type is not llm/v1", async () => {
    mockFetch({ openapi: { status: 200, body: { "x-service-type": "something-else" } } });
    const res = await precheckLlmV1Agent("https://agent.example");
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/not an llm\/v1 agent/);
  });

  it("fails when the 402 does not meet the interop floor", async () => {
    mockFetch({ probe: { status: 402, accepts: [{ scheme: "exact", network: "eip155:8453" }] } });
    const res = await precheckLlmV1Agent("https://agent.example");
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/required payment option/);
  });

  it("fails when the endpoint does not return a 402", async () => {
    mockFetch({ probe: { status: 200 } });
    const res = await precheckLlmV1Agent("https://agent.example");
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/Expected a 402/);
  });

  it("fails cleanly for a malformed URL", async () => {
    const res = await precheckLlmV1Agent("not a url");
    expect(res.ok).toBe(false);
  });
});

describe("checkLlmV1Agent (build-your-own-agent diagnostic)", () => {
  beforeEach(() => vi.restoreAllMocks());

  // Like precheckLlmV1Agent's mockFetch but also lets us thread ownershipProofs and
  // simulate a fetch that throws (the browser CORS/network signature).
  function mockFetch(handlers: {
    openapi?: { status: number; body?: unknown; throws?: boolean };
    probe?: { status: number; accepts?: AcceptsEntry[] | null; header?: string | null; throws?: boolean };
  }) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string) => {
        const url = String(input);
        if (url.endsWith("/openapi.json")) {
          const h = handlers.openapi ?? { status: 200, body: { "x-service-type": "llm/v1" } };
          if (h.throws) throw new TypeError("Failed to fetch");
          return { ok: h.status >= 200 && h.status < 300, status: h.status, json: async () => h.body ?? {} };
        }
        const p = handlers.probe ?? { status: 402, accepts: [floorEntry] };
        if (p.throws) throw new TypeError("Failed to fetch");
        const headerValue = p.header !== undefined ? p.header : p.accepts ? paymentRequiredHeader(p.accepts) : null;
        return { status: p.status, headers: { get: () => headerValue } };
      }) as unknown as typeof fetch,
    );
  }

  const stepStatus = (r: CheckReport, id: string) => r.steps.find((s) => s.id === id)?.status;

  it("passes every step for a well-formed agent (with ownership proof)", async () => {
    mockFetch({
      openapi: {
        status: 200,
        body: { "x-service-type": "llm/v1", "x-discovery": { ownershipProofs: ["0xsig"] } },
      },
      probe: { status: 402, accepts: [floorEntry] },
    });
    const r = await checkLlmV1Agent("https://agent.example");
    expect(r.ok).toBe(true);
    expect(r.steps.every((s) => s.status === "pass")).toBe(true);
  });

  it("warns (not fails) when the ownership proof is missing but everything else passes", async () => {
    mockFetch({ openapi: { status: 200, body: { "x-service-type": "llm/v1" } } });
    const r = await checkLlmV1Agent("https://agent.example");
    expect(stepStatus(r, "ownership")).toBe("warn");
    expect(r.ok).toBe(true); // warn does not fail the report
  });

  it("fails the service-type step when x-service-type is wrong, but still reports later steps", async () => {
    mockFetch({ openapi: { status: 200, body: { "x-service-type": "something-else" } } });
    const r = await checkLlmV1Agent("https://agent.example");
    expect(stepStatus(r, "service-type")).toBe("fail");
    expect(stepStatus(r, "challenge")).toBe("pass"); // proves it didn't short-circuit
    expect(r.ok).toBe(false);
  });

  it("flags CORS specifically when the openapi fetch throws", async () => {
    mockFetch({ openapi: { status: 200, throws: true } });
    const r = await checkLlmV1Agent("https://agent.example");
    const openapi = r.steps.find((s) => s.id === "openapi");
    expect(openapi?.status).toBe("fail");
    expect(openapi?.detail).toMatch(/CORS/);
  });

  it("fails the challenge step when the probe does not return 402", async () => {
    mockFetch({ probe: { status: 200 } });
    const r = await checkLlmV1Agent("https://agent.example");
    expect(stepStatus(r, "challenge")).toBe("fail");
  });

  it("flags a missing/unexposed Payment-Required header (CORS on the 402)", async () => {
    mockFetch({ probe: { status: 402, header: null } });
    const r = await checkLlmV1Agent("https://agent.example");
    const pr = r.steps.find((s) => s.id === "payment-required");
    expect(pr?.status).toBe("fail");
    expect(pr?.detail).toMatch(/CORS/);
  });

  it("fails the floor step when the 402 offers the wrong scheme/network", async () => {
    mockFetch({ probe: { status: 402, accepts: [{ scheme: "exact", network: "eip155:8453" }] } });
    const r = await checkLlmV1Agent("https://agent.example");
    expect(stepStatus(r, "floor")).toBe("fail");
  });

  it("fails cleanly on a malformed URL with a single step", async () => {
    const r = await checkLlmV1Agent("not a url");
    expect(r.ok).toBe(false);
    expect(r.steps).toHaveLength(1);
    expect(r.steps[0].id).toBe("url");
  });
});
