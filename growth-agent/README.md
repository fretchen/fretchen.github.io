# Growth Agent

AI-powered social media growth pipeline for [fretchen.eu](https://fretchen.eu). Runs as a Scaleway Python Function triggered daily via cron.

## What it does

- **Daily**: Ingests website analytics (Umami), fetches social metrics (Mastodon & Bluesky), publishes approved drafts
- **Weekly (Monday)**: Generates LLM-driven insights from analytics, creates draft social media posts for human approval

## Architecture

```
Cron (08:00 UTC) → handler.py → S3 state (insights, drafts, performance)
                                    ↕
                        Approval API (scw_js/) reads/writes same S3 state
```

State is stored as JSON files in Scaleway S3 (`my-imagestore` bucket, `growth-agent/` prefix).

## Stack

| Component | Technology |
|---|---|
| Runtime | Python 3.11 (Scaleway Functions) |
| LLM | IONOS AI Model Hub (Llama 3.3 70B) |
| Analytics | Umami Cloud |
| Social | Mastodon REST API, Bluesky AT Protocol |
| Storage | Scaleway S3 |
| Package manager | uv |

## Development

```bash
# Install dependencies
uv sync --all-extras

# Run tests
uv run pytest

# Lint
uv run ruff check .

# Format
uv run ruff format .
```

## Deploy

```bash
npm install              # serverless plugin (one-time)
npx serverless deploy    # deploy to Scaleway
```

Secrets are loaded from `.env` via `useDotenv: true` in `serverless.yml`. See `.env.example` for required variables.

## Project structure

```
handler.py          # Scaleway Function entry point (cron handler)
serverless.yml      # Scaleway deployment config
requirements.txt    # Pinned deps for Scaleway (via uv export)
agent/
  models.py         # Pydantic state models
  llm_client.py     # IONOS LLM client
  umami_client.py   # Umami analytics client
  page_meta.py      # Blog page metadata fetcher
  publisher.py      # Draft → platform publishing bridge
  storage.py        # S3 + local storage backends
  platforms/
    mastodon.py     # Mastodon REST client
    bluesky.py      # Bluesky AT Protocol client
test/
  test_handler.py   # Handler unit tests
notebooks/          # Jupyter prototypes (01-06)
```
