# x402 for `search_api` (Brave Search + Web Fetch)

**Goal:** move `/search` and `/fetch` from the owner allowlist to x402 payment, so the assistant's
web access is open to any visitor.

**Non-goals:** kids mode (a later opt-in, see _Deferred_), any change to the SSRF defence, any
change to `llmx402` or `genimg`.

**Decision taken:** the browser always pays, for visitors and owner alike. The owner bearer path
stays for server-side callers (growth-agent, notebooks, curl) but disappears from the frontend, so
there is one code path and one set of failure statuses to test.

---

## Status — 20 September 2026

PR 1 is merged (#682) and deployed. `web-agent.fretchen.eu` sells both routes. **PR 2 is written
and green on `x402_brave`** — the frontend now pays instead of authenticating.

| Section                  | State                                                         |
| ------------------------ | ------------------------------------------------------------- |
| §1 Channel identity      | Done, and no longer an assumption — see below                 |
| §2 Prices                | Live at $0.01 / $0.001, still estimates; no Brave invoice yet |
| §4 PR 1 — seller         | Merged and deployed                                           |
| §5 Deploy and smoke-test | Done                                                          |
| §6 PR 2 — buyer          | **Written, green, awaiting merge** — see deviations below     |
| §7 PR 3 — discovery      | Not started                                                   |
| §8 Deferred              | Unchanged; `safesearch: "moderate"` still unpinned            |

### What the payment incident changed for this work

Diagnosing a "payment channel too low" report on a _funded_ channel found our own facilitator's
`/verify` omitting the scheme's `extra` from its response. The seller's SDK writes its cached
channel record straight from that field, wholesale, defaulting each key to zero — so every remote
verify was overwriting the real `balance`, `totalClaimed` and `refundNonce` with zeros.

This matters here more than anywhere else. PR 2 puts `/search` and `/fetch` on the **same channel**
as the chat, so a turn that searches once and fetches twice runs three verifies where there was one
— tripling the rate of a bug that empties the cache on every call. Fixed and deployed
(20 September) **before** merging PR 2, deliberately.

The same deploy exposed a second problem worth recording: `npm run deploy:prod` had been shipping a
stale bundle for ten days, silently, because npm's `predeploy` hook only fires for the exact script
name `deploy` and never for a sibling like `deploy:prod`. Every deploy script now chains
`npm run build` explicitly. Verify a facilitator deploy at the endpoint, never from the CLI's exit
code:

```bash
curl -s https://facilitator.fretchen.eu/openapi.json | jq '.components.schemas.VerifyResponse.properties | has("extra")'
```

### Two deliberate deviations in PR 2 as built

- **Two tool statuses, not three.** `website/tools/failure.ts` implements
  `channel_busy | payment_failed`; `payment_required` was dropped. `recoverable` is true only for
  `channel_busy`, which is the behaviour the table in §6 actually wanted — a drained channel and a
  broken verification are both "do not retry", so they did not need separate names.
- **The per-turn ceiling withdraws tools rather than failing calls.** `MAX_PAID_CALLS = 6` filters
  the paid tools out of the offered menu once the budget is spent, so the model sees a smaller menu
  instead of an error it has to interpret.

`website/utils/x402PaidFetch.ts` also carries client-side drained-channel recovery (`resyncFromChain`
plus one retry) — the buyer-side mirror of the same drift class, covered by
`website/test/x402PaidFetch.test.ts`.

**The central claim held.** A run of `notebooks/search_x402_buyer.ipynb` against Base mainnet paid
for both routes with **no deposit transaction** — each signed a voucher against the channel an
earlier chat session had opened. The live 402 confirms the other half of it: `payTo` is
`0xAAEBC1…`, the chat's own receiver, and `extra` carries the `receiverAuthorizer` and
`withdrawDelay` that go into `computeChannelId`.

Also decided or built while implementing, and not in the plan as first written:

- **`web-agent.fretchen.eu`**, not `search-agent` — the endpoint sells page fetches as well as
  searches, and `search.fretchen.eu` would have read as a site-search box. Declared in
  `serverless.yml`, which is what keeps it: the deploy plugin deletes any domain that file omits.
- **`httpOption: redirected` on every function.** Scaleway served these over plain HTTP by
  default, and each one carries either an owner bearer or a payment header.
- **`notebooks/search_x402_buyer.ipynb`** — the buyer notebook, and the only thing that exercises a
  paid GET end to end.
- **Four review findings fixed** after the branch was written. The one that mattered:
  `Access-Control-Allow-Headers` lost `Authorization` when the handler moved to the shared
  `CORS_HEADERS`, which would have blocked the owner's own tools in the browser at the preflight.
  `Authorization` cannot be wildcarded, so it has to be named.

Two carried into PR 2 rather than fixed in PR 1: `looseObject` instead of `strictObject` on the
query schemas (the endpoint has always ignored unknown parameters and a test pins that), and no
`PAID_ROUTES` staging, since both routes are one code path.

---

## 1. Channel identity — decide this before writing any code ✅

These routes must bill onto the **same batch-settlement channel the chat already opens**, not onto
a channel of their own. A second channel means a second on-chain deposit prompt, which destroys the
premise: nobody signs a $0.50 deposit to pay $0.001 for one page fetch.

A channel's id is a hash of its `channelConfig` — payer, `payerAuthorizer` (the localStorage
voucher signer from `getOrCreateVoucherSigner`), `payTo`, asset, network, `receiverAuthorizer`,
`withdrawDelay`. So `searchapi` must construct its resource server exactly as `sc_llm_x402.ts`
does:

