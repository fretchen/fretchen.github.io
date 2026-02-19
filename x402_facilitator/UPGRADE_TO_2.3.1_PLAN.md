# x402 Facilitator Upgrade Plan: 2.0.0 → 2.3.1 (Permit2 Support)

**Branch:** current working branch  
**Date:** 2026-02-19  
**Scope:** `x402_facilitator/`, `website/pages/x402/`, README

## 1. Summary

Upgrade `@x402/core` and `@x402/evm` from `2.0.0` to `2.3.1`. The primary feature in 2.3.1 is **Permit2 support** — an alternative to EIP-3009 that works with **any ERC-20 token** (not just those implementing `transferWithAuthorization`). The facilitator-side changes are mostly transparent because `ExactEvmScheme` in 2.3.1 automatically routes between EIP-3009 and Permit2 based on payload type.

### What is Permit2?

Permit2 (Uniswap) is a universal token approval mechanism. Instead of each token needing native EIP-3009 support, the user approves the canonical Permit2 contract (`0x000000000022D473030F116dDEE9F6B43aC78BA3`) once, and then signs off-chain `PermitWitnessTransferFrom` messages. A proxy contract (`x402ExactPermit2Proxy` at `0x4020...0001`) executes the transfer. This enables x402 payments with tokens that don't support EIP-3009.

### Breaking changes in 2.3.1

| Area | 2.0.0 | 2.3.1 | Impact |
|---|---|---|---|
| `FacilitatorEvmSigner` | Has `address: string` field | Has `getAddresses(): string[]` method | **Breaking** — `toFacilitatorEvmSigner()` now wraps `address` into `getAddresses()`, but our manual signer construction in `facilitator_instance.ts` uses `address:` which is still accepted by the wrapper |
| `register()` | `register(network, scheme)` | `register(networks \| network[], scheme)` | Non-breaking — single network still works |
| Payload types | Only `ExactEIP3009Payload` | `ExactEIP3009Payload \| ExactPermit2Payload` | Non-breaking for facilitator — routing is automatic |
| New helper | N/A | `registerExactEvmScheme(facilitator, config)` | Optional convenience function |
| Hook contexts | `onAfterVerify(callback)` | Same API, typed contexts | Non-breaking |
| New exports | N/A | `isPermit2Payload`, `PERMIT2_ADDRESS`, `x402ExactPermit2ProxyABI`, etc. | Additive |
| `@coinbase/x402` | `^2.0.0` | Latest is `2.1.0` | Should update or remove if unused |

---

## 2. Task Breakdown

### Phase 1: Dependency Update & Build Fix

#### Task 1.1 — Update package.json versions
**File:** `x402_facilitator/package.json`

```diff
- "@x402/core": "^2.0.0",
- "@x402/evm": "^2.0.0",
+ "@x402/core": "^2.3.1",
+ "@x402/evm": "^2.3.1",
```

Also consider updating `@coinbase/x402`:
```diff
- "@coinbase/x402": "^2.0.0",
+ "@coinbase/x402": "^2.1.0",
```

Run `npm install` and verify no peer dependency conflicts.

#### Task 1.2 — Verify TypeScript compilation
Run `npm run build` (tsup). The main risk is the `FacilitatorEvmSigner` type change — `toFacilitatorEvmSigner()` in 2.3.1 accepts `Omit<FacilitatorEvmSigner, "getAddresses"> & { address: string }`, which should match our current usage. Verify this compiles.

#### Task 1.3 — Run existing tests
Run `npm test` to confirm all 87+ existing tests still pass. The critical test is `x402_verify.test.js` which uses the **real** `ExactEvmScheme` from `@x402/evm/exact/client` — if its import path changed, this needs updating.

---

### Phase 2: Facilitator Instance Updates

#### Task 2.1 — Update `facilitator_instance.ts` to use `registerExactEvmScheme`
**File:** `x402_facilitator/facilitator_instance.ts`

**Current pattern** (manual registration per network):
```typescript
for (const network of supportedNetworks) {
  const signer = createSignerForNetwork(account, network);
  facilitator.register(network, new ExactEvmScheme(signer));
}
```

**Option A — Keep manual registration** (minimal change):  
The existing code will work as-is with 2.3.1 because `ExactEvmScheme` now handles both EIP-3009 and Permit2 automatically. Just updating the dependency version may be sufficient.

**Option B — Use `registerExactEvmScheme` helper** (cleaner):  
The new `registerExactEvmScheme()` registers both V2 and V1 schemes automatically. However, our facilitator needs **per-network signers** (different RPC clients per chain), which the helper doesn't support directly — it takes a single signer.

