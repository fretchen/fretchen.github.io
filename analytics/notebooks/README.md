# analytics Notebooks

Python notebooks for testing and reading out the `analytics` hit-counter
service, kept here rather than in the repo's general-purpose root
`notebooks/` package, per the per-package notebook convention
(`growth-agent/notebooks/`, `x402_facilitator/notebooks/`,
`scw_js/notebooks/`).

| Notebook               | What it does                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `01_smoke_test.ipynb`  | POSTs real hits to the **deployed** `/hit` endpoint (valid and invalid), then reads the resulting object back from S3 to confirm the write landed. |
| `02_readout.ipynb`     | Aggregates one day's hourly buckets (sum `hits`, merge `pages`) — first against a local fixture to validate the logic, then against real data. Prototype only; not wired into any endpoint. |

`storage.py` provides `LocalStorage` (JSON files on disk — fixture-driven,
no credentials needed) and `S3Storage` (real Scaleway Object Storage via
`boto3`), mirroring `growth-agent/agent/storage.py`'s shape.

## Setup

This directory has its own scoped `pyproject.toml`/`uv.lock`, separate from
the root `notebooks/` package's Python env — same pattern as
`scw_js/notebooks/`.

```bash
uv sync
uv run python -m ipykernel install --user --name=analytics-notebooks
uv run jupyter notebook
```

Then open a notebook and select the **analytics-notebooks** kernel.
Formatting/linting via `uv run ruff format .` / `uv run ruff check .`.

## Credentials

`01_smoke_test.ipynb` and the real-readout half of `02_readout.ipynb` need
`SCW_ACCESS_KEY`/`SCW_SECRET_KEY` to read S3 directly (the `POST /hit` call
itself needs no credentials — the endpoint is unauthenticated by design).
Copy `analytics/.env.example` to `analytics/.env` and fill in real values;
`load_dotenv()`'s upward search finds it from here, same as
`scw_js/notebooks/`. That file is gitignored.
