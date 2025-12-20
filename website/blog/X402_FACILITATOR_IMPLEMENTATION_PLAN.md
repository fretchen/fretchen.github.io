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
x402_facilitator/
├── x402_facilitator.js          # Haupthandler (path-based routing)
├── x402_verify.js                # Verifikationslogik
├── x402_settle.js                # Settlement-Logik
├── x402_supported.js             # Unterstützte Netzwerke/Schemes
├── x402_whitelist.js             # Agent Whitelist Integration
├── serverless.yml                # Scaleway Deployment Config
└── test/
    ├── x402_facilitator.test.js
    ├── x402_verify.test.js
    ├── x402_settle.test.js
    └── x402_whitelist.test.js
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

# Whitelist Contract Addresses
GENIMG_V4_OPTIMISM=               # GenImNFTv4 Mainnet Address
GENIMG_V4_SEPOLIA=                # GenImNFTv4 Sepolia Address
LLMV1_OPTIMISM=                   # LLMv1 Mainnet Address (optional)
LLMV1_SEPOLIA=                    # LLMv1 Sepolia Address (optional)

# Whitelist Configuration
WHITELIST_SOURCES=genimg_v4,llmv1  # Comma-separated sources
WHITELIST_LOGIC=OR                 # OR | AND
TEST_WALLETS=                      # Testnet-only wallets (comma-separated)

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
1. **Whitelist-Check:** Agent ist in Whitelist-Contract(s) authorisiert
2. **Signatur-Validierung:** EIP-712-Signatur mit recoveredAddress = from
3. **Balance-Check:** Payer hat genug USDC
4. **Amount-Check:** value ≥ required amount
5. **Time-Window:** validAfter ≤ now < validBefore
6. **Parameter-Match:** authorization.to === paymentRequirements.payTo
7. **Nonce-Check:** Nonce noch nicht verwendet (simulieren via Contract Call)
8. **Transaction-Simulation:** `transferWithAuthorization` würde erfolgreich sein

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
1. Whitelist-Check durchführen (Agent authorized?)
2. Vollständige Verifikation durchführen (wie `/verify`)
3. `transferWithAuthorization` auf USDC-Contract aufrufen
4. Transaction hash zurückgeben
5. Bei Fehler: errorReason mit spezifischem x402-Error-Code

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

#### 3.4 Agent Whitelist Integration

**Multi-Source Whitelist System:**
```javascript
// x402_whitelist.js
import { createPublicClient, http, getContract } from 'viem';
import { optimism, optimismSepolia } from 'viem/chains';

// Contract Configurations
const GENIMG_V4_ABI = [
  {
    name: 'isAuthorizedAgent',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentWallet', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }]
  }
];

const LLMV1_ABI = [
  {
    name: 'isAuthorizedAgent',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }]
  }
];

const WHITELIST_CONTRACTS = {
  'eip155:10': {
    genImgV4: process.env.GENIMG_V4_OPTIMISM,
    llmV1: process.env.LLMV1_OPTIMISM
  },
  'eip155:11155420': {
    genImgV4: process.env.GENIMG_V4_SEPOLIA,
    llmV1: process.env.LLMV1_SEPOLIA
  }
};

// Test Wallets (nur Testnet)
const TEST_WALLETS = new Set(
  process.env.TEST_WALLETS?.split(',').map(a => a.toLowerCase().trim()) || []
);

/**
 * Prüft ob Agent in irgendeiner Whitelist-Quelle authorisiert ist
 */
export async function isWhitelistedAgent(agentAddress, network) {
  const normalizedAddress = agentAddress.toLowerCase();
  
  // 1. Test Wallets Check (nur Testnet)
  if (network === 'eip155:11155420' && TEST_WALLETS.has(normalizedAddress)) {
    return { authorized: true, source: 'test_wallet' };
  }
  
  // 2. Create RPC Client
  const chain = network === 'eip155:10' ? optimism : optimismSepolia;
  const publicClient = createPublicClient({
    chain,
    transport: http()
  });
  
  // 3. Parallel Contract Checks
  const sources = process.env.WHITELIST_SOURCES?.split(',') || ['genimg_v4'];
  const checks = await Promise.all(
    sources.map(async (source) => {
      const contractAddress = WHITELIST_CONTRACTS[network]?.[source];
      if (!contractAddress) return { source, authorized: false };
      
      try {
        const abi = source === 'genimg_v4' ? GENIMG_V4_ABI : LLMV1_ABI;
        const contract = getContract({
          address: contractAddress,
          abi,
          client: publicClient
        });
        
        const authorized = await contract.read.isAuthorizedAgent([normalizedAddress]);
        return { source, authorized };
      } catch (error) {
        console.error(`Whitelist check failed for ${source}: ${error.message}`);
        return { source, authorized: false };
      }
    })
  );
  
  // 4. OR Logic: einer muss true sein
  const authorizedCheck = checks.find(c => c.authorized);
  if (authorizedCheck) {
    return { authorized: true, source: authorizedCheck.source };
  }
  
  return { authorized: false, source: null };
}

// Optional: Caching Layer
const whitelistCache = new Map();
const CACHE_TTL = 60000; // 1 Minute

export async function isWhitelistedAgentCached(agentAddress, network) {
  const cacheKey = `${agentAddress}:${network}`;
  const cached = whitelistCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  
  const result = await isWhitelistedAgent(agentAddress, network);
  whitelistCache.set(cacheKey, { result, timestamp: Date.now() });
  
  return result;
}
```

