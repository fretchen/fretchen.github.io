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
    Performance,
    PostMetrics,
)
from agent.nodes.drafts import (
    MastodonDraftOutput,
    _former_posts_context,
    create_drafts,
)
from agent.nodes.ingest import _collect_post_metrics, ingest_analytics
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
def test_ingest_analytics(MockMasto, MockBsky, mock_storage):
    storage, store = mock_storage

    masto_ctx = MagicMock()
    masto_ctx.verify_credentials.return_value = {"followers_count": 300}
    MockMasto.return_value.__enter__ = MagicMock(return_value=masto_ctx)
    MockMasto.return_value.__exit__ = MagicMock(return_value=False)

    bsky_ctx = MagicMock()
    bsky_ctx.get_profile.return_value = {"followersCount": 150}
    MockBsky.return_value.__enter__ = MagicMock(return_value=bsky_ctx)
    MockBsky.return_value.__exit__ = MagicMock(return_value=False)

    result = ingest_analytics(storage)

    assert result.social_metrics["mastodon"].followers == 300
    assert result.social_metrics["bluesky"].followers == 150
    assert "insights.json" in store


# ---------------------------------------------------------------------------
# _collect_post_metrics
# ---------------------------------------------------------------------------


@patch("agent.nodes.ingest.MastodonClient")
def test_collect_post_metrics_mastodon(MockMasto, mock_storage):
    storage, store = mock_storage
    queue = ContentQueue(
        published=[
            Draft(
                id="d1",
                channel="mastodon",
                language="en",
                content="x",
                platform_id="111",
                published_at=datetime.now(timezone.utc),
            )
        ]
    )
    storage.write("content_queue.json", queue)

    masto_ctx = MagicMock()
    masto_ctx.get_status.return_value = {
        "reblogs_count": 3,
        "favourites_count": 7,
        "replies_count": 1,
    }
    MockMasto.return_value.__enter__ = MagicMock(return_value=masto_ctx)
    MockMasto.return_value.__exit__ = MagicMock(return_value=False)

    _collect_post_metrics(storage)

    perf = Performance.model_validate(store["performance.json"])
    assert len(perf.posts) == 1
    assert perf.posts[0].reblogs == 3
    assert perf.posts[0].favourites == 7
    assert perf.posts[0].replies == 1


@patch("agent.nodes.ingest.BlueskyClient")
def test_collect_post_metrics_bluesky(MockBsky, mock_storage):
    storage, store = mock_storage
    uri = "at://did:plc:abc/app.bsky.feed.post/123"
    queue = ContentQueue(
        published=[
            Draft(
                id="d2",
                channel="bluesky",
                language="en",
                content="x",
                platform_id=uri,
                published_at=datetime.now(timezone.utc),
            )
        ]
    )
    storage.write("content_queue.json", queue)

    bsky_ctx = MagicMock()
    bsky_ctx.get_posts.return_value = [
        {"uri": uri, "repostCount": 2, "likeCount": 5, "replyCount": 0},
    ]
    MockBsky.return_value.__enter__ = MagicMock(return_value=bsky_ctx)
    MockBsky.return_value.__exit__ = MagicMock(return_value=False)

    _collect_post_metrics(storage)

    perf = Performance.model_validate(store["performance.json"])
    assert len(perf.posts) == 1
    assert perf.posts[0].favourites == 5
    assert perf.posts[0].reblogs == 2
    assert perf.posts[0].replies == 0


def test_collect_post_metrics_no_published(mock_storage):
    storage, store = mock_storage
    storage.write("content_queue.json", ContentQueue())

    _collect_post_metrics(storage)

    perf = Performance.model_validate(store["performance.json"])
    assert perf.posts == []


@patch("agent.nodes.ingest.MastodonClient")
def test_collect_post_metrics_mastodon_api_failure(MockMasto, mock_storage):
    storage, store = mock_storage
    queue = ContentQueue(
        published=[
            Draft(
                id="d3",
                channel="mastodon",
                language="en",
                content="x",
                platform_id="999",
                published_at=datetime.now(timezone.utc),
            )
        ]
    )
    storage.write("content_queue.json", queue)

    masto_ctx = MagicMock()
    masto_ctx.get_status.side_effect = Exception("API error")
    MockMasto.return_value.__enter__ = MagicMock(return_value=masto_ctx)
    MockMasto.return_value.__exit__ = MagicMock(return_value=False)

    _collect_post_metrics(storage)  # must not raise

    perf = Performance.model_validate(store["performance.json"])
    assert perf.posts == []


