# Growth Agent

AI-powered social media growth pipeline for [fretchen.eu](https://fretchen.eu). Runs as a Scaleway Serverless Container triggered daily via cron.

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
| Runtime | Python 3.11 (Scaleway Serverless Container) |
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
bash bin/deploy.sh       # bootstrap registry, build/push image, tofu apply app stack
```

Requires Docker with buildx and OpenTofu. Deploy context comes from your active Scaleway profile in `~/.config/scw/config.yaml`, consistent with the serverless subprojects. Runtime/app variables remain separate and can be provided via `.env`, `terraform/terraform.tfvars`, or `TF_VAR_*`.

### One-time migration for existing checkouts

If your previous setup managed `scaleway_registry_namespace.growth_agent` in `terraform/`, run this once before using `bin/deploy.sh`:

```bash
# 1) Read existing registry namespace ID from old state
cd terraform
REGISTRY_ID=$(tofu state show scaleway_registry_namespace.growth_agent | awk -F '"' '/^[[:space:]]*id[[:space:]]*=/{print $2; exit}')

# 2) Import into bootstrap state
cd ../terraform-bootstrap
tofu init -input=false
tofu import scaleway_registry_namespace.growth_agent "$REGISTRY_ID"

# 3) Remove from old state
cd ../terraform
tofu state rm scaleway_registry_namespace.growth_agent
```

After this migration, `bin/deploy.sh` runs normally without `-target` warnings and without namespace conflicts.

## Project structure

```
handler.py          # Container entry point (HTTP server + cron handler)
Dockerfile          # Container image (uv + Python 3.11)
bin/deploy.sh       # Build, push, tofu apply
terraform-bootstrap/ # OpenTofu bootstrap (registry namespace only)
terraform/          # OpenTofu config (container, cron, secrets)
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
# Start the local HTTP server
uv run python handler.py &

# Trigger the handler (same as Scaleway Container Cron would)
curl -X POST http://localhost:8080/

# Stop the server
kill %1
```

This runs all daily tasks (analytics, publish, pipeline refill) and weekly tasks (insights on Monday) — exactly what Scaleway executes on `0 8 * * *`.

### Common issues

- **No log for today**: Scaleway cron didn't fire. Check the Scaleway Console → Containers → Cron Triggers. Try redeploying with `bash bin/deploy.sh`.
- **`status: started`**: Function timed out. Check `memory_limit` in `terraform/main.tf` (currently 1024 MB). LLM insight generation is the heaviest task.
- **`status: crashed`**: Read the error in the log. Common causes: expired API tokens, S3 permission issues, platform API changes.
- **Draft not published**: Content may exceed character limits (Mastodon: 500, Bluesky: 300). Check the approval UI for warnings.