```ts
const { resourceServer, scheme } = createLLMResourceServer(process.env.NFT_WALLET_PUBLIC_KEY);
```

with the same `RECEIVER_AUTHORIZER_PRIVATE_KEY` and the same `WITHDRAW_DELAY_SECONDS = 86400`,
writing the same `channels/<network>/` S3 prefix.

This costs nothing to set up: the top-level `secret:` block in `serverless.yml` is global, so
`searchapi` already receives both keys, and `llmx402cron` claims the shared channel with no change
at all.

**The failure mode is silent, which is why this comes first.** A mismatch in `payTo`,
`receiverAuthorizer` or `withdrawDelay` does not error — it computes a different `channelId`, opens
a second channel, and prompts a second deposit. It will look like a bug rather than a config
difference.

### Two consequences of sharing one channel

**`channel_busy` now spans three routes.** The per-channel lock is held from verify until
`onAfterSettle`. Settling only on success (below) leaves the lock orphaned for
`maxTimeoutSeconds` when Brave fails, so a failed tool call wedges the user's _next chat message_.
This is already true for LLM failures today; three routes multiply the exposure. Advertise a
shorter `maxTimeoutSeconds` on these two cheap routes.

**Parallel tool calls are now impossible.** The TODO at `website/utils/toolLoop.ts:116` says
several calls in one hop could move to `Promise.all` safely. That stops being true here: two paid
vouchers in flight on one channel is `channel_busy` by construction. Replace the TODO with the
reason it is closed.

---

## 2. Prices

