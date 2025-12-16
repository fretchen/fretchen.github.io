---
publishing_date: 2025-12-21
title: x402 v2 Facilitator für Optimism - Implementierungsplan
category: "blockchain"
description: "Implementierungsplan für einen x402 v2 Facilitator auf Optimism als Scaleway Function. Der Facilitator verifiziert und settlet Zahlungen via EIP-3009 USDC Transaktionen."
---

# x402 v2 Facilitator für Optimism - Implementierungsplan

## Überblick

Dieser Plan beschreibt die Implementierung eines x402 v2 Facilitators als Scaleway Function, der Zahlungen auf Optimism (Layer 2) abwickelt. Der Facilitator ermöglicht es Resource Servern, Blockchain-Zahlungen zu verifizieren und zu settlen, ohne selbst Blockchain-Infrastruktur betreiben zu müssen.

## Architektur

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

## Komponenten

### 1. Scaleway Function Setup

**Dateistruktur:**
```
scw_js/
└── x402_facilitator/
    ├── x402_facilitator.js          # Haupthandler
    ├── x402_verify.js                # Verifikationslogik
    ├── x402_settle.js                # Settlement-Logik
    ├── x402_supported.js             # Unterstützte Netzwerke/Schemes
    ├── x402_discovery.js             # Discovery API (optional)
    └── test/
        ├── x402_facilitator.test.js
        ├── x402_verify.test.js
        └── x402_settle.test.js
```

**Environment Variables:**
```bash
# Blockchain
FACILITATOR_WALLET_PRIVATE_KEY=   # Wallet für Settlement-Transaktionen
OPTIMISM_RPC_URL=                  # Optimism Mainnet RPC
OPTIMISM_SEPOLIA_RPC_URL=          # Optimism Sepolia (Testnet)

# USDC Contract Addresses
USDC_OPTIMISM=0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85
USDC_OPTIMISM_SEPOLIA=0x5fd84259d66Cd46123540766Be93DFE6D43130D7

# S3 für Discovery (optional)
SCW_ACCESS_KEY=
SCW_SECRET_KEY=

# Logging
LOG_LEVEL=info
```

### 2. API Endpoints

Der Facilitator implementiert die Standard-x402-v2-APIs:

#### 2.1 POST /verify
**Zweck:** Verifiziert eine Payment Authorization ohne On-Chain-Transaktion

**Request Body:**
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
  "paymentRequirements": { /* gleiche Struktur wie accepted */ }
}
```

**Response (Success):**
```json
{
  "isValid": true,
  "payer": "0x857b06519E91e3A54538791bDbb0E22373e36b66"
}
```

**Response (Error):**
```json
{
  "isValid": false,
  "invalidReason": "insufficient_funds",
  "payer": "0x857b06519E91e3A54538791bDbb0E22373e36b66"
}
```

**Verifikationsschritte:**
1. **Signatur-Validierung:** EIP-712-Signatur mit recoveredAddress = from
2. **Balance-Check:** Payer hat genug USDC
3. **Amount-Check:** value ≥ required amount
4. **Time-Window:** validAfter ≤ now < validBefore
5. **Parameter-Match:** authorization.to === paymentRequirements.payTo
6. **Nonce-Check:** Nonce noch nicht verwendet (simulieren via Contract Call)
7. **Transaction-Simulation:** `transferWithAuthorization` würde erfolgreich sein

#### 2.2 POST /settle
**Zweck:** Führt die verifizierte Zahlung on-chain aus

**Request:** Identisch zu `/verify`

**Response (Success):**
```json
{
  "success": true,
  "payer": "0x857b06519E91e3A54538791bDbb0E22373e36b66",
  "transaction": "0x1234...abcdef",
  "network": "eip155:10"
}
```

**Response (Error):**
```json
{
  "success": false,
  "errorReason": "insufficient_funds",
  "payer": "0x857b06519E91e3A54538791bDbb0E22373e36b66",
  "transaction": "",
  "network": "eip155:10"
}
```

**Settlement-Prozess:**
1. Vollständige Verifikation durchführen (wie `/verify`)
2. `transferWithAuthorization` auf USDC-Contract aufrufen
3. Transaction hash zurückgeben
4. Bei Fehler: errorReason mit spezifischem x402-Error-Code

#### 2.3 GET /supported
**Zweck:** Liste unterstützter Payment Schemes und Netzwerke

**Response:**
```json
{
  "kinds": [
    {
      "x402Version": 2,
      "scheme": "exact",
      "network": "eip155:10"
    },
    {
      "x402Version": 2,
      "scheme": "exact",
      "network": "eip155:11155420"
    }
  ],
  "extensions": [],
  "signers": {
    "eip155:*": ["0x..."]
  }
}
```

#### 2.4 GET /discovery/resources (Optional)
**Zweck:** Discovery-API für x402-enabled Resources

Speichert registrierte Resources in S3 (`x402/resources.json`) und ermöglicht Discovery durch Clients.

**Query Parameters:**
- `type`: Filter nach Resource-Typ (z.B. "http")
- `limit`: Max. Anzahl Ergebnisse (1-100, default: 20)
- `offset`: Pagination offset (default: 0)

### 3. Technische Implementierung

#### 3.1 EIP-3009 Integration

**USDC Contract ABI (nur relevante Funktionen):**
```javascript
const USDC_EIP3009_ABI = [
  {
    name: 'transferWithAuthorization',
    type: 'function',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' }
    ],
    outputs: []
  },
  {
    name: 'authorizationState',
    type: 'function',
    inputs: [
      { name: 'authorizer', type: 'address' },
      { name: 'nonce', type: 'bytes32' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
];
```

#### 3.2 EIP-712 Signatur-Verifikation

```javascript
import { verifyTypedData } from 'viem';

const EIP712_DOMAIN = {
  name: 'USD Coin',
  version: '2',
  chainId: 10, // oder 11155420 für Sepolia
  verifyingContract: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'
};

const EIP712_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' }
  ]
};

