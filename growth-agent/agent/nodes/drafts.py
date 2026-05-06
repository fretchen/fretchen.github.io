"""Drafts node — LLM-based social media draft generation."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from urllib.parse import urlparse, urlunparse

from pydantic import BaseModel, Field

from agent.llm_client import LLMClient
from agent.models import ContentPlan, ContentQueue, Draft, DraftCritique, Strategy
from agent.state import AgentState
from agent.storage import load_model

logger = logging.getLogger("growth-agent")

# Channel-specific draft generation config
CHANNEL_CONFIG = {
    "mastodon": {"max_tokens": 300},
    "bluesky": {"max_tokens": 200},
}


class MastodonDraftOutput(BaseModel):
    """Structured Mastodon draft output with explicit hashtag list."""

    content: str = Field(description="Final Mastodon post text, including hashtags inline")
    hashtags: list[str] = Field(
        default_factory=list,
        description="2-3 hashtags used in the post, each prefixed with #",
    )


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


def _former_context_block(former_context: str) -> str:
    """Wrap former-post context in a prompt section. Returns empty string when no context."""
    if not former_context:
        return ""
    return f"""
--- PREVIOUSLY PUBLISHED FOR THIS PAGE ---
{former_context}
Rules: do not reuse the same opening hook or the exact same claim framing from the entries above.
------------------------------------------"""


def _mastodon_prompt(item, language: str, strategy: Strategy, former_context: str = "") -> str:
    url = f"{item.page_url}?utm_source=mastodon&utm_campaign=growth-agent"
    history_block = _former_context_block(former_context)
    if language == "de":
        return f"""Schreibe einen Mastodon-Post (max 500 Zeichen) über diesen Blog-Artikel:

URL: {url}
Titel: {item.page_title}
Zusammenfassung: {item.page_description}
Warum bewerben: {item.reason}
{history_block}
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
{history_block}
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


def _bluesky_prompt(item, language: str, strategy: Strategy, former_context: str = "") -> str:
    url = f"{item.page_url}?utm_source=bluesky&utm_campaign=growth-agent"
    history_block = _former_context_block(former_context)
    if language == "de":
        return f"""Schreibe einen Bluesky-Post (max 300 Zeichen) über diesen Blog-Artikel:

URL: {url}
Titel: {item.page_title}
Zusammenfassung: {item.page_description}
Warum bewerben: {item.reason}
{history_block}
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
{history_block}
Target audience: {strategy.target_audience}

Requirements:
- Concise, punchy hook
- Include the link
- No hashtags (Bluesky culture)
- Tone: {strategy.tone}

Return ONLY the post text, nothing else."""


def _critique_prompt(draft_content: str, channel: str, strategy: Strategy) -> str:
    """Generate a critique prompt for self-refine pattern."""
    platform_rules = (
        "Mastodon: max 500 chars, 2-3 hashtags, no excessive emojis"
        if channel == "mastodon"
        else "Bluesky: max 300 chars, NO hashtags, concise and punchy"
    )
    return f"""Critique this {channel} post for a technical blog.

Post to critique:
---
{draft_content}
---

Target audience: {strategy.target_audience}
Expected tone: {strategy.tone}
Platform rules: {platform_rules}

Evaluate:
1. Does the first line have a strong hook (question, bold claim, or surprising insight)?
2. Does it follow {channel} platform conventions?
3. Does it mention a specific insight or value proposition?
4. Is the link included?
5. Is the tone appropriate for the target audience?

Provide an overall quality score (0-100) and list any specific issues."""


