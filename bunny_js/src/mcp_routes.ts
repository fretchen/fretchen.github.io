/**
 * Stateless MCP endpoint for the twin sellers: JSON-RPC 2.0 over a single POST route
 * (Streamable HTTP transport, JSON-response mode) — the bunny port of scw_js/mcp_server.ts.
 * Same dispatch surface (everything else -32601), same 202-for-notifications, same
 * no-sessions/no-streams design, with one DECIDED deviation from the scw original:
 *
 * GET is answered like a normal origin instead of the scw function's blanket 405. The scw
 * original 405s every GET ("stateless server, the spec allows it"), which generic scanners
 * (x402scan-style icon resolution, plain health checks) read as a dead origin — the root
 * HTML and /favicon.png now resolve, and paths with no content answer 404, the honest
 * "not here" rather than "method broken". What is deliberately NOT served:
 * /.well-known/agent-registration.json and /openapi.json — this origin holds no ERC-8004
 * identity and no REST spec of its own (it relays to the twins that have both), so serving
 * either would fabricate identity. DELETE stays 405 — session termination is the one thing
 * this stateless server genuinely does not do, per the MCP spec's session-less allowance.
 */
import { CORS_HEADERS } from "./utils.js";
import { FAVICON_DISCOVERY_HTML, wantsHtml } from "./discovery.js";
import { faviconBase64, faviconContentType } from "./favicon.js";
import { MCP_TOOLS } from "./mcp_tools.js";

/** The latest protocol revision this server implements. */
const DEFAULT_PROTOCOL_VERSION = "2025-06-18";
/** Revisions a client may request and be answered in kind; anything else gets the default. */
const SUPPORTED_PROTOCOL_VERSIONS = new Set(["2025-06-18", "2025-03-26"]);

export const SERVER_INFO = { name: "fretchen-mcp", version: "1.0.0" } as const;

export type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: unknown; result: Record<string, unknown> }
  | { jsonrpc: "2.0"; id: unknown; error: { code: number; message: string; data?: unknown } };

function jsonRpcResult(id: unknown, result: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
    status: 200,
    headers: { ...CORS_HEADERS },
  });
}

function jsonRpcError(id: unknown, code: number, message: string, data?: unknown): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: { code, message, ...(data !== undefined ? { data } : {}) },
    }),
    { status: 200, headers: { ...CORS_HEADERS } },
  );
}

/** 202 for notifications: no id means no response object may be sent, only the status. */
function accepted(): Response {
  return new Response(null, { status: 202, headers: { ...CORS_HEADERS } });
}

interface JsonRpcMessage {
  jsonrpc: "2.0";
  id?: unknown;
  method: string;
  params?: Record<string, unknown>;
}

function parseMessage(rawBody: string): JsonRpcMessage | "parse-error" | "invalid" {
  let message: unknown;
  try {
    message = JSON.parse(rawBody);
  } catch {
    return "parse-error";
  }
  if (
    message === null ||
    typeof message !== "object" ||
    Array.isArray(message) || // a batch — this server speaks single messages only
    (message as { jsonrpc?: unknown }).jsonrpc !== "2.0" ||
    typeof (message as { method?: unknown }).method !== "string"
  ) {
    return "invalid";
  }
  return message as JsonRpcMessage;
}

/**
 * Cap on one JSON-RPC message — bounds the wrapper itself. The tools' handlers impose their
 * own, smaller caps on the fields they charge for (the llm router meters messages at
 * MAX_MESSAGES_BYTES = 192 KB); this only stops an oversized envelope from being fully
 * materialized in the 128 MB isolate. 1 MB is generous headroom over the message cap plus
 * the JSON-RPC envelope and the payment _meta.
 */
const MAX_RPC_BYTES = 1_000_000;

/**
 * Reads the POST body up to MAX_RPC_BYTES and refuses beyond it, so an oversized body is
 * rejected without ever being fully buffered. The Content-Length check refuses a declared
 * oversize up front; the stream read catches a chunked body that lies about or omits it.
 * (Deviation from scw: the Scaleway function leaned on the platform's request-size cap; the
 * edge imposes no comparable one, so the twin encodes its own.)
 */
