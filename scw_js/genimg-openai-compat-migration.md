# `genimg_x402_token.ts` → OpenAI Images API compatibility

**Goal:** make the image endpoint consumable by any client that already knows the OpenAI images
body, and publish it as an interchangeable `images/v1` contract — without losing the NFT mint.

**Guiding rule:** the standard subset must be **fully functional with zero extensions**. A client
sending `{ model, prompt, size }` gets a working image URL back and never needs to know an NFT
exists.

**Non-goal:** changing the payment flow. x402 `exact` / EIP-3009 / $0.07 stays exactly as is.

**Status:** PR 1 (request side — steps 1–4) shipped. PR 2's `scw_js` half (steps 5, 6, 7, 9)
shipped. **Remaining: step 8 — the `website` half.** See §7 for the step-by-step state.

⚠️ **The website does NOT fail to compile against the new shape, and that is the hazard.** This
doc previously predicted a red `npm run typecheck` window; there is none.
`website/types/x402.ts` hand-duplicates `X402GenImgResponse` rather than deriving it from
`scw_js`, so there is no compile-time link between the two at all. The frontend will build clean
and read `result.image_url` as `undefined` **at runtime**, after deploy. Nothing catches this —
which makes step 8 and the deploy order below load-bearing rather than tidy-up.

---

## 0. Scope

This is not drop-in OpenAI SDK compatibility. That position is already the house position, stated
in `openapi.llm.json`'s `x-guidance` and repeated at `README.md:73`: payment is x402, so a stock
SDK sends `Authorization: Bearer`, cannot satisfy a 402, and never reaches the body. **The OpenAI
shape is for body legibility, not drop-in SDK use.** genimg adopts that sentence verbatim.

What the migration buys:

1. A caller who already knows the OpenAI images body learns nothing new.
2. A machine-readable spec that describes the endpoint accurately — what an agent discovering us
   through x402scan actually consumes.
3. An `images/v1` contract a third party can implement (§1).

**The load-bearing implementation fact:** `clientAddress = verification.payer` — the mint
recipient is already derived from the x402 payment. No non-standard _request_ field is required
for the core flow. The payment carries the recipient, and everything chain-related moves to a
response-side extension that standard clients ignore.

---

## 1. The `images/v1` contract

`llm/v1` is a contract rather than a tag because of four things, all reproducible here: the
`x-service-type` string, an `x-interop-floor`, request/response schemas that define the wire shape
entirely within the document, and a `README.md` section stating it. It also leans on the body
being a recognised third-party shape, so a second implementer has something to implement against.
The OpenAI images body gives `images/v1` the same footing.

Note what is _not_ part of it: there is no `/v1/images/generations` path. `sc_llm_x402.ts:115-166`
never reads `event.path` past its `httpMethod !== "POST"` guard, so `POST /v1/chat/completions`
works there — and so does `POST /banana`. That is an accident of the shape, not a feature, and
`openapi.llm.json` advertises exactly one entry under `paths`: `"/"`. genimg does the same.
Discovery is origin-based: consumers fetch `<origin>/openapi.json` and read `x-service-type`
(`precheckLlmV1Agent` / `checkLlmV1Agent`, `website/hooks/x402Discovery.ts:187,278`, neither of
which ever inspects a path).

### The floor is the image, never the NFT

This is the decision that determines whether `images/v1` is interchangeable or just our service
with a version number on it. If the mint were inside the floor, no one else could implement the
contract — they would need a GenImNFT contract, an authorised agent wallet, gas, and a transfer
flow.

A compliant `images/v1` agent must:

- accept an OpenAI images body: `{ prompt, model?, size?, n?, response_format? }`
- advertise ≥1 `accepts[]` entry with USDC on `eip155:10` or `eip155:8453`, scheme **`exact`**
- return `{ created, data: [{ url }] }` — a fetchable URL, not base64
- support `size: "1024x1024"` at minimum

