# Assistant Modernization Plan

Scope: the website's LLM chat assistant (`website/pages/assistent/`, `scw_js/llm_service.ts`, `scw_js/sc_llm.ts`). Written after an investigation into provider support, skills/personas, x402, merkle-tree privacy, and EIP-3009. See decisions below for what's in scope now vs. deferred.

## Decisions from the investigation (don't re-derive these)

- **x402 does not touch the `LLMv1` contract.** It's a stateless, per-request flow: server quotes a price, client signs an EIP-3009 `transferWithAuthorization` off-chain, facilitator submits it, USDC moves wallet-to-wallet directly. No balance mapping, no Merkle batching. It's the opposite of the current LLM billing model, not a variant of it.
- **No real balance is deposited today** — any future billing redesign is greenfield, no user migration path needed.
- **x402 migration for LLM billing is deferred.** It needs its own pricing-model decision first (LLM cost is only known *after* generation, but x402 wants a price *before*). Not started — see Backlog A.
- **Merkle-tree privacy is blocked on the above**, not a standalone fix. Hashing the address in the S3 JSON wouldn't help — `LLMv1.processBatch` calldata is permanently public on Optimism regardless of S3 ACLs, and the contract needs the real address to debit `llmBalance[user]`. See Backlog B.
- **Tool/function calling is backlog**, flagged as "interesting, uncertain importance" — not part of the near-term work.
- Confirmed near-term scope: **provider support (Mistral)**, then **selectable personas/system prompts**, reusing growth-agent's persona content where practical.

---

## PR 1 — Mistral provider support in `scw_js`

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

## Backlog — investigated but deliberately not scoped yet

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

**Blocks on Investigation E below** (state/Redis) before it can be scoped into PRs.

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

**Three storage options (cheapest first):**
- **A. Single-instance** — pin `llm` function `maxScale: 1` (already done for `growthapi`) + `InMemoryChannelStorage` + periodic S3 snapshot. Zero new infra; loses in-flight state on cold start/redeploy → occasional under-claim. Fine for tiny amounts.
- **B. S3 compare-and-swap** — extend `@fretchen/s3-utils` with conditional PUT (`If-Match`/ETag) to implement `updateChannel` as a CAS retry loop. Zero new service. **Depends on Scaleway Object Storage supporting conditional writes — VERIFY.** (Current s3-utils does plain PUT, no conditional headers.)
- **C. Managed Redis/Valkey** — the Scaleway "Managed Database for Redis™" product is the right category (Lua `EVAL` = atomic RMW, satisfies the SDK). Caveat: always-on provisioned instance (monthly floor cost), a shift from pay-per-use serverless. Probably overkill for a low-traffic assistant; check for a Valkey/smaller tier. Prefer B if Scaleway supports conditional PUT.

**Architectural split (do this):** separate the concurrency-sensitive hot path (per-request `updateChannel`, in the `llm` serverless function) from the periodic claim/settle loop (`BatchSettlementChannelManager` interval runner → run in a scheduled container, growth-agent-style, where the on-chain-tx cron pattern already exists).

**#1 UNKNOWN — gates everything:** where is the on-chain escrow/channel contract? Not found as a hardcoded address in the installed types. Either a canonical x402 deployment on Optimism (point at via config) or BYO-deploy via `eth/` (Hardhat/UUPS). Resolve first.

### F. Batch-settlement transition — phased step estimate

Spans 5 packages (`eth?` / `x402_facilitator` / `scw_js` / a scheduled container / `website`). SDK carries the channel-manager weight; real work = one storage adapter + client voucher flow + retiring the old path.

- **Phase 0 — Spike (throwaway, gates the rest):** ① confirm/deploy the batch-settlement contract on Optimism mainnet + your USDC; ② confirm Scaleway Object Storage conditional-PUT support (picks storage B vs C); ③ run one channel end-to-end on Optimism Sepolia with `InMemoryChannelStorage` + testnet USDC.
- **Phase 1 — Facilitator:** register `BatchSettlementEvmScheme` in `x402_facilitator` (deposit/claim/settle/refund) alongside existing `ExactEvmScheme`.
- **Phase 2 — Server hot path:** implement chosen `ChannelStorage`, wire `SettlementEvmScheme` into the `llm` function (verify voucher → `updateChannel` → serve), set scaling. Use `setSettlementOverrides` to claim actual (post-generation) token cost ≤ authorized max.
- **Phase 3 — Claim runner:** `BatchSettlementChannelManager` on a schedule in a container.
- **Phase 4 — Client:** `ClientChannelStorage` (localStorage) + channel-open deposit (reuse existing EIP-3009 signing from the image flow) + per-request voucher signing + top-up/refund UX in the assistant page.
- **Phase 5 — Retire merkle:** remove LLMv1 merkle path, `leaf_history`, `trees.json`, ETH-balance UI. No user migration (no real balances).

### C. Tool / function calling
Flagged as "interesting, uncertain importance." Revisit after personas (PR 2/3) ship and if usage patterns show a real need (e.g. users asking things the assistant should be able to look up on-chain).

### D. Other modernization items noticed during investigation, not requested yet
- Streaming responses (currently full-response-only; both IONOS and Mistral endpoints are OpenAI-compatible and support streaming).
- Conversation persistence (chat history currently lives only in React state, lost on refresh).
- Structured output on the LLM chat path (growth-agent's `llm_client.py` has `structured_output()` via Pydantic; `sc_llm.ts` has nothing equivalent — only relevant if a future feature needs it, e.g. tool calling).
