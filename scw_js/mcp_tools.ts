/**
 * The two paid MCP tools the endpoint serves, and nothing else.
 *
 * Each tool is built with `@x402/mcp`'s `createPaymentWrapper` around the SAME payment stack
 * the REST handlers use (`createLLMResourceServer` + `createBatchSettlementPaymentRequirements`
 * from `x402_server.ts`): same facilitator, same batch-settlement channels in S3 (a customer's
 * existing channel works here unchanged), same per-currency prices — `MAX_PRICE_ATOMIC` for
 * llm_complete, `PRICE_ATOMIC.search` for web_search — same EURe permit2 extension. The tool
 * handler only runs after the wrapper's verifyPayment succeeds; an unpaid tools/call comes
 * back as a result with `isError` and the payment demands in `structuredContent`, per the
 * official x402-over-MCP convention (JSON-RPC error code -32042 on the client side).
 *
 * Settlement is the REST chat's "authorize an upper bound, claim the real amount" split, kept
 * in parity by `withUsageDerivedSettlement`: verify against the advertised ceiling, settle the
 * usage-derived amount (capped at the ceiling, zero when usage is absent).
 */
import { z } from "zod";
import { createPaymentWrapper, type PaymentRequirements } from "@x402/mcp";
import type { PaymentRequirements as SdkPaymentRequirements } from "@x402/core/types";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import type { x402ResourceServer } from "@x402/core/server";
import {
  createBatchSettlementPaymentRequirements,
  createLLMResourceServer,
} from "./x402_server.js";
import {
  LLMChatRequestSchema,
  LLMChatMessageSchema,
  MAX_PRICE_ATOMIC,
  getSettleAmount,
} from "./llm_schemas.js";
import { SearchQuerySchema, PRICE_ATOMIC } from "./search_schemas.js";
import { callLLMAPI, resolveModel, type LLMMessage } from "./llm_service.js";
import { searchWeb } from "./search_service.js";
import { resolvePaidStablecoin } from "./stablecoin_pricing.js";
import llmSpec from "./openapi.llm.json" with { type: "json" };
import searchSpec from "./openapi.search.json" with { type: "json" };

/** What `mcp_server.ts` dispatches against: one entry per tool. */
export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  /** The paid handler. `meta` is the request's `_meta` — where the x402 payment travels. */
  call(
    args: Record<string, unknown>,
    meta: Record<string, unknown> | undefined,
  ): Promise<Record<string, unknown>>;
}

function isHexAddress(addr: unknown): addr is `0x${string}` {
  return typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

/**
 * Settlement parity for `llm_complete`: the payment wrapper settles with the requirements it
 * matched (the advertised ceiling), while the REST chat claims the real, usage-derived amount
 * (sc_llm_x402.ts — "authorize an upper bound, claim the real amount"). Nothing in the x402
 * MCP convention fixes the claim amount; the wrapper simply calls whatever resource server it
 * was handed, so this proxy shadows ONE method: `settlePayment` re-prices the claim from the
 * tool result's `usage` (the wrapper sets `transportContext.result` before settling) with the
 * shared `getSettleAmount` — capped at the advertised ceiling, zero when usage is absent.
 *
 * `Object.create` keeps every other method on the prototype chain, so the wrapper sees the real
 * server for verify/match/cancel — and any method a future @x402/mcp version adds still
 * resolves instead of crashing on a hand-rolled delegating object.
 *
 * Falls back to the wrapper's own behavior (unchanged requirements) only when the payload's
 * asset does not resolve to an offered coin — a state the wrapper's own
 * `findMatchingRequirements` step makes unreachable for a verified payment.
 */
function withUsageDerivedSettlement(server: x402ResourceServer): x402ResourceServer {
  const proxy = Object.create(server) as x402ResourceServer;
  proxy.settlePayment = ((
    payload: { accepted?: { network?: string; asset?: string } } & Record<string, unknown>,
    requirements: SdkPaymentRequirements,
    extMap: Record<string, unknown> | undefined,
    transportContext: { result?: { structuredContent?: Record<string, unknown> } } & Record<
      string,
      unknown
    >,
    ...rest: unknown[]
  ) => {
    const usage = transportContext?.result?.structuredContent?.usage as
      { prompt_tokens: number; completion_tokens: number } | undefined;
    // The wrapper hands settlePayment the full PaymentPayload envelope — the accepted entry
    // lives on its inner `payload` (the REST handlers see the unwrapped object, which is why
    // the shape differs from sc_llm_x402.ts's).
    const accepted =
      (payload as { payload?: { accepted?: { network?: string; asset?: string } } }).payload
        ?.accepted ?? payload.accepted;
    const coin = resolvePaidStablecoin(accepted?.network ?? "", accepted?.asset);
    // No usage → zero charge, exactly like the REST chat's dummy path. No coin → unreachable
    // for a verified payment (see the doc comment); settle as the wrapper would have.
    const amount = !usage ? "0" : coin ? getSettleAmount(usage, coin.symbol) : requirements.amount;
    // Pass-through delegation for the wrapper's trailing args (settlement overrides, phase):
    // the SDK's own settlePayment types them; modeling them here would just drift.
    const settle = server.settlePayment as (...args: unknown[]) => Promise<unknown>;
    return settle(payload, { ...requirements, amount }, extMap, transportContext, ...rest);
  }) as x402ResourceServer["settlePayment"];
  return proxy;
}

/** The handler shape `createPaymentWrapper` expects (ToolResult in @x402/mcp's terms). */
interface ToolResult {
  // The package's ToolResult carries an index signature; matched here so handlers
  // assign without a cast.
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
  structuredContent?: Record<string, unknown>;
}

/** A text result — the JSON string form is what agents' text extraction sees. */
function toolResult(payload: unknown): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(payload) }],
    structuredContent: payload as Record<string, unknown>,
  };
}

