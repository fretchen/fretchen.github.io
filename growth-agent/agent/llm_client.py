"""IONOS AI Model Hub LLM client (OpenAI-compatible)."""

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

IONOS_BASE_URL = "https://openai.inference.de-txl.ionos.com/v1"
DEFAULT_MODEL = "meta-llama/Llama-3.3-70B-Instruct"


def _to_langchain_messages(messages: list[dict[str, str]]):
    """Convert {role, content} dicts to LangChain message objects."""
    result = []
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
    """Client for IONOS AI Model Hub (OpenAI-compatible chat completions API)."""

    def __init__(
        self,
        api_token: str,
        model: str = DEFAULT_MODEL,
    ):
        self.model = model
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
            dict with 'content' key.
        """
        model = self._chat_model.bind(temperature=temperature, max_tokens=max_tokens)
        result = model.invoke(_to_langchain_messages(messages))
        return {"content": result.content}

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
        return structured.invoke(_to_langchain_messages(messages))

    def close(self):
        pass
