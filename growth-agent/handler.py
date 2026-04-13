"""Scaleway Function entry point — daily cron handler for the Growth Agent.

Triggered daily at 08:00 UTC via Scaleway Cron.

Daily tasks:
  - Analytics ingest (Umami + social metrics)
  - Publish approved drafts where scheduled_at <= now
  - Performance update (refresh metrics for published posts)

Weekly tasks (Monday only):
  - LLM insight generation
  - Content planning + draft creation
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone

from agent.llm_client import LLMClient
from agent.models import (
    ContentQueue,
    Draft,
    Insights,
    LLMAnalysis,
    Performance,
    PostMetrics,
    SocialMetrics,
    Strategy,
    WebsiteAnalytics,
)
from agent.page_meta import fetch_pages_meta
from agent.platforms.bluesky import BlueskyClient
from agent.platforms.mastodon import MastodonClient
from agent.publisher import publish_draft
from agent.storage import S3Storage
from agent.umami_client import UmamiClient, ms_timestamp

logger = logging.getLogger("growth-agent")
logger.setLevel(logging.INFO)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_storage() -> S3Storage:
    return S3Storage(
        bucket=os.environ["S3_BUCKET"],
        prefix=os.environ.get("S3_STATE_PREFIX", "growth-agent/"),
        access_key=os.environ["SCW_ACCESS_KEY"],
        secret_key=os.environ["SCW_SECRET_KEY"],
    )


def _load_model(storage: S3Storage, key: str, model_cls):
    """Load a Pydantic model from S3, falling back to defaults."""
    data = storage.read(key)
    if data is None:
        return model_cls()
    return model_cls.model_validate(data)


def _make_draft_id(channel: str, language: str) -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"draft_{channel}_{language}_{ts}"


# ---------------------------------------------------------------------------
# Daily: Analytics Ingest
# ---------------------------------------------------------------------------


def ingest_analytics(storage: S3Storage) -> Insights:
    """Fetch Umami analytics and social metrics, write to insights.json."""
    insights = _load_model(storage, "insights.json", Insights)

    # Umami
    umami = UmamiClient(
        api_key=os.environ["UMAMI_API_KEY"],
        website_id=os.environ.get(
            "UMAMI_WEBSITE_ID", "e41ae7d9-a536-426d-b40e-f2488b11bf95"
        ),
    )
    try:
        start_at = ms_timestamp(days_ago=7)
        end_at = ms_timestamp(days_ago=0)

        stats = umami.get_stats(start_at, end_at)
        top_pages = umami.get_metrics(start_at, end_at, "path", limit=20)
        top_referrers = umami.get_metrics(start_at, end_at, "referrer", limit=10)
        top_events = umami.get_metrics(start_at, end_at, "event", limit=20)

        insights.website_analytics = WebsiteAnalytics(
            pageviews=stats.get("pageviews", {}).get("value", 0),
            visitors=stats.get("visitors", {}).get("value", 0),
            visits=stats.get("visits", {}).get("value", 0),
            bounces=stats.get("bounces", {}).get("value", 0),
            totaltime=stats.get("totaltime", {}).get("value", 0),
            top_pages=top_pages,
            top_referrers=top_referrers,
            top_events=top_events,
        )
    except Exception:
        logger.exception("Umami ingestion failed")
    finally:
        umami.close()

    # Mastodon metrics
    try:
        with MastodonClient(
            instance=os.environ.get("MASTODON_INSTANCE", "https://mastodon.social"),
            access_token=os.environ["MASTODON_ACCESS_TOKEN"],
        ) as masto:
            creds = masto.verify_credentials()
            insights.social_metrics["mastodon"] = SocialMetrics(
                followers=creds.get("followers_count", 0),
            )
    except Exception:
        logger.exception("Mastodon metrics failed")

    # Bluesky metrics
    try:
        with BlueskyClient(
            handle=os.environ.get("BLUESKY_HANDLE", "fretchen.eu"),
            app_password=os.environ["BLUESKY_APP_PASSWORD"],
        ) as bsky:
            profile = bsky.get_profile()
            insights.social_metrics["bluesky"] = SocialMetrics(
                followers=profile.get("followersCount", 0),
            )
    except Exception:
        logger.exception("Bluesky metrics failed")

    storage.write("insights.json", insights)
    logger.info("Analytics ingested")
    return insights


# ---------------------------------------------------------------------------
# Daily: Publish Approved Drafts
# ---------------------------------------------------------------------------


def publish_approved_drafts(storage: S3Storage) -> list[str]:
    """Publish approved drafts where scheduled_at <= now. Returns published IDs."""
    queue = _load_model(storage, "content_queue.json", ContentQueue)
    performance = _load_model(storage, "performance.json", Performance)
    now = datetime.now(timezone.utc)

    published_ids: list[str] = []
    still_approved: list[Draft] = []

    mastodon_client = None
    bluesky_client = None

    for draft in queue.approved:
        # Only publish if scheduled time has passed
        if draft.scheduled_at and draft.scheduled_at > now:
            still_approved.append(draft)
            continue

        try:
            if draft.channel == "mastodon":
                if mastodon_client is None:
                    mastodon_client = MastodonClient(
                        instance=os.environ.get(
                            "MASTODON_INSTANCE", "https://mastodon.social"
                        ),
                        access_token=os.environ["MASTODON_ACCESS_TOKEN"],
                    )
                result = publish_draft(draft, mastodon_client)
                platform_id = result.get("id")
            elif draft.channel == "bluesky":
                if bluesky_client is None:
                    bluesky_client = BlueskyClient(
                        handle=os.environ.get("BLUESKY_HANDLE", "fretchen.eu"),
                        app_password=os.environ["BLUESKY_APP_PASSWORD"],
                    )
                result = publish_draft(draft, bluesky_client)
                platform_id = result.get("uri")
            else:
                logger.warning(
                    "Unknown channel %s for draft %s", draft.channel, draft.id
                )
                still_approved.append(draft)
                continue

            draft.status = "published"
            queue.published.append(draft)
            performance.posts.append(
                PostMetrics(
                    id=draft.id,
                    channel=draft.channel,
                    published_at=now,
                    platform_id=platform_id,
                )
            )
            published_ids.append(draft.id)
            logger.info("Published draft %s to %s", draft.id, draft.channel)

        except Exception:
            logger.exception("Failed to publish draft %s", draft.id)
            still_approved.append(draft)

    if mastodon_client:
        mastodon_client.close()
    if bluesky_client:
        bluesky_client.close()

    queue.approved = still_approved
    storage.write("content_queue.json", queue)
    storage.write("performance.json", performance)
    return published_ids


# ---------------------------------------------------------------------------
# Weekly: LLM Insights + Content Creation
# ---------------------------------------------------------------------------


def generate_insights(storage: S3Storage) -> LLMAnalysis | None:
    """Run LLM insight generation on current analytics data."""
    insights = _load_model(storage, "insights.json", Insights)
    strategy = _load_model(storage, "strategy.json", Strategy)

    llm = LLMClient(api_token=os.environ["IONOS_API_TOKEN"])
    try:
        # Fetch page descriptions for the top pages
        page_urls = [
            f"https://fretchen.eu{p.get('x', p.get('name', ''))}"
            for p in insights.website_analytics.top_pages[:10]
            if p.get("x") or p.get("name")
        ]
        page_metas = fetch_pages_meta(page_urls) if page_urls else {}
        page_desc_block = "\n".join(
            f"- {m.url}: {m.description or '(no description)'}"
            for m in page_metas.values()
        )

        blog_url = strategy.website_url
        pillars = ", ".join(strategy.content_pillars)
        insight_prompt = f"""You are a social media growth analyst \
