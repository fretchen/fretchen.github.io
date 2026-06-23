# CVE Triage Guide

Threat-model-driven process for deciding which Dependabot alerts require action. Takes ~10 minutes per alert. Operationalized as the `/cve-triage` skill.

Reference: [THREAT_MODEL.md](THREAT_MODEL.md)

---

## Step 1 — Classify the Package Tier

Look up the manifest path and package name in the tier table below. Most triage decisions end here.

| Tier | Description | Action threshold |
|------|-------------|-----------------|
| **T1 — Critical serverless** | Production runtime code that handles private key signing, on-chain writes, or USDC settlement | Patch within 48 h |
| **T2 — Frontend production** | Code deployed to public website (worst case: XSS, wallet phishing) | Patch within 1 week |
| **T3 — Production infra** | Runtime deps not in trust-boundary hot paths (logging, S3, env loading) | Patch in next release |
| **T4 — Build / dev only** | devDependencies, build tools, local notebooks — never deployed | Defer; include in next scheduled dep update |

### Package Tier Assignments

| Package | Context | Tier |
|---------|---------|------|
| `viem` | scw_js / x402_facilitator prod dep | **T1** |
| `@x402/core`, `@x402/evm` | x402_facilitator prod dep | **T1** |
| `@openzeppelin/contracts-upgradeable` | on-chain (deployed bytecode, not runtime dep) | **T1** |
| `@fretchen/chain-utils` | scw_js / x402_facilitator prod dep | **T1** |
| `viem` | website prod dep | **T2** |
| `wagmi`, `@tanstack/react-query` | website prod dep | **T2** |
| `mermaid` | website prod dep | **T2** |
| `@openzeppelin/merkle-tree` | website prod dep | **T2** |
| `@aws-sdk/client-s3` | scw_js prod dep | **T3** |
| `pino` | scw_js / x402_facilitator prod dep | **T3** |
| `dotenv` | serverless prod dep | **T3** |
| `undici` | transitive dep in `eth/` (Hardhat) | **T4** |
| `vite`, `vitest`, `tsup`, `eslint`, `typescript` | devDependencies everywhere | **T4** |
| `hardhat` and all `@nomicfoundation/*` | `eth/` devDependencies | **T4** |
| `jupyterlab`, `jupyter-server` | `notebooks/` local only | **T4** |
| `growth-agent` pip deps | cron container, no public surface | **T4** |

**Rule for unlisted packages:** check the manifest path. If it is `eth/*`, `notebooks/*`, or the package only appears in `devDependencies` of any `package.json` → T4.

---

## Step 2 — Apply the Decision Tree

Only needed when tier alone is not enough (T1/T2 alerts, or a T3 alert with integrity impact).

```
1. Is the manifest path eth/*, notebooks/*, or growth-agent/* (pip)?
   → T4. Defer. Done.

2. Is the package only in devDependencies of every package.json that declares it?
   → T4. Defer. Done.

3. What is the CVSS impact type?
   ├─ Integrity (data corruption, code execution, spoofing)
   │   → Apply tier threshold. Escalate one tier if package is T1/T2.
   ├─ Availability (DoS, memory exhaustion)
   │   → Is there a realistic attack vector from an untrusted caller?
   │     Yes → apply tier threshold.
   │     No (e.g., attacker must be your RPC provider) → defer.
   └─ Confidentiality only
       → Low project risk (most code and transactions are public). Defer to next release.

4. Is the vulnerable code path reachable from your trust boundaries?
   - Is the exploit triggered by user-controlled input that flows through this package?
   - Example: HTTP header injection → does untrusted input reach HTTP request headers?
   - If not reachable → defer regardless of tier.
```

---

## Step 3 — Decision and Action

| Tier + Analysis | Decision |
|----------------|----------|
| T1, reachable, integrity/financial asset | **Patch now. Block deploy.** |
| T1, reachable, availability only, realistic vector | Patch within 48 h |
| T1, not reachable or unrealistic attack vector | Defer to next release |
| T2, reachable, integrity | Patch within 1 week |
| T2, availability/confidentiality only | Defer to next release |
| T3 any | Defer to next release |
| T4 any | Add to scheduled dep update; dismiss alert with reason |
| Any tier, CVSS ≤ 4.0 | Defer unless T1 + reachable |

---

## CIA Alignment (from threat model)

**Integrity dominates.** Confidentiality is low priority (code and transactions are public). Availability is tolerated on L2.

When assessing impact, ask: "Could this allow an attacker to corrupt on-chain state, redirect USDC, or tamper with NFT metadata?" If yes → treat as highest priority regardless of tier.

---

## Worked Example — `ws` (HIGH) in x402_facilitator

- **Manifest:** `x402_facilitator/package-lock.json`
- **CVE summary:** Memory exhaustion DoS from tiny WebSocket fragments
- **Step 1:** `ws` is not in `x402_facilitator/dependencies` → it is a transitive dep of `viem` (T1 package). But ws acts as a *client* (viem connects outbound to RPC providers), not a server. The DoS requires the RPC provider to send malicious frames.
- **Step 2:** Availability impact only. Realistic attack vector? No — requires a compromised Alchemy/RPC endpoint (supply chain attack, not external caller).
- **Step 3:** T1 parent but not reachable from untrusted callers → **Defer to next release.**
