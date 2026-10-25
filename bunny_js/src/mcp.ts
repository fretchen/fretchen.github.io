/**
 * The MCP twin's entry — stateless JSON-RPC over POST, relaying tools/call in-process to the
 * searchapi and llm twins. The twin that replaces the scw mcp function's 26-27 s cold start.
 *
 * The runtime shims must import first: the ported scw_js code assumes the Node `Buffer` and
 * `process` globals, which bunny's Deno isolate does not guarantee.
 */
import "./runtime-shims.js";
import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { handleMCPRequest } from "./mcp_routes.js";

BunnySDK.net.http.serve(handleMCPRequest);
