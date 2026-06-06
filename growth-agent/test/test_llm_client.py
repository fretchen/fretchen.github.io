"""Unit tests for LLMClient provider abstraction."""

import pytest
from unittest.mock import patch

from agent.llm_client import LLMClient, PROVIDERS


def test_providers_registry():
    assert "ionos" in PROVIDERS
    assert "mistral" in PROVIDERS
    assert PROVIDERS["ionos"].base_url == "https://openai.inference.de-txl.ionos.com/v1"
    assert PROVIDERS["ionos"].api_key_env == "IONOS_API_TOKEN"
    assert PROVIDERS["mistral"].base_url == "https://api.mistral.ai/v1"
    assert PROVIDERS["mistral"].api_key_env == "MISTRAL_API_KEY"
    assert PROVIDERS["mistral"].default_model == "mistral-large-latest"


@patch("agent.llm_client.ChatOpenAI")
def test_from_env_defaults_to_ionos(MockChatOpenAI, monkeypatch):
    monkeypatch.setenv("IONOS_API_TOKEN", "ionos-key")
    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    monkeypatch.delenv("LLM_MODEL", raising=False)

    client = LLMClient.from_env()

    MockChatOpenAI.assert_called_once_with(
        base_url="https://openai.inference.de-txl.ionos.com/v1",
        api_key="ionos-key",
        model=PROVIDERS["ionos"].default_model,
        temperature=0.3,
        max_tokens=2048,
    )
    assert client.model == PROVIDERS["ionos"].default_model


@patch("agent.llm_client.ChatOpenAI")
def test_from_env_selects_mistral(MockChatOpenAI, monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "mistral")
    monkeypatch.setenv("MISTRAL_API_KEY", "mistral-key")
    monkeypatch.delenv("LLM_MODEL", raising=False)

    client = LLMClient.from_env()

    MockChatOpenAI.assert_called_once_with(
        base_url="https://api.mistral.ai/v1",
        api_key="mistral-key",
        model="mistral-large-latest",
        temperature=0.3,
        max_tokens=2048,
    )
    assert client.model == "mistral-large-latest"


@patch("agent.llm_client.ChatOpenAI")
def test_from_env_model_override(MockChatOpenAI, monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "mistral")
    monkeypatch.setenv("MISTRAL_API_KEY", "mistral-key")
    monkeypatch.setenv("LLM_MODEL", "mistral-small-latest")

    client = LLMClient.from_env()

    _, kwargs = MockChatOpenAI.call_args
    assert kwargs["model"] == "mistral-small-latest"
    assert client.model == "mistral-small-latest"


@patch("agent.llm_client.ChatOpenAI")
def test_from_env_empty_llm_model_uses_default(MockChatOpenAI, monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "mistral")
    monkeypatch.setenv("MISTRAL_API_KEY", "mistral-key")
    monkeypatch.setenv("LLM_MODEL", "")  # blank value should fall back to provider default

    client = LLMClient.from_env()

    _, kwargs = MockChatOpenAI.call_args
    assert kwargs["model"] == "mistral-large-latest"
    assert client.model == "mistral-large-latest"


@patch("agent.llm_client.ChatOpenAI")
def test_from_env_unknown_provider_raises(MockChatOpenAI, monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openai")

    with pytest.raises(KeyError):
        LLMClient.from_env()


@patch("agent.llm_client.ChatOpenAI")
def test_from_env_missing_api_key_raises(MockChatOpenAI, monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "mistral")
    monkeypatch.delenv("MISTRAL_API_KEY", raising=False)

    with pytest.raises(KeyError):
        LLMClient.from_env()
