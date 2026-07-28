# Open Agent Platform Plan — LLM MVP

Decouple `/assistent` from its single hardcoded LLM backend so that **any standard x402 batch-settlement (or `exact`) LLM agent** can serve it. Scope is deliberately narrowed to the LLM service only; image generation is out of scope for this iteration (it carries NFT coupling that needs separate treatment, and minting is entirely out of the picture here).

**The reverse direction is already done.** Third parties discovering and consuming *our* LLM endpoint works today — we are wire-standard (stock `@x402/evm` SDK) and discoverable + ownership-proofed on x402scan (prior PR). This MVP therefore builds only the missing direction: **the website consuming a second/third-party LLM agent.**

Structure: [Motivation](#motivation) → [Goals / Non-goals](#goals--non-goals) → [Key finding: we are already standard](#key-finding-we-are-already-standard) → [Where the coupling is today](#where-the-coupling-is-today) → [Architecture](#target-architecture) → [Phases](#phases) → [Design record](#design-record) → [Open questions](#open-questions).

---

## Motivation

`/assistent` is a thin UI bolted onto one specific serverless function whose URL is compiled into `useX402Chat.ts`. That was the right shape while proving x402 payment rails. It is the wrong shape for a platform, for three reasons:

1. **The payment layer is already open; the application layer is not.** x402's `accepts[]` is self-describing — price, `payTo`, scheme, network, asset all arrive in the 402. A client that *reads* `accepts[]` instead of assuming can pay any compatible endpoint. Today the frontend knows exactly one seller.
2. **Own the format, not the directory.** Depend on the open x402 protocol for payment and on our own published, machine-readable contract for discovery; treat every external directory (x402scan, etc.) as an optional listing, never a dependency.
3. **Agents, not humans, are the larger consumer base.** If the contract is machine-first, the website becomes one client among several with no privileged path, and the same artifacts power third-party integration for free.

---

## Goals / Non-goals

### Goals
- **G1 — Bring your own LLM agent.** Any operator of a standard x402 batch-settlement (or `exact`) LLM endpoint satisfying the `llm/v1` contract can be used by `/assistent`, without permission and without code changes on our side.
- **G2 — Machine-first contract.** `llm/v1` is defined by a stable, versioned, publicly fetchable OpenAPI document consumed identically by our frontend and third-party agents. No private path for our own UI.
- **G3 — No directory lock-in.** Nothing in the payment or discovery path may *require* any external service. A custom-URL escape hatch is the concrete proof.
- **G4 — Honestly labelled provenance.** The user always sees which `payTo` address and operator they are paying before they pay.
- **G5 — Zero-cost interop.** A compatible agent needs to do nothing we don't already do with the stock SDK — because we use the stock SDK (see next section).

### Non-goals (this iteration)
- **Not** image generation. Deferred — NFT coupling needs its own design.
- **Not** a reputation/dispute system. We do liveness + format checks, not quality guarantees. x402 has no refund primitive.
- **Not** on-chain ERC-8004 registration. The registration-file *format* may be reused, but nothing is minted.
- **Not** a full multi-agent registry yet. The MVP proves the contract + decoupling with a **custom-URL escape hatch**; a curated/automated registry list is a later phase.
- **Not** publishing a batch-settlement client helper for third parties — see [Key finding](#key-finding-we-are-already-standard) (it is not needed for interop) and Q2.

---

## Key finding: we are already standard

An audit of the current code against the installed `@x402/evm` SDK (v2.18.0) established that **our batch-settlement implementation has no wire-protocol deviation**. This reframes the whole plan — "make it compatible" is largely already done.

- **Server** (`scw_js/x402_server.ts`, `sc_llm_x402.ts`): the 402 `accepts[]` is built entirely by the SDK's `BatchSettlementEvmScheme.enhancePaymentRequirements`; the scheme string is the SDK's literal `"batch-settlement"`; verify/settle use the SDK's `resourceServer.verifyPayment` / `settlePayment`. All `extra` fields (`receiverAuthorizer`, `withdrawDelay`, `name`, `version`, `assetTransferMethod`) are SDK-injected. No custom payload fields.
- **Client** (`website/hooks/useX402Chat.ts`): all payment logic is the SDK (`BatchSettlementEvmScheme`, `@x402/fetch`'s `wrapFetchWithPayment`, `toClientEvmSigner`). The "manual" wiring the file comments mention is **just** `client.register(network, scheme)` — the SDK ships `registerExactEvmScheme` for the `exact` scheme but **no `registerBatchSettlementEvmScheme`** in 2.18.0, so those ~2 lines are unavoidable today and are a stock SDK call, not a reimplementation. The hand-written pieces (`WebStorageClientChannelStorage`, deposit strategy, delegate voucher-signer) all implement *documented SDK extension points*.

**Implication:** a third-party agent using stock `@x402/evm` batch-settlement already interoperates with our frontend and server in both directions. G5 is met at the protocol level today.

**Two honest caveats (constrain, do not break, interop):**
- **Network is Base-only** (`BATCH_SETTLEMENT_NETWORKS`, `x402_server.ts:26`) — the SDK's `DEFAULT_STABLECOINS` registry lacks Optimism mainnet, so `enhancePaymentRequirements` throws for `eip155:10`. A Base agent interoperates; an Optimism-only one would find no matching `accepts[]`. This is an SDK-registry limit, not our deviation.
- **One inaccurate comment to fix:** `sc_llm_x402.ts:40-42` claims the ceiling→actual settlement split uses the SDK's `setSettlementOverrides()`. That API does **not exist** in the installed SDK. The split works (verify demands the exact ceiling; settle enforces only `<= voucher.maxClaimableAmount`, so passing a smaller `amount` to `settlePayment` is legal), but the comment misattributes the mechanism. Correct the comment; no behavior change.

---

## Where the coupling is today (LLM only)

| # | Coupling | Location | Consequence |
|---|---|---|---|
| C1 | Endpoint URL is a module constant | `useX402Chat.ts` (`X402_LLM_URL`) | Env-overridable but single-valued — one seller |
| C2 | Request/response contract is implicit | `useX402Chat.ts` sends `{ data: { prompt } }`; expects `{ message, usage }` | "Compatible agent" is undefined until the shape is blessed as `llm/v1` |
| C3 | Provenance shown from stale single-tenant file | `useAgentInfo.ts` → `/agent-registration.json` (describes retired Merkle design) | The panel that should show "who you pay" reads an out-of-date self-description |
| C4 | Onboarding narrates a whitelisting flow being retired | `agent-onboarding/+Page.tsx` | Advertises manual GitHub whitelisting; not machine-usable |

Note: the wire *protocol* is not a coupling (see Key finding). The coupling is entirely at the application layer — URL, request shape, and provenance display.

---

## Target architecture

```
        openapi.llm.json  (the llm/v1 contract — already served at
        llm-agent origin /openapi.json, versioned, CORS-open, ownership-proofed)
                    │
        ┌───────────┴────────────┐
        │                        │
   website /assistent      third-party agent
   (one client of many)    (already interoperable — stock SDK)
        │                        │
        └───────────┬────────────┘
                    │  reads request/response schema + interop floor
                    ▼
          LLM endpoint (402 → accepts[] → pay via SDK → serve)
```

**One artifact, not three.** The service contract *is* the OpenAPI file we already publish — `LLMChatRequest` / `LLMChatResponse` are the request/response schema; there is no second JSON-Schema document to author (that was duplication). What must be *added* to promote it from "our endpoint's docs" to "the `llm/v1` standard":

1. A `serviceType` marker in the OpenAPI (`x-service-type: "llm/v1"`).
2. The **interop floor**, stated alongside the contract (it is a runtime-402 rule, not an OpenAPI field): *a compatible `llm/v1` agent MUST advertise at least one `accepts[]` entry with asset USDC on network Base (`eip155:8453`), scheme `batch-settlement` or `exact`.* Since our batch-settlement is stock-standard, the floor names it directly.

No registry document, no agent-card indirection layer for the MVP — the OpenAPI at the agent's own origin *is* the card. A multi-agent registry list is a later phase; the MVP uses a custom-URL escape hatch to prove openness.

---

## Phases

### Phase 1 — Bless the `llm/v1` contract (backend-only, low risk)
- [ ] Add `x-service-type: "llm/v1"` to `scw_js/openapi.llm.json`.
- [ ] Write the interop floor into the OpenAPI's `x-guidance` / a short `docs/llm-v1.md`: USDC on Base, scheme `batch-settlement` or `exact`.
- [ ] Optionally tighten `LLMChatRequest` (mandatory roles, message ordering) — low priority.
- [ ] Fix the inaccurate `setSettlementOverrides` comment in `sc_llm_x402.ts:40-42`.
- [ ] Confirm the legacy Merkle `sc_llm.ts` path is not reachable from `/assistent` (separate function; verify no shared coupling).

### Phase 2 — Decouple the chat hook (the core MVP change)
- [ ] `useX402Chat` takes an `agentUrl` (or `agent` object) instead of the `X402_LLM_URL` constant (fixes C1). Default stays our own endpoint.
- [ ] Optional-but-recommended: if the target agent advertises only `exact` (no batch-settlement in `accepts[]`), fall back to `exact` (wallet-popup-per-message). `exact` already has `registerExactEvmScheme`. This is the one place scheme-awareness is worth it — a third-party chat agent may not run batch-settlement. Keep it minimal: read `accepts[]`, pick batch-settlement if offered else `exact`, else fail with a clear message.
- [ ] `AssistantChat` passes the selected agent's URL through.

### Phase 3 — Provenance + escape hatch (proves G3/G4)
- [ ] Retarget provenance display off the stale `/agent-registration.json`: show operator + `payTo` + price + network parsed from the target agent's `/openapi.json` and its live 402 `accepts[]` (fixes C3). Reuse/replace `useAgentInfo`.
- [ ] Custom-URL input on `/assistent`: paste any `llm/v1` endpoint, no listing required (proves G3).
- [ ] Pre-payment disclosure: operator, `payTo`, price, network shown before the first paid message (G4).

### Phase 4 (deferred, not this PR) — Registry + automated listing
A `registry.json` of multiple vetted agents, automated permissionless listing (ownership-proof + contract-validation + liveness probe). Explicitly out of scope for the MVP; the escape hatch stands in for it. Prepare toward it, do not build it yet.

### Onboarding page (Option B, small, can ride Phase 3)
Demote `agent-onboarding/+Page.tsx` to **pure documentation**: strip the GitHub-issue generator and client-side JSON builder (the retired whitelisting flow, C4); keep the plain-English service explanation, the payment-flow diagram, and the request/response shapes — but **link to the live `openapi.llm.json`** instead of hardcoding them. Retitle from "onboarding" to "For agents / integration." It graduates to the registry's human face when Phase 4 lands.

---

## Design record

- **D1 — The OpenAPI file *is* the service contract.** No separate JSON-Schema document. `LLMChatRequest`/`LLMChatResponse` are the schema; a `serviceType` marker + the interop floor promote it to the `llm/v1` standard. Authoring a parallel schema would be duplication.
- **D2 — Interop floor, not lock-in (`D3` in the prior draft).** Each contract mandates a client-fulfillable minimum: ≥1 `accepts[]` entry, USDC, Base, scheme `batch-settlement` or `exact`. This lives in the runtime 402, stated beside the OpenAPI. Facilitator choice remains the seller's business; the client never talks to it directly.
- **D3 — We are already standard; do not re-engineer the protocol.** The only protocol-adjacent work is (a) fix the `setSettlementOverrides` comment, (b) adopt `registerBatchSettlementEvmScheme` if/when the SDK ships it. Neither blocks the MVP.
- **D4 — MVP is exactly one direction: the website consumes any agent.** The reverse direction (third parties discovering + consuming *our* endpoint) is **already done** — we are wire-standard (stock SDK) *and* discoverable/ownership-proofed on x402scan from the prior PR. An external consumer can find us and pay+call us today with nothing further from us. So the MVP builds only the consuming side: decouple the hook + escape hatch. A registry is a later phase; the escape hatch proves openness for the MVP.
- **D5 — ERC-8004 as format only, if at all.** Nothing minted, no gas, no on-chain lookup in the critical path.
- **D6 — External directories are listings, never dependencies.**

---

## Open questions

- **Q1 — Batch-settlement vs `exact` for third-party chat agents.** Batch-settlement has no public client register helper (SDK gap) but *we already use it fine* via the stock class. A third-party chat agent will likely advertise `exact` (wallet popup per message). Phase 2's fallback handles this. Is per-message-popup `exact` an acceptable MVP experience for third-party agents, with our own agent keeping the batch-settlement (popup-free) advantage? (Recommended: yes — honest, cheap, defers no protocol work.)
- **Q2 — Failure economics.** With BYO agents, a user pays an unknown `payTo` and may get nothing usable; x402 has no refund. For the MVP the escape hatch is explicitly user-initiated (they paste the URL), which bounds the risk to intentional use. Is a liveness pre-check needed before allowing a pasted URL, or is "you pasted it, at your own risk" sufficient for MVP?
- **Q3 — Does `/assistent` need multi-turn context across a changed agent?** If the user switches agents mid-conversation, channel state (per-origin in `localStorage`) is already scoped correctly, but conversation history semantics across a switch are undefined. Probably out of scope; confirm.
