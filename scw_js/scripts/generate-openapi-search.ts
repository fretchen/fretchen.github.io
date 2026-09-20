/**
 * Generates `openapi.search.json` from the Zod schemas and price constants in `search_schemas.ts`.
 *
 * Run via `npm run generate:openapi:search` (also part of `npm run build`/`deploy`).
 * `test/openapi_search_generation.test.ts` re-runs this logic and deep-equals it against the
 * committed file — that test, not this script, is what enforces "regenerate after changing a
 * schema", because `npm run check` does not run `build`.
 *
 * ── Why this one does not use `ServiceSpec` ────────────────────────────────────────────────────
 * The genimg and llm generators share `ServiceSpec` from `openapi-codegen.ts`, which hardcodes
 * `paths: { "/": { post } }` and a required `requestBody`. This endpoint is two GET routes with
 * query parameters and two different prices, so that type does not describe it. Widening the
 * generic to admit multi-path, body-less operations would loosen the very thing keeping the other
 * two specs honest, for no gain here — so the shape is typed locally and only the runtime helpers
 * (`CONTACT`, `toComponentSchema`, `writeSpec`, `openApiJsonPath`) are shared.
 *
 * ── Two things that are derived, never retyped ─────────────────────────────────────────────────
 * 1. Query parameters come from the Zod schemas via `toComponentSchema`, so a bound changed in
 *    `search_schemas.ts` moves the published document with it.
 * 2. Prices come from `PRICE_ATOMIC` through `formatUsdcAtomicAsDecimalUsd`, the same atomic
 *    constant the 402 challenge quotes. A price cannot be raised in one place and not the other.
 *
 * `x-discovery.ownershipProofs` is the exception: a signature over the origin, produced once by
 * `scripts/sign_ownership_proof.ts`. It cannot be regenerated here — carry it forward verbatim.
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  DESCRIPTION,
  PRICE_ATOMIC,
  QUERY_SCHEMA_FOR,
  ROUTES,
  type Route,
} from "../search_schemas.js";
import { formatUsdcAtomicAsDecimalUsd } from "../x402_server.js";
import {
  CONTACT,
  openApiJsonPath,
  toComponentSchema,
  writeSpec,
  type JsonSchemaObject,
} from "./openapi-codegen.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "openapi.search.json");

/** Where the routes are advertised. Matches `SERVICE_URL` in `search_api.ts` — the custom domain,
 *  which is the identity x402scan lists. */
const ORIGIN = "https://web-agent.fretchen.eu";

interface QueryParameter {
  name: string;
  in: "query";
  required: boolean;
  description?: string;
  schema: JsonSchemaObject;
}

/**
 * Turn a query schema into OpenAPI `parameters`.
 *
 * `z.toJSONSchema` gives `{ type: "object", properties, required, additionalProperties }`; OpenAPI
 * wants each query field as its own parameter object. Mapping mechanically keeps the schemas the
 * single source — the alternative is a hand-written copy that drifts the first time a bound moves.
 *
 * `additionalProperties` is dropped here rather than lost: these schemas are `looseObject`, meaning
 * unknown query parameters are ignored, and OpenAPI has no way to say "extra query params are
 * fine" — it is the default. So the permissiveness survives by omission, which is the honest
 * rendering. The component schemas below keep the machine-readable form of it.
 */
function toQueryParameters(schema: JsonSchemaObject): QueryParameter[] {
  const properties = (schema.properties ?? {}) as Record<string, JsonSchemaObject>;
  const required = (schema.required ?? []) as string[];
  return Object.entries(properties).map(([name, propertySchema]) => {
    // `.describe()` on the Zod field lands as `description` inside the property schema; OpenAPI
    // wants it on the parameter. Lifted rather than copied, so it appears exactly once.
    const { description, ...rest } = propertySchema as { description?: string };
    return {
      name,
      in: "query" as const,
      required: required.includes(name),
      ...(description ? { description } : {}),
      schema: rest as JsonSchemaObject,
    };
  });
}

/** Per-route prose. The schemas carry the shapes; these carry the things a caller cannot infer. */
const ROUTE_NOTES: Record<Route, string> = {
  search:
    "Proxies Brave's LLM Context API and returns search results with extracted page content. The cost knobs (result count, tokens per page, number of pages fetched) are pinned server-side and ignored if passed — the budget is the proxy's, not the caller's.",
  fetch:
    "Retrieves one public web page and returns its readable text. Only https is accepted, and every resolved address is checked: a payment authorises a fetch, not a fetch of an internal address. Redirects are followed with per-hop re-validation, and size and content-type are capped.",
};

const SCHEMA_NAME: Record<Route, string> = {
  search: "SearchQuery",
  fetch: "FetchQuery",
};

