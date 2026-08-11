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
| **Private counters**   | Stored objects carry no public-read ACL; `GET /stats` gates reads on an owner wallet signature                                                               |
| **Conditional writes** | Compare-and-swap via `storage.ts`'s `HitStorage`, retried up to 3x on conflict — real S3 (`@fretchen/s3-utils`) in production, local files for `npm run dev` |
| **Input sanitisation** | `path` must start with `/`, safe URL-path characters only, max 200 chars                                                                                     |

## API

Three functions, each on its own Scaleway-generated URL (there is no shared
base URL — `npm run info` prints them):

| Function | Trigger                 | Auth                    |
| -------- | ----------------------- | ----------------------- |
| `hit`    | `POST /hit`             | none — anonymous writes |
| `stats`  | `GET /stats`            | owner wallet signature  |
| `rollup` | cron, Mondays 00:30 UTC | n/a                     |

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

### `GET /stats?days=N`

Serves the `/analytics` dashboard. `days` defaults to 30 and is clamped to
1–90. Requires `Authorization: Bearer <base64 payload>` where the payload is
`{address, signature, message}` and `message` is `analytics-api:<unix ts>`,
signed by `OWNER_ETH_ADDRESS` — the same EIP-191 scheme the Growth API uses,
implemented in `auth.ts`. Tokens expire after five minutes. Anything else
returns `401`.

```json
{
  "site": "fretchen.eu",
  "from": "2026-07-11",
  "to": "2026-08-10",
  "totalHits": 1247,
  "days": [{ "date": "2026-07-11", "hits": 42, "source": "beacon" }],
  "pages": [{ "path": "/", "hits": 512 }]
}
```

Days with no traffic are zero-filled and carry no `source`. `pages` is the top
50, descending.

For a token from the terminal:

```bash
OWNER_PRIVATE_KEY=0x... npx tsx scripts/mint-token.ts
```

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

**Hourly buckets are the source of truth and are never deleted.** The `rollup`
cron is a compaction step, and `GET /stats` falls back to the hourly buckets
for any day in the last 14 that isn't rolled up yet. That is what makes a
weekly cadence safe: a late or missed run changes what a query costs, never
what it returns.

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
fetchable from the bucket URL without credentials. Two ways in:

- **`/analytics` on the website** — owner-gated dashboard (total, daily bars,
  top pages) over `GET /stats`. Not linked from any nav.
- **`notebooks/02_readout.ipynb`** — direct S3 reads, for anything the
  dashboard doesn't show.

Jan–Aug 2026 predates the counter and was backfilled from the Umami export —
see `notebooks/03_umami_backfill.ipynb`. Those days are marked
`"source": "umami"` and the dashboard greys them out: Umami filtered bots and
sessionised, so they are not comparable with the beacon's counts.

## Development

```bash
npm install
npm test              # run tests (vitest)
npm run test:coverage # with coverage report
npm run lint          # eslint
npm run build         # tsup → dist/
```

### Local servers

```bash
npm run dev            # :8086  hit,   file storage (notebooks/state/) — no credentials
npm run dev:live       # :8086  hit,   real S3 (needs analytics/.env)
npm run dev:stats      # :8087  stats, file storage
npm run dev:stats:live # :8087  stats, real S3 — serves the actual backfilled history
npm run dev:rollup     # :8088  rollup, file storage
```

The file-storage variants (`ANALYTICS_STORAGE=file` selects `FileHitStorage`
over `S3HitStorage`) read and write `notebooks/state/` instead of S3 — safe to
hammer repeatedly with no risk to production data. See
`notebooks/01_smoke_test.ipynb` for a driver that exercises either target.

**Driving the dashboard from a local `stats`.** `website/.env` sets
`PUBLIC_ENV__ANALYTICS_STATS_URL=http://localhost:8087`; with that in place,
`npm run dev` in `website/` (port 5173, already on the CORS whitelist) and
`npm run dev:stats:live` here gives the real `/analytics` page over real data.
`OWNER_ETH_ADDRESS` must be set in `analytics/.env` to the wallet you connect
with, or every request comes back `401 Address mismatch`. Comment the variable
out of `website/.env` to go back to the deployed function.

Unlike `/hit`, `/stats` is genuinely gated by CORS — it is a `GET` carrying an
`Authorization` header, so the browser preflights it and an origin missing from
`ALLOWED_ORIGINS` blocks the page outright. `vike dev` serves on **3000**.

## Deployment

Secrets (`SCW_ACCESS_KEY`, `SCW_SECRET_KEY`) must be set in the Scaleway
Console.

```bash
npm run deploy         # serverless deploy
npm run info           # per-function URLs
```

After the first deploy of `stats`, paste its URL into the fallback in
`website/hooks/useAnalyticsStats.ts`. That fallback is what production uses —
`.github/workflows/pages.yml` sets no `PUBLIC_ENV__*` variables, so there is no
CI mechanism to swap it. Same manual step `utils/hitTracker.ts` already needs.

## Environment variables

| Variable            | Scope  | Description                             |
| ------------------- | ------ | --------------------------------------- |
| `SCW_ACCESS_KEY`    | secret | Scaleway API / S3 credential            |
| `SCW_SECRET_KEY`    | secret | Scaleway API / S3 credential            |
| `OWNER_ETH_ADDRESS` | env    | Wallet allowed to read `GET /stats`     |
| `ANALYTICS_STORAGE` | env    | `file` selects local storage (dev only) |