def _refine_prompt(
    original_draft: str, critique: DraftCritique, channel: str, strategy: Strategy
) -> str:
    """Generate a refinement prompt based on critique feedback."""
    issues_str = ", ".join(critique.issues) if critique.issues else "minor improvements needed"
    return f"""Improve this {channel} post based on the critique.

Original post:
---
{original_draft}
---

Issues identified: {issues_str}
Suggestion: {critique.suggested_improvement}

Requirements:
- Fix the identified issues
- Keep the same link and core message
- Target audience: {strategy.target_audience}
- Tone: {strategy.tone}
- {"Max 500 chars, 2-3 hashtags" if channel == "mastodon" else "Max 300 chars, NO hashtags"}

Return ONLY the improved post text, nothing else."""


def _normalize_url(url: str) -> str:
    """Strip query string and fragment so UTM-decorated URLs match their canonical form."""
    p = urlparse(url)
    return urlunparse(p._replace(query="", fragment=""))


def _former_posts_context(queue: ContentQueue, page_url: str, channel: str, n: int = 3) -> str:
    """Return a formatted block of the N most recent published posts for this page+channel.

    Returns empty string when no history exists.
    """
    canonical = _normalize_url(page_url)
    matches = [
        d
        for d in queue.published
        if d.channel == channel and _normalize_url(d.link or "") == canonical
    ]
    if not matches:
        return ""

    matches.sort(key=lambda d: (d.published_at or d.created), reverse=True)
    lines = [f"Former posts for this page on {channel} (newest first):"]
    for i, d in enumerate(matches[:n], 1):
        ts = (d.published_at or d.created).strftime("%Y-%m-%d")
        preview = d.content[:140] + ("…" if len(d.content) > 140 else "")
        lines.append(f"{i}. [{ts}] {preview}")
    return "\n".join(lines)


def _normalize_hashtags(hashtags: list[str]) -> list[str]:
    """Normalize hashtag list to '#tag' format and preserve order."""
    normalized: list[str] = []
    seen: set[str] = set()
    for tag in hashtags:
        cleaned = tag.strip()
        if not cleaned:
            continue
        if not cleaned.startswith("#"):
            cleaned = f"#{cleaned}"
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(cleaned)
    return normalized


def _generate_mastodon_draft_structured(
    llm: LLMClient,
    prompt: str,
    strategy: Strategy,
    max_tokens: int,
) -> MastodonDraftOutput:
    """Generate Mastodon draft with explicit hashtags via structured output."""
    result = llm.structured_output(
        schema=MastodonDraftOutput,
        messages=[
            {"role": "system", "content": _system_prompt(strategy)},
            {
                "role": "user",
                "content": (
                    f"{prompt}\n\n"
                    "Return JSON with keys: content, hashtags. "
                    "Include hashtags both in content and in hashtags list."
                ),
            },
        ],
        max_tokens=max_tokens,
    )
    assert isinstance(result, MastodonDraftOutput)
    result.hashtags = _normalize_hashtags(result.hashtags)
    return result


def _refine_mastodon_draft_structured(
    llm: LLMClient,
    original: str,
    critique: DraftCritique,
    strategy: Strategy,
    max_tokens: int,
) -> MastodonDraftOutput | None:
    """Refine Mastodon draft and keep explicit hashtag list."""
    try:
        result = llm.structured_output(
            schema=MastodonDraftOutput,
            messages=[
                {"role": "system", "content": _system_prompt(strategy)},
                {
                    "role": "user",
                    "content": (
                        f"{_refine_prompt(original, critique, 'mastodon', strategy)}\n\n"
                        "Return JSON with keys: content, hashtags. "
                        "Include hashtags both in content and in hashtags list."
                    ),
                },
            ],
            max_tokens=max_tokens,
        )
        assert isinstance(result, MastodonDraftOutput)
        result.hashtags = _normalize_hashtags(result.hashtags)
        return result
    except Exception:
        logger.exception("Mastodon draft refinement failed")
        return None


