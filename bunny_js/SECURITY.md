# Security Policy

## Reporting a Vulnerability

Please **do not open a public GitHub issue** for security vulnerabilities.

Report privately via [GitHub Security Advisories](https://github.com/fretchen/fretchen.github.io/security/advisories/new). You will receive a response within 7 days.

---

## Scope

The bunny.net Edge Script twin of the `searchapi` seller: `bunny_js/` code, the deployed
script (id 97472, `bunnyjs-vlyol.bunny.run`), its script env, the GitHub Action
(`.github/workflows/deploy-bunny-js.yml`), and the bunny CLI credential on the dev machine.
See [../.github/THREAT_MODEL.md](../.github/THREAT_MODEL.md) for the asset inventory and
blast radius — the bunny surface has its own rows there (assets, blast radius, trust
boundary, 2026-10-18 audit).

---

## Known Open Issues

| Area                                       | Severity | Status                                                                                   |
| ------------------------------------------ | -------- | ---------------------------------------------------------------------------------------- |
| Deploy-key blast radius                    | Medium   | Bounded — trigger hygiene (push-to-main only) + rotate-on-suspicion; see THREAT_MODEL §2 |
| Deployed-runtime SigV4 + DNS verification  | Low      | Pending — local Deno PASS; both failure branches verified fail-closed; see below         |
| Undici-specific error matching on the edge | Low      | Watch item — unreachable hosts may 500 instead of 400 on bunny's runtime; see below      |
| `.env` copy drift vs `scw_js/.env`         | Low      | Accepted for the trial — the two secret sets must be rotated/copied together             |

**Deployed-runtime verification (2026-10-18 audit).** `node:crypto` (SigV4) and
`node:dns/promises` (the `/fetch` SSRF defence) are unverified on bunny's Deno 1.x — the
runtime version is not selectable and differs from local Deno 2. Code paths were verified
fail-closed in both directions: a module-level import failure takes the whole script down
(no SSRF window), and a per-call `lookup` throw refuses the fetch with a 400. A deployed
probe was prepared to prove both, then removed undeployed after the audit flagged its
unauthenticated design (CWE-306); **the first paid `/fetch` trial doubles as the runtime
verification** — a 200 proves DNS resolved on the isolate, and any charge landing in the
channel store proves SigV4 signed correctly.

**Undici-specific error matching.** `web_fetch_service.ts`'s `asUnreachable` matches Node's
undici error shapes (`TypeError` + `"fetch failed"`). On bunny's runtime, connection
failures will likely not match and surface as a generic 500 instead of the intended 400.
Safety is unaffected (the channel lock is released and nothing is settled); broaden the
matcher with Deno's error shapes on first observation, not speculatively.

---

## Fixed / Verified (2026-10-18 audit)

- The unauthenticated S3-probe design was removed rather than deployed. If a deployed probe
  is ever needed again, it must require a `PROBE_TOKEN` secret checked against the
  `x-probe-token` header.
- CDN replay of paid responses: the twin sends `Cache-Control: no-store` on every response;
  the platform normalizes it to `no-cache`, and the responses carry no validators, so every
  hit revalidates at origin — a paid 200 with its `Payment-Response` receipt cannot be
  replayed to another caller. Verified live (`cdn-cache: MISS` on repeats).
- Non-latin1 header bytes: the raw-JSON `X-Payment`/`X-Payment-Response` headers are escaped
  as JSON `\uXXXX` at the conversion layer — lossless for any JSON-parsing client.
- Deployed env classification verified: 5 plain (public or inert values), 4 secret; no
  buyer key or RPC URLs on the server; `TEST_WALLET_PRIVATE_KEY` never uploaded.
- The DNS-rebinding acceptance from `scw_js` holds more comfortably on the edge: a CDN PoP
  has no cloud metadata service, and the private-range block is enforced identically.
- Repo hygiene: `.env` untracked and gitignored in both packages; tracked files contain only
  published test keys, public addresses, and the public ownership proof.

---

## Mitigations in Place

- Same payment cryptography as the Scaleway sellers (port verbatim): EIP-712-bound channel
  charges, settle-after-success, lock release on upstream failure, mainnet-only search,
  per-route fixed prices
- The full SSRF defence of `scw_js/web_fetch_service.ts` ported unchanged (scheme rule,
  resolved-address allowlist, per-hop redirect re-validation, body cap, content-type filter,
  timeout)
- No owner or buyer credentials in the script env; the receiver is a public address
- Workflow: `permissions: contents: read`, push-to-`main`-only triggers, path-filtered —
  fork PRs cannot reach the deploy key
- Bunny CLI credential stored mode 600 (`~/.config/bunnynet.json`)
