# Proposal: Public x402 Facilitator with Fee-Based Access

**Status:** Draft
**Date:** 2026-02-06
**Author:** fretchen
**Related:** [x402 #937](https://github.com/coinbase/x402/issues/937), [x402 #899 (0xmeta)](https://github.com/coinbase/x402/pull/899), [x402 #1087 (split scheme spec)](https://github.com/coinbase/x402/pull/1087)

## Problem Statement

Our x402 facilitator currently only serves **whitelisted recipients** (GenImNFTv4/LLMv1 NFT holders + manual whitelist). This means:

- External developers cannot use our facilitator for their own x402-enabled services
- The facilitator has no revenue model beyond serving our own services
- We cannot contribute to the x402 ecosystem as a public facilitator

**Goal:** Open the facilitator to **any merchant** who wants to accept USDC payments via x402, charging a per-transaction fee to sustain operations.

## Current Architecture

```
┌──────────────────────────────────────────────────────────┐
│  facilitator_instance.js                                  │
│                                                           │
│  createFacilitator()                                      │
│    ├── ExactEvmScheme per network (eip155:10, eip155:8453)│
│    └── onAfterVerify() → isAgentWhitelisted()            │
│         ├── Manual whitelist (env var)                     │
│         ├── Test wallets (Sepolia only)                    │
│         ├── GenImNFTv4.isAuthorizedAgent()                │
│         └── LLMv1.isAuthorizedAgent()                     │
│                                                           │
│  Reject if: recipient NOT in any whitelist source          │
└──────────────────────────────────────────────────────────┘
```

**Key constraint:** The `onAfterVerify` hook in `facilitator_instance.js` (line ~170) rejects any `payTo` address that isn't whitelisted. This is the gate we need to open.

## TypeScript Migration Strategy

The facilitator is currently a **mixed JS/TS** codebase. Only `x402_facilitator.ts` and its test are TypeScript. All other modules (`x402_settle.js`, `x402_verify.js`, `x402_supported.js`, `facilitator_instance.js`, `x402_whitelist.js`, `chain_utils.js`) and their tests remain JavaScript.

**Goal:** As part of this implementation, migrate to **TypeScript throughout**. New code is written in TypeScript, and modified files are migrated during modification.

### Current State

| File | Language | Action |
|---|---|---|
| `x402_facilitator.ts` | ✅ TS | Already migrated |
| `x402_settle.js` | ❌ JS | **Migrate → `.ts`** (modified for fee collection) |
| `x402_verify.js` | ❌ JS | **Migrate → `.ts`** (modified for fee status passthrough) |
| `x402_supported.js` | ❌ JS | **Migrate → `.ts`** (modified for fee discovery) |
| `facilitator_instance.js` | ❌ JS | **Migrate → `.ts`** (modified for dual auth model) |
| `x402_whitelist.js` | ❌ JS | **Migrate → `.ts`** (unchanged logic, but dependency of modified files) |
| `chain_utils.js` | ❌ JS | **Migrate → `.ts`** (adding ERC-20 ABI types) |
| `x402_splitter_*.js` | ❌ JS | Migrate separately (not in scope for this proposal) |
| `eslint.config.js` | JS | Keep as JS (config file) |
| `vitest.config.js` | JS | Keep as JS (config file) |
| `tsup.config.js` | JS | Keep as JS (config file) |

### Tooling Changes Required

1. **`tsconfig.json`** — Expand `include` from `["*.ts"]` to `["*.ts", "test/**/*.ts"]`
2. **`eslint.config.js`** — Add `typescript-eslint` parser + rules for `**/*.ts` files (alongside existing JS rules for remaining config files)
3. **`package.json`** — Add `typescript` + `typescript-eslint` to devDependencies
4. **`tsup.config.js`** — Update entry points from `.js` to `.ts` (splitter entry stays `.js` until migrated separately)
5. **`vitest.config.js`** — No change needed (Vitest handles `.ts` natively)

## Proposed Approach: Post-Settlement Fee via ERC-20 `transferFrom`

Following the 0xmeta.ai pattern (merged in [x402 #899](https://github.com/coinbase/x402/pull/899)), which was accepted by the x402 maintainers as a pragmatic solution while the spec evolves.

### Why This Approach (Not Splitter)

| Approach | Status | Pros | Cons |
|---|---|---|---|
| **Post-settlement `transferFrom`** | ✅ Works today | No smart contract, standard ERC-20, accepted by x402 maintainers | Requires merchant trust, two txs per settlement |
| **Atomic splitter** ([#937](https://github.com/coinbase/x402/issues/937)) | 🔄 Spec in progress | Trustless, atomic, on-chain enforcement | x402 spec not ready ([#1087](https://github.com/coinbase/x402/pull/1087) under review), needs client-side changes |
| **Separate x402 tx** (PayAI model) | 🔄 Proposed | No spec changes | Credit/account relationship, pre-funding |

The splitter approach (our own [#937](https://github.com/coinbase/x402/issues/937) proposal) is the long-term goal, but x402 hasn't standardized fee support yet. The `transferFrom` approach lets us launch now.

### Payment Flow

```
┌───────┐       ┌──────────┐       ┌─────────────┐       ┌──────────┐
│ Client│       │ Merchant │       │ Facilitator │       │ Optimism │
│       │       │ (Server) │       │ (us)        │       │ / Base   │
└───┬───┘       └────┬─────┘       └──────┬──────┘       └────┬─────┘
    │                │                     │                    │
    │  ONE-TIME SETUP (merchant)           │                    │
    │                │  USDC.approve(       │                    │
    │                │    facilitator, N)───┼───────────────────►│
    │                │                     │                    │
    │  PER REQUEST                         │                    │
    │  GET /resource │                     │                    │
    │───────────────►│                     │                    │
    │  402 + payTo:  │                     │                    │
    │  merchantAddr  │                     │                    │
    │◄───────────────│                     │                    │
    │                │                     │                    │
    │  EIP-3009 auth to merchantAddr       │                    │
    │─────────────────────────────────────►│                    │
    │                │                     │                    │
    │                │                     │ 1. transferWith    │
    │                │                     │    Authorization(  │
    │                │                     │    client→merchant)►│
    │                │                     │                    │
    │                │                     │ 2. transferFrom(   │
    │                │                     │    merchant,       │
    │                │                     │    facilitator,    │
    │                │                     │    fee)────────────►│
    │                │                     │                    │
    │  200 OK + data │                     │                    │
    │◄───────────────│◄────────────────────│                    │
    └                └                     └                    └
```

**Key points:**
- Client authorizes payment to **merchant's address** (not facilitator)
- Settlement executes **first**: `transferWithAuthorization(client → merchant)`
- Fee is collected **after** successful settlement: `transferFrom(merchant → facilitator)`
- If settlement fails → no fee is collected (merchant only pays for successful settlements)
- If fee collection fails after settlement → log warning, flag for retry (settlement already completed)

### Fee Structure

| Parameter | Value | Notes |
|---|---|---|
| Fee amount | **0.01 USDC** (10,000 wei) | Configurable via `FACILITATOR_FEE_AMOUNT` env var |
| Minimum approval | 0.01 USDC (1 settlement) | Merchant controls |
| Recommended approval | 100 USDC (10,000 settlements) | Standard ERC-20 approve |
| Fee recipient | Facilitator signer wallet | Same as `FACILITATOR_WALLET_PRIVATE_KEY` — simplifies gas management |
| Fee timing | **Post-settlement** | Fee only collected after successful settlement |

## Implementation Plan

### Phase 0: TypeScript Migration

Before implementing fee logic, migrate existing JS modules to TypeScript. This ensures all new code integrates cleanly with typed imports and avoids mixed-language friction.

**Order of migration** (dependencies first):
1. `chain_utils.js` → `chain_utils.ts` (no internal dependencies)
2. `x402_whitelist.js` → `x402_whitelist.ts` (depends on chain_utils)
3. `facilitator_instance.js` → `facilitator_instance.ts` (depends on whitelist)
4. `x402_verify.js` → `x402_verify.ts` (depends on facilitator_instance)
5. `x402_supported.js` → `x402_supported.ts` (depends on facilitator_instance)
6. `x402_settle.js` → `x402_settle.ts` (depends on verify + facilitator_instance)
7. Migrate corresponding test files to `.test.ts`
8. Update `tsconfig.json`, `eslint.config.js`, `tsup.config.js`, `package.json`

**Migration approach:** Strict TypeScript from the start — `strict: true` is already set in `tsconfig.json`. Add explicit types for all function signatures, use Viem's built-in types (`Address`, `Hash`, `Chain`), and export typed interfaces where modules are consumed by others.

### Phase 1: Core Fee Logic

#### 1.1 New Module: `x402_fee.ts`

```typescript
// x402_fee.ts
export interface FeeResult {
  success: boolean;
  txHash?: `0x${string}`;
  error?: string;
}

export interface AllowanceInfo {
  allowance: bigint;
  remainingSettlements: number;
  sufficient: boolean;
}

export function collectFee(merchantAddress: `0x${string}`, network: string): Promise<FeeResult>;
export function checkMerchantAllowance(merchantAddress: `0x${string}`, network: string): Promise<AllowanceInfo>;
export function getFeeAmount(): bigint; // from FACILITATOR_FEE_AMOUNT env, default 10000n
// Facilitator address derived from FACILITATOR_WALLET_PRIVATE_KEY
```

**Responsibilities:**
- Call `USDC.transferFrom(merchant, facilitator, feeAmount)` on the correct network
- Check merchant's remaining allowance before verify (to give early feedback)
- Return typed error messages for insufficient allowance
- Fee amount configurable via `FACILITATOR_FEE_AMOUNT` env var (default: `10000` = 0.01 USDC)

#### 1.2 Migrate & Modify `facilitator_instance.js` → `facilitator_instance.ts` (Dual Authorization Model)

Change the `onAfterVerify` hook from "reject non-whitelisted" to "whitelist OR paid":

```
onAfterVerify():
  ├── Is recipient whitelisted? → ✅ Pass (no fee, backwards compatible)
  └── Not whitelisted?
      └── Check merchant has sufficient USDC allowance for fee
          ├── Yes → ✅ Mark as "fee_required" (collect at settle time)
          └── No  → ❌ Reject with "insufficient_fee_allowance"
```

**Critical:** Fee collection happens at **settle time**, not verify time. Verify only checks that fee collection is *possible*.

#### 1.3 Migrate & Modify `x402_settle.js` → `x402_settle.ts` (Post-Settlement Fee Collection)

```
settlePayment():
  ├── Verify payment (existing)
  ├── Execute transferWithAuthorization (existing)
  │   └── Settlement failed? → Return error (NO fee collected)
  ├── Settlement succeeded?
  │   ├── Is this a fee-required settlement?
  │   │   ├── Yes → collectFee(merchant, network)
  │   │   │   ├── Success → Return success + fee txHash in extensions
  │   │   │   └── Failure → Return success (settlement done) + log fee failure
  │   │   └── No → Return success (whitelisted, no fee)
  │   └── Done
```

**Key design decision:** Settlement-first, fee-second. The merchant's customer always gets served. If fee collection fails (e.g., allowance exhausted mid-batch), we log it and can retry or flag the merchant. This is fairer than pre-settlement fee and eliminates the refund problem entirely.

### Phase 2: Discovery & Merchant Onboarding

#### 2.1 Update `/supported` Endpoint

Add fee information to the response:

```json
{
  "kinds": [...],
  "extensions": [
    {
      "name": "recipient_whitelist",
      "description": "Whitelisted recipients (free, no fee)",
      "contracts": { ... }
    },
    {
      "name": "facilitator_fee",
      "description": "Public access with per-transaction fee",
      "fee": {
        "amount": "10000",
        "asset": "USDC",
        "decimals": 6,
        "description": "0.01 USDC per settlement",
        "collection": "post_settlement_transferFrom",
        "recipient": "0x..."  // facilitator signer address
      },
      "setup": {
        "description": "One-time USDC approval required",
        "function": "approve(address spender, uint256 amount)",
        "spender": "0x...",
        "recommended_amount": "100000000"
      }
    }
  ]
}
```

#### 2.2 Merchant Setup Scripts (Documentation/Tools)

Provide scripts or documentation for merchants:
- `approve-facilitator.mjs` — One-time USDC approval script
- `check-allowance.mjs` — Monitor remaining settlements

### Phase 3: Testing & Deployment

#### 3.1 Test Plan

| Test | Description | File |
|---|---|---|
| Fee collection unit tests | Mock USDC.transferFrom, test success/failure | `test/x402_fee.test.ts` |
| Dual auth model tests | Whitelisted passes without fee, non-whitelisted requires fee | `test/facilitator_instance.test.ts` |
| Settlement with fee tests | Settlement executes first, fee collected after success | `test/x402_settle.test.ts` |
| E2E Sepolia test | Full flow with real USDC on Optimism Sepolia | Manual |
| Supported endpoint tests | Fee info included in response | `test/x402_supported.test.ts` |

#### 3.2 Deployment Steps

1. Deploy to Optimism Sepolia first (testnet)
2. Test with internal wallets as "external merchant"
3. Verify post-settlement fee collection flow (settlement-first, fee-second)
4. Deploy to Optimism Mainnet + Base Mainnet
5. Update documentation and README

### Phase 4: Migration Path to Splitter (Future)

Once x402 [#937](https://github.com/coinbase/x402/issues/937) / [#1087](https://github.com/coinbase/x402/pull/1087) is resolved:

1. Deploy EIP3009SplitterV1 on mainnet (already on Sepolia: `0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946`)
2. Add `exact-split` scheme alongside `exact`
3. Merchants can choose: `transferFrom` fee (simple) or atomic splitter (trustless)
4. Eventually deprecate `transferFrom` approach

## Files to Create/Modify

### New Files (TypeScript)

| File | Description |
|---|---|
| `x402_fee.ts` | Fee collection logic with typed interfaces (transferFrom, allowance check) |
| `test/x402_fee.test.ts` | Fee module tests |

### Migrate JS → TS + Modify

| Old File | New File | Description |
|---|---|---|
| `facilitator_instance.js` | `facilitator_instance.ts` | Dual auth model: whitelist OR fee-approved |
| `x402_settle.js` | `x402_settle.ts` | Post-settlement fee collection |
| `x402_supported.js` | `x402_supported.ts` | Add fee info to /supported |
| `x402_verify.js` | `x402_verify.ts` | Pass fee status through to settle |
| `x402_whitelist.js` | `x402_whitelist.ts` | Type-safe whitelist (logic unchanged) |
| `chain_utils.js` | `chain_utils.ts` | Add ERC-20 ABI types |
| `test/x402_settle.test.js` | `test/x402_settle.test.ts` | Migrate tests |
| `test/x402_verify.test.js` | `test/x402_verify.test.ts` | Migrate tests |
| `test/x402_supported.test.js` | `test/x402_supported.test.ts` | Migrate tests |
| `test/x402_whitelist.test.js` | `test/x402_whitelist.test.ts` | Migrate tests |

### Modify Only (already TS or config)

| File | Action | Description |
|---|---|---|
| `x402_facilitator.ts` | **Update imports** | Change `.js` imports to `.ts` module references |
| `@fretchen/chain-utils` | **Minor** | Add ERC-20 ABI (transferFrom, allowance, approve) |
| `tsconfig.json` | **Expand** | Include `test/**/*.ts` |
| `eslint.config.js` | **Add TS rules** | Add `typescript-eslint` parser for `.ts` files |
| `tsup.config.js` | **Update entries** | Change `.js` entry points to `.ts` |
| `package.json` | **Add deps** | `typescript`, `typescript-eslint` devDependencies |
| `README.md` | **Update** | Document public access, fee structure, TS migration |

## Trust Model & Security Considerations

### What the Merchant Trusts

1. We only collect the advertised fee (0.01 USDC) per settlement
2. We don't drain the full approved amount at once
3. We execute the customer's payment first, then collect our fee — merchant's customer always gets served

### Merchant Controls

| Control | Mechanism |
|---|---|
| Limit exposure | Approve only small amounts (e.g., 1 USDC = 100 settlements) |
| Revoke anytime | `USDC.approve(facilitatorAddress, 0)` |
| Monitor on-chain | All `transferFrom` calls are public on Etherscan/Basescan |
| Stop using | Just stop sending settlements; allowance sits unused |

### Risk Mitigations

| Risk | Mitigation |
|---|---|
| Facilitator drains full allowance | Merchant limits approval amount; all txs auditable on-chain |
| Settlement succeeds but fee fails | Log for retry; merchant served their customer regardless. Flag merchant for re-approval if persistent |
| Merchant revokes allowance mid-use | Verify checks allowance at verify time; if allowance = 0 at settle time, settlement still completes but fee is logged as failed |
| Nonce conflicts on fee tx | Use nonce management similar to genimg_x402_token.js retry pattern |
| Free-riding (settlement without fee) | Post-settlement model means brief free-riding possible if allowance exhausted. Mitigated by verify-time allowance check and merchant flagging |

## Design Decisions

### ✅ Resolved Questions

1. **Treasury address = facilitator signer** — Same wallet (`FACILITATOR_WALLET_PRIVATE_KEY`). Simplifies gas management, avoids multi-wallet coordination. Separating operational/revenue wallets is premature optimization for an MVP.

2. **Post-settlement fee collection** — Fee is collected AFTER successful settlement, not before. This eliminates the refund problem entirely: if settlement fails, no fee is charged. Trade-off: brief free-riding is possible if merchant's allowance runs out mid-batch, but this is acceptable and mitigated by verify-time allowance checks.

3. **Fee amount via environment variable** — `FACILITATOR_FEE_AMOUNT` env var, default `10000` (0.01 USDC). Adjustable without redeployment via Scaleway Console.

4. **Gas costs covered by fee** — On Optimism/Base L2, two transactions cost ~$0.002 total. At 0.01 USDC per settlement, this leaves ~$0.008 margin. Sufficient.

5. **No rate limiting in MVP** — Not a substantive security risk. `/verify` is read-only (no cost to us). `/settle` requires a valid EIP-3009 signature + sufficient merchant allowance — an attacker cannot trigger settlements without these. CPU-level DoS is handled by Scaleway's infrastructure. Rate limiting can be added later if needed.

6. **USDC ABI in `@fretchen/chain-utils`** — Standard ERC-20 `transferFrom`, `allowance`, and `approve` functions added to the shared package. Consistent with existing USDC address/name logic already there.

7. **Monitoring deferred to post-MVP** — Not priority given uncertain adoption. Pino logging captures fee success/failure. Dedicated dashboards/alerts added when the facilitator has active merchants.

8. **No compliance concerns for MVP** — We operate as a technical relay, not a custodian. No client funds are held, no KYC performed. The fee is an infrastructure service charge (comparable to an RPC provider). Regulatory review (EU MiCA, Money Transmitter classification) becomes relevant at scale or with institutional merchants.

9. **TypeScript throughout** — All new code in TypeScript, all modified JS files migrated to `.ts` during modification. Strict mode enabled. Uses Viem's native types (`Address`, `Hash`, `Chain`) for blockchain primitives. Config files (`eslint.config.js`, `vitest.config.js`, `tsup.config.js`) remain JS as per convention. Splitter files (`x402_splitter_*.js`) migrated separately (out of scope).

## Estimated Timeline

| Phase | Effort | Description |
|---|---|---|
| Phase 0: TS migration | ~2 days | Migrate 6 source + 4 test files to `.ts`, update tooling (tsconfig, eslint, tsup) |
| Phase 1: Core fee logic | ~3-4 days | `x402_fee.ts`, modify settle + verify, tests |
| Phase 2: Discovery & docs | ~2 days | Update /supported, merchant scripts, README |
| Phase 3: Testing | ~2-3 days | Sepolia E2E, edge cases, deployment |
| **Total** | **~1.5-2 weeks** | |

## References

- [0xmeta.ai docs](https://docs.0xmeta.ai/) — Production implementation of post-settlement fee approach
- [x402 #899](https://github.com/coinbase/x402/pull/899) — 0xmeta ecosystem PR, accepted by maintainers
- [x402 #937](https://github.com/coinbase/x402/issues/937) — Our exact-split proposal (long-term)
- [x402 #1087](https://github.com/coinbase/x402/pull/1087) — Split scheme spec PR by 0xAxiom (2 days ago)
- [x402 #1016](https://github.com/coinbase/x402/issues/1016) — Fee disclosure standardization
- Current facilitator: `facilitator_instance.js` → `facilitator_instance.ts` (onAfterVerify whitelist hook)
