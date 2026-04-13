"""IONOS AI Model Hub LLM client (OpenAI-compatible)."""

import httpx

IONOS_ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/chat/completions"
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
        self.client = httpx.Client(
            headers={
                "Authorization": f"Bearer {api_token}",
                "Content-Type": "application/json",
            },
            timeout=120.0,
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

    def close(self):
        self.client.close()