@patch("agent.nodes.ingest.MastodonClient")
def test_collect_post_metrics_preserves_old_posts(MockMasto, mock_storage):
    """Posts older than 30 days keep their stored metrics; only recent posts are re-fetched."""
    storage, store = mock_storage

    old_date = datetime.now(timezone.utc) - timedelta(days=45)
    recent_date = datetime.now(timezone.utc) - timedelta(days=5)

    queue = ContentQueue(
        published=[
            Draft(
                id="old",
                channel="mastodon",
                language="en",
                content="old post",
                platform_id="old-id",
                published_at=old_date,
            ),
            Draft(
                id="recent",
                channel="mastodon",
                language="en",
                content="recent post",
                platform_id="recent-id",
                published_at=recent_date,
            ),
        ]
    )
    storage.write("content_queue.json", queue)
    storage.write(
        "performance.json",
        Performance(
            posts=[
                PostMetrics(
                    id="old",
                    channel="mastodon",
                    published_at=old_date.isoformat(),
                    platform_id="old-id",
                    reblogs=10,
                    favourites=20,
                    replies=5,
                )
            ]
        ),
    )

    masto_ctx = MagicMock()
    masto_ctx.get_status.return_value = {
        "reblogs_count": 1,
        "favourites_count": 2,
        "replies_count": 0,
    }
    MockMasto.return_value.__enter__ = MagicMock(return_value=masto_ctx)
    MockMasto.return_value.__exit__ = MagicMock(return_value=False)

    _collect_post_metrics(storage)

    perf = Performance.model_validate(store["performance.json"])
    by_id = {p.id: p for p in perf.posts}

    assert "old" in by_id
    assert by_id["old"].reblogs == 10
    assert by_id["old"].favourites == 20

    assert "recent" in by_id
    assert by_id["recent"].reblogs == 1
    assert by_id["recent"].favourites == 2

    assert masto_ctx.get_status.call_count == 1  # only the recent post


@patch("agent.nodes.ingest.MastodonClient")
def test_collect_post_metrics_api_failure_preserves_existing(MockMasto, mock_storage):
    """API failure for a recent post keeps its previously stored metrics."""
    storage, store = mock_storage
    recent_date = datetime.now(timezone.utc) - timedelta(days=5)

    queue = ContentQueue(
        published=[
            Draft(
                id="p1",
                channel="mastodon",
                language="en",
                content="x",
                platform_id="111",
                published_at=recent_date,
            )
        ]
    )
    storage.write("content_queue.json", queue)
    storage.write(
        "performance.json",
        Performance(
            posts=[
                PostMetrics(
                    id="p1",
                    channel="mastodon",
                    published_at=recent_date.isoformat(),
                    platform_id="111",
                    reblogs=99,
                    favourites=50,
                    replies=10,
                )
            ]
        ),
    )

    masto_ctx = MagicMock()
    masto_ctx.get_status.side_effect = Exception("API error")
    MockMasto.return_value.__enter__ = MagicMock(return_value=masto_ctx)
    MockMasto.return_value.__exit__ = MagicMock(return_value=False)

    _collect_post_metrics(storage)

    perf = Performance.model_validate(store["performance.json"])
    assert len(perf.posts) == 1
    assert perf.posts[0].reblogs == 99
    assert perf.posts[0].favourites == 50


