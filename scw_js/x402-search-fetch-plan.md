# x402 for `search_api` (Brave Search + Web Fetch)

**Goal:** move `/search` and `/fetch` from the owner allowlist to x402 payment, so the assistant's
web access is open to any visitor.

**Non-goals:** kids mode (a later opt-in, see *Deferred*), any change to the SSRF defence, any
change to `llmx402` or `genimg`.

---

## 1. Channel identity — decide this before writing any code

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

**The failure mode is silent, which is why this is Phase 1.** A mismatch in `payTo`,
`receiverAuthorizer` or `withdrawDelay` does not error — it computes a different `channelId`, opens
a second channel, and prompts a second deposit. It will look like a bug rather than a config
difference.

### Two consequences of sharing one channel

**`channel_busy` now spans three routes.** The per-channel lock is held from verify until
`onAfterSettle`. Settling only on success (below) leaves the lock orphaned for
`maxTimeoutSeconds` when Brave fails, so a failed tool call wedges the user's *next chat message*.
This is already true for LLM failures today; three routes multiply the exposure. Either advertise a
shorter `maxTimeoutSeconds` on these two cheap routes, or settle and compensate by amount. Decide
while implementing Phase 4, where the cost of being wrong is $0.001.

**Parallel tool calls are now impossible.** The TODO at `website/utils/toolLoop.ts:116` says
several calls in one hop could move to `Promise.all` safely. That stops being true here: two paid
vouchers in flight on one channel is `channel_busy` by construction. Replace the TODO with the
reason it is closed.

---

## 2. Prices

| Route | Price | Atomic units (USDC, 6 decimals) | Rationale |
|---|---|---|---|
| `/search` | **$0.01** | `10000` | Brave costs $5/1000 = $0.005/query. 2× cost of goods covers Brave, the Scaleway invoke, and a share of settlement. |
| `/fetch` | **$0.001** | `1000` | Egress only. Symbolic — the point is "not open", not cost recovery. |

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

## 3. Auth: owner **or** payment

`search_api.ts` today does: parse bearer → `parseOwnerAddresses` → `verifySignedMessage`. That
becomes a fork, not a gate: a valid owner signature **or** a valid x402 payment.

Keeping the owner path costs nothing and buys three things — the frontend can migrate
independently, own testing stays free, and server-side agents (growth-agent and friends) need no
funded wallet to call our own service.

Keep it flat, in the shape `sc_llm_x402.ts` uses:

```ts
if (await isOwnerRequest(headers)) return servePath(path, queryParams);
// otherwise: verify → serve → settle
```

rather than a tagged `Authorization` union returning a `settle()` closure. A settlement returns the
result needed for the `Payment-Response` header and a failed settlement must become a 402, so the
closure would have to carry the amount, scheme, network and settlement result back out — which is
most of the handler, hidden behind a type.

No external behaviour changes in this phase; it deploys on its own.

---

## 4. Zod on the request side

