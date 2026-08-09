# Minimal Analytics for fretchen.eu — Implementation Plan

## Goal

Count pageviews (per page) on a static Vike site, without Umami. No PII, no
running server, no database service, no auth. Read-only for the site owner —
no public query API.

## Design decisions

- **Aggregate counters only, never per-event rows.** A counter has no
  identifier to protect, so there's no PII question to answer.
- **S3, not Redis/Postgres**, via the existing `@fretchen/s3-utils` package
  (`shared/s3-utils/`). One counter object per hour bucket, updated with a
  conditional read-modify-write. No always-on service, no new client to
  write.
- **Conditional writes via `getS3ObjectWithMeta` + `putS3ObjectConditional`**
  (both already in `@fretchen/s3-utils`, already used by
  `scw_js/x402_channel_storage.ts`). No new S3 client code needed — copy the
  CAS loop shape from `x402_channel_storage.ts`'s `updateChannel()`.
- **`sendBeacon`, not a pixel.** The site already ships JS (Vike hydrates),
  so there's no no-JS audience a pixel would rescue. `sendBeacon` is
  fire-and-forget and survives page unload.
- **Pageview hook: a `useEffect` in `LayoutDefault.tsx` keyed on
  `pageContext.urlPathname`**, not a mount-only effect and not
  `onRenderClient` (this project uses `vike-react`, which has no such hook —
  `LayoutDefault` wraps every page and re-renders on navigation, so this is
  the correct and only place to hook a pageview).
- **No click tracking in v1.** Nothing in the frontend currently needs it;
  add later against a real UI event.

## Data model

One JSON object per site per hour, with a per-page breakdown:

```
counts/{site}/{YYYY-MM-DDTHH}.json
```
```json
{ "hits": 42, "pages": { "/": 30, "/blog/foo": 12 } }
```

That's the entire schema. No sessions, no visitor IDs, no geo, no referrer,
no clicks yet — add fields later only if a real need shows up.

## Code reuse

Reuse `@fretchen/s3-utils` as a real dependency — it's the one piece of this
that's already a formal shared package, built for exactly this (SigV4
signing, conditional PUT). Do **not** import `comment_service`'s own module
code (its `ScalewayEvent`/`HandlerResponse` types, `getCorsHeaders`,
`sanitizePage`) — copy that *shape* into `analytics/`, don't share the
module. This matches the repo's existing convention: CORS headers are
already independently reimplemented in `comment_service`, `growth_api.ts`,
and `x402_facilitator.ts`, with real differences each time (comment_service
restricts `Access-Control-Allow-Origin` to an allowlist; the other two use
`*`). A shared `@fretchen/http-utils` package would be premature abstraction
for ~20 lines that already diverges per service — extract it later only if
a third near-identical need shows up (rule of three), not now.

## Components

### 1. `analytics/` — new serverless package (own folder, not `scw_js/`)

Scaffold copied from `comment_service/` (closest existing analog: anonymous,
unauthenticated, S3-backed POST endpoint, own folder, one function):

- `package.json` — only dependency: `@fretchen/s3-utils` (`file:../shared/s3-utils`).
- `serverless.yml` — one function, `custom_domains: analytics.fretchen.eu`,
  `secret:` block with just `SCW_ACCESS_KEY`/`SCW_SECRET_KEY`.
- `tsup.config.js`, `vitest.config.js`, `eslint.config.js`, `tsconfig.json` —
  copy from `comment_service/`.
- `README.md` — one paragraph, matching `comment_service/README.md`'s
  shape. Add a row for `analytics/` to the root `CLAUDE.md` directory table.

`hit.ts` handler — request/response shape and CORS modeled on
`comment_service/comments.ts` (`ScalewayEvent`, `HandlerResponse`, explicit
`OPTIONS` branch), but `Access-Control-Allow-Origin: *` (not an origin
allowlist) — there's nothing sensitive in the response to protect, `pages/*`
objects are already meant to be public-read, and `*` is this repo's default
per `CLAUDE.md`:

