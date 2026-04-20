"""Drafts node — LLM-based social media draft generation."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

from agent.llm_client import LLMClient
from agent.models import ContentPlan, ContentQueue, Draft, Strategy
from agent.state import AgentState
from agent.storage import load_model

logger = logging.getLogger("growth-agent")

# Channel-specific draft generation config
CHANNEL_CONFIG = {
    "mastodon": {"max_tokens": 300},
    "bluesky": {"max_tokens": 200},
}


def drafts_node(state: AgentState) -> dict:
    """LangGraph node: generate draft posts from the content plan."""
    storage = state["storage"]
    try:
        plan = load_model(storage, "content_plan.json", ContentPlan)
        if not plan.items:
            logger.info("Content plan is empty — skipping draft creation")
            return {"drafts_created": 0}
        count = create_drafts(storage, plan)
        return {"drafts_created": count}
    except Exception:
        logger.exception("Draft pipeline refill failed")
        return {"drafts_created": 0}


def _make_draft_id(channel: str, language: str, index: int = 0) -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"draft_{channel}_{language}_{ts}_{index}"


def _system_prompt(strategy: Strategy) -> str:
    pillars = ", ".join(strategy.content_pillars)
    return (
        f"You write engaging social media posts for a technical blog ({strategy.website_url}). "
        f"The blog covers: {pillars}. "
        f"Target audience: {strategy.target_audience}. "
        f"Tone: {strategy.tone}. "
        "Be concise and punchy."
    )


def _mastodon_prompt(item, language: str, strategy: Strategy) -> str:
    url = f"{item.page_url}?utm_source=mastodon&utm_campaign=growth-agent"
    if language == "de":
        return f"""Schreibe einen Mastodon-Post (max 500 Zeichen) über diesen Blog-Artikel:

URL: {url}
Titel: {item.page_title}
Zusammenfassung: {item.page_description}
Warum bewerben: {item.reason}

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
Title: {item.page_title}
Article summary: {item.page_description}
Why promote: {item.reason}

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


def _bluesky_prompt(item, language: str, strategy: Strategy) -> str:
    url = f"{item.page_url}?utm_source=bluesky&utm_campaign=growth-agent"
    if language == "de":
        return f"""Schreibe einen Bluesky-Post (max 300 Zeichen) über diesen Blog-Artikel:

URL: {url}
Titel: {item.page_title}
Zusammenfassung: {item.page_description}
Warum bewerben: {item.reason}

Anforderungen:
- Knackiger Hook
- Link einbinden
- Keine Hashtags (Bluesky-Kultur)
- Ton: {strategy.tone}

Gib NUR den Post-Text zurück, nichts anderes."""

    return f"""Write a Bluesky post (max 300 characters) about this blog article:

URL: {url}
Title: {item.page_title}
Article summary: {item.page_description}
Why promote: {item.reason}

Target audience: {strategy.target_audience}

Requirements:
- Concise, punchy hook
- Include the link
- No hashtags (Bluesky culture)
- Tone: {strategy.tone}

Return ONLY the post text, nothing else."""


def create_drafts(storage, plan: ContentPlan) -> int:
    """Generate social media draft posts from a content plan. Returns count."""
    strategy = load_model(storage, "strategy.json", Strategy)
    queue = load_model(storage, "content_queue.json", ContentQueue)

    llm = LLMClient(api_token=os.environ["IONOS_API_TOKEN"])
    new_drafts: list[Draft] = []
    draft_index = 0

    try:
        for item in plan.items:
            channel = item.channel
            if channel not in CHANNEL_CONFIG:
                logger.warning(
                    "Unknown channel %r for plan item %s — skipping",
                    channel,
                    item.page_title,
                )
                continue
            config = CHANNEL_CONFIG[channel]
            prompt_fn = {"mastodon": _mastodon_prompt, "bluesky": _bluesky_prompt}[channel]
            prompt = prompt_fn(item, "en", strategy)
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
                    source_blog_post=item.page_title,
                    link=f"{item.page_url}?utm_source={channel}&utm_campaign=growth-agent",
                    scheduled_at=item.scheduled_at,
                )
            )
            draft_index += 1

    except Exception:
        logger.exception("Draft creation failed")
    finally:
        llm.close()

    queue.drafts.extend(new_drafts)
    storage.write("content_queue.json", queue)
    logger.info("Created %d new drafts", len(new_drafts))
    return len(new_drafts)
