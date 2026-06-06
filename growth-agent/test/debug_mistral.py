"""
Debug script for LLM provider integration.
Run with: uv run python debug_mistral.py

Set LLM_PROVIDER=ionos or LLM_PROVIDER=mistral in .env (or environment).

Steps:
  1. Raw HTTP request (no langchain) — verifies key + model name
  2. ChatOpenAI plain invoke — verifies langchain-openai wiring
  3. ChatOpenAI with_structured_output — tests the production path
"""

import os
import sys

from dotenv import load_dotenv

load_dotenv(".env", override=True)

from agent.llm_client import PROVIDERS

PROVIDER_NAME = os.environ.get("LLM_PROVIDER", "ionos")

if PROVIDER_NAME not in PROVIDERS:
    print(f"ERROR: unknown LLM_PROVIDER={PROVIDER_NAME!r}, known: {list(PROVIDERS)}")
    sys.exit(1)

config = PROVIDERS[PROVIDER_NAME]
API_KEY = os.environ.get(config.api_key_env, "")
MODEL = os.environ.get("LLM_MODEL") or config.default_model
BASE_URL = config.base_url

print(f"Provider : {PROVIDER_NAME}")
print(f"API key  : {API_KEY[:8]}..." if API_KEY else "API key  : NOT SET")
print(f"Model    : {MODEL}")
print(f"Base URL : {BASE_URL}")
print()

if not API_KEY:
    print(f"ERROR: {config.api_key_env} not set in .env")
    sys.exit(1)

# ── Step 1: raw httpx call ─────────────────────────────────────────────────────
print("=== Step 1: raw HTTP POST /chat/completions ===")
import httpx

payload = {
    "model": MODEL,
    "messages": [{"role": "user", "content": "Say hello in one word."}],
    "max_tokens": 10,
}
try:
    r = httpx.post(
        f"{BASE_URL}/chat/completions",
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )
    r.raise_for_status()
    print("OK —", r.json()["choices"][0]["message"]["content"])
except httpx.HTTPStatusError as e:
    print(f"FAILED {e.response.status_code}: {e.response.text}")
    sys.exit(1)
except Exception as e:
    print(f"FAILED: {e}")
    sys.exit(1)

print()

# ── Step 2: ChatOpenAI plain invoke ────────────────────────────────────────────
print("=== Step 2: ChatOpenAI plain invoke ===")
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI

chat = ChatOpenAI(
    base_url=BASE_URL,
    api_key=API_KEY,
    model=MODEL,
    temperature=0.3,
    max_tokens=20,
)
try:
    result = chat.invoke([HumanMessage(content="Say hello in one word.")])
    print("OK —", result.content)
except Exception as e:
    print(f"FAILED: {e}")
    sys.exit(1)

print()

# ── Step 3: with_structured_output ────────────────────────────────────────────
print("=== Step 3: with_structured_output ===")
from pydantic import BaseModel


class Greeting(BaseModel):
    word: str
    language: str


structured = chat.with_structured_output(Greeting)
try:
    greeting = structured.invoke([HumanMessage(content="Say hello in one word. Return the word and the language.")])
    print("OK —", greeting)
except Exception as e:
    print(f"FAILED: {e}")
    sys.exit(1)

print()
print("All steps passed.")