Anyone with an image model and a USDC wallet clears that bar. Our mint sits **outside** it, as
`x-capabilities: ["nft-mint"]` plus the `x_nft` response extension, which a client detects or
ignores. Absent `x_nft`, the response is still fully valid `images/v1`.

That is the same decision as §4's envelope, seen from the other side: pushing chain data under
`x_nft` is not tidiness, it is what lets the standard part stand alone.

### Three boundaries worth stating explicitly

- **`size` is not a fixed enum in the floor.** Ours is `1024x1024` / `1792x1024`; gpt-image-1's is
  `1536x1024` / `1024x1536` / `auto`. Pinning an enum would make any differently-sized implementer
  non-compliant. The floor requires `1024x1024`; each agent advertises its own full set in its own
  schema. `llm/v1` solves the same problem the same way for `model` — validated against the
  advertised id(s), which `x402Discovery.ts:89` notes is "necessarily a placeholder".
- **`mode` / `referenceImage` stay out of the floor**, as vendor extensions. Editing is not part
  of the OpenAI images-generation body, and requiring it would exclude generation-only providers.
- **The payment scheme differs from `llm/v1` by design** — `exact` here, `batch-settlement` there.
  A client able to pay one cannot necessarily pay the other. They are separate contracts, not
  tiers.

### Publishing a contract nothing checks

`llm/v1` is enforced by running code (`precheckLlmV1Agent`). `images/v1` will have none, so
nothing external stops the document drifting from the implementation — which is exactly how
`openapi.genimg.json` came to advertise a required `tokenId` the code never read.

The Zod generator and its golden test (§3) replace the missing checker. They cannot validate a
third party, but they do guarantee that _our_ published document matches _our_ code, which is the
failure mode that actually occurred. Publishing the contract and generating the spec are one piece
of work, not two.

Also worth a note: the 402 `resourceUrl` currently passes the bare `event.path` rather than a full
URL. `sc_llm_x402.ts:206` has the identical fallback, so it is a shared wart rather than a genimg
bug — out of scope here.

---

## 2. Target request contract

### Standard fields

| Field             | Handling                                                            |
| ----------------- | ------------------------------------------------------------------- |
| `prompt`          | required (unchanged)                                                |
| `size`            | `"1024x1024"` \| `"1792x1024"`, default `1024x1024` (unchanged)     |
| `model`           | **new** — accept, echo back, map to a provider (see below)          |
| `n`               | **new** — accept, but reject anything but `1`. Pricing is per-image |
| `response_format` | **new** — accept `"url"`; reject `"b64_json"`                       |

`user` is **not** accepted. See the strictness rule below — it is not special.

### Unknown fields are rejected

The request schema is an explicit allowlist: `prompt`, `model`, `size`, `n`, `response_format`,
plus the vendor extensions `mode`, `referenceImage`, `network`, `isListed`, `x_nft`, `payment`.
Anything else returns 400 `invalid_request_error` with `param` naming the offending field.

Three reasons, in ascending order of force:

1. **This is what the standard does.** The real OpenAI API rejects unrecognised arguments —
   "Unrecognized request argument supplied: …".
2. **It matches the sibling endpoint's actual principle.** `sc_llm_x402.ts:216-226` rejects
   `stream: true` because streaming "settles per message on the final usage, which requires the
   whole completion — so `stream:true` is rejected rather than silently buffered." Reject what
   you would otherwise silently mishandle.
3. **This endpoint takes money.** Silently ignoring `quality: "hd"` means charging $0.07 for a
   request we did not fulfil as asked. A free API can shrug; a paid one cannot.

`quality`, `style`, `background`, `user` are not really _unknown_ — they are known fields we
cannot honour, and each one ignored is a caller charged for the wrong image. `n` and
`response_format` fall under the same rule rather than being two bespoke checks. Zod's
`.strict()` produces all of it for free, which makes strictness an argument _for_ the schema work
in §3 rather than a cost of it.