**Integration in Verify/Settle:**
```javascript
// x402_verify.js
import { isWhitelistedAgentCached } from './x402_whitelist.js';

export async function verify(paymentPayload, paymentRequirements) {
  const { authorization } = paymentPayload.payload;
  const { network } = paymentRequirements;
  
  // Whitelist Check
  const whitelistResult = await isWhitelistedAgentCached(
    authorization.from,
    network
  );
  
  if (!whitelistResult.authorized) {
    return {
      isValid: false,
      invalidReason: 'agent_not_whitelisted',
      payer: authorization.from,
      message: 'Agent wallet is not authorized in any whitelist source'
    };
  }
  
  console.log(`Agent ${authorization.from} authorized via ${whitelistResult.source}`);
  
  // Rest der Verifikation...
}
```

#### 3.5 Error Handling

**x402 v2 Error Codes:**
```javascript
const X402_ERRORS = {
  AGENT_NOT_WHITELISTED: 'agent_not_whitelisted',
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

#### 4.1 Agent Whitelist Access Control
- **On-Chain Source of Truth:** Smart Contracts (GenImNFTv4, LLMv1) als Master
- **Multi-Source Support:** Mehrere Whitelist-Contracts parallel prüfen
- **Test Wallets:** Separate Liste für Development (nur Testnet)
- **Caching:** 1-Minute TTL für Performance, automatische Invalidierung
- **OR Logic:** Agent muss nur in EINER Quelle authorized sein
- **Fail-Safe:** Bei Contract-Error wird Access denied

#### 4.2 Replay Attack Prevention
- **EIP-3009 Nonce:** Jede Authorization hat eindeutige 32-Byte-Nonce
- **Blockchain-Schutz:** USDC-Contract verhindert Nonce-Reuse automatisch
- **Time Constraints:** validAfter/validBefore begrenzen Gültigkeit
- **Signature Verification:** Kryptographische Signatur vom Payer

#### 4.3 Weitere Sicherheitsmaßnahmen
- **Rate Limiting:** Scaleway Function Rate Limits nutzen
- **Input Validation:** Alle Parameter validieren (Adressen, Beträge, etc.)
- **Gas Price Limits:** Maximal erlaubte Gas-Preise setzen
- **Wallet Security:** Private Key nur in Environment Variables
- **Logging:** Alle Transaktionen für Audit Trail loggen
- **Public /supported:** Kein Auth für Discovery (x402 Standard)

### 5. Testing-Strategie

#### 5.1 Unit Tests
```javascript
// test/x402_whitelist.test.js
describe('Agent Whitelist', () => {
  test('authorizes whitelisted GenImgV4 agent', async () => { /* ... */ });
  test('rejects non-whitelisted agent', async () => { /* ... */ });
  test('allows test wallets on testnet only', async () => { /* ... */ });
  test('caches whitelist results', async () => { /* ... */ });
});