async function verifySignature(authorization, signature, chainId, usdcAddress) {
  const domain = { ...EIP712_DOMAIN, chainId, verifyingContract: usdcAddress };
  
  const recoveredAddress = await verifyTypedData({
    domain,
    types: EIP712_TYPES,
    primaryType: 'TransferWithAuthorization',
    message: authorization,
    signature
  });
  
  return recoveredAddress.toLowerCase() === authorization.from.toLowerCase();
}
```

#### 3.3 Viem Integration

```javascript
import { createPublicClient, createWalletClient, http, getContract } from 'viem';
import { optimism, optimismSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

function getChain(network) {
  if (network === 'eip155:10') return optimism;
  if (network === 'eip155:11155420') return optimismSepolia;
  throw new Error(`Unsupported network: ${network}`);
}

function getUSDCAddress(network) {
  if (network === 'eip155:10') return '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85';
  if (network === 'eip155:11155420') return '0x5fd84259d66Cd46123540766Be93DFE6D43130D7';
  throw new Error(`Unknown USDC address for network: ${network}`);
}

async function createClients(network) {
  const chain = getChain(network);
  
  const publicClient = createPublicClient({
    chain,
    transport: http()
  });
  
  const account = privateKeyToAccount(
    `0x${process.env.FACILITATOR_WALLET_PRIVATE_KEY}`
  );
  
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http()
  });
  
  return { publicClient, walletClient, account };
}
```

#### 3.4 Error Handling

**x402 v2 Error Codes:**
```javascript
const X402_ERRORS = {
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  INVALID_SIGNATURE: 'invalid_exact_evm_payload_signature',
  INVALID_AMOUNT: 'invalid_exact_evm_payload_authorization_value',
  INVALID_TIME_AFTER: 'invalid_exact_evm_payload_authorization_valid_after',
  INVALID_TIME_BEFORE: 'invalid_exact_evm_payload_authorization_valid_before',
  INVALID_RECIPIENT: 'invalid_exact_evm_payload_recipient_mismatch',
  INVALID_NETWORK: 'invalid_network',
  INVALID_PAYLOAD: 'invalid_payload',
  UNSUPPORTED_SCHEME: 'unsupported_scheme',
  INVALID_VERSION: 'invalid_x402_version',
  TRANSACTION_FAILED: 'invalid_transaction_state',
  VERIFY_ERROR: 'unexpected_verify_error',
  SETTLE_ERROR: 'unexpected_settle_error'
};
```

### 4. Sicherheitsaspekte

#### 4.1 Replay Attack Prevention
- **EIP-3009 Nonce:** Jede Authorization hat eindeutige 32-Byte-Nonce
- **Blockchain-Schutz:** USDC-Contract verhindert Nonce-Reuse automatisch
- **Time Constraints:** validAfter/validBefore begrenzen Gültigkeit
- **Signature Verification:** Kryptographische Signatur vom Payer

#### 4.2 Weitere Sicherheitsmaßnahmen
- **Rate Limiting:** Scaleway Function Rate Limits nutzen
- **Input Validation:** Alle Parameter validieren (Adressen, Beträge, etc.)
- **Gas Price Limits:** Maximal erlaubte Gas-Preise setzen
- **Wallet Security:** Private Key nur in Environment Variables
- **Logging:** Alle Transaktionen für Audit Trail loggen

### 5. Testing-Strategie

#### 5.1 Unit Tests
```javascript
// test/x402_verify.test.js
describe('x402 Verify', () => {
  test('verifies valid EIP-712 signature', async () => { /* ... */ });
  test('rejects insufficient balance', async () => { /* ... */ });
  test('rejects expired authorization', async () => { /* ... */ });
  test('rejects invalid amount', async () => { /* ... */ });
  test('rejects mismatched recipient', async () => { /* ... */ });
});

