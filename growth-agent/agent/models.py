"""Pydantic models for Growth Agent state."""

from datetime import datetime

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


class LLMAnalysis(BaseModel):
    """Structured LLM output for website analytics analysis."""

    top_topics: list[str] = Field(description="Most popular topics based on page views")
    traffic_sources: list[str] = Field(
        description="Key traffic sources and their significance"
    )
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
    posting_frequency: dict[str, int] = Field(
        default_factory=lambda: {"mastodon": 4, "bluesky": 3}
    )
    tone: str = "insightful, technical, opinionated, accessible"
    languages: list[str] = Field(default_factory=lambda: ["en", "de"])
    target_audience: str = "Tech-curious academics, developers, blockchain enthusiasts"
    website_url: str = "https://fretchen.eu"


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


class PostMetrics(BaseModel):
    """Performance metrics for a published post."""

    id: str
    channel: str
    published_at: datetime
    platform_id: str | None = None
    reblogs: int = 0
    favourites: int = 0
    replies: int = 0
    clicks: int = 0


class Performance(BaseModel):
    """Performance tracking state."""

    posts: list[PostMetrics] = Field(default_factory=list)