function operationFor(route: Route) {
  return {
    operationId: route === "search" ? "searchWeb" : "fetchUrl",
    summary: `${DESCRIPTION[route]} (x402 USDC payment)`,
    description: ROUTE_NOTES[route],
    tags: ["Web", "x402"],
    security: [] as const,
    "x-payment-info": {
      protocols: ["x402"] as const,
      price: {
        mode: "fixed" as const,
        currency: "USD" as const,
        amount: formatUsdcAtomicAsDecimalUsd(PRICE_ATOMIC[route]),
      },
    },
    parameters: toQueryParameters(toComponentSchema(QUERY_SCHEMA_FOR[route])),
    responses: {
      "200": {
        description: DESCRIPTION[route],
        content: {
          "application/json": {
            schema: { $ref: `#/components/schemas/${SCHEMA_NAME[route]}Response` },
          },
        },
      },
      "400": {
        description:
          "The query parameters did not validate. Body is { error } with a message the caller can correct from.",
      },
      "402": {
        description:
          "Payment required. Body and the Payment-Required header carry the x402 batch-settlement requirements to satisfy and retry with.",
      },
      "404": {
        description:
          "No such route. Returned before any price is advertised — a resource that does not exist has no price.",
      },
      "500": {
        description:
          "The upstream failed. Nothing is settled in this case: the payment is verified before the work and settled only after it succeeds.",
      },
    },
  };
}

export function generateOpenApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Fretchen Web Access Service",
      description:
        "Web search and single-page fetch for agents, paid per call via x402 batch-settlement USDC payment channels.",
      version: "1.0.0",
      "x-guidance":
        "GET /search?q=... or GET /fetch?url=... with no payment header to receive a 402 carrying x402 batch-settlement payment requirements (accepts[]). Open or top up a payment channel per those requirements, retry with the payment header, and the service returns JSON. Payment travels in the header only — these are GET routes, so there is no body fallback. Both routes bill onto the SAME channel as llm-agent.fretchen.eu when the payer, voucher signer and receiver match, so an agent already chatting there pays for web access without a second deposit. Prices are fixed per route and settled only when the call succeeds: an upstream failure returns 500 and takes no money. Mainnet only — testnet USDC is free and these routes spend real money on the caller's behalf.",
      contact: CONTACT,
    },
    "x-discovery": {
      // Signed once over the origin with the payTo key; see scripts/sign_ownership_proof.ts.
      // Not regenerable from this script — carried forward verbatim.
      ownershipProofs: [
        "0xb73eb61a6660f671483c3ce7f1faebd7490af0db5dbcbdb3a38d8f9e6c0a14aa781437e9bd3ef56edcc6bc1b063cdff844c18fe05307afb2198c5b3774208e4b1b",
      ],
    },
    "x-service-type": "web/v1",
    "x-interop-floor":
      "A compatible web/v1 agent MUST offer GET /search taking a q query parameter, MUST offer GET /fetch taking an https url query parameter, MUST return JSON, and MUST advertise at least one accepts[] entry with asset USDC on network Optimism (eip155:10) or Base (eip155:8453), scheme batch-settlement. Request shapes are defined by this document's SearchQuery/FetchQuery. Sharing a payment channel with a chat agent is NOT part of the floor — it follows from the channel id being a hash of payer, authorizers, receiver, token and withdraw delay, so any agent configured alike shares one. See README.md.",
    servers: [{ url: ORIGIN }],
    tags: [
      { name: "Web", description: "Search and single-page retrieval for agents" },
      { name: "x402", description: "Paid via x402 batch-settlement USDC payment channels" },
    ],
    paths: {
      "/search": { get: operationFor("search") },
      "/fetch": { get: operationFor("fetch") },
      "/openapi.json": openApiJsonPath("x402"),
    },
    components: {
      schemas: {
        // Published alongside the parameters so the permissiveness is machine-readable: these are
        // `looseObject`, so `additionalProperties` renders as {} — unknown query parameters are
        // ignored, exactly as the handler behaves. Claiming `false` here would describe a
        // strictness nothing enforces.
        SearchQuery: toComponentSchema(QUERY_SCHEMA_FOR.search),
        FetchQuery: toComponentSchema(QUERY_SCHEMA_FOR.fetch),
        SearchQueryResponse: {
          type: "object",
          description:
            "Brave LLM Context results. Shape is the provider's and is validated but not re-modelled here; see search_service.ts.",
          additionalProperties: true,
        },
        FetchQueryResponse: {
          type: "object",
          description: "The page's readable text and the metadata extracted alongside it.",
          additionalProperties: true,
        },
      },
    },
  };
}

function main() {
  writeSpec(OUTPUT_PATH, generateOpenApiSpec());
  // Named so a reader of the build log can tell the three generators apart.
  console.log(`  routes: ${ROUTES.join(", ")}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
