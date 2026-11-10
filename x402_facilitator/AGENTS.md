# x402_facilitator — agent rules

Weekly facilitator wallet report (`walletreportcron`, Scaleway Functions, Mondays 08:00 UTC).
See [`README.md`](./README.md) for what it reports, the TEM/secret setup, and the commands.
The x402 payment facilitator itself (verify/settle/supported) lives in
[`bunny_js/src/facilitator/`](../bunny_js/src/facilitator/) and serves
`facilitator.fretchen.eu` — its docs moved with it
([`bunny_js/README.md`](../bunny_js/README.md) → _Facilitator_ sections); this package's old
HTTP code and endpoint docs are retired (git history — including the move's plan,
`bunny-port-implementation-plan.md`).

Two ways to break this package silently, both with a named guard:

1. **A `logger.error` line with no alert phrase** — `logger.error` means "ours, and should
   page", and the pages come from `FacilitatorNeedsAttention` in
   `observability/alerts/payments.yaml`. `test/alert_coverage.test.ts` fails if a call site
   is added without a matching phrase or an EXEMPT entry with a reason. Do not use bare
   `console.*`.
2. **Untyped JS creeping back** — `test/no_stray_js.test.ts` fails on any `.js` outside the
   two config files.

When a change touches the fee model in `wallet_report_fee.ts`, port it to
`bunny_js/src/facilitator/x402_fee.ts` in the same sitting — that copy charges real fees;
this one only reports on them.

## Serverless conventions

Public env values go in `env:` in `serverless.yml`; secrets are configured in the Scaleway
Console only. All responses include CORS headers.

## x402 role

This package is payment-**adjacent** only: it reads balances and emails a report; it never
moves funds. Use the **`x402`** skill before anything that names a role.
