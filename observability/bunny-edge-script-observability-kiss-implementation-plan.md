# Observability for `bunny_js` — KISS Implementation Plan

**Architecture:** script logs → Scaleway Cockpit (custom Loki data source, `fr-par`) → datasource-managed alert rule → Scaleway Alert manager → email.
Logs from the remaining Scaleway functions (cron, growthapi, facilitator later) land in the same Cockpit **natively and free** — one Grafana for the whole stack.
No phone push, no webhooks, no self-hosted components, no third-party log vendor. **No uptime/heartbeat layer** — there is none today either (the repo's only "health check" is growth-agent's own `/health` route; nothing ever probes the twins from outside), and log-based alerting alone is the accepted scope. The known blind spot this leaves — "the whole pipeline is dead" produces *no* error lines, so no alert — is accepted for now (see trade-offs).

**Why Cockpit over Better Stack:** EU jurisdiction (French company, no CLOUD Act ambiguity); unified view with the Scaleway half of the stack; retention 7 days free vs. Better Stack's 3; ingestion is metered but rounds to ~€0 at this volume (custom-data ingestion is billed per GB; pushing your own data is not free-tier, just negligible here).

---

## 1. Cockpit setup (one-time, ~15 min)

- [x] Console → **Cockpit → Data sources** → create a custom **logs data source** (`bunny-logs`) in region `fr-par`. Push URL: `https://db123d37-9094-4e15-badc-706071190ed7.logs.cockpit.fr-par.scw.cloud/loki/api/v1/push`.
- [x] Create a **Cockpit token with Push Logs permission** (`push_logs` scope, same region as the data source). Called it `bunny_push_logs`; env var `SCW_COCKPIT_PUSH_TOKEN` (NOT `COCKPIT_LOGS_TOKEN` — `observability/.env` already has `SCW_COCKPIT_LOGS_TOKEN`, the read-only query token; the names must not collide). Lives in `bunny_js/.env`.
- [ ] **Alerts tab → enable the alert manager in the same region** as the data source (region must match, otherwise alerts are not delivered).
- [ ] **Contacts → Add email**; keep "Resolved notifications" ticked. Scaleway sends the mail itself — **no TEM needed** for alerting.
- [ ] In the Cockpit Grafana: **Alerting → New alert rule** — must be **datasource-managed** (Grafana-managed alerting is *not supported* in Cockpit). Query on the Loki data source:
  ```logql
  sum(count_over_time({service=~"bunny-web-agent|bunny-llm-agent|bunny-mcp-agent", level="error"}[5m])) > 0
  ```
  One rule covers every `logger.error` call site in all three twins. (Per-script `service` labels — see §3 — so a query can distinguish the twins; the rule itself stays single.)
- [ ] **Rule budget note:** the repo deliberately caps ruler rules at three (Scaleway bills each active rule ~€0.015/day, `observability/test/alerts_budget.test.ts` enforces it for `observability/alerts/*.yaml`). This rule is a fourth billed one, created by hand in Grafana where that test cannot see it — the exact cost should be verified in the Cockpit FAQ/pricing before relying on it. The rule's LogQL lives in this committed file (successor: the observability README), honoring the "push only what is committed" doctrine as far as a Grafana-managed rule allows.

**Auth, verified 2026-11-06 by curl probe against the live endpoint:** `X-Token: <token>` → **204**, and (contrary to the old assumption in this plan) `Authorization: Bearer <token>` → **204** as well; no auth → 401. Both work — the implementation uses Scaleway's documented `X-Token`. A probe line sits in Cockpit as `service="bunny-web-agent", level="info"` (harmless).

## 2. Code changes (~25 lines, plus one unit test) — IMPLEMENTED

Implemented in `bunny_js/src/logger.ts` (buffer, awaited `flushLogs`, monotonic ns counter, `withLogFlush`), wired into all three entries (`searchapi.ts` / `llm.ts` / `mcp.ts` with `bunny-web-agent` / `bunny-llm-agent` / `bunny-mcp-agent`), covered by `bunny_js/test/logger.test.ts` (8 tests). `npm run check` green (tsc, eslint, prettier, 266 tests).