### `model` maps to a real provider choice — carefully

`image_service.ts` has two providers: `bfl` (`flux-kontext-pro`) and `ionos`
(`black-forest-labs/FLUX.1-schnell`). A naive allowlist would ship a silent bug:
`generateImageIONOS()` ignores both `mode` and `referenceImageBase64`, so an edit request routed
to ionos returns a fresh image instead of an edit, with no error anywhere.

So: a **single-entry map** `{ "flux-kontext-pro": "bfl" }`, defaulting to `bfl`, replacing the
currently hardcoded `"bfl"` in the `generateAndUploadImage` call. ionos becomes selectable only
once `generateImageIONOS` either supports edit mode or the handler rejects `mode: "edit"` for it.

### Divergences worth documenting

- **`size`.** Ours is a subset of DALL·E 3's set and disjoint from gpt-image-1's. Document it; do
  not chase it. The `images/v1` floor accommodates this by design (§1).
- **Testnets return a placeholder.** `useMockImage = isTestnet(clientNetwork)`, so an agent
  testing on Base Sepolia gets `via.placeholder.com`, not a generated image. This belongs in the
  spec's `x-guidance` — exactly the kind of thing a discovery-driven caller trips over.

### Vendor extensions (all optional)

```json
{ "x_nft": { "listed": false } }
```

- `mode` / `referenceImage` stay as **documented top-level vendor extensions** for now (see §9)
- `network` stays — it drives 402 negotiation, not generation
- `payment` stays as the body fallback alongside the header
- `isListed` keeps working; `x_nft.listed` is the new alias

---

## 3. Schemas and the OpenAPI document

`openapi.genimg.json` is currently wrong in ways that would actively mislead an agent:

- it declares `tokenId` a **required request field** — the code has never read it
- it omits `network` and `isListed`, both real and both used by the website
- its response schema lists `transaction_hash`, which is never returned, and omits everything
  that is

Hand-fixing it would leave it hand-maintained, which is how it drifted this far — and under §1 it
is no longer just documentation, it is the normative definition of `images/v1`. Adopt the pattern
already proven one directory over: `x402_facilitator/x402_schemas.ts` plus
`scripts/generate-openapi.ts`, with `test/openapi_generation.test.ts` re-running the generator and
deep-equalling the committed file. That golden test is what actually enforces regeneration, not
the script. The facilitator's header comment records the failure mode it was written against:
`/supported`'s `facilitatorFees` sat documented as a bare `{"type": "object"}` while the real
disclosure grew a dozen fields across two fee-model phases.

genimg is the **second** adopter of that generator pattern and the first in `scw_js/`.
`openapi.llm.json` is still hand-written; converting it the same way is a natural follow-up, out
of scope here (§10).

**Shipped in PR 1** as `genimg_schemas.ts`, `scripts/generate-openapi-genimg.ts`,
`test/openapi_genimg_generation.test.ts`, and a `generate:openapi:genimg` script chained into
`build`. Named for genimg because `scw_js` has two spec files. When the llm spec is converted,
extract the ~17 genuinely common lines (`toComponentSchema`, the write-and-log `main`, the
`contact` block, the `/openapi.json` path stanza) into a local `scripts/openapi-codegen.ts` —
not a `shared/` package. A shared package is right only once a _third package_ needs it (the
facilitator, or the first spec for `comment_service`/`analytics`); until then it would add a
`file:` build-ordering dependency to `scw_js`'s deploy path for very little code.

Name the generated schemas `ImageGenerationRequest` / `ImageGenerationResponse` and treat their
`.describe()` text as contract prose, not internal comments — under §1 that text is what a third
party implements against.

Three deliberate deviations from the facilitator's version of the pattern:

