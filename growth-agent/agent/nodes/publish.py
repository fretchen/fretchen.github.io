"""Publish node — publishes approved drafts to social platforms."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

from agent.models import ContentQueue, Draft, Performance, PostMetrics
from agent.platforms.bluesky import BlueskyClient
from agent.platforms.mastodon import MastodonClient
from agent.publisher import publish_draft
from agent.state import AgentState
from agent.storage import load_model

logger = logging.getLogger("growth-agent")

# Keep in sync with website/types/growth.ts CHANNEL_CHAR_LIMITS
CHAR_LIMITS = {"mastodon": 500, "bluesky": 300}


def publish_node(state: AgentState) -> dict:
    """LangGraph node: publish approved drafts, update state."""
    try:
        published = publish_approved_drafts(state["storage"])
        return {"published_ids": published}
    except Exception:
        logger.exception("Publishing failed")
        return {"published_ids": []}


def publish_approved_drafts(storage) -> list[str]:
    """Publish approved drafts where scheduled_at <= now. Returns published IDs."""
    queue = load_model(storage, "content_queue.json", ContentQueue)
    performance = load_model(storage, "performance.json", Performance)
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

        # Validate content length
        limit = CHAR_LIMITS.get(draft.channel, 500)
        if len(draft.content) > limit:
            logger.warning(
                "Draft %s exceeds %s char limit (%d/%d chars) — skipping",
                draft.id,
                draft.channel,
                len(draft.content),
                limit,
            )
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
