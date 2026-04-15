"""Tests for handler.py — the Scaleway Function cron entry point."""

import json
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest

from agent.models import (
    ContentQueue,
    Draft,
    Insights,
    LLMAnalysis,
    PageForSocial,
    WebsiteAnalytics,
)
from handler import (
    PIPELINE_TARGET,
    _find_last_scheduled_at,
    create_drafts,
    generate_insights,
    handle,
    ingest_analytics,
    publish_approved_drafts,
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
    "UMAMI_API_KEY": "test-umami",
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
    bsky_ctx = MagicMock()
    bsky_ctx.get_profile.return_value = {"followersCount": 150}
    MockBsky.return_value.__enter__ = MagicMock(return_value=bsky_ctx)
    MockBsky.return_value.__exit__ = MagicMock(return_value=False)

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
def test_publish_approved_drafts_publishes_due(MockMasto, MockBsky, mock_publish, mock_storage):
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
def test_publish_no_scheduled_at_publishes_immediately(MockMasto, mock_publish, mock_storage):
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
    # LLMAnalysis should be persisted for daily reuse
    assert "llm_analysis.json" in store
    persisted_analysis = LLMAnalysis.model_validate(store["llm_analysis.json"])
    assert persisted_analysis.top_topics == ["quantum"]


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
    llm_inst.chat.return_value = {"content": "Check out this post about quantum computing!"}
    llm_inst.close.return_value = None

    count = create_drafts(storage, analysis)

    # 1 page → mastodon EN + bluesky EN = 2 drafts
    assert count == 2
    updated_queue = ContentQueue.model_validate(store["content_queue.json"])
    assert len(updated_queue.drafts) == 2
    channels = [d.channel for d in updated_queue.drafts]
    assert channels == ["mastodon", "bluesky"]
    # Drafts should have scheduled_at set
    for d in updated_queue.drafts:
        assert d.scheduled_at is not None
    # Schedules should be 1 day apart
    delta = updated_queue.drafts[1].scheduled_at - updated_queue.drafts[0].scheduled_at
    assert delta == timedelta(days=1)
    # Draft IDs should include index
    assert "_0" in updated_queue.drafts[0].id
    assert "_1" in updated_queue.drafts[1].id


# ---------------------------------------------------------------------------
# handle() — integration-level tests
# ---------------------------------------------------------------------------


@patch("handler.create_drafts")
@patch("handler.generate_insights")
@patch("handler.publish_approved_drafts")
@patch("handler.ingest_analytics")
@patch("handler._get_storage")
def test_handle_daily_not_monday(
    mock_get_storage, mock_ingest, mock_publish, mock_insights, mock_drafts
):
    """On a non-Monday, daily tasks + pipeline refill run, but not insight generation."""
    fake_storage = MagicMock()
    mock_get_storage.return_value = fake_storage
    mock_ingest.return_value = Insights()
    mock_publish.return_value = ["d1"]
    # Simulate saved LLM analysis in S3
    fake_storage.read.return_value = LLMAnalysis(
        top_topics=["q"],
        traffic_sources=["o"],
        best_pages_for_social=[],
        content_gaps=[],
        growth_opportunities=[],
    ).model_dump()
    mock_drafts.return_value = 0

    # Patch datetime to a Wednesday
    wednesday = datetime(2025, 1, 8, 8, 0, 0, tzinfo=timezone.utc)  # Wednesday
    with patch("handler.datetime") as mock_dt:
        mock_dt.now.return_value = wednesday
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)

        result = handle({}, None)

    assert result["statusCode"] == 200
    mock_ingest.assert_called_once()
    mock_publish.assert_called_once()
    # Insight generation should NOT run on non-Monday
    mock_insights.assert_not_called()
    # But pipeline refill should run (reads from S3)
    mock_drafts.assert_called_once()


@patch("handler.create_drafts")
@patch("handler.generate_insights")
@patch("handler.publish_approved_drafts")
@patch("handler.ingest_analytics")
@patch("handler._get_storage")
def test_handle_weekly_on_monday(
    mock_get_storage, mock_ingest, mock_publish, mock_insights, mock_drafts
):
    """On Monday, insight generation runs, then pipeline refill uses the (new) analysis."""
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
    # Simulate S3 read for pipeline refill returning the saved analysis
    fake_storage.read.return_value = analysis.model_dump()
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
    mock_drafts.assert_called_once()


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


