"""Agent state definition shared across graph and node modules."""

from __future__ import annotations

from typing import Any, TypedDict


class AgentState(TypedDict, total=False):
    """State flowing through the growth-agent graph."""

    storage: Any
    is_monday: bool
    analytics_ok: bool
    published_ids: list[str]
    insights_ok: bool
    drafts_created: int
