import { getS3Object, putS3Object } from "@fretchen/s3-utils";
import pino from "pino";
import { verifySignedMessage } from "./auth_utils.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const STATE_PREFIX = "growth-agent/";
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
  quality_score?: number | null;
  quality_issues?: string[];
  review_outcome?: string | null;
  review_comment?: string | null;
  reviewed_at?: string | null;
  published_at?: string | null;
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

export interface PageForSocial {
  url: string;
  title: string;
  reason: string;
  selection_type: "proven" | "exploratory" | null;
}

export interface Insights {
  website_analytics: WebsiteAnalytics;
  social_metrics: Record<string, SocialMetrics>;
  growth_opportunities: string[];
  last_analysis: string | null;
  top_topics?: string[];
  best_pages_for_social?: PageForSocial[];
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

export async function readJsonFromS3<T>(key: string): Promise<T | null> {
  const body = await getS3Object(`${STATE_PREFIX}${key}`);
  if (body === null) {
    return null;
  }
  return JSON.parse(body) as T;
}

export async function writeJsonToS3(key: string, data: unknown): Promise<void> {
  await putS3Object(`${STATE_PREFIX}${key}`, JSON.stringify(data, null, 2), {
    contentType: "application/json",
  });
}

// ===== State accessors =====

export async function getContentQueue(): Promise<ContentQueue> {
  const queue = await readJsonFromS3<ContentQueue>("content_queue.json");
  return queue ?? { drafts: [], approved: [], published: [], rejected: [] };
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

export async function approveDraft(
  id: string,
  scheduledAt?: string,
  reviewComment?: string,
): Promise<Draft> {
  const queue = await getContentQueue();
  const result = findAndRemoveDraft(queue, id, ["drafts"]);
  if (!result) {
    throw new NotFoundError(`Draft not found: ${id}`);
  }
  result.draft.status = "approved";
  result.draft.review_outcome = "approved";
  result.draft.review_comment = reviewComment ?? null;
  result.draft.reviewed_at = new Date().toISOString();
  if (scheduledAt) {
    result.draft.scheduled_at = scheduledAt;
  }
  queue.approved.push(result.draft);
  await saveContentQueue(queue);
  logger.info({ draftId: id }, "Draft approved");
  return result.draft;
}

export async function rejectDraft(id: string, reviewComment?: string): Promise<Draft> {
  const queue = await getContentQueue();
  const result = findAndRemoveDraft(queue, id, ["drafts", "approved"]);
  if (!result) {
    throw new NotFoundError(`Draft not found: ${id}`);
  }
  result.draft.status = "rejected";
  result.draft.review_outcome = "rejected";
  result.draft.review_comment = reviewComment ?? null;
  result.draft.reviewed_at = new Date().toISOString();
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

  const err = await verifySignedMessage(address, signature, message, "growth-api", ownerAddress);
  if (!err) {
    logger.info({ address }, "Owner verified");
    return;
  }

  // Translate shared utility error strings to the original growth-api domain messages
  const domainErrors: Record<string, string> = {
    "Invalid signature": "Invalid wallet signature",
    "Address mismatch": "Not the owner",
    Unauthorized: "Invalid message format, expected 'growth-api:<timestamp>'",
    "Token expired": "Message expired (>5 minutes)",
  };
  throw new AuthError(domainErrors[err] ?? err);
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
