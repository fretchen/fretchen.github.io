"""LangGraph workflow definition for the Growth Agent."""

import logging

from langgraph.graph import END, START, StateGraph

from agent.nodes.drafts import drafts_node
from agent.nodes.ingest import ingest_node
from agent.nodes.insights import insights_node
from agent.nodes.plan import plan_node
from agent.nodes.publish import publish_node
from agent.state import AgentState

logger = logging.getLogger("growth-agent")


def _route_after_ingest(state: AgentState) -> str:
    """Run LLM insights only on Mondays — daily ingest is cheap, weekly LLM is sufficient."""
    return "insights" if state.get("is_monday") else "plan"


def build_graph():
    """Build and compile the growth-agent state graph.

    Daily:  START -> ingest -> plan -> drafts -> publish -> END
    Monday: START -> ingest -> insights -> plan -> drafts -> publish -> END
    """
    builder = StateGraph(AgentState)

    builder.add_node("ingest", ingest_node)
    builder.add_node("insights", insights_node)
    builder.add_node("plan", plan_node)
    builder.add_node("drafts", drafts_node)
    builder.add_node("publish", publish_node)

    builder.add_edge(START, "ingest")
    builder.add_conditional_edges(
        "ingest", _route_after_ingest, {"insights": "insights", "plan": "plan"}
    )
    builder.add_edge("insights", "plan")
    builder.add_edge("plan", "drafts")
    builder.add_edge("drafts", "publish")
    builder.add_edge("publish", END)

    return builder.compile()


graph = build_graph()
