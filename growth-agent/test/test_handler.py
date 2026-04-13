"""Tests for handler.py — the Scaleway Function cron entry point."""

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest

from agent.models import (
    ContentQueue,
    Draft,
    Insights,
    LLMAnalysis,
    PageForSocial,
    Performance,
    Strategy,
    WebsiteAnalytics,
)
from handler import (
    create_drafts,
    handle,
    ingest_analytics,
    publish_approved_drafts,
    generate_insights,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

ENV = {
    "S3_BUCKET": "test-bucket",
    "S3_STATE_PREFIX": "growth-agent/",
    "SCW_ACCESS_KEY": "test-ak",
    "SCW_SECRET_KEY": "test-sk",
    "IONOS_API_TOKEN": "test-ionos",
    "UMAMI_API_TOKEN": "test-umami",
    "MASTODON_ACCESS_TOKEN": "test-masto-token",
    "MASTODON_INSTANCE": "https://mastodon.social",
    "BLUESKY_APP_PASSWORD": "test-bsky-pw",
    "BLUESKY_HANDLE": "test.bsky.social",
}


@pytest.fixture(autouse=True)
def _env(monkeypatch):
    for k, v in ENV.items():
        monkeypatch.setenv(k, v)


@pytest.fixture()
def mock_storage():
    """In-memory storage mock that supports read/write/list_keys."""
    store = {}

    class FakeStorage:
        def read(self, key):
            return store.get(key)

        def write(self, key, data):
            if hasattr(data, "model_dump"):
                store[key] = data.model_dump()
            else:
                store[key] = data

        def list_keys(self, prefix=""):
            return [k for k in store if k.startswith(prefix)]

    return FakeStorage(), store


# ---------------------------------------------------------------------------
# ingest_analytics
# ---------------------------------------------------------------------------


@patch("handler.BlueskyClient")
@patch("handler.MastodonClient")
@patch("handler.UmamiClient")
def test_ingest_analytics(MockUmami, MockMasto, MockBsky, mock_storage):
    storage, store = mock_storage

    # Umami mock
    umami_inst = MockUmami.return_value
    umami_inst.get_stats.return_value = {
        "pageviews": {"value": 500},
        "visitors": {"value": 120},
        "visits": {"value": 200},
        "bounces": {"value": 50},
        "totaltime": {"value": 9000},
    }
    umami_inst.get_metrics.return_value = [{"x": "/quantum", "y": 42}]
    umami_inst.close.return_value = None

    # Mastodon mock
    masto_ctx = MagicMock()
    masto_ctx.verify_credentials.return_value = {"followers_count": 300}
    MockMasto.return_value.__enter__ = MagicMock(return_value=masto_ctx)
    MockMasto.return_value.__exit__ = MagicMock(return_value=False)

    # Bluesky mock
    bsky_inst = MockBsky.return_value
    bsky_inst.get_profile.return_value = {"followersCount": 150}

    result = ingest_analytics(storage)

    assert result.website_analytics.pageviews == 500
    assert result.website_analytics.visitors == 120
    assert result.social_metrics["mastodon"].followers == 300
    assert result.social_metrics["bluesky"].followers == 150
    assert "insights.json" in store


# ---------------------------------------------------------------------------
# publish_approved_drafts
# ---------------------------------------------------------------------------


@patch("handler.publish_draft")
@patch("handler.BlueskyClient")
@patch("handler.MastodonClient")
def test_publish_approved_drafts_publishes_due(
    MockMasto, MockBsky, mock_publish, mock_storage
):
    storage, store = mock_storage

    past = datetime.now(timezone.utc) - timedelta(hours=1)
    future = datetime.now(timezone.utc) + timedelta(days=1)

    queue = ContentQueue(
        approved=[
            Draft(
                id="d1",
                channel="mastodon",
                language="en",
                content="Test post",
                scheduled_at=past,
            ),
            Draft(
                id="d2",
                channel="bluesky",
                language="en",
                content="Future post",
                scheduled_at=future,
            ),
        ]
    )
    storage.write("content_queue.json", queue)

    mock_publish.return_value = {"id": "masto-123"}

    published = publish_approved_drafts(storage)

    assert published == ["d1"]
    # d2 should still be in approved (future scheduled_at)
    updated_queue = ContentQueue.model_validate(store["content_queue.json"])
    assert len(updated_queue.approved) == 1
    assert updated_queue.approved[0].id == "d2"
    assert len(updated_queue.published) == 1
    assert updated_queue.published[0].id == "d1"


@patch("handler.publish_draft")
@patch("handler.MastodonClient")
def test_publish_no_scheduled_at_publishes_immediately(
    MockMasto, mock_publish, mock_storage
):
    storage, store = mock_storage

    queue = ContentQueue(
        approved=[
            Draft(
                id="d3",
                channel="mastodon",
                language="en",
                content="No schedule",
                scheduled_at=None,
            ),
        ]
    )
    storage.write("content_queue.json", queue)

    mock_publish.return_value = {"id": "masto-456"}

    published = publish_approved_drafts(storage)
    assert published == ["d3"]


def test_publish_empty_queue(mock_storage):
    storage, _store = mock_storage
    published = publish_approved_drafts(storage)
    assert published == []


# ---------------------------------------------------------------------------
# generate_insights
# ---------------------------------------------------------------------------


@patch("handler.fetch_pages_meta")
@patch("handler.LLMClient")
def test_generate_insights(MockLLM, mock_fetch, mock_storage):
    storage, store = mock_storage

    # Seed analytics
    insights = Insights(
        website_analytics=WebsiteAnalytics(
            pageviews=500,
            visitors=100,
            top_pages=[{"x": "/quantum", "y": 42}],
        )
    )
    storage.write("insights.json", insights)

    from agent.models import PageMeta

    mock_fetch.return_value = {
        "https://fretchen.eu/quantum": PageMeta(
            url="https://fretchen.eu/quantum",
            title="Quantum Blog",
            description="Quantum computing intro",
        )
    }

    analysis = LLMAnalysis(
        top_topics=["quantum"],
        traffic_sources=["organic"],
        best_pages_for_social=[
            PageForSocial(
                url="https://fretchen.eu/quantum",
                title="Quantum",
                reason="High traffic",
            )
        ],
        content_gaps=["AI"],
        growth_opportunities=["Post more quantum content"],
    )

    llm_inst = MockLLM.return_value
    llm_inst.structured_output.return_value = analysis
    llm_inst.close.return_value = None

    result = generate_insights(storage)

    assert result is not None
    assert result.top_topics == ["quantum"]
    updated = Insights.model_validate(store["insights.json"])
    assert updated.growth_opportunities == ["Post more quantum content"]


# ---------------------------------------------------------------------------
# create_drafts
# ---------------------------------------------------------------------------


@patch("handler.fetch_pages_meta")
@patch("handler.LLMClient")
def test_create_drafts(MockLLM, mock_fetch, mock_storage):
    storage, store = mock_storage

    analysis = LLMAnalysis(
        top_topics=["quantum"],
        traffic_sources=["organic"],
        best_pages_for_social=[
            PageForSocial(
                url="https://fretchen.eu/quantum",
                title="Quantum",
                reason="High traffic",
            )
        ],
        content_gaps=[],
        growth_opportunities=[],
    )

    from agent.models import PageMeta

    mock_fetch.return_value = {
        "https://fretchen.eu/quantum": PageMeta(
            url="https://fretchen.eu/quantum",
            title="Quantum Blog",
            description="Quantum computing intro",
        )
    }

    llm_inst = MockLLM.return_value
    llm_inst.chat.return_value = {
        "content": "Check out this post about quantum computing!"
    }
    llm_inst.close.return_value = None

    count = create_drafts(storage, analysis)

    # 1 page → mastodon EN + bluesky EN = 2 drafts
    assert count == 2
    updated_queue = ContentQueue.model_validate(store["content_queue.json"])
    assert len(updated_queue.drafts) == 2
    channels = {d.channel for d in updated_queue.drafts}
    assert channels == {"mastodon", "bluesky"}


# ---------------------------------------------------------------------------
# handle() — integration-level tests
# ---------------------------------------------------------------------------


@patch("handler.create_drafts")
@patch("handler.generate_insights")
@patch("handler.publish_approved_drafts")
@patch("handler.ingest_analytics")
@patch("handler._get_storage")
def test_handle_daily_not_monday(
    mock_get_storage, mock_ingest, mock_publish, mock_weekly, mock_drafts
):
    """On a non-Monday, only daily tasks run."""
    fake_storage = MagicMock()
    mock_get_storage.return_value = fake_storage
    mock_ingest.return_value = Insights()
    mock_publish.return_value = ["d1"]

    # Patch datetime to a Wednesday
    wednesday = datetime(2025, 1, 8, 8, 0, 0, tzinfo=timezone.utc)  # Wednesday
    with patch("handler.datetime") as mock_dt:
        mock_dt.now.return_value = wednesday
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)

        result = handle({}, None)

    assert result["statusCode"] == 200
    mock_ingest.assert_called_once()
    mock_publish.assert_called_once()
    mock_weekly.assert_not_called()
    mock_drafts.assert_not_called()


