# Proposal: Public x402 Facilitator with Fee-Based Access

**Status:** Phase 0 Complete (TypeScript Migration) — Phase 1 Complete (Core Fee Logic)
**Date:** 2026-02-06
**Author:** fretchen
**Related:** [x402 #937](https://github.com/coinbase/x402/issues/937), [x402 #899 (0xmeta)](https://github.com/coinbase/x402/pull/899), [x402 #1087 (split scheme spec)](https://github.com/coinbase/x402/pull/1087)

## Implementation Status

### ✅ Phase 0: TypeScript Migration (COMPLETE)

**Completed:** 2026-02-06

All core facilitator modules have been migrated from JavaScript to TypeScript:

| File                      | Status      | Notes                                                                 |
| ------------------------- | ----------- | --------------------------------------------------------------------- |
| `chain_utils.ts`          | ✅ Complete | Exported `ChainConfig` interface, typed functions                     |
| `x402_whitelist.ts`       | ✅ Complete | Exported `WhitelistResult` interface, typed ABIs with `satisfies Abi` |
| `facilitator_instance.ts` | ✅ Complete | Used `InstanceType<typeof x402Facilitator>` for return types          |
| `x402_verify.ts`          | ✅ Complete | Exported `VerifyResult` interface                                     |
| `x402_supported.ts`       | ✅ Complete | Exported `SupportedCapabilities` interface                            |
| `x402_settle.ts`          | ✅ Complete | Exported `SettleResult` interface                                     |
| `tsconfig.json`           | ✅ Updated  | Include expanded to `["*.ts", "test/**/*.ts"]`                        |
| `eslint.config.js`        | ✅ Updated  | Added `typescript-eslint@latest` with recommended config              |
| `package.json`            | ✅ Updated  | Added `typescript-eslint` devDependency                               |

**Test Results:**

- ✅ All 153 tests passing (9 test files, 2.93s duration)
- ✅ Build successful (tsup 590ms, ESM bundles generated)
- ✅ Linting passing (all errors resolved)

**Notes:**

- Old `.js` source files deleted (no duplication)
- Test files remain `.test.js` (test migration deferred)
- Splitter files (`x402_splitter_*.js`) migrated separately (out of scope)
- Config files remain `.js` per convention

### ✅ Phase 1: Core Fee Logic (COMPLETE)

**Completed:** 2026-02-07

All core fee collection logic implemented and integrated:

| File                      | Status      | Notes                                                                                               |
| ------------------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| `x402_fee.ts`             | ✅ Complete | New module: `collectFee()`, `checkMerchantAllowance()`, `getFeeAmount()`, `getFacilitatorAddress()` |
| `facilitator_instance.ts` | ✅ Complete | Dual auth model: whitelist OR fee-approved (backwards compatible)                                   |
| `x402_settle.ts`          | ✅ Complete | Post-settlement fee collection (settlement-first design)                                            |
| `x402_verify.ts`          | ✅ Complete | Fee status passthrough (`feeRequired` field)                                                        |
| `x402_supported.ts`       | ✅ Complete | Fee discovery via `facilitator_fee` extension in `/supported` response                              |
| `x402_facilitator.ts`     | ✅ Complete | Fee info included in settle response                                                                |
| `test/x402_fee.test.ts`   | ✅ Complete | 24 test cases covering all fee functions                                                            |

**Test Results:**

- ✅ All 177 tests passing (10 test files, 5.82s duration)
- ✅ Build successful (tsup 2277ms, ESM bundles generated)
- ✅ Linting passing (0 errors)

**Key Design Decisions Implemented:**

- ERC-20 ABI defined locally in `x402_fee.ts` (minimal: `allowance` + `transferFrom` only)
- Fee amount configurable via `FACILITATOR_FEE_AMOUNT` env var, default 10000n (0.01 USDC)
- Facilitator address derived from `FACILITATOR_WALLET_PRIVATE_KEY`
- Fee failure does NOT fail settlement (settlement-first, fee-second)
- Whitelisted recipients pass free (full backwards compatibility)
- Non-whitelisted recipients with sufficient allowance pass with `feeRequired: true`
- Non-whitelisted recipients without allowance rejected with `insufficient_fee_allowance`

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

**Phase 0 Migration Complete** — All core source files are now TypeScript:

| File                      | Language | Status                                                    |
| ------------------------- | -------- | --------------------------------------------------------- |
| `x402_facilitator.ts`     | ✅ TS    | Already migrated (entry point)                            |
| `x402_settle.ts`          | ✅ TS    | **Migrated** (ready for fee collection)                   |
| `x402_verify.ts`          | ✅ TS    | **Migrated** (ready for fee status passthrough)           |
| `x402_supported.ts`       | ✅ TS    | **Migrated** (ready for fee discovery)                    |
| `facilitator_instance.ts` | ✅ TS    | **Migrated** (ready for dual auth model)                  |
| `x402_whitelist.ts`       | ✅ TS    | **Migrated** (unchanged logic, now typed)                 |
| `chain_utils.ts`          | ✅ TS    | **Migrated** (ready for ERC-20 ABI types)                 |
| `x402_splitter_*.js`      | ❌ JS    | Migrate separately (not in scope for this proposal)       |
| `test/*.test.js`          | ❌ JS    | Test migration deferred (tests pass importing TS modules) |
| `eslint.config.js`        | JS       | Keep as JS (config file convention)                       |
| `vitest.config.js`        | JS       | Keep as JS (config file convention)                       |
| `tsup.config.js`          | JS       | Keep as JS (config file convention)                       |

### Tooling Changes Required

**Phase 0 Complete** — All tooling updated for TypeScript:

1. ✅ **`tsconfig.json`** — Expanded `include` from `["*.ts"]` to `["*.ts", "test/**/*.ts"]`
2. ✅ **`eslint.config.js`** — Added `typescript-eslint@latest` parser + rules for `**/*.ts` files
3. ✅ **`package.json`** — Added `typescript-eslint` to devDependencies (15 packages installed)
4. ✅ **`tsup.config.js`** — Entry points reference `.ts` files (build handles correctly)
5. ✅ **`vitest.config.js`** — No change needed (Vitest handles `.ts` natively)

## Proposed Approach: Post-Settlement Fee via ERC-20 `transferFrom`

Following the 0xmeta.ai pattern (merged in [x402 #899](https://github.com/coinbase/x402/pull/899)), which was accepted by the x402 maintainers as a pragmatic solution while the spec evolves.

### Why This Approach (Not Splitter)

| Approach                                                                  | Status              | Pros                                                             | Cons                                                                                                              |
| ------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Post-settlement `transferFrom`**                                        | ✅ Works today      | No smart contract, standard ERC-20, accepted by x402 maintainers | Requires merchant trust, two txs per settlement                                                                   |
| **Atomic splitter** ([#937](https://github.com/coinbase/x402/issues/937)) | 🔄 Spec in progress | Trustless, atomic, on-chain enforcement                          | x402 spec not ready ([#1087](https://github.com/coinbase/x402/pull/1087) under review), needs client-side changes |
| **Separate x402 tx** (PayAI model)                                        | 🔄 Proposed         | No spec changes                                                  | Credit/account relationship, pre-funding                                                                          |

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

| Parameter            | Value                         | Notes                                                                |
| -------------------- | ----------------------------- | -------------------------------------------------------------------- |
| Fee amount           | **0.01 USDC** (10,000 wei)    | Configurable via `FACILITATOR_FEE_AMOUNT` env var                    |
| Minimum approval     | 0.01 USDC (1 settlement)      | Merchant controls                                                    |
| Recommended approval | 100 USDC (10,000 settlements) | Standard ERC-20 approve                                              |
| Fee recipient        | Facilitator signer wallet     | Same as `FACILITATOR_WALLET_PRIVATE_KEY` — simplifies gas management |
| Fee timing           | **Post-settlement**           | Fee only collected after successful settlement                       |

## Implementation Plan

### Phase 0: TypeScript Migration

**Status: ✅ COMPLETE (2026-02-06)**

All core facilitator modules migrated from JavaScript to TypeScript with strict mode enabled.

**Completed Tasks:**

1. ✅ `chain_utils.js` → `chain_utils.ts` (exported `ChainConfig` interface)
2. ✅ `x402_whitelist.js` → `x402_whitelist.ts` (exported `WhitelistResult` interface, typed ABIs)
3. ✅ `facilitator_instance.js` → `facilitator_instance.ts` (typed facilitator instances)
4. ✅ `x402_verify.js` → `x402_verify.ts` (exported `VerifyResult` interface)
5. ✅ `x402_supported.js` → `x402_supported.ts` (exported `SupportedCapabilities` interface)
6. ✅ `x402_settle.js` → `x402_settle.ts` (exported `SettleResult` interface)
7. ✅ Updated `tsconfig.json`, `eslint.config.js`, `package.json`
8. ✅ Deleted old `.js` source files (no duplication)
9. ✅ All 153 tests passing, build successful (590ms), linting clean

**Notes:**

- Used Viem types (`Address`, `Chain`, `Account`, `Abi`) throughout
- Used x402 library types (`x402Facilitator`, `FacilitatorEvmSigner`, `ExactEvmScheme`)
- All modules export typed interfaces for external consumption
- Test files remain `.test.js` (migration deferred, tests pass via build artifacts)
- Splitter files remain `.js` (separate migration, out of scope)

### Phase 1: Core Fee Logic

**Status: ✅ COMPLETE (2026-02-07)**

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
export function checkMerchantAllowance(
  merchantAddress: `0x${string}`,
  network: string,
): Promise<AllowanceInfo>;
export function getFeeAmount(): bigint; // from FACILITATOR_FEE_AMOUNT env, default 10000n
// Facilitator address derived from FACILITATOR_WALLET_PRIVATE_KEY
```

**Responsibilities:**

- Call `USDC.transferFrom(merchant, facilitator, feeAmount)` on the correct network
- Check merchant's remaining allowance before verify (to give early feedback)
- Return typed error messages for insufficient allowance
- Fee amount configurable via `FACILITATOR_FEE_AMOUNT` env var (default: `10000` = 0.01 USDC)

#### 1.2 Modify `facilitator_instance.ts` (Dual Authorization Model)

**Note:** File already migrated to TypeScript in Phase 0. Ready for dual auth implementation.

Change the `onAfterVerify` hook from "reject non-whitelisted" to "whitelist OR paid":

```
onAfterVerify():
  ├── Is recipient whitelisted? → ✅ Pass (no fee, backwards compatible)
  └── Not whitelisted?
      └── Check merchant has sufficient USDC allowance for fee
          ├── Yes → ✅ Mark as "fee_required" (collect at settle time)
          └── No  → ❌ Reject with "insufficient_fee_allowance"
```

**Critical:** Fee collection happens at **settle time**, not verify time. Verify only checks that fee collection is _possible_.

#### 1.3 Modify `x402_settle.ts` (Post-Settlement Fee Collection)

**Note:** File already migrated to TypeScript in Phase 0. Ready for fee collection implementation.

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

| Test                      | Description                                                  | File                                |
| ------------------------- | ------------------------------------------------------------ | ----------------------------------- |
| Fee collection unit tests | Mock USDC.transferFrom, test success/failure                 | `test/x402_fee.test.ts`             |
| Dual auth model tests     | Whitelisted passes without fee, non-whitelisted requires fee | `test/facilitator_instance.test.ts` |
| Settlement with fee tests | Settlement executes first, fee collected after success       | `test/x402_settle.test.ts`          |
| E2E Sepolia test          | Full flow with real USDC on Optimism Sepolia                 | Manual                              |
| Supported endpoint tests  | Fee info included in response                                | `test/x402_supported.test.ts`       |

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

| File                    | Description                                                                | Status      |
| ----------------------- | -------------------------------------------------------------------------- | ----------- |
| `x402_fee.ts`           | Fee collection logic with typed interfaces (transferFrom, allowance check) | ✅ Complete |
| `test/x402_fee.test.ts` | Fee module tests (24 test cases)                                           | ✅ Complete |

### Modify Existing TypeScript Files (Phase 0 Complete)

| File                          | Description                                | Migration Status            | Fee Implementation Status                 |
| ----------------------------- | ------------------------------------------ | --------------------------- | ----------------------------------------- |
| `facilitator_instance.ts`     | Dual auth model: whitelist OR fee-approved | ✅ Migrated                 | ✅ Complete                               |
| `x402_settle.ts`              | Post-settlement fee collection             | ✅ Migrated                 | ✅ Complete                               |
| `x402_supported.ts`           | Add fee info to /supported                 | ✅ Migrated                 | ✅ Complete                               |
| `x402_verify.ts`              | Pass fee status through to settle          | ✅ Migrated                 | ✅ Complete                               |
| `x402_whitelist.ts`           | Type-safe whitelist (logic unchanged)      | ✅ Migrated                 | ✅ No changes needed                      |
| `chain_utils.ts`              | ERC-20 ABI types                           | ✅ Migrated                 | ✅ No changes needed (ABI in x402_fee.ts) |
| `test/x402_settle.test.ts`    | Migrate tests + fee test cases             | ✅ Tests pass (still `.js`) | 🔄 Pending migration                      |
| `test/x402_verify.test.ts`    | Migrate tests + fee test cases             | ✅ Tests pass (still `.js`) | 🔄 Pending migration                      |
| `test/x402_supported.test.ts` | Migrate tests + fee test cases             | ✅ Tests pass (still `.js`) | 🔄 Pending migration                      |
| `test/x402_whitelist.test.ts` | Migrate tests                              | ✅ Tests pass (still `.js`) | 🔄 Pending migration                      |

### Modify Only (already TS or config)

| File                    | Action             | Description                                         | Status                |
| ----------------------- | ------------------ | --------------------------------------------------- | --------------------- |
| `x402_facilitator.ts`   | **Update imports** | Change `.js` imports to `.ts` module references     | ✅ Complete (Phase 0) |
| `@fretchen/chain-utils` | **N/A**            | ERC-20 ABI defined locally in `x402_fee.ts` instead | ✅ Not needed         |
| `tsconfig.json`         | **Expand**         | Include `test/**/*.ts`                              | ✅ Complete (Phase 0) |
| `eslint.config.js`      | **Add TS rules**   | Add `typescript-eslint` parser for `.ts` files      | ✅ Complete (Phase 0) |
| `tsup.config.js`        | **Update entries** | Change `.js` entry points to `.ts`                  | ✅ Complete (Phase 0) |
| `package.json`          | **Add deps**       | `typescript`, `typescript-eslint` devDependencies   | ✅ Complete (Phase 0) |
| `README.md`             | **Update**         | Document public access, fee structure, TS migration | 🔄 Pending            |

## Trust Model & Security Considerations

### What the Merchant Trusts

1. We only collect the advertised fee (0.01 USDC) per settlement
2. We don't drain the full approved amount at once
3. We execute the customer's payment first, then collect our fee — merchant's customer always gets served

### Merchant Controls

| Control          | Mechanism                                                   |
| ---------------- | ----------------------------------------------------------- |
| Limit exposure   | Approve only small amounts (e.g., 1 USDC = 100 settlements) |
| Revoke anytime   | `USDC.approve(facilitatorAddress, 0)`                       |
| Monitor on-chain | All `transferFrom` calls are public on Etherscan/Basescan   |
| Stop using       | Just stop sending settlements; allowance sits unused        |

### Risk Mitigations

| Risk                                 | Mitigation                                                                                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Facilitator drains full allowance    | Merchant limits approval amount; all txs auditable on-chain                                                                                   |
| Settlement succeeds but fee fails    | Log for retry; merchant served their customer regardless. Flag merchant for re-approval if persistent                                         |
| Merchant revokes allowance mid-use   | Verify checks allowance at verify time; if allowance = 0 at settle time, settlement still completes but fee is logged as failed               |
| Nonce conflicts on fee tx            | Use nonce management similar to genimg_x402_token.js retry pattern                                                                            |
| Free-riding (settlement without fee) | Post-settlement model means brief free-riding possible if allowance exhausted. Mitigated by verify-time allowance check and merchant flagging |

## Design Decisions

### ✅ Resolved Questions

1. **Treasury address = facilitator signer** — Same wallet (`FACILITATOR_WALLET_PRIVATE_KEY`). Simplifies gas management, avoids multi-wallet coordination. Separating operational/revenue wallets is premature optimization for an MVP.

2. **Post-settlement fee collection** — Fee is collected AFTER successful settlement, not before. This eliminates the refund problem entirely: if settlement fails, no fee is charged. Trade-off: brief free-riding is possible if merchant's allowance runs out mid-batch, but this is acceptable and mitigated by verify-time allowance checks.

3. **Fee amount via environment variable** — `FACILITATOR_FEE_AMOUNT` env var, default `10000` (0.01 USDC). Adjustable without redeployment via Scaleway Console.

4. **Gas costs covered by fee** — On Optimism/Base L2, two transactions cost ~$0.002 total. At 0.01 USDC per settlement, this leaves ~$0.008 margin. Sufficient.

5. **No rate limiting in MVP** — Not a substantive security risk. `/verify` is read-only (no cost to us). `/settle` requires a valid EIP-3009 signature + sufficient merchant allowance — an attacker cannot trigger settlements without these. CPU-level DoS is handled by Scaleway's infrastructure. Rate limiting can be added later if needed.

6. **USDC ABI in `x402_fee.ts`** — Minimal ERC-20 ABI (`transferFrom` + `allowance` only) defined locally in the fee module with `satisfies Abi`. Avoids modifying `@fretchen/chain-utils` for facilitator-specific logic; `chain-utils` already provides `getUSDCAddress()` and `getUSDCConfig()`.

7. **Monitoring deferred to post-MVP** — Not priority given uncertain adoption. Pino logging captures fee success/failure. Dedicated dashboards/alerts added when the facilitator has active merchants.

8. **No compliance concerns for MVP** — We operate as a technical relay, not a custodian. No client funds are held, no KYC performed. The fee is an infrastructure service charge (comparable to an RPC provider). Regulatory review (EU MiCA, Money Transmitter classification) becomes relevant at scale or with institutional merchants.

9. **TypeScript throughout** — All new code in TypeScript, all modified JS files migrated to `.ts` during modification. Strict mode enabled. Uses Viem's native types (`Address`, `Hash`, `Chain`) for blockchain primitives. Config files (`eslint.config.js`, `vitest.config.js`, `tsup.config.js`) remain JS as per convention. Splitter files (`x402_splitter_*.js`) migrated separately (out of scope).

## Estimated Timeline

| Phase                     | Effort           | Description                                                              | Status                   |
| ------------------------- | ---------------- | ------------------------------------------------------------------------ | ------------------------ |
| Phase 0: TS migration     | ~2 days          | Migrate 6 source files to `.ts`, update tooling (tsconfig, eslint, tsup) | ✅ Complete (2026-02-06) |
| Phase 1: Core fee logic   | ~3-4 days        | `x402_fee.ts`, modify settle + verify, tests                             | ✅ Complete (2026-02-07) |
| Phase 2: Discovery & docs | ~2 days          | Update /supported, merchant scripts, README                              | 🔄 Pending               |
| Phase 3: Testing          | ~2-3 days        | Sepolia E2E, edge cases, deployment                                      | 🔄 Pending               |
| **Total**                 | **~1.5-2 weeks** | **Phase 0: 1 day actual**                                                |                          |

## References

- [0xmeta.ai docs](https://docs.0xmeta.ai/) — Production implementation of post-settlement fee approach
- [x402 #899](https://github.com/coinbase/x402/pull/899) — 0xmeta ecosystem PR, accepted by maintainers
- [x402 #937](https://github.com/coinbase/x402/issues/937) — Our exact-split proposal (long-term)
- [x402 #1087](https://github.com/coinbase/x402/pull/1087) — Split scheme spec PR by 0xAxiom (2 days ago)
- [x402 #1016](https://github.com/coinbase/x402/issues/1016) — Fee disclosure standardization
- Current facilitator: `facilitator_instance.js` → `facilitator_instance.ts` (onAfterVerify whitelist hook)