| Route     | Price      | Atomic units (USDC, 6 decimals) | Rationale                                                                                                          |
| --------- | ---------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/search` | **$0.01**  | `10000`                         | Brave costs $5/1000 = $0.005/query. 2× cost of goods covers Brave, the Scaleway invoke, and a share of settlement. |
| `/fetch`  | **$0.001** | `1000`                          | Egress only. Symbolic — the point is "not open", not cost recovery.                                                |

Prices live in the code as atomic units, never as dollar floats, consistent with
`USDC_PAYMENT_AMOUNT = 70000` in `genimg_x402_token.ts`.

These are estimates from Brave's list price. Correct them against a real invoice once the routes
are live — they are constants with env-var defaults, so this is a one-line change and must not
block the work.

### Why sub-cent pricing needs batch settlement

Not because of USDC precision — six decimals handle `1000` fine — but because **the facilitator
charges 0.01 USDC flat per settlement** (`website/pages/x402/sellers/+Page.tsx`). Under the exact
scheme, a $0.01 search hands 100% of its revenue to the fee and a $0.001 fetch pays ten times its
own price. Gas on top of that is the smaller problem.

Batch settlement charges that fee **once per claim**, and the claim is the 12-hourly
`llmx402cron`. Amortised over a session's calls it disappears.

**So the template for both routes is `sc_llm_x402.ts`, not `genimg_x402_token.ts`.** `genimg` is
the exact scheme and the wrong shape here, however similar the handler looks.

### The 10:1 ratio is deliberate

Fetch is ten times cheaper than search, which steers the model into the right pattern: search once,
read several results.

### What this does to the chat's budget

One turn can search on several hops. Worst case at `MAX_HOPS = 4` (`toolLoop.ts:18`) is roughly 3
searches and 4 fetches ≈ $0.034 on top of the chat tokens — acceptable, but add an explicit
per-turn cost ceiling next to `MAX_HOPS` so a single question cannot fan out unnoticed.

The deposit floor needs no change. `MINIMUM_DEPOSIT_ATOMIC` is $0.50 and its comment argues the
figure from blast radius of a leaked voucher key and capital locked against `withdrawDelay`, not
from message count. $0.034 per turn against $0.50 of escrow is not a threshold problem.

---

## 3. How it lands: two PRs, plus a third that can trail

The split is forced by one asymmetry. `website/` **auto-deploys to GitHub Pages on merge to main**
(`.github/workflows/pages.yml`), while `scw_js/` has no deploy workflow at all — it ships manually
via `npm run deploy`, which rebuilds and redeploys _every_ function in `serverless.yml` from the
working tree. Merging a frontend change is a production deploy; merging a backend change is not.

| PR                | Scope                                  | Merge condition                                                                          |
| ----------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| **1 — seller**    | `scw_js/` only                         | Any time. Ships dormant: owner path unchanged, 402 only for callers that don't exist yet |
| **2 — buyer**     | `website/` only                        | **Only after PR 1 is deployed and smoke-tested**                                         |
| **3 — discovery** | `scw_js/` spec + `website/` x402 pages | Any time after 1; independent of 2                                                       |

One PR for 1 and 2 together would make the instant of merge the instant the frontend goes live,
racing a manual `npm run deploy` that also redeploys `llmx402` and `genimg` from whatever is in the
working tree. That is not a race worth running to save one review.

---

## 4. PR 1 — seller side (`scw_js/`) ✅ merged (#682)

Six commits, each green on `npm run check`.

**1. `search_api`: auth as a fork, not a gate.**
Split `handle()` into `isOwnerRequest(headers)` and `servePath(path, queryParams)`. A valid owner
signature goes straight to `servePath`; everything else falls through to what becomes the paid path
(still a 401 in this commit).

Keep it flat, in the shape `sc_llm_x402.ts` uses — no `Authorization` tagged union returning a
`settle()` closure. A settlement returns the result needed for the `Payment-Response` header and a
failed settlement must become a 402, so that closure would have to carry the amount, scheme,
network and settlement result back out, which is most of the handler hidden behind a type.

Keeping the owner path at all costs nothing and buys three things: the frontend migrates
independently, own testing stays free, and server-side agents need no funded wallet to call our own
service. No external behaviour change in this commit.

**2. Zod on the request side.**
`search_service.ts` already validates Brave's **response** with Zod (`BraveContextSchema` and
friends). The **request** side is hand-checked (`queryParams.q ?? ""`), which open access turns into
an attack surface. New `scw_js/search_schemas.ts`, beside `llm_schemas.ts`:

```ts
const SearchQuerySchema = z.object({ q: z.string().min(1).max(MAX_QUERY_CHARS) });
const FetchQuerySchema = z.object({ url: z.string().url().startsWith("https://") });
```

`z.object` for both — they are built field by field and really do reject extras, which is what PR 3
publishes. Errors go through `z.prettifyError` into the existing `QueryError` path so the 400 bodies
keep their current shape; the model corrects itself from those strings.

`CONTEXT_LIMITS` stays non-overridable from the browser. Its comment ("Half the reason this proxy
is ours…") matters more under open access, not less. No Zod field for it, and no `safesearch`
parameter (see _Deferred_).

**3. Batch-settlement seller wiring, 402 challenge only.**
`createLLMResourceServer` per §1, so `payTo`, `receiverAuthorizer` and `withdrawDelay` match the
chat's channel. Prices as atomic constants. The 402 is built with
`createBatchSettlementPaymentRequirements` + `create402Response` from `x402_server.ts` — none of
this needs writing again.

Payment arrives in the **header only**: `GET` with query parameters, so there is no body fallback
like `genimg`'s. Comment that explicitly or somebody will go looking for one. The repo negotiates
v2 `Payment-Signature` with v1 `X-Payment` as fallback, and `extractPaymentPayload` already handles
both.

Decide and comment what `resource.url` advertises — the route, or the full URL including the query
string. It determines whether a client caches one set of requirements per route or one per distinct
query.

CORS: the existing headers already send `Access-Control-Allow-Headers: *`, which covers both
payment header spellings. The only thing missing is `Access-Control-Expose-Headers`, and there is a
constant for it — `EXPOSED_X402_HEADERS` in `utils.ts`, which exists because a 402 and a settled 200
drifted apart once and the 200 was the one missing `Payment-Response`. Use the constant. Preflight
stays answered before payment, as it is answered before auth today.

After this commit, unpaid non-owner callers get 402 instead of 401.

**4. Paid path for `/fetch`.**
`extractPaymentPayload` → `verifyPayment` → fetch the page → `settlePayment` →
`createSettlementHeaders`, settling only on success exactly as `sc_llm_x402.ts:444-500` already
does (upstream error → 500, no settlement). At these amounts that is clearly right, and it sidesteps
the verify-to-settle window as a side effect: the window is milliseconds and the amount is trivial.

A paid-route allowlist (`PAID_ROUTES = ["fetch"]`) keeps `/search` owner-only for one more commit,
which gives a real bisect point. `/fetch` goes first because it is $0.001, calls no metered
upstream, and is where the security question lives.

Confirm the SDK tolerates a per-route `maxTimeoutSeconds` against a shared channel —
`LLM_MAX_TIMEOUT_SECONDS` is documented as immutable between advertise and verify, which is a
statement about one request, not about one channel.

> ⚠️ **The SSRF defence does not change and is not relaxed.** A payment authorises _a fetch_, not
> _a fetch of `169.254.169.254`_. `isPrivateAddress`, the check of **every** resolved address,
> `MAX_REDIRECTS` with per-hop re-validation, the size and content-type limits: all unchanged.

**5. Paid path for `/search`.**
Adds `"search"` to `PAID_ROUTES`. The only new behaviour is the metered upstream: a Brave 502
returns 500 without settling.

**6. Comments and README.**
The header comment of `search_api.ts` says this function is "not an x402 seller" and has no
published spec — both stop being true. The SSRF paragraph above goes into `web_fetch_service.ts`'s
header, because the obvious reading of "paid resource" is "the customer gets what they asked for",
and here they do not. Add both routes and their prices to `scw_js/README.md`.

### Tests

- Owner signature, no payment → 200 (backwards compatibility)
- Neither signature nor payment → 402, with the right `accepts` payload and per-route price
- Valid payment → 200, settlement triggered, `Payment-Response` present
- Brave answers 502 → **no** settlement
- OPTIONS preflight with neither auth nor payment → 200
- `Payment-Response` in `Access-Control-Expose-Headers`, on both the 402 and the settled 200
- Zod: empty `q`, over-long `q`, `http://` url, schemeless url → 400 in the existing error shape
- SSRF regression: a **paid** request for a private address is still refused
- **Channel parity:** requirements built by `search_api` and by `sc_llm_x402` hash to the same
  `channelId` for one payer — the guard against the silent second-deposit failure in §1