// test/x402_verify.test.js
describe('x402 Verify', () => {
  test('rejects non-whitelisted agent', async () => { /* ... */ });
  test('verifies valid EIP-712 signature', async () => { /* ... */ });
  test('rejects insufficient balance', async () => { /* ... */ });
  test('rejects expired authorization', async () => { /* ... */ });
  test('rejects invalid amount', async () => { /* ... */ });
  test('rejects mismatched recipient', async () => { /* ... */ });
});

// test/x402_settle.test.js
describe('x402 Settle', () => {
  test('rejects non-whitelisted agent before settlement', async () => { /* ... */ });
  test('settles valid payment on-chain', async () => { /* ... */ });
  test('returns transaction hash', async () => { /* ... */ });
  test('handles contract errors', async () => { /* ... */ });
});
```

#### 5.2 Integration Tests
- **Testnet:** Optimism Sepolia verwenden
- **Test USDC:** Faucet für Test-USDC verwenden
- **Whitelist Setup:** Test Agent in GenImNFTv4 authorizen
- **End-to-End:** Kompletten Payment Flow testen (402 → Payment → 200)
- **Multi-Source:** Beide Whitelist-Contracts (GenImgV4 + LLMv1) testen

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
service: x402-facilitator

useDotenv: true
configValidationMode: off

provider:
  name: scaleway
  runtime: node22
  env:
    NODE_ENV: production
    LOG_LEVEL: info
    # Whitelist Configuration
    WHITELIST_SOURCES: "genimg_v4,llmv1"
    WHITELIST_LOGIC: "OR"
    # Contract Addresses - Mainnet
    GENIMG_V4_OPTIMISM: "${env:GENIMG_V4_OPTIMISM}"
    LLMV1_OPTIMISM: "${env:LLMV1_OPTIMISM}"
    # Contract Addresses - Testnet
    GENIMG_V4_SEPOLIA: "${env:GENIMG_V4_SEPOLIA}"
    LLMV1_SEPOLIA: "${env:LLMV1_SEPOLIA}"
    # Test Wallets (Testnet only)
    TEST_WALLETS: "${env:TEST_WALLETS}"
  secret:
    FACILITATOR_WALLET_PRIVATE_KEY: ${env:FACILITATOR_WALLET_PRIVATE_KEY}
    OPTIMISM_RPC_URL: ${env:OPTIMISM_RPC_URL, "https://mainnet.optimism.io"}
    OPTIMISM_SEPOLIA_RPC_URL: ${env:OPTIMISM_SEPOLIA_RPC_URL, "https://sepolia.optimism.io"}

plugins:
  - serverless-scaleway-functions

functions:
  facilitator:
    handler: x402_facilitator.handle
    description: x402 v2 payment facilitator with path-based routing and agent whitelisting
    memoryLimit: 512
    timeout: 60s
    custom_domains:
      - facilitator.fretchen.eu
```

