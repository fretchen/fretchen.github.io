---
description: "Use when: adding, changing or reviewing a tool for the /assistent chat — anything touching website/tools/*.ts, TOOL_REGISTRY or toolRunners in AssistantChat.tsx, the tool loop and its hops, or the MAX_TOOLS / MAX_TOOLS_BYTES caps in scw_js/llm_schemas.ts. Carries the two-part tool contract, why tool modules stay React-free, and the three constraints that bite silently."
---

# Chat tools in this repo

Load this **before** adding a tool to `/assistent` or changing how the loop runs them. The
constraints below are cost- and correctness-relevant and none of them announce themselves: an
over-budget `tools` array is a 400 the user sees as a broken chat, and an empty array is sent as
`tools: []` rather than omitted.

## Where the loop lives — and why that is not an accident

The tool loop runs **in the browser**, in `website/components/AssistantChat.tsx`. The paid endpoint
`scw_js/sc_llm_x402.ts` forwards `tools` to the model and hands back `tool_calls`; it never executes
one. That is not an implementation detail but a **published contract** — the deployed
`openapi.llm.json` states _"this endpoint never calls a tool on your behalf, and accepts no callback
or MCP server URL"_, and `/agent-onboarding` renders it.

So: do not add server-side tool execution to the LLM endpoint. A paid public endpoint that fetches
on behalf of unauthenticated payers is a different, much riskier product.

## Adding a tool is two things, deliberately kept apart

### 1. Metadata — `TOOL_REGISTRY` in `AssistantChat.tsx`

What exists, its `label` for the ToolSelector, its `ownerScope` (`null` = anyone), and whether its
answers must name a `source`. Every field is required, so a tool cannot arrive ungated or unlabelled
without a type error.

The metadata sits **beside** the tool object rather than on it: these objects go on the wire as
`tools:`, so extra keys would be sent upstream.

### 2. Execution — a runner in `toolRunners`, same file

A runner is `(args) => Promise<{ result, imageUrl?, recoverable? }>`, a **closure over exactly what
its own tool needs** — because those needs differ sharply:

| Tool shape               | Closes over                          | Example          |
| ------------------------ | ------------------------------------ | ---------------- |
| Networked, authenticated | auth callback, query cache           | `get_analytics`  |
| Confirmation-gated       | wallet, network switch, confirm card | `generate_image` |

(There is no purely local row on purpose — see _When a tool is the wrong shape_ below.)

There is deliberately **no shared `ctx` object**. It would have to carry the union of every tool's
needs and grow with each new one; a closure carries only its own.

`test/AssistantChat.test.tsx` iterates `TOOL_REGISTRY` and drives every entry through the real
dispatch, so a tool added without a runner fails the suite rather than at runtime.

## Tool modules stay React-free

`website/tools/*.ts` hold a definition plus the logic. No hooks, no React imports — that is what
keeps them importable from a non-browser caller (a future MCP server, a script). Two shapes so far,
and a tool is one or the other:

**Fetch-then-project** (`bundestakt.ts`, `analytics.ts`): `fetchX` (thin, may throw) plus `selectX`
(pure, operates on already-parsed JSON).

**Confirm-then-act** (`generateImage.ts`, and `social_media_publication` when it lands): the module
owns the whole sequence and takes what only exists in React as **named effects** —
`runImageTool(args, { confirm, ensureNetwork, generate, onPhase })`. This is not the shared `ctx`
rejected above: the effects are cut for one tool and named after what they do, and another
confirm-gated tool will want different ones. What this buys is that the sequence — cancel, network
refusal, classification, ordering — is testable with `vi.fn()`s instead of a render plus a card
click.

The component keeps only the wiring, and clears the confirm card once in a `finally` rather than in
every branch.

Shared failure handling lives in `tools/failure.ts`: `describeFailure` (single-line, truncated at
200 chars) and `fetchFailed`. Use them rather than `err.message` — a tool result is input tokens on
**every** later hop, so an unbounded wallet error is a recurring charge.

Return a result, never throw: every tool function resolves to a `{ status }` object so the loop
keeps running and the model can explain the failure, instead of the whole chat message crashing.

**A failing tool is withdrawn for the rest of the turn** — left on offer, a model just retries it
until the hops run out, which really happened: three wallet prompts, three payments, no answer. So
if one of your non-`ok` statuses is an _answer_ rather than a malfunction (bundestakt's `not_found`
for an unrecognized slug, where the list-then-detail flow depends on retrying with a corrected
one), the runner must say so: `return { result, recoverable: true }`. Like `imageUrl`, `recoverable`
sits beside the result and never reaches the model. The loop knows no tool's status vocabulary —
if you don't set it, any non-`ok` status withdraws the tool.

## Three constraints that bite silently

**Two backend caps**, both in `scw_js/llm_schemas.ts`: `MAX_TOOLS` (8) and `MAX_TOOLS_BYTES` (8192).
They are **ours**, not the model's — cost guards, because tool definitions are input tokens charged
on _every hop_ of a turn. Exceeding either is a clean 400 from `sc_llm_x402.ts`, but the user just
sees a failed message. Measure before adding: at ~730 bytes per tool, eight tools is ~5.8 KB.

**Project tool results hard.** They are input tokens on every later hop too, and the per-message
charge is capped at `USDC_MAX_PRICE_PER_MESSAGE` (~$0.009) with the **operator** absorbing anything
above it. `selectClaims` drops a 2 KB sources array per item for exactly this reason; measure the
serialized result in a test rather than guessing.

**`tools: []` is not "no tools".** `[]` is truthy and `useX402Chat` spreads `tools` in on
truthiness, so an empty array is sent as `tools: []`. Pass `undefined` so the key is absent
entirely. This has been got wrong once and is covered by a test.

## Transparency and gating

- **`ownerScope`** filters what is offered. An owner-only tool is withheld from visitors entirely,
  which avoids burning a hop on a guaranteed 401 _and_ keeps its description away from the upstream
  model for people it can never serve. Scopes live in `website/utils/getChain.ts` (`OWNER_SCOPES`)
  and mirror each deploy's `OWNER_ETH_ADDRESS`.
- **`source`** adds a citation line under the answer, set only on a successful call. For Bundestakt
  it is a CC BY licence obligation; for analytics it is honesty about a looked-up figure.
- **The ToolSelector** lets the user switch tools off; the stored value is the set of _disabled_
  names, so a tool added later is on by default.

## When a tool is the wrong shape

**What the client already knows belongs in the system prompt, not in a tool.** The current date is
the worked example (`website/utils/dateContext.ts`): a `get_date` tool would only fire if the model
knew that it did not know the date — it does not, it believes its training cutoff is today, which
is the whole failure. The date is also needed _before_ the first tool call, since it ends up inside
tool arguments (`get_sitzungen` filters on ISO `von`/`bis`, and a guessed year returns an empty list
rather than an error). In the prompt it costs no hop and no tool budget.

The loop is reactive and bounded by `MAX_HOPS` (4), and every hop is a separately paid completion.
Work that needs durable state across runs, minutes of runtime, or a plan the code controls rather
than the model belongs in `growth-agent/` (LangGraph, cron, S3 state) — not in a chat tool.
