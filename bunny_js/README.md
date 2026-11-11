# bunny_js

Bunny Edge Scripts serving the x402 sellers that outgrew `scw_js`: **searchapi**
(the `web-agent.fretchen.eu` seller — Brave `/search` + `/fetch`), **llm** (the
`llm-agent.fretchen.eu` chat seller) and **mcp** (the `mcp-agent.fretchen.eu` stateless
MCP endpoint), all paid per call/message via x402 batch-settlement. The switch is done:
these scripts are the authoritative servers behind the three `-agent.fretchen.eu`
domains, and the Scaleway twins they replaced are removed from `scw_js`'s
`serverless.yml` — the plugin deletes the functions themselves on that package's next
`npm run deploy` (run it before merging to make the docs' "retired" claims literal).
Only `scw_js`'s `llmx402cron` remains, claiming the channels these twins charge.

The fourth script is the **facilitator** (`facilitator.ts`, `service="facilitator"`) — the x402
payment facilitator (`/verify`, `/settle`, `/supported`, `/openapi.json`) ported verbatim from
`x402_facilitator/` (payment core + its test suite) with Scaleway's envelope exchanged for
native `Request`/`Response` routing in `src/facilitator_routes.ts`. The cutover happened —
`facilitator.fretchen.eu` serves this script, and the retired Scaleway function is deleted
(the move's decisions + cutover checklist are preserved in git history as
`x402_facilitator/bunny-port-implementation-plan.md`); that package keeps only `walletreportcron`
now, the facilitator's weekly wallet-report cron — the edge has no cron).

### Facilitator: recipient gating (the "whitelist architecture")

There is no recipient whitelist. Both schemes gate recipients the same way: an allowance the
recipient has `approve()`d for the facilitator's wallet, **in the token the payment settles
in** — USDC on any network, EURC and EURe on Base. The fee is charged in that same token
(0.01 USDC, 0.01 EURC or 0.01 EURe), so a seller paid in several approves each. EURe has 18
decimals, so its 0.01 is `10000000000000000` atomic units, not the `10000` of USDC/EURC — and
an EURe approval of `1000000` covers no fee at all. Any other token is refused with
`unsupported_fee_asset`. For `exact` the token is `requirements.asset`; for batch-settlement
it is the channel's token (`payload.token` for `settle`, the claims' channel token for
`claim`, `channelConfig.token` for a claim-carrying refund), and a batch mixing tokens is
refused. `checkMerchantAllowance()` (`src/facilitator/x402_fee.ts`) reads that allowance; an
under-approved recipient is rejected with `insufficient_fee_allowance` rather than settled
for free. `BATCH_SETTLEMENT_TEST_WALLETS` (`src/facilitator/x402_whitelist.ts`) is the one
remaining carve-out: a listed address skips the allowance check, but only on testnets (the
old manual allowlist and NFT-holder branch are retired — `claim`/`settle` moved onto the
allowance check in FEE_MODEL_PLAN.md Phase 3).

### Facilitator: the fee pull right after the settlement

The fee is a second transaction from the facilitator wallet, sent within a second of the
settlement. On a load-balanced RPC that second send can reach a node that has not caught up:
fee pulls have reused the settlement's nonce (`replacement transaction underpriced`) and
simulated against a balance that did not yet include the payment. Two measures, both in
`src/facilitator/x402_fee.ts`:

- Every transaction is signed by an account from `loadFacilitatorAccount()`, which carries
  viem's shared `nonceManager`, so the fee pull never takes a nonce below the settlement's.
  Build no signer for this key any other way.
- A fee send that the node refused before broadcast (underpriced, nonce too low, or a
  reverted simulation) is sent again, up to `FEE_SEND_ATTEMPTS` times, 2 s apart
  (`FEE_RETRY_DELAY_MS`). Nothing that may have been broadcast is ever resent; a receipt
  timeout stays `fee_collection_pending`.

If a settlement ever hangs as `settlement_pending` on a healthy RPC after a deploy, suspect a
dropped transaction the nonce manager has already counted: a restart of the isolate clears it.

## Architecture

- `src/routes.ts` — the **only new code**: the routing layer, natively against web-standard
  `Request`/`Response`, a line-by-line mirror of `scw_js/search_api.ts` (route table, ordering
  rules, and the payment/settlement comments carried over).
