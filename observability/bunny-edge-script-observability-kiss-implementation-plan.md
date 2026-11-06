# Observability for `bunny_js` — KISS Implementation Plan

**Architecture:** script logs → Better Stack (ingest + query + alert) → email.
Everything runs on the Better Stack free plan (3 GB logs / month, 10 monitors + heartbeats, email alerts).
No phone push, no webhooks, no self-hosted components.

---

## 1. Better Stack setup (one-time, ~10 min)

- [ ] Create account → create a **Source** (e.g. `bunny-web-agent`). Note the **ingesting host URL** and the **source token**. The ingest endpoint accepts a single event or a JSON **array** of events with `Authorization: Bearer <token>`.
- [ ] Create a **Log alert** (Log SQL): saved query `level = error` → notify via **email**. This one rule covers every `logger.error` call site.
- [ ] Create **three uptime monitors** — one per script, since each twin is its own deployment:
  - **searchapi:** `GET https://<search-url>/search` with no payment headers, **expected status code 402**. The unpaid challenge is proof that routing, script init, and the shared 402 machinery all work — the outside-in check that catches "the whole pipeline is dead", the failure mode log-based alerting structurally cannot see.
  - **llm and mcp:** `GET https://<llm|mcp-url>/openapi.json`, **expected status code 200**. This proves that each script's isolate boots and its routing works. They deliberately do not probe the 402 machinery: that code (`x402_server.ts`) is shared with searchapi, whose monitor already approves it, and a POST-without-payment 402 probe is just extra fragility for no additional coverage. Interval 5 min each. Three of the free plan's ten monitors.

## 2. Code changes (~15 lines, plus one unit test)

**`logger.ts`** — keep the pino-shaped API and the console shim (dashboard debugging stays free); add a buffer and an awaited flush:

```ts
const lines: object[] = [];

// in info/warn/error: push { level, message, ...fields } into lines
// (plus the existing console output); emit() already builds the line —
// reuse it and map fields for Better Stack:  msg -> message, time -> timestamp

export async function flushLogs(): Promise<void> {
  const batch = lines.splice(0);
  if (!batch.length) return; // common path: zero latency, no subrequest
  try {
    const res = await fetch(process.env.BETTERSTACK_INGEST_HOST ?? "", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.BETTERSTACK_SOURCE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch), // array of events
    });
    if (!res.ok) {
      console.error(JSON.stringify({ level: "error", msg: "log flush failed", status: res.status }));
    }
  } catch (err) {
    // swallowed: an ingest outage must never fail the user's request — but it is
    // console.error'd so it stays visible in the bunny dashboard (the free tier of truth)
    console.error(JSON.stringify({ level: "error", msg: "log flush failed", err: String(err) }));
  }
}
```

Design points, deliberately:

- **`await` on the non-empty path.** The buffer is almost only non-empty on errors, so the await costs ~nothing on the common path and nothing at all when it is empty; fire-and-forget on the edge is closer to fire-and-always-lost than "occasional" — there is no `waitUntil` in Bunny's SDK, and the isolate's guaranteed lifetime ends the moment the handler returns.
- **`process.env`, not `Deno.env.get`** — the runtime shims pin `process` and every entry imports them first; bare globals are not guaranteed (bunny Deno 1.x).
- **Field mapping, not pass-through** (`msg → message`, `time → timestamp`): Better Stack renders the message from `message` and parses `timestamp` natively; relying on undocumented auto-detection of `msg`/`time` would make the query and the event rendering fragile.
- Flush failure is visible (console.error → bunny dashboard) but never blocks or fails the response.

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

**New unit test (`bunny_js/test/`)** — the buffer/flush mechanics, not a tautology. The old `alert_coverage` idea ("assert every `logger.error` writes `level: "error"`") is true by construction of the single `emit` function and can never catch anything, so there is no `alert_coverage` test for bunny_js. Instead, one small test asserts: buffer fills from `logger.error`; a single non-empty flush posts one batched request (mock fetch); an empty buffer does no fetch at all; a failing fetch does not throw out of the decorator.

## 3. Environment (per the repo's own secret criterion: authenticates ⇒ secret)

| Variable | bunny kind | Why |
| --- | --- | --- |
| `BETTERSTACK_SOURCE_TOKEN` | `--secret` | authenticates the ingest |
| `BETTERSTACK_INGEST_HOST` | plain | public host, inert without the token |

**Per script — all three.** `bunny scripts env set` acts on the directory-linked script (searchapi) only; llm and mcp need their values set against their own script ids explicitly. The GitHub Action ships code, not env — a script without its env vars silently logs only to the dashboard.

```bash
# searchapi (linked):
bunny scripts env set BETTERSTACK_SOURCE_TOKEN <token> --secret
bunny scripts env set BETTERSTACK_INGEST_HOST <https://...>
# llm + mcp: same two commands against <LLM_SCRIPT_ID> / <MCP_SCRIPT_ID>
```

## 4. Verification

- [ ] Deploy with a temporary test route (or the dev server) that logs `level: "error"` once → line appears in Better Stack with the message rendered (confirms the `msg → message` mapping) and the alert email arrives. Per the repo doctrine: a rule that has never fired is not known to work.
- [ ] `GET /search` without payment → searchapi monitor reports up (expecting 402); `GET /openapi.json` on llm and mcp → their monitors report up (expecting 200).
- [ ] Confirm a normal request produces the flush only when log lines exist (dev server) — no fetch per request on the happy path.
- [ ] Remove the test trigger; confirm the query `level = error` is empty on a normal traffic day.
- [ ] After one week, check the Better Stack volume dashboard: if the buffer's info lines ever threaten the 3 GB budget, the lever is to buffer warn+error only (the alert needs errors anyway) — info stays console-only. Decide on data, not now.

## 5. Convention changes (vs the Scaleway setup)

- `logger.error` semantics unchanged: "ours, and should page" — now it pages by email via the single `level = error` alert. A caller's fault is `logger.warn`, as before.
- The pino-shaped console shim stays as-is; Better Stack replaces Loki + alert rules + the syslog forwarding ideas entirely. No `alert_coverage` test for bunny_js (see §2).
- **Three docs become wrong the moment this ships — update them in the same change:**
  - `bunny_js/README.md`: the bullet "bunny logs go to the dashboard … the `logger.error` alert convention does not apply" → point to this setup.
  - `bunny_js/src/logger.ts` header comment: same claim, same fix.
  - `observability/README.md`: "(The llm/search/mcp sellers moved to bunny_js — Edge Script logging has no Loki rules here)" → note they alert via Better Stack instead (this plan), Loki stays Scaleway-only.

## 6. Accepted trade-offs (deliberate)

- **No retry, no queue:** a genuinely lost line happens only if the isolate dies between error and flush — the uptime monitor covers the systemic case; a retry queue for a €0.01 query is not worth infrastructure. The awaited non-empty flush removes the much more mundane loss mode (fetch cancelled at response time).
- **Minutes, not seconds:** alert latency = query evaluation + email delivery. Inherent to email-grade alerting.
- **Single-platform risk:** if Better Stack itself is down, alerts are silent — but flush failures surface in the bunny dashboard. Accepted at personal scale; the escape hatch is a direct webhook channel (ntfy/Telegram) if this ever stops being acceptable.
- **llm/mcp monitors check liveness, not payments:** their 402 machinery is covered transitively via the shared `x402_server.ts` through the searchapi monitor. If the three scripts ever diverge in their payment paths, revisit (a POST 402-monitor each).
