"""Ingest node — fetches Umami analytics and social media metrics."""

from __future__ import annotations

import logging
import os

from agent.models import Insights, SocialMetrics, WebsiteAnalytics
from agent.platforms.bluesky import BlueskyClient
from agent.platforms.mastodon import MastodonClient
from agent.state import AgentState
from agent.storage import load_model
from agent.umami_client import UmamiClient, ms_timestamp

logger = logging.getLogger("growth-agent")

TOP_PAGES_LIMIT = 50


def ingest_node(state: AgentState) -> dict:
    """LangGraph node: ingest analytics, update state."""
    try:
        ingest_analytics(state["storage"])
        return {"analytics_ok": True}
    except Exception:
        logger.exception("Analytics ingest failed")
        return {"analytics_ok": False}


def ingest_analytics(storage) -> Insights:
    """Fetch Umami analytics and social metrics, write to insights.json."""
    insights = load_model(storage, "insights.json", Insights)

    # Umami
    umami = UmamiClient(
        api_key=os.environ["UMAMI_API_KEY"],
        website_id=os.environ.get("UMAMI_WEBSITE_ID", "e41ae7d9-a536-426d-b40e-f2488b11bf95"),
    )
    try:
        start_at = ms_timestamp(days_ago=7)
        end_at = ms_timestamp(days_ago=0)

        stats = umami.get_stats(start_at, end_at)
        top_pages = umami.get_metrics(start_at, end_at, "path", limit=TOP_PAGES_LIMIT)
        top_referrers = umami.get_metrics(start_at, end_at, "referrer", limit=10)
        top_events = umami.get_metrics(start_at, end_at, "event", limit=20)

        def _stat(val):
            """Handle both old ({"value": n}) and new (n) Umami formats."""
            return val.get("value", 0) if isinstance(val, dict) else (val or 0)

        insights.website_analytics = WebsiteAnalytics(
            pageviews=_stat(stats.get("pageviews", 0)),
            visitors=_stat(stats.get("visitors", 0)),
            visits=_stat(stats.get("visits", 0)),
            bounces=_stat(stats.get("bounces", 0)),
            totaltime=_stat(stats.get("totaltime", 0)),
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