- **Scope is request _and_ response**, not response-only. The facilitator kept its request schema
  shallow because `@x402/evm` already validates those payloads and re-modeling them would
  duplicate the SDK. genimg is the opposite case: its request body is hand-validated in the
  handler today, with separate ad-hoc blocks for `prompt`, `mode`, `size`, `isListed` — and §2
  would add three more. One `safeParse` plus one ZodError→`openAiError` mapper replaces all of
  them. Zod _shrinks_ this migration rather than adding to it.
- **The request schema is `.strict()`** — see §2. The facilitator's is not, because its request is
  an SDK-validated passthrough; genimg's is the actual user-facing contract.
- **`x_nft` is one object with a `status` enum and optional fields, not a discriminated union.**
  `z.toJSONSchema` renders unions as `anyOf` — legal in OpenAPI 3.1, noisier than this earns.

Unchanged from the facilitator's version: the payment payload stays **out** of the schema (same
reason — the SDK validates it), and only `components.schemas` is generated. `info`, `servers`,
`tags`, and `paths` are prose, not data shapes, and stay hand-written.

**New dependency:** `scw_js` has no `zod`. Add `^4.5.4`, matching `eth/` and `x402_facilitator/`.
Zod 4's native `z.toJSONSchema` means no `zod-to-openapi`. Wire `generate:openapi` into the
`build` script the way the facilitator does.

The regenerated spec also carries `x-service-type: "images/v1"`, the `x-interop-floor` from §1,
`x-capabilities: ["nft-mint"]`, the `x_nft` and `mode` extension documentation, and keeps
`x-discovery.ownershipProofs` untouched.

---

## 4. Target response contract

### Success

```json
{
  "created": 1757260000,
  "data": [{ "url": "https://…", "revised_prompt": null }],
  "model": "flux-kontext-pro",
  "x_nft": {
    "status": "minted",
    "token_id": 42,
    "contract": "0x…",
    "network": "eip155:10",
    "metadata_url": "https://…",
    "mint_tx": "0x…",
    "transfer_tx": "0x…",
    "listed": false,
    "mint_price": "…",
    "owner": "0x…"
  }
}
```

`x_`-prefixed vendor extensions follow existing practice among OpenAI-compatible providers
(`x_groq` and similar), so this is a convention, not an invention.

Drop from the payload: `message` (prose, not machine-readable), and `mode`, `size`, `isListed`,
`payer`, `mintPrice` as top-level echoes — they move into `x_nft` or disappear.

`x_nft.contract` also fixes a latent frontend bug: `X402GenImgResponse` declares
`contractAddress`, which the backend has never sent.

### The mint-failure change ⚠️

Today a failed mint falls into the generic `catch` and returns **500**. A client that has its
image should not be told the request failed.

**New behaviour:** if generation succeeded and only the mint failed, return **200** with the
image URL present and:

```json
"x_nft": { "status": "mint_failed", "reason": "…" }
```

**Settlement does not fire.** This preserves today's money behaviour exactly — `settlePayment` is
called only after a successful mint, so a payer whose mint fails is not charged today either. It
is the one place where this endpoint answers 200 while no payment settled, and the code needs a
comment saying so.

Status values: `minted` | `mint_failed`.

**How to structure it:** split `generateImageAndMintNFT` into a generation half and a minting half
so the _handler_ owns the branch. That is what makes "settle only on a complete success" explicit
rather than incidental — today it is merely a consequence of `settlePayment` sitting after a call
that throws. Generation failure keeps the existing 500 path unchanged.

(An earlier draft justified this by saying a 5xx retry would resend the payment header and hit a
rejected nonce. Since settlement never fired, the nonce is untouched and a retry would in fact
succeed. The 200 is still right, for the plainer reason above.)

### Errors

Reuse the two helpers `sc_llm_x402.ts:92-111` already established, verbatim, including the
comment explaining the split:

- `openAiError(status, message, type, code)` → `{ error: { message, type, code } }` for request
  validation
- `errorResponse(status, message)` → `{ error: "…" }` for payment and internal errors

