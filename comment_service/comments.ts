/**
 * Blog comment system – anonymous comments stored in S3 with email notification.
 * Honeypot-triggered comments are stored with suspectedAgent flag.
 */
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

// ── Types ───────────────────────────────────────────────────────────────

interface ScalewayEvent {
  httpMethod: string;
  headers?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  body?: string | Record<string, unknown>;
}

interface Comment {
  id: string;
  name: string;
  text: string;
  page: string;
  timestamp: string;
  suspectedAgent: boolean;
}

interface CommentPostBody {
  name?: string;
  text?: string;
  page?: string;
  website?: string; // honeypot field
}

interface HandlerResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

// ── Constants ───────────────────────────────────────────────────────────

const BUCKET_NAME = "my-imagestore";
const COMMENTS_PREFIX = "comments/";
const MAX_NAME_LENGTH = 100;
const MAX_TEXT_LENGTH = 2000;
const MAX_PAGE_LENGTH = 200;
const RATE_LIMIT_PER_MIN = 3;
const MAX_AGENT_COMMENTS = 10;

// In-memory rate limit store (resets on cold start – acceptable for low traffic)
const rateLimitStore = new Map<string, number[]>();

const ALLOWED_ORIGINS = ["https://www.fretchen.eu", "http://localhost:3000"];

function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin ?? "") ? origin! : "https://www.fretchen.eu";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────

function pageHash(page: string): string {
  return crypto.createHash("sha256").update(page).digest("hex").slice(0, 16);
}

function sanitize(input: string, maxLength: number): string {
  return input
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLength);
}

function sanitizePage(page: string): string | null {
  // Strip control characters, trim, enforce length
  const clean = page
    .replace(/\p{Cc}/gu, "")
    .trim()
    .slice(0, MAX_PAGE_LENGTH);
  // Must start with / and contain only safe URL path characters
  if (!clean || !/^\/[\w/.\-~%]*$/.test(clean)) {
    return null;
  }
  return clean;
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (rateLimitStore.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= RATE_LIMIT_PER_MIN) {
    return true;
  }
  recent.push(now);
  rateLimitStore.set(ip, recent);
  return false;
}

// ── Email notification ──────────────────────────────────────────────────

async function sendEmailNotification(comment: Comment): Promise<void> {
  try {
    if (!process.env.TEM_PROJECT_ID || !process.env.NOTIFICATION_EMAIL) {
      console.warn("Email notification skipped: TEM_PROJECT_ID or NOTIFICATION_EMAIL not set");
      return;
    }

    const agentWarning = comment.suspectedAgent ? "🤖 SUSPECTED AGENT (honeypot triggered)\n" : "";
    const res = await fetch("https://api.scaleway.com/transactional-email/v1alpha1/regions/fr-par/emails", {
      method: "POST",
      headers: {
        "X-Auth-Token": process.env.SCW_SECRET_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_id: process.env.TEM_PROJECT_ID,
        from: { email: "comments@fretchen.eu", name: "Blog Comments" },
        to: [{ email: process.env.NOTIFICATION_EMAIL }],
        subject: `💬 New comment on ${comment.page}`,
        text: `${agentWarning}From: ${comment.name}\nPage: ${comment.page}\nTime: ${comment.timestamp}\n\n${comment.text}`,
      }),
    });

    if (!res.ok) {
      console.error(`Email API returned ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error("Email notification failed:", err);
  }
}

// ── GET handler ─────────────────────────────────────────────────────────

async function handleGetComments(
  event: ScalewayEvent,
  s3: S3Client,
  corsHeaders: Record<string, string>,
): Promise<HandlerResponse> {
  const rawPage = event.queryStringParameters?.page;
  if (!rawPage) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Missing page parameter" }),
    };
  }

  const page = sanitizePage(rawPage);
  if (!page) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid page parameter" }),
    };
  }

  const prefix = `${COMMENTS_PREFIX}${pageHash(page)}/`;

  const listed = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME, Prefix: prefix }));
  if (!listed.Contents || listed.Contents.length === 0) {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ comments: [] }),
    };
  }

  const comments: Comment[] = await Promise.all(
    listed.Contents.filter((obj) => obj.Key).map(async (obj) => {
      const data = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: obj.Key! }));
      const text = await data.Body!.transformToString();
      return JSON.parse(text) as Comment;
    }),
  );

  // Sort by timestamp ascending (oldest first)
  comments.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Limit suspected agent comments to prevent spam flooding
  const agentComments = comments.filter((c) => c.suspectedAgent);
  const normalComments = comments.filter((c) => !c.suspectedAgent);
  const limitedAgents = agentComments.slice(-MAX_AGENT_COMMENTS);
  const result = [...normalComments, ...limitedAgents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ comments: result }),
  };
}

// ── POST handler ────────────────────────────────────────────────────────

async function handlePostComment(
  event: ScalewayEvent,
  s3: S3Client,
  corsHeaders: Record<string, string>,
): Promise<HandlerResponse> {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Missing request body" }),
    };
  }

  let body: CommentPostBody;
  try {
    body =
      typeof event.body === "string"
        ? (JSON.parse(event.body) as CommentPostBody)
        : (event.body as unknown as CommentPostBody);
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }

  // Honeypot check: if hidden field is filled, flag as suspected agent
  const suspectedAgent = !!body.website;

  const { name, text, page: rawPage } = body;
  if (!text || !rawPage) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Missing required fields" }),
    };
  }

  const page = sanitizePage(rawPage);
  if (!page) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid page value" }),
    };
  }

  const cleanName = sanitize(name || "Anonymous", MAX_NAME_LENGTH);
  const cleanText = sanitize(text, MAX_TEXT_LENGTH);

  if (cleanText.length === 0) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Comment text is empty" }),
    };
  }

  // Rate limiting by source IP
  const ip = event.headers?.["x-forwarded-for"] ?? "unknown";
  if (isRateLimited(ip)) {
    return {
      statusCode: 429,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Too many comments. Please wait." }),
    };
  }

  const comment: Comment = {
    id: crypto.randomUUID(),
    name: cleanName,
    text: cleanText,
    page,
    timestamp: new Date().toISOString(),
    suspectedAgent,
  };

  const hash = pageHash(page);
  const key = `${COMMENTS_PREFIX}${hash}/${comment.timestamp}-${comment.id.slice(0, 8)}.json`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(comment),
      ContentType: "application/json",
    }),
  );

  await sendEmailNotification(comment);

  return {
    statusCode: 201,
    headers: corsHeaders,
    body: JSON.stringify({ comment }),
  };
}

// ── Main handler ────────────────────────────────────────────────────────

export async function handle(event: ScalewayEvent, _context: unknown): Promise<HandlerResponse> {
  const origin = event.headers?.origin ?? event.headers?.Origin;
  const corsHeaders = getCorsHeaders(origin);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  const s3 = new S3Client({
    region: "nl-ams",
    endpoint: "https://s3.nl-ams.scw.cloud",
    credentials: {
      accessKeyId: process.env.SCW_ACCESS_KEY!,
      secretAccessKey: process.env.SCW_SECRET_KEY!,
    },
  });

  if (event.httpMethod === "GET") {
    return handleGetComments(event, s3, corsHeaders);
  }

  if (event.httpMethod === "POST") {
    return handlePostComment(event, s3, corsHeaders);
  }

  return {
    statusCode: 405,
    headers: corsHeaders,
    body: JSON.stringify({ error: "Method not allowed" }),
  };
}
