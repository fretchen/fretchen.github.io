# Image Generation in the Chat — KISS Implementation Plan

**Goal:** let the assistant call `imagegen-agent.fretchen.eu` as a tool, paid per image from the user's own wallet, with explicit confirmation.

**Scope:** `generate` mode only. No `edit`, no MCP, no server-side agent loop.

**Status:** written before the `images/v1` migration. The backend half (§1) is unaffected and still
correct as written; §0, §2, §5 and §6 needed corrections, marked ⚠️ below. Two scope decisions were
added: the NFT is not surfaced in chat, and the image endpoint is addressed by URL rather than
hardcoded — see §0.1.

**Sequencing: two PRs.** The LLM request schema is non-strict, so a frontend sending `tools` to an
un-updated backend has them silently ignored (the loop simply never fires), and a backend gaining
optional `tools` cannot affect the old frontend. **Both deploy orders are safe** — unlike the genimg
envelope change, this needs no website-before-function care.

| PR               | Steps   | Why separate                                                                                                                                                                                                                      |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — backend**  | 1, 2, 3 | Additive and independently deployable; verifiable with one `curl`. Isolates the pricing-ceiling question (§1) in a diff small enough that it cannot be skimmed past — that is the only place this feature can quietly cost money. |
| **B — frontend** | 3–8     | All wiring and UI, no ceiling risk. Commits as review units inside.                                                                                                                                                               |

Steps 3–5 alone would ship nothing observable, so there is no third PR. PR B can be developed
against a **local** LLM backend (`npm run dev:llmx402`, port 8085), so A only needs _deploying_
before B deploys, not before B is written.

---

## 0. What already exists

Most of this is wiring, not new code:

| Piece               | Where                                                                                                                                 | Status                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Paid image executor | `website/hooks/useX402ImageGeneration.ts` — `generateImage(req) → { imageUrl, tokenId?, metadataUrl?, contract?, mintFailedReason? }` | ⚠️ reusable, **new field names**                               |
| Chat message loop   | `website/components/AssistantChat.tsx` — `sendMessage()`                                                                              | needs a loop around it                                         |
| Paid chat transport | `website/hooks/useX402Chat.ts` — `payAndSend(messages)`                                                                               | needs `tools` passthrough                                      |
| Image backend       | `scw_js/genimg_x402_token.ts`                                                                                                         | ⚠️ changed a lot (`images/v1` envelope), still tool-compatible |
| LLM backend         | `scw_js/sc_llm_x402.ts`                                                                                                               | needs `tools` support                                          |

Genuinely new: tool support as an `llm/v1` capability, a tool-call loop in the frontend, and a
confirmation card.

⚠️ **The executor's return shape changed.** `useX402ImageGeneration` no longer returns the raw
response — it returns the normalized `X402ImageResult` from `hooks/x402ImageResponse.ts`. That is
_more_ reusable than when this plan was written (the normalizer absorbs the envelope and the
deploy-window fallbacks), but two things follow: the field names are `imageUrl`/`tokenId`, and
**`tokenId` is optional** — a 200 with a failed mint returns an image and no token.

## 0.1 Two scope decisions added since

**The NFT is not surfaced in chat.** The mint still happens — `x-capabilities: ["nft-mint"]`
describes what the endpoint does, not a toggle, and there is no no-mint tier (see §8). This is a UI
decision only: chat shows the image, not the token id, gallery link, or explorer URL.

That is the same simplification as supporting other endpoints, not a separate one. Every token-id
line skipped is code that would otherwise need an `if (ourEndpoint)` guard the moment a
non-minting `images/v1` agent is pointed at. Doing both is strictly simpler than either alone.

**The image endpoint is addressed by URL, not hardcoded.** `useX402ImageGeneration` currently has
`X402_API_URL` as a module-level const (line 16), where `useX402Chat` takes its URL as a parameter.
Making it a parameter (step 3) costs almost nothing and means a second `images/v1` endpoint later is
configuration, not a rewrite — without building any bring-your-own UI now.

On other x402 image endpoints (e.g. x402scan listings): the published `images/v1` contract makes
this architecturally possible, but `x-service-type: "images/v1"` is our own and days old, so
realistically nothing else declares it yet. Some may be de-facto compatible without the tag.
Cheap to check — fetch each `/openapi.json`, probe an unpaid POST for the 402 shape — but do not
design for it until checked.

---

## 1. Backend — tools as an `llm/v1` capability (`sc_llm_x402.ts`)

Additive, no break for existing callers.

**Accept** two optional top-level keys, and only these:

```ts
tools?: Array<{
  type: "function";
  function: { name: string; description: string; parameters: object };
}>;
tool_choice?: "auto" | "none";
```

**Validate strictly**, consistent with existing `messages`/`model` handling. Reject with the OpenAI-shaped error body (`invalid_request_error`) on: `tools` not an array, missing `function.name`, `parameters` not an object. Cap at 8 tools and reject payloads over ~8 KB — a caller can otherwise inflate your input tokens for free.

**Accept `role: "tool"` messages** in `messages[]`: `{ role: "tool", tool_call_id, content }`. Extend the existing `validMessages` check.

