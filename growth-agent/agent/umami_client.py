"""Umami Cloud API client for analytics ingestion."""

import time
from typing import Any

import httpx

UMAMI_CLOUD_BASE = "https://api.umami.is/v1"


class UmamiClient:
    """Client for Umami Cloud REST API.

    Umami Cloud uses API key auth via `x-umami-api-key` header.
    Base URL: https://api.umami.is/v1
    Rate limit: 50 calls per 15 seconds.
    """

    def __init__(self, api_key: str, website_id: str, base_url: str = UMAMI_CLOUD_BASE):
        self.website_id = website_id
        self.base_url = base_url
        self.client = httpx.Client(
            base_url=base_url,
            headers={
                "x-umami-api-key": api_key,
                "Accept": "application/json",
            },
            timeout=30.0,
        )

    def _get(self, path: str, params: dict | None = None) -> Any:
        response = self.client.get(path, params=params)
        response.raise_for_status()
        return response.json()

    def get_stats(self, start_at: int, end_at: int) -> dict:
        """Get summarized website statistics.

        Args:
            start_at: Timestamp in ms of starting date.
            end_at: Timestamp in ms of end date.
        """
        return self._get(
            f"/websites/{self.website_id}/stats",
            params={"startAt": start_at, "endAt": end_at},
        )

    def get_pageviews(
        self,
        start_at: int,
        end_at: int,
        unit: str = "day",
        timezone: str = "Europe/Berlin",
    ) -> dict:
        """Get pageviews within a given time range."""
        return self._get(
            f"/websites/{self.website_id}/pageviews",
            params={
                "startAt": start_at,
                "endAt": end_at,
                "unit": unit,
                "timezone": timezone,
            },
        )

    def get_metrics(
        self, start_at: int, end_at: int, metric_type: str, limit: int = 20
    ) -> list:
        """Get metrics for a given time range.

        Available types: path, entry, exit, title, query, referrer, channel,
        domain, country, region, city, browser, os, device, language, screen,
        event, hostname, tag, distinctId
        """
        return self._get(
            f"/websites/{self.website_id}/metrics",
            params={
                "startAt": start_at,
                "endAt": end_at,
                "type": metric_type,
                "limit": limit,
            },
        )

    def get_events_series(
        self,
        start_at: int,
        end_at: int,
        unit: str = "day",
        timezone: str = "Europe/Berlin",
    ) -> list:
        """Get events within a given time range."""
        return self._get(
            f"/websites/{self.website_id}/events/series",
            params={
                "startAt": start_at,
                "endAt": end_at,
                "unit": unit,
                "timezone": timezone,
            },
        )

    def get_active(self) -> dict:
        """Get number of active users right now."""
        return self._get(f"/websites/{self.website_id}/active")

    def close(self):
        self.client.close()


def ms_timestamp(days_ago: int = 0) -> int:
    """Helper: get millisecond timestamp for N days ago."""
    return int((time.time() - days_ago * 86400) * 1000)
