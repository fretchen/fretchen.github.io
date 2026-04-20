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
    Insights,
    LLMAnalysis,
    PageForSocial,
    Strategy,
    StrategyAdjustment,
    WebsiteAnalytics,
)
from agent.nodes.drafts import (
    create_drafts,
)
from agent.nodes.ingest import ingest_analytics
from agent.nodes.insights import generate_insights
from agent.nodes.plan import (
    PIPELINE_TARGET,
    _find_last_scheduled_at,
    create_plan,
    plan_draft_schedule,
)
from agent.nodes.publish import publish_approved_drafts
from agent.nodes.strategy import adjust_strategy
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


# ---------------------------------------------------------------------------
# adjust_strategy
# ---------------------------------------------------------------------------


@patch("agent.nodes.strategy.LLMClient")
def test_adjust_strategy_no_change(MockLLM, mock_storage):
    """When LLM says no adjustment needed, strategy remains unchanged."""
    storage, store = mock_storage

    insights = Insights(
        website_analytics=WebsiteAnalytics(pageviews=500, visitors=100),
    )
    storage.write("insights.json", insights)

    llm_inst = MockLLM.return_value
    llm_inst.structured_output.return_value = StrategyAdjustment(
        should_adjust=False,
        reasoning="Current strategy is performing well",
    )
    llm_inst.close.return_value = None

    result = adjust_strategy(storage)

    assert result is False
    # strategy.json should NOT be written (no changes)
    assert "strategy.json" not in store


@patch("agent.nodes.strategy.LLMClient")
def test_adjust_strategy_pillar_change(MockLLM, mock_storage):
    """When LLM recommends a pillar change, it's applied and logged."""
    storage, store = mock_storage

    insights = Insights(
        website_analytics=WebsiteAnalytics(pageviews=500, visitors=100),
    )
    storage.write("insights.json", insights)

    llm_inst = MockLLM.return_value
    llm_inst.structured_output.return_value = StrategyAdjustment(
        should_adjust=True,
        pillar_change="Data Science & ML",
        pillar_to_replace="AI-Tools & Infrastruktur",
        reasoning="AI-Tools content gets low engagement, ML topics trending",
    )
    llm_inst.close.return_value = None

    result = adjust_strategy(storage)

    assert result is True
    updated = Strategy.model_validate(store["strategy.json"])
    assert "Data Science & ML" in updated.content_pillars
    assert "AI-Tools & Infrastruktur" not in updated.content_pillars
    assert len(updated.changes) == 1
    assert updated.changes[0].field == "content_pillars"


@patch("agent.nodes.strategy.LLMClient")
def test_adjust_strategy_frequency_change(MockLLM, mock_storage):
    """When LLM recommends a frequency change, it's applied and logged."""
    storage, store = mock_storage

    insights = Insights(
        website_analytics=WebsiteAnalytics(pageviews=500, visitors=100),
    )
    storage.write("insights.json", insights)

    llm_inst = MockLLM.return_value
    llm_inst.structured_output.return_value = StrategyAdjustment(
        should_adjust=True,
        frequency_channel="mastodon",
        frequency_new_value=5,
        reasoning="Mastodon engagement is growing, increase frequency",
    )
    llm_inst.close.return_value = None

    result = adjust_strategy(storage)

    assert result is True
    updated = Strategy.model_validate(store["strategy.json"])
    assert updated.posting_frequency["mastodon"] == 5
    assert len(updated.changes) == 1
    assert updated.changes[0].field == "posting_frequency.mastodon"
    assert updated.changes[0].old_value == "4"
    assert updated.changes[0].new_value == "5"


@patch("agent.nodes.strategy.LLMClient")
def test_adjust_strategy_both_changes(MockLLM, mock_storage):
    """LLM can recommend both a pillar and frequency change (max 1 each)."""
    storage, store = mock_storage

    insights = Insights(
        website_analytics=WebsiteAnalytics(pageviews=500, visitors=100),
    )
    storage.write("insights.json", insights)

    llm_inst = MockLLM.return_value
    llm_inst.structured_output.return_value = StrategyAdjustment(
        should_adjust=True,
        pillar_change="Data Science & ML",
        pillar_to_replace="AI-Tools & Infrastruktur",
        frequency_channel="bluesky",
        frequency_new_value=4,
        reasoning="Shift focus and increase Bluesky presence",
    )
    llm_inst.close.return_value = None

    result = adjust_strategy(storage)

    assert result is True
    updated = Strategy.model_validate(store["strategy.json"])
    assert "Data Science & ML" in updated.content_pillars
    assert updated.posting_frequency["bluesky"] == 4
    # Both changes should be logged
    assert len(updated.changes) == 2


