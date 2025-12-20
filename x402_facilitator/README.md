# x402 Facilitator

A production-ready x402 v2 Facilitator for Optimism, enabling EIP-3009 USDC payment verification and settlement via Scaleway Functions.

**Production Endpoint:** https://facilitator.fretchen.eu

## Overview

The x402 Facilitator bridges the gap between Resource Servers and blockchain payments. It provides three core functions:

1. **Verify** - Validates EIP-3009 payment authorizations off-chain
2. **Settle** - Executes verified payments on Optimism L2
3. **Supported** - Advertises accepted networks, assets, and payment schemes

### Key Features

- ✅ EIP-3009 `transferWithAuthorization` for USDC payments
- ✅ Optimism Mainnet and Sepolia testnet support
- ✅ Multi-source recipient whitelist (GenImNFTv4 + LLMv1 NFT holders)
- ✅ Single Scaleway Function with path-based routing
- ✅ Custom domain with TLS termination
- ✅ Comprehensive test coverage (63+ tests)
- ✅ CORS-enabled for browser-based applications

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Client/Agent   │ ◄────► │ Resource Server  │ ◄────► │  Facilitator    │
│                 │         │                  │         │ (Scaleway Func) │
└─────────────────┘         └──────────────────┘         └────────┬────────┘
                                                                   │
                                                                   ▼
                                                          ┌─────────────────┐
                                                          │ Optimism L2     │
                                                          │ (EIP-3009 USDC) │
                                                          └─────────────────┘
```

### Whitelist Architecture

The facilitator validates payment recipients using multi-source OR logic:

```
┌────────────────────────────────────────┐
│     isAgentWhitelisted(address)        │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  1. MANUAL_WHITELIST (env var)   │ │───┐
│  └──────────────────────────────────┘ │   │
│                                        │   │
│  ┌──────────────────────────────────┐ │   │
│  │  2. Test Wallets (sepolia only)  │ │───┤ OR logic
│  └──────────────────────────────────┘ │   │
│                                        │   │
│  ┌──────────────────────────────────┐ │   │
│  │  3. GenImNFTv4 (balanceOf > 0)   │ │───┤
│  └──────────────────────────────────┘ │   │
│                                        │   │
│  ┌──────────────────────────────────┐ │   │
│  │  4. LLMv1 (balanceOf > 0)        │ │───┘
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Whitelist Sources:**

- **Manual Whitelist**: Addresses in `MANUAL_WHITELIST` env variable (comma-separated)
- **Test Wallets**: Hardcoded addresses for Sepolia testing only
- **GenImNFTv4**: NFT holders on Optimism Mainnet (0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb)
- **LLMv1**: NFT holders on Optimism Mainnet (0x833F39D6e67390324796f861990ce9B7cf9F5dE1)

All sources are checked automatically. Results are cached for 1 minute.

## Quick Start

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```bash
# Scaleway credentials (for deployment)
SCW_ACCESS_KEY=your_scaleway_access_key
SCW_SECRET_KEY=your_scaleway_secret_key
SCW_DEFAULT_ORGANIZATION_ID=your_org_id
SCW_DEFAULT_PROJECT_ID=your_project_id

# Manual whitelist (optional, comma-separated addresses)
MANUAL_WHITELIST=0x1234...,0x5678...

# RPC endpoints (optional - have defaults)
OPTIMISM_RPC_URL=https://mainnet.optimism.io
OPTIMISM_SEPOLIA_RPC_URL=https://sepolia.optimism.io
```

### Scaleway Secrets

Set these in Scaleway Console (Functions → Secrets):

```bash
FACILITATOR_WALLET_PRIVATE_KEY=0x...  # Required for settlement
```

### Local Testing

```bash
npm run dev

# Test endpoints
curl http://localhost:8080/supported
curl -X POST http://localhost:8080/verify -H "Content-Type: application/json" -d @test-payload.json
```

## API Endpoints

### GET /supported

