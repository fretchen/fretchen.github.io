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

```bash
cp .env.example .env
# then edit .env and set TEST_WALLET_PRIVATE_KEY
```

`TEST_WALLET_PRIVATE_KEY` must be a wallet funded with testnet USDC (Optimism Sepolia /
Base Sepolia — see `https://faucet.circle.com/`). Both the Deno and Python notebooks load
this from `.env` in this directory.

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

Dependencies (`@x402/*`, `viem`, `deno.land/std`) are resolved inline — no package install
needed. Just register the Jupyter kernel once:

```bash
deno jupyter --install
```

Then open a notebook and select the **Deno** kernel.

### 3b. Python notebook

```bash
uv sync
uv run jupyter notebook        # or select the kernel in VS Code
```

Register the kernel for VS Code if needed:

```bash
uv run python -m ipykernel install --user --name=x402-facilitator-notebooks
```