**402 bodies stay exactly as they are.** They keep their x402-specific diagnostic fields
(`reason`, `expected`, `received`, `payer`) at the top level, un-nested. Re-shaping them risks
`@x402/fetch` clients for no gain, and the repo already documents 402 as deliberately outside the
OpenAI contract.

---

## 5. Ordering: the 402 challenge comes before validation

`genimg_x402_token.ts` validates **before** issuing the 402: prompt at `:362`, mode at `:392`,
size at `:403`, referenceImage at `:414` — and only then `if (!paymentPayload)` at `:432`.

`sc_llm_x402.ts:174-195` deliberately does the reverse, and its comment records why: an unpaid
request is answered with the 402 whatever its body says, because "a client probing for the payment
terms it is supposed to discover got a 400/404 with no Payment-Required header, so this agent
failed its own compatibility checker."

genimg has that bug today, and §2's strictness would make it sharply worse — a discovery probe
carrying one stray field would get a 400 instead of the payment terms. So the two changes ship
together. Required order:

1. Parse JSON → 400 on malformed.
2. **402 challenge if unpaid**, whatever the body says. Nothing is charged; this branch only
   advertises terms.
3. Strict validation, on the paid path only — so a malformed paid request is rejected _before_
   verify or settle, and the caller is not charged.

---

## 6. The error helper (this is where code shrinks)

There are currently ~10 hand-built error bodies, each with its own shape and its own inline
`headers` object: missing prompt, invalid mode, invalid size, edit-without-reference, four
separate 402 paths, non-POST, bad JSON, and the catch-all 500.

Lift `CORS_HEADERS` out of the ~12 inline `headers:` objects — copy the constant and its comment
from `sc_llm_x402.ts:78-87`. The OPTIONS `Access-Control-Allow-Headers` list must not change;
`genimg_x402_token.test.ts` enforces it.

Then convert every error return to `openAiError` or `errorResponse` per §4.

**Net effect: roughly −60 lines.** This is the single biggest simplification in the migration,
and it is also what makes SDK-style clients work, since they parse `error.code` and currently
receive an unparseable string.

---

## 7. Scope: one PR

Five phases for ~120 lines in one file would be process for its own sake. The request-side,
response-side, ordering, and error-side changes all touch the same function body and would
conflict with each other; shipping them separately means rewriting the same tests three times.

The only consumer we control reads exactly three fields — `image_url`, `metadata_url`, `tokenId`
(`X402GenImgResponse` also declares `contractAddress`, never sent, plus
`mintTxHash`/`transferTxHash`, which nothing reads). That surface does not justify a dual-emit
shim or a timed deprecation window.

It ended up as two, split on **request-side vs response-side**. Steps 1–4 change nothing a caller
can observe except error bodies and the 402/validation order, so they shipped without touching the
website. Steps 5–9 change the wire shape and must move the frontend with them.

**PR 1 — request side. Shipped.**

1. ✅ `CORS_HEADERS` + the two error helpers; convert all error returns
2. ✅ Zod schemas, `scripts/generate-openapi-genimg.ts`, the golden test, `zod` dependency,
   `build` wiring
3. ✅ Reorder: 402 challenge before validation (§5)
4. ✅ Request-side: strict allowlist, `model` map, `n`, `response_format`, `x_nft.listed` alias —
   one `safeParse`

**PR 2 — response side. `scw_js` shipped; `website` remaining.**

5. ✅ `buildSuccessBody()` emitting the new envelope, `model` echoed
6. ✅ The mint-failure branch, split out of the catch-all, with no settlement
7. ✅ `openapi.genimg.json` carries `x-service-type: "images/v1"`, `x-interop-floor` and
   `x-capabilities: ["nft-mint"]`, asserted by `test/openapi_genimg_generation.test.ts` — the
   protection `llm/v1` gets from `precheckLlmV1Agent`, which `images/v1` will not have