**Pass through to Mistral**, and return `tool_calls` on the assistant message with `finish_reason: "tool_calls"`.

**Do NOT accept** MCP server URLs or any callback URL. Tool _definitions_ in, tool _calls_ out. Anything else turns a paid public endpoint into an outbound fetcher for unauthenticated payers.

### Pricing check (do this before shipping)

Tool definitions and tool results are input tokens. Re-verify the ceiling still bounds correctly
when input dominates output — a `tool_calls` response is a few dozen output tokens against a much
larger input. This is the one place the change can quietly cost you money, and it is why PR A
exists as its own PR.

✅ **Resolved.** `LLM_ESTIMATED_TOKENS_PER_MESSAGE` was raised from 2000 to 6000:

```
ceiling  = LLM_ESTIMATED_TOKENS_PER_MESSAGE (6000) × $1.50/M   = $0.009
             ^ priced entirely as OUTPUT tokens, the pricier rate
input rate                                        $0.50/M
break-even: 0.009 / 0.0000005                  ≈ 18,000 input tokens
```

At 2000 the break-even was ~6000 input tokens, which a tool-using conversation reaches: tool
definitions add fixed overhead on _every_ hop and `MAX_HOPS = 3` accumulates tool results. Past the
break-even the real usage-derived cost exceeds the signed ceiling and `getSettleAmount` caps it —
never a fund-safety issue for the payer (the voucher protects them), but a revenue leak.

Raising the ceiling costs plain-chat callers nothing: it is the _authorization_ bound the 402
advertises and `verifyPayment` checks, while settlement stays usage-derived. It only means a larger
per-message voucher. `tools` is separately capped at 8 definitions / 8 KB serialized, so a caller
cannot inflate our input tokens for free.

The ceiling remains per-message and does not scale with conversation length — a pre-existing
property that tools make easier to hit.

### OpenAPI (`openapi.llm.json`)

```json
"x-service-type": "llm/v1",
"x-capabilities": ["tools"]
```

Advertise as a **capability, not a requirement** — a plain-chat endpoint must stay conformant, or interchangeability is broken to add a feature.

⚠️ **This section originally specified `x-service-type: "llm/v1.1"`, contradicting the line above.**
`x-service-type` has no minor-version semantics anywhere: every consumer matches the whole string,
so `"llm/v1.1"` is read as a _different contract_, not as v1 plus a feature — which is exactly what
"capability, not a requirement" forbids. The version string stays `llm/v1`; `x-capabilities` is the
mechanism that carries additive features, as genimg already does with `nft-mint`.

---

## 2. Frontend — tool definition

Single source, e.g. `website/tools/generateImage.ts`:

```ts
export const generateImageTool = {
  type: "function",
  function: {
    name: "generate_image",
    description:
      "Generate an image from a text prompt. Costs $0.07 USDC and requires the " +
      "user to approve a wallet signature. Only call when the user has clearly " +
      "asked for an image.",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Detailed English image prompt" },
        size: { type: "string", enum: ["1024x1024", "1792x1024"] },
      },
      required: ["prompt"],
    },
  },
} as const;
```

⚠️ The description no longer mentions minting — see §0.1. The mint still happens; the model just
has no reason to talk about it, and mentioning it would be wrong the moment a non-minting endpoint
is used.

**Deliberately absent:**

- `network` — frontend fills from `useAutoNetwork`, not the model's business. ⚠️ Now
  **load-bearing, not just tidy**: the endpoint picks which networks its 402 offers from this field,
  and with no value it offers every _mainnet_ it accepts. An omitted `network` is how a testnet run
  pays real money. The executor must always send it.
- `model`, `n`, `response_format` — new standard fields on the endpoint; all have correct defaults
  and none is a model decision
- `payment` — never model-visible
- `isListed` — defaults `false`, exposed as a checkbox on the confirm card; a public listing is not a decision an LLM should make
- `mode: "edit"` / `referenceImage` — base64 in a tool argument would blow up context and input-token cost

⚠️ The request schema is now **strict** — unknown fields are rejected with a 400 naming the field.
The executor must send exactly the allowlisted keys and nothing else; a stray field is a hard
failure, not a silently ignored one.

Keep the price in the description. Cheapest way to stop the model volunteering images unprompted.

---

## 3. Frontend — the loop

Replace the single `payAndSend` call in `sendMessage()` with a bounded loop.

```ts
const MAX_HOPS = 3;

let convo = [
  { role: "system", content: systemPromptMessage },
  ...messages.map((m) => ({ role: m.role, content: m.content })),
  { role: "user", content: userMessage.trim() },
];

for (let hop = 0; hop < MAX_HOPS; hop++) {
  const data = await payAndSend(convo, [generateImageTool]);
  const choice = data.choices?.[0];
  const msg = choice?.message;

  if (choice?.finish_reason !== "tool_calls") {
    appendAssistant(msg?.content ?? noResponseMessage);
    break;
  }

  convo.push(msg);

  for (const call of msg.tool_calls) {
    const result = await runToolWithConfirmation(call); // §4
    convo.push({
      role: "tool",
      tool_call_id: call.id,
      content: JSON.stringify(result),
    });
  }
}
```

