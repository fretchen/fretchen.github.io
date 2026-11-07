# Observability for `bunny_js` — KISS Implementation Plan

**Architecture:** script logs → Scaleway Cockpit (custom Loki data source, `fr-par`) → datasource-managed alert rule → Scaleway Alert manager → email.
Logs from the remaining Scaleway functions (cron, growthapi, facilitator later) land in the same Cockpit **natively and free** — one Grafana for the whole stack.
No phone push, no webhooks, no self-hosted components, no third-party log vendor. **No uptime/heartbeat layer** — there is none today either (the repo's only "health check" is growth-agent's own `/health` route; nothing ever probes the twins from outside), and log-based alerting alone is the accepted scope. The known blind spot this leaves — "the whole pipeline is dead" produces _no_ error lines, so no alert — is accepted for now (see trade-offs).

**Why Cockpit over Better Stack:** EU jurisdiction (French company, no CLOUD Act ambiguity); unified view with the Scaleway half of the stack; retention 7 days free vs. Better Stack's 3; ingestion is metered but rounds to ~€0 at this volume (custom-data ingestion is billed per GB; pushing your own data is not free-tier, just negligible here).

---

## 1. Cockpit setup (one-time, ~15 min)

- [x] Console → **Cockpit → Data sources** → create a custom **logs data source** (`bunny-logs`) in region `fr-par`. Push URL: `https://db123d37-9094-4e15-badc-706071190ed7.logs.cockpit.fr-par.scw.cloud/loki/api/v1/push`.
- [x] Create a **Cockpit token with Push Logs permission** (`push_logs` scope, same region as the data source). Called it `bunny_push_logs`; env var `SCW_COCKPIT_PUSH_TOKEN` (NOT `COCKPIT_LOGS_TOKEN` — `observability/.env` already has `SCW_COCKPIT_LOGS_TOKEN`, the read-only query token; the names must not collide). Lives in `bunny_js/.env`.
- [x] **Alert manager enabled + email contact existing** — already active for the Scaleway functions' ruler rules (they page through it), so the bunny rule reuses it. No new contact needed.
- [x] **Alert rule live — pushed via `scripts/alerts.ts` to the custom source's ruler, not hand-created in Grafana.** The rules token (`full_access_logs_rules`) reaches the custom data source's ruler too (probed 2026-11-06: GET → 404 "no rule groups found" = empty; the push-scoped token correctly gets 403). The rule is committed as `observability/alerts/bunny.yaml` (`BunnySellersNeedAttention`), `alerts.ts` gained a `--url` override, and `test/alerts_budget.test.ts` pins the count at **four** — better doctrine fidelity than the original Grafana-by-hand idea: committed file, budget test, no dashboard fiddling. Pushed with:
  ```bash
  npx tsx scripts/alerts.ts --push alerts/bunny.yaml --url https://db123d37-9094-4e15-badc-706071190ed7.logs.cockpit.fr-par.scw.cloud
  ```
  Rule query (window `[1h]` per the repo-wide ruler convention, which the budget test enforces):
  ```logql
  sum(count_over_time({service=~"bunny-web-agent|bunny-llm-agent|bunny-mcp-agent", level="error"}[1h])) > 0
  ```
  One rule covers every `logger.error` call site in all three twins. (Per-script `service` labels — see §2 — so a query can distinguish the twins; the rule itself stays single.)
