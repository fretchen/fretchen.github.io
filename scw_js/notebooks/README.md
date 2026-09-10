# scw_js Notebooks

Notebooks for exercising scw_js's own behavior — the **x402 buyer** side (Deno/TS) and
the third-party APIs scw_js integrates with (Python), kept together here rather than in
the repo's general-purpose root `notebooks/` package, per the per-package notebook
convention (`growth-agent/notebooks/`, `x402_facilitator/notebooks/`).

Names follow `<subject>_<role>`, with two roles: **`_buyer`** drives one of our own paid
endpoints end to end as a real client would, and **`_explore`** pokes at a third-party
API we depend on.

| Notebook                  | Kernel  | What it does                                                                                                                                                                                                                                                                                                                                    |
| ------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `genimg_x402_buyer.ipynb` | Deno/TS | Real end-to-end buyer flow against the **locally-running** `genimg_x402_token.ts` server via `wrapFetchWithPayment` — verifies the `images/v1` response envelope over a real payment, and is the blueprint for `website/components/ImageGenerator.tsx`. Scheme: `exact`.                                                                        |
| `sc_llm_x402_buyer.ipynb` | Deno/TS | The same, for `sc_llm_x402.ts` — and the blueprint `website/hooks/useX402Chat.ts` was built from. Scheme: `batch-settlement`, so it also covers channel storage and deposit strategy, plus a two-hop tool-calling round-trip (runs on testnet against the tool-aware mock). Linked from the public `/agent-onboarding` page: **do not rename.** |
| `bfl_api_explore.ipynb`   | Python  | Exploration of the Black Forest Labs image-generation API — the same API `image_service.ts` wraps.                                                                                                                                                                                                                                              |

## Setup — Deno (buyer notebooks)

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

## Setup — Python (API-exploration notebook)

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

## Facilitator

The buyer notebooks do **not** need a local facilitator: `FACILITATOR_URL` defaults to
the deployed `https://facilitator.fretchen.eu`, so a locally-run handler verifies and
settles against production. To point at a local one instead, set `FACILITATOR_URL` in
`scw_js/.env` and run it from `x402_facilitator/`:

```bash
cd ../../x402_facilitator
npm install && npm run build
npm run dev   # serves dist/x402_facilitator.js on :8080
```
