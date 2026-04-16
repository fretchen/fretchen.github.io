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
run_local.py        # CLI for local debugging
```

## Debugging

When the Scaleway cron doesn't seem to fire or publish, follow these steps:

### 1. Check S3 logs (read-only)

```bash
uv run python run_local.py --diagnose
```

This shows the content queue, next scheduled drafts, LLM analysis status, and recent run logs. Log statuses:

| Status | Meaning |
|---|---|
| `completed` | Handler ran successfully |
| `started` | Handler was invoked but never finished (timeout or crash) |
| `crashed` | Handler hit an unexpected error (traceback included) |
| No log for today | Cron did not fire at all |

### 2. Run individual tasks locally

```bash
# Publish overdue approved drafts
uv run python run_local.py --publish

# Refill the draft pipeline
uv run python run_local.py --refill

# Generate LLM insights
uv run python run_local.py --insights

# Ingest analytics
uv run python run_local.py --analytics
```

These execute against the real S3 state and platform APIs (Mastodon/Bluesky), so they have the same effect as the Scaleway cron.

### 3. Run the full handler locally (simulates Scaleway cron)

```bash
# Start the local HTTP server (uses scaleway-functions-python)
uv run python handler.py &

# Trigger the handler (same as Scaleway cron would)
curl http://localhost:8080

# Stop the server
kill %1
```

This runs all daily tasks (analytics, publish, pipeline refill) and weekly tasks (insights on Monday) — exactly what Scaleway executes on `0 8 * * *`.

### Common issues

- **No log for today**: Scaleway cron didn't fire. Check the Scaleway Console → Functions → Cron Triggers. Try redeploying with `npx serverless deploy`.
- **`status: started`**: Function timed out. Check `memoryLimit` in `serverless.yml` (currently 1024 MB). LLM insight generation is the heaviest task.
- **`status: crashed`**: Read the error in the log. Common causes: expired API tokens, S3 permission issues, platform API changes.
- **Draft not published**: Content may exceed character limits (Mastodon: 500, Bluesky: 300). Check the approval UI for warnings.
