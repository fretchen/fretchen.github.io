"""Bluesky AT Protocol client for posting and metrics."""

from __future__ import annotations

from datetime import datetime, timezone

import httpx


class BlueskyClient:
    """Minimal AT Protocol client for Bluesky posting."""

    BASE_URL = "https://bsky.social/xrpc"

    def __init__(self, handle: str, app_password: str):
        self.handle = handle
        self.client = httpx.Client(timeout=30)
        self._did: str | None = None
        self._access_jwt: str | None = None
        self._login(handle, app_password)

    def _login(self, handle: str, app_password: str) -> None:
        resp = self.client.post(
            f"{self.BASE_URL}/com.atproto.server.createSession",
            json={"identifier": handle, "password": app_password},
        )
        resp.raise_for_status()
        data = resp.json()
        self._did = data["did"]
        self._access_jwt = data["accessJwt"]
        self.client.headers["Authorization"] = f"Bearer {self._access_jwt}"

    @property
    def did(self) -> str:
        assert self._did is not None
        return self._did

    def get_profile(self) -> dict:
        resp = self.client.get(
            f"{self.BASE_URL}/app.bsky.actor.getProfile",
            params={"actor": self.did},
        )
        resp.raise_for_status()
        return resp.json()

    def post(self, text: str, *, link: str | None = None) -> dict:
        now = datetime.now(timezone.utc).isoformat()
        record: dict = {
            "$type": "app.bsky.feed.post",
            "text": text,
            "createdAt": now,
        }
        if link:
            facets = self._detect_link_facet(text, link)
            if facets:
                record["facets"] = facets
        resp = self.client.post(
            f"{self.BASE_URL}/com.atproto.repo.createRecord",
            json={
                "repo": self.did,
                "collection": "app.bsky.feed.post",
                "record": record,
            },
        )
        resp.raise_for_status()
        return resp.json()

    def delete_post(self, rkey: str) -> None:
        resp = self.client.post(
            f"{self.BASE_URL}/com.atproto.repo.deleteRecord",
            json={
                "repo": self.did,
                "collection": "app.bsky.feed.post",
                "rkey": rkey,
            },
        )
        resp.raise_for_status()

    def get_author_feed(self, limit: int = 20) -> list[dict]:
        resp = self.client.get(
            f"{self.BASE_URL}/app.bsky.feed.getAuthorFeed",
            params={"actor": self.did, "limit": limit},
        )
        resp.raise_for_status()
        return resp.json().get("feed", [])

    @staticmethod
    def _detect_link_facet(text: str, link: str) -> list[dict]:
        """Create a link facet if the link appears in the text."""
        start = text.find(link)
        if start == -1:
            return []
        byte_start = len(text[:start].encode("utf-8"))
        byte_end = byte_start + len(link.encode("utf-8"))
        return [
            {
                "index": {"byteStart": byte_start, "byteEnd": byte_end},
                "features": [{"$type": "app.bsky.richtext.facet#link", "uri": link}],
            }
        ]

    def close(self) -> None:
        self.client.close()

    def __enter__(self) -> BlueskyClient:
        return self

    def __exit__(self, *args: object) -> None:
        self.close()
