# Analytics Service

Serverless anonymous pageview counter for [fretchen.eu](https://www.fretchen.eu).
Deployed as a **Scaleway Function** (Node 22) — hourly hit counts are stored
as JSON objects in Scaleway S3. No sessions, no visitor IDs, no PII.

## Features

| Feature                | Details                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Aggregate counters** | One JSON object per site per UTC hour — no per-event rows                                                                                                    |
| **Per-page breakdown** | Hourly object also tracks a `pages` map, capped at 200 distinct paths                                                                                        |
| **Anonymous writes**   | `POST /hit` is unauthenticated and increment-only                                                                                                            |
| **Private counters**   | Stored objects carry no public-read ACL; reads are authorized separately                                                                                     |
| **Conditional writes** | Compare-and-swap via `storage.ts`'s `HitStorage`, retried up to 3x on conflict — real S3 (`@fretchen/s3-utils`) in production, local files for `npm run dev` |
| **Input sanitisation** | `path` must start with `/`, safe URL-path characters only, max 200 chars                                                                                     |

## API

**Base URL** `https://analytics.fretchen.eu`

### `POST /hit`

```json
{ "site": "fretchen.eu", "path": "/blog/my-post" }
```

Returns `204` on success (or after a silently dropped count), `400` on an
invalid `site`/`path`, `405` on any method other than `POST`/`OPTIONS`.

### `OPTIONS /hit`

CORS preflight. Origin whitelist (`https://www.fretchen.eu`,
`http://localhost:3000`), falling back to the canonical origin — matching
`comment_service`. Note this is consistency/defence-in-depth, not a spam
control: CORS is browser-enforced only, and the pageview beacon is a
`sendBeacon` simple request that triggers no preflight at all. Write abuse is
bounded by path validation and the 200-entry `pages` cap instead.

## Data model

Two layers. The endpoint only ever writes the first.

**Write layer — one object per UTC hour:**

```
counts/{site}/{YYYY-MM-DDTHH}.json
{ "hits": 42, "pages": { "/": 30, "/blog/foo/": 12 } }
```

**Read layer — one object per month, a per-day rollup:**

```
rollup/{site}/{YYYY-MM}.json
{ "site": "fretchen.eu", "month": "2026-03", "days": {
    "2026-03-04": { "hits": 18, "pages": { "/": 9 }, "source": "umami" } } }
```

The rollup layer exists because reads can't use the hourly one. `listObjects`
(`shared/s3-utils`) issues a single un-paginated ListObjectsV2 — max 1000 keys,
silently truncated — and hourly objects accrue at 8760/year; a 30-day window
would also mean 720 sequential GETs. Rollup keys are **computed** from a date
range rather than listed, so there is no ceiling and a month costs one GET.
Nothing rolls up the live hourly data yet — see *Reading the data*.

`source` is per day, not per month, because the changeover month holds both
kinds and they are not the same measurement: Umami filtered bots and
sessionised, the beacon counts every hydration and client-side navigation.

**Path form.** `pageContext.urlPathname` is what the beacon sends, and Vike
derives it from `urlLogical` — set by `website/pages/+onBeforeRoute.ts`. So
recorded paths are in canonical `sitemap.xml` form: locale prefix stripped,
trailing slash on every non-root path, no query, no fragment. One consequence:
German pages are indistinguishable from their English counterparts, since the
beacon never sees the locale.

## Reading the data

Counters are **private** — no public-read ACL is set, so they are not
fetchable from the bucket URL without credentials. Reads currently happen in
`notebooks/02_readout.ipynb` (rollups for whole days, hourly buckets for
today).

A future authorized `GET /stats` endpoint (owner wallet signature, as in
`scw_js/growth_api.ts`) will serve them. It is also the natural home for the
rollup write: fold any complete day not yet in its month object on read, so
there is no second deploy unit and no cron to fail silently.

Jan–Aug 2026 predates the counter and was backfilled from the Umami export —
see `notebooks/03_umami_backfill.ipynb`.

## Development

```bash
npm install
npm test              # run tests (vitest)
npm run test:coverage # with coverage report
npm run lint          # eslint
npm run build         # tsup → dist/
```

### Local server

```bash
npm run dev      # localhost:8086, file storage (notebooks/state/) — no credentials needed
npm run dev:live # localhost:8086, real S3 (needs analytics/.env) — pre-deploy sanity check
```

`npm run dev` writes counters to `notebooks/state/` instead of S3
(`ANALYTICS_STORAGE=file` selects `FileHitStorage` over `S3HitStorage` in
`hit.ts`/`storage.ts`) — safe to hammer repeatedly with no risk to
production data. See `notebooks/01_smoke_test.ipynb` for a driver that
exercises either target.

## Deployment

Secrets (`SCW_ACCESS_KEY`, `SCW_SECRET_KEY`) must be set in the Scaleway
Console.

```bash
npm run deploy         # serverless deploy
```

## Environment variables

| Variable         | Scope  | Description                  |
| ---------------- | ------ | ---------------------------- |
| `SCW_ACCESS_KEY` | secret | Scaleway API / S3 credential |
| `SCW_SECRET_KEY` | secret | Scaleway API / S3 credential |
