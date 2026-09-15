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

A runner is `(args) => Promise<{ result, imageUrl? }>`, a **closure over exactly what its own tool
needs** — because those needs differ sharply:

| Tool shape               | Closes over                          | Example          |
| ------------------------ | ------------------------------------ | ---------------- |
| Pure/local               | nothing                              | a date tool      |
| Networked, authenticated | auth callback, query cache           | `get_analytics`  |
| Confirmation-gated       | wallet, network switch, confirm card | `generate_image` |

There is deliberately **no shared `ctx` object**. It would have to carry the union of every tool's
needs and grow with each new one; a closure carries only its own.

`test/AssistantChat.test.tsx` iterates `TOOL_REGISTRY` and drives every entry through the real
dispatch, so a tool added without a runner fails the suite rather than at runtime.

## Tool modules stay React-free

`website/tools/*.ts` hold a definition plus **pure pieces** — typically `fetchX` (thin, may throw)
and `selectX` (pure, operates on already-parsed JSON). No hooks, no React imports. That is what
keeps them importable from a non-browser caller (a future MCP server, a script), and it is why the
runners live in the component instead.

`tools/generateImage.ts` is definition-only on purpose: its runner is inescapably wallet- and
UI-bound, and pressing it into a module would mean threading wallet dependencies back in.

Return a result, never throw: every tool function resolves to a `{ status }` object so the loop
keeps running and the model can explain the failure, instead of the whole chat message crashing.

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

The loop is reactive and bounded by `MAX_HOPS` (4), and every hop is a separately paid completion.
Work that needs durable state across runs, minutes of runtime, or a plan the code controls rather
than the model belongs in `growth-agent/` (LangGraph, cron, S3 state) — not in a chat tool.
