"""Plan node — decides what to post, when, and on which channel."""

from __future__ import annotations

import logging
import math
import random
from datetime import date, datetime, timedelta, timezone
from typing import TypedDict
from urllib.parse import urlsplit, urlunsplit
from urllib.request import urlopen

from defusedxml import ElementTree as ET  # type: ignore[import-untyped]

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
SITEMAP_URL = "https://www.fretchen.eu/sitemap.xml"
REGISTRY_KEY = "registry.json"
REGISTRY_CLEAN_KEY = "registry_clean.json"
REGISTRY_EXCLUDED_KEY = "registry_excluded.json"


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


def _dedupe_urls(urls: list[str]) -> list[str]:
    seen: set[str] = set()
    unique: list[str] = []
    for url in urls:
        if url in seen:
            continue
        seen.add(url)
        unique.append(url)
    return unique


def _urls_from_payload(data: dict | None) -> list[str]:
    if not isinstance(data, dict) or not isinstance(data.get("urls"), list):
        return []
    urls = [_normalize_url(u) for u in data["urls"] if isinstance(u, str) and u.strip()]
    return _dedupe_urls(urls)


def _load_excluded_rules(storage) -> tuple[set[str], list[str]]:
    data = storage.read(REGISTRY_EXCLUDED_KEY)
    if not isinstance(data, dict):
        return set(), []

    excluded_urls = {
        _normalize_url(u) for u in data.get("urls", []) if isinstance(u, str) and u.strip()
    }
    prefixes = [p.strip() for p in data.get("prefixes", []) if isinstance(p, str) and p.strip()]
    return excluded_urls, prefixes


def _is_excluded(url: str, excluded_urls: set[str], prefixes: list[str]) -> bool:
    if url in excluded_urls:
        return True
    path = urlsplit(url).path or "/"
    return any(path.startswith(prefix) for prefix in prefixes)


def _fetch_sitemap_urls() -> list[str]:
    with urlopen(SITEMAP_URL) as response:
        raw_xml = response.read()

    root = ET.fromstring(raw_xml)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    loc_nodes = root.findall("sm:url/sm:loc", ns)
    urls = [_normalize_url(node.text or "") for node in loc_nodes]
    urls = [u for u in urls if u]
    return _dedupe_urls(urls)


def _prepare_registry_urls(storage) -> tuple[list[str], bool, int]:
    """Return cleaned registry URLs, refresh flag, and excluded_count.

    Option 2 storage convention uses top-level keys in growth-agent prefix.
    """
    clean_data = storage.read(REGISTRY_CLEAN_KEY)
    clean_urls = _urls_from_payload(clean_data)
    if clean_urls:
        excluded_count = 0
        if isinstance(clean_data, dict) and isinstance(clean_data.get("excluded_count"), int):
            excluded_count = clean_data["excluded_count"]
        return clean_urls, False, excluded_count

    # Build fresh registry from sitemap for MVP.
    try:
        registry_urls = _fetch_sitemap_urls()
    except Exception:
        logger.exception("Failed to build registry from sitemap")
        return [], False, 0

    excluded_urls, excluded_prefixes = _load_excluded_rules(storage)
    clean_urls = [
        url for url in registry_urls if not _is_excluded(url, excluded_urls, excluded_prefixes)
    ]
    excluded_count = len(registry_urls) - len(clean_urls)

    raw_payload = {
        "source": SITEMAP_URL,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "count": len(registry_urls),
        "urls": registry_urls,
    }
    clean_payload = {
        "source": SITEMAP_URL,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "count": len(clean_urls),
        "urls": clean_urls,
        "excluded_count": excluded_count,
    }
    storage.write(REGISTRY_KEY, raw_payload)
    storage.write(REGISTRY_CLEAN_KEY, clean_payload)
    logger.info(
        "Registry rebuilt from sitemap (raw=%d, clean=%d)",
        len(registry_urls),
        len(clean_urls),
    )
    return clean_urls, True, excluded_count


