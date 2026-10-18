# bunny_js

Bunny Edge Script twins of the `scw_js` x402 sellers. First port: **searchapi** (the
`web-agent.fretchen.eu` seller — Brave `/search` + `/fetch`, paid per call via x402
batch-settlement). The Scaleway function stays live and untouched; this twin is trialed at
the bunny-provided URL until a formal switch.

## Architecture

- `src/routes.ts` — the **only new code**: the routing layer, natively against web-standard
  `Request`/`Response`, a line-by-line mirror of `scw_js/search_api.ts` (route table, ordering
  rules, and the payment/settlement comments carried over).
- Everything else in `src/` is **ported verbatim** from `scw_js` (import paths only):
  the shared seller stack (`x402_server.ts`, channel storage/sync), the services
  (`search_service.ts`, `web_fetch_service.ts` with the SSRF defence), schemas, discovery,
  favicon, `openapi.search.json`. Two deliberate deviations:
  - `logger.ts` is a pino-shaped console shim — pino is a Node-runtime library; bunny logs go
    to the dashboard, and the observability `logger.error` alert convention does not apply.
  - `utils.ts` ports only the platform-neutral half (CORS/parseJsonBody); the ScwResponse
    envelope helpers are not ported — there is no Scaleway envelope here.
- `src/runtime-shims.ts` — pins the Node `Buffer`/`process` globals the ported code assumes,
  imported FIRST by the entry so they exist before any ported module's top-level code runs.

## Commands

- `npm run build` — tsdown bundle to a **single** `dist/index.js` (bunny deploys one file).
- `npm run dev` — local serve via Deno on 127.0.0.1:8080. Pass real env with
  `--env-file=.env` for the paid-path machinery (the unpaid 402 path needs
  `NFT_WALLET_PUBLIC_KEY` + `RECEIVER_AUTHORIZER_PRIVATE_KEY`).
- `npm test` — vitest (164 tests: 108 ported + the translated routes suite).
- `npm run check` — typecheck + lint + format + tests.
- `npm run deploy` — build, then `bunny scripts deploy dist/index.js` (needs the bunny CLI,
  installed and logged in).

Ordering (repo rule): `npm run build` in `shared/chain-utils` and `shared/s3-utils` first —
they are `file:` dependencies.

## Environment / secrets (bunny script env vars)

Same values the Scaleway function uses — the twin must quote the **same channel tuple**
(receiver, receiver authorizer, withdraw delay) or its channels are unusable:

`bunny scripts env set` kinds — the criterion is not relevance but what a readable
value is worth: plain variables are stored unencrypted and readable back via
`env list`/`env pull`; `--secret` ones are encrypted and redacted. If a value
authenticates, signs, or bills it is a secret; if a public 402 response already reveals it or
it is inert without another credential, plain — and plain stays inspectable when debugging.

| Variable                                   | bunny kind              | Use                                                                                                                                                                                                             |
| ------------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NFT_WALLET_PUBLIC_KEY`                    | plain                   | receiver/payTo (agent wallet) — a public address                                                                                                                                                                |
| `RECEIVER_AUTHORIZER_PRIVATE_KEY`          | secret (`--secret`)     | signs batch-settlement locks/refund authorizations                                                                                                                                                              |
| `BRAVE_API_KEY`                            | secret (`--secret`)     | Brave LLM Context API (metered)                                                                                                                                                                                 |
| `SCW_S3_BUCKET`                            | plain                   | channel-store bucket name — NOT in `.env`; set explicitly (`my-imagestore`): the s3-utils code default points there today, but the twin must not depend on a fallback that could change                         |
| `SCW_S3_REGION`                            | plain                   | `nl-ams` — not in `.env` either; set explicitly alongside the bucket                                                                                                                                            |
| `SCW_ACCESS_KEY` + `SCW_SECRET_KEY`        | secret (`--secret`)     | channel storage (the same bucket `llmx402cron` on Scaleway claims) — most sensitive pair                                                                                                                        |
| `RPC_URL_EIP155_10`, `RPC_URL_EIP155_8453` | secret (`--secret`)     | viem chain reads — NOT in `.env`: production runs unset on viem's public defaults (the accepted tradeoff in scw_js's serverless.yml). Set as `--secret` only if rate limits bite — real values embed an API key |
| `FACILITATOR_URL`                          | plain (code default ok) | `https://facilitator.fretchen.eu`                                                                                                                                                                               |
| `LLM_WITHDRAW_DELAY_SECONDS`               | plain (code default ok) | 86400 — must match production                                                                                                                                                                                   |
| `SEARCH_SERVICE_URL`                       | plain                   | advertised `resource.url` base; the bunny trial URL while trialing, production default otherwise                                                                                                                |

## Known limits / decisions

