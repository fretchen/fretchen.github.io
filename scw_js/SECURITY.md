# Security Policy

## Reporting a Vulnerability

Please **do not open a public GitHub issue** for security vulnerabilities.

Report privately via [GitHub Security Advisories](https://github.com/fretchen/fretchen.github.io/security/advisories/new). You will receive a response within 7 days.

---

## Scope

Serverless functions in `scw_js/`. See [../.github/THREAT_MODEL.md](../.github/THREAT_MODEL.md) for the full threat model, asset inventory, and blast radius analysis.

---

## Known Open Issues

Unfixed vulnerabilities are tracked privately via GitHub Security Advisories. The table below lists them without attack-vector detail.

| Function | Area | Severity | Status |
|---|---|---|---|
| `sc_llm` / `llm_service` | Pre-charge balance gate weaker than the settlement requirement | Medium | Open — tracked privately |
| `genimg_x402_token` | Resource delivered before payment settlement is confirmed | Medium | Open — tracked privately |

---

## Mitigations in Place

- Wallet authentication via signed-message bearer tokens with a bounded freshness window (`auth_utils.ts` — timestamped message, address match, signature verification)
- EIP-3009 nonce binding enforces recipient/amount on settlement (facilitator + Splitter), so a relayer cannot redirect funds
- Image metadata URLs validated against an allowlisted host before fetch (`genimg_x402_token.ts`)
- Secrets supplied via Scaleway secret env vars, never committed; CORS handled per-function
