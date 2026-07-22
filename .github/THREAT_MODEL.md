# Threat Model

Last updated: 2026-06-20

This is a lightweight, living threat model. It follows the OWASP four-question framework and the values of the Threat Modeling Manifesto — a maintained document over a one-time audit, design issues over checkbox compliance, action over ceremony.

| Question | Answered in |
|---|---|
| What are we working on? | §1 Assets · §4 Trust Boundaries |
| What can go wrong? | §2 Blast Radius · §3 Threat Actors · §5 Attack Techniques |
| What are we going to do about it? | §7 Component Findings · §8 Mitigations |
| Did we do a good enough job? | §8 Review Cadence |

---

## 1. Assets

What has monetary value, irreversibility, or trust significance in this system:

| Asset | Location | Value |
|---|---|---|
| ETH in GenImNFTv4 | On-chain | Accumulates mint fees until `withdraw()` is called |
| ETH in LLMv1 (deprecated) | On-chain | User prepaid balances; withdrawable by users or claimable by providers. **No serverless code path calls this contract anymore** — `sc_llm.ts`/`leaf_history.ts` were retired in favor of `/assistent`'s x402 batch-settlement USDC channels. Final decommission (contract-level retirement) is pending confirmation that all balances have been withdrawn. |
| USDC settlements | x402_facilitator | Per-request payments routed through the facilitator |
| EIP3009 Splitter contract (testnet) | On-chain, Optimism Sepolia only (`eip155:11155420`) | Routes USDC settlements via EIP-3009; owner-upgradeable. Not yet on mainnet — promotes to a live asset on mainnet deployment |
| NFT metadata integrity | On-chain (token URIs) | Authoritative record of what image each token represents |
| Owner EOA private key | Dedicated keystore account (`0x1af51D…fBB20`), separated from daily wallet since 2026-06 | Controls every upgradeable contract — the highest-value key in the system |
| Agent wallet private key | scw_js secrets | Can trigger `requestImageUpdate()` and receive mintPrice per call |
| Facilitator wallet private key | x402_facilitator secrets | Receives USDC fees from settlements |
| Scaleway secrets (SCW_SECRET_KEY) | Serverless secrets | Access to S3 image bucket and transactional email |
| BFL / IONOS API keys | Serverless secrets | Image generation quota; no on-chain access |

Notably absent: user wallet keys (never touch the server), user PII (not collected).

---

## 2. Blast Radius

If a component is fully compromised, what else falls with it:

| Component | Direct impact | Cascades to |
|---|---|---|
| **Owner EOA** | Malicious upgrade to every upgradeable contract | Complete ETH drain from GenImNFTv4 + LLMv1; all NFT URIs replaceable; USDC fee wallet redirectable — total system compromise. The EIP3009 Splitter joins this blast radius once deployed to mainnet. Key is now a dedicated EOA (not daily wallet); full mitigation requires Gnosis Safe. |
| **Agent wallet** (scw_js) | `requestImageUpdate()` callable arbitrarily; drains GenImNFTv4 at `mintPrice` per call | NFT metadata corruption for all tokens; contract ETH drained |
| **Facilitator wallet** | USDC fees redirected | Financial only; no access to user funds or upgrade paths |
| **SCW_SECRET_KEY** | S3 bucket writable; email notifications spoofable | Generated images replaceable; no on-chain impact |
| **BFL / IONOS key** | Image generation quota consumed | No on-chain or financial impact to users |
| **x402_facilitator service** | Payment settlements halt | Image generation feature unavailable; already-signed USDC authorizations expire unused |
| **LLMv1 authorized provider** (deprecated path — see §1) | Can submit fraudulent Merkle batches; drains user balances up to available ETH | Only affects LLMv1 user balances; no access to other contracts |

Key observation: the **owner EOA** is the single point of catastrophic failure. All other compromises are bounded in scope. This makes key management the highest-priority operational security concern, ahead of any code-level finding.

---

## 3. Threat Actors

Realistic adversaries for a project of this scale, ordered by capability. Each entry describes WHO the actor is — their role, access level, and motivation. Attack methods and vectors are documented in §4 Trust Boundaries, §5 Attack Techniques, and `eth/SECURITY.md`.