def _last_published_days(queue: ContentQueue, now: datetime) -> dict[str, float]:
    """Return days since last publication per page URL from queue.published."""

    def _to_utc_aware(ts: datetime) -> datetime:
        if ts.tzinfo is None:
            return ts.replace(tzinfo=timezone.utc)
        return ts.astimezone(timezone.utc)

    latest_by_url: dict[str, datetime] = {}
    for draft in queue.published:
        if not draft.link:
            continue
        page_url = _normalize_url(draft.link)
        ts = _to_utc_aware(draft.scheduled_at or draft.created)
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

    rng = random.Random()
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
        chosen, registry_total, history_pages, registry_refreshed, excluded_count = (
            select_pages_for_plan(
                storage=storage,
                queue=queue,
                needed=needed,
                now=now,
            )
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
            "registry_refreshed": registry_refreshed,
            "excluded_count": excluded_count,
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


def _pending_pipeline_urls(queue: ContentQueue, now: datetime) -> set[str]:
    """URLs already represented in pending pipeline items.

    Includes all draft links and only future approved links because those still
    occupy upcoming schedule slots.
    """
    blocked: set[str] = set()

    for draft in queue.drafts:
        if draft.link:
            blocked.add(_normalize_url(draft.link))

    for draft in queue.approved:
        if draft.link and draft.scheduled_at and draft.scheduled_at > now:
            blocked.add(_normalize_url(draft.link))

    return blocked


def select_pages_for_plan(
    storage,
    queue: ContentQueue,
    needed: int,
    now: datetime,
) -> tuple[list[SelectedPage], int, int, bool, int]:
    """Step 1: select page URLs to promote using half-life weighted sampling.

    Returns:
    - selected pages
    - registry size
    - number of pages with publication history
    """
    registry_urls, registry_refreshed, excluded_count = _prepare_registry_urls(storage)
    if not registry_urls:
        return [], 0, 0, registry_refreshed, excluded_count

    blocked_urls = _pending_pipeline_urls(queue, now)
    draw_urls = [url for url in registry_urls if url not in blocked_urls]

    last_days_by_url = _last_published_days(queue, now)
    chosen = _weighted_draw(
        draw_urls,
        last_days_by_url,
        needed,
        HALF_LIFE_DAYS,
    )
    return (
        chosen,
        len(registry_urls),
        len(last_days_by_url),
        registry_refreshed,
        excluded_count,
    )


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

    Returns a list of ``needed`` tuples, one slot per day, filling the earliest
    free calendar holes from tomorrow 09:00 UTC onward.

    Occupied days come from already scheduled drafts and future-approved drafts.
    Channel assignment alternates deterministically and continues from channels
    already present on occupied days where possible.
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

    def _to_utc_aware(ts: datetime) -> datetime:
        if ts.tzinfo is None:
            return ts.replace(tzinfo=timezone.utc)
        return ts.astimezone(timezone.utc)

    start_slot = now.replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=1)

    occupied_days: set[date] = set()
    occupied_channel_by_day: dict[date, str] = {}

    for d in queue.drafts:
        if not d.scheduled_at:
            continue
        slot = _to_utc_aware(d.scheduled_at)
        if slot.date() < start_slot.date():
            continue
        day = slot.date()
        occupied_days.add(day)
        if day not in occupied_channel_by_day and d.channel in channels:
            occupied_channel_by_day[day] = d.channel

    for d in queue.approved:
        if not d.scheduled_at:
            continue
        slot = _to_utc_aware(d.scheduled_at)
        if slot <= now:
            continue
        if slot.date() < start_slot.date():
            continue
        day = slot.date()
        occupied_days.add(day)
        if day not in occupied_channel_by_day and d.channel in channels:
            occupied_channel_by_day[day] = d.channel

    schedule: list[tuple[str, datetime]] = []
    next_slot = start_slot
    next_channel_idx = 0
    while len(schedule) < needed:
        day = next_slot.date()
        if day in occupied_days:
            existing_channel = occupied_channel_by_day.get(day)
            if existing_channel in channels:
                next_channel_idx = (channels.index(existing_channel) + 1) % len(channels)
            next_slot += timedelta(days=1)
            continue

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