**`logger.ts`** — keep the pino-shaped API and the console shim (dashboard debugging stays free); add a buffer and an awaited, Loki-shaped flush:

```ts
const lines: { level: string; event: object }[] = [];
let nsCounter = 0; // monotonic: two errors in the same ms must not collide

// in info/warn/error: push { level, event: { message, ...fields } } into lines
// (plus the existing console output)

export async function flushLogs(): Promise<void> {
  const batch = lines.splice(0);
  if (!batch.length) return; // common path: zero latency, no subrequest
  // one stream per level; labels stay low-cardinality
  const byLevel = new Map<string, [string, string][]>();
  for (const { level, event } of batch) {
    const vals = byLevel.get(level) ?? [];
    // Loki wants nanosecond STRINGS: string-concat, never Date.now() * 1e6
    // (that float exceeds Number.MAX_SAFE_INTEGER). The counter guards Loki's
    // "duplicate timestamp for series" rejection for same-millisecond lines
    // in one batch — a collision loses the WHOLE push, not one line.
    vals.push([`${Date.now()}${String(++nsCounter).padStart(6, "0")}`, JSON.stringify(event)]);
    byLevel.set(level, vals);
  }
  try {
    // Cockpit does NOT use Authorization: Bearer — the token goes in X-Token
    // (or X-Scope-OrgID for Promtail-style agents). Bearer = 401.
    const res = await fetch(process.env.COCKPIT_LOKI_URL ?? "", {
      method: "POST",
      headers: {
        "X-Token": process.env.SCW_COCKPIT_PUSH_TOKEN ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        streams: [...byLevel].map(([level, values]) => ({
          stream: { service: SERVICE_LABEL, level },
          values,
        })),
      }),
    });
    if (!res.ok) {
      console.error(JSON.stringify({ level: "error", msg: "log flush failed", status: res.status }));
    }
  } catch (err) {
    // swallowed: an ingest outage must never fail the user's request — but it is
    // console.error'd so it stays visible in the bunny dashboard
    console.error(JSON.stringify({ level: "error", msg: "log flush failed", err: String(err) }));
  }
}
```

Key points, deliberately:

- **`await` on the non-empty path.** There is no `waitUntil` in Bunny's edge SDK — the isolate's guaranteed lifetime ends when the handler returns, so a fire-and-forget fetch is closer to fire-and-always-lost than "occasional". The buffer is non-empty almost only on errors, so the await costs ~nothing on the common path and zero when the buffer is empty.
- **`X-Token`, not `Authorization: Bearer`** — Scaleway's Cockpit endpoints take the token in the `X-Token` header (their own Grafana integration does the same); a Bearer header gets a 401 and the experiment looks broken for the wrong reason.
- **`process.env`, not `Deno.env.get`** — the runtime shims pin `process` and every entry imports them first; bare globals are not guaranteed (bunny Deno 1.x).
- **Monotonic nanosecond suffix** — two same-millisecond lines in one batch would trigger Loki's `duplicate timestamp for series` rejection, which drops the whole push.
- **Per-script `service` label** (via the `SERVICE_LABEL` constant set from the entry: `bunny-web-agent` / `bunny-llm-agent` / `bunny-mcp-agent`) — low-cardinality, distinguishes the twins in queries; `level` is the only other label.

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

| Variable                   | bunny kind   | Why                                                        |
| -------------------------- | ------------ | ---------------------------------------------------------- |
| `SCW_COCKPIT_PUSH_TOKEN`   | `--secret`   | authenticates the Loki push (`push_logs` scope)            |
| `COCKPIT_LOKI_URL`         | plain        | public host, inert without the token                       |

**Per script — all three.** `bunny scripts env set` acts on the directory-linked script (searchapi) only; llm and mcp need their values set against their own script ids explicitly. The GitHub Action ships code, not env — a script without its env vars silently logs only to the dashboard.

