"""Scaleway Container entry point — daily cron handler for the Growth Agent.

Triggered daily at 08:00 UTC via Scaleway Container Cron (HTTP POST to /).

Daily tasks:
  - Analytics ingest (Umami + social metrics)
  - Publish approved drafts where scheduled_at <= now
  - Pipeline refill: generate drafts if pipeline < PIPELINE_TARGET

Weekly tasks (Monday only):
  - LLM insight generation (persisted to S3 for daily reuse)
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone

from agent.graph import graph
from agent.storage import S3Storage

logger = logging.getLogger("growth-agent")
logger.setLevel(logging.INFO)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_storage() -> S3Storage:
    return S3Storage(
        bucket=os.environ["S3_BUCKET"],
        prefix=os.environ.get("S3_STATE_PREFIX", "growth-agent/"),
        access_key=os.environ["SCW_ACCESS_KEY"],
        secret_key=os.environ["SCW_SECRET_KEY"],
    )


# ---------------------------------------------------------------------------
# Main handler
# ---------------------------------------------------------------------------


def handle(event, _context):
    """Cron entry point — invokes the LangGraph workflow.

    Daily (every run):
      1. Analytics ingest
      2. Publish approved drafts
      3. Pipeline refill (generate drafts if pipeline < PIPELINE_TARGET)

    Weekly (Monday only):
      4. LLM insight generation (persisted for daily reuse)
    """
    logger.info("Growth Agent cron started")

    storage = _get_storage()
    now = datetime.now(timezone.utc)
    log_key = f"logs/{now.strftime('%Y-%m-%d')}.json"

    storage.write(log_key, {"timestamp": now.isoformat(), "status": "started"})

    crashed = False
    result = {
        "analytics": False,
        "published": [],
        "insights": False,
        "plan_created": False,
        "drafts_created": 0,
    }

    try:
        state = graph.invoke(
            {
                "storage": storage,
                "is_monday": now.weekday() == 0,
                "analytics_ok": False,
                "published_ids": [],
                "insights_ok": False,
                "plan_created": False,
                "drafts_created": 0,
            }
        )

        result = {
            "analytics": state.get("analytics_ok", False),
            "published": state.get("published_ids", []),
            "insights": state.get("insights_ok", False),
            "plan_created": state.get("plan_created", False),
            "drafts_created": state.get("drafts_created", 0),
        }

        storage.write(
            log_key,
            {
                "timestamp": now.isoformat(),
                "status": "completed",
                "result": result,
            },
        )

    except Exception:
        logger.exception("Handler crashed unexpectedly")
        import traceback

        crashed = True
        storage.write(
            log_key,
            {
                "timestamp": now.isoformat(),
                "status": "crashed",
                "error": traceback.format_exc(),
                "result": result,
            },
        )

    logger.info("Growth Agent cron finished: %s", result)

    return {
        "statusCode": 500 if crashed else 200,
        "body": json.dumps(result, default=str),
    }


# ---------------------------------------------------------------------------
# HTTP Server (Scaleway Container runtime)
# ---------------------------------------------------------------------------


def _create_server(port: int = 8080):
    """Create the HTTP server without starting it.

    Returns the HTTPServer instance. Call .serve_forever() to start.
    """
    from http.server import BaseHTTPRequestHandler, HTTPServer

    class _Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == "/health":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"status":"ok"}')
            else:
                self.send_response(404)
                self.end_headers()

        def do_POST(self):
            if self.path != "/":
                self.send_response(404)
                self.end_headers()
                return

            # Read body (Scaleway sends JSON args from cron config)
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length) if content_length else b"{}"
            try:
                event = json.loads(body)
            except json.JSONDecodeError:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"error":"invalid JSON"}')
                return

            result = handle(event, None)
            status_code = result.get("statusCode", 200)
            response_body = result.get("body", "{}")

            self.send_response(status_code)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(response_body.encode())

        def log_message(self, format, *args):
            logger.info(format, *args)

    return HTTPServer(("0.0.0.0", port), _Handler)


def _run_server():
    """Start an HTTP server for the Scaleway Container runtime.

    Scaleway Container Cron sends POST / with a JSON body.
    GET /health returns 200 for health checks.
    """
    port = int(os.environ.get("PORT", "8080"))
    server = _create_server(port)
    logger.info("Growth Agent HTTP server listening on port %d", port)
    server.serve_forever()


if __name__ == "__main__":
    try:
        from dotenv import load_dotenv

        load_dotenv()
    except ImportError:
        pass  # python-dotenv not installed in container — env vars set by platform

    _run_server()