def test_collect_post_metrics_skips_no_published_at(mock_storage):
    """Posts without published_at are excluded from metrics refresh."""
    storage, store = mock_storage

    queue = ContentQueue(
        published=[
            Draft(
                id="no-date",
                channel="mastodon",
                language="en",
                content="x",
                platform_id="111",
                published_at=None,
            )
        ]
    )
    storage.write("content_queue.json", queue)

    _collect_post_metrics(storage)  # must not raise, must not call any API

    perf = Performance.model_validate(store["performance.json"])
    assert perf.posts == []


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

    storage.write("insights.json", Insights())

    from agent.models import PageMeta

    mock_fetch.return_value = {
        "https://fretchen.eu/quantum": PageMeta(
            url="https://fretchen.eu/quantum",
            title="Quantum Blog",
            description="Quantum computing intro",
        )
    }

    analysis = LLMAnalysis(
        best_pages_for_social=[
            PageForSocial(
                url="https://fretchen.eu/quantum",
                title="Quantum",
                reason="High traffic",
            )
        ],
        growth_opportunities=["Post more quantum content"],
    )

    llm_inst = MockLLM.from_env.return_value
    llm_inst.structured_output.return_value = analysis
    llm_inst.close.return_value = None

    result = generate_insights(storage)

    assert result is not None
    updated = Insights.model_validate(store["insights.json"])
    assert updated.growth_opportunities == ["Post more quantum content"]
    # insights.json must also carry the LLM analysis fields (merged for the frontend)
    assert len(updated.best_pages_for_social) == 1
    assert updated.best_pages_for_social[0].url == "https://fretchen.eu/quantum"
    assert updated.best_pages_for_social[0].reason == "High traffic"
    # LLMAnalysis should be persisted for daily reuse
    assert "llm_analysis.json" in store


@patch("agent.nodes.insights.fetch_pages_meta")
@patch("agent.nodes.insights.LLMClient")
def test_generate_insights_handles_missing_registry(MockLLM, mock_fetch, mock_storage):
    """generate_insights must not crash when registry_clean.json is absent."""
    storage, store = mock_storage
    storage.write("insights.json", Insights())
    # registry_clean.json intentionally not written → storage.read returns None

    analysis = LLMAnalysis(best_pages_for_social=[], growth_opportunities=["Grow!"])
    llm_inst = MockLLM.from_env.return_value
    llm_inst.structured_output.return_value = analysis
    llm_inst.close.return_value = None

    result = generate_insights(storage)
    assert result is not None
    mock_fetch.assert_not_called()


@patch("agent.nodes.insights.fetch_pages_meta")
@patch("agent.nodes.insights.LLMClient")
def test_generate_insights_handles_corrupt_registry(MockLLM, mock_fetch, mock_storage):
    """generate_insights must not crash when registry_clean.json is a JSON array."""
    storage, store = mock_storage
    storage.write("insights.json", Insights())
    store["registry_clean.json"] = ["/foo/", "/bar/"]  # non-dict → should not crash

    analysis = LLMAnalysis(best_pages_for_social=[], growth_opportunities=["Grow!"])
    llm_inst = MockLLM.from_env.return_value
    llm_inst.structured_output.return_value = analysis
    llm_inst.close.return_value = None

    result = generate_insights(storage)
    assert result is not None
    mock_fetch.assert_not_called()


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
                page_url="https://fretchen.eu/quantum/",
                page_title="Quantum Blog",
                page_description="Quantum computing intro",
                channel="mastodon",
                scheduled_at=now + timedelta(days=1),
            ),
            ContentPlanItem(
                page_url="https://fretchen.eu/quantum/",
                page_title="Quantum Blog",
                page_description="Quantum computing intro",
                channel="bluesky",
                scheduled_at=now + timedelta(days=2),
            ),
        ]
    )

    llm_inst = MockLLM.from_env.return_value
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
    # Links must use trailing slash (consistent with sitemap / canonical site URLs)
    assert (
        updated_queue.drafts[0].link
        == "https://fretchen.eu/quantum/?utm_source=mastodon&utm_campaign=growth-agent"
    )
    assert (
        updated_queue.drafts[1].link
        == "https://fretchen.eu/quantum/?utm_source=bluesky&utm_campaign=growth-agent"
    )


