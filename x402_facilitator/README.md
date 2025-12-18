# x402 v2 Facilitator

A serverless x402 v2 payment facilitator for Optimism L2, implementing EIP-3009 USDC payment verification and settlement.

## Overview

The x402 Facilitator enables resource servers to verify and settle blockchain payments without running their own blockchain infrastructure. It implements the [x402 v2 specification](https://github.com/coinbase/x402) for internet-native payments.

## Features

- ✅ **POST /verify** - Verify EIP-3009 payment authorizations
- ✅ **POST /settle** - Execute verified payments on-chain
- ✅ **GET /supported** - List supported networks, schemes, and tokens
- ✅ **Multi-Token Support** - USDC and USDT

## Supported Networks

- **Optimism Mainnet** (`eip155:10`)
- **Optimism Sepolia** (`eip155:11155420`)

## Supported Schemes

- **exact** - EIP-3009 transfers with authorization (USDC and USDT0)

## Installation

```bash
cd x402_facilitator
npm install
```

## Environment Variables

```bash
# Blockchain RPC endpoints
OPTIMISM_RPC_URL=https://mainnet.optimism.io
OPTIMISM_SEPOLIA_RPC_URL=https://sepolia.optimism.io

# Wallet for settlement (required for /settle endpoint)
FACILITATOR_WALLET_PRIVATE_KEY=your_private_key_here

# Logging
LOG_LEVEL=info
```

## Local Testing

```bash
# Start local test server
NODE_ENV=test node x402_facilitator.js

# Server runs on http://localhost:8080
```

## API Usage

### POST /verify

Verifies a payment authorization without executing on-chain.

**Request:**

```json
{
  "paymentPayload": {
    "x402Version": 2,
    "resource": {
      "url": "https://api.example.com/premium-data",
      "description": "Access to premium market data",
      "mimeType": "application/json"
    },
    "accepted": {
      "scheme": "exact",
      "network": "eip155:10",
      "amount": "10000",
      "asset": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      "payTo": "0x...",
      "maxTimeoutSeconds": 60,
      "extra": {
        "name": "USDC",
        "version": "2"
      }
    },
    "payload": {
      "signature": "0x...",
      "authorization": {
        "from": "0x...",
        "to": "0x...",
        "value": "10000",
        "validAfter": "1740672089",
        "validBefore": "1740672154",
        "nonce": "0x..."
      }
    }
  },
  "paymentRequirements": {
    "scheme": "exact",
    "network": "eip155:10",
    "amount": "10000",
    "asset": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    "payTo": "0x...",
    "maxTimeoutSeconds": 60,
    "extra": {
      "name": "USDC",
      "version": "2"
    }
  }
}
```

**Success Response:**

```json
{
  "isValid": true,
  "payer": "0x857b06519E91e3A54538791bDbb0E22373e36b66"
}
```

**Error Response:**

```json
{
  "isValid": false,
  "invalidReason": "insufficient_funds",
  "payer": "0x857b06519E91e3A54538791bDbb0E22373e36b66"
}
```

### GET /supported

Returns information about supported payment schemes, networks, and tokens.

**Request:** None (GET request)

**Response:**

```json
{
  "kinds": [
    {
      "x402Version": 2,
      "scheme": "exact",
      "network": "eip155:10",
      "assets": [
        {
          "address": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
          "name": "USDC",
          "symbol": "USDC",
          "decimals": 6
        },
        {
          "address": "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
          "name": "Tether USD",
          "symbol": "USDT",
          "decimals": 6
        }
      ]
    },
    {
      "x402Version": 2,
      "scheme": "exact",
      "network": "eip155:11155420",
      "assets": [
        {
          "address": "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
          "name": "USDC",
          "symbol": "USDC",
          "decimals": 6
        }
      ]
    }
  ],
  "extensions": [],
  "signers": {
    "eip155:*": ["0x..."]
  }
}
```

## Verification Checks

The `/verify` endpoint performs the following validations:

1. ✅ **Protocol Version** - Must be x402 v2
2. ✅ **Scheme Support** - Must be "exact"
3. ✅ **Network Support** - Must be supported Optimism network
4. ✅ **Signature Validation** - EIP-712 signature verification
5. ✅ **Time Window** - validAfter ≤ now < validBefore
6. ✅ **Amount Check** - Authorization value ≥ required amount
7. ✅ **Recipient Match** - Authorization.to === paymentRequirements.payTo
8. ✅ **Nonce Check** - Nonce not already used on-chain
9. ✅ **Balance Check** - Payer has sufficient USDC balance

## Error Codes

| Error Code                                             | Description                    |
| ------------------------------------------------------ | ------------------------------ |
| `insufficient_funds`                                   | Payer doesn't have enough USDC |
| `invalid_exact_evm_payload_signature`                  | Invalid EIP-712 signature      |
| `invalid_exact_evm_payload_authorization_value`        | Amount too low                 |
| `invalid_exact_evm_payload_authorization_valid_after`  | Not yet valid                  |
| `invalid_exact_evm_payload_authorization_valid_before` | Expired                        |
| `invalid_exact_evm_payload_recipient_mismatch`         | Wrong recipient                |
| `invalid_network`                                      | Network not supported          |
| `invalid_payload`                                      | Malformed payload              |
| `unsupported_scheme`                                   | Scheme not supported           |
| `invalid_x402_version`                                 | Wrong protocol version         |
| `unexpected_verify_error`                              | Unexpected error               |

## Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Deployment

The facilitator is deployed as a Scaleway Function:

```bash
# Deploy to Scaleway
serverless deploy --stage production
```

## Supported Token Addresses

### Optimism Mainnet (eip155:10)

| Token | Contract Address                             |
| ----- | -------------------------------------------- |
| USDC  | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |
| USDT0 | `0x01bFF41798a0BcF287b996046Ca68b395DbC1071` |

### Optimism Sepolia (eip155:11155420)

| Token | Contract Address                             |
| ----- | -------------------------------------------- |
| USDC  | `0x5fd84259d66Cd46123540766Be93DFE6D43130D7` |

## Links

- [x402 Specification](https://github.com/coinbase/x402)
- [EIP-3009: Transfer With Authorization](https://eips.ethereum.org/EIPS/eip-3009)
- [USDT0 Documentation](https://docs.usdt0.to/)
- [Implementation Plan](../../website/blog/X402_FACILITATOR_IMPLEMENTATION_PLAN.md)

## License

MIT