Returns supported networks, schemes, and assets.

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
        }
      ]
    }
  ],
  "extensions": [
    {
      "name": "recipient_whitelist",
      "description": "Whitelisted recipients (NFT holders)",
      "contracts": {
        "mainnet": {
          "genimg_v4": "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
          "llmv1": "0x833F39D6e67390324796f861990ce9B7cf9F5dE1"
        }
      }
    }
  ],
  "signers": {
    "eip155:*": ["0x..."]
  }
}
```

### POST /verify

Validates payment authorization off-chain.

**Request:**

```json
{
  "paymentPayload": {
    "x402Version": 2,
    "resource": {
      "url": "https://api.example.com/data",
      "description": "Premium data",
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
    "maxTimeoutSeconds": 60
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

### POST /settle

Executes verified payment on-chain.

**Request:** Same as `/verify`

**Response:**

```json
{
  "transactionHash": "0x...",
  "success": true
}
```

## Verification Checks

The `/verify` endpoint validates:

1. ✅ **Protocol Version** - Must be x402 v2
2. ✅ **Scheme Support** - Must be "exact"
3. ✅ **Network Support** - Must be supported Optimism network
4. ✅ **Recipient Whitelist** - Authorization.to must be whitelisted
5. ✅ **EIP-712 Signature** - Valid signature from payer
6. ✅ **Time Window** - validAfter ≤ now < validBefore
7. ✅ **Amount Match** - Authorization value ≥ required amount
8. ✅ **Recipient Match** - Authorization.to === paymentRequirements.payTo
9. ✅ **Nonce Check** - Nonce not already used on-chain
10. ✅ **Balance Check** - Payer has sufficient USDC balance

## Error Codes

| Error Code                                             | Description                    |
| ------------------------------------------------------ | ------------------------------ |
| `insufficient_funds`                                   | Payer doesn't have enough USDC |
| `invalid_exact_evm_payload_signature`                  | Invalid EIP-712 signature      |
| `invalid_exact_evm_payload_authorization_value`        | Amount too low                 |
| `invalid_exact_evm_payload_authorization_valid_after`  | Not yet valid                  |
| `invalid_exact_evm_payload_authorization_valid_before` | Expired                        |
| `invalid_exact_evm_payload_recipient_mismatch`         | Wrong recipient                |
| `invalid_exact_evm_payload_recipient_not_whitelisted`  | Recipient not authorized       |
| `invalid_network`                                      | Network not supported          |
| `invalid_payload`                                      | Malformed payload              |
| `unsupported_scheme`                                   | Scheme not supported           |
| `invalid_x402_version`                                 | Wrong protocol version         |
| `unexpected_verify_error`                              | Unexpected error               |

## Deployment

### Deploy to Scaleway

```bash
# Deploy
npm run deploy

# View info
npm run info

# Check logs
npm run logs:verify
npm run logs:settle
npm run logs:supported

# Remove deployment
npm run remove
```

### Custom Domain Setup

The facilitator uses a single Scaleway Function with path-based routing:

**Function URL:** `x402facilitatorjccmtmdr-facilitator.functions.fnc.fr-par.scw.cloud`

**Custom Domain:** `facilitator.fretchen.eu`

1. **Add DNS CNAME:**

   ```
   facilitator.fretchen.eu → x402facilitatorjccmtmdr-facilitator.functions.fnc.fr-par.scw.cloud
   ```

2. **Wait for DNS propagation** (5-60 minutes)

3. **Endpoints:**
   - `https://facilitator.fretchen.eu/verify`
   - `https://facilitator.fretchen.eu/settle`
   - `https://facilitator.fretchen.eu/supported`

TLS termination is handled automatically by Scaleway.

### Production Checklist

- [ ] Set `FACILITATOR_WALLET_PRIVATE_KEY` in Scaleway Secrets
- [ ] Fund facilitator wallet with ETH for gas (~0.01 ETH minimum)
- [ ] Configure `MANUAL_WHITELIST` if needed
- [ ] Test all endpoints after deployment
- [ ] Set up monitoring and alerts in Scaleway Console
- [ ] Document endpoint URLs for client applications

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- x402_verify.test.js
```

**Test Results:** 63 tests passing, 1 skipped

## Supported Networks & Assets

### Optimism Mainnet (eip155:10)

| Token | Contract Address                             |
| ----- | -------------------------------------------- |
| USDC  | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |

### Optimism Sepolia (eip155:11155420)

| Token | Contract Address                             |
| ----- | -------------------------------------------- |
| USDC  | `0x5fd84259d66Cd46123540766Be93DFE6D43130D7` |

## EIP-712 Signature Verification

The facilitator uses [viem](https://viem.sh/) for EIP-712 signature verification:

**Critical Implementation Details:**

1. **Token Name**: Must use `"USDC"` (not `"USD Coin"`)
2. **Full EIP-712 Hash**: `keccak256("\x19\x01" || domainSeparator || messageHash)`
3. **BigInt Conversion**: All uint256 fields must be BigInt

**Validation:** Reference tests in `eip712_reference.test.js` validate against official EIP-712 specification.

## Project Structure

```
x402_facilitator/
├── x402_facilitator.js          # Main handler (path-based routing)
├── x402_verify.js                # Verification logic
├── x402_settle.js                # Settlement logic
├── x402_supported.js             # Supported networks/schemes
├── x402_whitelist.js             # Multi-source whitelist
├── chain_utils.js                # Centralized chain config
├── serverless.yml                # Scaleway deployment config
├── package.json
└── test/
    ├── x402_facilitator.test.js
    ├── x402_verify.test.js
    ├── x402_settle.test.js
    ├── x402_supported.test.js
    ├── x402_whitelist.test.js
    └── eip712_reference.test.js
```

## Links

- [x402 Specification](https://github.com/coinbase/x402)
- [EIP-3009: Transfer With Authorization](https://eips.ethereum.org/EIPS/eip-3009)
- [Scaleway Functions Documentation](https://www.scaleway.com/en/docs/serverless/functions/)
- [viem Documentation](https://viem.sh/)

## License

MIT