#### 6.2 Deployment-Prozess
```bash
# Dependencies installieren
npm install viem

# Whitelist-Contracts deployen/verifizieren
# (GenImNFTv4 + LLMv1 bereits deployed)

# Agents authorizen (on-chain)
npx hardhat run scripts/authorize-agent.js --network optimismSepolia
# Beispiel: authorizeAgentWallet(0xAAEBC1441323B8ad6Bdf6793A8428166b510239C)

# Environment Setup
cp .env.example .env
# Fülle FACILITATOR_WALLET_PRIVATE_KEY, Contract Addresses, etc.

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

### 9. Integration Beispiel

#### 9.1 Resource Server Integration

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

#### 9.2 Client Integration (AI Agent)

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

## Kritisches Problem: Facilitator-Kompensation

### Das Problem

**x402 hat keine standardisierte Lösung für die Bezahlung des Facilitators.** 

Nach tiefgehender Analyse des x402-Protokolls (v1 und v2) und des zugrunde liegenden EIP-3009-Standards wurde ein fundamentales Architekturproblem identifiziert:

#### EIP-3009 Limitation
```javascript
// EIP-3009 erlaubt NUR EINEN Transfer pro Signatur:
TransferWithAuthorization(
  address from,    // Payer
  address to,      // Recipient (nur einer!)
  uint256 value    // Betrag (nur ein Wert!)
)
```

**Unmöglich:** Mit einer Signatur sowohl Facilitator als auch Service Provider bezahlen.

#### Aktuelle Implementierung
```javascript
// x402_settle.js führt aus:
await usdcContract.write.transferWithAuthorization([
  authorization.from,    // Payer
  authorization.to,      // payTo (Service Provider)
  authorization.value,   // Gesamter Betrag
  // ...
]);

// Ergebnis:
// - Service Provider erhält: $0.03 ✓
// - Facilitator erhält: $0.00 ❌
```

Der gesamte Betrag geht an den Service Provider (`payTo`). Der Facilitator, der Gas bezahlt und Settlement durchführt, erhält **nichts on-chain**.

### Warum ist das ein Problem?

Der Facilitator:
- ✅ Verifiziert Signaturen off-chain
- ✅ Bezahlt Gas für Settlement (~$0.01-0.05)
- ✅ Betreibt Infrastruktur (Server, RPC Nodes)
- ✅ Übernimmt Risiko (failed transactions)
- ❌ **Hat keine standardisierte Einnahmequelle**

### Lösungsoptionen

#### Option 1: Off-chain Billing (x402 Standard-Ansatz)
**Implementierung:** Facilitator ist Infrastruktur-Provider wie Stripe/PayPal

```javascript
// On-Chain: User zahlt Service Provider
transferWithAuthorization(payer, serviceProvider, $0.03)

// Off-Chain: Service Provider zahlt Facilitator
// - Monatliche Rechnung (z.B. €100/Monat für 10,000 TX)
// - Pay-per-Transaction (z.B. 1% von jeder TX)
// - Subscription-Model (Flat Fee)
```

**Vorteile:**
- ✅ x402-Standard-konform
- ✅ Einfache Implementierung (heute)
- ✅ Flexibles Pricing-Model
- ✅ Keine Protokoll-Änderungen nötig

**Nachteile:**
- ❌ Off-chain Agreements nötig
- ❌ Trust zwischen Facilitator und Service Provider
- ❌ Separate Billing-Infrastruktur

#### Option 2: Smart Contract Splitter (Sofort möglich)
**Implementierung:** Custom Contract für Split-Payments

```solidity
// PaymentSplitter.sol
function splitPayment(
    address facilitator,
    address serviceProvider,
    uint256 facilitatorFee,
    uint256 serviceAmount,
    address token
) external {
    IERC20(token).transfer(facilitator, facilitatorFee);
    IERC20(token).transfer(serviceProvider, serviceAmount);
}
```

**Flow:**
1. User signiert Transfer zu Splitter Contract
2. Facilitator ruft `splitPayment()` auf
3. Contract verteilt Betrag

**Vorteile:**
- ✅ On-chain Guarantees
- ✅ Transparent
- ✅ Atomic (beide Transfers oder keiner)

**Nachteile:**
- ❌ NICHT x402-Standard (Custom Extension)
- ❌ Höhere Gas-Kosten
- ❌ Contract Deployment + Wartung
- ❌ User UX: Standard EIP-3009 Signaturen funktionieren nicht

#### Option 3: EIP-7702 Account Abstraction (Zukunft: 2026+)
**Implementierung:** EOAs können temporär Smart Contract Code ausführen

```javascript
// User delegiert zu PaymentSplitter Contract (EINE Signatur)
const delegation = await wallet.signDelegation({
  chain_id: 10,
  address: "0xPaymentSplitter",
  nonce: await wallet.getNonce()
});

