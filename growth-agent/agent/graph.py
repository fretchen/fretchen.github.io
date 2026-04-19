"""LangGraph workflow definition for the Growth Agent."""

from __future__ import annotations

import logging
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from agent.models import LLMAnalysis
from agent.nodes.drafts import create_drafts
from agent.nodes.ingest import ingest_analytics
from agent.nodes.insights import generate_insights
from agent.nodes.publish import publish_approved_drafts

logger = logging.getLogger("growth-agent")


class AgentState(TypedDict, total=False):
    """State flowing through the growth-agent graph."""

    storage: Any
    is_monday: bool
    analytics_ok: bool
    published_ids: list[str]
    insights_ok: bool
    drafts_created: int


# ---------------------------------------------------------------------------
# Node functions
# ---------------------------------------------------------------------------


def _ingest_node(state: AgentState) -> dict:
    try:
        ingest_analytics(state["storage"])
        return {"analytics_ok": True}
    except Exception:
        logger.exception("Analytics ingest failed")
        return {"analytics_ok": False}


def _publish_node(state: AgentState) -> dict:
    try:
        published = publish_approved_drafts(state["storage"])
        return {"published_ids": published}
    except Exception:
        logger.exception("Publishing failed")
        return {"published_ids": []}


def _insights_node(state: AgentState) -> dict:
    try:
        analysis = generate_insights(state["storage"])
        return {"insights_ok": analysis is not None}
    except Exception:
        logger.exception("Insight generation failed")
        return {"insights_ok": False}


def _drafts_node(state: AgentState) -> dict:
    storage = state["storage"]
    try:
        analysis_data = storage.read("llm_analysis.json")
        if analysis_data:
            analysis = LLMAnalysis.model_validate(analysis_data)
            count = create_drafts(storage, analysis)
            return {"drafts_created": count}
        else:
            logger.info("No saved LLM analysis — skipping draft creation")
            return {"drafts_created": 0}
    except Exception:
        logger.exception("Draft pipeline refill failed")
        return {"drafts_created": 0}


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------


def _route_weekly(state: AgentState) -> str:
    """Route to insights node on Mondays, otherwise straight to drafts."""
    return "insights" if state.get("is_monday", False) else "drafts"


def build_graph():
    """Build and compile the growth-agent state graph.

    START → ingest → publish → (Monday? → insights) → drafts → END
    """
    builder = StateGraph(AgentState)

    builder.add_node("ingest", _ingest_node)
    builder.add_node("publish", _publish_node)
    builder.add_node("insights", _insights_node)
    builder.add_node("drafts", _drafts_node)

    builder.add_edge(START, "ingest")
    builder.add_edge("ingest", "publish")
    builder.add_conditional_edges(
        "publish", _route_weekly, {"insights": "insights", "drafts": "drafts"}
    )
    builder.add_edge("insights", "drafts")
    builder.add_edge("drafts", END)

    return builder.compile()


graph = build_graph()
