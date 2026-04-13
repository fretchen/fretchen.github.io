import { verifyMessage } from "viem";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const BUCKET = "my-imagestore";
const STATE_PREFIX = "growth-agent/";
const MAX_MESSAGE_AGE_MS = 5 * 60 * 1000; // 5 minutes

// ===== TypeScript interfaces mirroring Python Pydantic models =====

export interface Draft {
  id: string;
  created: string;
  channel: string;
  language: string;
  content: string;
  source_blog_post: string | null;
  hashtags: string[];
  link: string | null;
  status: string;
  scheduled_at: string | null;
}

export interface ContentQueue {
  drafts: Draft[];
  approved: Draft[];
  published: Draft[];
  rejected: Draft[];
}

export interface EventFunnel {
  hovers: number;
  clicks: number;
  successes: number;
  conversion: number;
}

export interface WebsiteAnalytics {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
  top_pages: Record<string, unknown>[];
  top_referrers: Record<string, unknown>[];
  top_events: Record<string, unknown>[];
  event_funnels: Record<string, EventFunnel>;
}

export interface SocialMetrics {
  followers: number;
  engagement_rate: number;
  top_posts: Record<string, unknown>[];
}

export interface Insights {
  website_analytics: WebsiteAnalytics;
  social_metrics: Record<string, SocialMetrics>;
  growth_opportunities: string[];
  last_analysis: string | null;
}

export interface PostMetrics {
  id: string;
  channel: string;
  published_at: string;
  platform_id: string | null;
  reblogs: number;
  favourites: number;
  replies: number;
  link_clicks: number | null;
  website_referral_sessions: number;
}

export interface Performance {
  posts: PostMetrics[];
}

// ===== S3 helpers =====

export function createS3Client(): S3Client {
  return new S3Client({
    region: "nl-ams",
    endpoint: "https://s3.nl-ams.scw.cloud",
    credentials: {
      accessKeyId: process.env.SCW_ACCESS_KEY!,
      secretAccessKey: process.env.SCW_SECRET_KEY!,
    },
  });
}

async function streamToString(stream: unknown): Promise<string> {
  if (typeof stream === "string") {
    return stream;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export async function readJsonFromS3<T>(key: string): Promise<T | null> {
  const s3 = createS3Client();
  try {
    const result = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: `${STATE_PREFIX}${key}` }),
    );
    const body = await streamToString(result.Body);
    return JSON.parse(body) as T;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "NoSuchKey") {
      return null;
    }
    throw err;
  }
}

export async function writeJsonToS3(key: string, data: unknown): Promise<void> {
  const s3 = createS3Client();
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `${STATE_PREFIX}${key}`,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json",
    }),
  );
}

// ===== State accessors =====

const EMPTY_QUEUE: ContentQueue = {
  drafts: [],
  approved: [],
  published: [],
  rejected: [],
};

export async function getContentQueue(): Promise<ContentQueue> {
  const queue = await readJsonFromS3<ContentQueue>("content_queue.json");
  return queue ?? EMPTY_QUEUE;
}

export async function saveContentQueue(queue: ContentQueue): Promise<void> {
  await writeJsonToS3("content_queue.json", queue);
}

export async function getInsights(): Promise<Insights | null> {
  return readJsonFromS3<Insights>("insights.json");
}

export async function getPerformance(): Promise<Performance | null> {
  return readJsonFromS3<Performance>("performance.json");
}

// ===== Business logic =====

function findAndRemoveDraft(
  queue: ContentQueue,
  id: string,
  lists: (keyof ContentQueue)[],
): { draft: Draft; sourceList: keyof ContentQueue } | null {
  for (const listName of lists) {
    const list = queue[listName] as Draft[];
    const idx = list.findIndex((d) => d.id === id);
    if (idx !== -1) {
      const [draft] = list.splice(idx, 1);
      return { draft, sourceList: listName };
    }
  }
  return null;
}

export async function approveDraft(id: string, scheduledAt?: string): Promise<Draft> {
  const queue = await getContentQueue();
  const result = findAndRemoveDraft(queue, id, ["drafts"]);
  if (!result) {
    throw new NotFoundError(`Draft not found: ${id}`);
  }
  result.draft.status = "approved";
  if (scheduledAt) {
    result.draft.scheduled_at = scheduledAt;
  }
  queue.approved.push(result.draft);
  await saveContentQueue(queue);
  logger.info({ draftId: id }, "Draft approved");
  return result.draft;
}

export async function rejectDraft(id: string): Promise<Draft> {
  const queue = await getContentQueue();
  const result = findAndRemoveDraft(queue, id, ["drafts"]);
  if (!result) {
    throw new NotFoundError(`Draft not found: ${id}`);
  }
  result.draft.status = "rejected";
  queue.rejected.push(result.draft);
  await saveContentQueue(queue);
  logger.info({ draftId: id }, "Draft rejected");
  return result.draft;
}

export interface DraftUpdates {
  content?: string;
  hashtags?: string[];
  scheduled_at?: string;
}

export async function updateDraft(id: string, updates: DraftUpdates): Promise<Draft> {
  const queue = await getContentQueue();
  // Search in both drafts and approved (editable before publish)
  const allEditable = [...queue.drafts, ...queue.approved];
  const draft = allEditable.find((d) => d.id === id);
  if (!draft) {
    throw new NotFoundError(`Draft not found: ${id}`);
  }
  if (updates.content !== undefined) {
    draft.content = updates.content;
  }
  if (updates.hashtags !== undefined) {
    draft.hashtags = updates.hashtags;
  }
  if (updates.scheduled_at !== undefined) {
    draft.scheduled_at = updates.scheduled_at;
  }
  await saveContentQueue(queue);
  logger.info({ draftId: id }, "Draft updated");
  return draft;
}

// ===== Auth =====

export async function verifyOwner(
  address: string,
  signature: string,
  message: string,
): Promise<void> {
  const ownerAddress = process.env.OWNER_ETH_ADDRESS;
  if (!ownerAddress) {
    throw new Error("OWNER_ETH_ADDRESS not configured");
  }

  // Verify EIP-191 signature
  const isValid = await verifyMessage({
    address: address as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });

  if (!isValid) {
    throw new AuthError("Invalid wallet signature");
  }

  // Verify owner
  if (address.toLowerCase() !== ownerAddress.toLowerCase()) {
    throw new AuthError("Not the owner");
  }

  // Replay protection: message must be "growth-api:<unix-timestamp>"
  const match = message.match(/^growth-api:(\d+)$/);
  if (!match) {
    throw new AuthError("Invalid message format, expected 'growth-api:<timestamp>'");
  }
  const messageTime = parseInt(match[1], 10) * 1000; // convert to ms
  const now = Date.now();
  if (Math.abs(now - messageTime) > MAX_MESSAGE_AGE_MS) {
    throw new AuthError("Message expired (>5 minutes)");
  }

  logger.info({ address }, "Owner verified");
}

// ===== Custom errors =====

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
