# Assistant Modernization Plan

Scope: the website's LLM chat assistant (`website/pages/assistent/`, `scw_js/llm_service.ts`, `scw_js/sc_llm.ts`). Written after an investigation into provider support, skills/personas, x402, merkle-tree privacy, and EIP-3009. See decisions below for what's in scope now vs. deferred.

## Decisions from the investigation (don't re-derive these)

- **x402 payment is now the FIRST renovation workstream** (see "Primary workstream" below). Investigation is complete and both former gates are cleared, so it's ready to build — it is no longer deferred/backlog.
- **The billing model is x402 batch-settlement payment *channels*** (not per-request x402). Correcting an earlier note: batch-settlement *does* rely on a dedicated on-chain escrow contract (USDC alone can't escrow + claim-against-voucher), BUT that contract is **canonical x402 infrastructure you consume, not deploy** — `BATCH_SETTLEMENT_ADDRESS = 0x4020…0003`, verified deployed on Optimism/Base mainnet + Base Sepolia (not Optimism Sepolia).
- **This replaces `LLMv1` on-chain wholesale** (escrow, settlement, withdrawal) and changes the payment asset **ETH → USDC**. LLMv1 gets retired. Net threat-surface win: one fewer owned upgradeable contract under `CONTRACT_OWNER_PRIVATE_KEY`.
- **No real balance is deposited today** — greenfield, no user migration path needed.
- **Merkle-tree privacy is resolved as a consequence**, not a standalone fix — batch-settlement deletes the public per-request ledger entirely (`merkle/trees.json`, `leafhistory`, `LLMv1.processBatch` calldata all go away).
- **Storage decided: S3 compare-and-swap**, no new infra — Scaleway conditional-write support tested and confirmed (2026-07-14).
- **Mistral provider support + personas (PR 1–3) are independent smaller wins** — they don't block and aren't blocked by the x402 work, and can land in parallel or after. Kept in the plan but secondary to the payment workstream.
- **Tool/function calling stays backlog**, flagged "interesting, uncertain importance."

---

## Renovation order (start here)

**The first renovation work focuses on x402 payment.** That is the Primary workstream (below): migrate LLM billing from the ETH-prepaid + merkle-settlement model to x402 batch-settlement USDC payment channels, in the Phase 0–5 sequence (section F). Start with the Phase 0 spike on Base Sepolia.

The Mistral/persona PRs (PR 1–3) remain in this document as independent, lower-effort improvements. They touch different code (`llm_service.ts` provider config, website UI) and carry no billing/architecture risk, so they can proceed in parallel or slot in whenever convenient — but the payment workstream is the priority and the reason for this renovation. Read the **Primary workstream** section first; PR 1–3 are documented afterward.

---

## PR 1 — Mistral provider support in `scw_js` *(secondary — independent quick win)*

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
2. Decide localization approach: persona *labels* should be localized (like other UI strings), but persona *prompt content* likely stays in one language (English) regardless of UI locale — confirm this during the PR rather than assuming.
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

**Privacy goal (decided):** obfuscate usage and spending *pattern* as much as possible. It is NOT necessary to hide that a wallet used the AI at all. This ranks the options and makes batch-settlement a strong fit.

**How the scheme works:**
1. **Deposit (on-chain, once):** client signs EIP-3009 auth; facilitator submits it, locking USDC into an escrow/channel contract. Default `depositMultiplier: 5` (client escrows 5× the max per-request price upfront).
2. **Per-request voucher (off-chain):** client signs a *cumulative* voucher ("total owed on this channel so far", monotonically increasing, with a nonce). No transaction. Server verifies the signature and serves the response immediately.
3. **Claim (on-chain, periodic, batched):** the server's channel manager submits the latest voucher from many channels in one tx (`claimIntervalSecs`, `maxClaimsPerBatch`). Contract validates each signature, moves claimed USDC out of escrow.
4. **Settle:** claimed funds swept to receiver in a separate batched tx.
5. **Exit:** `withdrawDelay` (default 24h) lets the client unilaterally reclaim escrow if the server sits on vouchers; idle channels cooperatively refunded.

**Why it fits (all three problems):**
- **Economics:** one claim per channel per interval, many channels per tx — amortizes gas + the 0.01 USDC facilitator fee over hundreds of requests. Per-request settlement of a ~$0.001 LLM turn is otherwise 10–50× the service cost.
- **Post-generation pricing:** client authorizes an *upper bound* (bounded by the 5× escrow); server claims the *actual* amount via `setSettlementOverrides(res, { amount })` after it knows the real token count. Over-authorize / under-claim = clean fit for LLM.
- **Privacy:** the itemized public ledger (`wallet, tokenCount, cost, timestamp` per request, queryable via `leafhistory`) disappears. Only the deposit and a per-channel *cumulative* claim total ever hit chain.

**Honest caveat — aggregation, not anonymization:** each channel's cumulative claim is individually listed on-chain (not blended across users), and the deposit links wallet→channel. So an observer can watch a channel's cumulative total tick up and read *per-interval* spend from the deltas. Individual request size/timing within an interval is hidden; coarse spend-over-time is not. Granularity is tunable via the claim interval (longer = more aggregation = more privacy, at the cost of locked capital + server-side voucher risk).

**Trust comparison (why this beats plain prepaid credits):**
- vs. today's merkle: gives up *public itemized* auditability (the thing leaking privacy) but keeps client-side cryptographic safety.
- vs. trusted off-chain credits: strictly better — server can't claim more than the signed voucher or the escrow, client loss is bounded by the deposit, and `withdrawDelay` is a unilateral exit. Client never depends on server goodwill for custody.
- Conceptually close to LLMv1's existing "deposit a balance, spend it down" model (`depositForLLM`), so UX continuity for users is decent.

**Contract question — RESOLVED (no deployment needed).** Unlike the exact scheme (which calls USDC's own `transferWithAuthorization`, no custom contract), batch settlement needs on-chain *escrow* logic USDC lacks (`deposit`, `claimWithSignature`, `refund`, `refundWithSignature`, `withdrawRequestedAt`, `settle`). BUT x402 ships this as a **canonical, pre-deployed contract at a deterministic CREATE2 address** baked into the SDK: `BATCH_SETTLEMENT_ADDRESS = 0x4020074e9dF2ce1deE5A9C1b5c3f541D02a10003` (same on every EVM chain; used as the EIP-712 voucher `verifyingContract` + the contract the facilitator calls; plus EIP3009/Permit2 token-collector addresses for the deposit paths). So operationally it's just like exact: **you deploy nothing, point at the built-in address, facilitator just needs a funded wallet.** Verified on-chain (`eth_getCode`, 2026-07-14): deployed on Optimism mainnet ✅, Base mainnet ✅, Base Sepolia ✅ — but **NOT on Optimism Sepolia ❌**, so run the Phase-0 testnet spike on **Base Sepolia** (`eip155:84532`, already supported in `x402_server.ts`).

**Storage question — RESOLVED (Investigation E): S3 compare-and-swap, no new infra.** Scaleway conditional-write support tested and confirmed.

Both prior gates are now cleared; A is ready to be scoped into the Phase 1–5 PRs (section F).

### B. Merkle-tree / usage-ledger privacy — resolved as a consequence of A
Not a separate task. Moving LLM billing to batch-settlement channels (A) deletes the public per-request ledger entirely, which *is* the privacy fix. A standalone patch to the current model would be cosmetic — `processBatch` calldata is public on Optimism forever regardless of S3 ACLs, and the contract needs the plaintext address to debit `llmBalance`. Retire `merkle/trees.json` + the `leafhistory` endpoint + LLMv1's merkle path when A ships.

### E. State/infra investigation — FINDINGS (SDK already installed: `@x402/evm@2.17.0`)

**The SDK ships batch-settlement.** `@x402/evm` exports `BatchSettlementEvmScheme`, `SettlementEvmScheme`, and `BatchSettlementChannelManager` (with `claim()` / `settle()` / `claimAndSettle()` / `refundIdleChannels()` + an interval runner). The channel-manager complexity is done for you.

**What you must implement is small:**
- Server `ChannelStorage` — 3 methods: `get(channelId)`, `list()`, and atomic `updateChannel(id, fn)`.
- Client `ClientChannelStorage` — trivial `get`/`set`/`delete`, lives in browser localStorage (no server infra).

**Statefulness is intrinsic** (cumulative vouchers = the aggregation IS the state; can't be stateless), BUT:
- SDK docstring names the acceptable atomic backends verbatim: "Redis/Valkey Lua scripts, SQL transactions, or Durable Objects." `InMemoryChannelStorage` only works inside one JS runtime.
- **Risk reframe:** a lost voucher update = you *under-claim* (leak your own revenue), NOT user fund loss — the client is always protected by the on-chain escrow + `withdrawDelay`. So the correctness bar is forgiving; start simple.

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

**Phasing decision:** phase it — three phases matching the SDK's own `facilitator` / `server` / `client` split, plus a spike and a cleanup. Not just risk-reduction (facilitator + scw_js have historically been tricky) — the dependency order *forces* sequencing: **facilitator must speak batch-settlement → before scw_js can settle → before the website can pay.** Each phase is independently testable via the Phase 0 Node harness (no browser UI needed to validate A/B).

**Locked decisions (from planning Q&A):**
- **Auth:** drop the separate `sc-llm` EIP-191 Bearer token — the payment voucher proves wallet control. Remove `auth_utils` from the LLM path.
- **Fee:** LLM channels are **fee-free** — skip the facilitator fee hook + collection for batch-settlement (exact-scheme image fee untouched).
- **Settle trigger:** **periodic cron sweep only** (`claimAndSettle` across all claimable channels), in a new scheduled scw_js function. Interval « 24h `withdrawDelay`. Coarse many-channels-per-tx aggregation best serves the privacy goal.
- **Networks:** Base Sepolia for all pre-prod (OP Sepolia lacks the contract); Optimism mainnet for production cutover.
- **Storage:** S3 CAS via extended `@fretchen/s3-utils` (`file:` package at `shared/s3-utils/`).

**Full detail:** `~/.claude/plans/now-propose-a-concrete-majestic-patterson.md` (file paths, SDK API names, per-phase verify steps). Progress tracker below.

**Phase 0 — Spike + reusable harness** (Base Sepolia + testnet USDC)
- [ ] Node script driving the client SDK (`@x402/evm/batch-settlement/client`): `createBatchSettlementEIP3009DepositPayload` → `signVoucher` → `wrapFetchWithPayment` → `claimAndSettle` → `refund`.
- [ ] Confirm during spike: receiverAuthorizer self-managed by server (→ facilitator needs no authorizer key); batch payment header name(s) for CORS; `setSettlementOverrides` for post-generation actual-cost claim.

**Phase A — Facilitator (`x402_facilitator/`)** — scheme registration only, no new routes
- [ ] Bump `@x402/core` + `@x402/evm` `^2.0.0` → `^2.17.0` (step zero — installed 2.0.0 lacks batch-settlement).
- [ ] `facilitator_instance.ts`: register `new BatchSettlementEvmScheme(signer)` alongside `ExactEvmScheme` in the per-network loop.
- [ ] Make `onAfterVerify` fee hook scheme-aware — skip fee logic when `accepted.scheme === "batch-settlement"` (it reads exact-only `authorization.to`).
- [ ] `x402_settle.ts`: guard `collectFee` to the exact scheme only.
- [ ] Tests: assert batch scheme registered per network; assert no fee `transferFrom` for batch payloads.
- [ ] Verify via Phase 0 harness against locally-run facilitator.

**Phase B — Server (`scw_js/` + `shared/s3-utils/`)**
- [ ] **B1** Extend `@fretchen/s3-utils` (`shared/s3-utils/src/index.ts`): return ETag on GET; `ifMatch`/`ifNoneMatch` on PUT surfacing **412 (no throw)**; add `listObjects(prefix)` + conditional delete. Rebuild before scw_js.
- [ ] **B2** S3 `ChannelStorage` (get/list/updateChannel), mirroring `RedisChannelStorage` CAS loop: `channels/<id>.json` private ACL; `updateChannel` = GET+ETag → callback → conditional PUT → retry on 412/network; `list` = `listObjects` + GET each.
- [ ] **B3** New x402 LLM handler (fork `sc_llm.ts`): register server `BatchSettlementEvmScheme(receiver, { storage })`; flow `extractPaymentPayload` → `create402Response` → `verifyPayment` (pre-LLM) → `callLLMAPI` → `convertTokensToCost` (keep) → `settlePayment` w/ `setSettlementOverrides` → `createSettlementHeaders`. Keep `body.data.prompt`. Remove bearer auth + `checkWalletBalance` + merkle calls. Update OPTIONS allow-headers.
- [ ] **B4** Scheduled claim/settle function (`serverless.yml` cron): `scheme.createChannelManager(...).claimAndSettle()` + `refundIdleChannels`. New secret `RECEIVER_AUTHORIZER_PRIVATE_KEY`; real RPC endpoint.
- [ ] Tests: S3 `ChannelStorage` CAS, handler verify→LLM→settle, cron manager wiring.
- [ ] Verify end-to-end via Phase 0 harness on Base Sepolia.

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
