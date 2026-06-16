# Security Policy

## Scope

The following components are in scope for security reports:

| Component | Description |
|---|---|
| `eth/` | Solidity smart contracts (GenImNFTv4, LLMv1, SupportV2, CollectorNFT, EIP3009SplitterV1) |
| `x402_facilitator/` | EIP-3009 USDC payment facilitator (serverless) |
| `scw_js/` | Image generation backend, Growth API |
| `website/` | Frontend (authentication, payment flows) |

Out of scope: third-party services (Black Forest Labs, IONOS, Scaleway infra), the `notebooks/` directory.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Use GitHub's private vulnerability reporting:
**[Submit a vulnerability report](https://github.com/fretchen/fretchen.github.io/security/advisories/new)**

Include:
- Which component is affected
- Steps to reproduce or a proof-of-concept
- Your assessment of severity and impact
- Whether you believe the issue is actively exploitable

## Response Commitment

- Acknowledgement within 48 hours
- Initial assessment within 7 days
- For critical on-chain vulnerabilities (contracts holding funds): treated as highest priority

## Known Fixed Vulnerabilities

| CVE / Reference | Component | Status |
|---|---|---|
| CVE-2025-11-26 | GenImNFTv3 — unauthorized `requestImageUpdate()` allowed anyone to drain contract funds and overwrite token URIs | Fixed in GenImNFTv4 (agent whitelist) |
