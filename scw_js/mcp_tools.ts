/**
 * The MCP tools: a pure translation layer over the REAL handlers. No payment, pricing, or
 * cost policy lives here — each tool maps an MCP `tools/call` onto an in-process
 * invocation of the deployed handler (`search_api.handle` / `sc_llm_x402.handle`) with a
 * synthetic event, so the MCP surface serves the same code path, prices, channels, and
 * cost rules as the REST API and cannot drift from it. (This replaced a first version
 * that assembled its own challenge config around @x402/mcp's payment wrapper and
 * diverged from the REST rules — it offered testnet accepts the search route forbids.
 * The FastMCP promise, kept for real: MCP wraps the serverless API; it does not
 * reimplement it.)
 *
 * Payment rides the handlers' native protocol, translated both ways:
 *   client `_meta["x402/payment"]`        -> base64 `payment-signature` header (what every
 *                                            REST buyer sends; the handler decodes it with
 *                                            its own extractPaymentPayload)
 *   handler 402 (body IS the PaymentRequired JSON, see create402Response)
 *                                        -> MCP payment-required result (isError +
 *                                            structuredContent) — the official client's
 *                                            extractPaymentRequiredFromResult form
 *   handler `Payment-Response` header    -> settlement receipt in
 *                                            `_meta["x402/payment-response"]`
 * The handlers therefore enforce everything: no-free-path, mainnet-only search,
 * testnet-mocked completions, usage-derived settlement.
 */
import { z } from "zod";
import { MCP_PAYMENT_META_KEY, MCP_PAYMENT_RESPONSE_META_KEY } from "@x402/mcp";
import { SearchQuerySchema, DESCRIPTION } from "./search_schemas.js";
import { LLMChatRequestSchema } from "./llm_schemas.js";
import { handle as searchHandle } from "./search_api.js";
import { handle as llmHandle } from "./sc_llm_x402.js";
import type { HttpResponse } from "./x402_server.js";

/** What `mcp_server.ts` dispatches against: one entry per tool. */
export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  /** `meta` is the request's `_meta` — where the x402 payment travels. */
  call(
    args: Record<string, unknown>,
    meta: Record<string, unknown> | undefined,
  ): Promise<Record<string, unknown>>;
}

/** The client's payment, re-encoded into the header every REST buyer sends. */
function paymentHeader(meta: Record<string, unknown> | undefined): Record<string, string> {
  const payment = meta?.[MCP_PAYMENT_META_KEY];
  if (typeof payment !== "object" || payment === null) {
    return {};
  }
  return { "payment-signature": Buffer.from(JSON.stringify(payment)).toString("base64") };
}

function asObject(json: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(json);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

/** Translate one handler response into an MCP tool result. */
function toToolResult(res: HttpResponse): Record<string, unknown> {
  const body = typeof res.body === "string" ? res.body : JSON.stringify(res.body ?? "");
  const structured = asObject(body);
  if (res.statusCode === 200) {
    const receiptHeader = res.headers["Payment-Response"] ?? res.headers["payment-response"];
    const receipt = receiptHeader
      ? asObject(Buffer.from(String(receiptHeader), "base64").toString("utf-8"))
      : undefined;
    return {
      content: [{ type: "text", text: body }],
      ...(structured !== undefined ? { structuredContent: structured } : {}),
      ...(receipt !== undefined ? { _meta: { [MCP_PAYMENT_RESPONSE_META_KEY]: receipt } } : {}),
    };
  }
  // 402: an unpaid challenge (body = PaymentRequired) or the handler's own payment-path
  // rejection; anything else is the handler's error response. All three are tool errors —
  // the official client extracts the demands from structuredContent when present.
  return {
    content: [{ type: "text", text: body }],
    ...(structured !== undefined ? { structuredContent: structured } : {}),
    isError: true,
  };
}

export const MCP_TOOLS: McpTool[] = [
  {
    name: "web_search",
    description: `${DESCRIPTION.search}. Paid per call via x402.`,
    inputSchema: z.toJSONSchema(SearchQuerySchema) as Record<string, unknown>,
    call: async (args, meta) =>
      toToolResult(
        await searchHandle(
          {
            httpMethod: "GET",
            path: "/search",
            // The handler's own parseArgs validates the query; the tool schema only
            // advertises it (same Zod schema the OpenAPI spec is generated from).
            queryStringParameters: args as Record<string, string>,
            headers: paymentHeader(meta),
          },
          {},
        ),
      ),
  },
  {
    name: "chat_completion",
    description:
      "AI Assistant chat completion — the same llm/v1 API as the chat endpoint. Paid per call via x402; testnet calls return a mock completion.",
    inputSchema: z.toJSONSchema(LLMChatRequestSchema) as Record<string, unknown>,
    call: async (args, meta) =>
      toToolResult(
        await llmHandle(
          {
            // "/" is the deployed chat route (openapi.llm.json paths["/"]); the handler's
            // GET discovery routes (agent-registration, openapi.json) are not reachable
            // through this POST path.
            httpMethod: "POST",
            path: "/",
            headers: paymentHeader(meta),
            body: JSON.stringify(args),
          },
          {},
        ),
      ),
  },
];
