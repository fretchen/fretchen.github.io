"""Insights node — LLM-based analysis of analytics data."""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone

from agent.llm_client import LLMClient
from agent.models import Insights, LLMAnalysis, Strategy
from agent.page_meta import fetch_pages_meta
from agent.storage import load_model

logger = logging.getLogger("growth-agent")


def generate_insights(storage) -> LLMAnalysis | None:
    """Run LLM insight generation on current analytics data."""
    insights = load_model(storage, "insights.json", Insights)
    strategy = load_model(storage, "strategy.json", Strategy)

    llm = LLMClient(api_token=os.environ["IONOS_API_TOKEN"])
    try:
        # Fetch page descriptions for the top pages
        page_urls = [
            f"https://fretchen.eu{p.get('x', p.get('name', ''))}"
            for p in insights.website_analytics.top_pages[:10]
            if p.get("x") or p.get("name")
        ]
        page_metas = fetch_pages_meta(page_urls) if page_urls else {}
        page_desc_block = "\n".join(
            f"- {m.url}: {m.description or '(no description)'}" for m in page_metas.values()
        )

        blog_url = strategy.website_url
        pillars = ", ".join(strategy.content_pillars)
        insight_prompt = f"""You are a social media growth analyst \
for a technical blog ({blog_url}).

The blog covers: {pillars}
Social channels: {", ".join(strategy.channels)}
Target audience: {strategy.target_audience}

Here is the website analytics data from the last 7 days:

Summary:
- Pageviews: {insights.website_analytics.pageviews}
- Unique visitors: {insights.website_analytics.visitors}
- Visits: {insights.website_analytics.visits}
- Bounces: {insights.website_analytics.bounces}

Top pages:
{json.dumps(insights.website_analytics.top_pages[:10], indent=2)}

Page descriptions (from the site):
{page_desc_block}

Top referrers:
{json.dumps(insights.website_analytics.top_referrers[:10], indent=2)}

Tracked events (user engagement funnels):
{json.dumps(insights.website_analytics.top_events[:10], indent=2)}

Based on this data, identify:
1. Which blog topics have the most visitor interest?
2. Where is traffic coming from? Any social media referrals?
3. Which pages would make the best social media content to share?
4. What content gaps exist — popular topics with no recent social posts?
5. Suggest 3-5 specific, actionable growth opportunities for Mastodon and Bluesky."""

        analysis = llm.structured_output(
            schema=LLMAnalysis,
            messages=[
                {
                    "role": "system",
                    "content": "You are a data-driven social media growth analyst.",
                },
                {"role": "user", "content": insight_prompt},
            ],
        )

        insights.growth_opportunities = analysis.growth_opportunities
        insights.last_analysis = datetime.now(timezone.utc)
        storage.write("insights.json", insights)
        storage.write("llm_analysis.json", analysis)
        logger.info("LLM insights generated and persisted")
        return analysis

    except Exception:
        logger.exception("Insight generation failed")
        return None
    finally:
        llm.close()
