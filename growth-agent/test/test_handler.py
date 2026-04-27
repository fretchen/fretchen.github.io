"""Tests for growth-agent — nodes, graph, and handler."""

import json
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest

from agent.models import (
    ContentPlan,
    ContentPlanItem,
    ContentQueue,
    Draft,
    DraftCritique,
    Insights,
    LLMAnalysis,
    PageForSocial,
    WebsiteAnalytics,
)
from agent.nodes.drafts import (
    MastodonDraftOutput,
    create_drafts,
)
from agent.nodes.ingest import ingest_analytics
from agent.nodes.insights import generate_insights
from agent.nodes.plan import (
    PIPELINE_TARGET,
    create_plan,
    plan_draft_schedule,
)
from agent.nodes.publish import publish_approved_drafts
from handler import (
    _create_server,
    handle,
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


@patch("agent.nodes.ingest.BlueskyClient")
@patch("agent.nodes.ingest.MastodonClient")
@patch("agent.nodes.ingest.UmamiClient")
def test_ingest_analytics(MockUmami, MockMasto, MockBsky, mock_storage):
    storage, store = mock_storage

    # Umami mock — new format returns ints directly
    umami_inst = MockUmami.return_value
    umami_inst.get_stats.return_value = {
        "pageviews": 500,
        "visitors": 120,
        "visits": 200,
        "bounces": 50,
        "totaltime": 9000,
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


@patch("agent.nodes.ingest.BlueskyClient")
@patch("agent.nodes.ingest.MastodonClient")
@patch("agent.nodes.ingest.UmamiClient")
def test_ingest_analytics_old_umami_format(MockUmami, MockMasto, MockBsky, mock_storage):
    """Umami legacy format with {\"value\": n} dicts still works."""
    storage, store = mock_storage

    umami_inst = MockUmami.return_value
    umami_inst.get_stats.return_value = {
        "pageviews": {"value": 500},
        "visitors": {"value": 120},
        "visits": {"value": 200},
        "bounces": {"value": 50},
        "totaltime": {"value": 9000},
    }
    umami_inst.get_metrics.return_value = []
    umami_inst.close.return_value = None

    masto_ctx = MagicMock()
    masto_ctx.verify_credentials.return_value = {"followers_count": 300}
    MockMasto.return_value.__enter__ = MagicMock(return_value=masto_ctx)
    MockMasto.return_value.__exit__ = MagicMock(return_value=False)

    bsky_ctx = MagicMock()
    bsky_ctx.get_profile.return_value = {"followersCount": 150}
    MockBsky.return_value.__enter__ = MagicMock(return_value=bsky_ctx)
    MockBsky.return_value.__exit__ = MagicMock(return_value=False)

    result = ingest_analytics(storage)
    assert result.website_analytics.pageviews == 500
    assert result.website_analytics.visitors == 120


# ---------------------------------------------------------------------------
# publish_approved_drafts
# ---------------------------------------------------------------------------


@patch("agent.nodes.publish.publish_draft")
@patch("agent.nodes.publish.BlueskyClient")
@patch("agent.nodes.publish.MastodonClient")
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


@patch("agent.nodes.publish.publish_draft")
@patch("agent.nodes.publish.MastodonClient")
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


def test_publish_skips_oversized_content(mock_storage):
    """Drafts exceeding platform char limits stay in approved without error."""
    storage, store = mock_storage

    past = datetime.now(timezone.utc) - timedelta(hours=1)
    queue = ContentQueue(
        approved=[
            Draft(
                id="too-long",
                channel="mastodon",
                language="en",
                content="x" * 501,  # Exceeds 500 char limit
                scheduled_at=past,
            ),
        ]
    )
    storage.write("content_queue.json", queue)

    published = publish_approved_drafts(storage)
    assert published == []
    updated_queue = ContentQueue.model_validate(store["content_queue.json"])
    assert len(updated_queue.approved) == 1
    assert updated_queue.approved[0].id == "too-long"


# ---------------------------------------------------------------------------
# generate_insights
# ---------------------------------------------------------------------------


@patch("agent.nodes.insights.fetch_pages_meta")
@patch("agent.nodes.insights.LLMClient")
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


@patch("agent.nodes.drafts.LLMClient")
def test_create_drafts(MockLLM, mock_storage):
    storage, store = mock_storage

    now = datetime(2025, 6, 10, 14, 0, 0, tzinfo=timezone.utc)
    plan = ContentPlan(
        items=[
            ContentPlanItem(
                page_url="https://fretchen.eu/quantum",
                page_title="Quantum Blog",
                page_description="Quantum computing intro",
                reason="High traffic",
                channel="mastodon",
                scheduled_at=now + timedelta(days=1),
            ),
            ContentPlanItem(
                page_url="https://fretchen.eu/quantum",
                page_title="Quantum Blog",
                page_description="Quantum computing intro",
                reason="High traffic",
                channel="bluesky",
                scheduled_at=now + timedelta(days=2),
            ),
        ]
    )

    llm_inst = MockLLM.return_value
    llm_inst.chat.return_value = {"content": "Check out this post about quantum computing!"}
    llm_inst.structured_output.side_effect = [
        MastodonDraftOutput(
            content=(
                "Check out this post about quantum computing! "
                "https://fretchen.eu/quantum?utm_source=mastodon&utm_campaign=growth-agent "
                "#Quantum #AI"
            ),
            hashtags=["#Quantum", "#AI"],
        ),
        DraftCritique(
            has_strong_hook=True,
            follows_platform_conventions=True,
            mentions_specific_insight=True,
            includes_link=True,
            appropriate_tone=True,
            overall_score=85,
            issues=[],
            suggested_improvement="",
        ),
        DraftCritique(
            has_strong_hook=True,
            follows_platform_conventions=True,
            mentions_specific_insight=True,
            includes_link=True,
            appropriate_tone=True,
            overall_score=82,
            issues=[],
            suggested_improvement="",
        ),
    ]
    llm_inst.close.return_value = None

    count = create_drafts(storage, plan)

    # 2 plan items → 2 drafts
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
    # Mastodon hashtags should be persisted separately; Bluesky remains empty
    assert updated_queue.drafts[0].hashtags == ["#Quantum", "#AI"]
    assert updated_queue.drafts[1].hashtags == []


@patch("agent.nodes.drafts.LLMClient")
def test_create_drafts_mastodon_refine_failure_keeps_original(MockLLM, mock_storage):
    storage, store = mock_storage

    now = datetime(2025, 6, 10, 14, 0, 0, tzinfo=timezone.utc)
    plan = ContentPlan(
        items=[
            ContentPlanItem(
                page_url="https://fretchen.eu/quantum",
                page_title="Quantum Blog",
                page_description="Quantum computing intro",
                reason="High traffic",
                channel="mastodon",
                scheduled_at=now + timedelta(days=1),
            ),
        ]
    )

    llm_inst = MockLLM.return_value
    llm_inst.structured_output.side_effect = [
        MastodonDraftOutput(
            content=(
                "Old framing about quantum "
                "https://fretchen.eu/quantum?utm_source=mastodon&utm_campaign=growth-agent "
                "#Old"
            ),
            hashtags=["#Old"],
        ),
        DraftCritique(
            has_strong_hook=False,
            follows_platform_conventions=True,
            mentions_specific_insight=True,
            includes_link=True,
            appropriate_tone=True,
            overall_score=60,
            issues=["weak_hook"],
            suggested_improvement="Use a stronger, different opening",
        ),
        Exception("structured refine failed"),
    ]
    llm_inst.close.return_value = None

    count = create_drafts(storage, plan)

    assert count == 1
    updated_queue = ContentQueue.model_validate(store["content_queue.json"])
    assert len(updated_queue.drafts) == 1
    # No chat fallback for mastodon refinement: keep original structured draft.
    assert updated_queue.drafts[0].content.startswith("Old framing about quantum")
    assert updated_queue.drafts[0].hashtags == ["#Old"]


# ---------------------------------------------------------------------------
# handle() — integration-level tests
# ---------------------------------------------------------------------------


@patch("agent.nodes.publish.publish_approved_drafts")
@patch("agent.nodes.insights.generate_insights")
@patch("handler._get_storage")
def test_handle_daily_not_monday(mock_get_storage, mock_insights, mock_publish):
    """On a non-Monday, graph still runs insights -> plan -> drafts -> publish."""
    fake_storage = MagicMock()
    mock_get_storage.return_value = fake_storage
    mock_publish.return_value = ["d1"]

    # No registry in this test fixture: plan node writes empty plan and flow continues.
    fake_storage.read.return_value = None
    # Patch datetime to a Wednesday
    wednesday = datetime(2025, 1, 8, 8, 0, 0, tzinfo=timezone.utc)  # Wednesday
    with patch("handler.datetime") as mock_dt:
        mock_dt.now.return_value = wednesday
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)

        result = handle({}, None)

    assert result["statusCode"] == 200
    mock_insights.assert_called_once()
    mock_publish.assert_called_once()
    body = json.loads(result["body"])
    assert body["drafts_created"] == 0


@patch("agent.nodes.publish.publish_approved_drafts")
@patch("agent.nodes.insights.generate_insights")
@patch("handler._get_storage")
def test_handle_weekly_on_monday(
    mock_get_storage,
    mock_insights,
    mock_publish,
):
    """On Monday, graph runs the same simplified flow insights -> plan -> drafts -> publish."""
    fake_storage = MagicMock()
    mock_get_storage.return_value = fake_storage
    mock_publish.return_value = []

    analysis = LLMAnalysis(
        top_topics=["q"],
        traffic_sources=["o"],
        best_pages_for_social=[],
        content_gaps=[],
        growth_opportunities=[],
    )
    mock_insights.return_value = analysis

    # No registry in this test fixture: plan node writes empty plan and flow continues.
    fake_storage.read.return_value = None
    monday = datetime(2025, 1, 6, 8, 0, 0, tzinfo=timezone.utc)  # Monday
    with patch("handler.datetime") as mock_dt:
        mock_dt.now.return_value = monday
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)

        result = handle({}, None)

    assert result["statusCode"] == 200
    mock_publish.assert_called_once()
    mock_insights.assert_called_once()
    body = json.loads(result["body"])
    assert body["drafts_created"] == 0


