/**
 * Pins the `extensions.bazaar` blocks the sellers advertise in their 402 challenges
 * (docs.x402.org/extensions/bazaar). The wire shape itself is `declareDiscoveryExtension`'s
 * from @x402/extensions; these tests pin (a) that our wrapper serializes the canonical form,
 * (b) the per-route examples and schemas — derived from the same Zod schemas the OpenAPI
 * specs are generated from, and (c) that every block passes the package's own validator,
 * the same check the CDP Facilitator's cataloging path applies.
 */
import { describe, it, expect } from "vitest";
import { validateDiscoveryExtension } from "@x402/extensions/bazaar";
import { z } from "zod";
import {
  buildBazaarExtension,
  buildGenimgBazaarExtension,
  buildLlmBazaarExtension,
  buildSearchBazaarExtension,
  type BazaarExtension,
} from "../bazaar_discovery.js";
import { ImageGenerationRequestSchema } from "../genimg_schemas.js";
import { LLMChatRequestSchema } from "../llm_schemas.js";
import { SearchQuerySchema, FetchQuerySchema } from "../search_schemas.js";

/**
 * The HTTP wire form of a block, as a single flat type — the package's `DiscoveryExtension`
 * is a union of the query/body/MCP variants, which makes every nested field a narrowing
 * exercise; these tests read one variant at a time and know which.
 */
type HttpWire = {
  info: {
    input: {
      type: string;
      method: string;
      bodyType?: string;
      body?: Record<string, unknown>;
      queryParams?: Record<string, unknown>;
    };
    output?: { type: string; example: Record<string, unknown> };
  };
  schema: {
    properties: {
      input: {
        properties: { body?: Record<string, unknown>; queryParams?: Record<string, unknown> };
      };
    };
  };
};
const wire = (block: BazaarExtension): HttpWire => block.bazaar as unknown as HttpWire;

/** The CDP validator treats a missing or non-passing block as rejected, so every block must clear this. */
function expectValid(block: BazaarExtension): void {
  const result = validateDiscoveryExtension(block.bazaar);
  expect(result.valid).toBe(true);
}

describe("buildBazaarExtension (wrapper)", () => {
  const inputSchema = z.toJSONSchema(SearchQuerySchema) as Record<string, unknown>;

  it("serializes a POST route as a body declaration", () => {
    const { info } = wire(
      buildBazaarExtension({
        method: "POST",
        inputExample: { q: "lighthouse" },
        inputSchema,
        outputExample: { results: [] },
      }),
    );
    expect(info.input.type).toBe("http");
    expect(info.input.method).toBe("POST");
    expect(info.input.bodyType).toBe("json");
    expect(info.input.body).toEqual({ q: "lighthouse" });
    expect(info.output).toEqual({ type: "json", example: { results: [] } });
  });

  it("serializes a GET route as a query declaration with no body keys", () => {
    const { info } = wire(
      buildBazaarExtension({
        method: "GET",
        inputExample: { q: "lighthouse" },
        inputSchema,
        outputExample: { results: [] },
      }),
    );
    expect(info.input.method).toBe("GET");
    expect(info.input.queryParams).toEqual({ q: "lighthouse" });
    expect(info.input.body).toBeUndefined();
    expect(info.input.bodyType).toBeUndefined();
  });

  it("embeds the input schema in the schema envelope and passes the package validator", () => {
    const block = buildBazaarExtension({
      method: "GET",
      inputExample: { q: "lighthouse" },
      inputSchema,
      outputExample: { results: [] },
    });
    expect(wire(block).schema.properties.input.properties.queryParams).toEqual(inputSchema);
    expectValid(block);
  });
});

describe("per-service bazaar declarations", () => {
  it("genimg: POST, network pinned to Base, schema from ImageGenerationRequestSchema", () => {
    const block = buildGenimgBazaarExtension();
    const { info, schema } = wire(block);
    expect(info.input.method).toBe("POST");
    // Pinned so a discovery probe replaying the example body is offered Base only —
    // the CDP Facilitator's network/asset list is narrower than what we accept.
    expect(info.input.body?.network).toBe("eip155:8453");
    expect(schema.properties.input.properties.body).toEqual(
      z.toJSONSchema(ImageGenerationRequestSchema),
    );
    expect(info.output?.example.created).toEqual(expect.any(Number));
    expectValid(block);
  });

  it("llm: POST, schema from LLMChatRequestSchema", () => {
    const block = buildLlmBazaarExtension();
    const { info, schema } = wire(block);
    expect(info.input.method).toBe("POST");
    expect(info.input.body?.messages).toEqual([{ role: "user", content: expect.any(String) }]);
    expect(schema.properties.input.properties.body).toEqual(z.toJSONSchema(LLMChatRequestSchema));
    expectValid(block);
  });

  it("search: GET, one declaration per route, schemas from the query schemas", () => {
    const searchBlock = buildSearchBazaarExtension("search");
    const search = wire(searchBlock);
    expect(search.info.input.method).toBe("GET");
    expect(search.info.input.queryParams?.q).toEqual(expect.any(String));
    expect(search.schema.properties.input.properties.queryParams).toEqual(
      z.toJSONSchema(SearchQuerySchema),
    );
    expectValid(searchBlock);

    const fetchBlock = buildSearchBazaarExtension("fetch");
    const fetch = wire(fetchBlock);
    expect(fetch.info.input.queryParams?.url).toMatch(/^https:\/\//);
    expect(fetch.schema.properties.input.properties.queryParams).toEqual(
      z.toJSONSchema(FetchQuerySchema),
    );
    expectValid(fetchBlock);
  });
});
