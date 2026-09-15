# Blog Post Plan: My static site got a tool loop — and maybe an agent

_Revision 2 — incorporates the AUTHOR comments on revision 1. The centre of gravity moved: §2
roughly doubles and carries the payloads, §3–§5 shrink to about a third of what they were, and
Bundestakt replaces analytics as the running example._

---

## Target Audience

**Primary: developers who already use a chat API and have never implemented tool calling.**
Code snippets, real payloads, no over-explaining of basics — but the subject is plain web
development, not chain.

- **They already know:** how to POST a `messages[]` array to Mistral/OpenAI/Anthropic and read
  `choices[0].message.content`. They know what a system prompt is. React, `fetch`, JSON.
- **They do NOT know:** that the model never executes anything; that "tool calling" is a
  request/response protocol over the same `messages[]` array they already send; that the loop
  is theirs to write; that a static site is a perfectly good place to run all of it.
- **Deliberately not the audience:** people who want an x402/payments post. Payment appears
  only where it explains a constraint (a hop costs money; one tool pops a wallet prompt).
  No EIP-3009, no facilitator, no batch settlement — linked once, not re-explained.

## Core Thesis

**A chat model never calls a tool. It asks for one, and my code — shipped as a static site with
no application server — answers by running the tool and putting the result back into the same
message array.** Writing that loop out in full is most of what there is to know, and it is
small enough that the honest question at the end is not "how do I build an agent" but "how much
of this did I actually need".

Why the reader should care: seeing one complete turn, payload by payload, makes the whole
category legible — including MCP, which is a transport for this same exchange rather than a
different mechanism.

## Voice

Maker / DIY / KISS. "Here is what I wanted, here is what I built, here is what surprised me" —
never "here is what I will teach you". No confident claims about best practice; the post
reports one working implementation. Where something was got wrong, say so in the same sentence
as the thing, not as a lesson-shaped aside.

## Outline

### 1. I wanted the assistant to know more things (~250 words)

The want, concretely: my [chat assistant](/assistent) could talk, and that was all it could do.
Two things I actually wanted from it —

