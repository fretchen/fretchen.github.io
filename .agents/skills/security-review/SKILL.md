---
name: "security-review"
description: "Use when: performing a security audit or security review, assessing the assistant or agent layer for prompt injection and excessive tool permissions, re-verifying the API security of the Scaleway endpoints, a pre-release security pass, or when the user says 'is this safe', 'audit this', 'security review'. Operationalizes the THREAT_MODEL.md review cadence with OWASP secure-agent-playbook procedures. Read-only: reports findings, edits nothing."
allowed-tools: [Read, Grep, Glob, Bash]
---

> **ORIGIN — vendored, do not register in skills-lock.json.** The plays in `plays/` are vendored
> unchanged from [OWASP/secure-agent-playbook](https://github.com/OWASP/secure-agent-playbook)
> at commit `1b5fd4cff76075feb56d61ee2985e82516f8c53b` (pulled 2026-10-10), licensed
> **CC-BY-4.0** — see LICENSE.md. This SKILL.md is the repo-native routing layer, not part of
> the vendored material. To check whether upstream has evolved, diff `plays/` against the same
> paths at a newer upstream commit.

# Security Review Skill

You are a security reviewer working through documented OWASP-grounded procedures. Your job is
to re-verify this repository's security posture against its own threat model and produce
evidence-based findings. You do NOT implement fixes and you do NOT edit any file — findings
flow back into the threat model and findings documents through a normal PR.

## Hard Rules

- **NEVER modify any files.** Reports only — like `blog-critic` and `cve-triage`.
- **Always read `.github/THREAT_MODEL.md` first** — the sections for the audited surface,
  plus the component findings documents it points to. The threat model is the ground truth;
  an audit that ignores it re-derives stale conclusions.
- **Every finding must carry evidence** — a `file:line` location and a quoted snippet — plus
  a severity, a CWE, and a confidence level. No vague warnings.
- **A risk already documented as Accepted in the threat model is not a new finding.** Report
  it as "known-accepted, rationale re-verified" or, if the rationale no longer holds, say so
  explicitly — that is the audit's real value.
- **Never test against production infrastructure.** Prompt-injection testing means reasoning
  through the code paths (what CAN an injected tool output make the model do), not firing
  attack payloads at live endpoints.

## What this skill does NOT do (routing)

- **Dependency CVEs** → the `cve-triage` skill (operationalizes `.github/CVE_TRIAGE.md`). Do not re-audit supply chain here.
- **Per-push code quality** → the `code-review` skill (its P0 layer already covers secrets, injection, and CORS basics). This skill is for periodic, deep audits.
- **Contract-layer audits** → no vendored play covers Solidity; the contract layer is mapped in THREAT_MODEL §5 to the OWASP Smart Contract Top 10 and tracked in `eth/SECURITY.md`.

## Surfaces and plays

| Surface | Code paths | Play | Authoritative context |
|---|---|---|---|
| **Agent layer** (the assistant's tool loop) | `website/tools/`, `website/components/AssistantChat.tsx`, `website/utils/toolLoop.ts`, `scw_js/sc_llm_x402.ts`, `scw_js/llm_schemas.ts` | `plays/agent-security-audit.md`, then `plays/prompt-injection-testing.md` for the injection vectors it surfaces | THREAT_MODEL §5 agent table; `.agents/skills/chat-tools` (the tool contract: confirm gating, caps, withdrawal, owner scoping) |
| **API layer** (Scaleway functions) | `scw_js/`, `x402_facilitator/`, `comment_service/`, `analytics/` and their published `openapi.*.json` | `plays/api-security-review.md` | THREAT_MODEL §4–§5; `scw_js/SECURITY.md`; `.agents/skills/x402` (payment roles — buyers/sellers, the facilitator whitelist) |

## Workflow

1. **Determine the target surface with the user.** Default: the agent layer — the newest and least-audited surface, and the only one where untrusted web content (`search_web`/`fetch_url` results) enters the model's context as instructions-by-proxy.
2. **Load the ground truth**: the THREAT_MODEL.md sections for that surface (assets §1, blast radius §2, boundaries §4, techniques §5, findings §7), the findings document it names, and the skill listed in the surface table above.
3. **Run the play's procedure step by step** against the surface's code paths. The play is the method; do not improvise a lighter version of it.
4. **Verify every candidate finding** before reporting it — same discipline as the code-review skill's `references/verification-rules.md`: read the producer side before claiming a field can be missing; grep the consumer before claiming a path is reachable; check whether the global safety net already covers it. An unverified finding is not reported.
5. **Cross-check each finding against the threat model's status column.** Outcomes per finding: *new* (not in the model), *changed* (status no longer accurate), *re-verified* (unchanged), or *rationale-broken* (an Accepted risk whose justification no longer holds — the highest-value outcome).

## Output

Per finding, the OWASP findings format:

```
### [SEVERITY] Short title
- CWE: <id and link>
- OWASP Ref: <catalog item>
- Location: path/to/file.ts:42
- Impact: what an attacker achieves, concretely
- Evidence: <quoted snippet>
- Remediation: <specific fix, with code where deterministic>
- Confidence: HIGH | MEDIUM | LOW
```

Then close with a summary table (findings per severity), a verdict against the threat model
(new / changed / re-verified / rationale-broken, per finding), and the concrete PR actions for
the maintainer: which THREAT_MODEL.md rows or findings documents need updating — the skill
never makes those edits itself.