// Facilitator führt Settlement aus
// EOA des Users führt automatisch splitPayment() aus
// - 1 Cent an Facilitator ✓
// - Rest an Service Provider ✓
```

**Vorteile:**
- ✅✅ Perfekte UX (nur eine Signatur)
- ✅ On-chain Guarantees
- ✅ Batching-fähig (mehrere Operationen)
- ✅ Zukunftskompatibel mit Account Abstraction

**Nachteile:**
- ❌ EIP-7702 noch nicht deployed (Draft Status)
- ❌ Wallet-Support frühestens 2026
- ❌ x402 müsste erweitert werden

**Status:** EIP-7702 wurde Mai 2024 proposed, könnte in Pectra Fork 2025 kommen, Wallet-Support Q4 2025 - Q2 2026 erwartet.

### Gewählter Ansatz: Option 1 (Off-chain Billing)

Für die aktuelle Implementierung wird **Option 1** gewählt:

**Geschäftsmodell:**
```yaml
Facilitator Services:
  - Payment Verification (off-chain)
  - Settlement Execution (on-chain)
  - Gas Sponsorship
  - Infrastructure (RPC nodes, servers)

Pricing Model:
  - Free Tier: 1,000 Transaktionen/Monat
  - Starter: €50/Monat (bis 10,000 TX)
  - Pro: €200/Monat (bis 100,000 TX)
  - Enterprise: Custom Pricing

Alternative:
  - Pay-per-Transaction: €0.01 pro Settlement
```

**Implementation:**
- Facilitator ist x402-Standard-konform
- Kein Split-Payment on-chain nötig
- Service Provider zahlen für Facilitator Services
- Einfache Migration zu EIP-7702 möglich, sobald verfügbar

### Warum x402 trotz EIP-7702 relevant bleibt

**x402 löst:** HTTP Payment Communication Standard
- ✅ Wie kommuniziert ein Server "payment required"?
- ✅ Wie entdecken Clients zahlungspflichtige APIs?
- ✅ Welches Format haben Payment Requirements?
- ✅ Wie funktioniert Off-chain Signing (kein User Gas)?

**EIP-7702 löst:** On-chain Execution Flexibility
- ✅ EOAs können komplexe Operationen batchen
- ✅ Split-Payments in einer Transaction
- ✅ Delegation zu Smart Contract Code
- ❌ Hat NICHTS mit HTTP/API Payment zu tun

**Perfekte Zukunft:** x402 + EIP-7702
```
x402:     HTTP 402 Standard + Facilitator Gas Sponsorship
EIP-7702: Flexible On-chain Execution + Split-Payments

= Best of both worlds: Standard API Payments + Better UX
```

x402 bleibt als **HTTP Payment Protocol Layer** relevant, während EIP-7702 die **On-chain Execution Layer** verbessert.

---

## Archiv: Entfernte Fee-Funktionalität

**Status:** Archiviert am 2025-12-21  
**Grund:** Komplexität ohne praktischen Nutzen; EIP-7702 wird die elegantere Lösung sein

### Wie die Fee-Funktionalität konzipiert war:

Die ursprüngliche Implementierung versuchte, Facilitator-Fees on-chain zu handhaben:

```javascript
// fee_config.js (ARCHIVIERT)
const FEE_CONFIG = {
  FLAT_FEE_USD: 0.01,           // $0.01 Facilitator Fee
  MIN_TRANSACTION_USD: 0.02,    // $0.02 Minimum Payment
  USDC_DECIMALS: 6
};

function calculateFeeInclusion(paymentValue, requiredAmount) {
  const fee = FEE_CONFIG.FLAT_FEE_USD * Math.pow(10, FEE_CONFIG.USDC_DECIMALS);
  const totalRequired = requiredAmount + fee;
  
  return {
    includesFee: paymentValue >= totalRequired,
    fee,
    requiredAmount,
    totalRequired
  };
}

