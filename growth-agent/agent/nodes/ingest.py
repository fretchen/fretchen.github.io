"""Ingest node — fetches social media metrics."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta, timezone

from agent.models import (
    ContentQueue,
    Insights,
    Performance,
    PostMetrics,
    SocialMetrics,
)
from agent.platforms.bluesky import BlueskyClient
from agent.platforms.mastodon import MastodonClient
from agent.state import AgentState
from agent.storage import load_model

logger = logging.getLogger("growth-agent")


def ingest_node(state: AgentState) -> dict:
    """LangGraph node: ingest analytics, update state."""
    try:
        ingest_analytics(state["storage"])
        return {"analytics_ok": True}
    except Exception:
        logger.exception("Analytics ingest failed")
        return {"analytics_ok": False}


def ingest_analytics(storage) -> Insights:
    """Fetch social metrics and per-post engagement, write to insights.json."""
    insights = load_model(storage, "insights.json", Insights)

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

    # Per-post engagement metrics
    _collect_post_metrics(storage)

    return insights


_METRICS_REFRESH_DAYS = 30  # only re-fetch engagement for posts published within this window


def _collect_post_metrics(storage) -> None:
    """Fetch per-post engagement counts from Mastodon and Bluesky, write performance.json.

    Merges with existing performance.json — posts outside the refresh window are preserved
    unchanged; only posts published within the last _METRICS_REFRESH_DAYS are re-fetched.
    """
    try:
        queue = load_model(storage, "content_queue.json", ContentQueue)
        existing = load_model(storage, "performance.json", Performance)

        existing_by_id: dict[str, PostMetrics] = {p.id: p for p in existing.posts}
        cutoff = datetime.now(timezone.utc) - timedelta(days=_METRICS_REFRESH_DAYS)
        published = queue.published

        recent_mastodon = [
            d for d in published
            if d.channel == "mastodon"
            and d.platform_id
            and d.published_at is not None
            and d.published_at >= cutoff
        ]
        recent_bluesky = [
            d for d in published
            if d.channel == "bluesky"
            and d.platform_id
            and d.published_at is not None
            and d.published_at >= cutoff
        ]

        updated: dict[str, PostMetrics] = dict(existing_by_id)

        if recent_mastodon:
            try:
                with MastodonClient(
                    instance=os.environ.get("MASTODON_INSTANCE", "https://mastodon.social"),
                    access_token=os.environ["MASTODON_ACCESS_TOKEN"],
                ) as masto:
                    for draft in recent_mastodon:
                        try:
                            status = masto.get_status(draft.platform_id)  # type: ignore[arg-type]
                            updated[draft.id] = PostMetrics(
                                id=draft.id,
                                channel="mastodon",
                                published_at=(
                                    draft.published_at.isoformat() if draft.published_at else ""
                                ),
                                platform_id=draft.platform_id,
                                reblogs=status.get("reblogs_count", 0),
                                favourites=status.get("favourites_count", 0),
                                replies=status.get("replies_count", 0),
                            )
                        except Exception:
                            logger.warning("Failed to fetch Mastodon status %s", draft.platform_id)
            except Exception:
                logger.exception("Mastodon per-post metrics failed")

        if recent_bluesky:
            try:
                with BlueskyClient(
                    handle=os.environ.get("BLUESKY_HANDLE", "fretchen.eu"),
                    app_password=os.environ["BLUESKY_APP_PASSWORD"],
                ) as bsky:
                    uris = [d.platform_id for d in recent_bluesky]
                    posts_by_uri = {p["uri"]: p for p in bsky.get_posts(uris)}  # type: ignore[arg-type]
                    for draft in recent_bluesky:
                        post = posts_by_uri.get(draft.platform_id or "")
                        if post:
                            updated[draft.id] = PostMetrics(
                                id=draft.id,
                                channel="bluesky",
                                published_at=(
                                    draft.published_at.isoformat() if draft.published_at else ""
                                ),
                                platform_id=draft.platform_id,
                                reblogs=post.get("repostCount", 0),
                                favourites=post.get("likeCount", 0),
                                replies=post.get("replyCount", 0),
                            )
            except Exception:
                logger.exception("Bluesky per-post metrics failed")

        refreshed = len(recent_mastodon) + len(recent_bluesky)
        storage.write("performance.json", Performance(posts=list(updated.values())))
        logger.info("Per-post metrics: %d total, %d refreshed", len(updated), refreshed)
    except Exception:
        logger.exception("Per-post metrics collection failed")
