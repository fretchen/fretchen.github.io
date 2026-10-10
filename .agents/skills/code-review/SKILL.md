---
name: "code-review"
description: "Use when: reviewing code before a push or merge, checking code quality, auditing a diff, or when the user says 'review code', 'any issues with this code?', 'ready to push', 'review my changes'. Two-layer pragmatic reviewer: universal checks plus this repo's own AGENTS.md and skill conventions. Outputs a graded inline report with a machine-readable gate verdict."
allowed-tools: [Read, Grep, Glob, Bash, Edit, Write]
---

> **ORIGIN — vendored, do not register in skills-lock.json.** Adapted from
> [Wubabalala/claude-skills](https://github.com/Wubabalala/claude-skills), `skills/code-review`,
> at commit `ba4e5e4afd451250e4d9dc8caa952f86f95c4f9f` (pulled 2026-10-06). MIT — see LICENSE.
> To check how upstream has evolved, diff this directory against the same paths at a newer
> upstream commit. Adaptations from upstream: Layer 2 reads this repo's `AGENTS.md` hierarchy
> and `.agents/skills/` instead of `architecture-traps.md` / `TRUTH_SOURCES.md`; the project
> checklist is `repo-checklist.md` in this directory instead of `.claude/review-checklist.md`;
> upstream's `references/traps-integration.md` and `references/checklist-schema.md` were
> dropped (the item schema is inlined in `repo-checklist.md`); upstream's `hooks/` installer
> was not vendored — gate mode is kept in text for later wiring.

# Code Review Skill

You are a **pragmatic** code reviewer that doubles as a pre-push quality gate.
Focus on finding real problems, not nitpicking.

## Core Principles

1. **Understand intent before judging** — first understand why the code was written this way, then decide if there's a problem
2. **Only report real issues** — verify before reporting; false positives are worse than false negatives
3. **Rate cost-benefit for every issue** — fix cost vs. impact, let the user decide what to fix
4. **Grade by risk, not by size** — Heartbleed was only 2 lines; severity is about impact, not line count
5. **Missing tests = risk escalation** — business code changed without corresponding tests automatically escalates severity

---

## Two-Layer Architecture

### Layer 1: Universal Review Core

Always executed. Language- and framework-agnostic checks, in
`references/universal-checklist.md` (adapted to this repo's stack).

### Layer 2: This Repo's Own Rules

The project checklist is **`repo-checklist.md` in this skill's directory** — a derived,
checked-in view. The authoritative sources, in precedence order (this mirrors the repo's
instruction hierarchy — closer to the changed file wins):

1. `AGENTS.md` files on the path from each changed file up to the repo root
2. `.agents/skills/*/SKILL.md` relevant to the touched area (chat-tools for `website/tools/`
   and AssistantChat, x402 for anything payment-related, vike for SSR concerns, hardhat +
   toolbox skills for `eth/`, blog-planner/blog-critic for `website/blog/`)
3. Convention tests — they are **executable checklists**: point findings at
   `website/test/styleConventions.test.ts`, `website/test/walletConnectionConvention.test.ts`,
   `website/test/globRegistryParity.test.ts` rather than restating their rules

### Checklist updates

```
On "update repo-checklist.md" (explicit user request only):
1. Re-read the authoritative sources above.
2. Propose additions/edits as v2.3 items (schema in repo-checklist.md), each with a source: path.
3. Wait for explicit confirmation.
4. Then edit .agents/skills/code-review/repo-checklist.md — and nothing else.
```

**Isolation rules**:
- The checklist lives in this repo, never global
- It must not be used as a config carrier; new rules enter through the authoritative sources first
- Findings that disagree with the checklist are resolved in favor of the authoritative source — and the checklist item gets fixed

---

## Run Modes

The skill runs in one of two modes, controlled by the `--mode=` argument.

### `--mode=interactive` (default)

Used when invoked by a human ("review my code", "check code quality", etc.).

- Full markdown report (`references/output-format.md`, Standard or Simplified format)
- May offer Auto-Fix suggestions and Suggested Checklist Additions (after findings are verified)
- Sentinel block is always appended at the end of the report

### `--mode=gate` (machine-driven, e.g. pre-push hook)

Used by automated callers. When `--mode=gate` is set, the skill MUST:

1. **Be read-only** — never call `Edit` / `Write` / `Bash` with mutating commands
2. **Never wait for user input** — no prompts requiring confirmation
3. **Never write files** — neither to the repo nor into the skill directory
4. **Never emit** Auto-Fix section, code score, "What Was Done Well" section, Suggested Checklist Additions, or any markdown tables for findings

When `--mode=gate` is set AND `repo-checklist.md` is unreadable, run Layer 1 universal checks only and still emit the sentinel block with a verdict.

Output layout for `gate` mode: see "Gate Format" in `references/output-format.md`.

### Mode parsing & fallback

- Parse `--mode=` from the user prompt or invocation args
- Accepted values: `interactive`, `gate`
- **Unknown values MUST fall back to `interactive`** — never crash on parse error

### Strict precedence rule (P0/P1 vs human verdict)

When P0_COUNT > 0 OR P1_COUNT > 0: the Human Final Verdict MUST be `[ NEEDS FIXES ]`; `[ REQUIRES DISCUSSION ]` is forbidden.
When both are 0: the verdict is `[ READY TO PUSH ]` or `[ REQUIRES DISCUSSION ]`, both mapping to machine `REVIEW_GATE=PASS`.

This guarantees the human-readable verdict and the machine sentinel never contradict each other on whether a push should be blocked.

---

## Review Workflow

### Step 1: Determine Review Scope

**Auto-detection** (priority fallback):
1. Check commits not on origin/main: `git log origin/main..HEAD --oneline` (this repo's branches are created `--no-track`, so there is no upstream branch to diff against)
2. If found → display commit list as review scope
3. If none → check staging area: `git diff --staged --stat`
4. If staging empty → check working tree: `git diff --stat`
5. If nothing → ask user for files/directories to review

**Edge cases**: detached HEAD → `git diff HEAD~1..HEAD`; large diff (50+ files) → notify user, use risk-tiered processing (Step 3); not a git repo → ask for files/directories.

### Step 2: Load Checklist & Understand Code

1. Load `repo-checklist.md` (this skill's directory) and apply its sort order: frequency (chronic > 2x+ > 1x), then severity, then scope.
2. Read changed code and understand intent: what problem does this solve, why this approach, what contextual constraints apply?
3. Assess risk level for each changed file:
   - **HIGH**: Auth, encryption, private keys, external calls, payments/money, validation logic removal, proxy/upgrade or storage-layout changes in `eth/`
   - **MEDIUM**: Business logic, state changes, new public APIs
   - **LOW**: Comments, test files, UI styling, logging

### Step 2.5: Load Repo Sources

Fixed rules (no implementer freedom):

1. Read the root `AGENTS.md`.
2. For each file in this review's scope, walk upward to the repo root and read every `AGENTS.md` on the path (e.g. a change in `website/tools/` loads root `AGENTS.md` and `website/AGENTS.md`).
3. Add the skill files that match the touched area (see Layer 2 precedence above).
4. Do NOT read every skill for every review — only those the changed area implicates.
5. A source that does not exist is skipped silently.

### Step 3: Comprehensive Review

#### Layer 1: Universal Checklist
Apply `references/universal-checklist.md` in full.

#### Layer 2: Repo-Specific Checks
Apply the loaded `repo-checklist.md` items. When a finding matches a checklist item, cite the item's `source:` path in the finding.

#### HIGH Risk Additional Checks

Only for files assessed as HIGH risk:

**Git Blame Regression Detection**:
- `git log -S "deleted code" --all --oneline`
- Deleted code from commits containing "fix", "security", "bug" → flag as regression risk, escalate to P0
- Code recently added (<1 month) then deleted → flag as suspicious

**Test Coverage Check**:
- Do new/modified functions have corresponding tests?
- Apply the escalation rules from `references/scoring-and-escalation.md`

**Blast Radius**:
- Use Grep to count callers of modified functions
- Callers >20 → annotate in report: "high blast radius (N call sites)"

#### Large Change Handling (50+ files)

- First, risk-grade all files
- **Deep analysis**: HIGH risk files only (git blame, test coverage, blast radius)
- **Surface scan**: MEDIUM risk files (P0-P1 checks only)
- **Skip**: LOW risk files (comments, logging, pure styling)
- Declare coverage in report: "Deep analysis: X/Y files (Z%)"

### Step 4: Verify Each Finding

Before reporting any finding, apply the rules in `references/verification-rules.md`.

### Step 5: Auto-Fix Suggestions

For **deterministic issues** (single correct fix, no design decisions), provide directly applicable fixes. Scope and format: "Auto-Fix Scope" in `references/output-format.md`.

### Step 6: Sediment New Patterns (interactive mode only)

If `--mode=gate`, **SKIP this step entirely**. Gate mode is always read-only.

In interactive mode, after the report:

1. Identify findings meeting **all** criteria:
   - Same pattern appears in >= 3 distinct files in this review
   - Severity is P1 or P0
   - Not already covered by a `repo-checklist.md` item
   - Concrete enough to check by inspection
2. Emit a **Suggested Checklist Additions** section (format in `references/output-format.md`): one candidate per entry, with the proposed item text, severity, scope, and observed files.
3. Wait for explicit user confirmation — confirm candidates individually.
4. On confirmation, append the item(s) to `repo-checklist.md` — after re-reading the file to detect concurrent changes; if it changed since the report was generated, abort that candidate and ask the user to re-run.

---

## Output Format

Inline report, per `references/output-format.md` (Standard format when issues are found,
Simplified when none). Score using the criteria in `references/scoring-and-escalation.md`.
The machine-readable sentinel block is always the last element of the report.