Two notes:

- `MAX_HOPS = 3` is the cost circuit-breaker, and it lives on the paying side. Each hop is a separately metered chat request.
- Wall-clock spent waiting on generation + mint must not count against any per-turn timeout budget.

---

## 4. Confirmation — the non-optional part

**Never auto-execute `generate_image`.** Free reads can fire straight from the loop; this one spends money and writes to a chain.

On a `generate_image` tool call, the loop **pauses** and renders a card in the message stream:

- the prompt **the model wrote** (editable — it will sometimes embellish)
- size selector, `isListed` checkbox (default off)
- **$0.07 USDC**, target network via `ChainBadge`
- a line stating an NFT will be minted to their address
- **Generate** / **Cancel**

Only on **Generate** call `generateImage(...)` from `useX402ImageGeneration`, which triggers the wallet signature.

### The two-signer gotcha

`useX402Chat` signs with an **ephemeral session key** (`privateKeyToAccount`) for batch settlement. `useX402ImageGeneration` uses the **real wagmi `walletClient`**.

One conversation, two signers, two schemes — and that is correct:

- chat → batch-settlement, silent, metered per turn
- image → `exact` / EIP-3009, one signature per image

The MetaMask popup you removed from chat **stays here**: it _is_ the consent mechanism for an irreversible paid action. Silent for cheap repeated calls, explicit for expensive ones.

⚠️ **The NFT must mint to the user's real wallet address, never the burner session key.** `useX402ImageGeneration` already uses `walletClient.account.address` — just make sure nothing in the chat path passes the session account down.

---

## 5. What goes back to the model

Compact JSON only:

```json
{ "status": "ok", "network": "eip155:10" }
```

⚠️ **No `token_id` either**, per §0.1 — the chat does not surface the NFT, so the model has nothing
to say about it and a non-minting endpoint would have none to give. The model writes a caption
around the fact that an image was produced, nothing more.

**No `image_url`, no base64.** The frontend renders the image from its own state; keeps input tokens
flat and stops the model inventing plausible-looking image URLs in later turns.

Failures go back as **tool results, not exceptions**, so the model can respond sensibly:

| `status`            | When                                                        |
| ------------------- | ----------------------------------------------------------- |
| `user_declined`     | Cancel clicked, or wallet signature rejected                |
| `insufficient_usdc` | Balance/allowance too low                                   |
| `wrong_network`     | Chain switch refused                                        |
| `generation_failed` | Provider error, nothing charged                             |
| `ok`                | Image produced (whether or not a mint happened — see below) |

⚠️ **The old `mint_failed_after_payment` row was inverted and is gone.** It read "payment settled,
mint didn't". The opposite is now true: on a mint failure the endpoint returns **200 with the image
and settles nothing** — no `Payment-Response` header, no charge. The user has their image and was
not billed.

Since the chat does not surface the NFT at all (§0.1), a mint failure needs **no distinct status**:
the caller got an image, which is what the tool promised, so it is plainly `ok`. The frontend can
still read `mintFailedReason` off the executor result if it ever wants to say something; the model
does not need to know. This removes the plan's most delicate failure mode outright — there is no
longer any way for the model to congratulate someone on a non-existent NFT, because it is never
told about NFTs.

---

## 6. Rendering

Image results live in **component state keyed by `tool_call_id`**, not in the markdown the model
returns. Render the image inline where the tool call happened.

⚠️ **No `token_id`, no explorer link, no `nftCard`** — per §0.1 the chat surfaces the image only. That
drops the branch that would otherwise be needed for an endpoint that does not mint, and it is why
this section got simpler rather than more complex. `metadataUrl` and `tokenId` remain available on
the executor result if a later iteration wants them.

---

## 7. Order of work

**PR A — backend** (shippable and deployable alone; the endpoint gains tool support and stays fully
backward-compatible even if the frontend never lands):

1. `tools` + `role: "tool"` support in `sc_llm_x402.ts` + tests
2. Re-verify the pricing ceiling under input-heavy load — see §1, this is the money risk
3. OpenAPI → `x-capabilities: ["tools"]`, `x-service-type` unchanged at `llm/v1`

**PR B — frontend** (develop against `npm run dev:llmx402` on port 8085; needs A _deployed_ only
before B deploys):

4. ⚠️ **New:** `X402_API_URL` → a parameter in `useX402ImageGeneration` (§0.1). Small, independent,
   and the precondition for ever pointing at a second endpoint.
5. `tools` passthrough in `useX402Chat.payAndSend`
6. Tool definition file
7. Loop in `AssistantChat.sendMessage`
8. Confirm card + executor wiring
9. Result rendering — image only

---

## 8. Explicitly out of scope

- **MCP server for image generation.** An MCP server can't sign with the user's MetaMask. That's a different product — agents bringing their own wallet — and it's blocked on a no-mint generation tier anyway, per the decision that external agents generate but don't mint.
- **Server-side tool execution in `llmx402`.** Breaks the `llm/v1` interop contract and makes you front the mint cost for unauthenticated payers.
- **Edit mode**, streaming, parallel tool calls, LangGraph.
