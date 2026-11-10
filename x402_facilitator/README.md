# x402_facilitator

Home of the **weekly facilitator wallet report** (`walletreportcron`, a Scaleway Function,
Mondays 08:00 UTC). The EIP-3009/EIP-712 payment facilitator itself moved to
bunny_js — it now serves `facilitator.fretchen.eu` as the `fretchen-facilitator` Edge Script:

| Claim about the facilitator                               | Where it lives now                                                               |
| --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Code (verify / settle / supported, fee model)             | [`../bunny_js/src/facilitator/`](../bunny_js/src/facilitator/)                   |
| Routing + API reference                                   | `../bunny_js/src/facilitator/facilitator_routes.ts` + `openapi.facilitator.json` |
| Recipient gating (the "whitelist architecture"), fee pull | [`../bunny_js/README.md`](../bunny_js/README.md) → _Facilitator_ sections        |
| Payment-scheme walkthroughs (notebooks)                   | [`../bunny_js/notebooks/facilitator/`](../bunny_js/notebooks/facilitator/)       |
| The move's decisions + cutover checklist                  | git history (the removed `bunny-port-implementation-plan.md`)                    |
| The old HTTP API/endpoint docs                            | git history (this file before the teardown)                                      |

## What `walletreportcron` does

Every Monday it emails a one-pager about the facilitator's hot wallet, straight from chain
state (no database of facilitator activity exists):

- native (ETH) balance per network — the real "will settlements keep working?" signal,
  warned when below `LOW_GAS_THRESHOLD_ETH` (default 0.005 ETH)
- each fee token's balance — accumulated fee revenue (USDC on OP/Base; EURC, EURe on Base)
- week-over-week activity diff (transactions sent, fees earned, gas spent), read via
  historical balance/nonce calls at a block ~7 days ago — deliberately not `eth_getLogs`
  (the free-tier RPC caps those at 10-block ranges). The cost: no exact/batch-settlement
  split; revisit if volume ever makes it interesting.

The nominal fee arithmetic (`wallet_report_fee.ts`) is a verbatim extraction of the retired
`x402_fee.ts`'s fee-model pieces — the facilitator's fee source of truth is
`bunny_js/src/facilitator/x402_fee.ts`; keep them in sync when the fee changes.

One network failing (RPC hiccup) degrades that network's row to an error, never the whole
report; a 500 is returned only when EVERY network failed. A report that cannot send at all
(email API failure, or `FACILITATOR_WALLET_PRIVATE_KEY` unset) logs a `logger.error` line —
`FacilitatorNeedsAttention` in `observability/alerts/payments.yaml` pages on it, because a
silent week is indistinguishable from a quiet one.

## Commands

- `npm run dev` — serve the cron's handler locally (port 8085, `NODE_ENV=test`).
- `npm test` — vitest: the report's unit tests, the alert-coverage guard
  (`test/alert_coverage.test.ts`, pairing every `logger.error` with a rule phrase or an
  EXEMPT reason), EIP-712 reference vectors, the no-stray-JS guard.
- `npm run check` — lint + format + typecheck + coverage.
- `npm run deploy` — build + `serverless deploy` (`walletreportcron` only). **The next
  deploy also DELETES the retired `facilitator` function** — the plugin removes functions
  missing from `serverless.yml`. That is the intended teardown step; run it deliberately.
- `npm run logs` — `serverless logs -f walletreportcron` (or, nicer:
  `cd ../observability && npx tsx scripts/logs.ts walletreportcron --since 8d`).

## Environment / Secrets

Public env (`serverless.yml` → `env:`): `NODE_ENV`, `LOG_LEVEL`,
`FACILITATOR_FEE_AMOUNT` (read by the report's fee arithmetic), `LOW_GAS_THRESHOLD_ETH`.

Secrets (Scaleway Console / `.env`, referenced via `secret:`):

| Secret                           | Use                                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| `FACILITATOR_WALLET_PRIVATE_KEY` | derive the report's wallet address (never signs here; settlements run on the edge now)              |
| `SCW_SECRET_KEY`                 | doubles as the TEM X-Auth-Token (same value `comment_service` uses)                                 |
| `TEM_PROJECT_ID`                 | Scaleway Transactional Email — the report's send                                                    |
| `NOTIFICATION_EMAIL`             | where the report lands                                                                              |
| `RPC_URL_EIP155_*`               | per-network RPCs; unset = viem's public, rate-limited defaults — UNSET RPCs WILL BREAK the balances |

`BATCH_SETTLEMENT_TEST_WALLETS` is gone from this package: only the facilitator reads it,
and the facilitator lives on the edge now.
