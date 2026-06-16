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

## 6. Smart Contract Findings

*Code-level issues identified by manual review against the OZ 5.6 codebase (commit 32e91e8e).*

### Open Issues

| Contract | Function | Issue | Severity |
|---|---|---|---|
| `CollectorNFT.sol` | `mintCollectorNFT()` | `_safeMint` triggers `onERC721Received` before `mintCountPerGenImToken` is incremented — allows price manipulation via reentrancy | Medium |
| All upgradeable | `_authorizeUpgrade()` | Only `onlyOwner`; no timelock or multi-sig — leaked owner key = immediate upgrade of all contracts | Medium (governance) |
| `SupportV2.sol` | `donateToken()` | Accepts arbitrary `_token` address; caller can pass a malicious contract | Low (contract holds no funds) |
| `LLMv1.sol` | `processBatch()` | `processedBatches[merkleRoot] = true` is set after provider payments — technically violates CEI | Informational |

**CollectorNFT attack path:** An attacker deploys a receiver contract whose `onERC721Received` callback re-enters `mintCollectorNFT()` for the same `genImTokenId`. Because `mintCountPerGenImToken` has not been incremented yet when the callback fires, `getCurrentPrice()` returns the pre-increment (lower) price. The attacker pays base price for mints that should cost 2×, 4×, etc. No fund theft — price manipulation only. Does not merit a CVE.

**LLMv1 note:** Although `processedBatches[merkleRoot] = true` is set after the payment loop, the issue is not exploitable: all user balances are deducted in the first loop before any payments, so a reentrant call with the same `merkleRoot` fails `InsufficientBalance`.

### Confirmed Safe (Previously Questioned)

| Contract | Function | Why it is safe |
|---|---|---|
| `GenImNFTv4.sol` | `requestImageUpdate()` | CEI correct: `_imageUpdated[tokenId] = true` before payment. Reentrant call reverts on `ImageAlreadyUpdated`. |
| `LLMv1.sol` | `withdrawBalance()` | CEI correct: `llmBalance[msg.sender] -= amount` before payment. Reentrant call reverts on `InsufficientBalance`. |

### Mitigations in Place

- CVE-2025-11-26 fixed: `requestImageUpdate()` requires `_whitelistedAgentWallets[msg.sender]`
- `SupportV2.donate()` and `donateToken()` use `ReentrancyGuardTransient` (OZ 5.x)
- Solidity 0.8.27 — built-in overflow/underflow protection
- Storage layout preserved across v3→v4 upgrade (gap 49 → 48 slots)
- Merkle proof replay protection in `LLMv1` via `processedBatches` mapping

### Recommended Fixes

1. **CollectorNFT:** Move `mintCountPerGenImToken[genImTokenId]++` and `collectorTokensByGenImToken[genImTokenId].push(collectorTokenId)` to before the `_safeMint` call, or add `nonReentrant` from `ReentrancyGuardTransient`.
2. **Upgrade path:** Move owner to a Gnosis Safe or add a `TimelockController`.
3. **SupportV2:** Validate `_token` against a known-good list; low priority given no funds are at risk.

---

## 7. Serverless & Frontend Findings

### Open Issues

| File | Issue | Severity |
|---|---|---|
| `x402_facilitator.ts` | CORS `*` on payment settlement endpoint — any origin can initiate settlement calls | Medium |
| `comment_service/comments.ts` | `SCW_SECRET_KEY` passed in Scaleway email API header (may appear in request logs) | Medium |
| `components/ImageGenerator.tsx` | Image MIME/size validation is client-side only | Low |

### Mitigations in Place

- EIP-712 domain name correctly parameterized per chain (`USDC_NAMES` in `shared/chain-utils/src/addresses.ts`)
- Growth API: timestamp-scoped signed messages, 5-min window, message-prefix-scoped
- Comment service: `ALLOWED_ORIGINS` whitelist
- Wallet auth Bearer tokens are not reusable across services (prefix-scoped)
- No secrets or private keys in any frontend code

### Recommended Fixes

1. Restrict `Access-Control-Allow-Origin` on the facilitator to `https://www.fretchen.eu` — same pattern as the comment service.
2. Use a scoped Scaleway API token for the email service instead of `SCW_SECRET_KEY`.
3. Re-validate image MIME type and size server-side in `scw_js` before forwarding to BFL/IONOS.