// test/x402_settle.test.js
describe('x402 Settle', () => {
  test('settles valid payment on-chain', async () => { /* ... */ });
  test('returns transaction hash', async () => { /* ... */ });
  test('handles contract errors', async () => { /* ... */ });
});
```

#### 5.2 Integration Tests
- **Testnet:** Optimism Sepolia verwenden
- **Test USDC:** Faucet für Test-USDC verwenden
- **End-to-End:** Kompletten Payment Flow testen (402 → Payment → 200)

#### 5.3 Lokales Testing
```javascript
// Local test server (wie bei sc_llm.js)
if (process.env.NODE_ENV === 'test') {
  (async () => {
    const dotenv = await import('dotenv');
    dotenv.config();
    
    const scw_fnc_node = await import('@scaleway/serverless-functions');
    scw_fnc_node.serveHandler(handle, 8080);
  })();
}
```

### 6. Deployment

#### 6.1 Serverless.yml Konfiguration
```yaml
x402-facilitator-verify:
  handler: x402_facilitator.verifyHandler
  env:
    FACILITATOR_WALLET_PRIVATE_KEY: ${env:FACILITATOR_WALLET_PRIVATE_KEY}
    OPTIMISM_RPC_URL: ${env:OPTIMISM_RPC_URL}
    OPTIMISM_SEPOLIA_RPC_URL: ${env:OPTIMISM_SEPOLIA_RPC_URL}
  minScale: 0
  maxScale: 10
  memoryLimit: 256

x402-facilitator-settle:
  handler: x402_facilitator.settleHandler
  env:
    FACILITATOR_WALLET_PRIVATE_KEY: ${env:FACILITATOR_WALLET_PRIVATE_KEY}
    OPTIMISM_RPC_URL: ${env:OPTIMISM_RPC_URL}
    OPTIMISM_SEPOLIA_RPC_URL: ${env:OPTIMISM_SEPOLIA_RPC_URL}
  minScale: 0
  maxScale: 10
  memoryLimit: 256

x402-facilitator-supported:
  handler: x402_facilitator.supportedHandler
  minScale: 0
  maxScale: 5
  memoryLimit: 128
```

#### 6.2 Deployment-Prozess
```bash
# Dependencies installieren
npm install viem

# Tests ausführen
npm run test

# Deploy to Scaleway
serverless deploy --stage production
```

### 7. Monitoring & Observability

#### 7.1 Logging
```javascript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
});

// Log alle Transaktionen
logger.info({
  action: 'settle',
  payer: '0x...',
  amount: '10000',
  txHash: '0x...',
  network: 'eip155:10'
});
```

#### 7.2 Metrics
- **Verification Success Rate:** % erfolgreiche Verifikationen
- **Settlement Success Rate:** % erfolgreiche Settlements
- **Average Response Time:** Latenz pro Endpoint
- **Error Rate by Type:** Häufigkeit verschiedener Error-Codes
- **Transaction Volume:** Anzahl/Wert verarbeiteter Zahlungen

#### 7.3 Alerts
- Settlement Failures > 5%
- RPC Errors
- Wallet Balance < Threshold
- Response Time > 3s

### 8. Betriebskosten

#### 8.1 Scaleway Functions
- **Requests:** ~€0.15 pro 1M Requests
- **Compute:** ~€1.20 pro 100k GB-Sekunden
- **Schätzung:** ~€5-10/Monat bei 10k Requests/Monat

#### 8.2 Optimism Gas Fees
- **L2 Gas:** ~0.001 USDC pro Transaction
- **Facilitator zahlt Gas:** Aus eigenem Wallet
- **Business Model:** Fee in payTo-Betrag einkalkulieren oder separate Fee

### 9. Roadmap & Erweiterungen

#### Phase 1: MVP (Woche 1-2)
- [x] `/verify` Endpoint
- [x] `/settle` Endpoint
- [x] `/supported` Endpoint
- [x] Optimism Mainnet Support
- [x] Optimism Sepolia Support
- [x] EIP-3009 USDC Integration
- [x] Unit Tests

#### Phase 2: Production Ready (Woche 3)
- [ ] Integration Tests
- [ ] Error Handling & Logging
- [ ] Rate Limiting
- [ ] Documentation
- [ ] Deploy to Production

#### Phase 3: Enhancements (Woche 4+)
- [ ] `/discovery/resources` API
- [ ] Multi-Token Support (andere ERC-20)
- [ ] Base Network Support (eip155:8453)
- [ ] Caching Layer (Redis)
- [ ] Admin Dashboard
- [ ] Batch Settlement

### 10. Integration Beispiel

#### 10.1 Resource Server Integration

```javascript
// Express.js Middleware
import axios from 'axios';