8. ⬜ `website/types/x402.ts` (response envelope, plus `model?` on the request type),
   `website/components/ImageGenerator.tsx:294-336`, **and the two public code samples in §8**
9. ✅ `scw_js/README.md`: `images/v1` section, the `x_nft` extension, the `mode`/`referenceImage`
   vendor extensions, the strict-request rule, and the testnet-placeholder caveat. Its parameter
   table and response example had both drifted (the example showed `mint_tx_hash`/`token_id`,
   never the real shape; `network` and `payment` were marked required and are not) — corrected
   and pointed at the generated spec as authoritative.

### PR 2 as five commits

Breaking changes between commits are fine on this branch, so the commits follow the natural data
flow rather than contorting to keep each one green:

| #   | Commit                                                                                        | `scw_js` | `website` |
| --- | --------------------------------------------------------------------------------------------- | -------- | --------- |
| 1   | Backend: response envelope — response schema, `buildSuccessBody()`, spec regen, 14 assertions | ✅       | ⚠️ stale  |
| 2   | Backend: mint-failure branch — split generate/mint, 200 + no settle, tests                    | ✅       | ⚠️ stale  |
| 3   | Spec: `images/v1` keys — `x-service-type`, `x-interop-floor`, `x-capabilities`                | ✅       | ⚠️ stale  |
| 4   | Frontend: switch to the envelope — `types/x402.ts`, `ImageGenerator.tsx`                      | ✅       | ✅        |
| 5   | Docs — buyers page sample, blog sample, `README.md`, this file's status                       | ✅       | ✅        |

"⚠️ stale" and not "🔴": as the warning at the top of this file explains, `website` keeps
compiling and testing green through commits 1–3 because its `X402GenImgResponse` is a hand-written
duplicate, not a derived type. The breakage is real but invisible until runtime.

**The one known-red window is `website` typecheck, commits 1–3**, because `X402GenImgResponse`
stops matching what `ImageGenerator.tsx:294-336` reads. `scw_js` is green at every commit, and
nothing else breaks: the website's test surface for the response shape is effectively zero
(`useX402ImageGeneration.test.ts` and `ImageGenerator.test.tsx` mock wagmi hooks, not the
response; `ImageGenerator.integration.test.tsx` asserts against its own `fetch` fixture — a GET
with `tokenId` query params the endpoint never supported, inert here). If branch CI runs
per-commit rather than per-PR-head, commits 1–3 will report red. Expected.

Two ordering constraints are real rather than stylistic:

- Commit 3 must follow commit 1 — the `images/v1` floor requires `data[0].url`, so declaring the
  contract earlier would advertise a shape not yet served.
- Commit 1's schema declares `status: "minted" | "mint_failed"` while only `minted` is reachable
  until commit 2. The enum is the contract; it lands whole rather than being widened later.

### What PR 1 changed that this doc did not predict

- **`openAiError` gained a `param` argument** (`utils.ts`), so errors name the offending field as
  OpenAI's do. Omitted from the body when absent, so `sc_llm_x402`'s error bodies are unchanged.
- **A dead field was found and removed.** `sepoliaTest` appeared in three tests and in the test
  file's header comment as though it were a feature; `genimg_x402_token.ts` has never read it.
  Test mode comes from `isTestnet(clientNetwork)` off the payment payload. Strict validation is
  what surfaced it.
- **`isListed: "true"` (string) is now rejected rather than silently coerced to `false`.** The old
  behaviour gave a caller who asked for a listed NFT an unlisted one and charged them anyway.
  Same principle as the rest of the strictness. The website only ever sends a real boolean.
- **New standing constraint:** the request schema is an allowlist, so **any new request field the
  website starts sending must be added to `genimg_schemas.ts` first**, or it will 400. Worth
  remembering when `/imagegen` next grows an option.
- **The lockfile moved `@x402/core` and `@x402/evm` 2.20.0 → 2.24.0.** Not caused by zod:
  `package.json` already declared `^2.23.0` while the lockfile pinned 2.20.0, below its own floor,
  so any `npm install` resolves it. The full suite passes, but the tests mock the facilitator, so
  on-chain verify semantics are unexercised — worth isolating in its own commit.