- Everything else in `src/` is **ported verbatim** from `scw_js` (import paths only):
  the shared seller stack (`x402_server.ts`, channel storage/sync), the services
  (`search_service.ts`, `web_fetch_service.ts` with the SSRF defence), schemas, discovery,
  favicon, `openapi.search.json`. Two deliberate deviations:
  - `logger.ts` is a pino-shaped console shim — pino is a Node-runtime library; the lines go to
    the bunny dashboard AND, since the Cockpit integration, to Scaleway's custom Loki data
    source: `withLogFlush()` wraps each entry handler, so buffered lines are pushed per
    request to Cockpit, where one datasource-managed alert rule on `level="error"` pages by
    email (the `logger.error` convention applies again — see
    [`observability/bunny-edge-script-observability-kiss-implementation-plan.md`](../observability/bunny-edge-script-observability-kiss-implementation-plan.md)).
  - `utils.ts` ports only the platform-neutral half (CORS/parseJsonBody); the ScwResponse
    envelope helpers are not ported — there is no Scaleway envelope here.
- `src/runtime-shims.ts` — pins the Node `Buffer`/`process` globals the ported code assumes,
  imported FIRST by the entry so they exist before any ported module's top-level code runs.
- **Agent root page** — every origin serves a root page at `GET /`, unconditionally (agents
  send `Accept: */*`, so a text/html gate hid the page from its reader). Built by
  [`src/discovery.ts`](./src/discovery.ts)'s `buildRootPage` from what the seller already
  serves — spec title/description, `x-payment-info` prices, the well-known contracts, the
  no-wallet curl that returns the honest 402 — with the `<link rel="icon">` x402scan parses
  kept as the first head element. Nothing on the page is hand-restated. The genimg origin
  serves the same page scheme from `scw_js` (its `discovery.ts` twin).
