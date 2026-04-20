"""Strategy node — LLM adjusts content strategy based on insights."""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone

from agent.llm_client import LLMClient
from agent.models import Insights, Strategy, StrategyAdjustment, StrategyChange
from agent.state import AgentState
from agent.storage import load_model

logger = logging.getLogger("growth-agent")


def strategy_node(state: AgentState) -> dict:
    """LangGraph node: adjust strategy based on insights, update state."""
    try:
        updated = adjust_strategy(state["storage"])
        return {"strategy_updated": updated}
    except Exception:
        logger.exception("Strategy adjustment failed")
        return {"strategy_updated": False}


def adjust_strategy(storage) -> bool:
    """Evaluate whether strategy should change and apply max 1 adjustment.

    Reads insights.json + strategy.json, asks LLM for recommendation,
    applies at most 1 pillar change + 1 frequency change per run.
    Returns True if any change was applied.
    """
    insights = load_model(storage, "insights.json", Insights)
    strategy = load_model(storage, "strategy.json", Strategy)

    llm = LLMClient(api_token=os.environ["IONOS_API_TOKEN"])
    try:
        adjustment = _get_adjustment(llm, insights, strategy)

        if not adjustment.should_adjust:
            logger.info("Strategy: no adjustment recommended — %s", adjustment.reasoning)
            return False

        now = datetime.now(timezone.utc)
        changed = False

        # Apply at most 1 pillar change
        if (
            adjustment.pillar_change
            and adjustment.pillar_to_replace
            and adjustment.pillar_to_replace in strategy.content_pillars
        ):
            old_pillars = strategy.content_pillars.copy()
            idx = strategy.content_pillars.index(adjustment.pillar_to_replace)
            strategy.content_pillars[idx] = adjustment.pillar_change
            strategy.changes.append(
                StrategyChange(
                    timestamp=now,
                    field="content_pillars",
                    old_value=json.dumps(old_pillars),
                    new_value=json.dumps(strategy.content_pillars),
                    reason=adjustment.reasoning,
                )
            )
            changed = True
            logger.info(
                "Strategy: replaced pillar %r → %r",
                adjustment.pillar_to_replace,
                adjustment.pillar_change,
            )

        # Apply at most 1 frequency change
        if (
            adjustment.frequency_channel
            and adjustment.frequency_new_value is not None
            and adjustment.frequency_channel in strategy.posting_frequency
        ):
            old_freq = strategy.posting_frequency[adjustment.frequency_channel]
            strategy.posting_frequency[adjustment.frequency_channel] = (
                adjustment.frequency_new_value
            )
            strategy.changes.append(
                StrategyChange(
                    timestamp=now,
                    field=f"posting_frequency.{adjustment.frequency_channel}",
                    old_value=str(old_freq),
                    new_value=str(adjustment.frequency_new_value),
                    reason=adjustment.reasoning,
                )
            )
            changed = True
            logger.info(
                "Strategy: %s frequency %d → %d",
                adjustment.frequency_channel,
                old_freq,
                adjustment.frequency_new_value,
            )

        if changed:
            storage.write("strategy.json", strategy)

        return changed

    except Exception:
        logger.exception("Strategy adjustment failed")
        return False
    finally:
        llm.close()


def _format_changes(strategy: Strategy) -> str:
    """Format recent strategy changes for the LLM prompt."""
    if not strategy.changes:
        return "None yet"
    recent = [c.model_dump() for c in strategy.changes[-3:]]
    return json.dumps(recent, default=str)


def _get_adjustment(llm: LLMClient, insights: Insights, strategy: Strategy) -> StrategyAdjustment:
    """Ask LLM whether and how to adjust the strategy."""
    social_summary = ", ".join(
        f"{platform}: {m.followers} followers" for platform, m in insights.social_metrics.items()
    )

    prompt = f"""You are a social media growth strategist for a technical blog.

Current strategy:
- Content pillars: {json.dumps(strategy.content_pillars)}
- Channels: {json.dumps(strategy.channels)}
- Posting frequency: {json.dumps(strategy.posting_frequency)}
- Target audience: {strategy.target_audience}
- Tone: {strategy.tone}

Recent analytics (last 7 days):
- Pageviews: {insights.website_analytics.pageviews}
- Unique visitors: {insights.website_analytics.visitors}
- Bounces: {insights.website_analytics.bounces}
- Top pages: {json.dumps(insights.website_analytics.top_pages[:5])}
- Top referrers: {json.dumps(insights.website_analytics.top_referrers[:5])}
- Social followers: {social_summary or "no data"}
- Growth opportunities identified: {json.dumps(insights.growth_opportunities[:3])}

Recent strategy changes (audit log):
{_format_changes(strategy)}

Based on this data, should we adjust the content strategy?

Rules:
- Only suggest changes if there is clear evidence from the data
- At most 1 pillar replacement (replace the least effective pillar)
- At most 1 frequency adjustment (increase or decrease for one channel)
- Do NOT suggest changes just for the sake of change
- If the current strategy is working well, set should_adjust to false"""

    result = llm.structured_output(
        schema=StrategyAdjustment,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a conservative strategy advisor. "
                    "Only recommend changes with clear data support."
                ),
            },
            {"role": "user", "content": prompt},
        ],
    )
    assert isinstance(result, StrategyAdjustment)
    return result