@patch("agent.nodes.publish.publish_approved_drafts")
@patch("handler._get_storage")
def test_handle_resilient_on_failure(mock_get_storage, mock_publish):
    """Handler continues if an upstream node fails internally."""
    fake_storage = MagicMock()
    mock_get_storage.return_value = fake_storage
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
# plan_draft_schedule
# ---------------------------------------------------------------------------


def test_plan_draft_schedule_empty_queue():
    """Empty queue → start from tomorrow 09:00 UTC, alternating mastodon/bluesky."""
    now = datetime(2025, 6, 10, 14, 30, 0, tzinfo=timezone.utc)
    schedule = plan_draft_schedule(ContentQueue(), 4, now=now)
    assert len(schedule) == 4
    assert schedule[0] == (
        "mastodon",
        datetime(2025, 6, 11, 9, 0, 0, tzinfo=timezone.utc),
    )
    assert schedule[1] == (
        "bluesky",
        datetime(2025, 6, 12, 9, 0, 0, tzinfo=timezone.utc),
    )
    assert schedule[2] == (
        "mastodon",
        datetime(2025, 6, 13, 9, 0, 0, tzinfo=timezone.utc),
    )
    assert schedule[3] == (
        "bluesky",
        datetime(2025, 6, 14, 9, 0, 0, tzinfo=timezone.utc),
    )