---

## 5. Between PR 1 and PR 2 — deploy and smoke-test ✅

`npm run deploy` in `scw_js/`, then check the live function on whichever mainnet the chat is
already using:

1. Send one chat message → the channel opens (one deposit tx)
2. `curl` `/search` with a voucher against that channel → 200, no second deposit
3. Confirm **one** channel record advanced under the `channels/<network>/` S3 prefix

No testnet rehearsal. The README's "test on testnet first" checklist is part of _Adding New
Networks_ and exists to catch EIP-712 domain mismatches; this change adds no network and touches no
domain. The amounts are $0.001–$0.01 against an escrow the chat already funds, so a failed
experiment on Base or Optimism costs less than the time to set up Base Sepolia — and unlike the
testnet, it exercises the paths users will actually hit.

---

## 6. PR 2 — buyer side (`website/`) ✅ written, green, awaiting merge

Four commits. All four landed; see _Status_ above for the two places the implementation
deliberately diverged from what is written below.

**1. Extract the payment client from `useX402Chat`.**
`sendMessage` (`hooks/useX402Chat.ts:339-374`) builds the signer, `BatchSettlementEvmScheme`,
`WebStorageClientChannelStorage`, voucher signer, spend controls and `wrapFetchWithPayment` inline.
Lift that into `utils/x402PaidFetch.ts` as `createPaidFetch({ walletClient, publicClient, network })`,
returning the wrapped fetch plus the storage handle the drained-channel resync needs.
`useX402Chat` becomes its first caller. A pure refactor: the existing chat tests must pass
untouched.

**2. Tools pay instead of authenticating.**
`tools/search.ts` and `tools/webFetch.ts` take the paid fetch instead of an auth string
(`fetchSearch(query, auth)` → `fetchSearch(query, paidFetch)`). `loadSearch` and `loadFetch`
(`AssistantChat.tsx:547,580`) drop `getSearchAuth()`, and `useWalletAuth("search-api")` goes. The
`queryClient.fetchQuery` cache stays as it is — a cache hit costs no payment, which is worth a
comment.

New statuses, with the `recoverable` flag `runToolLoop` reads at `utils/toolLoop.ts:126`:

| Status             | `recoverable` | Why                                         |
| ------------------ | ------------- | ------------------------------------------- |
| `payment_required` | **no**        | Do not retry a tool that cannot be paid for |
| `payment_failed`   | **no**        | Verification or settlement broke            |
| `channel_busy`     | **yes**       | Transient lock; the next hop can succeed    |

