# x402 Facilitator Notebooks

Integration and demo notebooks for the x402 facilitator in the parent directory. They
exercise the `/verify`, `/settle`, and `/supported` endpoints against a locally running
facilitator (`localhost:8080`, and `localhost:8081` for the fee variant) or the deployed
`https://facilitator.fretchen.eu`.

| Notebook | Kernel | What it does |
|---|---|---|
| `x402_facilitator_demo.ipynb` | Python 3 | Full verify→settle walkthrough vs. `localhost:8080`; EIP-712 signing with `web3` + `eth_account` |
| `x402_facilitator_demo_ts.ipynb` | Deno/TS | Same flow in TypeScript via `@x402/*` + `viem`, vs. `localhost:8080` |
| `x402_fee_facilitator_demo.ipynb` | Deno/TS | Fee facilitator vs. `localhost:8080` |
| `x402_facilitator_demo_with_fees.ipynb` | Deno/TS | Fee-splitting facilitator (deployed `-feefacilitator` URL / `localhost:8081`) |
| `genimg_x402_buyer.ipynb` | Deno/TS | End-to-end buyer: `wrapFetchWithPayment` against a paid service + `facilitator.fretchen.eu` |
| `x402_batch_settlement_buyer.ipynb` | Deno/TS | **batch-settlement** scheme spike (Phase 0): `/supported` check + deposit/voucher verify→settle vs. `localhost:8080`. Runs on **Base Sepolia** (canonical contract there, not OP Sepolia); needs a Base Sepolia-funded `TEST_WALLET_PRIVATE_KEY` |

## Setup

### 1. Configure the test wallet

All notebooks load env from the **single `x402_facilitator/.env`** one level up — there is
no separate `.env` in this directory. Add the missing keys there:

```bash
cd ..
$EDITOR .env   # add TEST_WALLET_PRIVATE_KEY (and NFT_WALLET_PUBLIC_KEY as the recipient)
```

`TEST_WALLET_PRIVATE_KEY` must be a wallet funded with testnet USDC (Optimism Sepolia /
Base Sepolia — see `https://faucet.circle.com/`).

- **Python notebooks** find `../.env` automatically — `python-dotenv`'s `load_dotenv()`
  walks up from the notebook's cwd.
- **Deno/TS notebooks** do not search upward by default, so each one loads explicitly:
  `load({ envPath: "../.env", examplePath: null, export: true })`. (`examplePath: null`
  disables dotenv's "every key in a local `.env.example` must be present" check — this
  directory intentionally has no `.env.example` of its own.)

### 2. Run a facilitator to talk to

Most notebooks default to `localhost:8080`. Start one from the parent package:

```bash
cd ..
npm install
npm run build
npm run dev          # serves dist/x402_facilitator.js on :8080
```

Sanity check: `curl http://localhost:8080/supported`.

Alternatively, point the notebook's `FACILITATOR_URL` at the deployed
`https://facilitator.fretchen.eu` (already the default in `genimg_x402_buyer.ipynb`).

### 3a. Deno/TypeScript notebooks

This directory has its own scoped `deno.json` (`nodeModulesDir: "auto"`, `lock: false`) — Deno
manages a local `node_modules/` here automatically the first time a notebook imports an
`npm:` package, fully separate from the parent `x402_facilitator/node_modules` (which only has
the *facilitator's own* deps and will not satisfy notebook-only imports like `@x402/fetch`).
No manual install step needed; just register the Jupyter kernel once:

```bash
deno jupyter --install
```

Then open a notebook and select the **Deno** kernel.

> Chosen over Deno's global npm-cache resolution (`nodeModulesDir: "none"`) after repeated
> `ERR_MODULE_NOT_FOUND` failures from that scheme's internal multi-version dependency
> deduplication (a real bug where Deno expected a duplicate `viem` install variant that was
> never actually written to its cache). A real, local `node_modules` sidesteps that entirely.

### 3b. Python notebook

```bash
uv sync
uv run jupyter notebook        # or select the kernel in VS Code
```

Register the kernel for VS Code if needed:

```bash
uv run python -m ipykernel install --user --name=x402-facilitator-notebooks
```
