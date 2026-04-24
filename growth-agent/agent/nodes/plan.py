"""Plan node — decides what to post, when, and on which channel."""

from __future__ import annotations

import logging
import math
import os
import random
from datetime import datetime, timedelta, timezone
from typing import TypedDict
from urllib.parse import urlsplit, urlunsplit

from agent.models import (
    ContentPlan,
    ContentPlanItem,
    ContentQueue,
)
from agent.page_meta import fetch_pages_meta
from agent.state import AgentState
from agent.storage import load_model

logger = logging.getLogger("growth-agent")

PIPELINE_TARGET = 10
HALF_LIFE_DAYS = 30.0
DEFAULT_CHANNELS = ["mastodon", "bluesky"]
REGISTRY_KEYS = [
    "simple_planner/registry_clean.json",
    "simple_planner/registry.json",
]


class SelectedPage(TypedDict):
    page_url: str
    t_days: float | None
    weight: float


def _normalize_url(url: str) -> str:
    parts = urlsplit(url.strip())
    path = parts.path or "/"
    if path != "/" and path.endswith("/"):
        path = path[:-1]
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), path, "", ""))


def _page_title_from_url(url: str) -> str:
    path = urlsplit(url).path.strip("/")
    if not path:
        return "Home"
    return path.split("/")[-1].replace("-", " ").title()


def _load_registry_urls(storage) -> list[str]:
    for key in REGISTRY_KEYS:
        data = storage.read(key)
        if isinstance(data, dict) and isinstance(data.get("urls"), list):
            urls = [_normalize_url(u) for u in data["urls"] if isinstance(u, str) and u.strip()]
            # Keep first occurrence only
            seen: set[str] = set()
            unique: list[str] = []
            for u in urls:
                if u in seen:
                    continue
                seen.add(u)
                unique.append(u)
            return unique
    return []


def _last_published_days(queue: ContentQueue, now: datetime) -> dict[str, float]:
    """Return days since last publication per page URL from queue.published."""
    latest_by_url: dict[str, datetime] = {}
    for draft in queue.published:
        if not draft.link:
            continue
        page_url = _normalize_url(draft.link)
        ts = draft.scheduled_at or draft.created
        if page_url not in latest_by_url or ts > latest_by_url[page_url]:
            latest_by_url[page_url] = ts

    return {
        page_url: (now - last_ts).total_seconds() / 86400.0
        for page_url, last_ts in latest_by_url.items()
    }


def _weight_for_days(t_days: float | None, half_life_days: float) -> float:
    if t_days is None:
        return 1.0
    weight = 1.0 - math.pow(2.0, -t_days / half_life_days)
    return max(0.0, weight)


def _weighted_draw(
    registry_urls: list[str],
    last_days_by_url: dict[str, float],
    needed: int,
    half_life_days: float,
    seed: int | None,
) -> list[SelectedPage]:
    weighted_candidates: list[SelectedPage] = [
        {
            "page_url": page_url,
            "t_days": last_days_by_url.get(page_url),
            "weight": _weight_for_days(last_days_by_url.get(page_url), half_life_days),
        }
        for page_url in registry_urls
    ]

    # If all weights are zero (edge case), fall back to uniform sampling.
    if all(c["weight"] <= 0 for c in weighted_candidates):
        for c in weighted_candidates:
            c["weight"] = 1.0

    rng = random.Random(seed)
    chosen: list[SelectedPage] = []
    pool = weighted_candidates.copy()
    for _ in range(min(needed, len(pool))):
        weights = [float(c["weight"]) for c in pool]
        picked = rng.choices(pool, weights=weights, k=1)[0]
        chosen.append(picked)
        pool = [c for c in pool if c["page_url"] != picked["page_url"]]

    return chosen


def plan_node(state: AgentState) -> dict:
    """LangGraph node: plan which pages to promote and when."""
    storage = state["storage"]
    try:
        # Queue is the current pipeline state: drafted, approved, and published posts.
        queue = load_model(storage, "content_queue.json", ContentQueue)
        now = datetime.now(timezone.utc)

        # Only future-approved posts still occupy upcoming pipeline slots.
        future_approved = [d for d in queue.approved if d.scheduled_at and d.scheduled_at > now]
        existing = len(queue.drafts) + len(future_approved)
        needed = max(0, PIPELINE_TARGET - existing)
        if needed == 0:
            logger.info("Pipeline full (%d pending+approved), skipping planning", existing)
            storage.write("content_plan.json", ContentPlan())
            return {"plan_created": False}

        # Step 1: Draw new items.
        chosen, registry_total, history_pages = select_pages_for_plan(
            storage=storage,
            queue=queue,
            needed=needed,
            now=now,
        )

        if registry_total == 0:
            logger.info("No registry URLs found, skipping planning")
            storage.write("content_plan.json", ContentPlan())
            return {"plan_created": False}

        if not chosen:
            logger.info("No pages sampled, skipping planning")
            storage.write("content_plan.json", ContentPlan())
            return {"plan_created": False}

        # Step 2: Schedule new items.
        items = build_plan_items(queue=queue, selected_pages=chosen)

        # Diagnostics are lightweight run metrics for observability/debugging.
        diagnostics: dict[str, int | float | bool | str] = {
            "needed": needed,
            "existing_pipeline": existing,
            "registry_total": registry_total,
            "history_pages": history_pages,
            "selected_items": len(items),
            "selected_unique_urls": len({i.page_url for i in items}),
            "half_life_days": HALF_LIFE_DAYS,
            "channels": ",".join(DEFAULT_CHANNELS),
        }

        plan = ContentPlan(items=items, diagnostics=diagnostics)
        storage.write("content_plan.json", plan)

        logger.info(
            "Content plan created with %d items (pipeline: %d/%d)",
            len(items),
            existing,
            PIPELINE_TARGET,
        )
        return {"plan_created": len(plan.items) > 0}
    except Exception:
        logger.exception("Plan creation failed")
        storage.write("content_plan.json", ContentPlan())
        return {"plan_created": False}


