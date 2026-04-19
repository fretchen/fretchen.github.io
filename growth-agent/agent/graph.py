"""LangGraph workflow definition for the Growth Agent."""

import logging

from langgraph.graph import END, START, StateGraph

from agent.nodes.drafts import drafts_node
from agent.nodes.ingest import ingest_node
from agent.nodes.insights import insights_node
from agent.nodes.publish import publish_node
from agent.state import AgentState

logger = logging.getLogger("growth-agent")


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


graph = build_graph()
