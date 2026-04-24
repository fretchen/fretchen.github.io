"""LangGraph workflow definition for the Growth Agent."""

import logging

from langgraph.graph import END, START, StateGraph

from agent.nodes.drafts import drafts_node
from agent.nodes.insights import insights_node
from agent.nodes.plan import plan_node
from agent.nodes.publish import publish_node
from agent.state import AgentState

logger = logging.getLogger("growth-agent")


def build_graph():
    """Build and compile the growth-agent state graph.

    START -> insights -> plan -> drafts -> publish -> END
    """
    builder = StateGraph(AgentState)

    builder.add_node("insights", insights_node)
    builder.add_node("plan", plan_node)
    builder.add_node("drafts", drafts_node)
    builder.add_node("publish", publish_node)

    builder.add_edge(START, "insights")
    builder.add_edge("insights", "plan")
    builder.add_edge("plan", "drafts")
    builder.add_edge("drafts", "publish")
    builder.add_edge("publish", END)

    return builder.compile()


graph = build_graph()