`search_service.ts` already validates Brave's **response** with Zod (`BraveContextSchema`,
`BraveGenericSchema`, `BraveSourceSchema`). The **request** side is hand-checked
(`queryParams.q ?? ""`, a length check against Brave's limit). Open access makes that an attack
surface. Both routes get a schema:

```ts
const SearchQuerySchema = z.object({
  q: z.string().min(1).max(MAX_QUERY_CHARS),
});

const FetchQuerySchema = z.object({
  url: z.string().url().startsWith("https://"),
});
```

Errors go through `z.prettifyError` into the existing `QueryError` path, so the 400s keep their
current shape — the model corrects itself from those strings.

`CONTEXT_LIMITS` stays non-overridable from the browser. Its comment ("Half the reason this proxy
is ours…") matters more under open access, not less. No Zod field for it, and no `safesearch`
parameter either (see *Deferred*).

---

## 5. x402 on `/fetch`

`/fetch` goes first: it is $0.001, it calls no metered upstream, and it is where the security
question lives. Getting the shared-channel mechanics wrong here costs nothing.

Reuse what already exists in `x402_server.ts` — `createBatchSettlementPaymentRequirements`,
`create402Response`, `createSettlementHeaders`, `extractPaymentPayload`. None of this needs to be
written again.

### Order of operations

```
verify payment → fetch the page → settle only on success
```

`sc_llm_x402.ts` already works exactly this way (upstream error → 500, no settlement), so this is
the repo's proven path, not a new idea. At these amounts, settle-after-success is clearly right and
it sidesteps the verify-to-settle window as a side effect: the window is milliseconds and the
amount is trivial.

### Payment arrives in the header only

`GET` with query parameters, so there is no body fallback like `genimg`'s. Comment that explicitly
or somebody will go looking for one. Note the repo negotiates **v2 `Payment-Signature` with v1
`X-Payment` as a fallback** — `extractPaymentPayload` handles both.

Decide and document what `resource.url` advertises: the route, or the full URL including the query
string. It determines whether a client caches one set of 402 requirements per route or one per
distinct query.

Confirm the SDK tolerates a per-route `maxTimeoutSeconds` against a shared channel —
`LLM_MAX_TIMEOUT_SECONDS` is documented as immutable between advertise and verify, which is a
statement about one request, not about one channel.

### CORS

The existing headers already send `Access-Control-Allow-Headers: *`, which covers both payment
header spellings. The only thing missing is **`Access-Control-Expose-Headers`**, and there is a
constant for it: `EXPOSED_X402_HEADERS` in `utils.ts`, which exists because a 402 and a settled 200
drifted apart once and the 200 was the one missing `Payment-Response`. Use the constant; do not
retype the list.

Preflight stays answered before payment, the same way it is answered before auth today. Update the
wildcard-CORS comment in the file rather than appending to it.

> ⚠️ **The SSRF defence does not change and is not relaxed.** A payment authorises *a fetch*, not
> *a fetch of `169.254.169.254`*. This belongs in the header comment of `web_fetch_service.ts`,
> because the obvious reading of "paid resource" is "the customer gets what they asked for" — and
> here they do not.

`isPrivateAddress`, the check of **every** resolved address, `MAX_REDIRECTS` with per-hop
re-validation, the size and content-type limits: all unchanged.

---

## 6. x402 on `/search`

Same pattern, same helpers, `10000` instead of `1000`. The one difference is a metered upstream:
a Brave 502 must not settle, and must not leave the channel locked (see §1).

---

## 7. Frontend

`website/tools/webFetch.ts` and `tools/search.ts` take a wallet token today and send a bearer
header. Replace that with `wrapFetchWithPayment` bound to the **voucher signer**, not the main
wallet — silence is the entire point.

New tool-result statuses, in the style of the image tool:

| Status | Meaning | `recoverable` |
|---|---|---|
| `payment_required` | Session escrow exhausted → prompt a top-up | **no** — do not retry a tool that cannot be paid for |
| `payment_failed` | Verification or settlement failed | **no** |
| `channel_busy` | Transient per-channel lock | **yes** — the next hop can succeed |

The `recoverable` flag is what decides whether `runToolLoop` withdraws the tool for the rest of the
turn (`toolLoop.ts:126`), so it is a real behavioural choice, not bookkeeping.

The model must be able to say "I could not search because the session balance is empty" rather than
"I found nothing" — the second is simply false.

### `TOOL_REGISTRY` gating needs a third state

`searchWebTool` and `fetchUrlTool` carry `ownerScope: "search"` today. That flag does double duty in
`AssistantChat.tsx`: `availableTools` also uses it to withhold owner-scoped tools **while a
third-party agent is selected**, because a tool result is serialised into `convo` and sent to
whoever is being paid on the next hop.

Flipping these two to `ownerScope: null` would therefore also hand them to a stranger's agent,
which could then spend the visitor's escrow and drive our fetcher at will. What is needed is a third
state — *offered to anyone, still withheld from custom agents* — not a null. The existing test
"never puts the owner-scoped tool on the wire to a custom agent" needs its paid-tool counterpart.

Add the per-turn cost ceiling from §2 in the same pass.

---

## 8. Discovery

- `openapi.search.json`, alongside `openapi.llm.json` / `openapi.genimg.json`
- `x-service-type` for both routes, price documented per route
- x402scan registration with an ownership-proof signature for the `payTo` address, as for
  `llm-agent` and `imagegen-agent`
- The Zod request schemas from §4 are the source for the OpenAPI parameters — not a second
  hand-maintained copy

**The generated spec must publish the strictness it actually enforces.** `z.object` renders as
`additionalProperties: false`, so a schema that merely strips unknown keys would publish a promise
the handler does not keep. Both request schemas here are built field by field and really do reject
extras, so `z.object` is correct — and that needs `test/openapi_search_generation.test.ts` to
assert it, because nothing else catches the mistake. The facilitator shipped this wrong once.

---

## 9. Tests

- Owner signature, no payment → 200 (backwards compatibility)
- Neither signature nor payment → **402**, with the right `accepts` payload and per-route price
- Valid payment → 200, settlement triggered
- Brave answers 502 → **no** settlement
- OPTIONS preflight with neither auth nor payment → 200
- `Payment-Response` in `Access-Control-Expose-Headers`, on both the 402 and the settled 200
- Zod: empty `q`, over-long `q`, `http://` url, schemeless url → 400 in the existing error shape
- SSRF regression: a *paid* request for a private address is still refused
- Channel: a payment built from the chat's `channelConfig` resolves to the **same** `channelId` —
  the guard against the silent second-deposit failure in §1
- Frontend: `payment_required` withdraws the tool for the turn, `channel_busy` does not
- Frontend: neither paid tool is offered while a custom agent is selected

---

## 10. Deferred

**Rate limiting.** Not in v1. The escrow already is the rate limit: a voucher cannot exceed the
deposited balance (`cumulative_exceeds_balance`), so a payer is hard-capped at $0.50 ≈ 50 searches
before an on-chain top-up they pay for. An in-memory counter on a function that scales horizontally
and gets recycled is close to decorative.

The argument that does survive is not cost control but **abuse of third parties** — `/fetch` as a
paid reflector aimed at somebody else's site. That would be limited per *target host*, not per
payer, and it is worth doing the day there is any evidence of it.

**Kids mode.** Set `safesearch: "moderate"` in `CONTEXT_LIMITS` now — Brave otherwise falls back to
its own default, and pinning it is right regardless. Do **not** accept `safesearch` from the client
yet: it is plumbing for a feature that does not exist, on a knob `CONTEXT_LIMITS` exists to keep out
of the caller's hands. When the kids profile arrives it is a frontend profile plus a
`TOOL_REGISTRY` filter, plus a server-clamped value that can only tighten — no second route, no
change to the paid path.

---

## 11. Order and effort

1. **§1** — channel identity: same `payTo`, authorizer, withdraw delay, storage prefix
2. **§3** — auth fork (no behaviour change, deploys alone)
3. **§4** — Zod on the request side
4. **§5** — x402 on `/fetch` (cheap route first)
5. **§6** — x402 on `/search`
6. **§7** — frontend: payment, statuses, tool gating, per-turn ceiling
7. **§8** — OpenAPI and discovery (independent, can trail)

Pricing research does not gate any of this; correct the constants when the first invoice arrives.

Phases 1–6 are the real work and mostly mirror code that already exists in `sc_llm_x402.ts` and
`x402_server.ts`. Roughly a day; the OpenAPI document takes longer than it looks.

**What this order buys:** after §3 the owner path runs unchanged, after §5 there is paid fetching
while `/search` is still owner-gated. Nothing is ever half broken.