**Recommendation:** Keep manual per-network registration (Option A). The `ExactEvmScheme` constructor signature hasn't changed, and our multi-network architecture requires separate signers per chain.

#### Task 2.2 — Update `createReadOnlyFacilitator`
**File:** `x402_facilitator/facilitator_instance.ts`

Same consideration as 2.1. The read-only facilitator also registers per network. Should continue working as-is.

#### Task 2.3 — Verify `onAfterVerify` hook compatibility
**File:** `x402_facilitator/facilitator_instance.ts`

The `onAfterVerify` hook signature changed to use typed `FacilitatorVerifyResultContext`:
```typescript
interface FacilitatorVerifyResultContext {
  paymentPayload: PaymentPayload;
  requirements: PaymentRequirements;
  result: VerifyResponse;
}
```

Our current hook accesses `paymentPayload.accepted?.network` and `paymentPayload.payload?.authorization?.to`. With Permit2 payloads, the recipient is in `paymentPayload.payload?.permit2Authorization?.witness?.to` instead of `paymentPayload.payload?.authorization?.to`.

**Action required:** Update the `onAfterVerify` hook to extract the recipient from both EIP-3009 and Permit2 payloads:
```typescript
// Extract recipient from either EIP-3009 or Permit2 payload
const payload = paymentPayload.payload as Record<string, unknown>;
const recipient = 
  (payload?.authorization as Record<string, unknown>)?.to as string ??
  ((payload?.permit2Authorization as Record<string, unknown>)?.witness as Record<string, unknown>)?.to as string;
```

---

### Phase 3: Verify & Settle Module Updates

#### Task 3.1 — Update `x402_verify.ts` debug logging
**File:** `x402_facilitator/x402_verify.ts`

The verify module currently logs EIP-3009-specific fields (`auth.value`, `auth.validAfter`). Add logging for Permit2 payloads too. The actual verification logic delegates to `facilitator.verify()` which handles both payload types in 2.3.1.

#### Task 3.2 — Update `x402_settle.ts` logging
**File:** `x402_facilitator/x402_settle.ts`

Settlement delegates to `facilitator.settle()` which routes automatically. Update error extraction and logging to handle Permit2-specific errors if any.

#### Task 3.3 — Update `x402_supported.ts` for Permit2 capabilities
**File:** `x402_facilitator/x402_supported.ts`

The `/supported` endpoint should advertise that both `eip3009` and `permit2` transfer methods are available. Check if the `ExactEvmScheme.getExtra()` in 2.3.1 already advertises `assetTransferMethod` options. If not, add an extension or `extra` field.

---

### Phase 4: Test Updates

#### Task 4.1 — Update `facilitator_instance.test.ts`
**File:** `x402_facilitator/test/facilitator_instance.test.ts`

- Update mock imports if paths changed
- Add tests for Permit2 payload in `onAfterVerify` hook (recipient extraction from `permit2Authorization.witness.to`)
- Test that facilitator creation still works with 2.3.1 API

**New tests:**
- `should extract recipient from Permit2 payload in onAfterVerify`
- `should handle mixed EIP-3009 and Permit2 payloads`

#### Task 4.2 — Update `x402_verify.test.js`
**File:** `x402_facilitator/test/x402_verify.test.js`

This is the E2E test that uses the **real** `ExactEvmScheme` client to generate signatures. After upgrade, verify:
- Existing EIP-3009 E2E test still passes
- Add a Permit2 E2E verification test (if feasible — requires Permit2 client-side support)

**Note:** The client-side `ExactEvmScheme` from `@x402/evm/exact/client` in 2.3.1 routes based on `requirements.extra.assetTransferMethod`. We may need to set this in test requirements.

**New tests:**
- `should verify a valid Permit2 payment payload`
- `should reject an invalid Permit2 signature`

#### Task 4.3 — Update `x402_settle.test.js`
**File:** `x402_facilitator/test/x402_settle.test.js`

- Add test for settling a Permit2 payment (mock facilitator returns success for Permit2 payload)
- Test fee collection after Permit2 settlement

**New tests:**
- `should settle a Permit2 payment and collect fee`
- `should handle Permit2 settlement failure gracefully`

#### Task 4.4 — Update `x402_supported.test.js`
**File:** `x402_facilitator/test/x402_supported.test.js`

- Verify that supported capabilities reflect Permit2 availability
- Check if `assetTransferMethod` is included in kinds/extra

**New tests:**
- `should advertise permit2 as supported transfer method`

