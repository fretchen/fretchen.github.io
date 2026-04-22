export type Channel = "mastodon" | "bluesky";

/** Character limits per channel — keep in sync with growth-agent/handler.py CHAR_LIMITS */
export const CHANNEL_CHAR_LIMITS: Record<Channel, number> = {
  mastodon: 500,
  bluesky: 300,
} as const;

export interface Draft {
  id: string;
  created: string;
  channel: Channel;
  language: string;
  content: string;
  source_blog_post: string | null;
  hashtags: string[];
  link: string | null;
  status: string;
  scheduled_at: string | null;
  review_outcome?: string | null;
  review_comment?: string | null;
  reviewed_at?: string | null;
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
