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

```
counts/{site}/{YYYY-MM-DDTHH}.json
```

```json
{ "hits": 42, "pages": { "/": 30, "/blog/foo": 12 } }
```

## Reading the data

Counters are **private** — no public-read ACL is set, so they are not
fetchable from the bucket URL without credentials. A future authorized
`GET /stats` endpoint (owner wallet signature, as in `scw_js/growth_api.ts`)
will serve reads.

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