@patch("agent.nodes.drafts.LLMClient")
def test_create_drafts_mastodon_refine_failure_keeps_original(MockLLM, mock_storage):
    storage, store = mock_storage

    now = datetime(2025, 6, 10, 14, 0, 0, tzinfo=timezone.utc)
    plan = ContentPlan(
        items=[
            ContentPlanItem(
                page_url="https://fretchen.eu/quantum/",
                page_title="Quantum Blog",
                page_description="Quantum computing intro",
                channel="mastodon",
                scheduled_at=now + timedelta(days=1),
            ),
        ]
    )

    llm_inst = MockLLM.from_env.return_value
    llm_inst.structured_output.side_effect = [
        MastodonDraftOutput(
            content=(
                "Old framing about quantum "
                "https://fretchen.eu/quantum/?utm_source=mastodon&utm_campaign=growth-agent "
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
@patch("agent.nodes.ingest.ingest_analytics")
@patch("handler._get_storage")
def test_handle_daily_not_monday(mock_get_storage, mock_ingest, mock_publish):
    """On a non-Monday, graph runs ingest -> plan -> drafts -> publish (insights skipped)."""
    fake_storage = MagicMock()
    mock_get_storage.return_value = fake_storage
    mock_publish.return_value = ["d1"]
    mock_ingest.return_value = MagicMock()

    # No registry in this test fixture: plan node writes empty plan and flow continues.
    fake_storage.read.return_value = None
    wednesday = datetime(2025, 1, 8, 8, 0, 0, tzinfo=timezone.utc)  # Wednesday
    with patch("handler.datetime") as mock_dt:
        mock_dt.now.return_value = wednesday
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)

        result = handle({}, None)

    assert result["statusCode"] == 200
    mock_ingest.assert_called_once()
    mock_publish.assert_called_once()
    body = json.loads(result["body"])
    assert body["drafts_created"] == 0
    assert body["analytics"] is True
    assert body["insights"] is False  # not Monday — insights skipped


@patch("agent.nodes.publish.publish_approved_drafts")
@patch("agent.nodes.insights.generate_insights")
@patch("agent.nodes.ingest.ingest_analytics")
@patch("handler._get_storage")
def test_handle_weekly_on_monday(
    mock_get_storage,
    mock_ingest,
    mock_insights,
    mock_publish,
):
    """On Monday, graph runs ingest -> insights -> plan -> drafts -> publish."""
    fake_storage = MagicMock()
    mock_get_storage.return_value = fake_storage
    mock_publish.return_value = []
    mock_ingest.return_value = MagicMock()

    analysis = LLMAnalysis(
        best_pages_for_social=[],
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
    mock_ingest.assert_called_once()
    mock_insights.assert_called_once()
    mock_publish.assert_called_once()
    body = json.loads(result["body"])
    assert body["drafts_created"] == 0
    assert body["analytics"] is True
    assert body["insights"] is True  # Monday — insights ran


@patch("agent.nodes.publish.publish_approved_drafts")
@patch("agent.nodes.ingest.ingest_analytics")
@patch("handler._get_storage")
def test_handle_resilient_on_failure(mock_get_storage, mock_ingest, mock_publish):
    """Handler continues if an upstream node fails internally."""
    fake_storage = MagicMock()
    mock_get_storage.return_value = fake_storage
    mock_publish.return_value = []
    mock_ingest.return_value = MagicMock()

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
    """Empty queue → start from tomorrow 07:00 UTC, alternating mastodon/bluesky."""
    now = datetime(2025, 6, 10, 14, 30, 0, tzinfo=timezone.utc)
    schedule = plan_draft_schedule(ContentQueue(), 4, now=now)
    assert len(schedule) == 4
    assert schedule[0] == (
        "mastodon",
        datetime(2025, 6, 11, 7, 0, 0, tzinfo=timezone.utc),
    )
    assert schedule[1] == (
        "bluesky",
        datetime(2025, 6, 12, 7, 0, 0, tzinfo=timezone.utc),
    )
    assert schedule[2] == (
        "mastodon",
        datetime(2025, 6, 13, 7, 0, 0, tzinfo=timezone.utc),
    )
    assert schedule[3] == (
        "bluesky",
        datetime(2025, 6, 14, 7, 0, 0, tzinfo=timezone.utc),
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
                scheduled_at=datetime(2025, 4, 11, 7, 0, tzinfo=timezone.utc),
            ),
            Draft(
                id="d2",
                channel="bluesky",
                language="en",
                content="b",
                scheduled_at=datetime(2025, 4, 16, 7, 0, tzinfo=timezone.utc),
            ),
        ]
    )
    schedule = plan_draft_schedule(queue, 3, now=now)
    assert schedule[0][1] == datetime(2025, 4, 12, 7, 0, tzinfo=timezone.utc)
    assert schedule[1][1] == datetime(2025, 4, 13, 7, 0, tzinfo=timezone.utc)
    assert schedule[2][1] == datetime(2025, 4, 14, 7, 0, tzinfo=timezone.utc)


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
            scheduled_at=datetime(2025, 4, 10 + i, 7, 0, tzinfo=timezone.utc),
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
            scheduled_at=datetime(2025, 4, 11, 7, 0, tzinfo=timezone.utc),
        ),
        Draft(
            id="d_existing_2",
            channel="bluesky",
            language="en",
            content="Existing",
            scheduled_at=datetime(2025, 4, 16, 7, 0, tzinfo=timezone.utc),
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

    assert plan.items[0].scheduled_at == datetime(2025, 4, 12, 7, 0, tzinfo=timezone.utc)
    assert plan.items[1].scheduled_at == datetime(2025, 4, 13, 7, 0, tzinfo=timezone.utc)


@patch("agent.nodes.plan.fetch_pages_meta")
def test_create_plan_empty_queue_schedules_from_tomorrow(mock_fetch, mock_storage):
    """With an empty queue, scheduling starts from tomorrow 07:00 UTC."""
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
    expected_date = datetime(2025, 6, 11, 7, 0, 0, tzinfo=timezone.utc)
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
        "https://fretchen.eu/from-clean/": PageMeta(
            url="https://fretchen.eu/from-clean/", title="Clean", description="Desc"
        )
    }

    plan = create_plan(storage)
    assert plan.items
    assert plan.items[0].page_url == "https://fretchen.eu/from-clean/"
    persisted = ContentPlan.model_validate(store["content_plan.json"])
    assert persisted.items[0].page_url == "https://fretchen.eu/from-clean/"


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
        "https://fretchen.eu/allowed/": PageMeta(
            url="https://fretchen.eu/allowed/", title="Allowed", description="Desc"
        )
    }

    with patch("agent.nodes.plan.datetime") as mock_dt:
        mock_dt.now.return_value = now
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        plan = create_plan(storage)

    assert plan.items
    assert all(item.page_url == "https://fretchen.eu/allowed/" for item in plan.items)


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


