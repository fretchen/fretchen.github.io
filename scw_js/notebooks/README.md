# scw_js Notebooks

Interactive Deno/TypeScript notebooks for spiking scw_js's own server-side behavior —
distinct from `x402_facilitator/notebooks/`, which covers the facilitator (and the
buyer-role spike that needs a running facilitator). Notebooks here test the
**resource-server** (merchant) side: how scw_js should register x402 schemes, handle
verify/settle, and manage its own state (e.g. `ChannelStorage` for batch-settlement).

| Notebook | Kernel | What it does |
|---|---|---|
| `x402_batch_settlement_server_spike.ipynb` | Deno/TS | Phase B0 spike: registers a server-side `BatchSettlementEvmScheme` + `InMemoryChannelStorage`, drives it with a real buyer-side deposit/voucher flow, and inspects exactly what `verifyPayment()` does to channel storage — before writing the real S3-backed handler (`sc_llm_x402.ts`). |

## Setup

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

## Running a local facilitator

Some spikes need a facilitator to talk to (e.g. to call `verifyPayment()`, which
delegates the actual payment validation to the facilitator over HTTP). From
`x402_facilitator/`:

```bash
cd ../../x402_facilitator
npm install && npm run build
npm run dev   # serves dist/x402_facilitator.js on :8080
```
