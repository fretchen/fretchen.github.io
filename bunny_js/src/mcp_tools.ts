/**
 * The MCP tools: a pure translation layer over the twin's REAL handlers — the bunny port of
 * scw_js/mcp_tools.ts. No payment, pricing, or cost policy lives here; each tool maps an MCP
 * `tools/call` onto an in-process invocation of the twin's native routers with a synthetic
 * Request, so the MCP surface serves the same code path, prices, and channels as the REST
 * twins and cannot drift from them (scw parity: MCP wraps the API; it does not reimplement).
 *
 * Payment rides the handlers' native protocol, translated both ways (scw parity):
 *   client `_meta["x402/payment"]`        -> base64 `payment-signature` header (what every
 *                                            REST buyer sends; the handler decodes it with
 *                                            its own extractPaymentPayload)
 *   handler 402 (body IS the PaymentRequired JSON) -> MCP payment-required result (isError +
 *                                            structuredContent) — the official client's
 *                                            extractPaymentRequiredFromResult form
 *   handler `Payment-Response` header    -> settlement receipt in
 *                                            `_meta["x402/payment-response"]`
 */
import { z } from "zod";
import { SearchQuerySchema, DESCRIPTION } from "./search_schemas.js";
import { LLMChatRequestSchema } from "./llm_schemas.js";
import { handleRequest } from "./searchapi_routes.js";
import { handleLLMRequest } from "./llm_routes.js";

/**
 * The two meta keys the official x402 MCP client puts in `_meta`. Inlined as literals
 * rather than imported from `@x402/mcp`: that package's only export is its root entry,
 * which pulls the full `@modelcontextprotocol/sdk` (and its top-level `import "ajv"`
 * side effects — unresolved in the edge bundle, a load-time crash). These two strings are
 * the entire surface the twin uses from that package (values verified against
 * @x402/mcp 2.28.0 dist; the mcp test's paymentMeta fixture pins them behaviorally).
 */
const MCP_PAYMENT_META_KEY = "x402/payment";
const MCP_PAYMENT_RESPONSE_META_KEY = "x402/payment-response";

/** What `mcp_routes.ts` dispatches against: one entry per tool. */
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

/** Read the base64 settlement receipt off a native Response, as a JSON object. */
function receiptFrom(res: Response): Record<string, unknown> | undefined {
  const header = res.headers.get("payment-response");
  if (!header) {
    return undefined;
  }
  return asObject(Buffer.from(header, "base64").toString("utf-8"));
}

/** Translate one native handler response into an MCP tool result. */
async function toToolResult(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  const structured = asObject(text);
  if (res.ok) {
    const receipt = receiptFrom(res);
    return {
      content: [{ type: "text", text }],
      ...(structured !== undefined ? { structuredContent: structured } : {}),
      ...(receipt !== undefined ? { _meta: { [MCP_PAYMENT_RESPONSE_META_KEY]: receipt } } : {}),
    };
  }
  // 402: an unpaid challenge (body = PaymentRequired) or the handler's own payment-path
  // rejection; anything else is the handler's error response. All three are tool errors —
  // the official client extracts the demands from structuredContent when present.
  return {
    content: [{ type: "text", text }],
    ...(structured !== undefined ? { structuredContent: structured } : {}),
    isError: true,
  };
}

export const MCP_TOOLS: McpTool[] = [
  {
    name: "web_search",
    description: `${DESCRIPTION.search}. Paid per call via x402.`,
    inputSchema: z.toJSONSchema(SearchQuerySchema) as Record<string, unknown>,
    call: async (args, meta) => {
      const url = new URL("https://web-agent.fretchen.eu/search");
      // The handler's own parseArgs validates the query; the tool schema only advertises it.
      for (const [key, value] of Object.entries(args)) {
        url.searchParams.set(key, String(value));
      }
      return toToolResult(
        await handleRequest(new Request(url, { method: "GET", headers: paymentHeader(meta) })),
      );
    },
  },
  {
    name: "chat_completion",
    description:
      "AI Assistant chat completion — the same llm/v1 API as the chat endpoint. Paid per call via x402; testnet calls return a mock completion.",
    inputSchema: z.toJSONSchema(LLMChatRequestSchema) as Record<string, unknown>,
    call: async (args, meta) => {
      // "/" is the chat route (openapi.llm.json paths["/"]); the handler's GET discovery
      // routes are not reachable through this POST path (scw parity).
      return toToolResult(
        await handleLLMRequest(
          new Request("https://llm-agent.fretchen.eu/", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...paymentHeader(meta) },
            body: JSON.stringify(args),
          }),
        ),
      );
    },
  },
];