#### Task 4.5 — Update `x402_facilitator.test.ts`
**File:** `x402_facilitator/test/x402_facilitator.test.ts`

- Add integration test for the full /verify and /settle flow with a Permit2 payload structure
- Verify router handles Permit2 payloads correctly

**New tests:**
- `should handle verify request with Permit2 payload`
- `should handle settle request with Permit2 payload`

#### Task 4.6 — Update `eip712_reference.test.js`
**File:** `x402_facilitator/test/eip712_reference.test.js`

- May need updates if EIP-712 types changed
- Add reference test for Permit2 witness types

---

### Phase 5: Documentation Updates

#### Task 5.1 — Update `x402_facilitator/README.md`
**File:** `x402_facilitator/README.md`

Changes:
- Update "Key Features" to include Permit2 support
- Add Permit2 explanation in Architecture section
- Update the architecture diagram to show both EIP-3009 and Permit2 flows
- Document that Permit2 requires users to approve the Permit2 contract (`0x000...BA3`) for the token
- Mention the `x402ExactPermit2Proxy` contract addresses
- Update version references

#### Task 5.2 — Update `website/pages/x402/+Page.tsx`
**File:** `website/pages/x402/+Page.tsx`

Changes:
- Add "Permit2 support" to the value proposition list
- Update the "Payment scheme" section to mention both EIP-3009 and Permit2
- Add a note about Permit2 for tokens that don't support EIP-3009
- Update the sequence diagram to show the Permit2 alternative flow (or add a second diagram)
- Update "What your customers experience" section: mention that customers using non-EIP-3009 tokens need a one-time Permit2 approval
- Add Permit2 contract addresses to the "Supported networks" table or a new section

#### Task 5.3 — Update `website/pages/x402/+description.ts`
**File:** `website/pages/x402/+description.ts`

Update SEO description to mention Permit2 support if applicable.

---

### Phase 6: Splitter Facilitator (JS files)

#### Task 6.1 — Review splitter files for compatibility
**Files:** `x402_splitter_*.js`

The JS-based splitter facilitator files (`x402_splitter_facilitator.js`, `x402_splitter_verify.js`, `x402_splitter_settle.js`, `x402_splitter_supported.js`) also use x402 packages. They need the same compatibility check.

#### Task 6.2 — Update splitter tests
**Files:** `test/x402_splitter_*.test.js`

Verify splitter tests pass with 2.3.1. Add Permit2 test cases if the splitter should also support Permit2.

---

## 3. Implementation Order

```
1. Task 1.1 — Update package.json
2. Task 1.2 — npm install + build
3. Task 1.3 — Run existing tests (establish baseline)
4. Task 2.1 — Review facilitator_instance.ts (likely no changes needed)
5. Task 2.3 — Update onAfterVerify hook for Permit2 recipient extraction
6. Task 3.1 — Update verify logging
7. Task 3.2 — Update settle logging
8. Task 3.3 — Update supported capabilities
9. Task 4.1–4.6 — Update and add tests
10. Task 5.1 — Update README
11. Task 5.2–5.3 — Update website pages
12. Task 6.1–6.2 — Update splitter facilitator
```

## 4. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `FacilitatorEvmSigner` type break | Low | High | `toFacilitatorEvmSigner()` still accepts `{ address }` — it wraps it |
| E2E verify test fails (client `ExactEvmScheme` import change) | Medium | Medium | Check import paths from `@x402/evm/exact/client` |
| `onAfterVerify` hook doesn't extract Permit2 recipient | High | High | Must update recipient extraction logic |
| Permit2 proxy not deployed on OP Sepolia | Medium | Medium | Test against published proxy addresses |
| `/supported` doesn't advertise Permit2 | Medium | Low | Check `getSupported()` output from new version |
| Splitter facilitator JS files incompatible | Low | Medium | Run splitter tests after upgrade |

## 5. Testing Strategy

1. **Green baseline:** All existing tests pass before any code changes (after npm install)
2. **Incremental:** Update code, run tests after each phase
3. **E2E:** Verify Permit2 flow works end-to-end with real signatures (test key)
4. **Coverage:** Maintain or increase current coverage (63+ tests)
5. **Manual:** Test `/supported` endpoint locally to verify Permit2 advertisement

## 6. Rollback Plan

If the upgrade causes issues in production:
1. Revert `package.json` to `"@x402/core": "^2.0.0"` and `"@x402/evm": "^2.0.0"`
2. Run `npm install`
3. Redeploy via `serverless deploy`
4. EIP-3009 payments continue to work — Permit2 was additive only
