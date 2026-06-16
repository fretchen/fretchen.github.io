# Smart Contract Security Findings

Covers contracts in `eth/contracts/`. Last reviewed against commit `32e91e8e` (OZ 5.6 upgrade).

See [../.github/THREAT_MODEL.md](../.github/THREAT_MODEL.md) for the full threat model, asset inventory, and blast radius analysis.

---

## Open Issues

| Contract | Function | Issue | Severity |
|---|---|---|---|
| `CollectorNFT.sol` | `mintCollectorNFT()` | `_safeMint` triggers `onERC721Received` before `mintCountPerGenImToken` is incremented — allows price manipulation via reentrancy | Medium |
| All upgradeable | `_authorizeUpgrade()` | Only `onlyOwner`; no timelock or multi-sig — leaked owner key = immediate upgrade of all contracts | Medium (governance) |
| `SupportV2.sol` | `donateToken()` | Accepts arbitrary `_token` address; caller can pass a malicious contract | Low (contract holds no funds) |
| `LLMv1.sol` | `processBatch()` | `processedBatches[merkleRoot] = true` set after provider payments — technically violates CEI | Informational |

### CollectorNFT — reentrancy via `_safeMint`

`_safeMint` calls `onERC721Received` on the recipient if it is a contract. At that point, `mintCountPerGenImToken[genImTokenId]` has not yet been incremented, so `getCurrentPrice()` returns the pre-increment value. An attacker deploys a receiver contract whose callback re-enters `mintCollectorNFT()` for the same `genImTokenId`, paying base price for mints that should cost 2×, 4×, etc.

Impact: price manipulation, not fund theft. Does not merit a CVE.

Fix: move `mintCountPerGenImToken[genImTokenId]++` and `collectorTokensByGenImToken[genImTokenId].push(collectorTokenId)` to before the `_safeMint` call, or add `nonReentrant` from `ReentrancyGuardTransient` (same import already used in `SupportV2`).

### Upgrade path — single owner EOA

`_authorizeUpgrade()` is gated only by `onlyOwner` across all five upgradeable contracts. A compromised owner key gives an attacker immediate control over all contract logic with no delay. This is the highest-impact risk in the system — see the blast radius table in the threat model.

Fix: transfer ownership to a Gnosis Safe, or insert a `TimelockController` between the owner and the upgrade call.

### LLMv1 — `processBatch` CEI ordering

`processedBatches[merkleRoot] = true` is set after the provider payment loop. This is not exploitable: all user balances are deducted in the first pass before any payments are made, so a reentrant call with the same `merkleRoot` would fail `InsufficientBalance`. Noted for correctness.

---

## Confirmed Safe (Previously Questioned)

| Contract | Function | Why it is safe |
|---|---|---|
| `GenImNFTv4.sol` | `requestImageUpdate()` | CEI correct: `_imageUpdated[tokenId] = true` before payment. Reentrant call reverts on `ImageAlreadyUpdated`. |
| `LLMv1.sol` | `withdrawBalance()` | CEI correct: `llmBalance[msg.sender] -= amount` before payment. Reentrant call reverts on `InsufficientBalance`. |

---

## Mitigations in Place

- CVE-2025-11-26 fixed: `requestImageUpdate()` requires `_whitelistedAgentWallets[msg.sender]`
- `SupportV2.donate()` and `donateToken()` use `ReentrancyGuardTransient` (OZ 5.x transient storage)
- Solidity 0.8.27 — built-in overflow/underflow protection
- Storage layout preserved across v3→v4 upgrade (gap 49 → 48 slots)
- Merkle proof replay protection in `LLMv1` via `processedBatches` mapping

---

## Known Fixed Vulnerabilities

| Reference | Contract | Description |
|---|---|---|
| CVE-2025-11-26 | `GenImNFTv3` | Unauthorized `requestImageUpdate()` — any caller could overwrite token URIs and drain contract funds at `mintPrice` per call. Fixed in `GenImNFTv4` with agent whitelist. |
