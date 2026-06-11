"""Ingest node — fetches social media metrics."""

from __future__ import annotations

import logging
import os

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


_METRICS_LOOKBACK = 20  # only fetch engagement for the N most recent posts per platform


def _collect_post_metrics(storage) -> None:
    """Fetch per-post engagement counts from Mastodon and Bluesky, write performance.json."""
    try:
        queue = load_model(storage, "content_queue.json", ContentQueue)
        published = queue.published
        performance_posts: list[PostMetrics] = []

        # Mastodon: one API call per published post — capped to avoid timeouts
        mastodon_published = [d for d in published if d.channel == "mastodon" and d.platform_id][
            -_METRICS_LOOKBACK:
        ]
        if mastodon_published:
            try:
                with MastodonClient(
                    instance=os.environ.get("MASTODON_INSTANCE", "https://mastodon.social"),
                    access_token=os.environ["MASTODON_ACCESS_TOKEN"],
                ) as masto:
                    for draft in mastodon_published:
                        try:
                            status = masto.get_status(draft.platform_id)  # type: ignore[arg-type]
                            performance_posts.append(
                                PostMetrics(
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
                            )
                        except Exception:
                            logger.warning("Failed to fetch Mastodon status %s", draft.platform_id)
            except Exception:
                logger.exception("Mastodon per-post metrics failed")

        # Bluesky: direct URI lookup via getPosts — capped to avoid timeouts
        bluesky_published = [d for d in published if d.channel == "bluesky" and d.platform_id][
            -_METRICS_LOOKBACK:
        ]
        if bluesky_published:
            try:
                with BlueskyClient(
                    handle=os.environ.get("BLUESKY_HANDLE", "fretchen.eu"),
                    app_password=os.environ["BLUESKY_APP_PASSWORD"],
                ) as bsky:
                    uris = [d.platform_id for d in bluesky_published]
                    posts_by_uri = {p["uri"]: p for p in bsky.get_posts(uris)}  # type: ignore[arg-type]
                    for draft in bluesky_published:
                        post = posts_by_uri.get(draft.platform_id or "")
                        if post:
                            performance_posts.append(
                                PostMetrics(
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
                            )
            except Exception:
                logger.exception("Bluesky per-post metrics failed")

        storage.write("performance.json", Performance(posts=performance_posts))
        logger.info("Per-post metrics collected: %d posts", len(performance_posts))
    except Exception:
        logger.exception("Per-post metrics collection failed")
