import { z } from "zod";
import { MAX_QUERY_CHARS } from "./search_service.js";

/**
 * The query strings `search_api.ts` accepts, as schemas rather than hand-written checks.
 *
 * Shaped after `llm_schemas.ts`: the description of a request and the thing the handler actually
 * enforces are one object, so the two cannot drift. There is no generated spec yet — when
 * discovery lands, `openapi.search.json` is built from these rather than written beside them.
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
 * directly, and the messages are kept identical so the 400 body does not depend on which check
 * fires first.
 */

export const SearchQuerySchema = z.looseObject({
  q: z
    .string({ error: "Missing required query parameter 'q'" })
    .min(1, "Missing required query parameter 'q'")
    .max(MAX_QUERY_CHARS, `Query too long: maximum is ${MAX_QUERY_CHARS} characters`),
});

export const FetchQuerySchema = z.looseObject({
  url: z
    .string({ error: "Missing required query parameter 'url'" })
    .min(1, "Missing required query parameter 'url'"),
});
