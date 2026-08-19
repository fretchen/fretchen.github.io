"""Ingest node — fetches social media metrics."""

import logging
import os
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

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
from agent.storage import S3Storage, load_model

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

    # Page traffic (last 30 days). _collect_post_metrics's write now carries its
    # own page_traffic forward, so this ordering is defense-in-depth rather than
    # load-bearing — but keeping it after post metrics still means this always
    # merges onto the freshest performance.json.
    _collect_page_traffic(storage)

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
            d
            for d in published
            if d.channel == "mastodon"
            and d.platform_id
            and d.published_at is not None
            and d.published_at >= cutoff
        ]
        recent_bluesky = [
            d
            for d in published
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
        storage.write(
            "performance.json",
            Performance(posts=list(updated.values()), page_traffic=existing.page_traffic),
        )
        logger.info("Per-post metrics: %d total, %d refreshed", len(updated), refreshed)
    except Exception:
        logger.exception("Per-post metrics collection failed")


PAGE_TRAFFIC_WINDOW_DAYS = 30  # matches _METRICS_REFRESH_DAYS's existing precedent
ANALYTICS_SITE = "fretchen.eu"  # matches analytics/hit.ts's own hardcoded SITE


def _months_between(start: date, end: date) -> list[str]:
    """Every YYYY-MM the [start, end] range touches, inclusive."""
    months = []
    y, m = start.year, start.month
    while (y, m) <= (end.year, end.month):
        months.append(f"{y:04d}-{m:02d}")
        m += 1
        if m > 12:
            m, y = 1, y + 1
    return months


def _sum_trailing_hits(rollups: dict[str, dict], window_start: date, today: date) -> dict[str, int]:
    """Sum each page's hits for days in [window_start, today] across already-fetched
    rollup objects (keyed YYYY-MM). Split out from the S3/env-var plumbing in
    _collect_page_traffic so the month-boundary logic is testable without mocking S3.
    """
    hits_by_page: dict[str, int] = defaultdict(int)
    for rollup in rollups.values():
        for day, bucket in rollup.get("days", {}).items():
            if window_start.isoformat() <= day <= today.isoformat():
                for path, hits in bucket.get("pages", {}).items():
                    hits_by_page[path] += hits
    return dict(hits_by_page)


def _collect_page_traffic(storage) -> None:
    """Trailing-30-day per-page hits from the analytics service's monthly rollups,
    merged into performance.json.

    Reads from the same S3 bucket growth-agent already holds credentials for
    (`rollup/{site}/{YYYY-MM}.json`, written by the separate `analytics` service) —
    a second S3Storage instance with an empty prefix, not a new secret or HTTP
    client. Rollup-only: recent days the weekly compaction cron hasn't reached yet
    are simply absent from the sum, an accepted, self-healing staleness gap of up
    to ~6 days rather than replicating the hourly-bucket fallback here too.
    """
    try:
        analytics_storage = S3Storage(
            bucket=os.environ["S3_BUCKET"],
            prefix="",
            access_key=os.environ["SCW_ACCESS_KEY"],
            secret_key=os.environ["SCW_SECRET_KEY"],
        )
        today = datetime.now(timezone.utc).date()
        window_start = today - timedelta(days=PAGE_TRAFFIC_WINDOW_DAYS - 1)
        months = _months_between(window_start, today)
        rollups: dict[str, dict] = {}
        for month in months:
            data = analytics_storage.read(f"rollup/{ANALYTICS_SITE}/{month}.json")
            rollups[month] = data if isinstance(data, dict) else {"days": {}}

        hits_by_page = _sum_trailing_hits(rollups, window_start, today)

        performance = load_model(storage, "performance.json", Performance)
        performance.page_traffic = hits_by_page
        storage.write("performance.json", performance)
        logger.info("Page traffic: %d pages, window %s..%s", len(hits_by_page), window_start, today)
    except Exception:
        logger.exception("Page traffic collection failed")