const FACILITATOR_URL = 'https://x402-facilitator.functions.fnc.fr-par.scw.cloud';

async function x402Middleware(req, res, next) {
  const paymentSignature = req.headers['payment-signature'];
  
  if (!paymentSignature) {
    // 402 Payment Required
    const paymentRequired = {
      x402Version: 2,
      error: 'PAYMENT-SIGNATURE header required',
      resource: {
        url: `https://api.example.com${req.path}`,
        description: 'Premium API access',
        mimeType: 'application/json'
      },
      accepts: [{
        scheme: 'exact',
        network: 'eip155:10',
        amount: '10000', // 0.01 USDC
        asset: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        payTo: '0xYourMerchantWallet',
        maxTimeoutSeconds: 60,
        extra: { name: 'USDC', version: '2' }
      }],
      extensions: {}
    };
    
    const encoded = Buffer.from(JSON.stringify(paymentRequired)).toString('base64');
    res.status(402)
      .header('PAYMENT-REQUIRED', encoded)
      .json({ error: 'Payment required' });
    return;
  }
  
  // Decode payment payload
  const paymentPayload = JSON.parse(
    Buffer.from(paymentSignature, 'base64').toString()
  );
  
  // Verify with facilitator
  try {
    const { data } = await axios.post(`${FACILITATOR_URL}/settle`, {
      paymentPayload,
      paymentRequirements: paymentRequired.accepts[0]
    });
    
    if (data.success) {
      // Payment settled successfully
      const settlementResponse = Buffer.from(JSON.stringify(data)).toString('base64');
      res.header('PAYMENT-RESPONSE', settlementResponse);
      next(); // Continue to actual handler
    } else {
      // Payment failed
      res.status(402)
        .header('PAYMENT-RESPONSE', Buffer.from(JSON.stringify(data)).toString('base64'))
        .json({ error: `Payment failed: ${data.errorReason}` });
    }
  } catch (error) {
    res.status(500).json({ error: 'Payment processing error' });
  }
}

// Use middleware
app.get('/premium-data', x402Middleware, (req, res) => {
  res.json({ data: 'Premium content' });
});
```

#### 10.2 Client Integration (AI Agent)

```javascript
import axios from 'axios';

async function callPaidAPI(url, walletClient, facilitatorUrl) {
  // 1. Initial Request ohne Payment
  try {
    const response = await axios.get(url);
    return response.data; // Kein Payment nötig
  } catch (error) {
    if (error.response?.status !== 402) throw error;
    
    // 2. Parse Payment Requirements
    const paymentRequiredHeader = error.response.headers['payment-required'];
    const paymentRequired = JSON.parse(
      Buffer.from(paymentRequiredHeader, 'base64').toString()
    );
    
    const requirement = paymentRequired.accepts[0];
    
    // 3. Create EIP-712 Signature
    const now = Math.floor(Date.now() / 1000);
    const authorization = {
      from: walletClient.account.address,
      to: requirement.payTo,
      value: requirement.amount,
      validAfter: now.toString(),
      validBefore: (now + 60).toString(),
      nonce: '0x' + randomBytes(32).toString('hex')
    };
    
    const signature = await walletClient.signTypedData({
      domain: {
        name: 'USD Coin',
        version: '2',
        chainId: 10,
        verifyingContract: requirement.asset
      },
      types: {
        TransferWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' }
        ]
      },
      primaryType: 'TransferWithAuthorization',
      message: authorization
    });
    
    // 4. Retry Request mit Payment
    const paymentPayload = {
      x402Version: 2,
      resource: paymentRequired.resource,
      accepted: requirement,
      payload: { signature, authorization },
      extensions: {}
    };
    
    const paymentSignature = Buffer.from(
      JSON.stringify(paymentPayload)
    ).toString('base64');
    
    const paidResponse = await axios.get(url, {
      headers: {
        'PAYMENT-SIGNATURE': paymentSignature
      }
    });
    
    return paidResponse.data;
  }
}
```

## Fazit

Dieser Implementierungsplan beschreibt einen vollständigen x402 v2 Facilitator für Optimism als Scaleway Function. Der Facilitator:

✅ **Implementiert x402 v2 Spec vollständig** (`/verify`, `/settle`, `/supported`)  
✅ **Nutzt EIP-3009 für gaslose Transfers** (USDC auf Optimism)  
✅ **Skaliert automatisch** (Scaleway Functions)  
✅ **Minimale Kosten** (~€5-10/Monat)  
✅ **Produktionsreif** (Error Handling, Logging, Tests)  
✅ **Erweiterbar** (Discovery API, Multi-Network, Multi-Token)  

Der nächste Schritt wäre die tatsächliche Implementierung basierend auf diesem Plan, beginnend mit dem MVP (Phase 1).