The model must be able to say "I could not search because the session balance is empty" rather than
"I found nothing" — the second is simply false.

**Critical:** the tools pay on the **same network the chat resolved**, never negotiating their own.
A different network is a different channel and a second deposit prompt.

**3. `TOOL_REGISTRY` gains a third state.**
`ownerScope` does double duty today — it gates on identity _and_ withholds tools from third-party
agents (`AssistantChat.tsx:317-323`), because a tool result is serialised into `convo` and sent to
whoever is paid on the next hop. Split it: keep `ownerScope`, add `defaultAgentOnly: boolean`.

```ts
(entry.ownerScope === null || hasOwnerScope(entry.ownerScope)) &&
  (!entry.defaultAgentOnly || customUrl === null);
```

Existing owner-scoped tools set both, preserving today's behaviour. The two paid tools set
`ownerScope: null, defaultAgentOnly: true` — offered to any visitor, never to a stranger's agent
that could spend their escrow and drive our fetcher at will. Both fields stay required, so a new
tool cannot arrive ungated. The existing "never puts the owner-scoped tool on the wire to a custom
agent" test gets a paid-tool twin.

**4. Per-turn cost ceiling, and close the `Promise.all` TODO.**
Per §1, parallel tool calls are now `channel_busy` by construction; replace the TODO with that
reason. Add the per-turn spend ceiling from §2 next to `MAX_HOPS`.

### End-to-end check before merging

Run `npm run dev:search` against the deployed seller's config and `npm run dev` for the site, then
in `/assistent`: send a chat message (channel opens, one deposit prompt), then ask something that
forces a search and a follow-up fetch. Expected: **no further wallet prompts**, both tool results
`ok`, one channel in `localStorage`, `chargedCumulativeAmount` up by `10000 + 1000`. Then select a
custom agent and confirm neither paid tool is offered.

Worth exercising once: a drained channel (→ `payment_required`, tool withdrawn for the turn, top-up
offered) and a broken Brave key (→ 500, no settlement, chat still usable on the next message).

---

## 7. PR 3 — discovery (can trail) — not started

- `scripts/generate-openapi-search.ts`, mirroring the genimg and llm generators, wired into
  `generate:openapi` in `package.json` (which `build` already runs) → `openapi.search.json`, with
  `x-service-type` and a per-route `x-payment-info.price` via `formatUsdcAtomicAsDecimalUsd`
- `test/openapi_search_generation.test.ts` asserting the published spec matches the strictness the
  handlers enforce — `additionalProperties: false` for both request schemas. Nothing else catches
  this, and the facilitator shipped it wrong once: its published `PaymentRequest` described a
  request that could not be paid with
- x402scan registration with an ownership-proof signature for the `payTo` address, as for
  `llm-agent` and `imagegen-agent`
- A line on `website/pages/x402/sellers/+Page.tsx` if that endpoint list is meant to be complete

The Zod request schemas from PR 1 are the source for the OpenAPI parameters — not a second
hand-maintained copy.

---

## 8. Deferred

**Rate limiting.** Not in v1. The escrow already is the rate limit: a voucher cannot exceed the
deposited balance (`cumulative_exceeds_balance`), so a payer is hard-capped at $0.50 ≈ 50 searches
before an on-chain top-up they pay for. An in-memory counter on a function that scales horizontally
and gets recycled is close to decorative.

The argument that does survive is not cost control but **abuse of third parties** — `/fetch` as a
paid reflector aimed at somebody else's site. That would be limited per _target host_, not per
payer, and it is worth doing the day there is any evidence of it.

**Kids mode.** Set `safesearch: "moderate"` in `CONTEXT_LIMITS` now — Brave otherwise falls back to
its own default, and pinning it is right regardless. Do **not** accept `safesearch` from the client
yet: it is plumbing for a feature that does not exist, on a knob `CONTEXT_LIMITS` exists to keep out
of the caller's hands. When the kids profile arrives it is a frontend profile plus a
`TOOL_REGISTRY` filter, plus a server-clamped value that can only tighten — no second route, no
change to the paid path.

---

## 9. Rollback

PR 2 reverts cleanly and Pages redeploys on merge, returning the frontend to owner-gated bearer
tokens. PR 1 needs no revert either way: the owner path stays live throughout, and an undeployed
402 path harms nobody.

**What the order buys:** after PR 1 the owner path runs unchanged and nothing user-visible has
moved; after PR 2 the assistant's web access is open to anyone with a funded channel. Nothing is
ever half broken.
