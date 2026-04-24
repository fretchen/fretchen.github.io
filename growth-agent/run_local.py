"""Run growth-agent functions locally for debugging and diagnostics.

Usage:
    uv run python run_local.py --diagnose       # Read-only: show S3 state + recent logs
    uv run python run_local.py --publish         # Only publish approved drafts
    uv run python run_local.py --refill          # Only pipeline refill (create drafts)
    uv run python run_local.py --insights        # Only generate LLM insights

For a full handler run (all daily tasks), use the Scaleway local framework:
    uv run python handler.py                     # HTTP server on :8080
    curl http://localhost:8080                    # Trigger the handler
"""

from __future__ import annotations

import argparse
import json

from dotenv import load_dotenv

load_dotenv()

from agent.models import ContentQueue, LLMAnalysis  # noqa: E402
from agent.nodes.drafts import create_drafts  # noqa: E402
from agent.nodes.ingest import ingest_analytics  # noqa: E402
from agent.nodes.insights import generate_insights  # noqa: E402
from agent.nodes.plan import create_plan  # noqa: E402
from agent.nodes.publish import publish_approved_drafts  # noqa: E402
from agent.storage import load_model  # noqa: E402
from handler import _get_storage  # noqa: E402


def diagnose() -> None:
    """Read-only: print S3 state and recent logs."""
    storage = _get_storage()

    # --- Content Queue ---
    queue = load_model(storage, "content_queue.json", ContentQueue)
    print("=== Content Queue ===")
    print(f"  Pending:   {len(queue.drafts)}")
    print(f"  Approved:  {len(queue.approved)}")
    print(f"  Published: {len(queue.published)}")
    print(f"  Rejected:  {len(queue.rejected)}")

    upcoming = sorted(
        [d for d in queue.drafts + queue.approved if d.scheduled_at],
        key=lambda d: d.scheduled_at,
    )
    if upcoming:
        print("\n  Next scheduled:")
        for d in upcoming[:5]:
            print(
                f"    {d.scheduled_at.isoformat()}  {d.channel:<10} [{d.status}] {d.id}"
            )

    # --- LLM Analysis ---
    analysis_data = storage.read("llm_analysis.json")
    print("\n=== LLM Analysis ===")
    if analysis_data:
        analysis = LLMAnalysis.model_validate(analysis_data)
        print(f"  Top topics: {analysis.top_topics}")
        print(f"  Pages for social: {len(analysis.best_pages_for_social)}")
    else:
        print("  NOT FOUND — pipeline refill will be skipped!")

    # --- Registry (Option 2: top-level keys) ---
    print("\n=== Registry ===")
    registry_clean = storage.read("registry_clean.json")
    registry_raw = storage.read("registry.json")
    registry_excluded = storage.read("registry_excluded.json")

    if isinstance(registry_clean, dict) and isinstance(
        registry_clean.get("urls"), list
    ):
        print(f"  registry_clean.json: {len(registry_clean['urls'])} urls")
    else:
        print("  registry_clean.json: MISSING")

    if isinstance(registry_raw, dict) and isinstance(registry_raw.get("urls"), list):
        print(f"  registry.json:       {len(registry_raw['urls'])} urls")
    else:
        print("  registry.json:       MISSING")

    if isinstance(registry_excluded, dict):
        excluded_urls = registry_excluded.get("urls", [])
        excluded_prefixes = registry_excluded.get("prefixes", [])
        print(
            "  registry_excluded.json: "
            f"urls={len(excluded_urls) if isinstance(excluded_urls, list) else 0}, "
            f"prefixes={len(excluded_prefixes) if isinstance(excluded_prefixes, list) else 0}"
        )
    else:
        print("  registry_excluded.json: MISSING (defaults to no exclusions)")

    # --- Recent Logs ---
    print("\n=== Recent Logs ===")
    log_keys = sorted(storage.list_keys("logs/"), reverse=True)
    if not log_keys:
        print("  No logs found")
    for key in log_keys[:5]:
        data = storage.read(key)
        if data and isinstance(data, dict):
            status = data.get("status", "unknown")
            r = data.get("result", {})
            published = r.get("published", [])
            drafts = r.get("drafts_created", 0)
            analytics = r.get("analytics", False)
            insights = r.get("insights", False)
            line = (
                f"  {key}: status={status}, analytics={analytics}, "
                f"published={published}, drafts_created={drafts}, insights={insights}"
            )
            if status == "crashed":
                line += f"\n    ERROR: {data.get('error', '?')[:200]}"
            elif status == "started":
                line += "\n    ⚠️  Function started but never completed!"
            print(line)


def run_publish() -> None:
    storage = _get_storage()
    published = publish_approved_drafts(storage)
    print(f"Published: {published}")


def run_refill() -> None:
    storage = _get_storage()
    plan = create_plan(storage)
    print(f"Plan created with {len(plan.items)} items")
    count = create_drafts(storage, plan)
    print(f"Created {count} new drafts")


def run_insights() -> None:
    storage = _get_storage()
    analysis = generate_insights(storage)
    if analysis:
        print(f"Insights generated — top topics: {analysis.top_topics}")
        print(f"Pages for social: {len(analysis.best_pages_for_social)}")
    else:
        print("No insights generated (missing analytics data?)")


def run_analytics() -> None:
    storage = _get_storage()
    result = ingest_analytics(storage)
    print(f"Analytics ingested — pageviews: {result.website_analytics.pageviews}")
    print(json.dumps(result.model_dump(), indent=2, default=str)[:500])


def show_graph(output: str = "graph.png") -> None:
    """Export the LangGraph graph as PNG image."""
    from agent.graph import graph

    png_bytes = graph.get_graph().draw_mermaid_png()
    with open(output, "wb") as f:
        f.write(png_bytes)
    print(f"Graph exported to {output}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Growth Agent local runner")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--diagnose", action="store_true", help="Read-only S3 state inspection"
    )
    group.add_argument("--publish", action="store_true", help="Publish approved drafts")
    group.add_argument(
        "--refill", action="store_true", help="Pipeline refill (create drafts)"
    )
    group.add_argument("--insights", action="store_true", help="Generate LLM insights")
    group.add_argument("--analytics", action="store_true", help="Ingest analytics")
    group.add_argument(
        "--graph",
        nargs="?",
        const="graph.png",
        metavar="FILE",
        help="Export graph as PNG (default: graph.png)",
    )
    args = parser.parse_args()

    if args.diagnose:
        diagnose()
    elif args.publish:
        run_publish()
    elif args.refill:
        run_refill()
    elif args.insights:
        run_insights()
    elif args.analytics:
        run_analytics()
    elif args.graph:
        show_graph(args.graph)


if __name__ == "__main__":
    main()