function validateFeeIncluded(authorizationValue, requiredAmount) {
  const result = calculateFeeInclusion(authorizationValue, requiredAmount);
  
  if (!result.includesFee) {
    return {
      valid: false,
      reason: 'insufficient_authorization',
      expected: result.totalRequired,
      received: authorizationValue
    };
  }
  
  return { valid: true };
}
```

### Warum es nicht funktionierte:

**EIP-3009 Limitation:**
```solidity
// EIP-3009 erlaubt NUR EINEN Transfer pro Signatur
function transferWithAuthorization(
    address from,    // Payer
    address to,      // Empfänger (nur einer!)
    uint256 value    // Betrag (nur ein Wert!)
    // ...
) external;
```

**Das Problem:**
- User signiert: `transferWithAuthorization(user, recipient, $0.03)`
- Recipient erhält: $0.03
- Facilitator erhält: $0.00 ❌
- Fee-Berechnung war implementiert, aber **nicht ausführbar**

**Keine Möglichkeit für Split-Payment:**
```javascript
// UNMÖGLICH mit EIP-3009:
await usdcContract.write.transferWithAuthorization([
  payer, 
  facilitator,  // ❌ kann nicht beides sein
  recipient,    // ❌
  fee + amount  // ❌ muss gesplittet werden
]);

// Nur möglich:
await usdcContract.write.transferWithAuthorization([
  payer,
  recipient,  // NUR einer
  totalAmount // gesamter Betrag geht an einen
]);
```

### Alternativen (alle verworfen):

1. **Zwei Signaturen:** User signiert zweimal → schlechte UX
2. **Smart Contract Splitter:** Custom Contract → nicht x402-Standard
3. **Off-chain Billing:** Facilitator billt Service Provider → GEWÄHLT ✓
4. **EIP-7702:** Account Abstraction → Zukunft (2026+)

### Tests die entfernt wurden:

```javascript
// test/fee_config.test.js (GELÖSCHT)
describe('Fee Validation', () => {
  test('validates sufficient authorization with fee', () => {
    const result = validateFeeIncluded(30000, 20000); // $0.03 für $0.02 + fee
    expect(result.valid).toBe(true);
  });
  
  test('rejects insufficient authorization', () => {
    const result = validateFeeIncluded(20000, 20000); // $0.02 ohne fee
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('insufficient_authorization');
  });
});
```

### Was stattdessen implementiert wurde:

**Agent Whitelist System** (siehe Sektion 3.4):
- Facilitator kontrolliert Zugang via on-chain Whitelists
- GenImNFTv4 und LLMv1 Contracts als Source of Truth
- Keine on-chain Fees, stattdessen off-chain Billing zwischen Facilitator und Service Providern
- Einfache Migration zu EIP-7702 möglich wenn verfügbar

**Geschäftsmodell:**
```yaml
Facilitator Services:
  - Payment Verification (off-chain)
  - Settlement Execution (on-chain, Gas sponsorship)
  - Infrastructure (RPC nodes, servers)
  - Agent Whitelist Management

Pricing:
  - Free Tier: 1,000 TX/Monat
  - Starter: €50/Monat (10,000 TX)
  - Pro: €200/Monat (100,000 TX)
  - Enterprise: Custom Pricing
