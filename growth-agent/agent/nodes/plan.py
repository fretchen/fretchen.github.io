"""Plan node — decides what to post, when, and on which channel."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from math import ceil

from agent.models import (
    ContentPlan,
    ContentPlanItem,
    ContentQueue,
    LLMAnalysis,
)
from agent.page_meta import fetch_pages_meta
from agent.state import AgentState
from agent.storage import load_model

logger = logging.getLogger("growth-agent")

PIPELINE_TARGET = 10


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
    queue: ContentQueue, needed: int, now: datetime | None = None
) -> list[tuple[str, datetime]]:
    """Plan (channel, scheduled_at) pairs for new drafts.

    Returns a list of ``needed`` tuples, alternating Mastodon/Bluesky,
    each scheduled 1 day apart starting from the latest existing slot + 1 day
    (or tomorrow 09:00 UTC if no existing slots).
    """
    if needed <= 0:
        return []

    if now is None:
        now = datetime.now(timezone.utc)

    last_scheduled = _find_last_scheduled_at(queue)

    if last_scheduled is None:
        tomorrow = now.replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=1)
        next_slot = tomorrow
        next_channel = "mastodon"
    else:
        next_slot = last_scheduled + timedelta(days=1)
        # Continue alternation from last scheduled draft's channel
        next_channel = "mastodon"
        for d in queue.drafts + queue.approved:
            if d.scheduled_at and d.scheduled_at == last_scheduled:
                next_channel = "bluesky" if d.channel == "mastodon" else "mastodon"
                break

    schedule: list[tuple[str, datetime]] = []
    for _ in range(needed):
        schedule.append((next_channel, next_slot))
        next_slot += timedelta(days=1)
        next_channel = "bluesky" if next_channel == "mastodon" else "mastodon"

    return schedule


def create_plan(storage, analysis: LLMAnalysis) -> ContentPlan:
    """Create a content plan: decide what to post, when, on which channel.

    Checks pipeline depth, selects pages, schedules slots, fetches metadata.
    Writes content_plan.json for the drafts node to consume.
    """
    queue = load_model(storage, "content_queue.json", ContentQueue)

    # --- Pipeline depth check ---
    existing = len(queue.drafts) + len(queue.approved)
    needed = max(0, PIPELINE_TARGET - existing)
    if needed == 0:
        logger.info("Pipeline full (%d pending+approved), skipping planning", existing)
        plan = ContentPlan()
        storage.write("content_plan.json", plan)
        return plan

    pages_to_promote = analysis.best_pages_for_social[: ceil(needed / 2)]
    if not pages_to_promote:
        logger.info("No pages to promote")
        plan = ContentPlan()
        storage.write("content_plan.json", plan)
        return plan

    # --- Plan schedule ---
    schedule = plan_draft_schedule(queue, needed)

    # Fetch descriptions for pages to promote
    page_urls = [p.url for p in pages_to_promote]
    page_metas = fetch_pages_meta(page_urls)

    items: list[ContentPlanItem] = []
    schedule_iter = iter(schedule)

    for page in pages_to_promote:
        if len(items) >= needed:
            break

        meta = page_metas.get(page.url)
        page_desc = (meta.description or "(no description)") if meta else "(no description)"
        page_title = (meta.title or page.title) if meta else page.title

        for _ in range(2):  # up to 2 items per page (one per channel)
            if len(items) >= needed:
                break

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

    plan = ContentPlan(items=items)
    storage.write("content_plan.json", plan)
    logger.info(
        "Content plan created with %d items (pipeline: %d/%d)",
        len(items),
        existing,
        PIPELINE_TARGET,
    )
    return plan
