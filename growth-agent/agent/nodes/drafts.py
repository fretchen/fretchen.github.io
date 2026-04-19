"""Drafts node — LLM-based social media draft generation with scheduling."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta, timezone
from math import ceil

from agent.llm_client import LLMClient
from agent.models import ContentQueue, Draft, LLMAnalysis, Strategy
from agent.page_meta import fetch_pages_meta
from agent.storage import load_model

logger = logging.getLogger("growth-agent")

PIPELINE_TARGET = 10

# Channel-specific draft generation config
CHANNEL_CONFIG = {
    "mastodon": {"max_tokens": 300},
    "bluesky": {"max_tokens": 200},
}


def _make_draft_id(channel: str, language: str, index: int = 0) -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"draft_{channel}_{language}_{ts}_{index}"


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


def _system_prompt(strategy: Strategy) -> str:
    pillars = ", ".join(strategy.content_pillars)
    return (
        f"You write engaging social media posts for a technical blog ({strategy.website_url}). "
        f"The blog covers: {pillars}. "
        f"Target audience: {strategy.target_audience}. "
        f"Tone: {strategy.tone}. "
        "Be concise and punchy."
    )


def _mastodon_prompt(page, title: str, description: str, language: str, strategy: Strategy) -> str:
    url = f"{page.url}?utm_source=mastodon&utm_campaign=growth-agent"
    if language == "de":
        return f"""Schreibe einen Mastodon-Post (max 500 Zeichen) über diesen Blog-Artikel:

URL: {url}
Titel: {title}
Zusammenfassung: {description}
Warum bewerben: {page.reason}

Anforderungen:
- Hook im ersten Satz (Frage oder starke These)
- Ein konkretes Insight aus dem Artikel erwähnen
- Link einbinden
- 2-3 relevante Hashtags
- Duzen, nicht Siezen
- Ton: {strategy.tone}

Gib NUR den Post-Text zurück, nichts anderes."""

    pillars = ", ".join(strategy.content_pillars)
    return f"""Write a Mastodon post (max 500 characters) about this blog article:

URL: {url}
Title: {title}
Article summary: {description}
Why promote: {page.reason}

Context: {strategy.website_url} covers {pillars}.
Target audience: {strategy.target_audience}

Requirements:
- Hook in the first line (question or bold claim)
- Mention one specific insight from the article topic
- Include the link
- Add 2-3 relevant hashtags
- Tone: {strategy.tone}

Do NOT use emojis excessively. One is fine.
Return ONLY the post text, nothing else."""


def _bluesky_prompt(page, title: str, description: str, language: str, strategy: Strategy) -> str:
    url = f"{page.url}?utm_source=bluesky&utm_campaign=growth-agent"
    if language == "de":
        return f"""Schreibe einen Bluesky-Post (max 300 Zeichen) über diesen Blog-Artikel:

URL: {url}
Titel: {title}
Zusammenfassung: {description}
Warum bewerben: {page.reason}

Anforderungen:
- Knackiger Hook
- Link einbinden
- Keine Hashtags (Bluesky-Kultur)
- Ton: {strategy.tone}

Gib NUR den Post-Text zurück, nichts anderes."""

    return f"""Write a Bluesky post (max 300 characters) about this blog article:

URL: {url}
Title: {title}
Article summary: {description}
Why promote: {page.reason}

Target audience: {strategy.target_audience}

Requirements:
- Concise, punchy hook
- Include the link
- No hashtags (Bluesky culture)
- Tone: {strategy.tone}

Return ONLY the post text, nothing else."""


def create_drafts(storage, analysis: LLMAnalysis) -> int:
    """Generate social media draft posts from LLM analysis. Returns count.

    Maintains a pipeline of PIPELINE_TARGET drafts (pending + approved).
    Each draft is auto-scheduled 1 day after the previous, alternating
    Mastodon and Bluesky channels.
    """
    strategy = load_model(storage, "strategy.json", Strategy)
    queue = load_model(storage, "content_queue.json", ContentQueue)

    # --- Pipeline depth check ---
    existing = len(queue.drafts) + len(queue.approved)
    needed = max(0, PIPELINE_TARGET - existing)
    if needed == 0:
        logger.info("Pipeline full (%d pending+approved), skipping draft creation", existing)
        return 0

    pages_to_promote = analysis.best_pages_for_social[: ceil(needed / 2)]
    if not pages_to_promote:
        logger.info("No pages to promote")
        return 0

    # --- Plan schedule ---
    schedule = plan_draft_schedule(queue, needed)

    # Fetch descriptions for pages to promote
    page_urls = [p.url for p in pages_to_promote]
    page_metas = fetch_pages_meta(page_urls)

    llm = LLMClient(api_token=os.environ["IONOS_API_TOKEN"])
    new_drafts: list[Draft] = []
    draft_index = 0
    schedule_iter = iter(schedule)

    try:
        for page in pages_to_promote:
            if len(new_drafts) >= needed:
                break

            meta = page_metas.get(page.url)
            page_desc = (meta.description or "(no description)") if meta else "(no description)"
            page_title = (meta.title or page.title) if meta else page.title

            for _ in range(2):  # up to 2 drafts per page
                if len(new_drafts) >= needed:
                    break

                channel, slot = next(schedule_iter)
                config = CHANNEL_CONFIG[channel]
                prompt_fn = _mastodon_prompt if channel == "mastodon" else _bluesky_prompt
                prompt = prompt_fn(page, page_title, page_desc, "en", strategy)
                max_tokens = config["max_tokens"]

                result = llm.chat(
                    messages=[
                        {"role": "system", "content": _system_prompt(strategy)},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.8,
                    max_tokens=max_tokens,
                )
                new_drafts.append(
                    Draft(
                        id=_make_draft_id(channel, "en", draft_index),
                        channel=channel,
                        language="en",
                        content=result["content"].strip(),
                        source_blog_post=page_title,
                        link=f"{page.url}?utm_source={channel}&utm_campaign=growth-agent",
                        scheduled_at=slot,
                    )
                )
                draft_index += 1

    except Exception:
        logger.exception("Draft creation failed")
    finally:
        llm.close()

    queue.drafts.extend(new_drafts)
    storage.write("content_queue.json", queue)
    total = existing + len(new_drafts)
    logger.info(
        "Created %d new drafts (pipeline: %d/%d)",
        len(new_drafts),
        total,
        PIPELINE_TARGET,
    )
    return len(new_drafts)
