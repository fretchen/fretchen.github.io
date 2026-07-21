# Assistant Modernization Plan

Migrating the LLM chat assistant from ETH-prepaid + Merkle settlement (`LLMv1`) to **x402 batch-settlement USDC payment channels**.

Structure: [Status](#status) → [Next: mainnet](#next-mainnet-transition) → [Then: Mistral](#then-mistral-provider) → [Then: retire legacy](#then-retire-legacy-phase-d) → [Reference](#reference--design-record) (settled decisions, don't re-derive) → [Backlog](#backlog).

---

## Status

| Phase | What | State |
|---|---|---|
| 0 | Spike / harness | ✅ Done |
| A | `x402_facilitator` speaks batch-settlement | ✅ Done, deployed (`facilitator.fretchen.eu`) |
| B | `scw_js` server (`sc_llm_x402.ts` + `llmx402cron`) | ✅ Done, verified on Base Sepolia |
| C | `website` client (`/assistent-v2`) | ✅ Done, verified live in browser |
| **→ next** | **Base mainnet MVP** | **⬜ This document's focus** |
| — | Optimism mainnet | ⏸ Deferred — upstream [#2910](https://github.com/x402-foundation/x402/issues/2910) |
| D | Retire `LLMv1` / merkle / `sc_llm.ts` | ⬜ After mainnet is proven |

**Everything works end-to-end on Base Sepolia today.** A real browser user at `/assistent-v2` can connect a wallet, chat, and pay per message via USDC payment channels.

**B4 (the 12h claim/settle cron) is verified** — on-chain check on 2026-07-19 confirmed the deployed `llmx402cron` swept two channels from the previous evening: per-channel `totalClaimed` matches what the server recorded, and `receivers()` shows `totalClaimed == totalSettled == 5770` (the exact sum of every channel's owed amount), i.e. funds actually reached the receiver wallet, not just a pending bucket.

**Current live config:** Base Sepolia only (`eip155:84532`), flat price `$0.00142`/message, LLM responses **mocked** on testnet (no IONOS spend).

---

## Next: mainnet transition

**Scope decision (2026-07-20): Base mainnet only for the MVP.** Optimism is deferred pending upstream [#2910](https://github.com/x402-foundation/x402/issues/2910) — see [OP status](#op-status-deferred) below. Base exercises 100% of the same code paths, so nothing about the MVP is weakened by waiting; adding OP later is a config change plus a re-run of Rung 1.

Approach: prove the payment rails with tiny real amounts at the **lowest layer first**, only moving up once each rung is solid.

**The only code change this needs is one line.** Base mainnet (`eip155:8453`) is already configured everywhere else:

| Package | Batch-settlement networks | Change needed |
|---|---|---|
| `x402_facilitator` (`chain_utils.ts:62`) | `eip155:10`, `eip155:8453`, `eip155:84532` | none |
| `scw_js` (`x402_server.ts:26`) | `eip155:8453`, `eip155:84532` | none |
| `website` (`AssistantChat.tsx:26`) | `eip155:84532` only | **add `eip155:8453`** |

### Pre-flight (before any real money moves)

- [ ] **Facilitator recipient whitelist.** Batch-settlement is fee-free, so the facilitator gates *who* it will relay for via `x402_whitelist.ts` (`BATCH_SETTLEMENT_MANUAL_WHITELIST`). The receiver (`NFT_WALLET_PUBLIC_KEY`, `0xAAEB…239C`) **must be whitelisted for mainnet** or every payment is refused. Verify the env var on the deployed facilitator, not just locally.
- [ ] **Facilitator wallet gas** on Base mainnet (it pays for deposit/claim/settle txs).
- [ ] **Test wallet** funded with a small real USDC amount on Base (a few dollars covers thousands of messages at $0.00142 each).
- [ ] **Real LLM cost kicks in.** On testnet, `sc_llm_x402.ts` forces `useMock` (`isTestnet`). On mainnet it calls the real provider for real money — so mainnet cutover and the Mistral decision below are coupled. Confirm `IONOS_API_TOKEN`/`MISTRAL_API_KEY` is live and check the flat price still covers actual cost.
- [ ] **Sanity-check the price.** `$0.00142`/message assumes 2000 tokens at IONOS's 0.71 EUR/1M and 1 EUR ≈ 1 USDC. Re-derive if switching to Mistral (different per-token price).

### Rung 1 — Facilitator only (smallest surface, no LLM, no UI)

Prove the facilitator can verify + settle a real Base mainnet payment in isolation.

- **Tool:** `x402_facilitator/notebooks/x402_batch_settlement_buyer.ipynb` — drives `/verify` + `/settle` directly with hand-built requirements, no resource server involved.
- **Change:** point it at Base mainnet (`eip155:8453`) + Base USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`.
- **Verify on-chain, not just `success: true`** (this repo has been burned by silent no-ops — see Gotchas): decoded `Claimed` event, `channels(channelId)` balance/`totalClaimed` movement, and `receivers()` bucket.
- **Stop here if anything is off.** No LLM tokens or UI are involved, so this is the cheapest place to find a mainnet-specific problem (wrong EIP-712 domain, whitelist rejection, gas).

### Rung 2 — `scw_js` server (adds the real handler + real LLM)

- **Tool:** `scw_js/notebooks/sc_llm_x402_buyer.ipynb` against a locally-run `npm run dev:llmx402`, pointed at the **deployed** facilitator and Base mainnet.
- **No network config change needed** — `eip155:8453` is already in `BATCH_SETTLEMENT_NETWORKS` (`x402_server.ts:26`).
- **This is where real LLM cost starts.** Consider a deliberately tiny `LLM_ESTIMATED_TOKENS_PER_MESSAGE` for the first run.
- Verify: deposit lands, 2–3 messages reuse the channel off-chain, `chargedCumulativeAmount` advances by exactly the per-message price, S3 `channels/<id>.json` matches chain.
- Then deploy `llmx402` and re-run against the deployed function (not just local) — deployment surfaced real bugs before (`tsup` entry omissions).
- Let the **12h cron** fire once and confirm the sweep on-chain, the same way it was verified on Base Sepolia.

### Rung 3 — UX (browser, real wallet, real money)

- **The one code change:** `CHAT_NETWORKS` in `website/components/AssistantChat.tsx:26` → `["eip155:8453"]`. `useAutoNetwork` picks the wallet's current chain if supported, else the **first** entry, so this makes Base mainnet the default. (Keeping `eip155:84532` alongside it would let a wallet already on Base Sepolia silently pay in testnet USDC — decide deliberately; dropping it is the safer default now that the flow is proven.)
- `wagmi.config.ts` already registers `base` — no config change needed.
- Verify in browser: first message opens the channel (one wallet signature), messages 2+ are silent (the `voucherSigner` delegate key), and the receipt link resolves to `basescan.org`.
- Watch for the chain-switch prompt flow (add-network + switch-network) if the wallet doesn't know Base — expected, already handled, surfaced via `switchError`.
- **Real LLM responses now.** Testnet mocking (`isTestnet`) no longer applies, so this is the first browser traffic that costs IONOS/Mistral money.

### OP status (deferred)

**Filed upstream as [#2910](https://github.com/x402-foundation/x402/issues/2910)** (2026-07-20), framed as a question about batch-settlement on networks outside `DEFAULT_STABLECOINS` rather than "add Optimism". Repro + draft kept in [`x402_facilitator/upstream/`](x402_facilitator/upstream/).

What's blocked and why, in one line: `@x402/evm`'s `DEFAULT_STABLECOINS` has no `eip155:10` entry, and batch-settlement's `enhancePaymentRequirements` (`:1525`) and `createChannelManager` (`:1608`) call `getDefaultAsset()` unconditionally — so an explicit `asset` can't rescue it, unlike the `exact` scheme which passes requirements through untouched. Everything *else* about OP is ready: the batch-settlement contract is deployed there, and OP USDC (`0x0b2C…Ff85`) is EIP-712 `"USD Coin"` / `"2"` / 6 decimals (read from the contract 2026-07-19).

**To add OP once #2910 resolves:** add `eip155:8453` → `eip155:10` to `CHAT_NETWORKS`, re-run Rung 1 on OP, then a browser smoke test. No architectural work. If upstream prefers a registry entry over honoring the caller's asset, a local `patch-package` is the interim option (not currently used in this repo — new tooling, and it would need applying in each package resolving `@x402/evm`).

**Note:** the facilitator still advertises `eip155:10` for batch-settlement (`chain_utils.ts:62`) even though no resource server can currently use it. Harmless for the MVP since our client never offers OP, but worth tidying if #2910 stalls.

### Known rough edges (not blockers, decide whether to fix first)

- **Every message costs 2 HTTP round-trips.** `wrapFetchWithPayment` always sends a bare unpaid request, gets a 402, then retries with payment — on *every* call, with no caching (`@x402/fetch/index.mjs:5-13`). It's **cheap** (our handler short-circuits before any LLM call, so no wasted tokens — only latency). Fixable by caching the `PaymentRequired` from the first 402 and using `x402Client.createPaymentPayload()` directly, bypassing `wrapFetchWithPayment`. Worth doing, but not before mainnet.
- **Occasional double-402** on an already-open channel. Confirmed **normative protocol behavior**, not our bug: corrective-402 recovery is specified upstream (PR #2491) and every SDK implements a *bounded single retry*. [#2908](https://github.com/x402-foundation/x402/issues/2908) is an open proposal to expose typed recovery outcomes instead of today's bare boolean — worth tracking, since it would tell us *why* a recovery happened. It should still be occasional; if it fires on most messages, that's client/server drift (likely stale `localStorage`) — capture the second 402's `reason` to diagnose.
- **Voucher acceptance near a withdrawal deadline** ([#2901](https://github.com/x402-foundation/x402/issues/2901)): a server can accept vouchers it can't redeem if a payer has initiated a withdrawal. **The big version of this is already handled** — `WITHDRAW_DELAY_SECONDS = 86400` (24h) vs the 12h cron gives a 2× margin, with the rationale documented at `x402_server.ts:34-41` (it previously fell back to the SDK's 900s default, far below the cron interval). The narrower open question — when to *stop accepting* vouchers as a deadline approaches — is unresolved upstream and low-risk for us at this margin.

---

## Then: Mistral provider

Coupled to mainnet: once responses are no longer mocked, provider cost/quality is real.

`scw_js/llm_service.ts` hardcodes one IONOS endpoint/model. `growth-agent/agent/llm_client.py:18-29` already solved this with a `PROVIDERS` dict keyed by `LLM_PROVIDER` — port that shape to TypeScript.

- Replace hardcoded `MODEL_NAME`/`ENDPOINT` with a `PROVIDERS` map (`ionos`, `mistral`: `baseUrl`, `apiKeyEnv`, `defaultModel`).
- Select via `LLM_PROVIDER` (default `"ionos"`) + optional `LLM_MODEL` override — same two env vars growth-agent uses.
- `MISTRAL_API_KEY` as a `secret:` in `serverless.yml` (never `env:`).
- **Re-derive the price**: `convertTokensToUsdcCost()` hardcodes IONOS's 0.71 EUR/1M tokens. Mistral's rate differs — update it or the flat per-message price will be wrong in real money.
- Tests: both providers, token-missing error, correct key read per provider.

---

## Then: retire legacy (Phase D)

Only after mainnet is proven. **Order matters — recover funds before removing the code that can reach them.**

- [ ] **Pull any money out of `LLMv1` first.** Check the real on-chain balance on OP mainnet before assuming it's empty (plan notes say "no real balances", but verify — this is irreversible). Use `withdrawBalance`; leave it callable briefly for any user balances.
- [ ] Remove `llm_service.ts` merkle code (**keep `convertTokensToCost`**); remove `leaf_history.ts` + the `leafhistory` function; stop writing `merkle/trees.json`.
- [ ] Retire `sc_llm.ts` / the `llm` function and `useWalletAuth("sc-llm")`.
- [ ] Remove the old `/assistent` page + `BalanceDisplay` + `LeafHistorySidebar`; make `/assistent-v2` the canonical route.
- [ ] Retire the `LLMv1` contract (one fewer upgradeable contract under `CONTRACT_OWNER_PRIVATE_KEY` — a real threat-surface win).
- [ ] Update `scw_js/README.md` + `.github/THREAT_MODEL.md` (asset is now USDC; one fewer owned contract).

---

## Reference — design record

Settled decisions. **Don't re-derive these.**

### Why batch-settlement

Solves three problems at once: per-request settlement economics, "price known only after generation", and usage-pattern privacy.

1. **Deposit** (on-chain, once): client signs EIP-3009; USDC locked in escrow. `depositMultiplier: 5` by default.
2. **Voucher** (off-chain, per request): client signs a *cumulative* monotonically-increasing total. No tx.
3. **Claim** (on-chain, batched, periodic): many channels in one tx.
4. **Settle**: sweeps claimed funds to the receiver (a *separate* tx — see Gotchas).
5. **Exit**: `withdrawDelay` lets the client unilaterally reclaim escrow if the server sits on vouchers.

**Economics:** amortizes gas + fees over hundreds of requests; per-request settlement of a ~$0.001 turn would otherwise cost 10–50× the service.

**Privacy — aggregation, not anonymization (honest caveat):** the public per-request ledger disappears, but each channel's cumulative claim is individually on-chain and the deposit links wallet→channel. An observer reads *per-interval* spend from deltas; individual request size/timing is hidden. Tunable via claim interval.

**Trust:** strictly better than off-chain credits — the server can't claim more than the signed voucher or the escrow, and `withdrawDelay` is a unilateral exit.

### Infrastructure

- **Contract: consume, don't deploy.** `BATCH_SETTLEMENT_ADDRESS = 0x4020074e9dF2ce1deE5A9C1b5c3f541D02a10003`, canonical CREATE2, same on every EVM chain. Deployed on OP mainnet ✅, Base mainnet ✅, Base Sepolia ✅ — **not** Optimism Sepolia ❌ (hence all testnet work on Base Sepolia).
- **Storage: S3 compare-and-swap**, no new infra. Scaleway supports ETag conditional writes (`If-Match`/`If-None-Match` → 412). `scw_js/x402_channel_storage.ts` implements `get`/`list`/`updateChannel` over `channels/<id>.json`. `list()` is N+1 — fine at tens–hundreds of channels; Redis is the escape hatch if that ever bites.
- **Risk reframe:** a lost voucher update means *we under-claim* (our revenue), never user fund loss — the client is always protected by escrow + `withdrawDelay`. The correctness bar is forgiving.
- **Auth:** no separate bearer token — the payment voucher proves wallet control.
- **Fee:** LLM channels are fee-free (the exact-scheme image fee is untouched).

### Pricing model (why it's flat)

The SDK enforces `voucher.maxClaimableAmount === chargedCumulativeAmount + requirements.amount` **exactly** (`handleBeforeVerify`/`handleBeforeSettle`). So the handler *cannot* charge a different post-generation amount by mutating state — that just breaks the next request. True usage-based billing needs the corrective-402 flow (client re-signs after learning the real amount).

So we charge a flat per-message price, but **derived, not arbitrary**: `convertTokensToUsdcCost()` reuses the real IONOS price (0.71 EUR/1M tokens) → USDC atomic units (the two 1e6 factors cancel: `tokens * 71n / 100n`), applied to `LLM_ESTIMATED_TOKENS_PER_MESSAGE` (default 2000 → $0.00142). Treats 1 EUR = 1 USDC (documented simplification, no FX oracle).

### Client-side session keys (`voucherSigner`)

Messages after the first don't prompt the wallet: an ephemeral local key (`privateKeyToAccount`, persisted in `localStorage` keyed by wallet address) is passed as `voucherSigner`, and its address becomes the channel's `payerAuthorizer` — baked into `channelId` at deposit time and verified by the facilitator against `payerAuthorizer`, not `payer`.

- **Deposits/top-ups still prompt** (real ERC-3009 transfer, never delegated). With `depositMultiplier: 5` that's roughly one prompt per ~5 messages.
- **The key must not rotate independently of the channel** — a different key means a different `channelId`, silently orphaning the funded channel. Clear both together or neither.
- **Bounded risk:** a leaked key can only sign vouchers up to the *already-escrowed* balance, and refunds return to the real wallet. Worst case is griefing, not theft.

### Hard-won gotchas (each one cost real debugging)

- **`VoucherClaim.totalClaimed` is the new cumulative target**, not "already claimed". Wrong value = contract silently no-ops: no revert, `success: true`, zero value moved.
- **Claim and settle are genuinely two steps.** `claim` moves escrow into a per-`(receiver, token)` bucket with *no* ERC-20 transfer and no visible balance change; `settle(receiver, token)` sweeps it. Always check `receivers()` and the actual wallet balance, not just a claim receipt.
- **Always verify on-chain, never trust `success: true`.** Multiple bugs here returned success while moving nothing.
- **Payment requirements must go through `scheme.enhancePaymentRequirements()`** for verify/settle too — not just the 402-building path. A raw object omits `extra.receiverAuthorizer`/`withdrawDelay`, which the client signed against → `receiver_authorizer_mismatch` on every deposit.
- **402 failure responses must use `resourceServer.createPaymentRequiredResponse()`**, not a hand-built body — otherwise the client's corrective-retry flow has no `channelState` to resync from and a mismatch becomes a permanent dead end.
- **The client signer needs `readContract`** (build via `toClientEvmSigner(account, publicClient)`) — the corrective-recovery path requires it unconditionally.
- **One unregistered network breaks *all* networks' 402** — `enhancePaymentRequirements` throws and takes down the whole response. (This is the OP blocker above.)
- **Don't pass through SDK results by cherry-picking fields.** Dropping `extra` from the facilitator's settle response crashed the client on `channelId.toLowerCase()` — misdiagnosed as an upstream bug for a while; it was ours.
- **Scaleway cron rejects `*/12`** step syntax — use `0/12`.
- **`tsup` entries are explicit**: new handlers are silently excluded from `dist/` until added to `tsup.config.js`.

---

## Backlog

- **Personas / selectable system prompts.** Today one hardcoded prompt (`assistent.systemPrompt`). A persona registry (`{id, label, systemPrompt}[]`) + sidebar selector; no backend change needed since `sc_llm*.ts` already forwards arbitrary system-role content. Optionally reuse growth-agent's `Strategy` voice (`models.py:53-67`) as a "blog voice" persona — static copy first, live fetch only if it drifts.
- **Skip the 402 probe round-trip** (see Known rough edges).
- **Facilitator-hosted `receiverAuthorizer`.** Would let `scw_js` drop `RECEIVER_AUTHORIZER_PRIVATE_KEY` entirely. Deferred: the SDK requires a facilitator advertising `receiverAuthorizer` to *authenticate refund requests*, which `x402_facilitator` has no mechanism for. Real security design work, not a config toggle.
- **Tool / function calling** — "interesting, uncertain importance."
- **Streaming responses** — both IONOS and Mistral are OpenAI-compatible and support it.
- **Conversation persistence** — chat history currently lives only in React state, lost on refresh.
