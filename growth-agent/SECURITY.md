# Security Policy

## Reporting a Vulnerability

Please **do not open a public GitHub issue** for security vulnerabilities.

Report privately via [GitHub Security Advisories](https://github.com/fretchen/fretchen.github.io/security/advisories/new). You will receive a response within 7 days.

---

## Scope

The `growth-agent/` cron container and its interaction with `S3Storage`/`registry_clean.json` state and the website's Growth UI. See [../.github/THREAT_MODEL.md](../.github/THREAT_MODEL.md) for the full threat model, asset inventory, and blast radius analysis.

---

## Known Open Issues

Unfixed issues are tracked privately via GitHub Security Advisories where warranted. The table below lists accepted risks without attack-vector detail.

| Area | Description | Severity | Status |
|---|---|---|---|
| `agent/page_meta.py` `fetch_pages_meta()` | No scheme/host allowlist on outbound fetches. URLs originate from `registry_clean.json`, which is populated from `sitemap.xml` on the agent's own hardcoded domain (`agent/nodes/plan.py`) — no untrusted-input path today. Would become exploitable (SSRF, e.g. cloud metadata endpoint) only if the sitemap/build pipeline were separately compromised. | Low | Accepted — missing defense-in-depth, not currently reachable by an attacker |

---

## Mitigations in Place

- `registry_clean.json` is only written by the agent's own ingest process (S3/local state, not externally writable).
- `sitemap.xml` is generated at build time from the site's own static output, with every URL same-origin by construction (`website/utils/generateSitemap.ts`).
- Growth admin UI (`/growth`) mutating actions (`approveDraft`, `rejectDraft`, `updateDraft`) are gated server-side in `scw_js/growth_service.ts` via wallet-signature ownership verification.
