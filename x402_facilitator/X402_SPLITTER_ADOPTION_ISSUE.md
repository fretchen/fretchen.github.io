# x402 v2 Adoption Issue: Fee-based Facilitators Require Seller-side Changes

## Summary

It would seem that the current x402 v2 protocol design makes it difficult (or impossible ?) for **fee-based facilitators** to provide services without requiring sellers to modify their implementation. This creates a significant adoption barrier for facilitators that want to offer public payment infrastructure without whitelists but with fee-based business models.

## Background

### EIP-3009 Limitations

EIP-3009's `transferWithAuthorization` function has a fixed signature:
```solidity
function transferWithAuthorization(
    address from,      // Payer
    address to,        // Recipient
    uint256 value,     // Amount
    uint256 validAfter,
    uint256 validBefore,
    bytes32 nonce,
    uint8 v, bytes32 r, bytes32 s
) external;
```

**Key limitation:** The `to` address must be the final recipient. There is no way to:
- Specify an intermediary contract
- Encode additional routing information
- Include fee instructions in the authorization itself

### Splitter Contract Approach

To enable fee-based facilitators without whitelists, we implemented an `EIP3009SplitterV1` contract that:
1. Receives the full payment (seller amount + fee) via EIP-3009
2. Automatically splits the payment between seller and facilitator
3. Uses a custom nonce scheme: `keccak256(abi.encode(seller, salt))`

**Contract deployed on Optimism Sepolia:**
`0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946`

## The Problem

### Standard x402 Flow (Seller-side)

```javascript
// Seller server returns 402 response
app.get('/protected-resource', (req, res) => {
  res.status(402).json({
    x402Version: 2,
    accepts: [{
      scheme: "exact",
      network: "eip155:10",
      amount: "20000",              // $0.02 USDC
      asset: "0x0b2C639...",        // USDC address
      payTo: "0x...SELLER...",      // ← Direct to seller wallet
      facilitatorUrl: "https://facilitator.example.com"
    }]
  });
});
```

### Splitter-Required Flow (Seller must change!)

```javascript
// Seller server MUST be splitter-aware
app.get('/protected-resource', async (req, res) => {
  // ❌ Seller now needs to:
  // 1. Know about the splitter contract
  const splitterAddress = "0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946";
  
  // 2. Fetch the facilitator's fee
  const facilitatorFee = 10000; // $0.01 USDC (needs to be fetched/known)
  
  // 3. Calculate total amount
  const sellerAmount = 20000;
  const totalAmount = sellerAmount + facilitatorFee;
  
  // 4. Generate random salt for nonce computation
  const salt = crypto.randomBytes(32).toString('hex');
  
  res.status(402).json({
    x402Version: 2,
    accepts: [{
      scheme: "exact",
      network: "eip155:10",
      amount: String(totalAmount),          // ← Higher amount!
      asset: "0x0b2C639...",
      payTo: splitterAddress,                // ← NOT seller wallet!
      facilitatorUrl: "https://splitter-facilitator.example.com",
      extra: {
        seller: "0x...SELLER...",            // ← Seller address in extra field
        salt: `0x${salt}`                    // ← Required for nonce
      }
    }]
  });
});
```

### Why This is a Dealbreaker

The facilitator cannot inject itself into the flow because:

1. **Seller creates `PaymentRequirements`** in the 402 response (step 2 of protocol)
2. **Buyer signs payload CLIENT-SIDE** based on those requirements (step 3)
3. **Facilitator only sees the final payload** at `/verify` (step 4)

**Timeline:**
```
1. Buyer → GET /resource → Seller
2. Seller → 402 + PaymentRequirements → Buyer   ← Requirements set HERE
3. Buyer → Signs EIP-712 payload (client-side)  ← Based on step 2
4. Buyer → POST /verify → Facilitator           ← Too late to change!
```

The facilitator has **no opportunity** to modify `PaymentRequirements` because they are:
- Created by the seller
- Signed by the buyer before the facilitator sees them
- Immutable once signed (EIP-712 signature covers all fields)

## Adoption Impact

### For Sellers
❌ Must understand splitter contract architecture  
❌ Must fetch facilitator fee information  
❌ Must implement extra field encoding  
❌ Must handle salt generation for nonces  
❌ Cannot use standard x402 SDK/libraries  
❌ Must maintain separate code paths for different facilitators  

### For Facilitators
❌ Cannot offer "drop-in" payment services  
❌ Must provide detailed integration guides  
❌ Harder to compete with free/whitelist-based facilitators  
❌ Limited to sellers willing to do custom integration  

### For the Ecosystem
❌ Fragments x402 implementations  
❌ Reduces standardization benefits  
❌ Higher barrier to entry for new facilitators  
❌ Limits facilitator competition and innovation  

## x402 v2 Extensibility Analysis

