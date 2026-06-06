"""LLM client with pluggable provider support (OpenAI-compatible endpoints)."""

import os
from dataclasses import dataclass

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel


@dataclass
class ProviderConfig:
    base_url: str
    api_key_env: str  # name of the env var that holds the API key
    default_model: str


PROVIDERS: dict[str, ProviderConfig] = {
    "ionos": ProviderConfig(
        base_url="https://openai.inference.de-txl.ionos.com/v1",
        api_key_env="IONOS_API_TOKEN",
        default_model="meta-llama/Llama-3.3-70B-Instruct",
    ),
    "mistral": ProviderConfig(
        base_url="https://api.mistral.ai/v1",
        api_key_env="MISTRAL_API_KEY",
        default_model="mistral-large-latest",
    ),
}


def _to_langchain_messages(
    messages: list[dict[str, str]],
) -> list[SystemMessage | HumanMessage | AIMessage]:
    """Convert {role, content} dicts to LangChain message objects."""
    result: list[SystemMessage | HumanMessage | AIMessage] = []
    for msg in messages:
        role = msg["role"]
        content = msg["content"]
        if role == "system":
            result.append(SystemMessage(content=content))
        elif role == "user":
            result.append(HumanMessage(content=content))
        elif role == "assistant":
            result.append(AIMessage(content=content))
        else:
            raise ValueError(f"Unsupported message role: {role!r}")
    return result


class LLMClient:
    """OpenAI-compatible LLM client. Use from_env() for provider selection via LLM_PROVIDER."""

    def __init__(self, api_token: str, base_url: str, model: str):
        self.model = model
        self._chat_model = ChatOpenAI(
            base_url=base_url,
            api_key=api_token,  # type: ignore[arg-type]
            model=model,
            temperature=0.3,
            max_tokens=2048,  # type: ignore[call-arg]
        )

    @classmethod
    def from_env(cls, model: str | None = None) -> "LLMClient":
        """Construct from environment. Reads LLM_PROVIDER (default: 'ionos') and LLM_MODEL."""
        provider_name = os.environ.get("LLM_PROVIDER", "ionos")
        config = PROVIDERS[provider_name]
        return cls(
            api_token=os.environ[config.api_key_env],
            base_url=config.base_url,
            model=model or os.environ.get("LLM_MODEL") or config.default_model,
        )

    def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> dict:
        model = self._chat_model.bind(temperature=temperature, max_tokens=max_tokens)
        result = model.invoke(_to_langchain_messages(messages))
        return {"content": result.content}

    def structured_output(
        self,
        schema: type[BaseModel],
        messages: list[dict[str, str]],
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> BaseModel:
        bind_kwargs: dict[str, float | int] = {}
        if temperature is not None:
            bind_kwargs["temperature"] = temperature
        if max_tokens is not None:
            bind_kwargs["max_tokens"] = max_tokens
        structured = self._chat_model.with_structured_output(schema)
        if bind_kwargs:
            structured = structured.bind(**bind_kwargs)
        result = structured.invoke(_to_langchain_messages(messages))
        assert isinstance(result, BaseModel)  # narrowing for mypy
        return result

    def close(self):
        pass