| Actor | Capability | Motivation | Primary access |
|---|---|---|---|
| **Opportunistic bot** | Low — runs known exploit scripts | Financial: drain any available ETH | Public contract ABI; scans for common Solidity patterns (no-auth functions, reentrancy) |
| **Financially motivated attacker** | Medium — reads deployed ABIs, may operate a malicious website | Financial: extract ETH, redirect USDC, mint below-market | Direct contract calls; crafted ERC721 receiver contracts; cross-origin requests to x402_facilitator |
| **Insider / compromised authorized account** | High — already holds partial on-chain trust or serverless secrets | Financial gain or sabotage | `authorizedProviders` role in LLMv1; SCW_SECRET_KEY or agent wallet obtained via credential leak |
| **Attacker with owner credentials** | Critical — holds the owner EOA or agent wallet key | Total control | Key obtained via phishing, leaked `.env`, or compromised dev machine |

Out of scope: nation-state actors, L1/L2 consensus attacks, Scaleway infrastructure compromise, wallet software vulnerabilities.

---

## 4. Trust Boundaries

This is the attack-**surface** map: each arrow marks where data crosses from a less-trusted zone into a more-trusted one. Read it against §3 — an attack path is an actor reaching one of these arrows. The boundaries most exposed to untrusted callers are starred (★); the owner-EOA boundary carries no external surface but the highest blast radius (§2).

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (user-controlled)                                  │
│                                                             │
│  wagmi/viem ──────────────────────────► Blockchain RPC      │
│                                          (public, no auth)  │
│  @x402/fetch ─────────────────────────► x402_facilitator   │
│                                          (★ open CORS)      │
│  useWalletAuth Bearer ────────────────► Growth API          │
│                                          (owner sig only)   │
│  fetch ───────────────────────────────► comment_service     │
│                                          (origin whitelist) │
└─────────────────────────────────────────────────────────────┘

x402_facilitator
  │  EIP-712 sig verification ──────────► USDC contract
  │                                        (nonce enforced on-chain)
  └─ fee collection ────────────────────► facilitator wallet

scw_js
  │  agent wallet sig ──────────────────► GenImNFTv4.requestImageUpdate()
  │                                        (must be whitelisted)
  ├─ bearer token ──────────────────────► BFL / IONOS APIs
  └─ AWS SDK ───────────────────────────► Scaleway S3

Owner EOA ───────────────────────────────► Every upgradeable contract
  (single key controls all upgrade paths)
