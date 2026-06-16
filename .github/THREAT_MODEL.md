# Threat Model

Last updated: 2026-06-16

## Priority Order

Risk priority differs from naive surface-area intuition:

**eth/ > x402_facilitator/ > website/**

- `website/` is mostly a client-side React app. Sensitive operations (wallet signing, contract calls) run in the user's browser — blast radius is the individual user, not the system.
- `eth/` contracts hold real ETH and control token URIs. Unguarded ETH transfers in production code are systemic risk.
- `x402_facilitator/` is the USDC settlement engine. It is Internet-facing with overly permissive CORS.

---

## 1. Smart Contracts (eth/)

### Open Issues

| Contract | Function | Issue | Severity |
|---|---|---|---|
| `GenImNFTv4.sol` | `requestImageUpdate()` | No reentrancy guard; pays `msg.sender` after state change | High |
| `LLMv1.sol` | `withdrawBalance()` | No reentrancy guard; ETH transferred after balance deduction | Medium |
| `LLMv1.sol` | `processBatch()` | Multiple ETH transfers in loop, no guard | Medium |
| `CollectorNFT.sol` | `mintCollectorNFT()` | Two ETH transfers (owner then refund) with no guard | Medium |
| All upgradeable | `_authorizeUpgrade()` | Only `onlyOwner`; no timelock or multi-sig — leaked key = contract takeover | High |
| `SupportV2.sol` | `donateToken()` | Accepts arbitrary `_token` address; attacker could pass malicious ERC-20 | Medium |

### Mitigations in Place

- CVE-2025-11-26 fixed: `requestImageUpdate()` in v4 requires `_whitelistedAgentWallets[msg.sender]`
- `SupportV2.donate()` and `donateToken()` are protected with `ReentrancyGuardTransient`
- Storage layout preserved correctly across v3→v4 upgrade (gap adjusted from 49 to 48 slots)
- Merkle proof replay protection in `LLMv1.processBatch()` via `processedMerkleRoots` mapping
- Solidity 0.8+ provides built-in overflow/underflow protection

### Recommended Fixes

1. Add `nonReentrant` to `GenImNFTv4.requestImageUpdate()`, `LLMv1.withdrawBalance()`, `LLMv1.processBatch()`, `CollectorNFT.mintCollectorNFT()` — same pattern as `SupportV2`.
2. Move contract ownership to a Gnosis Safe or add a `TimelockController` before the upgrade path.
3. Whitelist accepted token addresses in `SupportV2.donateToken()` to known USDC contract addresses.

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
