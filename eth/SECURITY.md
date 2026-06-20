# Security Policy

## Reporting a Vulnerability

Please **do not open a public GitHub issue** for security vulnerabilities.

Report privately via [GitHub Security Advisories](https://github.com/fretchen/fretchen.github.io/security/advisories/new). You will receive a response within 7 days.

---

## Scope

Contracts in `eth/contracts/`. See [../.github/THREAT_MODEL.md](../.github/THREAT_MODEL.md) for the full threat model, asset inventory, and blast radius analysis.

---

## Known Open Issues

Unfixed vulnerabilities are tracked privately via GitHub Security Advisories. The table below lists accepted risks without attack-vector detail.

| Contract | Area | Severity | Status |
|---|---|---|---|
| `CollectorNFT.sol` | Reentrancy via `_safeMint` — price manipulation only, no fund theft | Medium | Open — tracked privately |
| All upgradeable | Upgrade gated by single EOA only, no timelock or multi-sig | Medium (governance) | Partially mitigated — see below |
| `SupportV2.sol` | Arbitrary `_token` address accepted in `donateToken()` | Low | Accepted — contract holds no funds |
| `LLMv1.sol` | `processBatch` CEI ordering (informational, not exploitable) | Informational | Accepted |

---

## Mitigations in Place

- **CVE-2025-11-26 fixed**: `requestImageUpdate()` requires `_whitelistedAgentWallets[msg.sender]`
- **Owner key separated** (2026-06): ownership of all contracts transferred from daily MetaMask wallet to a dedicated EOA (`0x1af51D6D7E0926f42d3595cBA2eE4218af5fBB20`). Reduces blast radius of a compromised daily wallet. Full fix remains moving to a Gnosis Safe.
- `SupportV2.donate()` and `donateToken()` use `ReentrancyGuardTransient` (OZ 5.x transient storage)
- Solidity 0.8.27 — built-in overflow/underflow protection
- Storage layout preserved across v3→v4 upgrade (gap 49 → 48 slots)
- Merkle proof replay protection in `LLMv1` via `processedBatches` mapping

---

## Known Fixed Vulnerabilities

| Reference | Contract | Description |
|---|---|---|
| CVE-2025-11-26 | `GenImNFTv3` | Unauthorized `requestImageUpdate()` — any caller could overwrite token URIs and drain contract funds at `mintPrice` per call. Fixed in `GenImNFTv4` with agent whitelist. |