# ---------------------------------------------------------------------------
# _find_last_scheduled_at
# ---------------------------------------------------------------------------


def test_find_last_scheduled_at_empty():
    queue = ContentQueue()
    assert _find_last_scheduled_at(queue) is None


def test_find_last_scheduled_at_from_drafts():
    t1 = datetime(2025, 4, 10, 9, 0, tzinfo=timezone.utc)
    t2 = datetime(2025, 4, 12, 9, 0, tzinfo=timezone.utc)
    queue = ContentQueue(
        drafts=[
            Draft(id="d1", channel="mastodon", language="en", content="a", scheduled_at=t1),
            Draft(id="d2", channel="bluesky", language="en", content="b", scheduled_at=t2),
        ]
    )
    assert _find_last_scheduled_at(queue) == t2


def test_find_last_scheduled_at_across_drafts_and_approved():
    t_draft = datetime(2025, 4, 10, 9, 0, tzinfo=timezone.utc)
    t_approved = datetime(2025, 4, 15, 9, 0, tzinfo=timezone.utc)
    queue = ContentQueue(
        drafts=[
            Draft(id="d1", channel="mastodon", language="en", content="a", scheduled_at=t_draft),
        ],
        approved=[
            Draft(
                id="d2",
                channel="bluesky",
                language="en",
                content="b",
                scheduled_at=t_approved,
                status="approved",
            ),
        ],
    )
    assert _find_last_scheduled_at(queue) == t_approved


# ---------------------------------------------------------------------------
# create_drafts — pipeline behavior
# ---------------------------------------------------------------------------


@patch("handler.fetch_pages_meta")
@patch("handler.LLMClient")
def test_create_drafts_pipeline_full(MockLLM, mock_fetch, mock_storage):
    """When pipeline >= PIPELINE_TARGET, no new drafts are created."""
    storage, store = mock_storage

    # Pre-fill queue with PIPELINE_TARGET drafts
    existing_drafts = [
        Draft(id=f"d{i}", channel="mastodon", language="en", content=f"Post {i}")
        for i in range(PIPELINE_TARGET)
    ]
    queue = ContentQueue(drafts=existing_drafts)
    storage.write("content_queue.json", queue)

    analysis = LLMAnalysis(
        top_topics=["quantum"],
        traffic_sources=["organic"],
        best_pages_for_social=[
            PageForSocial(url="https://fretchen.eu/q", title="Q", reason="Test")
        ],
        content_gaps=[],
        growth_opportunities=[],
    )

    count = create_drafts(storage, analysis)
    assert count == 0
    # LLM should never be called
    MockLLM.assert_not_called()


@patch("handler.fetch_pages_meta")
@patch("handler.LLMClient")
def test_create_drafts_pipeline_partial(MockLLM, mock_fetch, mock_storage):
    """When pipeline has 7 drafts, only 3 new ones are created."""
    storage, store = mock_storage

    existing_drafts = [
        Draft(
            id=f"d{i}",
            channel="mastodon",
            language="en",
            content=f"Post {i}",
            scheduled_at=datetime(2025, 4, 10 + i, 9, 0, tzinfo=timezone.utc),
        )
        for i in range(7)
    ]
    queue = ContentQueue(drafts=existing_drafts)
    storage.write("content_queue.json", queue)

    # Provide enough pages (2 pages → 4 potential drafts, but only 3 needed)
    analysis = LLMAnalysis(
        top_topics=["quantum"],
        traffic_sources=["organic"],
        best_pages_for_social=[
            PageForSocial(url="https://fretchen.eu/q1", title="Q1", reason="Test"),
            PageForSocial(url="https://fretchen.eu/q2", title="Q2", reason="Test"),
        ],
        content_gaps=[],
        growth_opportunities=[],
    )

    from agent.models import PageMeta

    mock_fetch.return_value = {
        "https://fretchen.eu/q1": PageMeta(
            url="https://fretchen.eu/q1", title="Q1", description="Desc 1"
        ),
        "https://fretchen.eu/q2": PageMeta(
            url="https://fretchen.eu/q2", title="Q2", description="Desc 2"
        ),
    }

    llm_inst = MockLLM.return_value
    llm_inst.chat.return_value = {"content": "New post content"}
    llm_inst.close.return_value = None

    count = create_drafts(storage, analysis)

    assert count == 3  # needed = 10 - 7 = 3
    updated_queue = ContentQueue.model_validate(store["content_queue.json"])
    assert len(updated_queue.drafts) == 10  # 7 existing + 3 new