# ---------------------------------------------------------------------------
# Phase 2f — published_at, former-post context, backwards compatibility
# ---------------------------------------------------------------------------


@patch("agent.nodes.publish.MastodonClient")
def test_publish_sets_published_at(MockMasto, mock_storage):
    """Successful publish populates published_at on the draft."""
    storage, store = mock_storage

    now = datetime.now(timezone.utc)
    draft = Draft(
        id="d1",
        channel="mastodon",
        language="en",
        content="Hello world",
        status="approved",
        scheduled_at=now - timedelta(minutes=1),
    )
    queue = ContentQueue(approved=[draft])
    storage.write("content_queue.json", queue)

    masto_inst = MockMasto.return_value
    masto_inst.post.return_value = None
    masto_inst.close.return_value = None

    with patch("agent.nodes.publish.publish_draft", return_value={"id": "masto-1"}):
        publish_approved_drafts(storage)

    saved = ContentQueue.model_validate(store["content_queue.json"])
    assert len(saved.published) == 1
    assert saved.published[0].published_at is not None


def test_former_posts_context_filters_by_channel():
    """_former_posts_context returns only entries matching the requested channel."""
    page = "https://fretchen.eu/blog/post/"
    now = datetime.now(timezone.utc)

    published = [
        Draft(
            id="m1",
            channel="mastodon",
            language="en",
            content="Mastodon post",
            link=f"{page}?utm_source=mastodon&utm_campaign=growth-agent",
            status="published",
            published_at=now - timedelta(days=1),
        ),
        Draft(
            id="b1",
            channel="bluesky",
            language="en",
            content="Bluesky post",
            link=f"{page}?utm_source=bluesky&utm_campaign=growth-agent",
            status="published",
            published_at=now - timedelta(days=2),
        ),
    ]
    queue = ContentQueue(published=published)

    ctx = _former_posts_context(queue, page, "mastodon")
    assert "Mastodon post" in ctx
    assert "Bluesky post" not in ctx


