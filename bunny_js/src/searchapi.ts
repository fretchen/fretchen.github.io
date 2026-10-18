/**
 * searchapi twin's entry (one of three: searchapi_entry / llm_entry / mcp_entry): the searchapi x402 seller (Brave /search + /fetch, paid via x402
 * batch-settlement) as a Bunny Edge Script — a twin of scw_js/search_api.ts, trialed at the
 * bunny-provided URL before any formal switch away from the Scaleway function.
 *
 * The runtime shims must import first: the ported scw_js code assumes the Node `Buffer` and
 * `process` globals, which bunny's Deno isolate does not guarantee.
 */
import "./runtime-shims.js";
import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { handleRequest } from "./searchapi_routes.js";

BunnySDK.net.http.serve(handleRequest);
