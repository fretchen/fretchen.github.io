# Facilitator test notebooks

The facilitator's four scheme notebooks — replicated from
[`x402_facilitator/notebooks/`](../../../x402_facilitator/notebooks/README.md) (the
authoritative per-scheme flow descriptions live there) — exercising the bunny twin
end-to-end over HTTP. The batch-settlement notebooks were the port's Task 5 probe matrix
(the plan itself is preserved in git history as
`x402_facilitator/bunny-port-implementation-plan.md`):

| Notebook                              | Kernel  | Tests what (short form)                                                                          |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `x402_exact.ipynb`                    | Deno/TS | `exact`: /supported → approve fee allowance → /verify → /settle → confirm the fee was pulled     |
| `x402_exact_permit2.ipynb`            | Deno/TS | `exact` via Permit2, paying EURe (no EIP-3009) on Base (`DRY_RUN=1` skips the on-chain writes)   |
| `x402_batch_settlement.ipynb`         | Deno/TS | `batch-settlement`: escrowed deposit → off-chain vouchers → one claim (runs on Base Sepolia)     |
| `x402_batch_settlement_permit2.ipynb` | Deno/TS | `batch-settlement` with EURe: Permit2 deposit → two vouchers → one claim (`DRY_RUN=1` supported) |

## The target — `FACILITATOR_URL`

Env-driven in these copies (`Deno.env.get("FACILITATOR_URL") ?? "http://localhost:8080"`),
unlike the originals' hardcoded cell:

```bash
# unset → http://localhost:8080, the port `npm run dev:facilitator` serves on (verified)
# against the deployed trial script:
FACILITATOR_URL=https://fretchen-facilitator-rtsp5.bunny.run jupyter …
```

Prerequisites when targeting the deployed script (see the package README's env table and
the port plan's Task 5): `FACILITATOR_WALLET_PRIVATE_KEY` (the `facilitatorFees` recipient
the notebooks approve against), `BATCH_SETTLEMENT_TEST_WALLETS` (testnet fee-gate bypass for
the notebook wallets), ideally `RPC_URL_EIP155_84532`.

Dependencies stay self-contained: `npm:` specifiers resolve through the parent
`notebooks/deno.json` scope (Deno config applies to this subfolder too).
