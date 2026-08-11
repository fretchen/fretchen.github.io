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

Two Scaleway functions. `analytics` serves both HTTP endpoints under one URL
with path-based routing (the repo convention — see `x402_facilitator`);
`rollup` is cron-only, because a scheduled invocation has no path to route on.
`npm run info` prints the URLs.

| Function    | Trigger                 | Auth                    |
| ----------- | ----------------------- | ----------------------- |
| `analytics` | `POST /hit`             | none — anonymous writes |
| `analytics` | `GET /stats`            | owner wallet signature  |
| `rollup`    | cron, Mondays 00:30 UTC | n/a                     |

`analytics.ts` matches routes **exactly**, unlike `x402_facilitator`'s
`path.includes()`. That matters here because an anonymous write sits next to an
owner-gated read: no URL shape may reach `/stats` handling without its auth
check, and none may reach `/hit`'s unauthenticated write while looking like
`/stats`.

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

### `GET /stats`

Serves the `/analytics` dashboard. Requires `Authorization: Bearer <base64
payload>` where the payload is `{address, signature, message}` and `message` is
`analytics-api:<unix ts>`, signed by `OWNER_ETH_ADDRESS`. Tokens expire after
five minutes; anything else returns `401`.

Both halves of that scheme — building the message and verifying it — live in
`@fretchen/chain-utils` (`auth-protocol.ts`), shared with the Growth API. The
`analytics-api` prefix is what scopes a token to this service.

```json
{
  "site": "fretchen.eu",
  "from": "2025-08-12",
  "to": "2026-08-11",
  "days": {
    "2026-08-10": { "hits": 240, "pages": { "/": 200 }, "source": "beacon" }
  }
}
```

**No range parameter, by design.** The endpoint always returns the trailing
year, and `days` is sparse — a day with no traffic is absent, not a zero row.
Measured against real data that is ~25KB, about 3KB gzipped, so windowing the
response server-side bought nothing and cost a round trip per view. The
dashboard fetches once and slices client-side
(`website/utils/analyticsBuckets.ts` owns the totals, the top-pages list and
the daily/weekly/monthly bucketing).

For a token from the terminal:

```bash
OWNER_PRIVATE_KEY=0x... node --input-type=module -e '
import { privateKeyToAccount } from "viem/accounts";
const a = privateKeyToAccount(process.env.OWNER_PRIVATE_KEY);
const message = `analytics-api:${Math.floor(Date.now() / 1000)}`;
const signature = await a.signMessage({ message });
const payload = { address: a.address, signature, message };
console.log("Bearer " + Buffer.from(JSON.stringify(payload)).toString("base64"));
'
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
for recent days that aren't rolled up yet. That is what makes a weekly cadence
safe: a late or missed run changes what a query costs, never what it returns.

Two things keep that fallback cheap, because rebuilding a day costs 24 GETs:

- **Only days after the newest compacted one are probed.** Compaction runs in
  date order, so everything up to that point is settled — present means
  traffic, absent means none. Without this, every quiet day inside the window
  would be re-read on every load. `HOURLY_FALLBACK_DAYS` (14) still caps it for
  a cold start.
- **`/stats` writes back what it rebuilds.** A complete day reconstructed from
  hourly buckets is stored via the same CAS `writeDay` the cron uses, so the
  next load reads it as one rollup GET. Today is never written back — it is
  still being counted. Write failures are swallowed: warming a cache must not
  fail a read.

In practice a warm load is **37 GETs** — 13 monthly rollups plus today's 24
hours — regardless of which range the dashboard is showing.

**Nothing deletes the hourly buckets, but they can stop being reachable.** The
bucket has no lifecycle configuration and no code path deletes under `counts/`
(the only S3 deletes in the repo are scoped to `channels/` and `growth-agent`),
so the objects are permanent — ~9MB/year, never listed, so no truncation limit
applies. What _is_ lossy is visibility: if the cron stops for longer than
`HOURLY_FALLBACK_DAYS`, `/stats` stops probing those days and renders them as
no-traffic while the data sits there intact. To pull such a gap back in, set
`ROLLUP_WINDOW_DAYS` wide enough to cover it and invoke `rollup` once.

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

- **`/analytics` on the website** — owner-gated dashboard over `GET /stats`,
  with three views: 30 days by day, 90 days by week, one year by month.
  Switching between them re-slices the single cached response rather than
  refetching. Linked from the nav bar alongside `/growth`, but only once the
  owner wallet is connected (`OwnerNavLinks` in `website/layouts/LayoutDefault.tsx`).
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
npm run dev        # :8086  /hit + /stats, file storage (notebooks/state/) — no credentials
npm run dev:live   # :8086  /hit + /stats, real S3 (needs analytics/.env)
npm run dev:rollup # :8088  rollup, file storage
```

One server for both endpoints, because they are one function. The
file-storage variants (`ANALYTICS_STORAGE=file` selects `FileHitStorage` over
`S3HitStorage`) read and write `notebooks/state/` instead of S3 — safe to
hammer repeatedly with no risk to production data. See
`notebooks/01_smoke_test.ipynb` for a driver that exercises either target.

**Driving the website from a local function.** `website/.env` sets
`PUBLIC_ENV__ANALYTICS_URL=http://localhost:8086`; with that in place, `npm run
dev` in `website/` (port 3000, already on the CORS whitelist) plus `npm run
dev:live` here gives the real `/analytics` page over real data, and the beacon
lands locally too. `OWNER_ETH_ADDRESS` must be set in `analytics/.env` to the
wallet you connect with, or every `/stats` request comes back `401 Address
mismatch`. Comment the variable out of `website/.env` to go back to the
deployed function.

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

After deploying, paste the `analytics` function's URL into the fallback in
`website/utils/analyticsApi.ts` — one string, shared by the beacon and the
dashboard. That fallback is what production uses: `.github/workflows/pages.yml`
sets no `PUBLIC_ENV__*` variables, so there is no CI mechanism to swap it.

**Then delete the old `hit` function in the Scaleway Console.** It predates the
merge into `analytics` and `serverless deploy` does not remove functions that
have been dropped from the config, so it would otherwise keep running (and
keep collecting beacons from any stale client) forever.

## Environment variables

| Variable             | Scope  | Description                                                 |
| -------------------- | ------ | ----------------------------------------------------------- |
| `SCW_ACCESS_KEY`     | secret | Scaleway API / S3 credential                                |
| `SCW_SECRET_KEY`     | secret | Scaleway API / S3 credential                                |
| `OWNER_ETH_ADDRESS`  | env    | Wallet allowed to read `GET /stats`                         |
| `ANALYTICS_STORAGE`  | env    | `file` selects local storage (dev only)                     |
| `ROLLUP_WINDOW_DAYS` | env    | Days the cron compacts (default 14); widen to recover a gap |
