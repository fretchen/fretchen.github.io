# Building a KISS Deep Researcher

Implementation guide for turning the existing tool set (`search_web`, `fetch_url`, `get_page`) into an agent that deepens its research instead of reading once and answering.

## 1. Design Principle: Strategy in the Prompt, Not in a Tool

Do **not** build a monolithic `deep_research(query)` tool that internally searches, reads, and reflects. Keep the loop in the conversation.

| Aspect | Tool | Skill (prompt module) |
|---|---|
| Responsibility | Stateless capability, one action per call | Behavior across many tool calls |
| Examples | `search_web`, `fetch_url`, `get_page`, `add_note` | The research loop discipline |
| Changes by | Writing code | Editing text |

Reasons against a monolithic meta-tool:

1. **Payment control.** The visitor pays per Brave call via x402. Separate tool calls keep every charge visible; a black-box tool could fire 15 paid queries invisibly.
2. **Transparency.** Between hops, the chat shows what is happening ("searching X because Y is missing") — most of the UX value of deep research.
3. **Debuggability.** Loop strategy in a prompt is edited as text; loop strategy in a tool is engine code for a promptable problem.

## 2. State of the Art, Distilled

Mature deep research systems (Open Deep Research, Tongyi, Skywork, Kimi-Researcher) converge on one core pattern:

**Plan → Search → Read → Reflect → Iterate → Synthesize**

Two refinements matter, one of which is deferred here:

- **Explicit reflection as its own step.** After each search/read round, evaluate: is this sufficient? Do sources conflict? What is missing? Next queries are derived from that reflection — not from "search again".
- **Context isolation via sub-agents.** A supervisor spawns sub-agents with their own threads so tool results don't re-bill as input tokens on every hop. *Deferred:* only needed when a research run regularly exceeds the context window. The existing result caps (10 000 chars, 5 results, 900 chars/result) plus condensed notes keep 10–15 hops comfortably in a large context window.

RL-trained agents (Search-o1, Kimi-Researcher, etc.) are irrelevant here — this build is prompt-orchestrated.

## 3. Architecture

```text
Runner (browser, in-memory)
├── messages[]            ← the research loop lives here
├── researchNotes[]       ← JS array, the agent's working memory
├── budget counter        ← tool-call limit for the run
└── tools: search_web, fetch_url, get_page (existing)
           add_note / get_notes / reset_notes (new, ~50 lines)
```

- **No server.** Notes live in the runner's memory, in the visitor's browser. They die with the tab — by design. This preserves the existing privacy story (visitor pays, visitor's browser fetches, server stores nothing about research sessions).
- **No persistence needed.** Notes are working memory for one research loop, not a knowledge base. Their value ends at synthesis.
- **Optional:** `sessionStorage` (not `localStorage`) if surviving page reloads during a long run matters. `sessionStorage` is per-tab and cleared on tab close; `localStorage` would persist research traces across sessions and browsers — unnecessary and undesirable.

## 4. Components to Build

### 4.1 The Research Skill (prompt module, no code)

```markdown
# Skill: research

Trigger this when a question needs more than one search (research-shaped).

1. PLAN: List 3–5 sub-questions. Record each with add_note(status="open").
2. LOOP per sub-question:
   a. search_web with a concrete search phrase (not a question).
   b. fetch_url on the 1–2 most promising results.
   c. add_note: { claim, source_url, confidence, status: answered | blocked }
   d. REFLECT: Is this sufficient? Do sources contradict each other?
      If not sufficient → a reformulated query, not the same one again.
3. BUDGET: Max N tool calls per run. At N−2, open no new sub-questions;
   fill gaps only.
4. SYNTHESIZE: Answer only from notes. Every claim carries its source_url.
   List open questions explicitly. Never cite anything not in the notes.
```

### 4.2 The Notes Tool (only new code, ~50 lines)

A plain JS object with a `notes[]` array and three handlers, following the existing tool-module conventions (React-free, dependencies injected as parameters, testable without a wallet):

```typescript
interface Note {
  claim: string;        // one sentence, condensed
  source_url: string;  // required for citation discipline
  confidence?: string; // high | medium | low
  status: "open" | "answered" | "blocked";
  sub_question?: string;
}

// Handlers, all synchronous, no fetch:
//   add_note(note)      → { status: "ok", total }
//   get_notes()         → current notes, capped for token cost
//   reset_notes()       → clear on new run / component unmount
```

Cap what `get_notes` returns (same reasoning as the existing `MAX_CHARS_PER_RESULT`): tool results are input tokens on every later hop.

### 4.3 Runner Change (small)

- Count tool calls per research run. At the budget limit, inject a system message: "Budget exhausted — synthesize from your notes now." This is a soft force toward synthesis, not an abort.
- Call `reset_notes()` at the start of each new research run and on unmount.

## 5. Synthesis Rules (Citation Discipline)

Citation fabrication is the most common deep-research failure mode. Two cheap mitigations:

1. Every claim in the final answer must copy a `source_url` from the notes — never from memory.
2. Claims with `status: "blocked"` or low confidence are reported as open questions, not silently dropped or upgraded.

## 6. Build Order

1. Extend the system prompt with the research skill + a `research_mode` flag. No code.
2. Add budget counting to the runner; inject the synthesis-forcing message at the limit.
3. Add the notes tool (`add_note` / `get_notes` / `reset_notes`), in-memory only.
4. Only if runs regularly exceed ~20 hops or the context window: split sub-questions into sub-agent threads (supervisor pattern).

## 7. What Is Deliberately Left Out

- **Sub-agents / parallel sub-question research** — optimization for speed, not quality; add when context pressure is real.
- **Server-side note storage** — breaks the privacy story, adds cleanup/auth obligations, solves no current problem.
- **Persistent research memory** — a different feature (a knowledge base), not this one.
- **RL-trained research behaviors** — prompt-orchestrated reflection achieves the quality target at KISS cost.