@patch("handler.fetch_pages_meta")
@patch("handler.LLMClient")
def test_create_drafts_scheduling_continues_from_last(MockLLM, mock_fetch, mock_storage):
    """New drafts' scheduled_at starts from the latest existing scheduled_at + 1 day."""
    storage, store = mock_storage

    last_scheduled = datetime(2025, 4, 20, 9, 0, tzinfo=timezone.utc)
    existing_drafts = [
        Draft(
            id="d_existing",
            channel="mastodon",
            language="en",
            content="Existing",
            scheduled_at=last_scheduled,
        )
    ]
    queue = ContentQueue(drafts=existing_drafts)
    storage.write("content_queue.json", queue)

    analysis = LLMAnalysis(
        top_topics=["quantum"],
        traffic_sources=["organic"],
        best_pages_for_social=[
            PageForSocial(url="https://fretchen.eu/q", title="Q", reason="Test"),
        ],
        content_gaps=[],
        growth_opportunities=[],
    )

    from agent.models import PageMeta

    mock_fetch.return_value = {
        "https://fretchen.eu/q": PageMeta(
            url="https://fretchen.eu/q", title="Q", description="Desc"
        ),
    }

    llm_inst = MockLLM.return_value
    llm_inst.chat.return_value = {"content": "Content"}
    llm_inst.close.return_value = None

    create_drafts(storage, analysis)

    updated_queue = ContentQueue.model_validate(store["content_queue.json"])
    new_drafts = updated_queue.drafts[1:]  # skip existing
    assert new_drafts[0].scheduled_at == last_scheduled + timedelta(days=1)
    assert new_drafts[1].scheduled_at == last_scheduled + timedelta(days=2)
    # Verify alternating channels
    assert new_drafts[0].channel == "mastodon"
    assert new_drafts[1].channel == "bluesky"


@patch("handler.fetch_pages_meta")
@patch("handler.LLMClient")
def test_create_drafts_empty_queue_schedules_from_tomorrow(MockLLM, mock_fetch, mock_storage):
    """With an empty queue, scheduling starts from tomorrow 09:00 UTC."""
    storage, store = mock_storage

    analysis = LLMAnalysis(
        top_topics=["quantum"],
        traffic_sources=["organic"],
        best_pages_for_social=[
            PageForSocial(url="https://fretchen.eu/q", title="Q", reason="Test"),
        ],
        content_gaps=[],
        growth_opportunities=[],
    )

    from agent.models import PageMeta

    mock_fetch.return_value = {
        "https://fretchen.eu/q": PageMeta(
            url="https://fretchen.eu/q", title="Q", description="Desc"
        ),
    }

    llm_inst = MockLLM.return_value
    llm_inst.chat.return_value = {"content": "Content"}
    llm_inst.close.return_value = None

    create_drafts(storage, analysis)

    updated_queue = ContentQueue.model_validate(store["content_queue.json"])
    first_draft = updated_queue.drafts[0]
    # Should be scheduled for tomorrow at 09:00 UTC
    now = datetime.now(timezone.utc)
    expected_date = (now + timedelta(days=1)).replace(hour=9, minute=0, second=0, microsecond=0)
    assert first_draft.scheduled_at == expected_date


# ---------------------------------------------------------------------------
# handle() — daily pipeline refill without saved analysis
# ---------------------------------------------------------------------------


@patch("handler.publish_approved_drafts")
@patch("handler.ingest_analytics")
@patch("handler._get_storage")
def test_handle_no_analysis_skips_drafts(mock_get_storage, mock_ingest, mock_publish):
    """When no saved LLM analysis exists, pipeline refill is skipped gracefully."""
    fake_storage = MagicMock()
    mock_get_storage.return_value = fake_storage
    mock_ingest.return_value = Insights()
    mock_publish.return_value = []
    # No saved analysis
    fake_storage.read.return_value = None

    wednesday = datetime(2025, 1, 8, 8, 0, 0, tzinfo=timezone.utc)
    with patch("handler.datetime") as mock_dt:
        mock_dt.now.return_value = wednesday
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)

        result = handle({}, None)

    assert result["statusCode"] == 200
    body = json.loads(result["body"])
    assert body["drafts_created"] == 0