@patch("handler.create_drafts")
@patch("handler.generate_insights")
@patch("handler.publish_approved_drafts")
@patch("handler.ingest_analytics")
@patch("handler._get_storage")
def test_handle_weekly_on_monday(
    mock_get_storage, mock_ingest, mock_publish, mock_insights, mock_drafts
):
    """On Monday, both daily and weekly tasks run."""
    fake_storage = MagicMock()
    mock_get_storage.return_value = fake_storage
    mock_ingest.return_value = Insights()
    mock_publish.return_value = []

    analysis = LLMAnalysis(
        top_topics=["q"],
        traffic_sources=["o"],
        best_pages_for_social=[],
        content_gaps=[],
        growth_opportunities=[],
    )
    mock_insights.return_value = analysis
    mock_drafts.return_value = 3

    monday = datetime(2025, 1, 6, 8, 0, 0, tzinfo=timezone.utc)  # Monday
    with patch("handler.datetime") as mock_dt:
        mock_dt.now.return_value = monday
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)

        result = handle({}, None)

    assert result["statusCode"] == 200
    mock_ingest.assert_called_once()
    mock_publish.assert_called_once()
    mock_insights.assert_called_once()
    mock_drafts.assert_called_once_with(fake_storage, analysis)


@patch("handler.publish_approved_drafts")
@patch("handler.ingest_analytics")
@patch("handler._get_storage")
def test_handle_resilient_on_failure(mock_get_storage, mock_ingest, mock_publish):
    """Handler continues even if analytics fails."""
    fake_storage = MagicMock()
    mock_get_storage.return_value = fake_storage
    mock_ingest.side_effect = RuntimeError("Umami down")
    mock_publish.return_value = []

    wednesday = datetime(2025, 1, 8, 8, 0, 0, tzinfo=timezone.utc)
    with patch("handler.datetime") as mock_dt:
        mock_dt.now.return_value = wednesday
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)

        result = handle({}, None)

    # Should still return 200 and have tried publishing
    assert result["statusCode"] == 200
    mock_publish.assert_called_once()
