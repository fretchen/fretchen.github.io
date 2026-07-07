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

| Function                 | Area                                                           | Severity | Status                   |
| ------------------------ | -------------------------------------------------------------- | -------- | ------------------------ |
| `sc_llm` / `llm_service` | Pre-charge balance gate weaker than the settlement requirement | Medium   | Open — tracked privately |
| `genimg_x402_token`      | Resource delivered before payment settlement is confirmed      | Medium   | Open — tracked privately |
| S3 bucket `my-imagestore` | Anonymous bucket listing enabled (information disclosure)     | Low      | Open — see below         |

---

## Infrastructure Finding: Anonymous S3 Bucket Listing (2026-07-06)

**Finding:** The bucket `my-imagestore` (Scaleway Object Storage, `nl-ams`) allows anonymous `ListBucket`: `GET https://my-imagestore.s3.nl-ams.scw.cloud/?list-type=2` returns 200 and enumerates all object keys, including the private `growth-agent/` state prefix. Object *contents* are correctly protected (verified: `growth-agent/content_queue.json` returns 403 anonymously). Impact is limited to key-name disclosure — no secret content is exposed. No GHSA: this is an infrastructure configuration issue, not a vulnerability in shipped code.

**Write paths are already clean** — no code change is needed to keep future objects correct:

- Public assets (`images/`, `metadata/`) set `ACL: public-read` explicitly per object at upload (`image_service.ts`, `uploadToS3`). Public readability does not depend on the bucket ACL.
- Growth-agent state and merkle-tree writes set no ACL and default to private (`growth_service.ts`, `llm_service.ts`, `growth-agent/agent/storage.py`).

**Remediation** (single infra action, no code deploy; nothing in the repo relies on anonymous listing — the website only fetches direct object URLs, growth-agent lists with credentials):

```bash
aws s3api put-bucket-acl --bucket my-imagestore --acl private \
  --endpoint-url https://s3.nl-ams.scw.cloud
```

**Verification after the flip:**

```bash
# Listing must now be denied
curl -s -o /dev/null -w "%{http_code}" "https://my-imagestore.s3.nl-ams.scw.cloud/?list-type=2"   # expect 403
# Public objects must remain readable (per-object ACL is independent of the bucket ACL)
curl -s -o /dev/null -w "%{http_code}" "https://my-imagestore.s3.nl-ams.scw.cloud/metadata/metadata_0_01b0e48e5d91.json"  # expect 200
```

Then confirm in the browser that the NFT gallery renders and the Growth UI (authenticated) still works. Rollback, if ever needed: `put-bucket-acl --acl public-read`.

---

## Mitigations in Place

- Wallet authentication via signed-message bearer tokens with a bounded freshness window (`auth_utils.ts` — timestamped message, address match, signature verification)
- EIP-3009 nonce binding enforces recipient/amount on settlement (facilitator + Splitter), so a relayer cannot redirect funds
- Image metadata URLs validated against an allowlisted host before fetch (`genimg_x402_token.ts`)
- Secrets supplied via Scaleway secret env vars, never committed; CORS handled per-function