- `src/facilitator/` — the facilitator's own corner of the tree (`src/` is otherwise the
  twins'): the payment core ported **verbatim** from `x402_facilitator/` (that package keeps
  its own copy alive for its Scaleway function until the teardown PR; only `walletreportcron`
  stays on Scaleway long-term, because the edge has no cron) plus one new file — the routing.
  `src/facilitator/facilitator_routes.ts` mirrors the Scaleway handler's routing/CORS/envelope
  semantics line by line against web-standard `Request`/`Response`; everything else is
  untouched payment behavior, including its test suite (`test/facilitator/` — the ported
  core tests, `facilitator_routes.test.ts` for the native routing, and
  `facilitator_alert_coverage.test.ts`, which pins the ported log phrases to
  `observability/alerts/bunny.yaml`'s facilitator branch; the twins need no such test).
  The entry is `src/facilitator.ts`, flat like the other three.

## Commands

- `npm run build` — tsdown bundle to a **single** `dist/searchapi.js` (bunny deploys one file).
- `npm run dev:searchapi` / `dev:llm` / `dev:mcp` / `dev:facilitator` — local serve of one
  twin via Deno on
  127.0.0.1 (from source, no build needed; `--sloppy-imports` covers the shared packages'
  extensionless tsc output, and `--env-file=.env` is baked in — a missing `.env` only warns).
  The paid path needs `NFT_WALLET_PUBLIC_KEY` + `RECEIVER_AUTHORIZER_PRIVATE_KEY` in `.env`;
  extra args go after `--` (`npm run dev:mcp -- --port 8081`-style), because npm eats
  unknown flags like `--env-file` itself.
- `npm test` — vitest (521 tests: the twins' ported suite + routes, the facilitator's ported
  payment suite (`test/x402_*.test.ts`) + native routes + its alert-phrase guard;
  `npm run test:integration` runs the live-RPC cases under `test/integration/`, inherited
  from the facilitator package).
- `npm run check` — typecheck + lint + format + tests.
- `npm run deploy` — build, then `bunny scripts deploy dist/searchapi.js` (needs the bunny CLI,
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
| `SCW_COCKPIT_PUSH_TOKEN`                   | secret (`--secret`)     | Cockpit push-only token — authenticates the Loki log flush to the observability data source (see the observability README/implementation plan)                                                                  |
| `COCKPIT_LOKI_URL`                         | plain                   | push URL of the custom Cockpit logs data source — public and inert without the token                                                                                                                            |

**Facilitator script — its own env set** (`bunny scripts env set` against its script id; the
values mirror `x402_facilitator/serverless.yml`):

| Variable                                      | bunny kind          | Use                                                                                                       |
| --------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------- |
| `FACILITATOR_FEE_AMOUNT`                      | plain               | fee in the token's smallest unit (`10000` = 0.01 USDC/EURC)                                               |
| `BATCH_SETTLEMENT_TEST_WALLETS`               | plain               | testnet-only allowance-check bypass list (public, testnet-fenced in code)                                 |
| `FACILITATOR_WALLET_PRIVATE_KEY`              | secret (`--secret`) | the facilitator hot wallet — signs settles and pulls fees; write-once on bunny's side                     |
| `RPC_URL_EIP155_*`                            | secret (`--secret`) | the four network RPC URLs — real values embed API keys; unset falls back to rate-limited public endpoints |
| `SCW_COCKPIT_PUSH_TOKEN` / `COCKPIT_LOKI_URL` | as above            | the logger pair, same as the twins                                                                        |

## Known limits / decisions

- **Single-file bundle, 1 MB limit.** tsdown emits one `dist/searchapi.js` with `codeSplitting:
false`; Node builtins stay external and MUST be imported through the `node:` prefix
  (bunny's Deno resolves them; the bundler plugin rewrites bare ones). Measured: **~397 KB**.
- **The platform rewrites Cache-Control: no-store to no-cache.** The twin sends `no-store`
  on every response (a bunny_js addition: the pull zone in front is a real CDN and a cached
  paid 200 would replay a purchase); bunny's edge normalizes it to `no-cache`, observed live
  on 2026-10-18. Still safe — no-cache forces revalidation, and the responses carry no
  validators, so every hit is an origin fetch and paid responses cannot be replayed.
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
  charges, unchanged, because the channel storage is the same bucket. For the same reason the
  facilitator's `walletreportcron` (weekly wallet-report email) stays on Scaleway too — the
  edge has no scheduler, and the report additionally rides Scaleway Transactional Email.
- **Facilitator bundle ≈ 573 KB minified** (`dist/facilitator.js`, single file, deps inlined —
  viem + the @x402 SDK are the bulk), well under the 1 MB script limit. Its imports are
  `node:buffer`/`node:process` only, same as the twins.

## Trial matrix (Task 6 — historical; superseded by the production switch)

The formal switch happened: the three `-agent.fretchen.eu` domains serve these scripts in
production, and the Scaleway twins' `serverless.yml` entries are removed from `scw_js` (the
functions are deleted by its next `npm run deploy`). The unpaid checks were run
during the trial; the paid/probe rows were overtaken by real production traffic rather than
closed as one-off exercises, so their results live in the observability logs and on-chain
settlements, not here.

| #   | Check                                                                                                                                                  | Result                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 1   | Unpaid `GET /search` at the bunny URL → 402 + `Payment-Required` header                                                                                | **PASS** 2026-10-18: 402 + Payment-Required, mainnet-only accepts, receiver 0xAAEBC1…239C, `cdn-cache: MISS` |
| 2   | `GET /openapi.json`, `/.well-known/agent-registration.json`, `/favicon.png` at the bunny URL                                                           | **PASS** 2026-10-18: 200s, correct content types and sizes (6.3 KB / 1.2 KB / 31 KB)                         |
| 3   | Deployed SigV4 probe (`scripts/sigv4_probe.ts` as its own script) against the real bucket                                                              | superseded by production use                                                                                 |
| 4   | Paid `/fetch` ($0.001) — buyer: `bunny_js/notebooks/search_x402_buyer.ipynb`, `SERVER` = "bunny-trial" with `TRIAL_URL` set → 200 + `Payment-Response` | superseded by production use                                                                                 |
| 5   | Paid `/search` ($0.01) via the same notebook → 200 + results                                                                                           | superseded by production use                                                                                 |
| 6   | Channel record in S3 updated; next `llmx402cron` run claims it cleanly (observability logs)                                                            | superseded by production use                                                                                 |
| 7   | Cold-start spot checks at the bunny URL                                                                                                                | superseded by production use                                                                                 |

## Status

Ported and production. The three twins serve the llm, web and MCP sellers at their
`*.fretchen.eu` origins; `scw_js` deploys only `genimgx402token`, `llmx402cron` (which claims
these twins' channels) and `growthapi` — the old twins' entries are gone from its
`serverless.yml`, and its next `npm run deploy` deletes the retired functions from Scaleway.
The original port plan (scaffold, bundle gate, SigV4 spike, verbatim stack + tests, native
routing + tests) is complete.

The facilitator twin is ported and green but **not yet live**: `facilitator.fretchen.eu` still
serves the Scaleway function until the port plan's operational cutover (trial-hostname probes
→ DNS flip), after which `x402_facilitator/` trims down to `walletreportcron` in the teardown
PR.

## Deploy paths (both can coexist)

Bunny publishes whichever deployment happened **last**, so a manual CLI deploy and the
GitHub Action interoperate by design — deploy from the laptop for an experiment, and the
next push to `main` overwrites it back to the committed state.

1. **Manual (CLI):** `npm run deploy` (= build + `bunny scripts deploy dist/searchapi.js`),
   needs the bunny CLI — `curl -fsSL https://cli.bunny.net/install.sh | sh` (single binary,
   independent of the nvm-managed Node that a global npm install would bind it to) — then
   `bunny login`. The llm and mcp twins deploy by naming their bundle and script id
   explicitly: `bunny scripts deploy dist/llm.js <LLM_SCRIPT_ID>` and
   `bunny scripts deploy dist/mcp.js <MCP_SCRIPT_ID>`.
2. **GitHub Actions:** `.github/workflows/deploy-bunny-js.yml` — on push to `main` touching
   `bunny_js/**` or the shared libs, builds (with the repo's shared-deps-first ordering) and
   publishes all three bundles via the official `BunnyWay/actions/deploy-script` action:
   `dist/searchapi.js`, `dist/llm.js`, `dist/mcp.js`. Requires two repo secrets per script,
   both from the bunny dashboard (**Script -> Deployments -> Settings**):
   - `BUNNYJS_SCRIPT_ID` / `BUNNYJS_DEPLOY_KEY` — the searchapi script
   - `BUNNYLLM_SCRIPT_ID` / `BUNNYLLM_DEPLOY_KEY` — the llm script
   - `BUNNYMCP_SCRIPT_ID` / `BUNNYMCP_DEPLOY_KEY` — the mcp script
   - `BUNNYFACILITATOR_SCRIPT_ID` / `BUNNYFACILITATOR_DEPLOY_KEY` — the facilitator script
     (same pattern; serves `facilitator.fretchen.eu` after its DNS flip — see the port plan)

   (Per-script deploy keys are deliberately chosen over the account-wide API key a
   CLI-in-CI variant would need — narrower blast radius. A step whose secrets are missing
   fails; the searchapi step runs first, so its deploy is never blocked by the others.)

The workflow ships code only; the script's environment variables and secrets are configured
on the script itself (dashboard or `bunny scripts env set`), so a repo-side leak cannot leak
the Brave key, the authorizer key, or the S3 channel-store credentials.

## First deploy (one-time)

`npm run deploy` alone fails the first time — it pushes to a remote script that must exist,
and the `.bunny/script.json` link comes out of the create step. One-time sequence:

1. `bunny scripts create --type standalone` — creates the remote script and links this
   directory (writes `.bunny/script.json`, gitignored — machine-local, like the docs treat it).
   For the SECOND and THIRD script, add `--no-link` — the directory's link belongs to
   searchapi, and `create` without it would silently repoint `.bunny/script.json`; the
   other twins take their id from the create output (or `bunny scripts list`) instead.
2. Upload the env from `.env` with `bunny scripts env set`, marking the sensitive keys with
   `--secret` (RECEIVER_AUTHORIZER_PRIVATE_KEY, BRAVE_API_KEY, MISTRAL_API_KEY,
   SCW_ACCESS_KEY, SCW_SECRET_KEY, RPC_URL_*, SCW_COCKPIT_PUSH_TOKEN). Skip
   `TEST_WALLET_PRIVATE_KEY` — buyer-side only, the server must never see it. Verify with
   `bunny scripts env list`. Per script — all three also get the Cockpit observability pair
   (`SCW_COCKPIT_PUSH_TOKEN` as `--secret`, `COCKPIT_LOKI_URL` plain):
   - **searchapi** — the channel stack + `BRAVE_API_KEY` (web_search/fetch) + `SCW_S3_*`.
   - **llm** — the channel stack + `MISTRAL_API_KEY` (chat_completion) + `SCW_S3_*`.
   - **mcp** — the union: both `BRAVE_API_KEY` and `MISTRAL_API_KEY` (its bundle embeds
     both tools) + `SCW_S3_*`.
3. `npm run deploy` (searchapi) / `bunny scripts deploy dist/llm.js <id>` /
   `bunny scripts deploy dist/mcp.js <id>` — publishes each; the output prints the live
   `*.bunny.run` URL.
4. Unpaid smoke: `curl -D - 'https://<that-url>.bunny.run/search?q=x402'` → 402 +
   `Payment-Required` header. The 402's `resource.url` keeps naming the production origin
   (it is derived from the committed spec, like the llm twin) — the resource url is the
   payment scope, not the serving origin, so a trial does not change it.
5. For the GitHub Action: `bunny scripts show` (or `list`) gives each script id; the deploy
   keys are in the dashboard (Script -> Deployments -> Settings). Add each pair as the
   `BUNNYJS_*` / `BUNNYLLM_*` / `BUNNYMCP_*` repo secrets.

After the first deploy, the Action and manual `npm run deploy` are interchangeable — last
deployment wins.
