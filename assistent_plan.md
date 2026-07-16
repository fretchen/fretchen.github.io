# Assistant Modernization Plan

Scope: the website's LLM chat assistant (`website/pages/assistent/`, `scw_js/llm_service.ts`, `scw_js/sc_llm.ts`). Written after an investigation into provider support, skills/personas, x402, merkle-tree privacy, and EIP-3009. See decisions below for what's in scope now vs. deferred.

## Decisions from the investigation (don't re-derive these)

- **x402 payment is now the FIRST renovation workstream** (see "Primary workstream" below). Investigation is complete and both former gates are cleared, so it's ready to build — it is no longer deferred/backlog.
- **The billing model is x402 batch-settlement payment _channels_** (not per-request x402). Correcting an earlier note: batch-settlement _does_ rely on a dedicated on-chain escrow contract (USDC alone can't escrow + claim-against-voucher), BUT that contract is **canonical x402 infrastructure you consume, not deploy** — `BATCH_SETTLEMENT_ADDRESS = 0x4020…0003`, verified deployed on Optimism/Base mainnet + Base Sepolia (not Optimism Sepolia).
- **This replaces `LLMv1` on-chain wholesale** (escrow, settlement, withdrawal) and changes the payment asset **ETH → USDC**. LLMv1 gets retired. Net threat-surface win: one fewer owned upgradeable contract under `CONTRACT_OWNER_PRIVATE_KEY`.
- **No real balance is deposited today** — greenfield, no user migration path needed.
- **Merkle-tree privacy is resolved as a consequence**, not a standalone fix — batch-settlement deletes the public per-request ledger entirely (`merkle/trees.json`, `leafhistory`, `LLMv1.processBatch` calldata all go away).
- **Storage decided: S3 compare-and-swap**, no new infra — Scaleway conditional-write support tested and confirmed (2026-07-14).
- **Mistral provider support + personas (PR 1–3) are independent smaller wins** — they don't block and aren't blocked by the x402 work, and can land in parallel or after. Kept in the plan but secondary to the payment workstream.
- **Tool/function calling stays backlog**, flagged "interesting, uncertain importance."

---

## Renovation order (start here)

**The first renovation work focuses on x402 payment.** That is the Primary workstream (below): migrate LLM billing from the ETH-prepaid + merkle-settlement model to x402 batch-settlement USDC payment channels, in the Phase 0–5 sequence (section F). **Phase 0 (spike/harness), Phase A (facilitator, PR #543), and Phase B (`scw_js/` server + `shared/s3-utils/`) are code-complete, and B0–B3 are now verified against the real, deployed facilitator** (2026-07-16, `sc_llm_x402_buyer.ipynb`: 3 real chat messages, all settled on Base Sepolia, `chargedCumulativeAmount` tracked correctly, one real on-chain transaction confirmed). The `x402_facilitator` bug-fix punch list is fully closed and deployed. **Remaining before Phase B can be called done: B4 (the hourly claim/settle cron, `llmx402cron`) has never been run — no manual verification, no confirmed on-chain `Claimed`/`receivers()` movement via that path.** Then **Phase C (`website/` client)**.

The Mistral/persona PRs (PR 1–3) remain in this document as independent, lower-effort improvements. They touch different code (`llm_service.ts` provider config, website UI) and carry no billing/architecture risk, so they can proceed in parallel or slot in whenever convenient — but the payment workstream is the priority and the reason for this renovation. Read the **Primary workstream** section first; PR 1–3 are documented afterward.

---

## PR 1 — Mistral provider support in `scw_js` _(secondary — independent quick win)_

**Why:** `scw_js/llm_service.ts` hardcodes a single IONOS endpoint/model. `growth-agent/agent/llm_client.py` already solved this with a `PROVIDERS` dict keyed by `LLM_PROVIDER`. Port the same shape to TypeScript.

**Touches:** `scw_js/llm_service.ts`, `scw_js/serverless.yml`, `scw_js/test/llm_service.test.ts`, `scw_js/test/sc_llm.test.ts`, `scw_js/README.md`, `scw_js/.env` (local only, not committed).

**Steps:**

1. In `llm_service.ts`, replace the hardcoded `MODEL_NAME` / `ENDPOINT` constants with a `PROVIDERS` map mirroring `growth-agent/agent/llm_client.py:18-29` (`ionos` and `mistral`, each with `baseUrl`, `apiKeyEnv`, `defaultModel`).
2. Add provider selection via `LLM_PROVIDER` env var (default `"ionos"`, matching growth-agent's default), and an optional `LLM_MODEL` override — same two env vars growth-agent already uses, for consistency across the repo.
3. Update `callLLMAPI` to look up the active provider config instead of reading `IONOS_API_TOKEN` and the hardcoded endpoint directly. Keep the `dummy` short-circuit path unchanged.
4. Add `MISTRAL_API_KEY` as a `secret:` entry in `serverless.yml` (never `env:` — matches the existing `IONOS_API_TOKEN` handling) and add `LLM_PROVIDER` / `LLM_MODEL` as plain `env:` entries.
5. Update tests to cover both providers: token-missing error message, endpoint/model selection, and that `LLM_PROVIDER=mistral` reads `MISTRAL_API_KEY` not `IONOS_API_TOKEN`.
6. Update `scw_js/README.md`'s `sc_llm.js` section to mention the provider switch.

**Acceptance:** `npm test` green in `scw_js/`; setting `LLM_PROVIDER=mistral` locally with `MISTRAL_API_KEY` set produces a real completion via `dev:bfl` or the local test server.

**Out of scope:** no change to billing, auth, or the merkle-tree settlement path.

---

## PR 2 — Selectable personas / system prompts in the website assistant

**Why:** Today there is exactly one hardcoded system prompt (`assistent.systemPrompt` = `"You are a helpful assistant."` in `website/locales/en.ts:109`). No persona concept exists. Note: this is a pure UX feature, not a new trust boundary — `sc_llm.ts`'s `handle()` already forwards whatever `prompt` array the client sends without restricting `role: "system"` content, so persona selection doesn't change what was already possible.

**Touches:** `website/pages/assistent/+Page.tsx`, `website/locales/en.ts` / `de.ts`, possibly a new `website/pages/assistent/personas.ts` (or similar) module.

**Steps:**

1. Define a small persona registry as a plain TS array/object: `{ id, label, systemPrompt }[]`. Start with 2-3 personas (e.g. "General assistant" = current default, "Blockchain helper", one reused from growth-agent per PR 3).
2. Decide localization approach: persona _labels_ should be localized (like other UI strings), but persona _prompt content_ likely stays in one language (English) regardless of UI locale — confirm this during the PR rather than assuming.
3. Add a persona selector (dropdown or button group) to the sidebar in `+Page.tsx`, next to the existing Balance/Actions/Agent sections.
4. Wire selected persona into `sendMessage()` — replace the fixed `systemPromptMessage` with the selected persona's prompt when building `promptArray` (`+Page.tsx:291-298`).
5. Persist the selected persona in local component state (reset behavior on `clearChat()` is a judgment call — decide whether switching persona should also clear history).
6. No backend changes needed — `sc_llm.ts` already accepts arbitrary system-role content.

**Acceptance:** switching personas in the UI visibly changes assistant behavior/tone across a manual test conversation; existing default behavior unchanged when no persona is explicitly picked.

---

## PR 3 — Reuse growth-agent's persona/voice content

**Why:** growth-agent already has a real, structured "voice" — not a static string, but a `Strategy` model (`growth-agent/agent/models.py:53-67`: `content_pillars`, `tone`, `target_audience`, `website_url`) used to build system prompts dynamically (`growth-agent/agent/nodes/drafts.py:53-61`, `_system_prompt()`). That's worth reusing for a "blog voice" persona in the website assistant rather than hand-writing a new one from scratch.

**Touches:** whichever persona module PR 2 introduced; possibly `scw_js/growth_api.ts` if you go with the live-fetch option below.

**Two implementation options — pick one at PR time:**

- **Option A: static copy (simpler, do this first).** Manually translate the current `Strategy` defaults into one more entry in the PR 2 persona registry (e.g. "Fred's blog voice" built from today's `content_pillars` / `tone` / `target_audience`). Cheap, but will drift out of sync if growth-agent's strategy changes.
- **Option B: live fetch (more correct, more work).** Add a public, read-only endpoint (new route or extend `growth_api.ts`) that exposes just the non-sensitive `Strategy` fields (tone, pillars, audience, website_url — none of this is secret) so the website assistant persona is generated from the same source of truth growth-agent uses. Requires deciding whether this needs auth at all (it's not owner-sensitive data) and where the route lives given `growth_api.ts` today requires `OWNER_ETH_ADDRESS` signature for everything.

**Recommendation:** ship Option A in this PR, leave Option B as a note in the PR description for later if the strategy content turns out to change often enough to matter.

**Acceptance:** the reused persona reads recognizably like growth-agent's Mastodon/Bluesky post voice when tested with a few chat prompts.

---

## Primary workstream — x402 batch-settlement payment (FIRST / active)

This is the primary renovation focus and the reason for the whole effort. Investigation is complete and both former gates are cleared:

- **Contract:** canonical, already deployed — you consume `BATCH_SETTLEMENT_ADDRESS = 0x4020…0003`, no deployment. (Testnet spike → Base Sepolia, since Optimism Sepolia lacks it.)
- **Storage:** S3 compare-and-swap, confirmed working on Scaleway — no new infra.

Sub-sections **A/B/E** below are the design record; **F** is the concrete Phase 0–5 build breakdown — **start there**. (Sub-sections C/D are separate deferred backlog, further down.)

### A. x402 batch-settlement payment channels for LLM billing (the target design)

This supersedes the earlier open question ("flat fee vs. token budget vs. prepaid credits"). After investigation, the answer is **x402 batch-settlement payment channels** ([docs.x402.org/schemes/batch-settlement](https://docs.x402.org/schemes/batch-settlement)). It solves all three problems at once: the per-request settlement economics, the "price known only after generation" mismatch, and the usage/spending-pattern privacy goal.

**Privacy goal (decided):** obfuscate usage and spending _pattern_ as much as possible. It is NOT necessary to hide that a wallet used the AI at all. This ranks the options and makes batch-settlement a strong fit.

**How the scheme works:**

1. **Deposit (on-chain, once):** client signs EIP-3009 auth; facilitator submits it, locking USDC into an escrow/channel contract. Default `depositMultiplier: 5` (client escrows 5× the max per-request price upfront).
2. **Per-request voucher (off-chain):** client signs a _cumulative_ voucher ("total owed on this channel so far", monotonically increasing, with a nonce). No transaction. Server verifies the signature and serves the response immediately.
3. **Claim (on-chain, periodic, batched):** the server's channel manager submits the latest voucher from many channels in one tx (`claimIntervalSecs`, `maxClaimsPerBatch`). Contract validates each signature, moves claimed USDC out of escrow.
4. **Settle:** claimed funds swept to receiver in a separate batched tx.
5. **Exit:** `withdrawDelay` (default 24h) lets the client unilaterally reclaim escrow if the server sits on vouchers; idle channels cooperatively refunded.

**Why it fits (all three problems):**

- **Economics:** one claim per channel per interval, many channels per tx — amortizes gas + the 0.01 USDC facilitator fee over hundreds of requests. Per-request settlement of a ~$0.001 LLM turn is otherwise 10–50× the service cost.
- **Post-generation pricing:** client authorizes an _upper bound_ (bounded by the 5× escrow); server claims the _actual_ amount via `setSettlementOverrides(res, { amount })` after it knows the real token count. Over-authorize / under-claim = clean fit for LLM.
- **Privacy:** the itemized public ledger (`wallet, tokenCount, cost, timestamp` per request, queryable via `leafhistory`) disappears. Only the deposit and a per-channel _cumulative_ claim total ever hit chain.

**Honest caveat — aggregation, not anonymization:** each channel's cumulative claim is individually listed on-chain (not blended across users), and the deposit links wallet→channel. So an observer can watch a channel's cumulative total tick up and read _per-interval_ spend from the deltas. Individual request size/timing within an interval is hidden; coarse spend-over-time is not. Granularity is tunable via the claim interval (longer = more aggregation = more privacy, at the cost of locked capital + server-side voucher risk).

**Trust comparison (why this beats plain prepaid credits):**

- vs. today's merkle: gives up _public itemized_ auditability (the thing leaking privacy) but keeps client-side cryptographic safety.
- vs. trusted off-chain credits: strictly better — server can't claim more than the signed voucher or the escrow, client loss is bounded by the deposit, and `withdrawDelay` is a unilateral exit. Client never depends on server goodwill for custody.
- Conceptually close to LLMv1's existing "deposit a balance, spend it down" model (`depositForLLM`), so UX continuity for users is decent.

**Contract question — RESOLVED (no deployment needed).** Unlike the exact scheme (which calls USDC's own `transferWithAuthorization`, no custom contract), batch settlement needs on-chain _escrow_ logic USDC lacks (`deposit`, `claimWithSignature`, `refund`, `refundWithSignature`, `withdrawRequestedAt`, `settle`). BUT x402 ships this as a **canonical, pre-deployed contract at a deterministic CREATE2 address** baked into the SDK: `BATCH_SETTLEMENT_ADDRESS = 0x4020074e9dF2ce1deE5A9C1b5c3f541D02a10003` (same on every EVM chain; used as the EIP-712 voucher `verifyingContract` + the contract the facilitator calls; plus EIP3009/Permit2 token-collector addresses for the deposit paths). So operationally it's just like exact: **you deploy nothing, point at the built-in address, facilitator just needs a funded wallet.** Verified on-chain (`eth_getCode`, 2026-07-14): deployed on Optimism mainnet ✅, Base mainnet ✅, Base Sepolia ✅ — but **NOT on Optimism Sepolia ❌**, so run the Phase-0 testnet spike on **Base Sepolia** (`eip155:84532`, already supported in `x402_server.ts`).

**Storage question — RESOLVED (Investigation E): S3 compare-and-swap, no new infra.** Scaleway conditional-write support tested and confirmed.

Both prior gates are now cleared; A is ready to be scoped into the Phase 1–5 PRs (section F).

### B. Merkle-tree / usage-ledger privacy — resolved as a consequence of A

Not a separate task. Moving LLM billing to batch-settlement channels (A) deletes the public per-request ledger entirely, which _is_ the privacy fix. A standalone patch to the current model would be cosmetic — `processBatch` calldata is public on Optimism forever regardless of S3 ACLs, and the contract needs the plaintext address to debit `llmBalance`. Retire `merkle/trees.json` + the `leafhistory` endpoint + LLMv1's merkle path when A ships.

### E. State/infra investigation — FINDINGS (SDK already installed: `@x402/evm@2.17.0`)

**The SDK ships batch-settlement.** `@x402/evm` exports `BatchSettlementEvmScheme`, `SettlementEvmScheme`, and `BatchSettlementChannelManager` (with `claim()` / `settle()` / `claimAndSettle()` / `refundIdleChannels()` + an interval runner). The channel-manager complexity is done for you.

**What you must implement is small:**

- Server `ChannelStorage` — 3 methods: `get(channelId)`, `list()`, and atomic `updateChannel(id, fn)`.
- Client `ClientChannelStorage` — trivial `get`/`set`/`delete`, lives in browser localStorage (no server infra).

**Statefulness is intrinsic** (cumulative vouchers = the aggregation IS the state; can't be stateless), BUT:

- SDK docstring names the acceptable atomic backends verbatim: "Redis/Valkey Lua scripts, SQL transactions, or Durable Objects." `InMemoryChannelStorage` only works inside one JS runtime.
- **Risk reframe:** a lost voucher update = you _under-claim_ (leak your own revenue), NOT user fund loss — the client is always protected by the on-chain escrow + `withdrawDelay`. So the correctness bar is forgiving; start simple.

**DECISION: Option B (S3 compare-and-swap).** The blocking unknown is resolved — Scaleway Object Storage supports ETag conditional writes (tested against `my-imagestore`/`nl-ams` on 2026-07-14): `If-None-Match:*` → 412 on existing (create guard), `If-Match:<stale>` → 412 (CAS reject), `If-Match:<current>` → 200 (CAS write). So we get atomic `updateChannel` with **zero new infrastructure**, a perfect stateless-serverless fit. Options A (single-instance) and C (Managed Redis) are set aside; C stays as the escape hatch only if channel counts ever grow enough that S3's `list()` cost (below) bites.

**S3 `ChannelStorage` sketch:**

- **Layout:** one object per channel, `channels/<channelId>.json` (private ACL — this is server-internal state, NOT the public `merkle/` prefix). Store the SDK `Channel` record as JSON.
- **`get(id)`:** GET `channels/<id>.json`, parse; null → `undefined`.
- **`updateChannel(id, fn)`:** GET (capture ETag) → run `fn(current)` → conditional PUT. New channel: `If-None-Match:*`. Existing: `If-Match:<etag>`. On **412** (or transient network error) → re-GET and retry with bounded backoff. Map result to `{channel, status: "updated"|"unchanged"|"deleted"}`; `fn` returning `undefined` → conditional DELETE.
- **`list()`:** `ListObjectsV2` on `channels/` prefix → GET each object. **This is the one wart** — N+1 requests per claim sweep. Acceptable at modest channel counts (tens–low hundreds); it's the only reason you'd ever switch to Option C.
- **s3-utils extension needed (first task):** `@fretchen/s3-utils` currently does plain GET/PUT with no conditional headers. Add: (1) return ETag from GET, (2) accept `If-Match`/`If-None-Match` on PUT + surface 412 (don't throw), (3) a `listObjects(prefix)` helper, (4) conditional DELETE. Keep it a thin, typed addition — the existing SigV4 signer already handles arbitrary signed headers (verified: the CAS test reused `sigv4.js` unchanged).
- **Retry semantics:** treat 412 AND network errors as retryable in the CAS loop (the existing s3-utils already retries 5xx/network for unconditional calls; mirror that). Cap retries; on exhaustion, fail the request (client just re-signs a fresh voucher next turn — no fund risk).

**Architectural split (do this):** separate the concurrency-sensitive hot path (per-request `updateChannel`, in the `llm` serverless function) from the periodic claim/settle loop (`BatchSettlementChannelManager` interval runner → run in a scheduled container, growth-agent-style, where the on-chain-tx cron pattern already exists). Both share the same S3 `ChannelStorage`.

**On-chain contract — RESOLVED (see section A):** no deployment needed. Canonical `BATCH_SETTLEMENT_ADDRESS = 0x4020…0003` is baked into the SDK and already deployed on Optimism/Base mainnet + Base Sepolia. Only caveat: NOT on Optimism Sepolia → do the testnet spike on Base Sepolia.

### F. Batch-settlement transition — concrete implementation plan

**Phasing decision:** phase it — three phases matching the SDK's own `facilitator` / `server` / `client` split, plus a spike and a cleanup. Not just risk-reduction (facilitator + scw_js have historically been tricky) — the dependency order _forces_ sequencing: **facilitator must speak batch-settlement → before scw_js can settle → before the website can pay.** Each phase is independently testable via the Phase 0 Node harness (no browser UI needed to validate A/B).

**Locked decisions (from planning Q&A):**

- **Auth:** drop the separate `sc-llm` EIP-191 Bearer token — the payment voucher proves wallet control. Remove `auth_utils` from the LLM path.
- **Fee:** LLM channels are **fee-free** — skip the facilitator fee hook + collection for batch-settlement (exact-scheme image fee untouched).
- **Settle trigger:** **periodic cron sweep only** (`claimAndSettle` across all claimable channels), in a new scheduled scw_js function. Interval « 24h `withdrawDelay`. Coarse many-channels-per-tx aggregation best serves the privacy goal.
- **Networks:** Base Sepolia for all pre-prod (OP Sepolia lacks the contract); Optimism mainnet for production cutover.
- **Storage:** S3 CAS via extended `@fretchen/s3-utils` (`file:` package at `shared/s3-utils/`).

**Full detail:** `~/.claude/plans/now-propose-a-concrete-majestic-patterson.md` (file paths, SDK API names, per-phase verify steps). Progress tracker below.

**Phase 0 + Phase A: DONE — shipped in PR #543** (`x402-batch-settlement-facilitator` branch). Went beyond the original checklist below in two ways worth carrying into Phase B:

1. **Network gating fix (not in the original plan):** batch-settlement was initially registered on all 4 `getSupportedNetworks()`, including Optimism Sepolia — which has no deployed contract. Added `getBatchSettlementNetworks()` (`chain_utils.ts`) as a strict subset (OP mainnet, Base mainnet, Base Sepolia) and gated registration on it, with regression tests. **Phase B's scw_js server must apply the same gating** — don't assume all 4 networks are safe for batch-settlement.
2. **Claim-settlement bug fix + protocol discovery (not in the original plan):** `x402_settle.ts::settlePayment()` unconditionally called `verifyPayment()` before `settle()`, but the SDK's `scheme.verify()` has no branch for `"claim"`/`"settle"` payload types (only deposit/voucher/refund) — every claim failed before reaching real claim logic. Fixed by skipping verify for those two payload types. Along the way, confirmed from the **actual verified contract source** (Basescan) two facts Phase B needs:
   - `VoucherClaim.totalClaimed` is the **new cumulative target being claimed to**, not "amount already claimed" — get this wrong and the contract silently no-ops (no revert, `success: true` from the facilitator, zero value moved). The SDK's `BatchSettlementChannelManager` is expected to compute this correctly from its own tracked state — **verify this in Phase B rather than assuming**, since our own hand-rolled construction got it wrong initially.
   - **Claim and settle are a genuine two-step protocol**, not one: `claim`/`claimWithSignature` moves escrow into a per-`(receiver, token)` pending-payout bucket (no ERC-20 transfer, no visible balance change); a separate `settle(receiver, token)` call sweeps that bucket to the receiver's wallet. `claimAndSettle()` in the SDK does both as two transactions.
   - Full walkthrough + real on-chain proof (decoded `Claimed` event, before/after `channels()` state) in `notebooks/x402_batch_settlement_buyer.ipynb`.

Checklist (for reference — all done except where noted):

- [x] Interactive harness driving the client SDK (`@x402/evm/batch-settlement/client`) — shipped as `notebooks/x402_batch_settlement_buyer.ipynb` (Deno notebook, not a plain Node script, but the same purpose): deposit → `signVoucher` (accumulate) → claim, all proven on real Base Sepolia transactions. `wrapFetchWithPayment`, `claimAndSettle`'s settle-sweep step, and `refund` were **not** exercised — good candidates for a follow-up spike, not blockers for Phase B.
- [x] Confirmed: receiverAuthorizer self-managed by server (`/supported` shows no `receiverAuthorizer` for batch-settlement → facilitator needs no authorizer key).
- [ ] **Not yet confirmed** (defer to their natural phases): batch payment header name(s) for CORS (Phase C — needs a real browser fetch flow to observe) — `setSettlementOverrides` for post-generation actual-cost claims (Phase B — needs the real LLM handler).
- [x] Bump `@x402/core` + `@x402/evm` → `^2.17.0` (resolved 2.18.0).
- [x] `facilitator_instance.ts`: register `BatchSettlementEvmScheme` alongside `ExactEvmScheme`, gated by `getBatchSettlementNetworks()` (both `createFacilitator` and `createReadOnlyFacilitator`).
- [x] `onAfterVerify` fee hook made scheme-aware (skips for batch-settlement).
- [x] `x402_settle.ts`: `collectFee` guarded to exact scheme only; **plus** the unplanned claim-verify-skip fix above.
- [x] Tests: batch scheme registration (both facilitator variants) + no-fee assertions + claim/settle routing regression tests, in `test/facilitator_instance.test.ts` + `test/x402_settle.test.js`. Real-signature tests split into `test/integration/` (`npm run test:integration`, live RPC) to keep `npm test` hermetic.
- [x] Verified against a locally-run facilitator — and beyond the original scope, against **real Base Sepolia transactions** (deposit, accumulate, claim), with on-chain state independently confirmed via direct contract reads.

**`x402_facilitator` bug-fix punch list (found during Phase B verification, 2026-07-15 — shipped in PR #545, confirmed live on `facilitator.fretchen.eu` 2026-07-16):**

- [x] **`getSupportedCapabilities()` reported a placeholder zero-address signer.** `facilitator_instance.ts`'s read-only facilitator (serves `/supported`) hardcoded `address: "0x0000…0000"` instead of the real signer, which newer `@x402/evm`/`@x402/core` clients reject outright (breaks `x402HTTPResourceServer.initialize()`'s strict validation). Fixed: `createReadOnlyFacilitator()` now reports `getFacilitatorAddress() ?? zeroAddress` — real address when a key is configured, zero address only as a genuine no-key fallback. **Confirmed deployed**: `curl https://facilitator.fretchen.eu/supported` now returns the real signer (`0x3F8d2Fb6…`), not the placeholder.
- [x] **Settle response dropped the SDK scheme's `extra` (incl. `channelState.channelId`).** `x402_settle.ts::settlePayment()` rebuilt its own `SettleResult` and silently dropped `facilitator.settle()`'s `extra` field, so the client crashed in `processSettleResponse` on `channelId.toLowerCase()` of `undefined` immediately after a real, correctly-settled payment. **This was misdiagnosed as an upstream `@x402/evm` bug; it was ours** — confirmed by the SDK maintainer on issue #2879. Fixed: `extra?: Record<string, unknown>` added to `SettleResult`/`VerifyResult`, threaded through all three success return sites in `x402_settle.ts` *and* the HTTP handler's own response-body construction in `x402_facilitator.ts` (a second, separate drop found during the fix — the handler built its own response object and needed the same field added). **Confirmed live** via the same real Base Sepolia run (settlement receipts now include full `channelState.channelId`).
- [x] **Batch-settlement had no recipient gating at all (found in a follow-up review, not the original punch list).** Being fee-free, `batch-settlement` had no equivalent to `exact`'s allowance-based abuse gate — any caller could get the facilitator to relay claim/settle/deposit transactions at its own gas expense. Fixed: new `x402_whitelist.ts` (`BATCH_SETTLEMENT_MANUAL_WHITELIST`/`BATCH_SETTLEMENT_TEST_WALLETS` env-var allowlist, no on-chain lookups — an earlier draft reused the old `exact`-scheme whitelist's `isAuthorizedAgent()` on-chain check, but that registry (GenImNFTv4/LLMv1 agent authorization) has no real relationship to batch-settlement's receivers, so it was dropped in favor of a scoped, explicit allowlist), gated in both `facilitator_instance.ts`'s `onAfterVerify` (deposit/voucher/refund) and `x402_settle.ts`'s claim/settle branch. **A follow-up code review then found the initial gate checked the wrong field** — `paymentRequirements.payTo` (attacker-controlled, structurally unrelated to what `executeSettle()`/`executeClaimWithSignature()` actually act on) instead of the payload's own `payload.receiver`/`claims[].voucher.channel.receiver` — allowing the whitelist to be bypassed by any caller who knew one whitelisted address. Fixed: the gate now derives the receiver(s) directly from the payload (every claim in a batch, not just the first) and from `paymentRequirements.network` (not `accepted.network`, which also isn't cross-checked by `settle()` the way `verify()` does). Full regression test coverage for both bypasses added.
- [x] **`scw_js/sc_llm_x402.ts`'s verify-failure response was missing the SDK's response-time enrichment (found during B3 re-verification, not a facilitator bug).** When `verifyPayment()` returned `isValid: false`, the handler hand-built `{error, reason, payer}` instead of calling `resourceServer.createPaymentRequiredResponse(...)` — so a `cumulative_amount_mismatch` 402 never carried the `channelState`/`voucherState` the client SDK's built-in `processCorrectivePaymentRequired` self-heal needs, and the mismatch was a permanent dead end instead of an automatic resync-and-retry. Checked against the reference implementation (`x402-foundation/x402`'s own batch-settlement example server) — it uses `@x402/express`'s full HTTP middleware, which isn't a fit for a Scaleway `ScwEvent` handler, but its underlying `x402ResourceServer.createPaymentRequiredResponse()` is the same enrichment engine, callable directly without adopting that whole abstraction. Fixed; `create402Response()`'s type loosened to accept the SDK's real `PaymentRequired` shape. **Confirmed fixed** via the same real Base Sepolia run.

**Phase B — Server (`scw_js/` + `shared/s3-utils/`)** — B0 through B4 implemented (2026-07-15); B0–B3 verified against real Base Sepolia (2026-07-16); **B4 (the cron) still needs its own manual verification** before Phase B is fully done and Phase C starts. Full original plan also at `~/.claude/plans/now-propose-a-concrete-majestic-patterson.md`.

**Locked decisions for Phase B:**

- **New parallel file, not a replacement.** The live website calls `sc_llm.ts`'s `llm` function via bearer auth today — replacing it in place would break the UI before Phase C (website) is ready to switch payment methods. Phase B ships `sc_llm_x402.ts` as a **new, additional** serverless function (`llmx402`) alongside the untouched `sc_llm.ts`/`llm`. Retiring `sc_llm.ts` is Phase D, after Phase C cuts the website over.
- **Second correction, from reading the actual SDK source (supersedes the `chargedCumulativeAmount`-override note below):** `@x402/evm/batch-settlement/server`'s `handleBeforeVerify`/`handleBeforeSettle` (see `index.mjs`) enforce that a voucher's `maxClaimableAmount` **exactly equals** `chargedCumulativeAmount + requirements.amount` — there is no room for the handler to charge a different, actual-token-cost-derived amount after the fact by directly mutating `chargedCumulativeAmount` (that would just make the next request's mismatch check fail). Real usage-based billing would require the SDK's corrective-402 mismatch flow (client re-signs after learning the true cumulative amount from a settlement response) — legitimate, but real client-side work belonging to Phase C at the earliest, and untested here. **B3 therefore charges a flat nominal price per message**, but that flat number is _derived_, not arbitrary: a new `convertTokensToUsdcCost()` in `llm_service.ts` reuses the same real IONOS per-token price as `convertTokensToCost()` (0.71 EUR / 1M tokens) but converts straight to USDC atomic units instead of ETH wei (the two 1e6 factors — USDC's 6 decimals and the per-million-tokens quote — cancel exactly, so it's just `tokens * 71n / 100n`). Treats 1 EUR = 1 USDC (documented simplification, same level of approximation as the existing static EUR/ETH rate — no live FX oracle). `sc_llm_x402.ts` applies it to `LLM_ESTIMATED_TOKENS_PER_MESSAGE` (env var, default `"2000"` → $0.00142/message) to get the fixed per-message price — still an estimate agreed before generation, not the request's real usage, for the SDK reason above, but now principled rather than guessed. `resourceServer.settlePayment()` commits `chargedCumulativeAmount += requirements.amount` itself via `handleBeforeSettle`, which also **confirmed a second useful fact**: for a voucher payload this hook returns `{ skip: true }`, so `settlePayment()` never calls the facilitator (no HTTP round-trip, no on-chain tx) — only a `deposit` payload actually reaches the facilitator/chain.
- **Stepwise, spike-first** (x402 has repeatedly hidden real bugs behind plausible-looking code all through Phase 0/A — network-gating, claim-verify-skip, `totalClaimed` semantics, EIP-7702 signature gotcha, Deno module resolution). Verify each risky assumption against real behavior before composing the full handler, same discipline as Phase A.
- **`scw_js` gets its own `scw_js/notebooks/` folder** (Deno kernel, own scoped `deno.json`, same `nodeModulesDir: "auto"` + `lock: false` fix already proven in `x402_facilitator/notebooks/deno.json`) — mirrors the existing per-package convention (`growth-agent/notebooks/` is already its own thing). B0's spike lives there, not in `x402_facilitator/notebooks/`, since it tests scw_js's own server behavior, not the facilitator.

**Steps:**

- [x] **B0 — Spike:** `scw_js/notebooks/x402_batch_settlement_server_spike.ipynb` — registered a **server**-side `BatchSettlementEvmScheme` with `InMemoryChannelStorage`, drove it with a real buyer-side deposit + voucher flow on Base Sepolia, confirmed `verifyPayment()` auto-manages `ChannelStorage` and that `onchainStateTtlMs` defaults to a fixed 5 minutes (must override explicitly, e.g. 5000ms). The spike's step 7 ("manually bump `chargedCumulativeAmount`") turned out to be a red herring superseded by the SDK-source finding above — left in the notebook as a recorded (disproven) hypothesis, not deleted, since it explains why B3 doesn't do that.
- [x] **B1** Extended `@fretchen/s3-utils` (`shared/s3-utils/src/index.ts`, additive only): `getS3ObjectWithMeta` (ETag on GET); `putS3ObjectConditional` (`ifMatch`/`ifNoneMatch`, **412 surfaced as `{ok:false,status:412}`, not a throw**); `deleteS3Object` (conditional, 404 treated as success); `listObjects(prefix)` (`ListObjectsV2` + minimal XML parsing). 48 unit tests green, package rebuilt.
- [x] **B2** `scw_js/x402_channel_storage.ts` — `S3ChannelStorage` implementing `get`/`list`/`updateChannel`: `channels/<id-lowercased>.json`, private ACL; `updateChannel` = GET+ETag → callback → conditional PUT/DELETE → retry from a fresh read on 412 (bounded, 3 attempts) → throws past that. 12 unit tests green (create, update, CAS-conflict-then-retry, delete, delete-of-nonexistent, list-sorted).
- [x] **B3** `scw_js/sc_llm_x402.ts` (parallel to `sc_llm.ts`) + `createLLMResourceServer()`/`createBatchSettlementPaymentRequirements()`/`getBatchSettlementNetworks()` in `x402_server.ts`. One shared `BatchSettlementEvmScheme` instance (receiver-bound, not network-bound) registered across all 3 batch-settlement networks. Flow: `extractPaymentPayload` → `create402Response` if missing → validate network is a batch-settlement network → `verifyPayment` → `callLLMAPI` (unchanged) → `settlePayment` (commits the flat charge or, for a deposit, does the one real on-chain settle) → respond with settlement headers. Kept `body.data.prompt` request shape. Bearer auth (`auth_utils`), `checkWalletBalance`, and merkle calls are simply not imported into the new file. New `llmx402` function still needs adding to `serverless.yml` (deferred to alongside B4, so both new functions/secrets land together). 18 unit tests green (mocking `x402_server.js`/`llm_service.js`, not the real SDK — real verify/settle behavior is an integration concern, covered by the Base Sepolia verification step below, not unit tests).
- [x] **B4** `scw_js/llm_x402_cron.ts` — scheduled (`rate: "0 * * * *"`, hourly) `llmx402cron` function. Loops `getBatchSettlementNetworks()`, calling `scheme.createChannelManager(facilitatorClient, network).claimAndSettle()` per network via the same `createLLMResourceServer()` used by B3 (so it reads/writes the same S3 `ChannelStorage`); one network's failure is logged and doesn't stop the others (partial failure → 500 with per-network results in the body). New secret `RECEIVER_AUTHORIZER_PRIVATE_KEY` + `LLM_ESTIMATED_TOKENS_PER_MESSAGE` (default `"2000"`, feeding `convertTokensToUsdcCost()` — see above) added to `serverless.yml`'s `provider.secret` block (matching this file's actual existing convention — everything lives under `secret:`, not split into `env:`, regardless of sensitivity). Both `llmx402` (B3) and `llmx402cron` (B4) functions added together, plus both new entry points registered in `tsup.config.js` (they were silently excluded from `dist/` until this was done — caught by running `npm run build` and noticing only 4 of 6 expected bundles). 6 unit tests green (config errors, per-network dispatch, partial-failure handling), mocking `x402_server.js`.
- [x] **B3 verified against real Base Sepolia (2026-07-16) — four real bugs found and fixed along the way (see punch list above for the facilitator-side three; the fourth was ours in `sc_llm_x402.ts`):**
  1. **Fixed:** `BATCH_SETTLEMENT_NETWORKS` included `eip155:10` (Optimism mainnet), but `@x402/evm`'s own `DEFAULT_STABLECOINS` registry has no entry for it — `enhancePaymentRequirements()` threw, taking down the _entire_ 402 response (all networks), not just Optimism's. Fixed by dropping it from the offered networks (`x402_server.ts`).
  2. **Fixed:** the `paymentRequirements` object built for `verifyPayment`/`settlePayment` was a raw, un-enhanced object missing `extra.receiverAuthorizer`/`extra.withdrawDelay` — fields the client actually signed against (learned from the 402). The facilitator's `validateChannelConfig` treats a missing `receiverAuthorizer` as an automatic mismatch, so every real deposit was rejected with `receiver_authorizer_mismatch`. Fixed by running verify/settle requirements through `scheme.enhancePaymentRequirements()` too, not just the 402-building path. **Confirmed fixed** — a real deposit landed and settled on Base Sepolia.
  3. **OURS, not upstream (corrected).** `wrapFetchWithPayment` crashed client-side (`processSettleResponse`, `channelState.channelId.toLowerCase()` on `undefined`) immediately after a real, correctly-settled deposit — traced to `x402_facilitator` stripping `result.extra`; see the punch list above. **Fixed and confirmed deployed.**
  4. **OURS, found after the facilitator fix landed.** Verification then failed with `invalid_batch_settlement_evm_cumulative_amount_mismatch` on every retry — traced to `sc_llm_x402.ts`'s hand-rolled 402 failure body omitting the SDK's response-time enrichment, so the client's corrective-retry flow (`processCorrectivePaymentRequired`) had nothing to recover from; separately, the buyer notebook's `ClientEvmSigner` was also missing `readContract`, which that same recovery flow requires unconditionally. Both fixed — see the punch list above for the server-side fix; the notebook now builds its signer via `toClientEvmSigner(account, publicClient)`.
  5. **Confirmed via a full real run (2026-07-16, `scw_js/notebooks/sc_llm_x402_buyer.ipynb`):** 3 chat messages against the local `sc_llm_x402.ts` dev server + the real, deployed facilitator. All settled (`status: 200`), `chargedCumulativeAmount` progressed `2840 → 4260 → 5680` (exactly `+1420`/message, matching `convertTokensToUsdcCost(LLM_ESTIMATED_TOKENS_PER_MESSAGE)`), and one message's settlement receipt carried a real on-chain Base Sepolia transaction hash. Channel reuse across messages worked automatically via `fetchWithPayment` — no `useX402Chat.ts` workaround needed for that. Full findings recorded in the notebook itself.

- [ ] **B4 still needs its own manual verification — not done, and not covered by the B3 run above** (B3's on-chain activity came from `sc_llm_x402.ts`'s own synchronous settle path for a deposit, not the cron's `claimAndSettle()` sweep). `llm_x402_cron.ts` has never been run: no local dev script exists for it yet (`package.json` only has `dev:x402`/`dev:llmx402`/`dev:growth`), and there's no recorded decoded `Claimed` event or `receivers()` bucket movement via that path. `serverless.yml` does have the `llmx402cron` function registered with its schedule (`events: [{schedule: {rate: "0 * * * *"}}]`, hourly) — the *configuration* is in place, but it has neither been deployed nor exercised locally. **This is the one remaining item before Phase B can be called fully done.**

`sc_llm.ts`, `llm_service.ts`'s merkle functions, `leaf_history.ts`, and `LLMv1` retirement remain untouched until Phase D (after Phase C proves the website can pay via the new handler).

**Phase C — Client (`website/`)** — `@x402/evm`/`@x402/fetch` already deps; mirror `hooks/useX402ImageGeneration.ts`

- [ ] New `hooks/useX402Chat.ts`: manual `client.register(network, new BatchSettlementEvmScheme(signer, { storage }))` (no register helper) + `wrapFetchWithPayment`; extend signer with `readContract` via `toClientEvmSigner` + `usePublicClient`.
- [ ] Browser `ClientChannelStorage` backed by `localStorage`.
- [ ] `+Page.tsx sendMessage`: swap bearer-token fetch for `fetchWithPayment`; drop `useWalletAuth("sc-llm")`.
- [ ] `BalanceDisplay`: `readChannelBalanceAndTotalClaimed` + channel deposit instead of `checkBalance`/`depositForLLM`; USDC (6 decimals) not ETH.
- [ ] Verify in browser on Base Sepolia (deposit-on-first-chat, voucher per message, aggregated on-chain claim).

**Phase D — Retire merkle** (after C proven on mainnet)

- [ ] Remove `llm_service.ts` merkle code (keep `convertTokensToCost`); remove `leaf_history.ts` + `leafhistory`; stop writing `trees.json`.
- [ ] Remove LLMv1 balance UI; retire `LLMv1` (leave `withdrawBalance` open briefly — no real balances).
- [ ] Update `scw_js/README.md` + `.github/THREAT_MODEL.md` (one fewer owned upgradeable contract; asset now USDC).

## Backlog — deferred (not part of the first renovation)

### C. Tool / function calling

Flagged as "interesting, uncertain importance." Revisit after personas (PR 2/3) ship and if usage patterns show a real need (e.g. users asking things the assistant should be able to look up on-chain).

### D. Other modernization items noticed during investigation, not requested yet

- Streaming responses (currently full-response-only; both IONOS and Mistral endpoints are OpenAI-compatible and support streaming).
- Conversation persistence (chat history currently lives only in React state, lost on refresh).
- Structured output on the LLM chat path (growth-agent's `llm_client.py` has `structured_output()` via Pydantic; `sc_llm.ts` has nothing equivalent — only relevant if a future feature needs it, e.g. tool calling).

### F. Facilitator-hosted `receiverAuthorizer` (simplify scw_js's key management)

`x402_facilitator`'s `BatchSettlementEvmScheme` constructor accepts an optional `authorizerSigner` — if configured, the facilitator advertises its own address as `receiverAuthorizer` in `/supported`, and `scw_js` could then omit `RECEIVER_AUTHORIZER_PRIVATE_KEY` entirely (one fewer secret to manage; `createLLMResourceServer()` would just not pass `receiverAuthorizerSigner`). Considered during Phase B's buyer-notebook verification work and deferred: the SDK's own doc comment requires that "a facilitator that advertises a `receiverAuthorizer` for servers to delegate to must authenticate refund requests" — i.e. the facilitator would need a way to verify an incoming refund request for receiver X is actually from/approved by receiver X, not an impersonator. That authentication mechanism doesn't exist in `x402_facilitator` today and is real security design work, not a config toggle. Revisit only with proper design attention to that auth mechanism — don't just flip the constructor argument.