for a technical blog ({blog_url}).

The blog covers: {pillars}
Social channels: {", ".join(strategy.channels)}
Target audience: {strategy.target_audience}

Here is the website analytics data from the last 7 days:

Summary:
- Pageviews: {insights.website_analytics.pageviews}
- Unique visitors: {insights.website_analytics.visitors}
- Visits: {insights.website_analytics.visits}
- Bounces: {insights.website_analytics.bounces}

Top pages:
{json.dumps(insights.website_analytics.top_pages[:10], indent=2)}

Page descriptions (from the site):
{page_desc_block}

Top referrers:
{json.dumps(insights.website_analytics.top_referrers[:10], indent=2)}

Tracked events (user engagement funnels):
{json.dumps(insights.website_analytics.top_events[:10], indent=2)}

Based on this data, identify:
1. Which blog topics have the most visitor interest?
2. Where is traffic coming from? Any social media referrals?
3. Which pages would make the best social media content to share?
4. What content gaps exist — popular topics with no recent social posts?
5. Suggest 3-5 specific, actionable growth opportunities for Mastodon and Bluesky."""

        analysis = llm.structured_output(
            schema=LLMAnalysis,
            messages=[
                {
                    "role": "system",
                    "content": "You are a data-driven social media growth analyst.",
                },
                {"role": "user", "content": insight_prompt},
            ],
        )

        insights.growth_opportunities = analysis.growth_opportunities
        insights.last_analysis = datetime.now(timezone.utc)
        storage.write("insights.json", insights)
        logger.info("LLM insights generated")
        return analysis

    except Exception:
        logger.exception("Insight generation failed")
        return None
    finally:
        llm.close()


def create_drafts(storage: S3Storage, analysis: LLMAnalysis) -> int:
    """Generate social media draft posts from LLM analysis. Returns count."""
    strategy = _load_model(storage, "strategy.json", Strategy)
    queue = _load_model(storage, "content_queue.json", ContentQueue)

    pages_to_promote = analysis.best_pages_for_social[:5]
    if not pages_to_promote:
        logger.info("No pages to promote")
        return 0

    # Fetch descriptions for pages to promote
    page_urls = [p.url for p in pages_to_promote]
    page_metas = fetch_pages_meta(page_urls)

    llm = LLMClient(api_token=os.environ["IONOS_API_TOKEN"])
    new_drafts: list[Draft] = []

    try:
        for page in pages_to_promote:
            meta = page_metas.get(page.url)
            page_desc = (
                (meta.description or "(no description)") if meta else "(no description)"
            )
            page_title = (meta.title or page.title) if meta else page.title

            # Generate Mastodon EN post
            mastodon_result = llm.chat(
                messages=[
                    {
                        "role": "system",
                        "content": _system_prompt(strategy),
                    },
                    {
                        "role": "user",
                        "content": _mastodon_prompt(
                            page, page_title, page_desc, "en", strategy
                        ),
                    },
                ],
                temperature=0.8,
                max_tokens=300,
            )
            new_drafts.append(
                Draft(
                    id=_make_draft_id("mastodon", "en"),
                    channel="mastodon",
                    language="en",
                    content=mastodon_result["content"].strip(),
                    source_blog_post=page_title,
                    link=f"{page.url}?utm_source=mastodon&utm_campaign=growth-agent",
                )
            )

            # Generate Bluesky EN post
            bluesky_result = llm.chat(
                messages=[
                    {
                        "role": "system",
                        "content": _system_prompt(strategy),
                    },
                    {
                        "role": "user",
                        "content": _bluesky_prompt(
                            page, page_title, page_desc, "en", strategy
                        ),
                    },
                ],
                temperature=0.8,
                max_tokens=200,
            )
            new_drafts.append(
                Draft(
                    id=_make_draft_id("bluesky", "en"),
                    channel="bluesky",
                    language="en",
                    content=bluesky_result["content"].strip(),
                    source_blog_post=page_title,
                    link=f"{page.url}?utm_source=bluesky&utm_campaign=growth-agent",
                )
            )

    except Exception:
        logger.exception("Draft creation failed")
    finally:
        llm.close()

    queue.drafts.extend(new_drafts)
    storage.write("content_queue.json", queue)
    logger.info("Created %d new drafts", len(new_drafts))
    return len(new_drafts)


def _system_prompt(strategy: Strategy) -> str:
    pillars = ", ".join(strategy.content_pillars)
    return (
        f"You write engaging social media posts for a technical blog ({strategy.website_url}). "
        f"The blog covers: {pillars}. "
        f"Target audience: {strategy.target_audience}. "
        f"Tone: {strategy.tone}. "
        "Be concise and punchy."
    )


def _mastodon_prompt(
    page, title: str, description: str, language: str, strategy: Strategy
) -> str:
    url = f"{page.url}?utm_source=mastodon&utm_campaign=growth-agent"
    if language == "de":
        return f"""Schreibe einen Mastodon-Post (max 500 Zeichen) über diesen Blog-Artikel:

URL: {url}
Titel: {title}
Zusammenfassung: {description}
Warum bewerben: {page.reason}

Anforderungen:
- Hook im ersten Satz (Frage oder starke These)
- Ein konkretes Insight aus dem Artikel erwähnen
- Link einbinden
- 2-3 relevante Hashtags
- Duzen, nicht Siezen
- Ton: {strategy.tone}

Gib NUR den Post-Text zurück, nichts anderes."""

    pillars = ", ".join(strategy.content_pillars)
    return f"""Write a Mastodon post (max 500 characters) about this blog article:

URL: {url}
Title: {title}
Article summary: {description}
Why promote: {page.reason}

Context: {strategy.website_url} covers {pillars}.
Target audience: {strategy.target_audience}

Requirements:
- Hook in the first line (question or bold claim)
- Mention one specific insight from the article topic
- Include the link
- Add 2-3 relevant hashtags
- Tone: {strategy.tone}

Do NOT use emojis excessively. One is fine.
Return ONLY the post text, nothing else."""


def _bluesky_prompt(
    page, title: str, description: str, language: str, strategy: Strategy
) -> str:
    url = f"{page.url}?utm_source=bluesky&utm_campaign=growth-agent"
    if language == "de":
        return f"""Schreibe einen Bluesky-Post (max 300 Zeichen) über diesen Blog-Artikel:

URL: {url}
Titel: {title}
Zusammenfassung: {description}
Warum bewerben: {page.reason}

Anforderungen:
- Knackiger Hook
- Link einbinden
- Keine Hashtags (Bluesky-Kultur)
- Ton: {strategy.tone}

Gib NUR den Post-Text zurück, nichts anderes."""

    return f"""Write a Bluesky post (max 300 characters) about this blog article:

URL: {url}
Title: {title}
Article summary: {description}
Why promote: {page.reason}

Target audience: {strategy.target_audience}

Requirements:
- Concise, punchy hook
- Include the link
- No hashtags (Bluesky culture)
- Tone: {strategy.tone}

Return ONLY the post text, nothing else."""


# ---------------------------------------------------------------------------
# Main handler
# ---------------------------------------------------------------------------


def handle(event, _context):
    """Scaleway Function handler — cron entry point.

    Daily (every run):
      1. Analytics ingest
      2. Publish approved drafts
      3. (future) Performance update

    Weekly (Monday only):
      4. LLM insight generation
      5. Content creation (drafts)
    """
    logger.info("Growth Agent cron started")

    storage = _get_storage()
    result = {
        "analytics": False,
        "published": [],
        "insights": False,
        "drafts_created": 0,
    }

    # --- Daily tasks ---
    try:
        ingest_analytics(storage)
        result["analytics"] = True
    except Exception:
        logger.exception("Analytics ingest failed")

    try:
        published = publish_approved_drafts(storage)
        result["published"] = published
    except Exception:
        logger.exception("Publishing failed")

    # --- Weekly tasks (Monday) ---
    now = datetime.now(timezone.utc)
    if now.weekday() == 0:  # Monday
        logger.info("Monday — running weekly tasks")
        try:
            analysis = generate_insights(storage)
            result["insights"] = analysis is not None
            if analysis:
                count = create_drafts(storage, analysis)
                result["drafts_created"] = count
        except Exception:
            logger.exception("Weekly tasks failed")

    # Write run log
    log_key = f"logs/{now.strftime('%Y-%m-%d')}.json"
    storage.write(
        log_key,
        {
            "timestamp": now.isoformat(),
            "result": result,
        },
    )

    logger.info("Growth Agent cron finished: %s", result)
    return {
        "statusCode": 200,
        "body": json.dumps(result, default=str),
    }
