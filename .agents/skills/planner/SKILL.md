---
name: "planner"
description: "Use when: planning a multi-step code change before touching code — a feature, fix, or refactor that spans more than one file or one sitting, anything that will touch contracts, keys, payments, or push rules, or when the user says 'plan this', 'before we implement', 'propose a plan'. Two phases: grill the open decisions in rounds with recommended answers, then write a decisions-only plan with per-task verification commands. Blog posts go to blog-planner instead."
allowed-tools: [Read, Grep, Glob, Bash, Edit, Write, WebFetch]
---

# Skill: planner

> **ORIGIN — adapted, not vendored.** Two upstream techniques, both MIT, are fused here:
> the pre-plan interview from [mattpocock/skills](https://github.com/mattpocock/skills)
> (`skills/productivity/grilling/SKILL.md`, Matt Pocock) and the plan format from
> [obra/superpowers](https://github.com/obra/superpowers)
> (`skills/writing-plans/SKILL.md`, Jesse Vincent). Neither is vendored unchanged: both are
> ecosystem-coupled (worktrees and sub-skills; `grill-me` indirection) and this file is the
> repo-native layer. Keep it out of `skills-lock.json`, which is only for CLI-managed skills.

Plan a change **before** implementing it. The two halves exist because each covers the other's
blind spot: an interview with no written plan loses its answers, and a plan written without an
interview encodes guesses as decisions. The expensive failure this skill exists to prevent is a
plan that silently chose the heavyweight option for a small problem — the remediation that had a
two-line alternative nobody put to the user because the plan never asked.

## Routing

| Task | Skill |
|---|---|
| Blog posts (`website/blog/`) | `blog-planner` — its plan-first rule (`<slug>.plan.md`) owns that directory |
| Reviewing a diff, a draft, security, CVEs | `code-review`, `blog-critic`, `security-review`, `cve-triage` — read-only, they consume plans, they don't produce them |
| Everything else that will touch more than one file, or needs more than one sitting | this skill |

## Phase 0 — Read, before asking anything

A question Phase 0 can answer is not a question. Before the first grilling round:

- The **AGENTS.md chain** from the task's directory up to the repo root — closer wins on conflict.
- The affected packages' **READMEs** — this repo keeps each package's commands there, and the
  plan's verification steps quote them.
- The **target file end to end**, plus the tests that exercise it and the files that call it.
- Any **skill** the routing in AGENTS.md names for the surface (x402, chat-tools, hardhat, vike).

## Phase 1 — Grill the open decisions

Work the open decisions as a tree: every decision branches into the decisions that hang off it.
The **frontier** is every decision whose prerequisites are already settled — ask only those, in
**rounds**: the whole frontier at once, numbered, then wait for answers; the answers reshape the
tree and the next round asks the newly unblocked questions. A question whose answer depends on
another question still open this round belongs to a later round.

Per question:

- **Number it and give your recommended answer.** Word it so "yes" accepts the recommendation.
- **Facts are your job, never the user's.** Anything you could look up (a signature, a test
  command, whether a helper exists) gets looked up, not asked.
- **Decisions are the user's.** Put each one to them and wait.

Three questions are mandatory in the first round, whatever else is on the frontier:

1. **Proportionality.** Is the heavyweight option proportionate to the task's size or the
   finding's severity? Whenever a remediation has a light and a heavy option, this question
   names both and recommends one — that is the question this skill exists for.
2. **Blast radius.** Does anything here touch a push, a key, a contract, or production? If yes,
   name the rule that applies (AGENTS.md → Git Workflow / Security, THREAT_MODEL.md,
   eth/SECURITY.md) before the plan proposes to act near it.
3. **Verification.** Which package's tests prove this change, and what exact command (from that
   package's README) runs them?

The session ends when the frontier is empty: every branch visited, nothing left silently
assumed. Do not start Phase 2 on a half-answered tree, and do not act at all until the user
confirms the shared understanding.

## Phase 2 — Write the plan

The plan carries the decisions the implementer cannot make alone — which files, which names and
signatures, which values, which tests prove each task. Everything else is the implementer's to
write: a plan longer than the code it describes has written the code instead.

**Storage.** The scratchpad by default — a plan is session material, not a repo artifact. A
committed plan file (`<target-dir>/<slug>.plan.md`, the blog-planner convention) only when the
work spans multiple sessions or PRs, or when the user asks for one.

**Header — every plan starts with this:**

```markdown
# <short name>

**Goal:** one sentence.
**Approach:** 2–3 sentences — what changes and why that route.
**Constraints:** repo-wide rules that apply, one line each, copied from AGENTS.md /
the package README with their location, so they can't drift.
```

**Tasks — the unit a reviewer could approve while rejecting its neighbor:**

```markdown
### Task N: <component>

**Files:**
- Modify: `exact/path/file.ts:123-145`   (Create: / Test: likewise)

**Interfaces:**
- Consumes: what this task uses from earlier tasks — exact names and types.
- Produces: what later tasks rely on — exact names and types. This block is how a
  neighboring task learns them; the plan does not repeat code between tasks.

**Steps:**
- [ ] One action with a checkable result, in order: write the test; run it, expect the
      named failure; implement; run the tests, expect pass.
```

Step rules:

- A step is done when the implementer can write **exactly one reasonable thing** from it. A
  test step carries the test's name and assertions; a code step carries the exact signature and
  the values the constraints pin — the body appears only for an algorithm neither determines.
- Every verification step carries the **command from the package's README** and the output that
  means it passed. Check the monorepo ordering rules in AGENTS.md → Commands before sequencing
  (chain-utils builds before its dependents; `eth` ABI export before website ABI imports;
  website `prepare` before dev/build).
- No `TBD`, no "handle edge cases", no "add appropriate validation" — a line that decides
  nothing is a gap; a function body the signature and tests determine is a transcript.

## Phase 3 — Self-review

Run once, fix inline, no second pass:

1. **Coverage** — every requirement, user ask, and constraint has a task that implements it.
2. **Naming** — names and types in later tasks match earlier tasks' Interfaces blocks.
3. **Proportion** — plan length against what it describes; if a small task produced a long
   plan, cut it back before presenting it. A small change should fit in well under a page.
4. **Verification** — every run-command exists in this repo and runs in the package it claims.
5. **Assumptions** — every assumption relied on but not verified is named to the user at the
   end, not buried in a task.

## Handoff

Present the plan and its named assumptions. Implementation then runs in this session under the
normal AGENTS.md discipline — the todo list mirrors the tasks one-to-one, and each task is done
when its verification step's output says so. No sub-skill ceremony, no worktree dance: the plan
is the handoff.
