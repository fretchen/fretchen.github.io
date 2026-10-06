import { z } from "zod";
import { MAX_QUERY_CHARS } from "./search_service.js";
import type { PriceList } from "./stablecoin_pricing.js";

/**
 * The query strings `search_api.ts` accepts, as schemas rather than hand-written checks.
 *
 * Shaped after `llm_schemas.ts`: the description of a request and the thing the handler actually
 * enforces are one object, so the two cannot drift. `openapi.search.json` is generated from these
 * by `scripts/generate-openapi-search.ts` rather than written beside them.
 *
 * **`looseObject`, not `object`.** An unknown query parameter is ignored here, and has been since
 * the routes existed: `CONTEXT_LIMITS` in `search_service.ts` pins the cost knobs whatever the
 * caller passes, rather than refusing the request. `z.object` would publish that as
 * `additionalProperties: false` while the handler kept ignoring extras — a strictness claimed and
 * not enforced, which is the trap in the repo's CLAUDE.md and one the facilitator shipped once.
 * `looseObject` publishes what actually happens.
 *
 * Each service re-checks its own parameter (`fetchBraveContext`, `assertPublicUrl`) and owns the
 * wording; the duplicated bounds here are defence in depth for callers that reach those functions
 * directly.
 *
 * **Which message a caller sees.** Through the API these schemas always fire first — `parseArgs`
 * runs before anything else — so the wording below is what a 400 carries. The service's variants
 * are for direct callers and are deliberately allowed to differ where they can say more: Zod
 * reports `Query too long: maximum is 600 characters` from the raw value, while
 * `fetchBraveContext` trims first and can therefore report the actual length. (An earlier version
 * of this comment claimed the two were identical. They are not, and it does not matter — but a
 * comment asserting a sameness nobody maintains is worse than one describing the real split.)
 *
 * **What is NOT here, on purpose.** `url` is validated as a string only; that it must be absolute
 * and `https:` is `parseHttpsUrl`'s rule and lives there alone, because it trims before checking
 * and a duplicate here would reject a leading space the handler accepts today. The constraint is
 * published through `.describe()` instead, so the generated spec states it without a second
 * implementation drifting from the first.
 */

/** The routes served. A path outside this set is a 404 *before* any payment is advertised — a
 *  resource that does not exist has no price. */
export const ROUTES = ["search", "fetch"] as const;
export type Route = (typeof ROUTES)[number];

/**
 * Price per call, quoted separately in each token's atomic units (6 decimals) — two parallel
 * price lists, as in `genimg_x402_token.ts`, never a float and never a converted amount.
 *
 * Search is ten times fetch on purpose. Brave costs ~$0.005 a query, so $0.01 covers it twice over
 * with the invoke and a share of settlement; a fetch is egress only and priced to mean "not open"
 * rather than to recover a cost. The ratio also steers the model into the pattern that reads best:
 * search once, then read several of the results.
 *
 * It lives here, beside the schemas, rather than in `search_api.ts`, because the OpenAPI generator
 * needs it and must not import the handler: `search_api.ts` starts a local server when it is the
 * entrypoint under NODE_ENV=test, so importing it from a build script would bind a port as a side
 * effect of generating a document. This module has no side effects.
 */
export const PRICE_ATOMIC: Record<Route, PriceList> = {
  search: { USDC: "10000", EURC: "10000" },
  fetch: { USDC: "1000", EURC: "1000" },
};

/** What each route sells, used both in the 402 challenge and in the published spec. */
export const DESCRIPTION: Record<Route, string> = {
  search: "Web search with extracted page content (Brave LLM Context API)",
  fetch: "The readable text of one public web page",
};

/** The query schema per route, so the generator can walk routes rather than special-case names. */
export const QUERY_SCHEMA_FOR: Record<Route, z.ZodType> = {
  get search() {
    return SearchQuerySchema;
  },
  get fetch() {
    return FetchQuerySchema;
  },
};

export const SearchQuerySchema = z.looseObject({
  q: z
    .string({ error: "Missing required query parameter 'q'" })
    .min(1, "Missing required query parameter 'q'")
    .max(MAX_QUERY_CHARS, `Query too long: maximum is ${MAX_QUERY_CHARS} characters`)
    .describe("The search query. Result count and token budgets are fixed server-side."),
});

export const FetchQuerySchema = z.looseObject({
  url: z
    .string({ error: "Missing required query parameter 'url'" })
    .min(1, "Missing required query parameter 'url'")
    .describe("Absolute https URL. Other schemes and non-public hosts are rejected with 400."),
});