def test_plan_draft_schedule_fills_earliest_free_days():
    """Fills earliest free days instead of appending after the last slot."""
    now = datetime(2025, 4, 10, 8, 0, tzinfo=timezone.utc)
    queue = ContentQueue(
        drafts=[
            Draft(
                id="d1",
                channel="mastodon",
                language="en",
                content="a",
                scheduled_at=datetime(2025, 4, 11, 9, 0, tzinfo=timezone.utc),
            ),
            Draft(
                id="d2",
                channel="bluesky",
                language="en",
                content="b",
                scheduled_at=datetime(2025, 4, 16, 9, 0, tzinfo=timezone.utc),
            ),
        ]
    )
    schedule = plan_draft_schedule(queue, 3, now=now)
    assert schedule[0][1] == datetime(2025, 4, 12, 9, 0, tzinfo=timezone.utc)
    assert schedule[1][1] == datetime(2025, 4, 13, 9, 0, tzinfo=timezone.utc)
    assert schedule[2][1] == datetime(2025, 4, 14, 9, 0, tzinfo=timezone.utc)


def test_plan_draft_schedule_zero_needed():
    """Requesting 0 drafts returns empty list."""
    assert plan_draft_schedule(ContentQueue(), 0) == []


# ---------------------------------------------------------------------------
# create_plan — simple registry planner behavior
# ---------------------------------------------------------------------------


