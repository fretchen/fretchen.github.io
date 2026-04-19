"""LangGraph workflow definition for the Growth Agent."""

from __future__ import annotations

from typing import Any, Callable, TypedDict

from langgraph.graph import END, START, StateGraph


class AgentState(TypedDict, total=False):
    """State flowing through the growth-agent graph."""

    storage: Any
    is_monday: bool
    analytics_ok: bool
    published_ids: list[str]
    insights_ok: bool
    drafts_created: int


def _route_weekly(state: AgentState) -> str:
    """Route to insights node on Mondays, otherwise straight to drafts."""
    return "insights" if state.get("is_monday", False) else "drafts"


def build_graph(
    *,
    ingest_node: Callable,
    publish_node: Callable,
    insights_node: Callable,
    drafts_node: Callable,
):
    """Build and compile the growth-agent state graph.

    START → ingest → publish → (Monday? → insights) → drafts → END
    """
    builder = StateGraph(AgentState)

    builder.add_node("ingest", ingest_node)
    builder.add_node("publish", publish_node)
    builder.add_node("insights", insights_node)
    builder.add_node("drafts", drafts_node)

    builder.add_edge(START, "ingest")
    builder.add_edge("ingest", "publish")
    builder.add_conditional_edges(
        "publish", _route_weekly, {"insights": "insights", "drafts": "drafts"}
    )
    builder.add_edge("insights", "drafts")
    builder.add_edge("drafts", END)

    return builder.compile()
