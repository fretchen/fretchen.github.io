# Facilitator → Bunny Edge Script — Port Implementation Plan

**Goal:** Move the facilitator's HTTP endpoints (`/verify`, `/settle`, `/supported`, `/openapi.json`) from the Scaleway Function to a fourth Bunny Edge Script behind `facilitator.fretchen.eu`, keeping `walletreportcron` on Scaleway.

**Approach:** Verbatim port, the twins' playbook: the payment core moves into `bunny_js/src/` wholesale (same file names, one diff to review), the routing is rewritten natively against web-standard `Request`/`Response` (`src/facilitator_routes.ts`, mirroring `llm_routes.ts`), and **no Scaleway concept survives at the edge** — no envelope, no pino, no alias. `x402_facilitator/` stays untouched and live until PR 2 (its `walletreportcron` needs only two small fee helpers). Trial-hostname deploy → paid probe matrix → DNS flip → teardown PR.

**Constraints (from the repo's instructions — none may drift):**

- **The agent never commits anything on its own.** Any `git commit` happens only when the user explicitly says so in the session. When a commit is requested, the branch is created with `git switch -c <branch> --no-track origin/main` (repo root AGENTS.md → Git Workflow) and the commit message uses the repo's Mistral Vibe heredoc format. Pushing, deploy, DNS changes, secret changes: user-initiated only.
- `alerts/*.yaml` rules are pushed only via `observability`'s `npx tsx scripts/alerts.ts --push`, only committed files (`--push` refuses uncommitted), never on deploy (observability/README).
- **Alert budget is four rules.** This plan adds none; the facilitator phrases fold into `alerts/bunny.yaml`'s single rule (payments.yaml header; `test/alerts_budget.test.ts` stays at four).
- `logger.error` = "ours, and should page"; caller's fault = `logger.warn`. **Several alertable facilitator phrases are warn by design**, so the bunny rule cannot rely on `level="error"` alone for it (payments.yaml header).
- Secrets live on the platform, never repo or CI: before the flip the wallet key stays in the Scaleway secret; after it in a Bunny script secret (write-once). The deploy Action ships code only (bunny_js/README → deploy paths).
- `shared/chain-utils` is a `file:` dependency — build it before rebuilding dependents (root AGENTS.md → Commands).
- x402 vocabulary from the `x402` skill: the facilitator **verifies and settles for sellers**; it does not hold funds except the fee pull. EIP-712 domain names differ per network (scw_js README table — never guess). Generated OpenAPI strictness must match handler reality (`z.looseObject` vs `z.object`).
- Verification commands per package README: `x402_facilitator` → `npm run check`; `bunny_js` → `npm run check`; `observability` → `npm run check` (= tsc + eslint + prettier + `npm test`).

**Decisions (confirmed by the user in this session):**

1. **Scope:** facilitator HTTP function only; `walletreportcron` stays on Scaleway (Bunny has no cron).
2. **Key custody:** yes — `FACILITATOR_WALLET_PRIVATE_KEY` + `RPC_URL_*` become Bunny script secrets; `THREAT_MODEL.md` updated in the same PR as the port. This is the deliberate security-posture change: a hot wallet that broadcasts transactions moves from Scaleway's secret store to bunny.net infrastructure.
3. **Alerting:** fold into `alerts/bunny.yaml`'s one rule (budget stays four) — not a fifth rule.
4. **PR structure:** two PRs with the operational cutover in between.
5. **Shared core vs. verbatim port (added during PR 1):** verbatim port. An in-flight re-plan: the originally-implemented option imported `handle()` from `x402_facilitator/` across package roots (single source of truth, build-time logger alias). Checking what `walletreportcron` actually shares killed the rationale — two ~30-line fee helpers (`feeAmountFor`, `getFacilitatorAddress`), not the verify/settle core — so the "one home" benefit covers almost nothing, while the cost is permanent: cross-package build coupling (workflow path filters, another package's sources in `bunny_js/tsconfig.json`), a pino→bunny alias plugin, the dead scw dev-server block baked into the bundle, and Scaleway names living on at the edge. The user's call, confirmed: the bunny twin owns its code, like each twin before it. What survives from the earlier approach unchanged: the alert fold (Task 3), `logs.ts --url`, and the entry-test shape.

**Go/no-go gate — MEASURED (this session):** the full facilitator graph (`handle` + instance builder: verify/settle/supported/fee/whitelist/chain-utils + viem + @x402), bundled with the production `bunny_js/tsdown.config.ts` recipe (neutral platform, `node:` prefix plugin, minify, single-file, deps inlined), is **576.6 KB minified (166 KB gzip)** — well under bunny's 1 MB single-file limit. **Gate passed; no no-go case exists at bundle size.** (Measured on the cross-package import during the earlier shared-core approach; the verbatim port bundles the identical graph natively, and the native routes replace a heavier scw envelope, so the number holds or shrinks — re-measured in Task 1.)

**PR 1 — the port (everything before the cutover; prod untouched):**

### Task 1: Fourth bundle — verbatim core port + native routing + build wiring

**Files:**

- Create (ported verbatim, same names): `bunny_js/src/{x402_verify,x402_settle,x402_fee,x402_whitelist,x402_supported,x402_schemas,revert_selectors,facilitator_instance,chain_utils}.ts` and `bunny_js/src/openapi.facilitator.json`
- Create (new code): `bunny_js/src/facilitator_routes.ts` (native `Request`/`Response` port of `x402_facilitator.ts`'s routing, CORS, root redirect, and the `handlePaymentRequest` envelope logic — written once against web standards, like `llm_routes.ts`), `bunny_js/src/facilitator.ts` (entry)
- Modify: `bunny_js/package.json` (deps: `viem`, `zod`, `@x402/core`, `@x402/evm` — same versions as `x402_facilitator`; `build:facilitator`; dev script), `bunny_js/tsdown.config.ts` (nothing facilitator-specific — no alias), `bunny_js/tsconfig.json` (nothing cross-package)
- NOT touched at all in PR 1: `x402_facilitator/**` — the Scaleway function stays live until the cutover; its trim is Task 6.

**Interfaces:**

- The ported files import `"./logger.js"` — which in `bunny_js/src/` is the pino-shaped bunny logger. Same specifier, no alias, the ported `logger.error` call sites flush to Cockpit with `service="facilitator"` by construction. `openapi.json` imports become `"./openapi.facilitator.json"` mirrors of the twins' naming.
- Produces: `dist/facilitator.js` (single-file minified bundle), `npm run build:facilitator`, service label `facilitator`.

**Steps:**

- [ ] Port each core file byte-identical except: import paths it must share (`@fretchen/chain-utils` resolves from `bunny_js`'s own node_modules), and NO `Scaleway*` name anywhere — the envelope types are not ported; only `facilitator_routes.ts` answers `Request`s.
- [ ] `facilitator_routes.ts`: routes by URL pathname (`/verify` POST, `/settle` POST, `/supported` GET, `/openapi.json` GET, `/` redirect to the x402 docs for browsers), OPTIONS → CORS 200, the same CORS_HEADERS, the same 405/400/500 error envelopes, and the same `handlePaymentRequest` behavior (verify-then-settle, return-200-with-isValid-false semantics).
- [ ] `facilitator.ts` entry, `src/llm.ts`'s shape: runtime-shims first, `BunnySDK.net.http.serve(withLogFlush("facilitator", handleFacilitatorRequest))`.
- [ ] Verify: `npm run build:facilitator` → single file < 900 KB (spiked at ≈ 577 KB; the native routes add negligibly over the measured graph).

### Task 2: Ported tests + native routes tests

**Files:**

- Create (ported, same names): the core's test files into `bunny_js/test/` — `x402_verify`, `x402_settle`, `x402_settle_real_sdk`, `x402_permit2_real_sdk`, `x402_fee`, `x402_whitelist`, `chain_utils`, `eip712_reference`, `revert_selectors`, `facilitator_instance`, `openapi_generation` + `test/helpers/` — import paths adjusted to `bunny_js/src/`, `FEE_RETRY_DELAY_MS`-style env kept.
- Create (new): `bunny_js/test/facilitator_routes.test.ts` — the native routing/CORS/envelope behavior that `x402_facilitator.test.ts` + `x402_batch_route.test.ts` asserted through the Scaleway envelope, re-pointed at `Request`/`Response`.
- Create (new): `bunny_js/test/facilitator_alert_coverage.test.ts` — the twins have no alert_coverage test (level=error covers by construction), but the facilitator's phrase-gated warn lines break that argument: this test reuses `observability/alertCoverage.ts` (builtins-only, importable by relative path) to assert every alertable phrase in the ported files is matched by `bunny.yaml`'s alternation.
- NOT ported: the `x402_splitter_*.test.js` files (they assert scw's dist-splitting, which does not exist at the edge).

**Steps:**

- [ ] Copy + fix imports; run `bunny_js` → `npm run check` green.

### Task 3: Observability — one rule folding, no gaps

**Files:**

- Modify: `observability/alerts/bunny.yaml`, `x402_facilitator/test/alert_coverage.test.ts`, `observability/scripts/logs.ts`, `observability/README.md`, `x402_facilitator/README.md` (logs block)
- **Not** modified in PR 1: `observability/alerts/payments.yaml` — the Scaleway facilitator is still the live one; trimming its phrases now would open a no-alert window between merge and flip.

**Interfaces:**

- `BunnySellersNeedAttention`'s expr becomes a sum of two count_over_time terms (keeping `[1h]` and `for: 0m`): the existing twins term unchanged, plus a `service="facilitator"` term — facilitator `logger.error` sites by `level="error"` label, **and** the warn-level phrases as line-filter alternatives: "Settlement broadcast but unconfirmed", "Batch-settlement claim/settle broadcast but unconfirmed", and "…Settlement failed" lines with our-fault reasons (`refund_[a-z_]*failed|insufficient_fee_allowance|_transaction_failed|_rpc_read_failed`). The `x402_facilitator` logger.error phrases ("Settlement threw", "Unexpected error in handler", "Unexpected error during payment verification", "FACILITATOR_WALLET_PRIVATE_KEY not configured or invalid", "Fee collection failed", "Fee transaction reverted", "facilitator address not configured") are covered by the `level="error"` arm.
- Update the rule's summary/description annotations to name the facilitator branch and its investigate commands (`logs.ts facilitator --url …`).

**Steps:**

- [ ] Edit `bunny.yaml`; verify `observability` → `npm run check` green — the budget test passes unchanged: no rule group is added anywhere, the existing `bunny.yaml: 1` pin covers the fold.
- [ ] `x402_facilitator/test/alert_coverage.test.ts`: its rule source becomes the union of `payments.yaml` + `bunny.yaml` (facilitator logger.error call sites now matched by the bunny rule; `walletreportcron`'s by payments.yaml). Every call site stays matched — an unbudgeted drop fails CI.
- [ ] `scripts/logs.ts`: add an optional `--url <base>` passthrough (default: the project's default source) using `SCW_COCKPIT_LOGS_TOKEN`, which already queries the custom source (verified in the observability plan). `logs.ts facilitator --since 24h` documented in `x402_facilitator/README.md`'s logs block with the custom-source URL argument.
- [ ] **Push only at cutover (Task 5), after this file is committed** — `--push` refuses uncommitted; pushing the expanded bunny rule before the flip simply can't fire (no facilitator lines in the custom source yet), so ordering is enforced by the cutover checklist, not by the repo.

### Task 4: Docs, workflows, threat model (same PR 1)

**Files:**

- Modify: `.github/workflows/deploy-bunny-js.yml`, `.github/workflows/test-bunny-js.yml` (the deploy workflow gains a facilitator step with repo secrets `BUNNYFACILITATOR_SCRIPT_ID` / `BUNNYFACILITATOR_DEPLOY_KEY` — set by the user in GitHub, mirroring the per-script deploy-key pattern; **no path filter gains `x402_facilitator/**`** — the verbatim port means the bundle builds from `bunny_js/` sources only), `.github/THREAT_MODEL.md` (key hierarchy row for `FACILITATOR_WALLET_PRIVATE_KEY`: post-cutover home is the Bunny script secret; trust boundary: bunny.net edge isolate; blast radius: fee-collection + settle relay only — never custody), `bunny_js/README.md` (fourth script; known limits: no cron at the edge is why walletreportcron stays; subrequest/wall-time note), `bunny_js/AGENTS.md` (runtime section ext.), `x402_facilitator/README.md` + `AGENTS.md` (post-port split: `walletreportcron` stays a Scaleway function, the payment core is bundled into the `bunny_js` facilitator script), `observability/README.md` (bunny-logs source now carries facilitator; service label list).

**Steps:**

- [ ] CI check: `test-bunny-js`/`test-facilitator` workflows already exist per package; the deploy workflow's new path filter must not deploy before merge (it triggers on `main` only — already the case).
- [ ] CI runs both packages' `npm run check` — green.

**Task 5 — Operational cutover (no repo changes; user-initiated, agent-assisted; not a commit). Order matters:**

- [ ] `bunny scripts create` → `fretchen-facilitator` (standalone, pull zone).
- [ ] Env (mirroring `serverless.yml`, per-script, all in the suite's config UI/CLI):
  - plain: `FACILITATOR_FEE_AMOUNT=10000`, `LOG_LEVEL=info`, `BATCH_SETTLEMENT_TEST_WALLETS` (public list, testnet-fenced), `COCKPIT_LOKI_URL` (public host), `NODE_ENV=production`.
  - `--secret`: `FACILITATOR_WALLET_PRIVATE_KEY`, `SCW_COCKPIT_PUSH_TOKEN` (the script needs the same pair the twins use for the logger), `RPC_URL_EIP155_10`, `RPC_URL_EIP155_8453`, `RPC_URL_EIP155_84532`, `RPC_URL_EIP155_11155420` (real Alchemy keys — secret, never env).
- [ ] Deploy: from `main` (the Action publishes it on the next merge touching `bunny_js/**`; a manual `bunny scripts deploy dist/facilitator.js <id>` — with the repo build — is the out-of-band path; a laptop-only experiment is NOT deployed until PR 1 is merged, per last-deployment-wins doctrine).
- [ ] Deterministic probes (trial hostname, the twins' matrix shape): `GET /supported` → networks/assets/schemes correct for all four chains; `GET /openapi.json` → 200; `OPTIONS /settle` → CORS 200; facilitator entry on the trial hostname handles a Base Sepolia `exact` verify+settle end-to-end, fee pulled (needs a test wallet with allowance; the repo's testnet bypass list applies); a `batch-settlement` claim on Base Sepolia settles (this exercises the fee gate + `FACILITATOR_WALLET_PRIVATE_KEY` on the edge runtime and viem's tx send/receipt-wait under the isolate — subrequest count visible in `bunny scripts stats`); lines appear in the custom Cockpit source (`service="facilitator"`), read back with the extended `logs.ts --url`; probe one warn-phrase line → `BunnySellersNeedAttention` fires → email arrives (a rule that never fired is not known to work); run `bunny scripts stats --hourly` to check per-request CPU — must sit far below the platform cap.
- [ ] Push rules: `cd observability && npx tsx scripts/alerts.ts --push alerts/bunny.yaml --url https://db123d37-…cockpit.fr-par.scw.cloud` (committed file only).
- [ ] **DNS flip window between cron runs** (llmx402cron runs 00:00/12:00 UTC and its claim/settle calls `facilitator.fretchen.eu` mid-run): repoint `facilitator.fretchen.eu` to the script's pull zone, SSL on. Sellers and the cron are URL-stable — no config changes anywhere.
- [ ] Watch the loose ends: next `llmx402cron` run's lines show claims/settles succeeding against the flipped facilitator (observability logs, 12 h later at worst); Scaleway function untouched until PR 2.

**Task 6: PR 2 — Scaleway teardown (after the flip, post-cutover confirmation):**

- [ ] `x402_facilitator/serverless.yml`: delete the `facilitator` function + its `custom_domains` entry; keep `walletreportcron` verbatim.
- [ ] `payments.yaml`: `FacilitatorNeedsAttention` trims to walletreportcron-only (selector stays `resource_name=~"walletreportcron"`, phrases "Email report failed" / "Email API returned" / weekly-report "not configured"); walletreportcron's remaining error lines stay matched; budget still four. `x402_facilitator/test/alert_coverage.test.ts` stays green with the union from Task 3.
- [ ] Root `AGENTS.md` repo table + facilitator README/AGENTS final wording + all remaining docs: single home for each claim (root table row describes the split: core bundled into `bunny_js` script at the edge; cron on Scaleway).
- [ ] `npm run check` in `x402_facilitator` and `observability` green; push `payments.yaml` (`npx tsx scripts/alerts.ts --push alerts/payments.yaml`).
- [ ] Deploy the scw stack once more to delete the function (irreversible but post-flip: DNS already points at bunny, so nothing serving facilitator.fretchen.eu disappears). Only on the user's say-so.

**Assumptions (not yet verified — each has a named verification point):**

- **Deno 1.x executes the viem bundle** (the spike proves it bundles, not that it runs; Examined at Task 5's testnet probes — the first runtime execution of the exact artifact happens on a disposable trial script, the same as the twins). Untrusted imports (`node:dns`, `node:tls`) — none in the facilitator's graph; anything viem loads transitively surfaces as a thrown fetch/error at the trial probes, not in production.
- **Wall-time on the edge is sufficient for settle** (documented cap ~30 s CPU, wall-time undocumented): viem's RPC waits are I/O, `FEE_RECEIPT_TIMEOUT_MS` already binds the fee-wait worst case, and "broadcast but unconfirmed" returns a hash to reconcile if a receipt never lands in budget. Verified by the Task 5 batch-settlement probe + CPU stats readout; if settle p99 exceeds budget there, the fallback is a higher `pollingInterval` on the edge build only (one env-tunable, no logic change).
- **Pino argument shape = bunny logger shape at every call site** — verified by PR 1's typecheck of the aliased graph (log lines already exhibit the `(obj, "msg")` form in `x402_verify`/`x402_settle`/`x402_fee`).
- **No alert gap pre/post-flip** — payments.yaml trims only in PR 2, bunny rule is pushed before the flip, and the level-label vs `resource_name` separation prevents double-paging during the interim (framed by Task 3's "watch windows" logic; re-check at PR 1's alert probe).

**Execution note:** this plan is the handoff — implementation runs under the normal repo discipline with a todo list mirroring the tasks. The agent never commits on its own; PR 1 and PR 2 branches, commits, pushes, deploys, and DNS/rules/secret changes happen only on explicit user instruction.