@patch("agent.nodes.strategy.LLMClient")
def test_adjust_strategy_invalid_pillar_ignored(MockLLM, mock_storage):
    """If LLM suggests replacing a non-existent pillar, ignore that change."""
    storage, store = mock_storage

    insights = Insights(
        website_analytics=WebsiteAnalytics(pageviews=500, visitors=100),
    )
    storage.write("insights.json", insights)

    llm_inst = MockLLM.return_value
    llm_inst.structured_output.return_value = StrategyAdjustment(
        should_adjust=True,
        pillar_change="Data Science & ML",
        pillar_to_replace="NonExistent Pillar",
        reasoning="Replace old pillar",
    )
    llm_inst.close.return_value = None

    result = adjust_strategy(storage)

    # No valid changes applied
    assert result is False


@patch("agent.nodes.strategy.LLMClient")
def test_adjust_strategy_invalid_channel_ignored(MockLLM, mock_storage):
    """If LLM suggests frequency for non-existent channel, ignore that change."""
    storage, store = mock_storage

    insights = Insights(
        website_analytics=WebsiteAnalytics(pageviews=500, visitors=100),
    )
    storage.write("insights.json", insights)

    llm_inst = MockLLM.return_value
    llm_inst.structured_output.return_value = StrategyAdjustment(
        should_adjust=True,
        frequency_channel="twitter",
        frequency_new_value=5,
        reasoning="Increase Twitter",
    )
    llm_inst.close.return_value = None

    result = adjust_strategy(storage)

    assert result is False


# ---------------------------------------------------------------------------
# handle() — integration-level tests
# ---------------------------------------------------------------------------


@patch("agent.nodes.publish.publish_approved_drafts")
@patch("agent.nodes.drafts.create_drafts")
@patch("agent.nodes.plan.create_plan")
@patch("agent.nodes.insights.generate_insights")
@patch("agent.nodes.ingest.ingest_analytics")
@patch("handler._get_storage")
def test_handle_daily_not_monday(
    mock_get_storage, mock_ingest, mock_insights, mock_plan, mock_drafts, mock_publish
):
    """On a non-Monday, daily tasks + pipeline refill run, but not insight generation."""
    fake_storage = MagicMock()
    mock_get_storage.return_value = fake_storage
    mock_ingest.return_value = Insights()
    mock_publish.return_value = ["d1"]

    analysis_dict = LLMAnalysis(
        top_topics=["q"],
        traffic_sources=["o"],
        best_pages_for_social=[],
        content_gaps=[],
        growth_opportunities=[],
    ).model_dump()
    plan = ContentPlan(
        items=[
            ContentPlanItem(
                page_url="https://fretchen.eu/q",
                page_title="Q",
                page_description="desc",
                reason="test",
                channel="mastodon",
                scheduled_at=datetime(2025, 1, 9, 9, 0, tzinfo=timezone.utc),
            )
        ]
    )

    # Return different data per key
    storage_data: dict = {"llm_analysis.json": analysis_dict}

    def plan_side_effect(storage, analysis):
        storage_data["content_plan.json"] = plan.model_dump()
        return plan

    mock_plan.side_effect = plan_side_effect

    def fake_read(key):
        return storage_data.get(key)

    fake_storage.read.side_effect = fake_read
    mock_drafts.return_value = 0

    # Patch datetime to a Wednesday
    wednesday = datetime(2025, 1, 8, 8, 0, 0, tzinfo=timezone.utc)  # Wednesday
    with patch("handler.datetime") as mock_dt:
        mock_dt.now.return_value = wednesday
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)

        result = handle({}, None)

    assert result["statusCode"] == 200
    mock_ingest.assert_called_once()
    mock_plan.assert_called_once()
    mock_publish.assert_called_once()
    # Insight generation should NOT run on non-Monday
    mock_insights.assert_not_called()
    # Pipeline refill should run (plan has items)
    mock_drafts.assert_called_once()


