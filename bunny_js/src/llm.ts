/**
 * The llmx402 twin's entry — the AI Assistant chat seller (OpenAI chat-completions shape,
 * paid via x402 batch-settlement) — the production chat seller behind llm-agent.fretchen.eu.
 *
 * The runtime shims must import first: the ported scw_js code assumes the Node `Buffer` and
 * `process` globals, which bunny's Deno isolate does not guarantee.
 */
import "./runtime-shims.js";
import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { withLogFlush } from "./logger.js";
import { handleLLMRequest } from "./llm_routes.js";

BunnySDK.net.http.serve(withLogFlush("bunny-llm-agent", handleLLMRequest));
