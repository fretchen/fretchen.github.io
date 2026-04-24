"""Pydantic models for Growth Agent state."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class WebsiteAnalytics(BaseModel):
    """Aggregated website analytics from Umami."""

    pageviews: int = 0
    visitors: int = 0
    visits: int = 0
    bounces: int = 0
    totaltime: int = 0
    top_pages: list[dict] = Field(default_factory=list)
    top_referrers: list[dict] = Field(default_factory=list)
    top_events: list[dict] = Field(default_factory=list)


class PageMeta(BaseModel):
    """Metadata fetched from a web page's HTML head."""

    url: str
    title: str = ""
    description: str | None = None


class SocialMetrics(BaseModel):
    """Metrics for a single social platform."""

    followers: int = 0


class PageForSocial(BaseModel):
    """A blog page recommended for social media promotion."""

    url: str
    title: str
    reason: str
    selection_type: Literal["proven", "exploratory"] | None = None


class LLMAnalysis(BaseModel):
    """Structured LLM output for website analytics analysis."""

    top_topics: list[str] = Field(description="Most popular topics based on page views")
    traffic_sources: list[str] = Field(description="Key traffic sources and their significance")
    best_pages_for_social: list[PageForSocial] = Field(
        description="Blog pages best suited for social media promotion"
    )
    content_gaps: list[str] = Field(
        description="Topics the audience wants but are underrepresented"
    )
    growth_opportunities: list[str] = Field(
        description="Actionable growth opportunities based on the data"
    )


class Insights(BaseModel):
    """Combined insights from all data sources."""

    website_analytics: WebsiteAnalytics = Field(default_factory=WebsiteAnalytics)
    social_metrics: dict[str, SocialMetrics] = Field(default_factory=dict)
    growth_opportunities: list[str] = Field(default_factory=list)
    last_analysis: datetime | None = None


class StrategyChange(BaseModel):
    """Audit log entry for a strategy adjustment."""

    timestamp: datetime
    field: str
    old_value: str
    new_value: str
    reason: str


class StrategyAdjustment(BaseModel):
    """Structured LLM output for strategy adjustments."""

    should_adjust: bool = Field(description="Whether any adjustment is recommended")
    pillar_change: str | None = Field(
        default=None,
        description="New content pillar to replace the least effective one, or null",
    )
    pillar_to_replace: str | None = Field(
        default=None,
        description="Which existing pillar to replace, or null",
    )
    frequency_channel: str | None = Field(
        default=None,
        description="Channel to adjust frequency for, or null",
    )
    frequency_new_value: int | None = Field(
        default=None,
        description="New posting frequency for that channel, or null",
    )
    reasoning: str = Field(description="Brief explanation for the recommendation")


class Strategy(BaseModel):
    """Content strategy state."""

    content_pillars: list[str] = Field(
        default_factory=lambda: [
            "Politische Ökonomie & Spieltheorie",
            "Blockchain & Web3 (NFTs, x402, Smart Contracts)",
            "Quantencomputing & QML",
            "AI-Tools & Infrastruktur",
        ]
    )
    channels: list[str] = Field(default_factory=lambda: ["mastodon", "bluesky"])
    posting_frequency: dict[str, int] = Field(default_factory=lambda: {"mastodon": 4, "bluesky": 3})
    tone: str = "insightful, technical, opinionated, accessible"
    languages: list[str] = Field(default_factory=lambda: ["en", "de"])
    target_audience: str = "Tech-curious academics, developers, blockchain enthusiasts"
    website_url: str = "https://fretchen.eu"
    planning_exploratory_fraction: float = 0.3
    planning_cooldown_days: int = 14
    changes: list[StrategyChange] = Field(default_factory=list)


class Draft(BaseModel):
    """A single content draft for approval."""

    id: str
    created: datetime = Field(default_factory=datetime.now)
    channel: str
    language: str
    content: str
    source_blog_post: str | None = None
    hashtags: list[str] = Field(default_factory=list)
    link: str | None = None
    status: str = "pending_approval"
    scheduled_at: datetime | None = None
    # Quality evaluation fields (Phase 2c)
    quality_score: int | None = None  # 0-100, from self-refine critique
    quality_issues: list[str] = Field(default_factory=list)  # e.g. ["no_hook", "too_long"]
    review_outcome: str | None = None
    review_comment: str | None = None
    reviewed_at: datetime | None = None


class ContentQueue(BaseModel):
    """Queue of content drafts in various states."""

    drafts: list[Draft] = Field(default_factory=list)
    approved: list[Draft] = Field(default_factory=list)
    published: list[Draft] = Field(default_factory=list)
    rejected: list[Draft] = Field(default_factory=list)


class ContentPlanItem(BaseModel):
    """A single item in the content plan — what to post and when."""

    page_url: str
    page_title: str
    page_description: str
    reason: str
    channel: str
    scheduled_at: datetime


class ContentPlan(BaseModel):
    """Plan output: list of items to generate drafts for."""

    items: list[ContentPlanItem] = Field(default_factory=list)
    diagnostics: dict[str, int | float | bool | str] = Field(default_factory=dict)


class PlanningMemoryEntry(BaseModel):
    """Single planning run memory entry for episodic continuity."""

    run_at: datetime
    needed: int
    selected_urls: list[str] = Field(default_factory=list)
    blocked_recent_urls: list[str] = Field(default_factory=list)
    policy_snapshot: dict[str, int | float | str | bool] = Field(default_factory=dict)
    diagnostics: dict[str, int | float | bool | str] = Field(default_factory=dict)


class PlanningMemory(BaseModel):
    """Rolling memory of recent planning runs."""

    entries: list[PlanningMemoryEntry] = Field(default_factory=list)


class DraftCritique(BaseModel):
    """Structured critique output for self-refine pattern."""

    has_strong_hook: bool = Field(description="Does the first line grab attention?")
    follows_platform_conventions: bool = Field(description="Correct hashtag usage, length, tone?")
    mentions_specific_insight: bool = Field(
        description="Does it reference a concrete article insight?"
    )
    includes_link: bool = Field(description="Is the blog link present?")
    appropriate_tone: bool = Field(description="Matches target audience and strategy tone?")
    overall_score: int = Field(description="Quality score 0-100")
    issues: list[str] = Field(
        default_factory=list,
        description="List of specific issues: weak_hook, too_long, no_insight, wrong_tone, etc.",
    )
    suggested_improvement: str = Field(
        default="",
        description="Brief suggestion for how to improve the draft, if needed",
    )
