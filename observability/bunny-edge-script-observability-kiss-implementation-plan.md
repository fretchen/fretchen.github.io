# Observability for `bunny_js` — KISS Implementation Plan

**Architecture:** script logs → Better Stack (ingest + query + alert) → email.
Everything runs on the Better Stack free plan (3 GB logs / month, 10 monitors + heartbeats, email alerts).
No phone push, no webhooks, no self-hosted components.

---

## 1. Better Stack setup (one-time, ~10 min)

- [ ] Create account → create a **Source** (e.g. `bunny-web-agent`). Note the **ingesting host URL** and the **source token**.
- [ ] Create a **Log alert**: saved query `level = error` → notify via **email**. This one rule covers every `logger.error` call site.
- [ ] Create an **uptime monitor**: `GET https://<script-url>/search` with no payment headers, **expected status code 402** (the unpaid challenge = proof that routing, script init, and the 402 machinery all work). Interval 5 min. This is the outside-in check that catches "the whole pipeline is dead" — the failure mode log-based alerting structurally cannot see.

## 2. Code changes (~15 lines)

**`logger.ts`** — keep the pino-shaped API and the console shim (dashboard debugging stays free); add a buffer and a flush:

```ts
const lines: object[] = [];

// in info/warn/error: push { level, message, ...fields } into lines
// (plus the existing console output)

export function flushLogs(): void {
  const batch = lines.splice(0);
  if (!batch.length) return;
  fetch(BETTERSTACK_INGEST_HOST, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("BETTERSTACK_SOURCE_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(batch), // array of events
  }).catch(() => {}); // best-effort: never blocks, no retry
}
```

**`routes.ts`** — flush per request, after the handler, before returning the response:

```ts
const res = await handler(req);
flushLogs();
return res;
```

## 3. Environment (per the repo's own secret criterion: authenticates ⇒ secret)

| Variable | bunny kind | Why |
| --- | --- | --- |
| `BETTERSTACK_SOURCE_TOKEN` | `--secret` | authenticates the ingest |
| `BETTERSTACK_INGEST_HOST` | plain | public host, inert without the token |

```bash
bunny scripts env set BETTERSTACK_SOURCE_TOKEN <token> --secret
bunny scripts env set BETTERSTACK_INGEST_HOST <https://...> 
```

## 4. Verification

- [ ] Deploy with a temporary test route (or dev server) that logs `level: "error"` once → line appears in Better Stack, alert email arrives.
- [ ] `GET /search` without payment → monitor reports up (expecting 402).
- [ ] Remove the test trigger; confirm the query `level = error` is empty on a normal traffic day.

## 5. Convention changes (vs the Scaleway setup)

- `logger.error` semantics unchanged: "ours, and should page" — now it pages by email via the single `level = error` alert.
- The `alert_coverage` test simplifies: instead of "every `logger.error` has a matching Loki rule", assert **every `logger.error` writes `{ level: "error" }`** (the one query covers all call sites).
- The pino-shaped console shim stays as-is; Better Stack replaces Loki + alert rules + the syslog forwarding ideas entirely.

## 6. Accepted trade-offs (deliberate)

- **Fire-and-forget:** occasional lost log lines on isolate eviction — no retry, no queue. The uptime monitor covers the systemic case; a lost line from a €0.01 query is not worth infrastructure.
- **Minutes, not seconds:** alert latency = query evaluation + email delivery. Inherent to email-grade alerting.
- **Single-platform risk:** if Better Stack itself is down, alerts are silent. Accepted at personal scale; the escape hatch is a direct webhook channel (ntfy/Telegram) if this ever stops being acceptable.