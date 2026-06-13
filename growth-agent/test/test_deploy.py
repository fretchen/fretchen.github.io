"""Tests for scripts/deploy.py — focused on env loading and validation."""

import pytest

from scripts.deploy import REQUIRED, load_env, validate_env


def test_load_env_strips_inline_comments(tmp_path):
    """dotenv_values must strip inline comments — the root cause of the 7-day prod outage."""
    (tmp_path / ".env").write_text(
        "S3_STATE_PREFIX_PROD=growth-agent/     # production container (via Terraform deploy)\n"
        "SCW_ACCESS_KEY=abc\n"
    )
    env = load_env(tmp_path)
    assert env["S3_STATE_PREFIX_PROD"] == "growth-agent/"
    assert env["SCW_ACCESS_KEY"] == "abc"


def test_validate_env_raises_on_missing():
    with pytest.raises(SystemExit, match="Missing"):
        validate_env({})


def test_validate_env_passes_when_complete():
    validate_env({k: "x" for k in REQUIRED})
