# x402 Facilitator Notebooks

Integration and demo notebooks for the x402 facilitator in the parent directory.

There is **one notebook per payment scheme**, each testing that scheme's full flow
against a locally running facilitator (`localhost:8080`), plus one buyer-side notebook
that exercises a real deployed integration instead. Pick by what you want to test:

| Notebook                      | Kernel  | Tests what                                                                                                                                                                                                                                                                            |
| ----------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x402_exact.ipynb`            | Deno/TS | The **`exact`** scheme, seller-side: `/supported` → approve the fee allowance → `/verify` → `/settle` → confirm the fee was collected. One on-chain transfer per request.                                                                                                             |
| `x402_batch_settlement.ipynb` | Deno/TS | The **`batch-settlement`** scheme: open a channel with an escrowed deposit, accumulate off-chain vouchers, claim them in one transaction. Sections are labelled by role (buyer signs, seller claims). Runs on **Base Sepolia** — the canonical contract isn't deployed on OP Sepolia. |
| `genimg_x402_buyer.ipynb`     | Deno/TS | A **buyer's** view of a real production integration: pays `scw_js`'s deployed genimg endpoint via `wrapFetchWithPayment`. Doesn't call the facilitator directly at all — it's "does my live integration work," not "does the facilitator's logic work."                               |

The two scheme notebooks are the ones to reach for when changing facilitator code. The
buyer notebook is for checking a deployed endpoint end-to-end.

> Superseded notebooks (`x402_facilitator_demo{,_ts,_with_fees}.ipynb`,
> `x402_fee_facilitator_demo.ipynb`) were removed once `x402_exact.ipynb` covered the same
> ground — the first three predated fees being on by default, so they documented a
> configuration that is no longer the default. See git history if you need them.

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

Deno does not search upward for `.env` by default, so each notebook loads it explicitly:
`load({ envPath: "../.env", examplePath: null, export: true })`. (`examplePath: null`
disables dotenv's "every key in a local `.env.example` must be present" check — this
directory intentionally has no `.env.example` of its own.)

`x402_exact.ipynb` and `x402_batch_settlement.ipynb` also need `NFT_WALLET_PRIVATE_KEY`
(the seller's key) to sign the facilitator's USDC fee approval.

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

### 3. Deno kernel

This directory has its own scoped `deno.json` (`nodeModulesDir: "auto"`, `lock: false`) — Deno
manages a local `node_modules/` here automatically the first time a notebook imports an
`npm:` package, fully separate from the parent `x402_facilitator/node_modules` (which only has
the _facilitator's own_ deps and will not satisfy notebook-only imports like `@x402/fetch`).
No manual install step needed; just register the Jupyter kernel once:

```bash
deno jupyter --install
```

Then open a notebook and select the **Deno** kernel.

> Chosen over Deno's global npm-cache resolution (`nodeModulesDir: "none"`) after repeated
> `ERR_MODULE_NOT_FOUND` failures from that scheme's internal multi-version dependency
> deduplication (a real bug where Deno expected a duplicate `viem` install variant that was
> never actually written to its cache). A real, local `node_modules` sidesteps that entirely.
