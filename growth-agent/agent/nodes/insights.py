"""Insights node — LLM-based analysis of analytics data."""

import logging
from datetime import datetime, timezone

from agent.llm_client import LLMClient
from agent.models import ContentQueue, Insights, LLMAnalysis, Performance, Strategy
from agent.page_meta import fetch_pages_meta
from agent.state import AgentState
from agent.storage import load_model
from agent.utils import normalize_url

logger = logging.getLogger("growth-agent")

INSIGHTS_REGISTRY_LIMIT = 30
INSIGHTS_CANDIDATE_TARGET = 5


def insights_node(state: AgentState) -> dict:
    """LangGraph node: generate LLM insights, update state."""
    try:
        generate_insights(state["storage"])
        return {"insights_ok": True}
    except Exception:
        logger.exception("Insight generation failed")
        return {"insights_ok": False}


def _build_page_engagement(performance: Performance, queue: ContentQueue) -> dict[str, dict]:
    """Aggregate Mastodon/Bluesky engagement metrics by canonical page URL."""
    published_by_id = {d.id: d for d in queue.published}
    page_engagement: dict[str, dict] = {}
    for pm in performance.posts:
        draft = published_by_id.get(pm.id)
        if not draft or not draft.link:
            continue
        url = normalize_url(draft.link)
        e = page_engagement.setdefault(url, {"favourites": 0, "reblogs": 0, "replies": 0, "posts": 0})
        e["favourites"] += pm.favourites
        e["reblogs"] += pm.reblogs
        e["replies"] += pm.replies
        e["posts"] += 1
    return page_engagement


def generate_insights(storage) -> LLMAnalysis:
    """Run LLM insight generation on current analytics data. Raises on failure."""
    insights = load_model(storage, "insights.json", Insights)
    strategy = load_model(storage, "strategy.json", Strategy)
    performance = load_model(storage, "performance.json", Performance)
    queue = load_model(storage, "content_queue.json", ContentQueue)

    llm = LLMClient.from_env()
    try:
        # Seed page descriptions from the sitemap registry (independent of analytics).
        clean_data = storage.read("registry_clean.json")
        page_urls = list(dict.fromkeys(
            normalize_url(u) for u in (clean_data or {}).get("urls", []) if isinstance(u, str)
        ))[:INSIGHTS_REGISTRY_LIMIT]
        page_metas = fetch_pages_meta(page_urls) if page_urls else {}
        page_desc_block = "\n".join(
            f"- {m.url}: {m.description or '(no description)'}" for m in page_metas.values()
        )

        # Build per-page social engagement from real Mastodon/Bluesky data.
        page_engagement = _build_page_engagement(performance, queue)
        if page_engagement:
            engagement_block = "\n".join(
                f"- {url}: {e['favourites']} favourites, {e['reblogs']} reblogs, {e['replies']} replies ({e['posts']} posts)"
                for url, e in sorted(
                    page_engagement.items(), key=lambda x: -(x[1]["favourites"] + x[1]["reblogs"])
                )
            )
        else:
            engagement_block = "(no social posts yet)"

        blog_url = strategy.website_url
        pillars = ", ".join(strategy.content_pillars)
        insight_prompt = f"""You are a social media growth analyst \
for a technical blog ({blog_url}).

The blog covers: {pillars}
Social channels: {", ".join(strategy.channels)}
Target audience: {strategy.target_audience}

Page descriptions (from the site):
{page_desc_block}

Social engagement by page (past 30 days, from Mastodon and Bluesky):
{engagement_block}

Based on this data, identify:
1. Which pages should be tested on social media next? Use the social engagement history to distinguish proven pages (prior engagement) from exploratory ones (not yet shared or low signal).
2. Suggest exactly 5 specific, actionable growth opportunities for Mastodon and Bluesky. Return them as plain text sentences — no markdown, no bullet symbols, no bold or italic markers.

For `best_pages_for_social`, return up to {INSIGHTS_CANDIDATE_TARGET} candidate pages.
Build a balanced candidate list with:
- `proven` pages: have prior engagement on Mastodon/Bluesky
- `exploratory` pages: relevant but not yet tested or with low signal

Set `selection_type` on each page to either `proven` or `exploratory`.
Aim for a mix that is mostly proven while still including exploratory
candidates when the data allows it."""

        result = llm.structured_output(
            schema=LLMAnalysis,
            messages=[
                {
                    "role": "system",
                    "content": "You are a data-driven social media growth analyst.",
                },
                {"role": "user", "content": insight_prompt},
            ],
        )
        assert isinstance(result, LLMAnalysis)

        insights.growth_opportunities = result.growth_opportunities
        insights.best_pages_for_social = result.best_pages_for_social
        insights.last_analysis = datetime.now(timezone.utc)
        storage.write("insights.json", insights)
        storage.write("llm_analysis.json", result)
        logger.info("LLM insights generated and persisted")
        return result

    finally:
        llm.close()