```

---

## Fazit

Dieser Implementierungsplan beschreibt einen vollständigen x402 v2 Facilitator für Optimism als Scaleway Function. Der Facilitator:

✅ **Implementiert x402 v2 Spec vollständig** (`/verify`, `/settle`, `/supported`)  
✅ **Agent Whitelist Access Control** (GenImNFTv4, LLMv1, Test Wallets)  
✅ **Multi-Source Whitelist** (OR Logic, parallel checks, caching)  
✅ **Nutzt EIP-3009 für gaslose Transfers** (USDC auf Optimism)  
✅ **Skaliert automatisch** (Scaleway Functions)  
✅ **Minimale Kosten** (~€5-10/Monat)  
✅ **Produktionsreif** (Error Handling, Logging, Tests)  
✅ **Erweiterbar** (Neue Whitelist-Sources einfach hinzufügbar)  
⚠️ **Facilitator-Kompensation via Off-chain Billing** (x402 Standard-Ansatz)  
🚀 **EIP-7702-kompatibel** (zukünftige Migration möglich)  
🗑️ **Fee-Funktionalität archiviert** (technisch nicht umsetzbar mit EIP-3009)

### Nächste Schritte: Implementierungs-Roadmap

#### Phase 1: Core Implementation (Woche 1)
**Ziel:** Funktionierende Basis-Funktionalität

- [ ] **x402_facilitator.js** - Haupt-Handler mit Path Routing (/verify, /settle, /supported)
- [ ] **x402_verify.js** - Verifikationslogik mit Whitelist-Check
- [ ] **x402_settle.js** - Settlement-Logik mit on-chain Execution
- [ ] **x402_supported.js** - Supported Kinds Response
- [ ] **x402_whitelist.js** - Multi-Source Whitelist System
  - GenImNFTv4 Contract Integration
  - LLMv1 Contract Integration (optional)
  - Test Wallets für Development
  - Caching Layer
- [ ] **Unit Tests** für alle Module

#### Phase 2: Testing & Contract Setup (Woche 2)
**Ziel:** Production-Ready auf Testnet

- [ ] **Integration Tests** auf Optimism Sepolia
  - End-to-End Payment Flow
  - Multi-Source Whitelist Tests
  - Error Scenarios
- [ ] **Contract Authorization** (on-chain)
  - GenImNFTv4: `authorizeAgentWallet(0x...)` auf Sepolia
  - Verify: `isAuthorizedAgent()` returns true
- [ ] **Environment Setup**
  - `.env` mit allen Contract Addresses
  - Test USDC Faucet für Sepolia
  - Test Wallet mit authorized Agent
- [ ] **Local Testing Server**
  - `npm run test:local` für Development
  - Mock Contracts für offline Testing

#### Phase 3: Deployment & Monitoring (Woche 3)
**Ziel:** Live auf Production

- [ ] **Scaleway Deployment**
  - `serverless deploy --stage production`
  - Custom Domain Setup (facilitator.fretchen.eu)
  - Environment Variables Configuration
- [ ] **Mainnet Authorization**
  - GenImNFTv4: Authorize production Agent
  - Verify on Optimism Mainnet
- [ ] **Monitoring Setup**
  - Logging (pino mit structured logs)
  - Metrics (TX count, success rate, latency)
  - Alerts (Settlement failures, RPC errors, low balance)
- [ ] **Documentation**
  - API Documentation
  - Integration Examples
  - Error Code Reference

#### Phase 4: Production Optimization (Woche 4+)
**Ziel:** Skalierung und User Experience

- [ ] **Performance**
  - Redis/Memcached für Whitelist Cache
  - RPC Connection Pooling
  - Response Time Optimization
- [ ] **Erweiterungen**
  - Base Network Support (eip155:8453)
  - Additional Whitelist Sources
  - Batch Settlement (multiple TXs)
- [ ] **Admin Tools**
  - Whitelist Status Dashboard
  - Usage Analytics
  - Agent Management Interface
- [ ] **Future-Ready**
  - EIP-7702 Migration Plan
  - Multi-Token Support Vorbereitung
  - Cross-Chain Discovery API

#### Optionale Erweiterungen (Nice-to-Have)
- [ ] `/discovery/resources` API für Resource Discovery
- [ ] Multi-Token Support (andere ERC-20 neben USDC)
- [ ] Polygon, Arbitrum Network Support
- [ ] Payment Receipts & Transaction History
- [ ] Webhook Notifications für Settlements
- [ ] CLI Tool für Agent Management
