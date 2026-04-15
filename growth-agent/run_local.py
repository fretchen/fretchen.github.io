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
from handler import (  # noqa: E402
    _get_storage,
    _load_model,
    create_drafts,
    generate_insights,
    ingest_analytics,
    publish_approved_drafts,
)


def diagnose() -> None:
    """Read-only: print S3 state and recent logs."""
    storage = _get_storage()

    # --- Content Queue ---
    queue = _load_model(storage, "content_queue.json", ContentQueue)
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
            print(f"    {d.scheduled_at.isoformat()}  {d.channel:<10} [{d.status}] {d.id}")

    # --- LLM Analysis ---
    analysis_data = storage.read("llm_analysis.json")
    print("\n=== LLM Analysis ===")
    if analysis_data:
        analysis = LLMAnalysis.model_validate(analysis_data)
        print(f"  Top topics: {analysis.top_topics}")
        print(f"  Pages for social: {len(analysis.best_pages_for_social)}")
    else:
        print("  NOT FOUND — pipeline refill will be skipped!")

    # --- Recent Logs ---
    print("\n=== Recent Logs ===")
    log_keys = sorted(storage.list_keys("logs/"), reverse=True)
    if not log_keys:
        print("  No logs found")
    for key in log_keys[:5]:
        data = storage.read(key)
        if data:
            r = data.get("result", {})
            published = r.get("published", [])
            drafts = r.get("drafts_created", 0)
            analytics = r.get("analytics", False)
            insights = r.get("insights", False)
            print(
                f"  {key}: analytics={analytics}, published={published}, "
                f"drafts_created={drafts}, insights={insights}"
            )


def run_publish() -> None:
    storage = _get_storage()
    published = publish_approved_drafts(storage)
    print(f"Published: {published}")


def run_refill() -> None:
    storage = _get_storage()
    analysis_data = storage.read("llm_analysis.json")
    if not analysis_data:
        print("ERROR: No llm_analysis.json in S3 — run --insights first")
        return
    analysis = LLMAnalysis.model_validate(analysis_data)
    count = create_drafts(storage, analysis)
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Growth Agent local runner")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--diagnose", action="store_true", help="Read-only S3 state inspection")
    group.add_argument("--publish", action="store_true", help="Publish approved drafts")
    group.add_argument("--refill", action="store_true", help="Pipeline refill (create drafts)")
    group.add_argument("--insights", action="store_true", help="Generate LLM insights")
    group.add_argument("--analytics", action="store_true", help="Ingest analytics")
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


if __name__ == "__main__":
    main()
