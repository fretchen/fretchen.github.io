/**
 * Golden-file drift check for `openapi.search.json`, plus the contract assertions that a type
 * cannot express.
 *
 * The golden test is load-bearing: `npm run check` does not run `build`, so nothing else stands
 * between editing a schema or a price and shipping a stale published document.
 */
import { describe, it, expect } from "vitest";
import { generateOpenApiSpec } from "../scripts/generate-openapi-search.js";
import { PRICE_ATOMIC } from "../search_schemas.js";
import committedSpec from "../openapi.search.json" with { type: "json" };

describe("openapi.search.json generation", () => {
  it("matches what the current Zod schemas and prices would generate", () => {
    expect(committedSpec).toEqual(generateOpenApiSpec());
  });

  describe("web/v1 contract", () => {
    const spec = committedSpec as Record<string, unknown>;

    it("keeps an interop floor naming the scheme and both mainnets", () => {
      const floor = spec["x-interop-floor"] as string;
      expect(floor).toContain("batch-settlement");
      expect(floor).toContain("eip155:10");
      expect(floor).toContain("eip155:8453");
    });

    /**
     * Mainnet only, deliberately — testnet USDC is free and both routes spend real money on the
     * caller's behalf (Brave bills per query, /fetch is egress). Advertising a testnet would hand
     * anyone a metered API for nothing, so the floor must not grow one by accident.
     */
    it("advertises no testnet", () => {
      const floor = spec["x-interop-floor"] as string;
      expect(floor).not.toContain("eip155:84532");
      expect(floor).not.toContain("eip155:11155420");
    });

    it("carries the ownership proof forward — it cannot be regenerated", () => {
      const proofs = (spec["x-discovery"] as { ownershipProofs?: string[] }).ownershipProofs;
      expect(proofs).toHaveLength(1);
      expect(proofs?.[0]).toMatch(/^0x[a-fA-F0-9]{130}$/);
    });
  });

  /**
   * Strictness must match the handler, in both directions. The query schemas are `looseObject`
   * because an unknown query parameter is IGNORED — `search_api.test.ts` pins that a caller
   * passing its own cost knobs still gets a 200 with the server's values. Publishing
   * `additionalProperties: false` would describe a rejection that never happens, which is the
   * trap CLAUDE.md names and the facilitator shipped once: its `PaymentRequest` declared closed
   * while every real payload carried extra fields.
   */
  describe("advertised strictness matches actual behaviour", () => {
    const schemas = (
      committedSpec as unknown as Record<
        string,
        Record<string, Record<string, Record<string, unknown>>>
      >
    )["components"]["schemas"];

    it("leaves both query schemas permissive", () => {
      expect(schemas["SearchQuery"]["additionalProperties"]).toEqual({});
      expect(schemas["FetchQuery"]["additionalProperties"]).toEqual({});
    });
  });

  /**
   * The published price and the price the 402 quotes come from one constant. Before this, a
   * repricing could move `PRICE_ATOMIC` and leave the discovery document advertising the old
   * figure — a lie a crawler would happily index and a client would budget against.
   */
  describe("published prices derive from PRICE_ATOMIC", () => {
    const paths = (
      committedSpec as unknown as Record<
        string,
        Record<string, Record<string, Record<string, Record<string, Record<string, string>>>>>
      >
    )["paths"];

    it("quotes $0.01 for search and $0.001 for fetch", () => {
      expect(paths["/search"]["get"]["x-payment-info"]["price"]["amount"]).toBe("0.01");
      expect(paths["/fetch"]["get"]["x-payment-info"]["price"]["amount"]).toBe("0.001");
    });

    it("keeps the 10:1 ratio the atomic constants encode", () => {
      // Asserted as a relationship rather than two more literals, so the intent survives a
      // repricing: fetch is a tenth of search on purpose, to steer a model into searching once
      // and reading several results.
      for (const token of ["USDC", "EURC"] as const) {
        expect(BigInt(PRICE_ATOMIC.search[token])).toBe(BigInt(PRICE_ATOMIC.fetch[token]) * 10n);
      }
    });
  });

  /**
   * Parameters are generated from the Zod schemas, not written beside them. If that mapping breaks,
   * the document still renders but stops describing the request — so assert the bounds actually
   * travelled, not merely that a parameter exists.
   */
  describe("query parameters are derived from the schemas", () => {
    const paths = (
      committedSpec as unknown as Record<
        string,
        Record<string, Record<string, Record<string, unknown>>>
      >
    )["paths"];

    it("publishes q as a required, bounded string", () => {
      const params = paths["/search"]["get"]["parameters"] as {
        name: string;
        in: string;
        required: boolean;
        schema: Record<string, unknown>;
      }[];
      expect(params).toHaveLength(1);
      expect(params[0]).toMatchObject({ name: "q", in: "query", required: true });
      expect(params[0].schema).toMatchObject({ type: "string", minLength: 1 });
      expect(params[0].schema.maxLength).toBeGreaterThan(0);
    });

    it("publishes url as a required string", () => {
      const params = paths["/fetch"]["get"]["parameters"] as {
        name: string;
        required: boolean;
      }[];
      expect(params).toHaveLength(1);
      expect(params[0]).toMatchObject({ name: "url", required: true });
    });

    /**
     * The mirror image of the `additionalProperties` rule above, and just as much a lie when it is
     * wrong. `url` is enforced as https-only by `parseHttpsUrl`, but the JSON Schema is a bare
     * string — the scheme rule deliberately has one home, since `parseHttpsUrl` trims first and a
     * duplicate regex here would reject a leading space the handler accepts. So the constraint has
     * to reach the reader as prose, or the published contract under-describes what we enforce and
     * a client wastes calls discovering it.
     */
    it("states the https rule in the url parameter's description", () => {
      const params = paths["/fetch"]["get"]["parameters"] as { description?: string }[];
      expect(params[0].description).toMatch(/https/i);
    });

    /** Lifted to the parameter, not left inside `schema` — OpenAPI's own convention, and it should
     *  appear exactly once. */
    it("carries the description on the parameter rather than the schema", () => {
      const params = paths["/fetch"]["get"]["parameters"] as {
        description?: string;
        schema: Record<string, unknown>;
      }[];
      const param = params[0];
      expect(param.description).toBeDefined();
      expect(param.schema.description).toBeUndefined();
    });
  });
});