@patch("agent.nodes.plan.fetch_pages_meta")
def test_create_plan_pipeline_full(mock_fetch, mock_storage):
    """When pipeline >= PIPELINE_TARGET, no plan items are created."""
    storage, store = mock_storage

    # Pre-fill queue with PIPELINE_TARGET drafts
    existing_drafts = [
        Draft(id=f"d{i}", channel="mastodon", language="en", content=f"Post {i}")
        for i in range(PIPELINE_TARGET)
    ]
    queue = ContentQueue(drafts=existing_drafts)
    storage.write("content_queue.json", queue)

    storage.write("registry_clean.json", {"urls": ["https://fretchen.eu/q"]})

    plan = create_plan(storage)
    assert len(plan.items) == 0
    # fetch_pages_meta should never be called
    mock_fetch.assert_not_called()


@patch("agent.nodes.plan.fetch_pages_meta")
def test_create_plan_pipeline_partial(mock_fetch, mock_storage):
    """When pipeline has 7 drafts, planner creates only 3 items from registry."""
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

    storage.write(
        "registry_clean.json",
        {
            "urls": [
                "https://fretchen.eu/q1",
                "https://fretchen.eu/q2",
                "https://fretchen.eu/q3",
                "https://fretchen.eu/q4",
            ]
        },
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

    plan = create_plan(storage)

    assert len(plan.items) == 3
    # Plan should be persisted
    persisted = ContentPlan.model_validate(store["content_plan.json"])
    assert len(persisted.items) == 3


@patch("agent.nodes.plan.fetch_pages_meta")
def test_create_plan_scheduling_fills_earliest_free_days(mock_fetch, mock_storage):
    """Plan items are scheduled into earliest free days after tomorrow."""
    storage, store = mock_storage

    frozen_now = datetime(2025, 4, 10, 8, 0, tzinfo=timezone.utc)
    existing_drafts = [
        Draft(
            id="d_existing_1",
            channel="mastodon",
            language="en",
            content="Existing",
            scheduled_at=datetime(2025, 4, 11, 9, 0, tzinfo=timezone.utc),
        ),
        Draft(
            id="d_existing_2",
            channel="bluesky",
            language="en",
            content="Existing",
            scheduled_at=datetime(2025, 4, 16, 9, 0, tzinfo=timezone.utc),
        ),
    ]
    queue = ContentQueue(drafts=existing_drafts)
    storage.write("content_queue.json", queue)

    storage.write(
        "registry_clean.json",
        {"urls": ["https://fretchen.eu/q", "https://fretchen.eu/r"]},
    )

    from agent.models import PageMeta

    mock_fetch.return_value = {
        "https://fretchen.eu/q": PageMeta(
            url="https://fretchen.eu/q", title="Q", description="Desc"
        ),
        "https://fretchen.eu/r": PageMeta(
            url="https://fretchen.eu/r", title="R", description="Desc"
        ),
    }

    with patch("agent.nodes.plan.datetime") as mock_dt:
        mock_dt.now.return_value = frozen_now
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        plan = create_plan(storage)

    assert plan.items[0].scheduled_at == datetime(2025, 4, 12, 9, 0, tzinfo=timezone.utc)
    assert plan.items[1].scheduled_at == datetime(2025, 4, 13, 9, 0, tzinfo=timezone.utc)


@patch("agent.nodes.plan.fetch_pages_meta")
def test_create_plan_empty_queue_schedules_from_tomorrow(mock_fetch, mock_storage):
    """With an empty queue, scheduling starts from tomorrow 09:00 UTC."""
    storage, store = mock_storage

    storage.write(
        "registry_clean.json",
        {"urls": ["https://fretchen.eu/q", "https://fretchen.eu/r"]},
    )

    from agent.models import PageMeta

    mock_fetch.return_value = {
        "https://fretchen.eu/q": PageMeta(
            url="https://fretchen.eu/q", title="Q", description="Desc"
        ),
    }

    # Freeze time
    frozen_now = datetime(2025, 6, 10, 14, 30, 0, tzinfo=timezone.utc)
    with patch("agent.nodes.plan.datetime") as mock_dt:
        mock_dt.now.return_value = frozen_now
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        plan = create_plan(storage)

    first_item = plan.items[0]
    expected_date = datetime(2025, 6, 11, 9, 0, 0, tzinfo=timezone.utc)
    assert first_item.scheduled_at == expected_date


@patch("agent.nodes.plan.fetch_pages_meta")
def test_create_plan_uses_default_channels_for_schedule(mock_fetch, mock_storage):
    """Scheduling alternates default channels mastodon/bluesky."""
    storage, _store = mock_storage

    storage.write(
        "registry_clean.json",
        {"urls": ["https://fretchen.eu/a", "https://fretchen.eu/b"]},
    )

    from agent.models import PageMeta

    mock_fetch.return_value = {
        "https://fretchen.eu/a": PageMeta(
            url="https://fretchen.eu/a", title="A", description="Desc"
        ),
        "https://fretchen.eu/b": PageMeta(
            url="https://fretchen.eu/b", title="B", description="Desc"
        ),
    }

    plan = create_plan(storage)
    assert plan.items
    assert plan.items[0].channel == "mastodon"
    assert plan.items[1].channel == "bluesky"


@patch("agent.nodes.plan.fetch_pages_meta")
def test_create_plan_uses_registry_clean_before_registry(mock_fetch, mock_storage):
    """Planner prefers registry_clean.json when both registry files exist."""
    storage, store = mock_storage

    storage.write("registry.json", {"urls": ["https://fretchen.eu/from-registry"]})
    storage.write(
        "registry_clean.json",
        {"urls": ["https://fretchen.eu/from-clean"]},
    )

    from agent.models import PageMeta

    mock_fetch.return_value = {
        "https://fretchen.eu/from-clean": PageMeta(
            url="https://fretchen.eu/from-clean", title="Clean", description="Desc"
        )
    }

    plan = create_plan(storage)
    assert plan.items
    assert plan.items[0].page_url == "https://fretchen.eu/from-clean"
    persisted = ContentPlan.model_validate(store["content_plan.json"])
    assert persisted.items[0].page_url == "https://fretchen.eu/from-clean"


@patch("agent.nodes.plan.fetch_pages_meta")
def test_create_plan_excludes_urls_already_in_pending_pipeline(mock_fetch, mock_storage):
    """Planner should not re-select URLs already present in drafts/future approved."""
    storage, _store = mock_storage

    now = datetime(2026, 4, 23, 8, 0, tzinfo=timezone.utc)
    queue = ContentQueue(
        drafts=[
            Draft(
                id="d1",
                channel="mastodon",
                language="en",
                content="pending",
                link="https://fretchen.eu/blocked-draft?utm_source=test",
            )
        ],
        approved=[
            Draft(
                id="a1",
                channel="bluesky",
                language="en",
                content="future approved",
                link="https://fretchen.eu/blocked-approved",
                scheduled_at=now + timedelta(days=2),
                status="approved",
            )
        ],
    )
    storage.write("content_queue.json", queue)
    storage.write(
        "registry_clean.json",
        {
            "urls": [
                "https://fretchen.eu/blocked-draft",
                "https://fretchen.eu/blocked-approved",
                "https://fretchen.eu/allowed",
            ]
        },
    )

    from agent.models import PageMeta

    mock_fetch.return_value = {
        "https://fretchen.eu/allowed": PageMeta(
            url="https://fretchen.eu/allowed", title="Allowed", description="Desc"
        )
    }

    with patch("agent.nodes.plan.datetime") as mock_dt:
        mock_dt.now.return_value = now
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        plan = create_plan(storage)

    assert plan.items
    assert all(item.page_url == "https://fretchen.eu/allowed" for item in plan.items)


# ---------------------------------------------------------------------------
# handle() — daily pipeline refill without saved analysis
# ---------------------------------------------------------------------------


@patch("agent.nodes.publish.publish_approved_drafts")
@patch("handler._get_storage")
def test_handle_no_registry_skips_drafts(mock_get_storage, mock_publish):
    """When no registry exists, plan is empty and draft generation is skipped."""
    fake_storage = MagicMock()
    mock_get_storage.return_value = fake_storage
    mock_publish.return_value = []
    # No registry file
    fake_storage.read.return_value = None

    wednesday = datetime(2025, 1, 8, 8, 0, 0, tzinfo=timezone.utc)
    with patch("handler.datetime") as mock_dt:
        mock_dt.now.return_value = wednesday
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)

        result = handle({}, None)

    assert result["statusCode"] == 200
    body = json.loads(result["body"])
    assert body["drafts_created"] == 0


