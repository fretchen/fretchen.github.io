/**
 * Bazaar discovery metadata for the paid routes (docs.x402.org/extensions/bazaar).
 *
 * Each 402 challenge the sellers emit carries an `extensions.bazaar` block: a machine-readable
 * declaration of the route's method, an example request, and the request's JSON Schema, so a
 * Bazaar-style discovery layer (the CDP Facilitator's catalog, or any facilitator implementing
 * the open `/discovery/resources` endpoint) can list and pre-validate the route without a paid
 * probe. This deployment is metadata-only: blocks are advertised, but settlement still runs
 * through facilitator.fretchen.eu, so the CDP Bazaar does not index these routes — full indexing
 * additionally needs a settled payment through the CDP Facilitator and a re-settlement at least
 * every 30 days. See README → "Bazaar discovery metadata".
 *
 * `declareDiscoveryExtension` (from @x402/extensions, the same org as @x402/core) is the
 * canonical serializer — the package pins the wire shape, and the tests in
 * `test/bazaar_discovery.test.ts` pin our use of it. Schemas come from the same Zod request
 * schemas the OpenAPI specs are generated from (scripts/openapi-codegen.ts), keeping one source
 * of truth — including the z.object/z.looseObject additionalProperties distinction the OpenAPI
 * generation tests already pin (root AGENTS.md → Serverless).
 */
import {
  declareDiscoveryExtension,
  type DeclareBodyDiscoveryExtensionConfig,
  type DeclareQueryDiscoveryExtensionConfig,
  type DiscoveryExtension,
} from "@x402/extensions/bazaar";
import { z } from "zod";
import { ImageGenerationRequestSchema, ImageGenerationResponseSchema } from "./genimg_schemas.js";
import { LLMChatRequestSchema, LLMChatResponseSchema } from "./llm_schemas.js";
import { SearchQuerySchema, FetchQuerySchema, type Route } from "./search_schemas.js";

export interface BazaarDiscoveryInput {
  method: "GET" | "POST";
  /**
   * Example request. POST bodies land in `info.input.body`, GET arguments in
   * `info.input.queryParams` — the package picks the slot from the method.
   */
  inputExample: Record<string, unknown>;
  /**
   * JSON Schema of the request, embedded as `schema.properties.input.body` (POST) or
   * `.queryParams` (GET). Derive with `z.toJSONSchema` from the same Zod schema as OpenAPI.
   */
  inputSchema: Record<string, unknown>;
  /** Example response, surfaced to agents as `info.output.example`. */
  outputExample: Record<string, unknown>;
  /** Optional response schema, folded into the schema envelope next to the example. */
  outputSchema?: Record<string, unknown>;
}

/** The 402 `extensions` entry a route declares: exactly one key, `bazaar`. */
export type BazaarExtension = { bazaar: DiscoveryExtension };

export function buildBazaarExtension(input: BazaarDiscoveryInput): BazaarExtension {
  const output = {
    example: input.outputExample,
    ...(input.outputSchema ? { schema: input.outputSchema } : {}),
  };
  // The declare-input type omits `method` (the SDK's route stack enriches it from the route
  // key); this standalone call has no route stack, so method rides on the config itself —
  // typed as the full config interfaces, which the runtime reads and the Omit-union accepts.
  const config: DeclareBodyDiscoveryExtensionConfig | DeclareQueryDiscoveryExtensionConfig =
    input.method === "POST"
      ? {
          method: "POST",
          bodyType: "json",
          input: input.inputExample,
          inputSchema: input.inputSchema,
          output,
        }
      : { method: "GET", input: input.inputExample, inputSchema: input.inputSchema, output };
  const declared = declareDiscoveryExtension(config);
  // The single key of the returned record is the bazaar extension name; the wrapper's shape —
  // one `bazaar` key, the canonical block under it — is pinned by test/bazaar_discovery.test.ts.
  return declared as unknown as BazaarExtension;
}

/** POST /imagegen — the only route paid via the exact scheme the CDP Facilitator could verify. */
export function buildGenimgBazaarExtension(): BazaarExtension {
  return buildBazaarExtension({
    method: "POST",
    // network pinned to Base so a probe replaying this example gets a Base-only 402 offer —
    // the CDP Facilitator supports a narrower network/asset list than this endpoint accepts.
    inputExample: {
      prompt: "A watercolor lighthouse at dawn, calm sea, soft light",
      network: "eip155:8453",
      size: "1024x1024",
    },
    inputSchema: z.toJSONSchema(ImageGenerationRequestSchema) as Record<string, unknown>,
    outputExample: {
      created: 1_760_000_000,
      data: [
        {
          url: "https://imagegen-agent.fretchen.eu/images/<uuid>.png",
          revised_prompt: null,
        },
      ],
      model: "flux",
      x_nft: { status: "minted", token_id: 97598, network: "eip155:8453" },
    },
    outputSchema: z.toJSONSchema(ImageGenerationResponseSchema) as Record<string, unknown>,
  });
}

/** POST /llm — chat completion, paid via the batch-settlement channels. */
export function buildLlmBazaarExtension(): BazaarExtension {
  return buildBazaarExtension({
    method: "POST",
    // `model` is required by LLMChatRequestSchema; `network` is deliberately absent — unlisted
    // keys are forwarded upstream (FORWARDED_OWN_KEYS in llm_schemas.ts), so an example that
    // taught agents to send one would train them to ship junk to the model API.
    inputExample: {
      model: "mistral-large-latest",
      messages: [
        { role: "user", content: "Explain batch-settlement payment channels in one paragraph." },
      ],
    },
    inputSchema: z.toJSONSchema(LLMChatRequestSchema) as Record<string, unknown>,
    outputExample: {
      id: "chatcmpl-bazaar-example",
      object: "chat.completion",
      created: 1_760_000_000,
      model: "mistral-large-latest",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "Payment channels escrow a deposit…" },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 24, completion_tokens: 60, total_tokens: 84 },
    },
    outputSchema: z.toJSONSchema(LLMChatResponseSchema) as Record<string, unknown>,
  });
}

/**
 * GET /search and GET /fetch — one declaration per route, since the block names the method and
 * the query parameters, and the two routes sell different things at different prices.
 *
 * Responses are the provider's shape and deliberately not re-modelled (see
 * `SearchQueryResponse` in openapi.search.json), so the examples stand alone without a schema —
 * the block advertises the example, the OpenAPI spec documents the response.
 */
export function buildSearchBazaarExtension(route: Route): BazaarExtension {
  const inputExample =
    route === "search"
      ? { q: "ERC-8004 agent registry adoption" }
      : { url: "https://www.fretchen.eu/" };
  return buildBazaarExtension({
    method: "GET",
    inputExample,
    inputSchema: z.toJSONSchema(
      route === "search" ? SearchQuerySchema : FetchQuerySchema,
    ) as Record<string, unknown>,
    outputExample:
      route === "search"
        ? {
            results: [
              {
                title: "ERC-8004: Trustless Agents",
                url: "https://eips.ethereum.org/EIPS/eip-8004",
                content: "…",
              },
            ],
          }
        : { title: "Fretchen", text: "…" },
  });
}
