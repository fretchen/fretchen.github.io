"""Plan node — decides what to post, when, and on which channel."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from agent.models import (
    ContentPlan,
    ContentPlanItem,
    ContentQueue,
    LLMAnalysis,
    PageForSocial,
    PlanningMemory,
    PlanningMemoryEntry,
    Strategy,
)
from agent.page_meta import fetch_pages_meta
from agent.state import AgentState
from agent.storage import load_model

logger = logging.getLogger("growth-agent")

PIPELINE_TARGET = 10
EXPLORATORY_FRACTION = 0.3
PLANNING_MEMORY_MAX_ENTRIES = 50


def _dedupe_pages(pages: list[PageForSocial]) -> list[PageForSocial]:
    """Keep first occurrence of each URL."""
    unique: list[PageForSocial] = []
    seen_urls: set[str] = set()
    for page in pages:
        if page.url in seen_urls:
            continue
        seen_urls.add(page.url)
        unique.append(page)
    return unique


def _select_pages_to_promote(
    candidates: list[PageForSocial], needed: int, exploratory_fraction: float
) -> list[PageForSocial]:
    """Select a broader mix of proven and exploratory pages.

    Prefer unique URLs first. Only fall back to duplicates when the candidate
    pool is too small to fill the pipeline.
    """
    if needed <= 0 or not candidates:
        return []

    unique_candidates = _dedupe_pages(candidates)
    proven = [p for p in unique_candidates if p.selection_type != "exploratory"]
    exploratory = [p for p in unique_candidates if p.selection_type == "exploratory"]

    target_unique = min(len(unique_candidates), needed)
    exploratory_target = 0
    if proven and exploratory:
        exploratory_target = min(
            len(exploratory),
            max(1, round(target_unique * exploratory_fraction)),
        )
    elif exploratory:
        exploratory_target = min(len(exploratory), target_unique)
    proven_target = min(len(proven), target_unique - exploratory_target)

    selected: list[PageForSocial] = []
    proven_pool = proven[:proven_target]
    exploratory_pool = exploratory[:exploratory_target]

    while len(selected) < target_unique and (proven_pool or exploratory_pool):
        if proven_pool:
            selected.append(proven_pool.pop(0))
        if len(selected) >= target_unique:
            break
        if proven_pool:
            selected.append(proven_pool.pop(0))
        if len(selected) >= target_unique:
            break
        if exploratory_pool:
            selected.append(exploratory_pool.pop(0))

    remaining_unique = [
        p for p in unique_candidates if p.url not in {s.url for s in selected}
    ]
    for page in remaining_unique:
        if len(selected) >= target_unique:
            break
        selected.append(page)

    fallback_index = 0
    while len(selected) < needed and candidates:
        selected.append(candidates[fallback_index % len(candidates)])
        fallback_index += 1

    return selected


def _collect_recent_urls(
    queue: ContentQueue,
    planning_memory: PlanningMemory,
    now: datetime,
    cooldown_days: int,
) -> set[str]:
    """Collect URLs that should be cooled down based on recent queue/memory usage."""
    if cooldown_days <= 0:
        return set()

    cutoff = now - timedelta(days=cooldown_days)
    recent_urls: set[str] = set()

    for draft in queue.drafts + queue.approved + queue.published:
        url = draft.link
        if not url:
            continue
        ts = draft.scheduled_at or draft.created
        if ts and ts >= cutoff:
            recent_urls.add(url.split("?")[0])

    for entry in planning_memory.entries:
        if entry.run_at >= cutoff:
            recent_urls.update(entry.selected_urls)

    return recent_urls


def _filter_recent_candidates(
    candidates: list[PageForSocial], recent_urls: set[str]
) -> tuple[list[PageForSocial], list[PageForSocial]]:
    """Filter candidates that were recently used; return kept and blocked lists."""
    kept: list[PageForSocial] = []
    blocked: list[PageForSocial] = []
    for page in candidates:
        if page.url in recent_urls:
            blocked.append(page)
        else:
            kept.append(page)
    return kept, blocked


def plan_node(state: AgentState) -> dict:
    """LangGraph node: plan which pages to promote and when."""
    storage = state["storage"]
    try:
        analysis_data = storage.read("llm_analysis.json")
        if analysis_data:
            analysis = LLMAnalysis.model_validate(analysis_data)
            plan = create_plan(storage, analysis)
            return {"plan_created": len(plan.items) > 0}
        else:
            logger.info("No saved LLM analysis — skipping planning")
            storage.write("content_plan.json", ContentPlan())
            return {"plan_created": False}
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
        tomorrow = now.replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(
            days=1
        )
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


def create_plan(storage, analysis: LLMAnalysis) -> ContentPlan:
    """Create a content plan: decide what to post, when, on which channel.

    Checks pipeline depth, selects pages, schedules slots, fetches metadata.
    Writes content_plan.json for the drafts node to consume.
    """
    queue = load_model(storage, "content_queue.json", ContentQueue)
    strategy = load_model(storage, "strategy.json", Strategy)
    planning_memory = load_model(storage, "planning_memory.json", PlanningMemory)

    # --- Pipeline depth check ---
    # Exclude approved drafts due for publishing (scheduled_at <= now),
    # since the publish node will remove them later in this same run.
    now = datetime.now(timezone.utc)
    future_approved = [
        d for d in queue.approved if d.scheduled_at and d.scheduled_at > now
    ]
    existing = len(queue.drafts) + len(future_approved)
    needed = max(0, PIPELINE_TARGET - existing)
    if needed == 0:
        logger.info("Pipeline full (%d pending+approved), skipping planning", existing)
        plan = ContentPlan()
        storage.write("content_plan.json", plan)
        return plan

    recent_urls = _collect_recent_urls(
        queue,
        planning_memory,
        now,
        max(0, strategy.planning_cooldown_days),
    )
    filtered_candidates, blocked_candidates = _filter_recent_candidates(
        analysis.best_pages_for_social,
        recent_urls,
    )
    selection_candidates = filtered_candidates or analysis.best_pages_for_social

    exploratory_fraction = strategy.planning_exploratory_fraction
    if exploratory_fraction < 0:
        exploratory_fraction = 0.0
    if exploratory_fraction > 1:
        exploratory_fraction = 1.0

    pages_to_promote = _select_pages_to_promote(
        selection_candidates,
        needed,
        exploratory_fraction,
    )
    if not pages_to_promote:
        logger.info("No pages to promote")
        plan = ContentPlan()
        storage.write("content_plan.json", plan)
        return plan

    # --- Plan schedule ---
    schedule = plan_draft_schedule(queue, needed, channels=strategy.channels)

    # Fetch descriptions for pages to promote
    page_urls = list(dict.fromkeys(p.url for p in pages_to_promote))
    page_metas = fetch_pages_meta(page_urls)

    items: list[ContentPlanItem] = []
    schedule_iter = iter(schedule)

    for page in pages_to_promote:
        if len(items) >= needed:
            break

        meta = page_metas.get(page.url)
        page_desc = (
            (meta.description or "(no description)") if meta else "(no description)"
        )
        page_title = (meta.title or page.title) if meta else page.title

        channel, slot = next(schedule_iter)
        items.append(
            ContentPlanItem(
                page_url=page.url,
                page_title=page_title,
                page_description=page_desc,
                reason=page.reason,
                channel=channel,
                scheduled_at=slot,
            )
        )

    selected_urls = list(dict.fromkeys([item.page_url for item in items]))
    selected_exploratory = sum(
        1 for p in pages_to_promote if p.selection_type == "exploratory"
    )
    diagnostics: dict[str, int | float | bool | str] = {
        "needed": needed,
        "existing_pipeline": existing,
        "candidate_total": len(analysis.best_pages_for_social),
        "candidate_after_cooldown": len(filtered_candidates),
        "blocked_recent": len({p.url for p in blocked_candidates}),
        "selected_items": len(items),
        "selected_unique_urls": len(selected_urls),
        "selected_exploratory": selected_exploratory,
        "selected_proven": max(0, len(pages_to_promote) - selected_exploratory),
        "cooldown_days": max(0, strategy.planning_cooldown_days),
        "exploratory_fraction": exploratory_fraction,
        "used_fallback_candidates": bool(
            not filtered_candidates and blocked_candidates
        ),
        "strategy_channels": ",".join(strategy.channels),
    }

    plan = ContentPlan(items=items, diagnostics=diagnostics)
    storage.write("content_plan.json", plan)

    planning_memory.entries.append(
        PlanningMemoryEntry(
            run_at=now,
            needed=needed,
            selected_urls=selected_urls,
            blocked_recent_urls=sorted({p.url for p in blocked_candidates}),
            policy_snapshot={
                "planning_cooldown_days": max(0, strategy.planning_cooldown_days),
                "planning_exploratory_fraction": exploratory_fraction,
                "channels": ",".join(strategy.channels),
            },
            diagnostics=diagnostics,
        )
    )
    planning_memory.entries = planning_memory.entries[-PLANNING_MEMORY_MAX_ENTRIES:]
    storage.write("planning_memory.json", planning_memory)

    logger.info(
        "Content plan created with %d items (pipeline: %d/%d, blocked_recent=%d)",
        len(items),
        existing,
        PIPELINE_TARGET,
        diagnostics["blocked_recent"],
    )
    return plan
