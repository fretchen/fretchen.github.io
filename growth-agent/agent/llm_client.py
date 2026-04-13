"""IONOS AI Model Hub LLM client (OpenAI-compatible)."""

import httpx
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

IONOS_BASE_URL = "https://openai.inference.de-txl.ionos.com/v1"
IONOS_ENDPOINT = f"{IONOS_BASE_URL}/chat/completions"
DEFAULT_MODEL = "meta-llama/Llama-3.3-70B-Instruct"


class LLMClient:
    """Client for IONOS AI Model Hub (OpenAI-compatible chat completions API)."""

    def __init__(
        self,
        api_token: str,
        endpoint: str = IONOS_ENDPOINT,
        model: str = DEFAULT_MODEL,
    ):
        self.endpoint = endpoint
        self.model = model
        self.api_token = api_token
        self.client = httpx.Client(
            headers={
                "Authorization": f"Bearer {api_token}",
                "Content-Type": "application/json",
            },
            timeout=120.0,
        )
        self._chat_model = ChatOpenAI(
            base_url=IONOS_BASE_URL,
            api_key=api_token,
            model=model,
            temperature=0.3,
            max_tokens=2048,
        )

    def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> dict:
        """Send a chat completion request.

        Args:
            messages: List of {role, content} dicts.
            temperature: Sampling temperature.
            max_tokens: Maximum response tokens.

        Returns:
            dict with 'content', 'usage', and 'model' keys.
        """
        response = self.client.post(
            self.endpoint,
            json={
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
        )
        response.raise_for_status()
        data = response.json()

        return {
            "content": data["choices"][0]["message"]["content"],
            "usage": data.get("usage", {}),
            "model": data.get("model", self.model),
        }

    def structured_output(
        self,
        schema: type[BaseModel],
        messages: list[dict[str, str]],
    ) -> BaseModel:
        """Send a chat request and parse the response into a Pydantic model.

        Uses ChatOpenAI.with_structured_output() which sets
        response_format=json_schema on the IONOS endpoint.

        Args:
            schema: Pydantic model class to parse the response into.
            messages: List of {role, content} dicts.

        Returns:
            Parsed Pydantic model instance.
        """
        structured = self._chat_model.with_structured_output(schema)
        langchain_messages = []
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            if role == "system":
                from langchain_core.messages import SystemMessage
                langchain_messages.append(SystemMessage(content=content))
            elif role == "user":
                from langchain_core.messages import HumanMessage
                langchain_messages.append(HumanMessage(content=content))
            elif role == "assistant":
                from langchain_core.messages import AIMessage
                langchain_messages.append(AIMessage(content=content))

        return structured.invoke(langchain_messages)

    def close(self):
        self.client.close()