- **Single-file bundle, 1 MB limit.** tsdown emits one `dist/index.js` with `codeSplitting:
false`; Node builtins stay external and MUST be imported through the `node:` prefix
  (bunny's Deno resolves them; the bundler plugin rewrites bare ones). Measured: **~397 KB**.
- **Non-latin1 header bytes.** Web `Headers` reject the raw-JSON `X-Payment` header when the
  bazaar metadata contains em-dashes/ellipses; `routes.ts` escapes non-latin1 codepoints as
  JSON `\uXXXX` — lossless for any JSON-parsing client.
- **`node:dns/promises`** (SSRF defence) and `node:crypto` (SigV4) are untested on bunny's
  Deno 1.x specifically — `scripts/sigv4_probe.ts` is the deployed probe for the S3 half
  (local Deno: PASS). Deployed runtime verification is part of the trial matrix below.
- **50 subrequests/request** — a paid request uses: S3 ops (lock/charge) + RPC reads (channel
  sync) + 1 upstream + facilitator calls. Well within the cap, but `getFacilitatorFeeConfig`
  style fetch storms would not be.
- **No cron at the edge** — `llmx402cron` stays on Scaleway and claims the channels this twin
  charges, unchanged, because the channel storage is the same bucket.

## Trial matrix (Task 6 — fill in as trials run)

| #   | Check                                                                                                                                                  | Result                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 1   | Unpaid `GET /search` at the bunny URL → 402 + `Payment-Required` header                                                                                | **PASS** 2026-10-18: 402 + Payment-Required, mainnet-only accepts, receiver 0xAAEBC1…239C, `cdn-cache: MISS` |
| 2   | `GET /openapi.json`, `/.well-known/agent-registration.json`, `/favicon.png` at the bunny URL                                                           | **PASS** 2026-10-18: 200s, correct content types and sizes (6.3 KB / 1.2 KB / 31 KB)                         |
| 3   | Deployed SigV4 probe (`scripts/sigv4_probe.ts` as its own script) against the real bucket                                                              | pending                                                                                                      |
| 4   | Paid `/fetch` ($0.001) — buyer: `bunny_js/notebooks/search_x402_buyer.ipynb`, `SERVER` = "bunny-trial" with `TRIAL_URL` set → 200 + `Payment-Response` | pending                                                                                                      |
| 5   | Paid `/search` ($0.01) via the same notebook → 200 + results                                                                                           | pending                                                                                                      |
| 6   | Channel record in S3 updated; next `llmx402cron` run claims it cleanly (observability logs)                                                            | pending                                                                                                      |
| 7   | Cold-start spot checks at the bunny URL                                                                                                                | pending                                                                                                      |

Budget: ≤ ~$0.10 of real purchases.

## Status

Tasks 1-5 of the port plan are done (scaffold, bundle gate, SigV4 spike, verbatim stack +
tests, native routing + tests). Task 6 (deploy + trials) is pending user-side setup: bunny CLI
install + login (or dashboard paste of `dist/index.js`), and the secrets above configured on
the script. The formal switch (moving `web-agent.fretchen.eu` off Scaleway) is out of scope.

## Deploy paths (both can coexist)

Bunny publishes whichever deployment happened **last**, so a manual CLI deploy and the
GitHub Action interoperate by design — deploy from the laptop for an experiment, and the
next push to `main` overwrites it back to the committed state.

1. **Manual (CLI):** `npm run deploy` (= build + `bunny scripts deploy dist/index.js`),
   needs the bunny CLI — `curl -fsSL https://cli.bunny.net/install.sh | sh` (single binary,
   independent of the nvm-managed Node that a global npm install would bind it to) — then
   `bunny login`.
2. **GitHub Actions:** `.github/workflows/deploy-bunny-js.yml` — on push to `main` touching
   `bunny_js/**` or the shared libs, builds (with the repo's shared-deps-first ordering) and
   publishes `dist/index.js` via the official `BunnyWay/actions/deploy-script` action.
   Requires two repo secrets, both from the bunny dashboard
   (**Script -> Deployments -> Settings**):
   - `BUNNYJS_SCRIPT_ID` — the script's id
   - `BUNNYJS_DEPLOY_KEY` — the per-script deploy key (deliberately chosen over the
     account-wide API key the CLI-in-CI variant would need — narrower blast radius)

The workflow ships code only; the script's environment variables and secrets are configured
on the script itself (dashboard or `bunny scripts env set`), so a repo-side leak cannot leak
the Brave key, the authorizer key, or the S3 channel-store credentials.

## First deploy (one-time)

`npm run deploy` alone fails the first time — it pushes to a remote script that must exist,
and the `.bunny/script.json` link comes out of the create step. One-time sequence:

1. `bunny scripts create --type standalone` — creates the remote script and links this
   directory (writes `.bunny/script.json`, gitignored — machine-local, like the docs treat it).
2. Upload the env from `.env` with `bunny scripts env set`, marking the sensitive keys with
   `--secret` (RECEIVER_AUTHORIZER_PRIVATE_KEY, BRAVE_API_KEY, SCW_ACCESS_KEY, SCW_SECRET_KEY,
   RPC_URL_*). Skip `TEST_WALLET_PRIVATE_KEY` — buyer-side only, the server must never see it.
   Verify with `bunny scripts env list`.
3. `npm run deploy` — builds, uploads, publishes; prints the live `*.bunny.run` URL.
4. `bunny scripts env set SEARCH_SERVICE_URL https://<that-url>.bunny.run` and redeploy, so
   the 402 advertises the trial origin instead of the parity default.
5. Unpaid smoke: `curl -D - 'https://<that-url>.bunny.run/search?q=x402'` → 402 +
   `Payment-Required` header.
6. For the GitHub Action: `bunny scripts show` gives the script id; the deploy key is in the
   dashboard (Script -> Deployments -> Settings). Add both as the `BUNNYJS_*` repo secrets.

After the first deploy, the Action and manual `npm run deploy` are interchangeable — last
deployment wins.
