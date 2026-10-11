/**
 * Stateless MCP endpoint for the x402 sellers: JSON-RPC 2.0 over a single POST route
 * (modelcontextprotocol.io "Streamable HTTP" transport, JSON-response mode).
 *
 * Why no MCP SDK server: a Scaleway function receives a parsed event, never Node's
 * `IncomingMessage`/`ServerResponse`, so the SDK's HTTP transports cannot attach. They are
 * also unneeded — the stateless subset of MCP is one request in, one response out. What the
 * SDK would provide beyond that (sessions, SSE, server-initiated streams) this server
 * deliberately does not support: GET and DELETE answer 405, which the spec allows a
 * session-less server to do, and which keeps the function scale-to-zero.
 *
 * The surface answered (everything else is -32601):
 *   initialize                → protocol version negotiation + tool capability
 *   notifications/*          → 202, empty body (no id, so no response object)
 *   tools/list                → the two tools from mcp_tools.ts
 *   tools/call                → the tool's paid handler; unpaid calls come back as a
 *                              result with isError + the x402 payment demands, paid
 *                              ones as the tool result + settlement receipt in _meta
 */
import { CORS_HEADERS } from "./utils.js";
import type { HttpResponse } from "./x402_server.js";
import { MCP_TOOLS } from "./mcp_tools.js";
import type { ScwEvent } from "./types.js";

/** The latest protocol revision this server implements. */
const DEFAULT_PROTOCOL_VERSION = "2025-06-18";
/** Revisions a client may request and be answered in kind; anything else gets the default. */
const SUPPORTED_PROTOCOL_VERSIONS = new Set(["2025-06-18", "2025-03-26"]);

export const SERVER_INFO = { name: "fretchen-mcp", version: "1.0.0" } as const;

export type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: unknown; result: Record<string, unknown> }
  | { jsonrpc: "2.0"; id: unknown; error: { code: number; message: string; data?: unknown } };

function jsonRpcResult(id: unknown, result: Record<string, unknown>): HttpResponse {
  return {
    statusCode: 200,
    headers: { ...CORS_HEADERS },
    body: JSON.stringify({ jsonrpc: "2.0", id, result }),
  };
}

function jsonRpcError(id: unknown, code: number, message: string, data?: unknown): HttpResponse {
  return {
    statusCode: 200,
    headers: { ...CORS_HEADERS },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: { code, message, ...(data !== undefined ? { data } : {}) },
    }),
  };
}

/** 202 for notifications: no id means no response object may be sent, only the status. */
function accepted(): HttpResponse {
  return { statusCode: 202, headers: { ...CORS_HEADERS }, body: "" };
}

interface JsonRpcMessage {
  jsonrpc: "2.0";
  id?: unknown;
  method: string;
  params?: Record<string, unknown>;
}

function parseMessage(body: ScwEvent["body"]): JsonRpcMessage | "parse-error" | "invalid" {
  let message: unknown;
  try {
    message = typeof body === "string" ? JSON.parse(body) : body;
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

async function dispatch(
  method: string,
  id: unknown,
  params: Record<string, unknown> | undefined,
): Promise<HttpResponse> {
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

export async function handle(event: ScwEvent, _context: unknown): Promise<HttpResponse> {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: { ...CORS_HEADERS }, body: "" };
  }

  // Stateless Streamable HTTP: GET (server-initiated streams) and DELETE (session
  // termination) have nothing to do without a session; 405 is the spec-legal answer.
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { ...CORS_HEADERS, Allow: "POST" },
      body: JSON.stringify({
        error:
          "Only POST is supported. This MCP server is stateless: no sessions, no server-initiated streams.",
      }),
    };
  }

  const message = parseMessage(event.body);
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