### Deploy the website before the function

The frontend reads `result.data?.[0]?.url ?? result.image_url` (and the same for
`x_nft.token_id` / `metadata_url`) — about three lines. Those fallbacks are **about deployment,
not commits**: the PR merges atomically, but the website and the function deploy separately, and
`/imagegen` is a paid user-facing path.

|             | old frontend | new frontend, no fallback | new frontend, with fallback |
| ----------- | ------------ | ------------------------- | --------------------------- |
| old backend | ✅           | ❌                        | ✅                          |
| new backend | ❌           | ✅                        | ✅                          |

Only the fallback column is safe in both directions, and it is safe only if the **website goes
first** — deploying the function first leaves the old, non-tolerant frontend against the new
shape. (An earlier draft of this section said function-first, which contradicted the fallbacks
it was justifying.)

**Optional follow-up:** delete those fallbacks once the function deploy is confirmed live.

---

## 8. Client migration

### The app

- `website/hooks/useX402ImageGeneration.ts` — types the response as `X402GenImgResponse`
- `website/components/ImageGenerator.tsx:294-336` — reads `result.tokenId`, `result.image_url`,
  `result.metadata_url`, and `result.tokenId` again in the analytics call

`npm run typecheck` in `website/` finds every call site once the type changes. It must also handle
`x_nft.status === "mint_failed"`, where there is an image but **no token id** — today's code would
call `BigInt(undefined)`.

### Two public code samples, both already wrong today

These teach third parties how to call the endpoint, and neither was in the original plan:

- **`website/pages/x402/buyers/+Page.tsx:116-117`** prints `result.image_url` and
  `result.transaction_hash`. **`transaction_hash` has never existed** — it is the phantom field
  from the old hand-written spec, which propagated from the spec into the public guide. PR 1
  removed it from the spec; PR 2 removes it here.
- **`website/blog/x402_facilitator_imagegen.mdx:207`** prints `result.imageUrl` — camelCase,
  where the endpoint returns `image_url`. Wrong independently, and today.

Both are factual corrections to existing published samples, not new content, so they do not need
the `blog-planner` flow.

### The buyers page renders the live spec

Directly beneath that code sample sits:

```tsx
<SpecParamTable
  specUrl={IMAGEGEN_SPEC_URL}
  schemaName="ImageGenerationResponse"
  caption="Response body"
/>
```

`SpecParamTable` fetches the **deployed** `openapi.json` at runtime and renders
`components.schemas.ImageGenerationResponse`. Three consequences:

- The table updates on **function deploy, with no website deploy at all** — so between deploys the
  page would show the `data[]`/`x_nft` table above a sample still saying `result.image_url`. The
  sample fix belongs in this PR, not a later one.
- **The schema name `ImageGenerationResponse` is load-bearing** and must not be renamed. PR 1
  already matches it.
- **The `.describe()` text in `genimg_schemas.ts` is user-facing website copy**, not internal
  comment. Write the envelope's descriptions accordingly.

No component change is needed: `ParamTable`'s `nestedProperties()` unwraps `schema.items` and
nested objects, and `typeLabel()` renders `object[]`, so `data: [{…}]` and `x_nft: {…}` render
correctly. `pages/agent-onboarding` also uses `SpecParamTable`, but only against the LLM spec —
unaffected.

External consumers may exist via x402scan discovery. The `??` fallbacks cover the deploy window;
beyond that, the old shape is gone, which is what the regenerated spec will say.

---

## 9. Test additions

Already in place from PR 1 (241 tests green):