def create_drafts(storage, plan: ContentPlan) -> int:
    """Generate social media draft posts from a content plan. Returns count.

    Uses Self-Refine pattern: generate → critique → refine (max 1 iteration).
    """
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
            former_context = _former_posts_context(queue, item.page_url, channel)
            prompt = prompt_fn(item, "en", strategy, former_context)
            max_tokens = config["max_tokens"]
            draft_hashtags: list[str] = []

            # Step 1: Generate initial draft
            if channel == "mastodon":
                generated = _generate_mastodon_draft_structured(
                    llm,
                    prompt,
                    strategy,
                    max_tokens,
                )
                draft_content = generated.content.strip()
                draft_hashtags = generated.hashtags
            else:
                result = llm.chat(
                    messages=[
                        {"role": "system", "content": _system_prompt(strategy)},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.8,
                    max_tokens=max_tokens,
                )
                draft_content = result["content"].strip()

            # Step 2: Self-critique
            critique = _critique_draft(llm, draft_content, channel, strategy)

            # Step 3: Refine if quality is below threshold
            quality_score = critique.overall_score
            quality_issues = critique.issues

            if critique.overall_score < 70 and critique.issues:
                logger.info(
                    "Draft for %s scored %d, refining (issues: %s)",
                    item.page_title,
                    critique.overall_score,
                    critique.issues,
                )
                refined_applied = False
                if channel == "mastodon":
                    refined = _refine_mastodon_draft_structured(
                        llm, draft_content, critique, strategy, max_tokens
                    )
                    if refined:
                        draft_content = refined.content.strip()
                        draft_hashtags = refined.hashtags
                        refined_applied = True
                else:
                    refined_content = _refine_draft(
                        llm,
                        draft_content,
                        critique,
                        channel,
                        strategy,
                        max_tokens,
                    )
                    if refined_content:
                        draft_content = refined_content
                        refined_applied = True

                if refined_applied:
                    # Re-critique to get updated score
                    new_critique = _critique_draft(llm, draft_content, channel, strategy)
                    quality_score = new_critique.overall_score
                    quality_issues = new_critique.issues
                    logger.info(
                        "Refined draft for %s, new score: %d",
                        item.page_title,
                        quality_score,
                    )

            new_drafts.append(
                Draft(
                    id=_make_draft_id(channel, "en", draft_index),
                    channel=channel,
                    language="en",
                    content=draft_content,
                    source_blog_post=item.page_title,
                    hashtags=draft_hashtags,
                    link=f"{item.page_url}?utm_source={channel}&utm_campaign=growth-agent",
                    scheduled_at=item.scheduled_at,
                    quality_score=quality_score,
                    quality_issues=quality_issues,
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


def _critique_draft(
    llm: LLMClient, content: str, channel: str, strategy: Strategy
) -> DraftCritique:
    """Critique a draft using structured output."""
    try:
        critique = llm.structured_output(
            schema=DraftCritique,
            messages=[
                {
                    "role": "system",
                    "content": "You are a social media quality reviewer. "
                    "Be constructive but honest.",
                },
                {
                    "role": "user",
                    "content": _critique_prompt(content, channel, strategy),
                },
            ],
        )
        assert isinstance(critique, DraftCritique)
        return critique
    except Exception:
        logger.exception("Draft critique failed, using default")
        return DraftCritique(
            has_strong_hook=True,
            follows_platform_conventions=True,
            mentions_specific_insight=True,
            includes_link=True,
            appropriate_tone=True,
            overall_score=70,
            issues=[],
            suggested_improvement="",
        )


def _refine_draft(
    llm: LLMClient,
    original: str,
    critique: DraftCritique,
    channel: str,
    strategy: Strategy,
    max_tokens: int,
) -> str | None:
    """Refine a draft based on critique feedback. Returns None on failure."""
    try:
        result = llm.chat(
            messages=[
                {"role": "system", "content": _system_prompt(strategy)},
                {
                    "role": "user",
                    "content": _refine_prompt(original, critique, channel, strategy),
                },
            ],
            temperature=0.7,
            max_tokens=max_tokens,
        )
        return result["content"].strip()
    except Exception:
        logger.exception("Draft refinement failed")
        return None