@patch("agent.nodes.publish.publish_approved_drafts")
@patch("agent.nodes.drafts.create_drafts")
@patch("agent.nodes.plan.create_plan")
@patch("agent.nodes.strategy.adjust_strategy")
@patch("agent.nodes.insights.generate_insights")
@patch("agent.nodes.ingest.ingest_analytics")
@patch("handler._get_storage")
def test_handle_weekly_on_monday(
    mock_get_storage,
    mock_ingest,
    mock_insights,
    mock_strategy,
    mock_plan,
    mock_drafts,
    mock_publish,
):
    """On Monday, insight generation + strategy runs, then plan + drafts + publish."""
    fake_storage = MagicMock()
    mock_get_storage.return_value = fake_storage
    mock_ingest.return_value = Insights()
    mock_publish.return_value = []
    mock_strategy.return_value = False

    analysis = LLMAnalysis(
        top_topics=["q"],
        traffic_sources=["o"],
        best_pages_for_social=[],
        content_gaps=[],
        growth_opportunities=[],
    )
    mock_insights.return_value = analysis

    plan = ContentPlan(
        items=[
            ContentPlanItem(
                page_url="https://fretchen.eu/q",
                page_title="Q",
                page_description="desc",
                reason="test",
                channel="mastodon",
                scheduled_at=datetime(2025, 1, 7, 9, 0, tzinfo=timezone.utc),
            )
        ]
    )
    storage_data: dict = {"llm_analysis.json": analysis.model_dump()}

    def plan_side_effect(storage, analysis):
        storage_data["content_plan.json"] = plan.model_dump()
        return plan

    mock_plan.side_effect = plan_side_effect

    def fake_read(key):
        return storage_data.get(key)

    fake_storage.read.side_effect = fake_read
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
    mock_strategy.assert_called_once()
    mock_plan.assert_called_once()
    mock_drafts.assert_called_once()


@patch("agent.nodes.publish.publish_approved_drafts")
@patch("agent.nodes.ingest.ingest_analytics")
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


def test_plan_draft_schedule_continues_from_existing():
    """Continues alternation from last scheduled draft."""
    last = datetime(2025, 4, 20, 9, 0, tzinfo=timezone.utc)
    queue = ContentQueue(
        drafts=[
            Draft(
                id="d1",
                channel="mastodon",
                language="en",
                content="a",
                scheduled_at=last,
            ),
        ]
    )
    schedule = plan_draft_schedule(queue, 2)
    assert schedule[0][0] == "bluesky"  # alternates from mastodon
    assert schedule[0][1] == last + timedelta(days=1)
    assert schedule[1][0] == "mastodon"
    assert schedule[1][1] == last + timedelta(days=2)


def test_plan_draft_schedule_zero_needed():
    """Requesting 0 drafts returns empty list."""
    assert plan_draft_schedule(ContentQueue(), 0) == []


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
            Draft(
                id="d1",
                channel="mastodon",
                language="en",
                content="a",
                scheduled_at=t_draft,
            ),
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
# create_plan — pipeline behavior
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

    analysis = LLMAnalysis(
        top_topics=["quantum"],
        traffic_sources=["organic"],
        best_pages_for_social=[
            PageForSocial(url="https://fretchen.eu/q", title="Q", reason="Test")
        ],
        content_gaps=[],
        growth_opportunities=[],
    )

    plan = create_plan(storage, analysis)
    assert len(plan.items) == 0
    # fetch_pages_meta should never be called
    mock_fetch.assert_not_called()


@patch("agent.nodes.plan.fetch_pages_meta")
def test_create_plan_pipeline_partial(mock_fetch, mock_storage):
    """When pipeline has 7 drafts, only 3 plan items are created."""
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

    # Provide enough pages (2 pages → 4 potential items, but only 3 needed)
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

    plan = create_plan(storage, analysis)

    assert len(plan.items) == 3  # needed = 10 - 7 = 3
    # Plan should be persisted
    persisted = ContentPlan.model_validate(store["content_plan.json"])
    assert len(persisted.items) == 3


@patch("agent.nodes.plan.fetch_pages_meta")
def test_create_plan_scheduling_continues_from_last(mock_fetch, mock_storage):
    """Plan items' scheduled_at starts from the latest existing scheduled_at + 1 day."""
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

    plan = create_plan(storage, analysis)

    assert plan.items[0].scheduled_at == last_scheduled + timedelta(days=1)
    assert plan.items[1].scheduled_at == last_scheduled + timedelta(days=2)
    # Existing draft is mastodon → plan alternates starting with bluesky
    assert plan.items[0].channel == "bluesky"
    assert plan.items[1].channel == "mastodon"


@patch("agent.nodes.plan.fetch_pages_meta")
def test_create_plan_empty_queue_schedules_from_tomorrow(mock_fetch, mock_storage):
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

    # Freeze time
    frozen_now = datetime(2025, 6, 10, 14, 30, 0, tzinfo=timezone.utc)
    with patch("agent.nodes.plan.datetime") as mock_dt:
        mock_dt.now.return_value = frozen_now
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        plan = create_plan(storage, analysis)

    first_item = plan.items[0]
    expected_date = datetime(2025, 6, 11, 9, 0, 0, tzinfo=timezone.utc)
    assert first_item.scheduled_at == expected_date


# ---------------------------------------------------------------------------
# handle() — daily pipeline refill without saved analysis
# ---------------------------------------------------------------------------


@patch("agent.nodes.publish.publish_approved_drafts")
@patch("agent.nodes.ingest.ingest_analytics")
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