Looking at the [x402 v2 specification](https://github.com/coinbase/x402/blob/main/specs/x402-specification-v2.md), the protocol was explicitly designed to be **scheme-agnostic**:

> "Payment schemes define how payments are formed, validated, and settled on specific payment networks. Schemes are independent of the underlying transport mechanism."

The spec also notes support for non-blockchain networks:
> "Non-blockchain networks are encouraged to follow the CAIP-2 format (e.g., `ach:us`, `sepa:eu`)."

This suggests that **EIP-3009 is not the only option** - it's just the current "exact" scheme implementation for EVM.

### Key Insight: The Bottleneck is EIP-3009, Not x402

The x402 protocol itself is flexible. The problem is specific to the "exact" scheme's use of EIP-3009:

```
x402 Protocol (flexible) 
    └── "exact" scheme (payment logic)
          └── EIP-3009 (EVM implementation) ← THE BOTTLENECK
          └── TransferChecked (SVM implementation) ← Also no fee split
```

EIP-3009's fixed signature `(from, to, value, ...)` makes it impossible to include:
- Fee information
- Intermediary routing
- Split instructions

## Possible Solutions

### Option A: New Custom Scheme (e.g., "exact-split")

Create a **new payment scheme** that uses a different on-chain mechanism:

```javascript
// Seller's 402 response (standard code!)
{
  "x402Version": 2,
  "accepts": [{
    "scheme": "exact-split",        // ← New scheme!
    "network": "eip155:10",
    "amount": "20000",              // ← What seller wants
    "asset": "0x0b2C639...",
    "payTo": "0x...seller...",      // ← Direct to seller (standard!)
    "maxTimeoutSeconds": 60,
    "extra": {
      "name": "USDC",
      "version": "2"
    }
  }]
}
```

**How it works:**
1. Buyer sees `scheme: "exact-split"` → knows facilitator adds fee
2. x402 client queries facilitator's `/supported` for fee info
3. Client signs authorization to **splitter contract** (not seller)
4. Facilitator settles via splitter → automatic split

**The crucial difference:** The buyer's x402 client handles the transformation from:
- `payTo: seller, amount: 20000` (what seller specified)
- to: `to: splitter, value: 30000, extra: { seller, salt }` (what gets signed)

```
Standard x402 workflow preserved:
┌────────┐  GET /resource  ┌────────┐
│ Buyer  │ ───────────────→│ Seller │
│        │                 │        │
│        │  402 + accepts  │        │
│        │ ←───────────────│        │  ← Seller uses STANDARD payTo!
│        │                 │        │
│        │  ┌──────────────────────┐
│        │  │ x402 Client          │
│        │  │ Sees scheme="exact-split"
│        │  │ Fetches /supported   │←──┐
│        │  │ Shows: 20000 + 10000 fee │
│        │  │ Signs TO SPLITTER    │   │
│        │  └──────────────────────┘   │
│        │                             │
│        │  POST /verify      ┌────────────────┐
│        │ ──────────────────→│ Facilitator    │
│        │                    │ (splitter)     │
│        │  POST /settle      │                │
│        │ ──────────────────→│ calls splitter │
└────────┘                    └────────────────┘
```

**Pros:**
- ✅ Seller uses STANDARD x402 code (just different `scheme` string)
- ✅ Fully x402 v2 compliant (schemes are extensible by design)
- ✅ Buyer sees fee transparently before signing
- ✅ No protocol changes needed
- ✅ Backward compatible (sellers can offer both schemes)

**Cons:**
- ❌ Requires new scheme registration/documentation
- ❌ x402 client libraries need to support the new scheme
- ❌ Buyer must have x402 client that understands "exact-split"

### Option B: Use Extensions Mechanism

x402 v2 has a built-in extensions system:

> "Extensions enable modular optional functionality beyond core payment mechanics."

```javascript
// Seller's 402 response
{
  "x402Version": 2,
  "accepts": [{
    "scheme": "exact",
    "payTo": "0x...seller...",
    "amount": "20000"
  }],
  "extensions": {
    "facilitator-fee": {
      "info": {
        "allowFee": true,
        "maxFeePercent": 5
      },
      "schema": { /* JSON Schema */ }
    }
  }
}
```

x402 client would:
1. See `extensions.facilitator-fee.info.allowFee: true`
2. Query facilitator for actual fee
3. Modify payment target and amount accordingly

**Pros:**
- ✅ Uses existing x402 v2 mechanism
- ✅ Seller opts-in explicitly
- ✅ Flexible (facilitator defines fee structure)

**Cons:**
- ❌ Still requires x402 client updates
- ❌ More complex than new scheme approach
- ❌ Extension semantics less clear than scheme semantics

### Option C: Facilitator-Side Approval Flow (Requires Protocol Addition)

Add a **pre-signing approval step** to the facilitator interface:

```javascript
// NEW Facilitator endpoint: GET /payment-info
GET /payment-info?payTo=0x...seller&amount=20000&network=eip155:10

// Response
{
  "facilitatorFee": "10000",
  "totalAmount": "30000",
  "paymentTarget": "0x...splitter...",  // Where to actually sign
  "sellerReceives": "20000",
  "extra": {
    "seller": "0x...seller...",
    "salt": "0x..."
  }
}
```

x402 client workflow:
1. Receive 402 from seller (standard format)
2. Query facilitator's `/payment-info` with seller's requirements
3. Show buyer: "Seller wants $0.02, facilitator fee $0.01, total $0.03"
4. Sign authorization to `paymentTarget` (splitter)
5. Proceed with verify/settle

**Pros:**
- ✅ Seller code stays 100% standard
- ✅ Buyer sees full cost breakdown
- ✅ Works with any facilitator fee structure
- ✅ Could be standardized in x402 v2.1

**Cons:**
- ❌ Requires new facilitator endpoint (spec change)
- ❌ Additional network round-trip
- ❌ x402 client libraries must implement

### Option D: Accept EIP-3009 Limitation (Current Approach)

Keep the current implementation where seller must be splitter-aware.

**Pros:**
- ✅ No protocol changes
- ✅ Works today

**Cons:**
- ❌ High seller adoption barrier
- ❌ Limits fee-based facilitator ecosystem

## Option Comparison Matrix

| Aspect | A: New Scheme | B: Extensions | C: /payment-info | D: Status Quo |
|--------|--------------|---------------|------------------|---------------|
| Seller code changes | Minimal (scheme string) | Minimal (extension) | None | Significant |
| x402 spec change | No (schemes extensible) | No (extensions exist) | Yes (new endpoint) | No |
| Client library change | Yes (new scheme) | Yes (extension logic) | Yes (new flow) | No |
| Buyer transparency | ✅ Sees fee | ✅ Sees fee | ✅ Sees fee | ❌ Hidden |
| Backward compatible | ✅ | ✅ | ✅ | ✅ |
| Implementation effort | Medium | Medium | High | N/A |
| Adoption friction | Low | Low | Lowest | Highest |

## Context: Why This Matters

### Current Facilitator Models

**Whitelist-based (e.g., existing facilitator):**
- Free for whitelisted sellers (NFT holders)
- Closed ecosystem
- No adoption barrier (seller just uses standard x402)

**Fee-based (e.g., splitter facilitator):**
- Open to any seller
- Sustainable business model (automatic fees)
- **HIGH adoption barrier** (seller must integrate custom logic)

### Business Model Implications

Fee-based facilitators enable:
- ✅ Sustainable payment infrastructure
- ✅ No artificial access restrictions
- ✅ Competitive facilitator market
- ✅ Reduced centralization risk

But current protocol makes them hard to deploy at scale.

## Recommendation

**Primary: Option A (New "exact-split" Scheme)**

This is the most x402-native solution because:

1. **x402 v2 was designed for this:** The spec explicitly states schemes are extensible
2. **Minimal seller friction:** Just use `scheme: "exact-split"` instead of `scheme: "exact"`
3. **No spec changes:** New schemes don't require protocol modifications
4. **Clear semantics:** A scheme named "exact-split" clearly signals fee splitting behavior

**Implementation Path:**
1. Define "exact-split" scheme specification (we've already done this with our splitter contract)
2. Register scheme in x402 ecosystem (create PR to x402 repo with scheme spec)
3. Implement client-side logic in @x402/evm package
4. Facilitators can then offer "exact-split" alongside "exact"

**Secondary: Option C (/payment-info endpoint)**

If the x402 maintainers prefer a more general solution, `/payment-info` would be the cleanest:
- Works for ANY fee structure (percentage, fixed, tiered)
- Works for ANY future payment scheme
- Complete seller transparency

**Not Recommended: Option D (Status Quo)**

The current splitter implementation requiring seller changes is a useful **proof of concept** but not viable for ecosystem-wide adoption.

## The Core Insight

**EIP-3009 is the bottleneck, not x402.**

x402 v2 is scheme-agnostic by design. The solution is to:
1. Keep using x402 v2 as-is
2. Create a new scheme that handles fee splitting at the **signing layer**
3. Let the x402 client transform `payTo: seller` → `to: splitter` transparently

This preserves the x402 value proposition (sellers write standard code) while enabling sustainable facilitator business models.

## Related Work

- **EIP-3009 Specification:** https://eips.ethereum.org/EIPS/eip-3009
- **x402 v2 Specification:** https://github.com/coinbase/x402/blob/main/specs/x402-specification-v2.md
- **EIP3009SplitterV1 Contract:** `0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946` (Optimism Sepolia)
- **Implementation Plan:** [SPLITTER_FACILITATOR_IMPLEMENTATION_PLAN.md](./SPLITTER_FACILITATOR_IMPLEMENTATION_PLAN.md)

## Questions for Discussion

1. Would the x402 maintainers accept a new "exact-split" scheme specification?
2. Should fee information be exposed via `/supported` or a new `/payment-info` endpoint?
3. Is there interest in standardizing splitter contracts across facilitators?
4. Should the x402 client libraries include built-in fee display logic?

---

**Filed by:** @fretchen  
**Date:** 2026-01-06  
**Updated:** Added x402 v2 spec analysis and scheme-based solution  
**Status:** Discussion