```

★ The x402 facilitator is an intentionally open public service (any merchant on Base or Optimism). `Access-Control-Allow-Origin: *` is required by the open-protocol design. The blast radius of a cross-origin attack is bounded by EIP-712/EIP-3009 cryptography: a malicious page can trigger settlement requests but cannot redirect funds (the signature binds recipient, amount, and nonce) or forge signatures. The residual risk (gas drain via `/settle` spam) is accepted: garbage requests fail before any on-chain transaction is attempted, L2 gas per settlement is negligible (~$0.001), and no realistic threat actor has financial incentive to drain a facilitator wallet whose ETH goes to miners, not the attacker.

---

## 5. Attack Techniques by Surface

This is the **HOW** that complements §3 (WHO) and §4 (WHERE): the concrete classes of weakness in scope when reviewing or scanning this system. Only *live* categories are listed — a category's absence means it was considered and judged not applicable, not overlooked. Detailed, per-instance findings live in the documents named in the **Tracked in** column. The two halves of the system map to two standard catalogs:

- [OWASP Smart Contract Top 10 (2025)](https://owasp.org/www-project-smart-contract-top-10/) — for `eth/` contracts.
- [OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) — for the serverless functions and website.

### Contract layer — OWASP Smart Contract Top 10

| Technique (OWASP) | Where it applies | Status | Tracked in |
|---|---|---|---|
| Access control (SC01) | `requestImageUpdate` agent whitelist; single-EOA upgrade governance | Mitigated / partially (governance open) | eth/SECURITY.md; §2 |
| Reentrancy (SC05) | CollectorNFT `_safeMint` price manipulation; SupportV2 donate paths | Open (price-only, no fund theft) / mitigated via `ReentrancyGuardTransient` | eth/SECURITY.md |
| Logic errors (SC03) | LLMv1 `processBatch` CEI ordering | Low — Open; reentrancy hardening on next upgrade | eth/SECURITY.md |
| Unchecked external calls (SC06) | SupportV2 arbitrary `_token` in `donateToken` | Accepted (contract holds no funds) | eth/SECURITY.md |
| Signature replay | LLMv1 Merkle batch submission | Mitigated via `processedBatches` mapping | eth/SECURITY.md |
| Access control / fund redirection (SC01) | EIP3009 Splitter `executeSplit`; `onlyOwner` `setFacilitatorWallet`/upgrade — **testnet-stage** | Mitigated (testnet): relayer cannot redirect funds — `nonce = keccak256(seller, salt)` binds seller to the buyer signature; owner powers are the residual risk | eth/contracts/EIP3009SplitterV1.sol; mainnet promotion → §8 |
| Integer over/underflow (SC08) | All contracts | Mitigated (Solidity ≥0.8.27 built-in checks; Splitter is 0.8.33) | eth/SECURITY.md |

### API / serverless layer — OWASP API Security Top 10

| Technique (OWASP) | Where it applies | Status | Tracked in |
|---|---|---|---|
| Broken authentication (API2) | EIP-712/EIP-3009 sig verify (facilitator); agent-wallet whitelist (scw_js); `useWalletAuth` owner-sig bearer (growth); origin whitelist (comment_service) | Mitigated | §4; §7 |
| Broken function-level authz (API5) | x402 `Access-Control-Allow-Origin: *`; bounded by EIP-3009 crypto | Accepted (intentional open protocol) | §4 ★; §7 |
| Unrestricted resource consumption (API4) | `/settle` spam gas drain; serverless cold starts (accepted); LLM pre-charge balance gate (batch-settlement stall; Open, medium) | Mixed — gas drain accepted; balance-gate open | §4; scw_js/SECURITY.md |
| Unrestricted access to sensitive business flows (API6) | Deliver-before-payment in the LLM and genimg flows | Open (medium) | scw_js/SECURITY.md |
| Security misconfiguration / secret exposure (API8) | comment_service sends `SCW_SECRET_KEY` as the `X-Auth-Token` header to the Scaleway transactional-email API | Open (medium) | §7 |
| Unsafe client trust (API10) | Client-side-only image validation | Open (low) | §7 |

---

## 6. CIA Summary

For blockchain systems, **Integrity** dominates. Confidentiality is generally low concern (code is public, transactions are public). Availability is partially guaranteed by the L2 itself; the serverless layer is the availability risk. **Repudiation** is a structural strength: all on-chain transactions are cryptographically signed and permanently recorded — no actor can deny having submitted a transaction.

| Component | Confidentiality | Integrity | Availability | Notes |
|---|---|---|---|---|
| Smart contracts | Low — all code and state is public | **Critical** — funds and metadata are irreversible | High — L2 guarantees liveness | Upgrade path is the integrity weak point |
| x402_facilitator | Low | **High** — invalid settlement = wrong payment routing | Medium — serverless cold starts | Open CORS degrades integrity boundary |
| scw_js | Low | **High** — agent wallet controls on-chain writes | Medium | API key compromise has no on-chain reach |
| website frontend | Low | Medium — client-side only; no server state | Low — static hosting | Wallet auth is the integrity boundary |
| comment_service | Medium — stores anonymous user names/text in S3 | Low — comment content and like counts | Low | Low-value, but holds `SCW_SECRET_KEY` (email) — not zero-secret |

---

## 7. Component Security Findings

Detailed code-level findings live alongside the code they describe:

| Component | Findings document | Open issues |
|---|---|---|
| Smart contracts | [eth/SECURITY.md](../eth/SECURITY.md) | CollectorNFT price manipulation (medium), single-owner upgrade path (medium governance) |
| Serverless & frontend | [scw_js/SECURITY.md](../scw_js/SECURITY.md) | LLM pre-charge balance gate (medium) and genimg deliver-before-settle (medium) — see scw_js/SECURITY.md; x402_facilitator open CORS (intentional; gas-drain risk accepted — negligible on L2, no attacker incentive), comment_service sends `SCW_SECRET_KEY` as the email API `X-Auth-Token` header (medium), client-side-only image validation (low) |

---

## 8. Mitigations and Review Cadence

Active mitigations and where they live:

| Area | Document | What it covers |
|---|---|---|
| Contract-level findings | [eth/SECURITY.md](../eth/SECURITY.md) | Open issues, known vulnerabilities, fixed CVEs |
| Serverless findings | [scw_js/SECURITY.md](../scw_js/SECURITY.md) | Open serverless issues (rough; full detail tracked privately via GHSA) |
| Dependency CVEs | [CVE_TRIAGE.md](CVE_TRIAGE.md) | Threat-model-driven triage framework for Dependabot alerts; `/cve-triage` skill operationalizes it |

**Review triggers** — revisit this document when any of the following occur:
- A contract is upgraded or a new contract is deployed
- The EIP3009 Splitter (or any testnet-stage contract) is deployed to mainnet — promote it to a full asset/blast-radius entry and re-scope the owner blast radius
- A key is rotated or a new privileged account is added
- A new serverless function or trust boundary is introduced
- A CVE is triaged as T1 or T2 (patch required)
