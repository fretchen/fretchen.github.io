import pino from "pino";
import {
  getContentQueue,
  getInsights,
  getPerformance,
  approveDraft,
  rejectDraft,
  updateDraft,
  verifyOwner,
  NotFoundError,
  AuthError,
} from "./growth_service.js";
import type { ContentQueue } from "./growth_service.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "*",
  "Content-Type": "application/json",
};

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: HEADERS,
    body: JSON.stringify(body),
  };
}

function extractAuth(event: Record<string, unknown>): {
  address: string;
  signature: string;
  message: string;
} | null {
  const headers = event.headers as Record<string, string> | undefined;
  const authHeader = headers?.authorization || headers?.Authorization;
  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(match[1], "base64").toString("utf-8"));
    if (decoded.address && decoded.signature && decoded.message) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

function parsePath(rawPath: string): string {
  // Strip leading slash and any base path prefix
  return rawPath.replace(/^\/+/, "");
}

function filterByStatus(queue: ContentQueue, status: string | undefined): unknown {
  if (!status) {
    return queue;
  }
  const all = [...queue.drafts, ...queue.approved, ...queue.published, ...queue.rejected];
  return all.filter((d) => d.status === status);
}

export async function handle(
  event: Record<string, unknown>,
  _context: unknown,
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  // CORS preflight
  if ((event.httpMethod as string) === "OPTIONS") {
    return { statusCode: 200, headers: HEADERS, body: "" };
  }

  // Auth check for all non-OPTIONS requests
  const auth = extractAuth(event);
  if (!auth) {
    return jsonResponse(401, { error: "Missing or invalid Authorization header" });
  }

  try {
    await verifyOwner(auth.address, auth.signature, auth.message);
  } catch (err) {
    if (err instanceof AuthError) {
      return jsonResponse(401, { error: err.message });
    }
    logger.error({ err }, "Auth verification failed");
    return jsonResponse(500, { error: "Internal server error" });
  }

  const method = event.httpMethod as string;
  const path = parsePath((event.path as string) || "");
  const queryParams = (event.queryStringParameters as Record<string, string>) || {};

  try {
    // GET /drafts
    if (method === "GET" && path === "drafts") {
      const queue = await getContentQueue();
      const result = filterByStatus(queue, queryParams.status);
      return jsonResponse(200, result);
    }

    // GET /insights
    if (method === "GET" && path === "insights") {
      const insights = await getInsights();
      return jsonResponse(200, insights ?? {});
    }

    // GET /performance
    if (method === "GET" && path === "performance") {
      const performance = await getPerformance();
      return jsonResponse(200, performance ?? { posts: [] });
    }

    // PUT /drafts/:id
    const putMatch = path.match(/^drafts\/(.+)$/);
    if (method === "PUT" && putMatch) {
      const id = decodeURIComponent(putMatch[1]);
      const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
      const draft = await updateDraft(id, body);
      return jsonResponse(200, draft);
    }

    // POST /drafts/:id/approve
    const approveMatch = path.match(/^drafts\/(.+)\/approve$/);
    if (method === "POST" && approveMatch) {
      const id = decodeURIComponent(approveMatch[1]);
      const body =
        typeof event.body === "string" && event.body ? JSON.parse(event.body) : event.body;
      const draft = await approveDraft(id, body?.scheduled_at);
      return jsonResponse(200, draft);
    }

    // POST /drafts/:id/reject
    const rejectMatch = path.match(/^drafts\/(.+)\/reject$/);
    if (method === "POST" && rejectMatch) {
      const id = decodeURIComponent(rejectMatch[1]);
      const draft = await rejectDraft(id);
      return jsonResponse(200, draft);
    }

    return jsonResponse(404, { error: "Not found" });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return jsonResponse(404, { error: err.message });
    }
    logger.error({ err }, "Request handler error");
    return jsonResponse(500, { error: "Internal server error" });
  }
}
