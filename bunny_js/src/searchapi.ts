/**
 * searchapi twin's entry (one of three: searchapi_entry / llm_entry / mcp_entry): the searchapi x402 seller (Brave /search + /fetch, paid via x402
 * batch-settlement) as a Bunny Edge Script — the production server behind the
 * web-agent.fretchen.eu origin (the scw_js twin it replaced is retired — its serverless.yml
 * entry is removed, the function deleted on scw_js's next deploy).
 *
 * The runtime shims must import first: the ported scw_js code assumes the Node `Buffer` and
 * `process` globals, which bunny's Deno isolate does not guarantee.
 */
import "./runtime-shims.js";
import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { withLogFlush } from "./logger.js";
import { handleRequest } from "./searchapi_routes.js";

BunnySDK.net.http.serve(withLogFlush("bunny-web-agent", handleRequest));
