# ERC-8004 AX Audit — Fretchen Agents (Base)

**Date:** 2026-11-01 · **Agents:** #97599 (LLM Assistant) · #97600 (Web Access) · **Registry:** `eip155:8453:0x8004a169fb4a3325136eb29fa0ceb6d2e539a432`

## Current Scores

| Dimension (weight) | #97599 | #97600 |
| --- | --- | --- |
| Engagement (0.30) | 14 | 5 |
| Service (0.25) | 54 | 54 |
| Publisher (0.20) | 25 | 25 |
| Compliance (0.15) | 94 | 94 |
| Momentum (0.10) | 15 | 15 |
| **Overall** | **43.64** | **30** |

## Key Finding

Quality score is already **83.49** — but the leaderboard policy caps "early"-evidence agents at a **score-band ceiling of 55**. The score is limited by *evidence of usage*, not service quality. x402 support is registered (`x402_supported: true`, wallet tagged X402) but **is not a scored dimension**; per ERC-8004, payments are orthogonal — x402 only enriches feedback signals once distinct clients actually transact.

## AX Gaps (Both Agents)

1. **No A2A service** — `has_a2a: false`; Service score 54 is the MCP-only ceiling (`max(mcp_quality, a2a_quality)`, a2a = null).
2. **Endpoint not verified** — `is_endpoint_verified: false`. Publish `/.well-known/agent-registration.json` matching agentId + registry → verification bonus.
3. **OASF endpoint is a placeholder** — points to `github.com/agntcy/oasf/` (human page), not a machine-readable manifest. Dead end for agent clients.
4. **`supportedTrust` empty** — per spec, empty = discovery-only, no trust. Declare `["reputation", "crypto-economic"]`.
5. **Thin MCP surface** — 2 tools, 0 prompts, 0 resources; health status "unknown".
6. **Discovery metadata empty** — `tags`, `categories`, `agent_type` unset; indexer filtering cannot match capability queries.

## Actions — #97599 (LLM Service)

- Add A2A entry pointing to a real `/.well-known/agent-card.json`
- Fix OASF endpoint → actual manifest (hosted JSON or IPFS)
- Publish `.well-known/agent-registration.json` on fretchen.eu / MCP domain
- Set `supportedTrust`; fill tags/categories/agent_type
- Get feedback from **distinct wallets** (current: 2 ratings, both from `0x073f...7d20`, 10–11 days old → `recent_feedback_count: 0`)

## Actions — #97600 (Web Access)

- Same 4 registration fixes (A2A, domain verification, OASF, trust models)
- **Zero feedback** → top priority: have 3–5 distinct agent clients call it via MCP + x402 and post feedback citing payment txs
- Make per-call pricing machine-readable in metadata, not prose only

## Sources

- 8004scan: `8004scan.io/agents/base/97599` · `8004scan.io/agents/base/97600` · API `api.8004scan.io/api/v1/agents/8453/97599` (last scored 2026-10-31)
- ERC-8004 spec + data profiles: `eips.ethereum.org/EIPS/eip-8004` · `best-practices.8004scan.io`
- Note: API blocked automated access for #97600; its registration shape is inferred from the identical Service/Compliance/Publisher pattern — verify in dashboard.