- `POST /hit` with body `{ site: string, path: string }`.
- Validate `path`: must start with `/`, safe URL-path characters only, max
  length (reuse the shape of `comment_service`'s `sanitizePage`). Reject
  anything else with 400.
- Cap the `pages` map at a fixed size per hour bucket (e.g. 200 distinct
  paths): once the cap is hit, still increment `hits` but stop adding new
  keys to `pages`. Path validation alone doesn't stop an attacker from
  generating many distinct *valid-looking* paths — the cap is what actually
  bounds the object size.
- Hour bucket key uses UTC explicitly (`new Date().toISOString()`, sliced to
  the hour) — don't rely on server-local time.
- Steps: compute current hour bucket key (`counts/{site}/{YYYY-MM-DDTHH}.json`)
  → `getS3ObjectWithMeta` (missing = start from `{hits: 0, pages: {}}`, use
  `ifNoneMatch: "*"` on the write) → increment `hits` and `pages[path]` (if
  under the cap) → `putS3ObjectConditional` with `ifMatch` (existing) or
  `ifNoneMatch: "*"` (new) → on `{ok: false, status: 412}`, retry from a
  fresh read, up to 3 attempts, then give up silently (losing a single count
  is fine — never worth erroring the request over).
- No auth — writes are increment-only and low-value to attack.

Tests (vitest, mirroring `comment_service/test/`): mock `@fretchen/s3-utils`,
cover the missing-object→new-bucket path, the 412→retry path, CORS/OPTIONS,
malformed body, invalid/oversized `path` rejection, and the `pages` cap.

### 2. Beacon helper (frontend)

```ts
// website/utils/hitTracker.ts
const ANALYTICS_URL =
  import.meta.env.PUBLIC_ENV__ANALYTICS_URL ?? "https://analytics.fretchen.eu";

export function trackHit(path: string) {
  navigator.sendBeacon(`${ANALYTICS_URL}/hit`, JSON.stringify({ site: "fretchen.eu", path }));
}
```

### 3. Wiring

In `website/layouts/LayoutDefault.tsx` (already imports `usePageContext`):

```ts
const pageContext = usePageContext();

useEffect(() => {
  trackHit(pageContext.urlPathname);
}, [pageContext.urlPathname]);
```

This fires on first load and on every client-side navigation.

### 4. Reading the numbers

No function needed if `counts/*.json` objects are public-read: fetch the
JSON files directly from the bucket, or point a static dashboard at a date
range of keys. Add a thin `GET /stats` function later only if an
auth-gated or aggregated view is wanted.

## PRs: two

**PR 1 — `analytics/` package.** Backend only, deployable and testable on
its own before any frontend change:

1. Scaffold `analytics/` from `comment_service/`; write `hit.ts` using the
   CAS loop from `scw_js/x402_channel_storage.ts` as a template.
2. Write tests, `npm test`.
3. Add `analytics/README.md`; add the `analytics/` row to `CLAUDE.md`.
4. Deploy (`npx serverless deploy`); curl the live endpoint a few times and
   confirm `counts/fretchen.eu/<hour>.json` appears/increments in the bucket,
   including a second write in the same hour (exercises the `ifMatch` path,
   not just `ifNoneMatch`).

**PR 2 — `website/` wiring.** Umami stays untouched and running in parallel:

1. Add `website/utils/hitTracker.ts` and wire it into `LayoutDefault.tsx`.
2. Verify in the browser (Network tab): a `sendBeacon` fires to
   `analytics.fretchen.eu/hit` on load and again on client-side navigation.
3. Leave Umami running unchanged — remove it in a later, separate change
   once a few days of real counts look sane.

## Explicit non-goals

- Unique visitors — would require an identifier, which is exactly what this
  design avoids. Revisit only if genuinely needed, and reach for a
  HyperLogLog sketch rather than per-visitor rows if it comes to that.
- Click tracking, referrers, UTM, multi-tenant / other sites' data, x402
  payment on ingest or query, Umami removal, growth-agent ingestion of this
  data, Redis, Postgres — all out of scope for this first version.
