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

| Function                  | Area                                                           | Severity | Status                          |
| ------------------------- | -------------------------------------------------------------- | -------- | ------------------------------- |
| `sc_llm` / `llm_service`  | Pre-charge balance gate weaker than the settlement requirement | Medium   | Open — tracked privately        |
| `genimg_x402_token`       | Resource delivered before payment settlement is confirmed      | Medium   | Open — tracked privately        |
| S3 bucket `my-imagestore` | Anonymous bucket listing enabled (key-name disclosure)         | Low      | Accepted / deferred — see below |

---

## Infrastructure Finding: Anonymous S3 Bucket Listing (2026-07-06, updated 2026-07-07)

**Finding:** The bucket `my-imagestore` (Scaleway Object Storage, `nl-ams`) allows anonymous `ListBucket`: `GET https://my-imagestore.s3.nl-ams.scw.cloud/?list-type=2` returns 200 and enumerates all object keys, including the private `growth-agent/`, `comments/`, and `terraform/` prefixes. Object _contents_ are correctly protected (verified: `growth-agent/content_queue.json` and `terraform/*.tfstate` return 403 anonymously). Impact is limited to **key-name disclosure** — no secret content is exposed. No GHSA: this is an infrastructure configuration issue, not a vulnerability in shipped code.

**Not a finding — `merkle/trees.json` is public by design.** An earlier draft of this note flagged the merkle tree as a content leak. That was incorrect. Its leaves (`{user, tokenCount, cost, timestamp, …}`) are already public: they are posted on-chain as `LLMv1.processBatch` calldata and served by the `leafhistory` endpoint. Only the merkle _root_ is a commitment. The write paths in `llm_service.ts` now set `ACL: public-read` deterministically, matching the [README data classification](./README.md). No user data is exposed that isn't already public.

**Write paths are correct** — each object's ACL matches its classification:

- Public assets (`images/`, `metadata/`) and `merkle/trees.json` set `ACL: public-read` explicitly per object (`image_service.ts` `uploadToS3`; `llm_service.ts` merkle writes).
- Growth-agent state and comment-service writes set no ACL and default to private (`growth_service.ts`, `growth-agent/agent/storage.py`).

**Status: accepted low-severity risk.** The only residual exposure is enumeration of private _key names_ (e.g. growth-agent operational cadence from log filenames). Deferred, not fixed. If closed later, the single infra action is:

```bash
aws s3api put-bucket-acl --bucket my-imagestore --acl private \
  --endpoint-url https://s3.nl-ams.scw.cloud
# verify: listing denied, public objects still readable (per-object ACL is independent of bucket ACL)
curl -s -o /dev/null -w "%{http_code}" "https://my-imagestore.s3.nl-ams.scw.cloud/?list-type=2"   # expect 403
curl -s -o /dev/null -w "%{http_code}" "https://my-imagestore.s3.nl-ams.scw.cloud/metadata/metadata_0_01b0e48e5d91.json"  # expect 200
```

Nothing in the repo relies on anonymous listing (the website fetches direct object URLs; growth-agent lists with credentials), so the flip is safe whenever desired.

---

## Mitigations in Place

- Wallet authentication via signed-message bearer tokens with a bounded freshness window (`auth_utils.ts` — timestamped message, address match, signature verification)
- EIP-3009 nonce binding enforces recipient/amount on settlement (facilitator + Splitter), so a relayer cannot redirect funds
- Image metadata URLs validated against an allowlisted host before fetch (`genimg_x402_token.ts`)
- Secrets supplied via Scaleway secret env vars, never committed; CORS handled per-function
