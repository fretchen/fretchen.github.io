# Analytics Service

Serverless anonymous pageview counter for [fretchen.eu](https://www.fretchen.eu).
Deployed as a **Scaleway Function** (Node 22) — hourly hit counts are stored
as JSON objects in Scaleway S3. No sessions, no visitor IDs, no PII.

## Features

| Feature                | Details                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| **Aggregate counters** | One JSON object per site per UTC hour — no per-event rows                |
| **Per-page breakdown** | Hourly object also tracks a `pages` map, capped at 200 distinct paths    |
| **Anonymous, no auth** | Increment-only writes; low-value to attack                               |
| **Conditional writes** | Compare-and-swap via `@fretchen/s3-utils`, retried up to 3x on conflict  |
| **Input sanitisation** | `path` must start with `/`, safe URL-path characters only, max 200 chars |

## API

**Base URL** `https://analytics.fretchen.eu`

### `POST /hit`

```json
{ "site": "fretchen.eu", "path": "/blog/my-post" }
```

Returns `204` on success (or after a silently dropped count), `400` on an
invalid `site`/`path`, `405` on any method other than `POST`/`OPTIONS`.

### `OPTIONS /hit`

CORS preflight (`Access-Control-Allow-Origin: *`).

## Data model

```
counts/{site}/{YYYY-MM-DDTHH}.json
```

```json
{ "hits": 42, "pages": { "/": 30, "/blog/foo": 12 } }
```

## Development

```bash
npm install
npm test              # run tests (vitest)
npm run test:coverage # with coverage report
npm run lint          # eslint
npm run build         # tsup → dist/
```

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
