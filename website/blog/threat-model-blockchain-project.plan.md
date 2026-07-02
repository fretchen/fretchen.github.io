# Blog Post Plan: Threat Modeling for Small Blockchain Projects

## Target Audience
- **Primary: technically literate builders of small projects who are NOT security specialists** — indie developers, solo maintainers, small-team engineers. Comfortable with "dependency", "API", "private key", "endpoint"; have security features (Dependabot, CodeQL) switched on — but experience security as a random, anxiety-driven checklist. They do NOT want a Solidity/EVM masterclass.
- **Secondary: blockchain/web3 builders** who get extra payoff from the concrete on-chain examples (owner EOA, EIP-3009, agent wallet) — but the post is deliberately readable without that background.
- What they lack: a lightweight mental model for *prioritizing* security effort instead of chasing every alert.
- What this post teaches: ask what's worth protecting, who realistically wants it, and how — then use that to decide which fixes matter and which alerts to ignore.
- Deliberate accessibility choices this post makes (and the plan must respect): house-security analogy, plain-language asset *categories* over contract names, jargon-free tables, no code blocks. It intentionally sits *between* the CLAUDE.md "blockchain developers" and "academics" audiences rather than squarely in either.

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

5. **The same lens on Dependabot noise** (~300 words)
   - Dependabot generates a stream of severity-labeled alerts. Without a threat model, HIGH = panic, LOW = ignore. With one, the question changes: "can an untrusted caller reach this code path, and does it threaten a valued asset?"
   - Concrete example from this project: `ws` HIGH-severity DoS alert in x402_facilitator. CVE says: memory exhaustion from malicious WebSocket fragments. Sounds alarming. But: `ws` is a transitive dep of `viem`, used as a *client* connecting outbound to Alchemy RPC — not a server accepting untrusted frames. Exploiting it requires a compromised RPC provider, which is a supply chain attack outside the threat model's scope. Verdict: defer.
   - Contrast: `form-data` HIGH (CRLF injection) in scw_js — this IS in the T1 serverless layer that handles on-chain writes. Fix immediately.
   - Show the triage table (Tier 1–4 classification by manifest path) as the operationalization of the threat model applied to deps
   - Point: severity labels are written for generic audiences; the threat model makes them project-specific

6. **The model also tells you when to stop** (~100 words)
   - The threat model evaluated Gnosis Safe and said no: at this project's threat actor profile (opportunistic bots, malicious collectors — not sophisticated APTs), separating the owner EOA to a dedicated key already closes the catastrophic failure mode
   - Gnosis Safe adds operational complexity (multi-sig coordination, safe upgrade ceremonies) that isn't justified when the realistic attacker can't socially engineer a multi-sig quorum and doesn't have the capability to compromise a hardware wallet
   - The model prevents over-investing as much as under-investing — knowing when you've done enough is as important as knowing what to fix

7. **How to build one for your project** (~200 words)
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
