"""Mastodon REST API client for posting and metrics."""

from __future__ import annotations

import httpx


class MastodonClient:
    """Minimal Mastodon API client for posting statuses."""

    def __init__(self, instance: str, access_token: str):
        self.base_url = instance.rstrip("/")
        self.client = httpx.Client(
            base_url=self.base_url,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=30,
        )

    def verify_credentials(self) -> dict:
        resp = self.client.get("/api/v1/accounts/verify_credentials")
        resp.raise_for_status()
        return resp.json()

    def post_status(
        self,
        content: str,
        *,
        visibility: str = "public",
        language: str | None = None,
    ) -> dict:
        payload: dict = {"status": content, "visibility": visibility}
        if language:
            payload["language"] = language
        resp = self.client.post("/api/v1/statuses", data=payload)
        resp.raise_for_status()
        return resp.json()

    def delete_status(self, status_id: str) -> None:
        resp = self.client.delete(f"/api/v1/statuses/{status_id}")
        resp.raise_for_status()

    def get_account_statuses(self, account_id: str, limit: int = 20) -> list[dict]:
        resp = self.client.get(
            f"/api/v1/accounts/{account_id}/statuses", params={"limit": limit}
        )
        resp.raise_for_status()
        return resp.json()

    def close(self) -> None:
        self.client.close()

    def __enter__(self) -> MastodonClient:
        return self

    def __exit__(self, *args: object) -> None:
        self.close()