- ✅ OpenAI-shaped request (`{ model, prompt, size, n: 1, response_format: "url" }`) → 200
- ✅ `n: 2` → 400 with `param: "n"`
- ✅ `response_format: "b64_json"` → 400
- ✅ Unadvertised `model` → 400 with `param: "model"`
- ✅ Unknown field (`quality: "hd"`) on a **paid** request → 400 naming the field, and the
  facilitator never contacted (`fetch` spy)
- ✅ Unknown field on an **unpaid** request → **402** with `X-Payment`, not 400 (§5)
- ✅ Non-boolean `isListed` → 400; `x_nft.listed` honoured as an alias
- ✅ Generated OpenAPI deep-equals the committed `openapi.genimg.json` (drift-checked by
  tampering with the committed file and confirming the test fails)
- ✅ Existing OPTIONS/CORS test unchanged — the preflight header list survived the move of
  `CORS_HEADERS` into `utils.ts`
- ✅ Error bodies parse as `{ error: { message, type, code, param? } }`

Still to add in PR 2:

- ⬜ Success response is a valid envelope with `data[0].url` present, and echoes `model`
- ⬜ Mint failure → **200** with `x_nft.status: "mint_failed"`, a usable `data[0].url`, **and
  `settlePayment` not called** (spy assertion)
- ⬜ Spec declares `x-service-type: "images/v1"` and an `x-interop-floor`

Unchanged and expected to stay green: the multi-network 402 tests, token-ID extraction,
pre-flight checks, and the settlement-flow test.

---

## 10. Explicitly deferred

**An `images/v1` checker UI.** `llm/v1` has `AgentSelector.tsx` / `AgentChecker.tsx` because the
website really does let a user swap in a third-party agent. There is no image equivalent and none
is planned. The contract is published for third parties and for x402scan, not consumed by our own
UI; §1 explains why the Zod golden test carries the weight the checker would have.

**Converting `openapi.llm.json` to the Zod generator.** Natural follow-up, not this PR.

**Edit mode → `/v1/images/edits`.** The standard uses `multipart/form-data` on a separate path.
Base64-in-JSON stays as a documented vendor extension. Building multipart handling in a Scaleway
function to chase a spec no caller has asked for is a bad trade. Revisit if an actual agent
requests it.

**`b64_json` support.** Large bodies through a paid function for no benefit — the images already
sit at stable URLs. Reject explicitly rather than silently ignoring.

**`n > 1`.** Would need N mints, N metadata uploads, and per-image pricing. Reject cleanly.

**ionos as a selectable `model`.** Blocked on edit-mode support or an explicit rejection (§2).

**Changing the payment amount, scheme, or network negotiation.** Out of scope entirely.

---

## 11. Effort

PR 1, as actually shipped:

| Item                                                       |                                         |
| ---------------------------------------------------------- | --------------------------------------- |
| Error helpers + shared `CORS_HEADERS`, minus ad-hoc bodies | `genimg` −42, `sc_llm_x402` −33         |
| 402/validation reorder                                     | folded in, no new logic                 |
| Zod schemas, replacing hand-written request validation     | `genimg_x402_token.ts` +49/−32          |
| Generator + golden test + regenerated spec                 | new plumbing, ~150 lines, mostly copied |
| Tests                                                      | +132/−26, 233 → 241                     |

PR 2, still to come:

| Item                                                          |                                     |
| ------------------------------------------------------------- | ----------------------------------- |
| Envelope + `x_nft` restructure, incl. response schema rewrite | ~40 lines, mechanical               |
| Mint-failure branch                                           | small, but the one behaviour change |
| `images/v1` keys, README section, frontend read sites         | small, spread thin                  |

Handler line count came out smaller, as predicted. PR 1 took about a day including the two
detours over the zod dependency; PR 2 should be less, since the shape is already written down.

The gain isn't size. It's that "standard response" and "our chain extension" stop being
interleaved in one flat object, that request validation stops being nine `if` blocks and starts
rejecting what it cannot honour, and that the spec an agent reads becomes a contract a third party
could implement — generated from the same schemas the handler validates against, so it cannot
drift.
