# Service Fee Implementation Guide

## Overview

The x402 Facilitator charges a **flat $0.01 fee per transaction** to cover:
- Gas costs for on-chain settlement
- Infrastructure costs (hosting, monitoring)
- Nonce tracking and fraud prevention

This is **significantly cheaper** than traditional payment processors like Stripe (2.9% + $0.30) or PayPal (2.99% + $0.49).

## Fee Structure

| Transaction Amount | Service Fee | Effective Rate |
|-------------------|-------------|----------------|
| $1.00 | $0.01 | 1.00% |
| $5.00 | $0.01 | 0.20% |
| $10.00 | $0.01 | 0.10% |
| $50.00 | $0.01 | 0.02% |
| $100.00 | $0.01 | 0.01% |
| $500.00 | $0.01 | 0.00% |

**Minimum transaction:** $0.02 (to prevent abuse)

## Implementation for Clients

### 1. Query Fee Information

Check the `/supported` endpoint to get current fee structure:

```javascript
const response = await fetch('https://facilitator.fretchen.eu/supported');
const capabilities = await response.json();

// Extract fee info for USDC on Optimism
const optimismKind = capabilities.kinds.find(k => k.network === "eip155:10");
const usdcAsset = optimismKind.assets.find(a => a.symbol === "USDC");
const feeInfo = usdcAsset.fees;

console.log(feeInfo);
// {
//   token: "USDC",
//   chainId: 10,
//   decimals: 6,
//   feeModel: "flat",
//   flatFee: "10000",          // 0.01 USDC in token units
//   flatFeeUsd: 0.01,
//   minTransaction: "20000",  // 0.02 USDC minimum
//   minTransactionUsd: 0.02
// }
```

### 2. Calculate Total Authorization Amount

When creating a payment, **add the service fee** to the payment amount:

```javascript
// Example: User wants to pay $10 USDC to recipient
const paymentAmount = "10000000";  // $10 USDC (6 decimals)
const serviceFee = "10000";        // $0.01 USDC (from feeInfo.flatFee)

// User must authorize this total amount
const totalAmount = BigInt(paymentAmount) + BigInt(serviceFee);
// totalAmount = "10010000" ($10.01 USDC)
```

### 3. Create EIP-3009 Signature

The user signs a `transferWithAuthorization` for the **total amount** (payment + fee):

```python
# Python example
from eth_account.messages import encode_typed_data
from web3 import Web3

# Payment details
payment_amount = 10_000_000  # $10 USDC
service_fee = 10_000         # $0.01 USDC
total_amount = payment_amount + service_fee  # $10.01 USDC

# Create EIP-712 message
message = {
    "from": user_address,
    "to": recipient_address,
    "value": str(total_amount),  # Authorization for payment + fee
    "validAfter": 0,
    "validBefore": 2**256 - 1,
    "nonce": Web3.keccak(text=f"nonce-{timestamp}"),
}

# Sign with EIP-712
signable = encode_typed_data(
    domain_data=usdc_domain,
    message_types=transfer_types,
    message_data=message,
)
signed = account.sign_message(signable)
```

### 4. Submit to Facilitator

Send `/verify` or `/settle` request with:

```javascript
const request = {
  payment: {
    kind: {
      x402Version: 2,
      scheme: "exact",
      network: "eip155:10",
      asset: {
        token: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"
      }
    },
    payer: userAddress,
    payTo: recipientAddress,
    amount: paymentAmount,  // Payment amount WITHOUT fee
  },
  signature: {
    from: userAddress,
    to: recipientAddress,
    value: totalAmount,     // Authorized amount WITH fee
    validAfter: "0",
    validBefore: maxUint256,
    nonce: nonceHex,
    v: signature.v,
    r: signature.r,
    s: signature.s,
  }
};
```

### 5. Fee Distribution

On settlement, the facilitator will:
1. Transfer `paymentAmount` to `payTo` (recipient)
2. Keep `serviceFee` ($0.01) to cover costs

The smart contract call will be:
```solidity
USDC.transferWithAuthorization(
    from: userAddress,
    to: recipientAddress,
    value: paymentAmount,  // WITHOUT fee
    validAfter: 0,
    validBefore: maxUint256,
    nonce: nonce,
    v, r, s
)
```

The facilitator receives the fee by:
- User authorized transfer of `totalAmount` from their address
- Facilitator sends `paymentAmount` to recipient
- Remaining `serviceFee` stays with user but will be transferred in a separate transaction or batch

## Complete Example (JavaScript)

```javascript
import { calculateFee } from './fee_config.js';

// 1. Get payment details
const paymentAmountUsd = 25;  // User wants to send $25
const paymentAmount = (paymentAmountUsd * 1e6).toString();  // "25000000"
const usdcAddress = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";

// 2. Calculate fee
const feeCalc = calculateFee(paymentAmount, usdcAddress);
console.log(feeCalc);
// {
//   serviceFee: "10000",
//   serviceFeeUsd: 0.01,
//   totalAmount: "25010000",
//   totalAmountUsd: 25.01,
//   feePercent: 0.04,
//   paymentAmount: "25000000",
//   paymentAmountUsd: 25
// }

// 3. Create EIP-3009 signature for totalAmount
const signature = await signTransferWithAuthorization({
  from: userAddress,
  to: recipientAddress,
  value: feeCalc.totalAmount,  // $25.01 including fee
  validAfter: 0,
  validBefore: maxUint256,
  nonce: generateNonce(),
});

// 4. Submit to facilitator
const response = await fetch('https://facilitator.fretchen.eu/settle', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    payment: {
      kind: { /* ... */ },
      payer: userAddress,
      payTo: recipientAddress,
      amount: feeCalc.paymentAmount,  // $25 to recipient
    },
    signature: {
      from: userAddress,
      to: recipientAddress,
      value: feeCalc.totalAmount,  // $25.01 authorized
      ...signature,
    },
  }),
});

const result = await response.json();
console.log(result);
// {
//   success: true,
//   transactionHash: "0x...",
//   paymentAmount: "25000000",
//   serviceFee: "10000",
//   recipient: "0x...",
//   payer: "0x..."
// }
```

## Error Handling

### Insufficient Authorization

If the signature doesn't include the fee:

```json
{
  "isValid": false,
  "invalidReason": "insufficient_authorization",
  "error": "Insufficient authorization. Expected: 25010000 (payment + $0.01 fee), Got: 25000000",
  "expected": "25010000",
  "actual": "25000000",
  "missing": "10000"
}
```

**Fix:** Re-sign with `totalAmount` including the service fee.

### Amount Too Small

If payment is below minimum ($0.02):

```json
{
  "isValid": false,
  "invalidReason": "amount_too_small",
  "error": "Transaction amount too small. Minimum: $0.02 (20000 token units)"
}
```

**Fix:** Increase payment amount above minimum threshold.

## Benefits of Flat Fee Model

✅ **Predictable costs** - Always $0.01, regardless of transaction size
✅ **Better for large transactions** - 0.01% on $100, vs 2.9%+$0.30 with Stripe
✅ **Simpler calculation** - No complex percentage math
✅ **Fair pricing** - Same cost whether you send $1 or $1000
✅ **Covers actual costs** - Gas on Optimism is ~$0.005-0.01

## Questions?

See the main [README.md](./README.md) or check the test suite in `test/x402_fees.test.js` for more examples.