```bash
# searchapi (linked):
bunny scripts env set SCW_COCKPIT_PUSH_TOKEN <token> --secret
bunny scripts env set COCKPIT_LOKI_URL <https://<id>.logs.cockpit.fr-par.scw.cloud/loki/api/v1/push>
# llm + mcp: same two commands against <LLM_SCRIPT_ID> / <MCP_SCRIPT_ID>
```

## 4. Verification

- [x] curl probe against the live push URL: `X-Token` → 204 (`Authorization: Bearer` also 204 — both accepted; no auth → 401). A probe line sits in the data source as `level="info"`.
- [x] Unit-tested (`test/logger.test.ts`): one batched `{streams}` push with `X-Token` auth; one stream per level with labels `{service, level}` only; same-millisecond lines get strictly increasing 19-digit ns timestamps; empty buffer sends no fetch; rejected fetch and non-2xx pushes never throw and surface via `console.error`; `withLogFlush` flushes on early returns AND handler throws.
- [ ] Deploy with a temporary test route that logs `level: "error"` once → line appears in Cockpit Grafana → Explore (`{service=~"bunny-web.*"}`), alert email arrives. Per the repo doctrine: a rule that has never fired is not known to work.
- [ ] Remove the test trigger; confirm `{level="error"}` is empty on a normal traffic day.
- [ ] Glance at Cockpit usage in the console after a week: ingestion should read ~0 GB (custom-data ingestion is billed per GB, but rounds to ~€0 here); while there, confirm the fourth alert rule's actual billing.

## 5. Convention changes (vs the Scaleway setup)

- `logger.error` semantics unchanged: "ours, and should page" — now it pages by email via the single `level = error` alert rule. A caller's fault is `logger.warn`, as before.
- The pino-shaped console shim stays as-is; Cockpit replaces the Better Stack plan (and the old per-call-site Loki-rule idea) entirely. No `alert_coverage` test for bunny_js (see §2).
- **Three docs updated in the same change (done):**
  - `bunny_js/README.md`: logger deviation bullet now describes the flush + alerted `logger.error` convention; env table gained the two Cockpit rows; the first-deploy env list includes the pair.
  - `bunny_js/src/logger.ts` header comment: same claim, same fix.
  - `observability/README.md`: intro now describes the custom `bunny-logs` data source and the hand-created datasource-managed fourth rule (and the alerting section names it as deliberately outside the `alerts_budget` test). `scripts/logs.ts` still queries only the default source — the bunny data source is read via Grafana → Explore for now.

## 6. Accepted trade-offs (deliberate)

- **No outside-in liveness check** — deliberately out of scope now. A dead pipeline emits no error lines, so no alert fires; discovery is via users (or the bunny dashboard showing silence). The earlier draft considered a tiny `*/5` Scaleway cron probing `GET /search` → 402 and pushing an error line on failure; dropped because no such layer has ever existed for the twins and it is outside the KISS line. If silent-death ever bites, that cron sketch is the escape hatch — but note it must be a NEW function: attaching a 5-minute trigger to `llmx402cron` would run its channel-claim logic 144× more often.
- **No retry, no queue:** a genuinely lost line happens only if the isolate dies between error and flush. The awaited non-empty flush removes the much more mundane loss mode (fetch cancelled at response time).
- **Minutes, not seconds:** alert latency = rule evaluation (5 min window) + email delivery. Inherent to email-grade alerting.
- **Higher platform concentration:** Scaleway now hosts compute (cron), logs, alerting, and the email delivery — if Scaleway itself is down, alerts are silent. Accepted at personal scale; escape hatches are (a) TEM as a direct secondary channel for rare money-path events (`mint_failed`), or (b) an alert-manager webhook (ntfy/Telegram) if this ever stops being acceptable.
- **Metered, not free-tier:** ingestion is billed per GB (rounds to ~€0 here), custom-log retention is free for 7 days, extendable 1 day–5 years at cost; the fourth alert rule adds ~€0.015/day outside the `alerts_budget.test.ts` budget (see §1).
- **Loki quirks:** nanosecond string timestamps + duplicate-rejection (see code comment), `X-Token` auth, datasource-managed alert rules only — all one-time gotchas, not ongoing work.