- [x] **Why a NEW rule (the twins were covered in scw_js):** a ruler rule evaluates only the data source it lives in. The twins' phrases were removed from `alerts/services.yaml` at the move (its header says so), because their logs left the DEFAULT logs source — and they now return in the CUSTOM `bunny-logs` source, which `ServicesNeedAttention` cannot query, phrases or no phrases. Scaleway accepts external pushes only into custom sources, and the twins' own `level` arrives as a real Loki label (unlike scw's JSON-encoded envelope), so one `{level="error"}` match replaces the whole phrase list.
- [x] **Rule budget:** the repo deliberately caps ruler rules (Scaleway bills each active rule ~€0.015/day). The bunny rule is the deliberate fourth — post hoc verified in the Cockpit billing dashboards at the §4 weekly check — and `test/alerts_budget.test.ts` now pins `bunny.yaml: 1`, so a fifth rule fails CI instead of the bill.

**Auth, verified 2026-11-06 by curl probe against the live endpoint:** `X-Token: <token>` → **204**, and (contrary to the old assumption in this plan) `Authorization: Bearer <token>` → **204** as well; no auth → 401. Both work — the implementation uses Scaleway's documented `X-Token`. Bonus finding: the observability **read-only logs token** (`SCW_COCKPIT_LOGS_TOKEN`) queries the custom source's `query_range` fine (the rules token 403s on queries — its scope is exactly rules, as documented), so extending `scripts/logs.ts` to the bunny source later is trivial. A probe info line from setup sits in the source (harmless).

## 2. Code changes — IMPLEMENTED (post-review fixes included)

Implemented in `bunny_js/src/logger.ts` (buffer, awaited `flushLogs`, monotonic ns counter, `withLogFlush`), wired into all three entries (`searchapi.ts` / `llm.ts` / `mcp.ts` with `bunny-web-agent` / `bunny-llm-agent` / `bunny-mcp-agent`), covered by `bunny_js/test/logger.test.ts` (11 tests, including the review's regression guards). `npm run check` green. The authoritative code is the shipped `logger.ts` — the earlier sketch below is kept only for the design rationale; three of its details were corrected in review:

- **Auth:** both `X-Token` and `Authorization: Bearer` are accepted by Cockpit (probed: 204/204; only no-auth gets 401) — the implementation uses the documented `X-Token`.
- **The flush is AWAITED when non-empty** (no `waitUntil` in Bunny's SDK), and the fetch carries **`signal: AbortSignal.timeout(1500)`** — without a bound, the await couples every logged request's latency to ingest health.
- **`debug` is console-only, never buffered** — the llm twins log `{ prompt }` at debug, scw's pino gate (`LOG_LEVEL ?? "info"`) suppressed those lines pre-move, and shipping them would be a new egress of user content, not parity.

```ts
// sketch — see src/logger.ts for the shipped version
const lines: { level: string; event: object }[] = [];
let nsCounter = 0; // two errors in the same ms must not collide

// info/warn/error buffer { level, event: { message, ...fields } }; debug does NOT
// (user content stays dashboard-only). Console output keeps its old shape.

export async function flushLogs(): Promise<void> {
  const batch = lines.splice(0);
  if (!batch.length || !url || !token) return; // happy path: zero latency, no subrequest
  // group one Loki stream per level; ns suffix keeps same-ms lines strictly
  // increasing (a duplicate timestamp loses the WHOLE push)
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(1500), // awaited => must be bounded
      headers: { "X-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({ streams: [...byLevel].map(...) }),
    });
    if (!res.ok) console.error(...); // visible in the bunny dashboard
  } catch (err) {
    console.error(...); // never breaks the response
  }
}
```

**Entry files (`searchapi.ts`, `llm.ts`, `mcp.ts`) — not the route files.** There is no single `routes.ts`: three handler files with ten-plus early `return` paths each (OPTIONS, discovery, 402, 404). Editing returns per file is unmaintainable and misses paths. Instead, one decorator, applied once per entry:

```ts
// logger.ts (or a small flush.ts)
export function withLogFlush(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } finally {
      await flushLogs(); // covers early returns AND handler throws
    }
  };
}

// each entry file
BunnySDK.net.http.serve(withLogFlush(handleRequest));
```

Subrequest budget: +1 per request at most (only when the buffer is non-empty) — well within the 50/request cap.

**New unit test (`bunny_js/test/`)** — the buffer/flush mechanics, not a tautology. The old `alert_coverage` idea ("assert every `logger.error` writes a `level: "error"` stream") is true by construction of the single `emit` function and can never catch anything, so there is no `alert_coverage` test for bunny_js. Instead, one small test asserts: buffer fills from `logger.error`; a single non-empty flush posts one batched `{streams}` payload with `X-Token` auth (mock fetch); an empty buffer does no fetch at all; same-millisecond lines get strictly increasing timestamps (no duplicate); a failing fetch does not throw out of the decorator.

## 3. Environment (per the repo's own secret criterion: authenticates ⇒ secret) — SET ON ALL THREE SCRIPTS

Both values are in `bunny_js/.env` for local dev (token linespacing fixed: `KEY = value` was normalized to `KEY=value` — Deno `--env-file` parsing), and were set live via the bunny CLI (2026-11-06): searchapi (linked), `fretchen-llm` (--id), `fretchen-mcp` (--id). The env values are inert until the next deploy ships the flush code.

**Nothing goes into the GitHub deploy Action.** `deploy-bunny-js.yml` ships code only — each script's env is deliberately bunny-side ("a repo leak must not be a secrets leak"), so the deploy (Action or manual CLI) picks the pair up automatically; carrying the token as a repo/CI secret would weaken that design.

| Variable                 | bunny kind | Why                                             |
| ------------------------ | ---------- | ----------------------------------------------- |
| `SCW_COCKPIT_PUSH_TOKEN` | `--secret` | authenticates the Loki push (`push_logs` scope) |
| `COCKPIT_LOKI_URL`       | plain      | public host, inert without the token            |

**Per script — all three.** `bunny scripts env set` acts on the directory-linked script (searchapi) only; llm and mcp need their values set against their own script ids explicitly. The GitHub Action ships code, not env — a script without its env vars silently logs only to the dashboard.

```bash
# searchapi (linked):
bunny scripts env set SCW_COCKPIT_PUSH_TOKEN <token> --secret
bunny scripts env set COCKPIT_LOKI_URL <https://<id>.logs.cockpit.fr-par.scw.cloud/loki/api/v1/push>
# llm + mcp: same two commands against <LLM_SCRIPT_ID> / <MCP_SCRIPT_ID>
```

## 4. Verification

- [x] curl probe against the live push URL: `X-Token` → 204 (`Authorization: Bearer` also 204 — both accepted; no auth → 401). A probe line sits in the data source as `level="info"`.
- [x] Unit-tested (`test/logger.test.ts`, 11 tests): one batched `{streams}` push with `X-Token` auth; one stream per level with labels `{service, level}` only; same-millisecond lines get strictly increasing 19-digit ns timestamps; empty buffer sends no fetch; **debug never reaches the buffer (privacy regression guard)**; **the fetch init carries an AbortSignal (timeout regression guard)**; rejected, non-2xx and aborted pushes never throw and surface via `console.error`; `withLogFlush` flushes on early returns AND handler throws.
- [x] **Review fixes (2026-11-07)**: `AbortSignal.timeout(1500)` bounds the awaited flush; `debug` lines stopped buffering (prompt egress closed); `alerts.ts` refuses `--push alerts/bunny.yaml` without `--url` (silent wrong-ruler push closed). Remaining post-merge findings-flow actions: THREAT_MODEL token row + `bunny_js/SECURITY.md` line for the push-only Cockpit token.
- [x] **Rule fired end-to-end at setup (2026-11-06):** one `level="error"` probe line was pushed through the exact ingest path the scripts will use (X-Token → 204), confirmed stored via `query_range` `{service="bunny-web-agent", level="error"}`, the mounted rule matched it (1m interval, `[1h]`, `for: 0m`), and **the alert-manager email arrived** — the full chain is proven, per the doctrine that a rule that has never fired is not known to work. Expect one "resolved" email roughly an hour later when the probe ages out of the window; the probe lines themselves age out with the free 7-day retention. No test trigger to remove — there was no temporary route, only the probe line.
- [ ] **Ship the flush code: merge `observ` → `main` → `deploy-bunny-js.yml` publishes all three twins (it triggers on push to `main` touching `bunny_js/**`; PRs only run CI).** Env is already set on the scripts, the rule is live — no config changes ride along with the deploy. The manual three-deploy in the README (`npm run deploy` + llm/mcp by script id) is the out-of-band laptop path and NOT needed here: a laptop deploy publishes the same new code minutes earlier, but the next merge to main would republish anyway (last deployment wins), and deploying unmerged state from a branch is the exact divergence that doctrine avoids. After the Action's deploys, the first real `logger.error` from a paid request flows the probe's path from inside the isolate.
- [ ] Confirm `{level="error"}` is empty on a normal traffic day (the probe ages out within the hour).
- [ ] Glance at Cockpit usage in the console after a week: ingestion should read ~0 GB (custom-data ingestion is billed per GB, but rounds to ~€0 here); while there, confirm the fourth alert rule's actual billing.

## 5. Convention changes (vs the Scaleway setup)

- `logger.error` semantics unchanged: "ours, and should page" — now it pages by email via the single `level = error` alert rule. A caller's fault is `logger.warn`, as before.
- The pino-shaped console shim stays as-is; Cockpit replaces the Better Stack plan (and the old per-call-site Loki-rule idea) entirely. No `alert_coverage` test for bunny_js (see §2).
- **Three docs updated in the same change (done):**
  - `bunny_js/README.md`: logger deviation bullet now describes the flush + alerted `logger.error` convention; env table gained the two Cockpit rows; the first-deploy env list includes the pair.
  - `bunny_js/src/logger.ts` header comment: same claim, same fix.
  - `observability/README.md`: intro now describes the custom `bunny-logs` data source and the found-a-place-for-everything-new rule (`alerts/bunny.yaml`, pushed to its own ruler via `--url`, pinned in the budget test at four). `scripts/logs.ts` still queries only the default source — the bunny data source is read via Grafana → Explore for now (its read token verifies against the custom source, so extending the CLI later is trivial).

## 6. Accepted trade-offs (deliberate)

- **No outside-in liveness check** — deliberately out of scope now. A dead pipeline emits no error lines, so no alert fires; discovery is via users (or the bunny dashboard showing silence). The earlier draft considered a tiny `*/5` Scaleway cron probing `GET /search` → 402 and pushing an error line on failure; dropped because no such layer has ever existed for the twins and it is outside the KISS line. If silent-death ever bites, that cron sketch is the escape hatch — but note it must be a NEW function: attaching a 5-minute trigger to `llmx402cron` would run its channel-claim logic 144× more often.
- **No retry, no queue:** a genuinely lost line happens only if the isolate dies between error and flush. The awaited non-empty flush removes the much more mundane loss mode (fetch cancelled at response time).
- **Minutes, not seconds:** alert latency = rule evaluation (1m interval) + email delivery. Inherent to email-grade alerting.
- **Higher platform concentration:** Scaleway now hosts compute (cron), logs, alerting, and the email delivery — if Scaleway itself is down, alerts are silent. Accepted at personal scale; escape hatches are (a) TEM as a direct secondary channel for rare money-path events (`mint_failed`), or (b) an alert-manager webhook (ntfy/Telegram) if this ever stops being acceptable.
- **Metered, not free-tier:** ingestion is billed per GB (rounds to ~€0 here), custom-log retention is free for 7 days, extendable 1 day–5 years at cost; the fourth alert rule adds ~€0.015/day, pinned inside the `alerts_budget.test.ts` budget (see §1).
- **Loki quirks:** nanosecond string timestamps + duplicate-rejection (see code comment), `X-Token` auth, datasource-managed alert rules only — all one-time gotchas, not ongoing work.
