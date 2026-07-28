/**
 * Tests for the llm/v1 discovery helpers: the Payment-Required decode, the interop-floor
 * check, and the agent pre-check (contract doc + live 402 probe).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  decodePaymentRequired,
  meetsLlmV1Floor,
  precheckLlmV1Agent,
  type AcceptsEntry,
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
      openapi: { status: 200, body: { "x-service-type": "llm/v1", info: { title: "T", contact: { name: "fretchen", url: "https://x" } } } },
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
