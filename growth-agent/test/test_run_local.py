"""Tests for run_local.py -- focus on --prod flag and _make_storage routing."""

from unittest.mock import MagicMock, call, patch

import pytest

from run_local import _make_storage, diagnose, run_analytics, run_insights, run_publish, run_refill


# ---------------------------------------------------------------------------
# _make_storage — core routing logic
# ---------------------------------------------------------------------------


@patch("run_local.S3Storage")
def test_make_storage_uses_dev_prefix_by_default(MockS3Storage, monkeypatch):
    monkeypatch.setenv("S3_BUCKET", "my-bucket")
    monkeypatch.setenv("S3_STATE_PREFIX", "growth-agent-dev/")
    monkeypatch.setenv("S3_STATE_PREFIX_PROD", "growth-agent/")
    monkeypatch.setenv("SCW_ACCESS_KEY", "key")
    monkeypatch.setenv("SCW_SECRET_KEY", "secret")

    _make_storage(prod=False)

    MockS3Storage.assert_called_once_with(
        bucket="my-bucket",
        prefix="growth-agent-dev/",
        access_key="key",
        secret_key="secret",
    )


@patch("run_local.S3Storage")
def test_make_storage_uses_prod_prefix_with_flag(MockS3Storage, monkeypatch):
    monkeypatch.setenv("S3_BUCKET", "my-bucket")
    monkeypatch.setenv("S3_STATE_PREFIX", "growth-agent-dev/")
    monkeypatch.setenv("S3_STATE_PREFIX_PROD", "growth-agent/")
    monkeypatch.setenv("SCW_ACCESS_KEY", "key")
    monkeypatch.setenv("SCW_SECRET_KEY", "secret")

    _make_storage(prod=True)

    MockS3Storage.assert_called_once_with(
        bucket="my-bucket",
        prefix="growth-agent/",
        access_key="key",
        secret_key="secret",
    )


@patch("run_local.S3Storage")
def test_make_storage_prod_and_dev_are_independent(MockS3Storage, monkeypatch):
    """Switching prod does not mutate S3_STATE_PREFIX."""
    monkeypatch.setenv("S3_BUCKET", "my-bucket")
    monkeypatch.setenv("S3_STATE_PREFIX", "growth-agent-dev/")
    monkeypatch.setenv("S3_STATE_PREFIX_PROD", "growth-agent/")
    monkeypatch.setenv("SCW_ACCESS_KEY", "key")
    monkeypatch.setenv("SCW_SECRET_KEY", "secret")

    _make_storage(prod=True)
    _make_storage(prod=False)

    assert MockS3Storage.call_args_list == [
        call(bucket="my-bucket", prefix="growth-agent/", access_key="key", secret_key="secret"),
        call(bucket="my-bucket", prefix="growth-agent-dev/", access_key="key", secret_key="secret"),
    ]


# ---------------------------------------------------------------------------
# run_* functions pass prod flag through to _make_storage
# ---------------------------------------------------------------------------


@patch("run_local.publish_approved_drafts")
@patch("run_local._make_storage")
def test_run_publish_passes_prod(mock_make_storage, mock_publish):
    mock_make_storage.return_value = MagicMock()
    mock_publish.return_value = []
    run_publish(prod=True)
    mock_make_storage.assert_called_once_with(True)


@patch("run_local.create_drafts")
@patch("run_local.create_plan")
@patch("run_local._make_storage")
def test_run_refill_passes_prod(mock_make_storage, mock_plan, mock_drafts):
    mock_make_storage.return_value = MagicMock()
    mock_plan.return_value = MagicMock(items=[])
    mock_drafts.return_value = 0
    run_refill(prod=True)
    mock_make_storage.assert_called_once_with(True)


@patch("run_local.generate_insights")
@patch("run_local._make_storage")
def test_run_insights_passes_prod(mock_make_storage, mock_insights):
    mock_make_storage.return_value = MagicMock()
    mock_insights.return_value = MagicMock(top_topics=[], best_pages_for_social=[])
    run_insights(prod=True)
    mock_make_storage.assert_called_once_with(True)


@patch("run_local.ingest_analytics")
@patch("run_local._make_storage")
def test_run_analytics_passes_prod(mock_make_storage, mock_ingest):
    mock_make_storage.return_value = MagicMock()
    mock_ingest.return_value = MagicMock(
        website_analytics=MagicMock(pageviews=0),
        model_dump=lambda **kw: {},
    )
    run_analytics(prod=True)
    mock_make_storage.assert_called_once_with(True)


@patch("run_local.load_model")
@patch("run_local._make_storage")
def test_diagnose_passes_prod(mock_make_storage, mock_load_model):
    fake_storage = MagicMock()
    fake_storage.read.return_value = None
    fake_storage.list_keys.return_value = []
    mock_make_storage.return_value = fake_storage
    mock_load_model.return_value = MagicMock(
        drafts=[], approved=[], published=[], rejected=[]
    )
    diagnose(prod=True)
    mock_make_storage.assert_called_once_with(True)