# ---------------------------------------------------------------------------
# HTTP Server Tests
# ---------------------------------------------------------------------------


class TestRunServer:
    """Tests for the HTTP server endpoints."""

    @pytest.fixture()
    def server(self):
        """Start server on ephemeral port, yield (server, port), then shutdown."""
        import threading

        srv = _create_server(port=0)  # OS picks a free port
        port = srv.server_address[1]
        thread = threading.Thread(target=srv.serve_forever, daemon=True)
        thread.start()
        yield srv, port
        srv.shutdown()
        srv.server_close()

    def test_health_endpoint(self, server):
        """GET /health returns 200 with status ok."""
        import http.client

        _srv, port = server
        conn = http.client.HTTPConnection("localhost", port, timeout=5)
        conn.request("GET", "/health")
        resp = conn.getresponse()
        assert resp.status == 200
        body = json.loads(resp.read())
        assert body["status"] == "ok"
        conn.close()

    def test_post_root_calls_handle(self, server):
        """POST / invokes handle() and returns its result."""
        import http.client

        _srv, port = server
        with patch(
            "handler.handle",
            return_value={
                "statusCode": 200,
                "body": json.dumps({"test": True}),
            },
        ) as mock_handle:
            conn = http.client.HTTPConnection("localhost", port, timeout=5)
            payload = json.dumps({"source": "cron"})
            conn.request(
                "POST",
                "/",
                body=payload,
                headers={
                    "Content-Type": "application/json",
                    "Content-Length": str(len(payload)),
                },
            )
            resp = conn.getresponse()
            assert resp.status == 200
            body = json.loads(resp.read())
            assert body["test"] is True
            mock_handle.assert_called_once()
            conn.close()