function toolError(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

async function buildMcpTools(): Promise<McpTool[]> {
  const receiver = process.env.NFT_WALLET_PUBLIC_KEY;
  if (!isHexAddress(receiver)) {
    throw new Error("NFT_WALLET_PUBLIC_KEY not configured or invalid");
  }
  const { resourceServer, scheme } = createLLMResourceServer(receiver);

  // ── llm_complete ──────────────────────────────────────────────────────────────
  const llmInputSchema = z.toJSONSchema(LLMChatRequestSchema) as Record<string, unknown>;
  const llmExtensions = declareDiscoveryExtension({
    toolName: "llm_complete",
    description: "Run an LLM chat completion. Paid per call at the advertised ceiling price.",
    inputSchema: llmInputSchema,
  });
  const llmReqs = await createBatchSettlementPaymentRequirements({
    resourceUrl: "mcp://tool/llm_complete",
    description: "AI Assistant chat completion",
    mimeType: "application/json",
    price: MAX_PRICE_ATOMIC,
    payTo: receiver,
    scheme,
    extensions: llmExtensions,
  });
  const paidLlm = createPaymentWrapper(withUsageDerivedSettlement(resourceServer), {
    accepts: llmReqs.accepts as PaymentRequirements[],
    resource: {
      url: "mcp://tool/llm_complete",
      description: "AI Assistant chat completion",
      mimeType: "application/json",
      serviceName: "Fretchen AI Assistant",
      tags: ["llm", "chat", "x402"],
      iconUrl: `${llmSpec.servers[0].url}/favicon.png`,
    },
    extensions: llmReqs.extensions,
  })(async (args: Record<string, unknown>) => {
    const parsed = LLMChatRequestSchema.safeParse(args);
    if (!parsed.success) {
      return toolError(JSON.stringify(parsed.error.issues));
    }
    const { tools, tool_choice, useDummyData } = parsed.data;
    const provider = resolveModel(parsed.data.model)?.provider;
    if (!provider) {
      return toolError("model_not_found");
    }
    // Messages parsed against the message schema (as the REST handler does), so the
    // inferred field types match callLLMAPI's LLMMessage[].
    const messages = z.array(LLMChatMessageSchema).parse(parsed.data.messages) as LLMMessage[];
    const res = await callLLMAPI(messages, useDummyData === true, provider, {
      ...(tools ? { tools } : {}),
      ...(tool_choice ? { tool_choice } : {}),
    });
    return toolResult(res);
  });

  // ── web_search ─────────────────────────────────────────────────────────────────
  const searchInputSchema = z.toJSONSchema(SearchQuerySchema) as Record<string, unknown>;
  const searchExtensions = declareDiscoveryExtension({
    toolName: "web_search",
    description: "Web search with extracted page content (Brave LLM Context API). Paid per call.",
    inputSchema: searchInputSchema,
  });
  const searchReqs = await createBatchSettlementPaymentRequirements({
    resourceUrl: "mcp://tool/web_search",
    description: "Web search (Brave LLM Context API)",
    mimeType: "application/json",
    price: PRICE_ATOMIC.search,
    payTo: receiver,
    scheme,
    extensions: searchExtensions,
  });
  const paidSearch = createPaymentWrapper(resourceServer, {
    accepts: searchReqs.accepts as PaymentRequirements[],
    resource: {
      url: "mcp://tool/web_search",
      description: "Web search (Brave LLM Context API)",
      mimeType: "application/json",
      serviceName: "Fretchen Web Access",
      tags: ["search", "web", "x402"],
      iconUrl: `${searchSpec.servers[0].url}/favicon.png`,
    },
    extensions: searchReqs.extensions,
  })(async (args: Record<string, unknown>) => {
    const parsed = SearchQuerySchema.safeParse(args);
    if (!parsed.success) {
      return toolError(JSON.stringify(parsed.error.issues));
    }
    const res = await searchWeb(parsed.data.q);
    return toolResult(res);
  });

  return [
    {
      name: "llm_complete",
      description: "Run an LLM chat completion (Mistral Large). Paid per call via x402.",
      inputSchema: llmInputSchema,
      call: (args, meta) => paidLlm(args, { _meta: meta }) as Promise<Record<string, unknown>>,
    },
    {
      name: "web_search",
      description: "Web search with extracted page content. Paid per call via x402.",
      inputSchema: searchInputSchema,
      call: (args, meta) => paidSearch(args, { _meta: meta }) as Promise<Record<string, unknown>>,
    },
  ];
}

/**
 * Memoized: tools are built once per warm container (accepts construction is async — scheme
 * enhancement, spec imports). A build failure clears the promise so a later invocation can
 * retry — the env cannot change inside a container, but a transient S3/RPC failure can.
 */
let toolsPromise: Promise<McpTool[]> | null = null;

export function getMcpTools(): Promise<McpTool[]> {
  toolsPromise ??= buildMcpTools().catch((err) => {
    toolsPromise = null;
    throw err;
  });
  return toolsPromise;
}
