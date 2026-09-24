# observability

Project-wide log access and alerting for every Scaleway function in this repo: `facilitator`,
`walletreportcron`, `llmx402`, `llmx402cron`, `searchapi`, `genimgx402token`, `growthapi`, the
comment service and analytics. It belongs to no single service. Cockpit is scoped to the Scaleway
_project_, so one token and one set of rules cover all of them.

| Path                | What                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| `alerts/*.yaml`     | Loki ruler rules. `payments.yaml`: facilitator + claim/refund cron; `services.yaml`: the scw_js services |
| `scripts/logs.ts`   | Read any function's logs from the terminal                                                               |
| `scripts/alerts.ts` | List / push / delete rule groups (namespace `fretchen`)                                                  |
| `alertCoverage.ts`  | Parser behind `scw_js/` and `x402_facilitator/`'s `test/alert_coverage.test.ts`                          |

Setup: `npm install`, then create `.env` as described under [Credentials](#credentials).

## Reading the logs

Use this script, not the Scaleway console or Grafana; neither shows anything useful here.
`scripts/logs.ts` queries Cockpit's Loki API directly:

```bash
npx tsx scripts/logs.ts                                      # which functions are logging
npx tsx scripts/logs.ts facilitator --since 36h --grep "Settlement failed"
npx tsx scripts/logs.ts llmx402cron --since 48h --grep "Refund sweep"
```

Before an incident, know this: a function that has not run inside the `--since` window does not
appear in the discovery listing at all, so widen the window before concluding anything is missing.

## Alerting on log content

Scaleway's built-in alerts are metric-based. The failure that motivated this produced no error
metric at all: the facilitator answered HTTP 200 with `success: false` and the revert reason buried
in the body. That is only ever visible as text in a log line, so the Loki ruler rules in `alerts/`
watch for it directly.

```bash
npx tsx scripts/alerts.ts                                # list the rule groups currently on the ruler
npx tsx scripts/alerts.ts --push                         # push alerts/payments.yaml
npx tsx scripts/alerts.ts --push alerts/services.yaml
npx tsx scripts/alerts.ts --delete payments
```

There are six rules in each of `payments.yaml` and `services.yaml`, deliberately few. The comments
at the top of each file explain which rules exist and why the rest were left out.

`logger.error` means "ours, and should be alertable"; a caller's fault is `logger.warn`.
`scw_js/test/alert_coverage.test.ts` and `x402_facilitator/test/alert_coverage.test.ts` enforce two
things, using the shared `alertCoverage.ts` parser. First, every `logger.error` call in their
package must be matched by a rule here, or be on that test's short exemption list, each with a
reason. Second, no file may use bare `console.*`. `alertCoverage.ts` may only import node
built-ins, because those packages' CI jobs never run `npm install` in this directory.

**Scaleway's Loki ruler caps a range-vector window at 1h.** `llmx402cron` runs every 12h, so a rule
cannot stay "firing" across the gap between runs; a `[13h]` window is rejected outright. Every rule
here uses `[1h]`, which resolves after an hour and fires again on the next cron run if the problem
persists. A resolved notification means "no new occurrence in the last hour", not "fixed".

Pushing is a manual, explicit step and is never wired into deploy. If shipping code could change
the alerting rules as a side effect, a rule silently dropped by a deploy would look exactly like a
system that is simply quiet.

**A rule that has never fired is not known to work.** Before trusting a new one:

1. push a throwaway group matching a log line that occurs on every routine run (e.g.
   `"claimAndSettle completed"`);
2. confirm the email arrives with the summary and description filled in;
3. `--delete` the throwaway group.

This is how `PaymentCronFailed` was proven to work, and the test rule also surfaced a real,
previously unnoticed `withdraw_delay_mismatch` failure on Base Sepolia.

## Credentials

`.env` in this directory (gitignored by the root `.gitignore`):

| Variable                  | Scope                    | Used by             |
| ------------------------- | ------------------------ | ------------------- |
| `SCW_COCKPIT_LOGS_URL`    | —                        | both scripts        |
| `SCW_COCKPIT_LOGS_TOKEN`  | `read_only_logs`         | `scripts/logs.ts`   |
| `SCW_COCKPIT_RULES_TOKEN` | `full_access_logs_rules` | `scripts/alerts.ts` |

Both are **Cockpit** tokens, a different credential type from `SCW_SECRET_KEY`, which these scripts
reject with a 403. Create them with:

```bash
scw cockpit token create name=<name> token-scopes.0=read_only_logs region=fr-par
scw cockpit token create name=<name> token-scopes.0=full_access_logs_rules region=fr-par
```

They are kept as two tokens because `logs.ts` is run casually and often and should only ever be
able to read. Each token's secret is shown once, so save it immediately: a token whose secret is
lost can only be deleted.
