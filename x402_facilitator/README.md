# x402 Facilitator

A production-ready x402 v2 Facilitator for Optimism, enabling EIP-3009 USDC payment verification and settlement via Scaleway Functions.

**Production Endpoint:** https://facilitator.fretchen.eu

## Overview

The x402 Facilitator bridges the gap between Resource Servers and blockchain payments. It provides three core functions:

1. **Verify** - Validates EIP-3009 payment authorizations off-chain
2. **Settle** - Executes verified payments on-chain (Optimism / Base L2)
3. **Supported** - Advertises accepted networks, assets, and payment schemes

### Payment Schemes

The facilitator supports two x402 schemes on the same `/verify` and `/settle` endpoints (it routes by the payload's `scheme` field):

- **`exact`** — one EIP-3009 `transferWithAuthorization` per request, USDC moved wallet-to-wallet. Supported on all networks. A flat facilitator fee may be collected post-settlement.
- **`batch-settlement`** — payment channels: the payer escrows USDC once, signs an off-chain cumulative voucher per request, and the receiver claims many requests in one on-chain transaction. Only advertised on networks where the canonical batch-settlement contract is deployed (see `getBatchSettlementNetworks()` — Optimism/Base mainnet + Base Sepolia). Optimism Sepolia is **not** on that list because the contract isn't deployed there — but `exact` still works on it; the restriction is specific to `batch-settlement`. See [`notebooks/x402_batch_settlement_buyer.ipynb`](./notebooks/x402_batch_settlement_buyer.ipynb) for an end-to-end walkthrough. `deposit`/`voucher`/`refund` payloads are open and fee-free — they fund, sign, or unwind a channel rather than realize a payment. `claim`/`settle` (the payload types that pay out) charge the same flat fee `exact` does, gated by the same USDC allowance check (see `x402_fee.ts`); an under-approved recipient gets `insufficient_fee_allowance` on `/settle`.

### Key Features

- ✅ EIP-3009 `transferWithAuthorization` for USDC payments (`exact` scheme)
- ✅ `batch-settlement` payment channels (`claim`/`settle` fee-gated like `exact`; `deposit`/`voucher`/`refund` free; deploy-gated per network)
- ✅ Optimism + Base, Mainnet and testnet support
- ✅ Flat facilitator fee, gated by a USDC allowance check on the recipient (`exact`, and `batch-settlement` `claim`/`settle`)
- ✅ Single Scaleway Function with path-based routing
- ✅ Custom domain with TLS termination
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

### Recipient gating

There is no whitelist. Both schemes gate recipients the same way: a flat USDC
allowance the recipient has `approve()`d for the facilitator's wallet.
`checkMerchantAllowance()` (`x402_fee.ts`) reads that allowance; an under-approved
recipient is rejected with `insufficient_fee_allowance` rather than settled for free.
See *Fee model history* below for how batch-settlement got here — it started
whitelist-gated and fee-free, before Phase 3 moved `claim`/`settle` onto this same
allowance check. `BATCH_SETTLEMENT_TEST_WALLETS` (`x402_whitelist.ts`) is the one
remaining carve-out: a listed address skips the allowance check, but only on testnets.

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

# batch-settlement claim/settle test-wallet bypass — lets a testnet dev key skip the
# USDC allowance check (only honored on testnets: Optimism Sepolia, Base Sepolia, so
# a testnet entry can never bypass real funds). deposit/voucher/refund need no env
# var — they're always open and fee-free.
BATCH_SETTLEMENT_TEST_WALLETS=0x1234...,0x5678...

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

Returns supported networks and schemes, the advertised extension keys, and — when a
fee is configured — the fee disclosure.

`extensions` is a list of extension **key strings** (per the x402 `SupportedResponse`
type). The machine-readable fee detail, including the facilitator address that collects
the fee, is carried in the top-level `facilitatorFees` object (x402 Fee Disclosure
proposal, coinbase/x402#1016). Both the keys and `facilitatorFees` are omitted when the
facilitator runs without a fee (no `FACILITATOR_WALLET_PRIVATE_KEY`, or fee amount 0).

**Response:**

```json
{
  "kinds": [
    { "x402Version": 2, "scheme": "exact", "network": "eip155:10" },
    { "x402Version": 2, "scheme": "batch-settlement", "network": "eip155:10" }
  ],
  "extensions": ["facilitator_fee", "facilitatorFees"],
  "signers": {
    "eip155:*": ["0xFacilitatorAddress..."]
  },
  "facilitatorFees": {
    "version": "1",
    "model": "flat",
    "asset": "USDC",
    "flatFee": "10000",
    "decimals": 6,
    "recipient": "0xFacilitatorAddress...",
    "networks": ["eip155:10", "eip155:8453", "eip155:11155420", "eip155:84532"],
    "fee": {
      "amount": "10000",
      "description": "0.01 USDC per settlement",
      "collection": "post_settlement_transferFrom"
    },
    "setup": {
      "description": "Recurring USDC approval. Call approve() on the USDC contract for the facilitator's address. The recommended amount is deliberately small: the spender is a hot wallet, so a large standing allowance is a standing risk. Re-approve when remainingSettlements (in the /verify response) runs low; revoke any time with approve(spender, 0).",
      "function": "approve(address spender, uint256 amount)",
      "spender": "0xFacilitatorAddress...",
      "recommended_amount": "1000000"
    }
  }
}
```

### POST /verify

Validates payment authorization off-chain.

> **Scheme support:** the `exact` scheme is supported only via its **EIP-3009**
> payload variant (an `authorization` object, as shown below). **Permit2** payloads
> (a `permit2Authorization` object) are rejected with `invalidReason:
"permit2_not_supported"` — the fee model (post-settlement USDC `transferFrom`) is
> EIP-3009-specific, and the x402 Permit2 proxy has no per-network deployment registry
> here. The `batch-settlement` scheme is supported on the networks listed by
> `getBatchSettlementNetworks()`.

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
2. ✅ **Scheme Support** - Must be `exact` or `batch-settlement`
3. ✅ **Network Support** - Must be a supported Optimism/Base network
4. ✅ **EIP-712 Signature** - Valid signature from payer
5. ✅ **Time Window** - validAfter ≤ now < validBefore
6. ✅ **Amount Match** - Authorization value ≥ required amount
7. ✅ **Recipient Match** - Authorization.to === paymentRequirements.payTo
8. ✅ **Nonce Check** - Nonce not already used on-chain
9. ✅ **Balance Check** - Payer has sufficient USDC balance
10. ✅ **Fee Allowance** (`exact` only, checked here) - recipient's USDC allowance for the facilitator must cover the flat fee, or verification fails with `insufficient_fee_allowance`

> Note: `/verify` applies to `exact` payments and to `batch-settlement` deposit/voucher payloads. `batch-settlement` **claim** and **settle** payloads are settlement _commands_ (not future payments) and are handled directly by `/settle` without a verify step — the scheme validates them internally, including the equivalent fee-allowance check (see *Recipient gating* above).

## Error Codes

Error-reason strings come from the `@x402/evm` SDK and are prefixed by scheme (`invalid_exact_evm_*` / `invalid_batch_settlement_evm_*`). Common ones:

| Error Code                                          | Description                                                 |
| --------------------------------------------------- | ----------------------------------------------------------- |
| `invalid_exact_evm_insufficient_balance`            | Payer doesn't have enough USDC (`exact`)                    |
| `invalid_exact_evm_signature`                       | Invalid EIP-712 signature                                   |
| `invalid_exact_evm_network_mismatch`                | Signed vs. settle network mismatch                          |
| `invalid_exact_evm_scheme`                          | Scheme not supported                                        |
| `invalid_batch_settlement_evm_insufficient_balance` | Channel balance too low for the voucher                     |
| `invalid_batch_settlement_evm_payload_type`         | Payload type not verifiable via `/verify`, or (on `/settle`) a `claim`/`settle` payload missing a usable receiver |
| `insufficient_fee_allowance`                        | Recipient's USDC allowance for the facilitator is too low — `exact`, or `batch-settlement` `claim`/`settle` |
| `invalid_network`                                   | Network not supported                                       |
| `invalid_payload`                                   | Malformed payload                                           |
| `unexpected_verify_error`                           | Unexpected error                                            |

> These strings were renamed by `@x402/evm` in the 2.x line; the tests in `test/` are the source of truth for the current values.

## Security Considerations

### Trust Model

The x402 protocol requires **explicit trust** in the Facilitator. Both the Payer (client) and the Resource Server must trust the Facilitator to act honestly.

```
┌─────────────────────────────────────────────────────────┐
│                     TRUST MODEL                         │
│                                                         │
│  Payer ──────────── Facilitator ────────── Resource    │
│        trusts           │           Server trusts      │
│                         │                              │
│                         ▼                              │
│                MUST BE TRUSTWORTHY                     │
└─────────────────────────────────────────────────────────┘
```

### What the Facilitator Controls

| Control                       | Risk                           |
| ----------------------------- | ------------------------------ |
| EIP-3009 signature from Payer | Can trigger settlement         |
| Verification result           | Can lie ("invalid" when valid) |
| Settlement execution          | Can delay or omit              |
| Response to Resource Server   | Can report false status        |

### What EIP-3009 Protects (Even with Malicious Facilitator)

The cryptographic signature **binds** these fields:

- **`to` (recipient)** → Facilitator **cannot** redirect funds to another address
- **`value` (amount)** → Facilitator **cannot** take more than signed
- **`validBefore`** → Signature expires automatically

**Key insight:** A malicious Facilitator cannot **steal** funds – only send them to the designated `payTo` address.

### Potential Attack Vectors

1. **Settlement without Service (Fraud)**
   - Facilitator executes settlement but reports failure to Resource Server
   - Payer loses money, receives no service

2. **Denial of Service**
   - Facilitator accepts signature but never settles
   - Signature expires (`validBefore` timeout)

3. **Cross-Chain Replay** (Fixed in this implementation)
   - Signature created for one chain, settled on another
   - Mitigated by chain-bound viem clients (one `ExactEvmScheme` per network)

### Recommendations

1. **Use only known Facilitators** (e.g., verified x402 implementations)
2. **Implement Facilitator whitelist** in client applications
3. **Verify settlement on-chain** (don't trust Facilitator response alone)
4. **Start with small amounts** when testing new services
5. **Monitor for network mismatches** between signed and settled transactions

### Multi-Chain Security

This Facilitator creates **separate signers per network** to prevent cross-chain attacks:

```javascript
// Each network gets its own chain-bound signer
for (const network of getSupportedNetworks()) {
  const scheme = createSignerForNetwork(account, network);
  facilitator.register(network, scheme);
}
```

This ensures that signatures for Mainnet (chainId 10) are validated with a Mainnet client, preventing accidental or malicious settlement on the wrong chain.

## Fee model history

Two fee models were implemented here. Neither is friction-free without protocol support; the choice is about _where_ the friction lands.

- **Buyer-pays split** (`x402_splitter_*.js`, `EIP3009SplitterV1`) — retired, retained but not deployed or built. The buyer signs a single EIP-3009 authorization to a splitter contract, which atomically pays seller and facilitator. The seller needs no setup, but the buyer needs a non-stock client, and `payTo` shows the splitter rather than the actual recipient — so the buyer cannot see who they are paying from the payment requirements alone.
- **Merchant-pays post-settlement** (`x402_fee.ts`) — current. The buyer is entirely untouched and stock `@x402/fetch` works. The seller must `approve()` the facilitator wallet for USDC and trust it not to over-pull.

The current model matches the industry norm — Stripe and Coinbase CDP bill the merchant, not the payer. It does not eliminate onboarding friction; it moves it from the buyer to the seller.

The splitter contract at `0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946` (Optimism Sepolia) stays deployed: it is referenced from [x402#937](https://github.com/x402-foundation/x402/issues/937).

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
- [ ] Configure `BATCH_SETTLEMENT_TEST_WALLETS` if testnet dev convenience is needed
- [ ] Test all endpoints after deployment
- [ ] Set up monitoring and alerts in Scaleway Console
- [ ] Document endpoint URLs for client applications

## Testing

```bash
# Run the hermetic unit suite (no network)
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- x402_verify.test.js

# Run the integration suite (real EIP-712 signatures against live Base Sepolia /
# Optimism RPC — network-dependent, kept out of `npm test`)
npm run test:integration
```

Unit tests (`npm test`) are hermetic — the `@x402/evm` SDK and viem are mocked. Tests that build a real signature and exercise on-chain reads live under `test/integration/` and run via `npm run test:integration` (see `vitest.integration.config.js`).

## Supported Networks & Assets

USDC addresses and EIP-712 domain names come from `@fretchen/chain-utils`; `chain_utils.ts` is the source of truth. `exact` works on all four networks; `batch-settlement` is gated to those with the contract deployed (last column).

| Network          | CAIP-2            | USDC                                         | USDC domain name | batch-settlement |
| ---------------- | ----------------- | -------------------------------------------- | ---------------- | ---------------- |
| Optimism Mainnet | `eip155:10`       | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` | `USD Coin`       | ✅               |
| Optimism Sepolia | `eip155:11155420` | `0x5fd84259d66Cd46123540766Be93DFE6D43130D7` | `USDC`           | ❌ (no contract) |
| Base Mainnet     | `eip155:8453`     | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | `USD Coin`       | ✅               |
| Base Sepolia     | `eip155:84532`    | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | `USDC`           | ✅               |

The canonical `batch-settlement` contract is deployed at the same address on every supported chain: `0x4020074e9dF2ce1deE5A9C1b5c3f541D02a10003`.

## EIP-712 Signature Verification

The facilitator uses [viem](https://viem.sh/) for EIP-712 signature verification:

**Critical Implementation Details:**

1. **Token Name**: The EIP-712 domain name is **per-network** — testnets use `"USDC"`, mainnets use `"USD Coin"` (see the table above). Never hardcode it; source it from `chain_utils.ts` / `@fretchen/chain-utils`. Getting this wrong silently breaks signature verification.
2. **Full EIP-712 Hash**: `keccak256("\x19\x01" || domainSeparator || messageHash)`
3. **BigInt Conversion**: All uint256 fields must be BigInt

**Validation:** Reference tests in `eip712_reference.test.js` validate against official EIP-712 specification.

## Project Structure

```
x402_facilitator/
├── x402_facilitator.ts           # Main handler (path-based routing)
├── x402_verify.ts                # Verification logic
├── x402_settle.ts                # Settlement logic
├── x402_fee.ts                   # Fee collection (merchant-pays, current model)
├── x402_supported.ts             # Supported networks/schemes + fee disclosure
├── x402_whitelist.ts             # batch-settlement claim/settle test-wallet bypass
├── facilitator_instance.ts       # Shared x402Facilitator + onAfterVerify fee hook
├── chain_utils.ts                # Centralized chain config
├── wallet_report_cron.ts         # Weekly wallet balance report
├── serverless.yml                # Scaleway deployment config
├── package.json
│
│   # Retired — buyer-pays splitter. Not deployed, not built; see "Fee model history".
├── x402_splitter_facilitator.js
├── x402_splitter_verify.js
├── x402_splitter_settle.js
├── x402_splitter_supported.js
│
└── test/                         # incl. retained x402_splitter_*.test.js
```

## Links

- [x402 Specification](https://github.com/coinbase/x402)
- [EIP-3009: Transfer With Authorization](https://eips.ethereum.org/EIPS/eip-3009)
- [Scaleway Functions Documentation](https://www.scaleway.com/en/docs/serverless/functions/)
- [viem Documentation](https://viem.sh/)

## License

MIT
