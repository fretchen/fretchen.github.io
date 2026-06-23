# Blog Post Plan: Threat Modeling for Small Blockchain Projects

## Target Audience
- **Blockchain developers** building small-to-medium on-chain projects (smart contracts + serverless backends)
- They know Solidity, EVM, wallet auth, and serverless — no need to explain what an EOA or a bearer token is
- What they likely lack: a structured way to ask "what actually needs protecting?" before starting security work
- What this post teaches: why the asset list and threat actor table should come first, and how they change which fixes are worth doing

## Core Thesis
A threat model is not documentation — it's a prioritization tool: without an explicit asset list and attacker profile, you end up fixing real-but-irrelevant bugs and missing the highest-value targets.

**Why the reader should care:** Security work has high opportunity cost. Every hour spent on CORS wildcards is an hour not spent on key management. The threat model is how you decide which hour matters.

## Outline

1. **The sprint that triggered this post** (~200 words)
   - Four security-focused commits in a week on a small blockchain+AI project
   - Honest question: did we fix real problems, or did we just have fun?

2. **The asset list: the first thing you should write** (~300 words)
   - What has monetary value, irreversibility, or trust significance?
   - Walk through the actual asset table from this project: owner EOA, agent wallet, ETH in contracts, USDC settlements, API keys
   - Key insight: the asset list immediately reveals the blast radius hierarchy — owner EOA is catastrophic, BFL API key is negligible

3. **The threat actor table: who is actually coming?** (~250 words)
   - Not nation-states. Not APTs. For a project at this scale: opportunistic bots, malicious collectors, phishing
   - The opportunistic bot is the most realistic (we already have a post about one exploiting our contract — link to mev_exploit_fix.md)
   - Actor table shapes which attack vectors to actually worry about

4. **Grading the four commits against the model** (~400 words)
   - EOA separation: most operationally important, not a code fix — addresses the highest-value asset
   - Replay attack fix: real, exploitable, low-to-moderate impact (API quota theft, not ETH drain) — the only genuine code vulnerability
   - CORS hardening: correct but irrelevant — EIP-712 already bounds blast radius
   - Mermaid XSS: real vulnerability class, near-zero exploitability (author-controlled content only)
   - Table summarizing: Fix | Asset targeted | Attacker | Realistic? | Impact if exploited

5. **What the model told us we were NOT doing** (~150 words)
   - The owner EOA is still a single point of catastrophic failure — Gnosis Safe is the actual fix, and we haven't done it
   - The threat model surfaces this gap more clearly than any code review would

6. **How to build one for your project** (~200 words)
   - Three questions: what has value? who wants it? how would they get it?
   - Start with the asset list, rank by blast radius, then map actors to assets
   - The model is a living document — wrong entries are better than no model

## Interactive Elements
None required. The post is text + one summary table (commit grading).

## Tone & Style
- First-person, personal — "I ran a security sprint and asked myself if it was real work"
- Same register as `mev_exploit_fix.md` — honest, slightly self-deprecating, technically precise
- No victory lap framing; end with an open admission (Gnosis Safe is still TODO)

## Sources & Research
- `.github/THREAT_MODEL.md` in this repo — primary source, quote the actual tables
- `mev_exploit_fix.md` — link as prior art (opportunistic bots are real on this project)
- `x402_facilitator_imagegen.mdx` — link for the facilitator trust model section
- OWASP Threat Modeling Cheat Sheet (optional external link if needed)

## Consistency Notes
- **Related posts:** `mev_exploit_fix.md` (same project, same forensic tone), `x402_facilitator_imagegen.mdx` (same architecture, honest about tradeoffs)
- **Structural pattern to follow:** mev_exploit_fix.md opens with a concrete incident, walks through the technical details, ends with numbered lessons — replicate this arc
- **Terminology to reuse:** "agent wallet", "owner EOA", "blast radius" (already in the threat model doc), "mint price"
- **Cross-reference opportunity:** Link to mev_exploit_fix.md when discussing opportunistic bots (the bot exploit is the strongest evidence that opportunistic actors are real, not hypothetical)
- **Frontmatter note:** Use `category: "blockchain"`, no `tokenID` until minted