async function readCappedBody(request: Request): Promise<string | "too-large"> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_RPC_BYTES) {
    return "too-large";
  }
  if (!request.body) {
    return "";
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    total += value.byteLength;
    if (total > MAX_RPC_BYTES) {
      await reader.cancel();
      return "too-large";
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

async function dispatch(
  method: string,
  id: unknown,
  params: Record<string, unknown> | undefined,
): Promise<Response> {
  switch (method) {
    case "initialize": {
      const requested = typeof params?.protocolVersion === "string" ? params.protocolVersion : "";
      const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.has(requested)
        ? requested
        : DEFAULT_PROTOCOL_VERSION;
      return jsonRpcResult(id, {
        protocolVersion,
        capabilities: { tools: {} },
        serverInfo: { ...SERVER_INFO },
      });
    }
    case "tools/list": {
      return jsonRpcResult(id, {
        tools: MCP_TOOLS.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema,
        })),
      });
    }
    case "tools/call": {
      const name = typeof params?.name === "string" ? params.name : "";
      const tool = MCP_TOOLS.find((t) => t.name === name);
      if (!tool) {
        return jsonRpcError(id, -32602, `Unknown tool '${name}'`, {
          available: MCP_TOOLS.map((t) => t.name),
        });
      }
      const args = (params?.arguments ?? {}) as Record<string, unknown>;
      const meta = (params?._meta ?? undefined) as Record<string, unknown> | undefined;
      // The tool relays to the real handler, which owns the unpaid path: its 402 comes
      // back as a tool result with isError + the payment demands in structuredContent —
      // a valid tool result, not a JSON-RPC error, and passes through.
      const result = await tool.call(args, meta);
      return jsonRpcResult(id, result);
    }
    default:
      return jsonRpcError(id, -32601, `Method not found: ${method}`);
  }
}

export async function handleMCPRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: { ...CORS_HEADERS } });
  }

  const method = request.method;
  const path = (new URL(request.url).pathname ?? "").replace(/^\/+/, "");

  // The DECIDED deviation (see the header comment): GET answers like a normal origin —
  // root HTML + favicon resolve for crawlers, everything else is an honest 404 — instead
  // of the scw original's blanket 405.
  if (method === "GET" || method === "HEAD") {
    const isHead = method === "HEAD";
    if (path === "" && wantsHtml(Object.fromEntries(request.headers))) {
      return new Response(isHead ? null : FAVICON_DISCOVERY_HTML, {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "text/html; charset=utf-8" },
      });
    }
    if (path === "favicon.png") {
      const bytes = Uint8Array.from(atob(faviconBase64), (c) => c.charCodeAt(0));
      return new Response(isHead ? null : bytes, {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": faviconContentType },
      });
    }
    return new Response(
      JSON.stringify({
        error:
          "This MCP server is stateless and serves JSON-RPC 2.0 over POST only. No sessions, no server-initiated streams; this origin holds no registration document or REST spec of its own.",
      }),
      { status: 404, headers: { ...CORS_HEADERS } },
    );
  }

  // Stateless Streamable HTTP: DELETE (session termination) has nothing to do without a
  // session; 405 is the spec-legal answer and the one behavior scw parity keeps.
  if (method === "DELETE") {
    return new Response(
      JSON.stringify({
        error:
          "Only POST is supported for JSON-RPC. This MCP server is stateless: no sessions to terminate.",
      }),
      { status: 405, headers: { ...CORS_HEADERS, Allow: "POST" } },
    );
  }

  if (method !== "POST") {
    return new Response(JSON.stringify({ error: "Only POST is supported." }), {
      status: 405,
      headers: { ...CORS_HEADERS, Allow: "POST" },
    });
  }

  // The body is read capped (see readCappedBody): an oversized message is refused with 413
  // before anything is parsed, locked, or paid for.
  const rawBody = await readCappedBody(request);
  if (rawBody === "too-large") {
    return new Response(JSON.stringify({ error: `Request body exceeds 1 MB.` }), {
      status: 413,
      headers: { ...CORS_HEADERS },
    });
  }

  const message = parseMessage(rawBody);
  if (message === "parse-error") {
    return jsonRpcError(null, -32700, "Parse error");
  }
  if (message === "invalid") {
    return jsonRpcError(null, -32600, "Invalid Request: expected a single JSON-RPC 2.0 message");
  }

  // A notification (no id) is answered with 202 only — whatever its method says.
  if (message.id === undefined) {
    return accepted();
  }

  try {
    return await dispatch(message.method, message.id, message.params);
  } catch (err) {
    // Tool setup failure (missing wallet env) or an unexpected tool crash — protocol-level,
    // not a tool-level error, so it is a JSON-RPC error rather than an isError result.
    return jsonRpcError(message.id, -32603, `Internal error: ${(err as Error).message}`);
  }
}
