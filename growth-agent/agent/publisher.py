"""Publish approved drafts to social media platforms."""

from __future__ import annotations

from agent.models import Draft
from agent.platforms.bluesky import BlueskyClient
from agent.platforms.mastodon import MastodonClient


def publish_draft(draft: Draft, client: MastodonClient | BlueskyClient) -> dict:
    """Publish a single draft to the appropriate platform.

    Returns the API response dict (contains post ID / URI).
    """
    if isinstance(client, MastodonClient):
        return client.post_status(
            draft.content,
            visibility="public",
            language=draft.language,
        )
    elif isinstance(client, BlueskyClient):
        return client.post(draft.content, link=draft.link)
    else:
        raise ValueError(f"Unknown client type: {type(client)}")