def _find_last_scheduled_at(queue: ContentQueue) -> datetime | None:
    """Find the latest scheduled_at across pending + approved drafts."""
    latest: datetime | None = None
    for draft in queue.drafts + queue.approved:
        if draft.scheduled_at and (latest is None or draft.scheduled_at > latest):
            latest = draft.scheduled_at
    return latest


def select_pages_for_plan(
    storage,
    queue: ContentQueue,
    needed: int,
    now: datetime,
) -> tuple[list[SelectedPage], int, int]:
    """Step 1: select page URLs to promote using half-life weighted sampling.

    Returns:
    - selected pages
    - registry size
    - number of pages with publication history
    """
    registry_urls = _load_registry_urls(storage)
    if not registry_urls:
        return [], 0, 0

    seed_str = os.environ.get("PLAN_RANDOM_SEED")
    seed = int(seed_str) if seed_str else None
    last_days_by_url = _last_published_days(queue, now)
    chosen = _weighted_draw(
        registry_urls,
        last_days_by_url,
        needed,
        HALF_LIFE_DAYS,
        seed,
    )
    return chosen, len(registry_urls), len(last_days_by_url)


def build_plan_items(
    queue: ContentQueue, selected_pages: list[SelectedPage]
) -> list[ContentPlanItem]:
    """Step 2: assign channels/schedule and enrich selected pages to plan items."""
    if not selected_pages:
        return []

    schedule = plan_draft_schedule(queue, len(selected_pages), channels=DEFAULT_CHANNELS)
    page_urls = [str(c["page_url"]) for c in selected_pages]
    page_metas = fetch_pages_meta(page_urls)

    items: list[ContentPlanItem] = []
    for sampled, (channel, slot) in zip(selected_pages, schedule):
        page_url = str(sampled["page_url"])
        meta = page_metas.get(page_url)
        page_desc = (meta.description or "(no description)") if meta else "(no description)"
        page_title = (meta.title if meta else None) or _page_title_from_url(page_url)
        t_days = sampled["t_days"]
        if t_days is None:
            reason = "random draw from registry (unpublished page)"
        else:
            reason = (
                "random draw with half-life weighting "
                f"(last published {float(t_days):.1f} days ago)"
            )
        items.append(
            ContentPlanItem(
                page_url=page_url,
                page_title=page_title,
                page_description=page_desc,
                reason=reason,
                channel=channel,
                scheduled_at=slot,
            )
        )

    return items


def plan_draft_schedule(
    queue: ContentQueue,
    needed: int,
    now: datetime | None = None,
    channels: list[str] | None = None,
) -> list[tuple[str, datetime]]:
    """Plan (channel, scheduled_at) pairs for new drafts.

    Returns a list of ``needed`` tuples, alternating Mastodon/Bluesky,
    each scheduled 1 day apart starting from the latest existing slot + 1 day
    (or tomorrow 09:00 UTC if no existing slots).
    """
    if needed <= 0:
        return []

    if channels is None:
        channels = ["mastodon", "bluesky"]
    channels = [c for c in channels if c]
    if not channels:
        channels = ["mastodon", "bluesky"]

    if now is None:
        now = datetime.now(timezone.utc)

    last_scheduled = _find_last_scheduled_at(queue)

    if last_scheduled is None:
        tomorrow = now.replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=1)
        next_slot = tomorrow
        next_channel_idx = 0
    else:
        next_slot = last_scheduled + timedelta(days=1)
        next_channel_idx = 0
        for d in queue.drafts + queue.approved:
            if d.scheduled_at and d.scheduled_at == last_scheduled:
                if d.channel in channels:
                    next_channel_idx = (channels.index(d.channel) + 1) % len(channels)
                break

    schedule: list[tuple[str, datetime]] = []
    for _ in range(needed):
        next_channel = channels[next_channel_idx]
        schedule.append((next_channel, next_slot))
        next_slot += timedelta(days=1)
        next_channel_idx = (next_channel_idx + 1) % len(channels)

    return schedule


def create_plan(storage) -> ContentPlan:
    """Compatibility wrapper used by tests and direct callers.

    Delegates orchestration to ``plan_node`` and returns the persisted plan model.
    """
    plan_node({"storage": storage})
    return load_model(storage, "content_plan.json", ContentPlan)
