# Threat Model

Last updated: 2026-06-16 (eth/ section revised after manual code review — initial findings from static analysis contained false positives)

## Priority Order

Risk priority differs from naive surface-area intuition:

**eth/ > x402_facilitator/ > website/**

- `website/` is mostly a client-side React app. Sensitive operations (wallet signing, contract calls) run in the user's browser — blast radius is the individual user, not the system.
- `eth/` contracts hold real ETH and control token URIs. Most ETH transfers correctly follow Checks-Effects-Interactions; the real risk is in CollectorNFT's mint ordering and the single-owner upgrade path.
- `x402_facilitator/` is the USDC settlement engine. It is Internet-facing with overly permissive CORS.

---

## 1. Smart Contracts (eth/)

### Open Issues

| Contract | Function | Issue | Severity |
|---|---|---|---|
| `CollectorNFT.sol` | `mintCollectorNFT()` | `_safeMint` triggers `onERC721Received` before `mintCountPerGenImToken` is incremented — allows price manipulation via reentrancy | Medium |
| All upgradeable | `_authorizeUpgrade()` | Only `onlyOwner`; no timelock or multi-sig — leaked key = immediate contract takeover | Medium (governance) |
| `SupportV2.sol` | `donateToken()` | Accepts arbitrary `_token` address; attacker can pass a malicious contract | Low (contract holds no funds) |
| `LLMv1.sol` | `processBatch()` | `processedBatches[merkleRoot] = true` is set after provider payments — technically violates CEI | Informational |

**CollectorNFT attack path:** An attacker deploys a receiver contract whose `onERC721Received` callback re-enters `mintCollectorNFT()` for the same `genImTokenId`. Because `mintCountPerGenImToken` has not been incremented yet when the callback fires, `getCurrentPrice()` returns the pre-increment (lower) price. The attacker can mint multiple CollectorNFTs at base price, defeating the bonding curve. Each reentrant call requires ETH from the attacker, so this is price manipulation rather than fund theft. **Does not merit a CVE** — no fund-loss path and relies on a malicious receiver contract.

**LLMv1 note:** Although `processedBatches[merkleRoot] = true` is set after the payment loop, the issue is not exploitable: all user balances are deducted in the first loop before any payments, so a reentrant call with the same `merkleRoot` would fail the `InsufficientBalance` check.

### Not Issues (Previously Flagged — Confirmed Safe After Code Review)

| Contract | Function | Why it is safe |
|---|---|---|
| `GenImNFTv4.sol` | `requestImageUpdate()` | CEI is followed: `_imageUpdated[tokenId] = true` before payment. Reentrant call reverts on `ImageAlreadyUpdated`. |
| `LLMv1.sol` | `withdrawBalance()` | CEI is followed: `llmBalance[msg.sender] -= amount` before payment. Reentrant call reverts on `InsufficientBalance`. |

### Mitigations in Place

- CVE-2025-11-26 fixed: `requestImageUpdate()` in v4 requires `_whitelistedAgentWallets[msg.sender]`
- `SupportV2.donate()` and `donateToken()` use `ReentrancyGuardTransient` (OZ 5.x transient storage)
- All contracts use Solidity 0.8.27 — built-in overflow/underflow protection
- Storage layout preserved correctly across v3→v4 upgrade (gap 49 → 48 slots)
- Merkle proof replay protection in `LLMv1.processBatch()` via `processedBatches` mapping

### Recommended Fixes

1. **CollectorNFT:** Move `mintCountPerGenImToken[genImTokenId]++` and `collectorTokensByGenImToken[genImTokenId].push(collectorTokenId)` to before the `_safeMint` call, or add `nonReentrant` from `ReentrancyGuardTransient` (same as `SupportV2`).
2. **Upgrade path:** Move contract ownership to a Gnosis Safe or add a `TimelockController` before `_authorizeUpgrade()`.
3. **SupportV2:** Consider validating `_token` against a known-good token list; low priority given no funds are at risk.

---

## 2. Payment Facilitator (x402_facilitator/)

### Open Issues

| File | Issue | Severity |
|---|---|---|
| `x402_facilitator.ts` | CORS headers are `*` for all origins/headers/methods on a payment settlement endpoint | Medium |
| `comment_service/comments.ts` | `SCW_SECRET_KEY` passed in Scaleway email API header (may appear in request logs) | Medium |
| Facilitator | No self-enforced nonce check — relies entirely on USDC contract enforcement | Low |

### Mitigations in Place

- Fee allowance check at verify time blocks unauthorized settlement before any on-chain action
- EIP-712 domain name is correctly parameterized per chain (`USDC_NAMES` in `shared/chain-utils/src/addresses.ts`)
- Growth API uses timestamp-scoped signed messages (5-min window, message-prefix-scoped to prevent cross-service reuse)
- Comment service uses a proper `ALLOWED_ORIGINS` whitelist

### Recommended Fixes

1. Restrict `Access-Control-Allow-Origin` on the facilitator to `https://www.fretchen.eu` (and `http://localhost:3000` for dev) — same pattern the comment service already uses.
2. Audit whether `SCW_SECRET_KEY` appears in Scaleway function logs; if so, use a scoped API token for the email service instead.

---

## 3. Frontend (website/)

### Open Issues

| File | Issue | Severity |
|---|---|---|
| `pages/growth/+Page.tsx` | Admin UI accessible before wallet connects (client-side check only); API is correctly gated | Low |
| `hooks/useWalletAuth.ts` | Bearer token is Base64-encoded JSON, not a signed JWT — no server-side revocation | Low |
| `components/ImageGenerator.tsx` | Image upload validated client-side only (canvas compression) | Low |

### Mitigations in Place

- Wallet auth uses message prefix scoping — tokens are not reusable across services
- Token TTL is 4 minutes (backend rejects after 5 minutes)
- Honeypot field in comment form
- No secrets or private keys in any frontend code
- All contract writes are user-initiated via explicit button actions

### Recommended Actions

1. Ensure `scw_js` image endpoint re-validates MIME type and file size server-side before forwarding to BFL/IONOS.
2. Run `npm audit` in `website/` periodically for CVEs in wagmi, viem, and x402 packages.

---

## Trust Boundaries Summary

```
Browser (user)
  │
  ├─ wagmi/viem → blockchain RPC (public)
  ├─ @x402/fetch → x402_facilitator (OPEN — any origin)
  ├─ useWalletAuth Bearer → Growth API (owner-only, signature-validated)
  └─ fetch → comment_service (ALLOWED_ORIGINS whitelist)

x402_facilitator
  ├─ @x402 library → USDC contract (on-chain nonce enforcement)
  └─ viem → blockchain RPC (public)

scw_js
  ├─ Black Forest Labs API (bearer token)
  ├─ IONOS API (bearer token)
  ├─ Scaleway S3 (AWS SDK, access key)
  └─ requestImageUpdate() → GenImNFTv4 (must be whitelisted agent)
```

The weakest boundary is the x402 facilitator's open CORS — it is callable from any web page, meaning a malicious site could attempt to trigger settlement flows on behalf of a user who has approved USDC to the facilitator.
