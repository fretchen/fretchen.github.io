# scw_js Notebooks

Notebooks for exploring and spiking scw_js's own behavior — both the **x402
resource-server** side (Deno/TS) and scw_js's backend API integrations (Python), kept
together here rather than in the repo's general-purpose root `notebooks/` package,
per the per-package notebook convention (`growth-agent/notebooks/`,
`x402_facilitator/notebooks/`).

| Notebook | Kernel | What it does |
|---|---|---|
| `x402_batch_settlement_server_spike.ipynb` | Deno/TS | Phase B0 spike: registers a server-side `BatchSettlementEvmScheme` + `InMemoryChannelStorage`, drives it with a real buyer-side deposit/voucher flow, and inspects exactly what `verifyPayment()` does to channel storage — before writing the real S3-backed handler (`sc_llm_x402.ts`). |
| `ionos_llm.ipynb` | Python | Exploration of the IONOS AI Model Hub API — the same API `llm_service.ts::callLLMAPI` calls. |
| `merkle_tree.ipynb` | Python | How merkle trees work and how they're used for LLM API usage batching — the mechanism behind `llm_service.ts`'s `saveLeafToTree`/`processMerkleTree`. |
| `bfl_ai.ipynb` | Python | Exploration of the Black Forest Labs image-generation API — the same API `image_service.ts` (`genimg_bfl.js`) wraps. |
| `scw_llm.ipynb` | Python | Client testing against `sc_llm.ts`'s local dev server (`localhost:8080`): builds and signs the wallet-based bearer-auth payload `auth_utils.ts` expects. |
| `requests.ipynb` | Python | Client testing against the image-generation/NFT endpoint (`genimg_x402_token.ts`'s local dev server). |

## Setup — Deno (x402 spike)

All env lives in the package's single **`scw_js/.env`** (one level up — there is no
per-notebook `.env`), same pattern as `x402_facilitator/notebooks/`. Deno's `load()`
doesn't search upward like Python's `load_dotenv()` does, so notebooks here load it
explicitly: `load({ envPath: "../.env", examplePath: null, export: true })`.

This directory has its own scoped `deno.json` (`nodeModulesDir: "auto"`, `lock: false`)
— Deno manages a local `node_modules/` here automatically, fully separate from the
parent `scw_js/node_modules` (which only has scw_js's own runtime deps) and from
`x402_facilitator/notebooks/node_modules` (a different, unrelated local tree).

Register the Jupyter kernel once (if not already done for the sibling facilitator
notebooks — it's the same global Deno kernel):

```bash
deno jupyter --install
```

Then open a notebook and select the **Deno** kernel.

## Setup — Python (API-exploration notebooks)

This directory also has its own scoped `pyproject.toml`/`uv.lock`, separate from the
root `notebooks/` package's Python env — scw_js has no other Python tooling, so this
mirrors that package's self-contained pattern rather than sharing it.

```bash
uv sync
uv run python -m ipykernel install --user --name=scw-js-notebooks
uv run jupyter notebook
```

Then open a notebook and select the **scw-js-notebooks** kernel. Formatting/linting via
`uv run ruff format .` / `uv run ruff check .`, same as the root package.

## Running a local facilitator

Some spikes need a facilitator to talk to (e.g. to call `verifyPayment()`, which
delegates the actual payment validation to the facilitator over HTTP). From
`x402_facilitator/`:

```bash
cd ../../x402_facilitator
npm install && npm run build
npm run dev   # serves dist/x402_facilitator.js on :8080
```