- **Talk to [Bundestakt](https://www.bundestakt.de):** a free, CC BY API with summaries of
  Bundestag plenary sessions and fact-checked claims from the debates. Asking "what happened in
  the session on the 9th" should get an answer from the real record, not from whatever the model
  half-remembers.
- **Generate an image without leaving the chat:** the image generator already existed on its own
  page; describing a picture mid-conversation and getting it should not mean going somewhere
  else.

Both are the same problem: the model needs to reach something outside itself, mid-answer.

The thing that made this look impossible for a while: the site is statically built (Vike, built
to files, served from GitHub Pages) plus a couple of serverless functions. There is no
application server sitting behind the chat to run anything. And the LLM endpoint deliberately
will not help — it forwards `tools` to the model and hands back the model's request untouched,
never executing one. That is written into its published OpenAPI description, because a paid
public endpoint that fetches URLs on behalf of anonymous callers is a different and much
riskier thing to be running.
AUTHOR: Impossible is a strong word. I think that this is the thing that I was unsure about. I only knew langchain / langgraph in python. And there tool calls and model calls are very similiar and it feels as if they needed to run on the same server. 

So the loop runs in the browser. That turned out to be fine, and §2 is what it looks like.

### 2. One turn, payload by payload (~900 words — the heart of the post)

The question this section answers: what is actually connecting Mistral, my React code, and
Bundestakt. Running example: **"What did the Bundestag debate on 9 September?"**

Structured as four moves, each with its payload. The through-line is that **it is one array that
keeps growing** — so the snippets should read as four stages of the same `messages[]`, not four
unrelated blobs.

1. **Send — the same request, plus `tools`.**
   A `curl` against the real endpoint, so the wire format stands on its own with no framework in
   it. Shows `messages[]` and a one-entry `tools[]` — name, description, JSON Schema for the
   arguments. The point to make beside it: the description is prompt text. The model reads it
   and nothing else about the tool, so the usage rules go there ("call without a slug first to
   find the session, then again with its slug for the detail").

2. **The model asks.**
   The response JSON: `finish_reason: "tool_calls"`, `message.content: null`, and
   `message.tool_calls[]` with an `id`, the function `name`, and `arguments`. Two things worth
   pointing at: this is a *request*, nothing has happened yet; and `arguments` is a **JSON
   string**, not an object, which can also be malformed — so the parse must not throw.

3. **My code runs it.**
   TypeScript, and the step with no model in it at all. The dispatch by name to a runner, then
   the actual Bundestakt call: a plain `fetch` to `https://www.bundestakt.de/api/v1/sitzungen`
   from the browser (open CORS, no key — which is exactly why a browser-side loop works here at
   all), then the projection step. Show the projection honestly: the raw response is far too
   big to hand back, so a pure `selectSitzungen` cuts it down to the handful of fields an answer
   needs. Sub-point in one or two sentences, not a section: the result rides along in every
   later request of the turn, so a fat result is paid for repeatedly.

4. **Send again.**
   The grown array: the assistant's own tool-call turn pushed back verbatim, then
   `{ role: "tool", tool_call_id, content: "<the result, stringified>" }`. Same endpoint, same
   shape as move 1. This time the model answers in prose — `finish_reason: "stop"` — and the
   turn is done. For the slug flow it instead asks again, with the slug this time, and the
   array grows by two more.

Then the plain statement the section exists for: there is no callback, no webhook, no socket
held open. The whole connection between Mistral and React is that the array grows and gets sent
again, and `tool_call_id` is the only thread tying a result back to its request.

Closing the section with the real loop from
[`website/utils/toolLoop.ts`](https://github.com/fretchen/fretchen.github.io/blob/main/website/utils/toolLoop.ts)
— comments stripped, ~30 lines — so the reader sees that the four moves really are a `for`
loop with a `break`. Keep `payAndSend` in it rather than stubbing it out, so the hop bound and
its cost are visible where they live. One sentence on why the loop is bounded at four hops.

Aside worth exactly one sentence, at the end: `tools: []` is not "no tools" — an empty array is
truthy and ships as `tools: []`; pass `undefined`.

### 3. Three tools, two shapes (~250 words)

Short, and about the tools rather than about the file layout. What is on offer now:
`get_sitzungen`, `search_claims`, `get_analytics`, `generate_image`. They fall into two shapes,
and the difference is the interesting part:

- **Read something and shrink it.** A fetch, then a pure function that projects the response
  down to what an answer needs. Bundestakt and analytics. Boring in the good way.
- **Ask the user first, then act.** `generate_image` costs 7 cents of real money, so the model
  requesting it does not mean it happens: the runner puts a confirmation card on screen with
  the prompt and the price, and the turn simply waits — mid-loop, mid-`await` — until the user
  confirms, edits the prompt, or cancels. Whatever they decide comes back to the model as a
  status like `user_declined`, and the model writes the sentence about it.

That second shape is the one worth showing a reader: a tool call is not a commitment, and
there is a natural place to put a human inside the loop.

One line on the convention that keeps this tidy — tool modules hold no React, so the fetch-plus-
project half of each tool is importable from anything, not just this page — and no more than a
line. _(Everything about closures vs. a shared `ctx` object, and the test setup, is cut.)_

### 4. What running it actually taught me (~200 words)

Cut from three items to **one**, the one that changed the loop itself:

**A failing tool has to be taken off the table for the rest of the turn.** Image generation kept
failing, and the model kept asking for it again, quite reasonably — it had no way to know the
failure was permanent. Three wallet prompts, three payments, no answer, because no hop ever
produced text. The fix is one line in the loop: a tool that failed is not offered on the next
hop. The wrinkle is that some failures are answers — an unrecognised session slug should be
retried with a corrected one — so a tool can mark its own result as worth another go.
AUTHOR: For me this is more a "funny footnote". Where could this go ?

_(Cut: the token-budget arithmetic, which is now one sentence in §2.3; the `get_date`
counter-example; the `Object.create(null)` dispatch note.)_

### 5. Is this an agent? And do I need MCP? (~300 words)

Short, genuinely open, no verdict.

It chooses whether to act, which tool, and with what arguments; it reads a result and decides
what comes next; the Bundestakt flow chains list → detail → answer across three hops. By most
working definitions, that is an agent. It also forgets everything at the end of the turn, has no
plan the code owns, and stops after four hops.

And it is about forty lines. Which is the uncomfortable bit: the vocabulary around this —
agents, orchestration, MCP — sounds like it describes something much larger than what I wrote.
MCP in particular is worth one honest paragraph: it standardises how a tool *describes itself*
and how it is reached, so that tools and clients are written by different people. The exchange
in §2 is unchanged by it. For four tools I wrote myself, it would have bought me nothing yet.

Where the real line sits, as far as I can tell: the [growth agent](/blog/…) on this same site is
the other shape — LangGraph, a cron container, state in S3, a human approval queue — because it
needs durable state and minutes of runtime. Between "forty lines in a browser" and that, I do
not have a principled boundary, only a resource one.

### 6. Closing (~120 words)

What it cost: one loop file, four small tool modules. What I would do differently: write the
loop first, because every decision that mattered turned out to live in it. A link to
`/assistent` — one line, not a pitch.

## Interactive Elements

**A sequence diagram of one turn, and nothing else.** Participants: the user, the browser, the
paid LLM endpoint (→ Mistral), and Bundestakt. It should show the two round trips and the fact
that Bundestakt is called by the browser, never by the model. Static, not interactive.

Implementation: `components/blog/SequenceDiagram.tsx` — typed `participants` and `steps`, not a
mermaid source string. `MermaidDiagram` is deprecated and this post does not use it; the
worked examples are `pages/x402/+Page.tsx` and `pages/x402/sellers/+Page.tsx`.

Sketch of the steps (linear, messages and notes interleaved as the component expects):

| from → to               | label                                          |
| ----------------------- | ---------------------------------------------- |
| browser → endpoint      | messages + tools                               |
| endpoint --> browser    | tool_calls: get_sitzungen                      |
| _note_ browser          | nothing has happened yet                       |
| browser → bundestakt    | GET /sitzungen                                 |
| bundestakt --> browser  | sessions (projected down)                      |
| browser → endpoint      | same array + role:"tool" result                |
| endpoint --> browser    | the answer, in prose                           |

Whether to also draw the slug second round trip is a drafting call — it doubles the rows and
may be better left to the prose. No `territory` hue unless the post's `PageHeader` carries one;
blog posts do not, so the figure is grey.

No other components. Everything else is code fences.

## Tone & Style

First person, thinking out loud, maker register — `growth_agent_learnings.mdx` and
`x402_llm_open_agent.mdx`, not a tutorial. Failures reported as failures, in plain words.

Per the repo prose rule: no concede-then-swing, no forward promises, no meta-announcements, no
withheld reveals. §1 says "the loop runs in the browser" where it arises rather than saving it.

Length target: **1800–2000 words**, of which §2 is roughly half. Six or seven code blocks (four
payload stages, the loop, the confirm-shape snippet, possibly the tool definition on its own),
one diagram.

## Sources & Research

Primary, all in this repo — the post writes up PRs #666–#674 (`9cefc5546` … `55b3fd60c`):

- `website/utils/toolLoop.ts` — the loop, the hop bound, the withdrawal rule.
- `website/components/AssistantChat.tsx` — the registry, the runners, per-turn `convo` array.
- `website/tools/bundestakt.ts` — the running example: fetchers, projection, the slug flow.
- `website/tools/generateImage.ts` — the confirm-then-act shape and its status vocabulary.
- `scw_js/llm_schemas.ts` — the published "this endpoint never calls a tool itself" contract.
- External: Mistral's function-calling docs and the OpenAI function-calling spec, for the wire
  format. [TODO: confirm exact URLs at draft time.]
- [Bundestakt](https://www.bundestakt.de) — licence (CC BY 4.0) must be named in the post, as
  the tool itself is obliged to cite it.

**Still to do before drafting:** capture the real payloads for §2 from an actual turn (curl
against the endpoint, or the browser network tab) rather than hand-writing plausible JSON.

## Consistency Notes

**Related posts:**

- [`x402_llm_open_agent.mdx`](x402_llm_open_agent.mdx) (tokenID 200, 2026-08-02) — same
  assistant, payment layer. One link in §1, no re-explaining. Its diagram is _not_ the model to
  follow — it predates `SequenceDiagram` and still carries a mermaid source string.
- [`growth_agent_learnings.mdx`](growth_agent_learnings.mdx) (tokenID 198, 2026-06-04) — the
  other agent on this site, and the contrast in §5. Same maker register.
- [`threat-model-blockchain-project.mdx`](threat-model-blockchain-project.mdx) — precedent for
  writing up internal engineering work in first person.

**Terminology, unchanged:** "hop" (one paid completion within a turn), "tool loop", "runner",
"tool result". Avoid "orchestrator", "agentic", "chain of thought". Say "the model", not "the
LLM" or "the AI". The page is `/assistent`; "assistant" in prose.

**Frontmatter:**

```yaml
title: "My static site got a tool loop — and maybe an agent"
publishing_date: "2026-09-xx"
category: "ai"
secondaryCategory: "webdev"
description: "<one sentence>"
tokenID: 203 # next after 202 (quantum_cpr); mint before publishing
```

**Where it fits:** third in a loose sequence about the same assistant — 16 (first version),
the x402 post (payments), this one (what it can do, and how). First post here about LLM
mechanics rather than payments or pipelines.
