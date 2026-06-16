# Threat Model

Last updated: 2026-06-16

---

## 1. Assets

What has monetary value, irreversibility, or trust significance in this system:

| Asset | Location | Value |
|---|---|---|
| ETH in GenImNFTv4 | On-chain | Accumulates mint fees until `withdraw()` is called |
| ETH in LLMv1 | On-chain | User prepaid balances; withdrawable by users or claimable by providers |
| USDC settlements | x402_facilitator | Per-request payments routed through the facilitator |
| NFT metadata integrity | On-chain (token URIs) | Authoritative record of what image each token represents |
| Owner EOA private key | Held by operator | Controls all five upgradeable contracts — the highest-value key in the system |
| Agent wallet private key | scw_js secrets | Can trigger `requestImageUpdate()` and receive mintPrice per call |
| Facilitator wallet private key | x402_facilitator secrets | Receives USDC fees from settlements |
| Scaleway secrets (SCW_SECRET_KEY) | Serverless secrets | Access to S3 image bucket and transactional email |
| BFL / IONOS API keys | Serverless secrets | Image generation quota; no on-chain access |

Notably absent: user wallet keys (never touch the server), user PII (not collected).

---

## 2. Threat Actors

Realistic adversaries for a project of this scale, ordered by capability:

| Actor | Capability | Motivation | Likely vector |
|---|---|---|---|
| **Opportunistic bot** | Low — runs known exploit scripts | Financial: drain any available funds | Scans for common Solidity patterns (no-auth functions, reentrancy) |
| **Malicious buyer/collector** | Medium — reads the deployed contract ABI | Financial: mint at below-market price, extract ETH | Crafts a receiver contract to exploit ERC721 callbacks |
| **Phishing / cross-origin site** | Medium — operates a malicious web page | Financial: trigger payment flows without user intent | Exploits open CORS on the facilitator from a different origin |
| **Compromised service provider** | High — already has partial on-chain trust | Financial or sabotage | Abuses `authorizedProviders` role in LLMv1 to submit fraudulent batches |
| **Key compromise** | Critical — attacker holds the owner EOA | Total control | Phishing, leaked `.env`, compromised dev machine |

Out of scope: nation-state actors, L1/L2 consensus attacks, Scaleway infrastructure compromise, wallet software vulnerabilities.

---

## 3. Trust Boundaries

Where control or trust changes hands. Each arrow is a potential attack surface.

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

Owner EOA ───────────────────────────────► All 5 upgradeable contracts
  (single key controls all upgrade paths)
```

★ The x402 facilitator boundary is the weakest: it accepts requests from any origin, meaning a malicious web page can initiate settlement calls on behalf of a user who has approved USDC to the facilitator.

---

## 4. Blast Radius

If a component is fully compromised, what else falls with it:

| Component | Direct impact | Cascades to |
|---|---|---|
| **Owner EOA** | Malicious upgrade to all 5 contracts | Complete ETH drain from GenImNFTv4 + LLMv1; all NFT URIs replaceable; USDC fee wallet redirectable — total system compromise |
| **Agent wallet** (scw_js) | `requestImageUpdate()` callable arbitrarily; drains GenImNFTv4 at `mintPrice` per call | NFT metadata corruption for all tokens; contract ETH drained |
| **Facilitator wallet** | USDC fees redirected | Financial only; no access to user funds or upgrade paths |
| **SCW_SECRET_KEY** | S3 bucket writable; email notifications spoofable | Generated images replaceable; no on-chain impact |
| **BFL / IONOS key** | Image generation quota consumed | No on-chain or financial impact to users |
| **x402_facilitator service** | Payment settlements halt | Image generation feature unavailable; already-signed USDC authorizations expire unused |
| **LLMv1 authorized provider** | Can submit fraudulent Merkle batches; drains user balances up to available ETH | Only affects LLMv1 user balances; no access to other contracts |

Key observation: the **owner EOA** is the single point of catastrophic failure. All other compromises are bounded in scope. This makes key management the highest-priority operational security concern, ahead of any code-level finding.

---

## 5. CIA Summary

For blockchain systems, **Integrity** dominates. Confidentiality is generally low concern (code is public, transactions are public). Availability is partially guaranteed by the L2 itself; the serverless layer is the availability risk.

| Component | Confidentiality | Integrity | Availability | Notes |
|---|---|---|---|---|
| Smart contracts | Low — all code and state is public | **Critical** — funds and metadata are irreversible | High — L2 guarantees liveness | Upgrade path is the integrity weak point |
| x402_facilitator | Low | **High** — invalid settlement = wrong payment routing | Medium — serverless cold starts | Open CORS degrades integrity boundary |
| scw_js | Low | **High** — agent wallet controls on-chain writes | Medium | API key compromise has no on-chain reach |
| website frontend | Low | Medium — client-side only; no server state | Low — static hosting | Wallet auth is the integrity boundary |
| comment_service | Medium — user names/text | Low — like counts only | Low | Lowest risk component |

---

## 6. Component Security Findings

Detailed code-level findings live alongside the code they describe:

| Component | Findings document | Open issues |
|---|---|---|
| Smart contracts | [eth/SECURITY.md](../eth/SECURITY.md) | CollectorNFT price manipulation (medium), single-owner upgrade path (medium governance) |
| Serverless & frontend | — | CORS `*` on x402_facilitator (medium), SCW_SECRET_KEY in email headers (medium), client-side-only image validation (low) |