def test_former_posts_context_empty_when_no_history():
    """_former_posts_context returns empty string when no history exists."""
    queue = ContentQueue()
    assert _former_posts_context(queue, "https://fretchen.eu/blog/post/", "mastodon") == ""


@patch("agent.nodes.publish.publish_draft")
@patch("agent.nodes.publish.MastodonClient")
def test_publish_stores_platform_id_mastodon(MockMasto, mock_publish, mock_storage):
    """platform_id is populated from the Mastodon API response after publish."""
    storage, store = mock_storage

    past = datetime.now(timezone.utc) - timedelta(minutes=1)
    draft = Draft(
        id="d-masto", channel="mastodon", language="en", content="Hello", scheduled_at=past
    )
    storage.write("content_queue.json", ContentQueue(approved=[draft]))

    mock_publish.return_value = {
        "id": "masto-status-42",
        "uri": "https://mastodon.social/@fretchen/42",
    }

    publish_approved_drafts(storage)

    saved = ContentQueue.model_validate(store["content_queue.json"])
    assert saved.published[0].platform_id == "masto-status-42"


@patch("agent.nodes.publish.publish_draft")
@patch("agent.nodes.publish.BlueskyClient")
def test_publish_stores_platform_id_bluesky(MockBsky, mock_publish, mock_storage):
    """platform_id is populated from the Bluesky AT URI after publish."""
    storage, store = mock_storage

    past = datetime.now(timezone.utc) - timedelta(minutes=1)
    draft = Draft(id="d-bsky", channel="bluesky", language="en", content="Hello", scheduled_at=past)
    storage.write("content_queue.json", ContentQueue(approved=[draft]))

    mock_publish.return_value = {"uri": "at://did:plc:abc/app.bsky.feed.post/xyz", "cid": "cid123"}

    publish_approved_drafts(storage)

    saved = ContentQueue.model_validate(store["content_queue.json"])
    assert saved.published[0].platform_id == "at://did:plc:abc/app.bsky.feed.post/xyz"


@patch("agent.nodes.publish.publish_draft")
@patch("agent.nodes.publish.MastodonClient")
def test_publish_platform_id_none_when_publisher_returns_none(
    MockMasto, mock_publish, mock_storage
):
    """publish_draft() returning None does not raise — platform_id stays None."""
    storage, store = mock_storage

    past = datetime.now(timezone.utc) - timedelta(minutes=1)
    draft = Draft(
        id="d-none", channel="mastodon", language="en", content="Hello", scheduled_at=past
    )
    storage.write("content_queue.json", ContentQueue(approved=[draft]))

    mock_publish.return_value = None  # simulate edge-case silent failure

    publish_approved_drafts(storage)  # must not raise

    saved = ContentQueue.model_validate(store["content_queue.json"])
    assert saved.published[0].platform_id is None


def test_old_queue_deserializes_without_published_at():
    """Queues persisted before Phase 2f (no published_at field) load without error."""
    raw = {
        "drafts": [],
        "approved": [],
        "published": [
            {
                "id": "old1",
                "created": "2025-01-01T00:00:00",
                "channel": "mastodon",
                "language": "en",
                "content": "old post",
                "hashtags": [],
                "status": "published",
            }
        ],
        "rejected": [],
    }
    queue = ContentQueue.model_validate(raw)
    assert queue.published[0].published_at is None


# ---------------------------------------------------------------------------
# BlueskyClient.get_posts — batching behaviour
# ---------------------------------------------------------------------------


def test_bluesky_get_posts_batches():
    """URIs beyond 25 trigger a second HTTP request."""
    from agent.platforms.bluesky import BlueskyClient

    bsky = BlueskyClient.__new__(BlueskyClient)
    mock_http = MagicMock()
    bsky.client = mock_http
    mock_http.get.return_value.raise_for_status = MagicMock()
    mock_http.get.return_value.json.return_value = {"posts": [{"uri": "x"}]}

    uris = [f"at://did/post/{i}" for i in range(26)]
    result = bsky.get_posts(uris)

    assert mock_http.get.call_count == 2  # batch of 25 + batch of 1
    assert len(result) == 2  # one entry per batch response
