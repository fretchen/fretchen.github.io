# x402 Splitter Facilitator Implementation Plan

## Status: Ready for Implementation

**Last Updated:** January 6, 2026

## Overview

Implementation eines öffentlichen x402 Facilitators ohne Whitelist, der den EIP3009SplitterV1 Contract nutzt. Der Facilitator verdient 0.01 USDC pro Settlement und bietet einen öffentlichen Service für beliebige Seller.

## 🎯 Client-seitige Integration: ExactSplitEvmScheme

### Das Problem: Seller-Adoption

Das ursprüngliche Design erforderte, dass **Seller** ihre 402-Response anpassen mussten:
- `payTo: splitterAddress` statt `payTo: sellerAddress`
- `amount: totalAmount` (inkl. Fee)
- `extra.seller` und `extra.salt` Felder

Dies war ein **Dealbreaker für Adoption** - siehe [X402_SPLITTER_ADOPTION_ISSUE.md](./X402_SPLITTER_ADOPTION_ISSUE.md).

### Die Lösung: Custom SchemeNetworkClient

x402 v2 ist **scheme-agnostic** by design! Der `x402Client` erlaubt die Registration eigener Schemes:

```typescript
// Das SchemeNetworkClient Interface (aus @x402/core)
interface SchemeNetworkClient {
  readonly scheme: string;  // z.B. "exact-split"
  
  createPaymentPayload(
    x402Version: number,
    paymentRequirements: PaymentRequirements,
  ): Promise<Pick<PaymentPayload, "x402Version" | "payload">>;
}
```

### ExactSplitEvmScheme Klasse

```typescript
/**
 * Custom x402 Scheme für Fee-basierte Facilitators.
 * 
 * Transformiert intern:
 * - Seller's payTo → Splitter Contract
 * - Seller's amount → amount + facilitatorFee
 * - Fügt seller und salt zu extra hinzu
 */
class ExactSplitEvmScheme implements SchemeNetworkClient {
  readonly scheme = "exact-split";
  
  constructor(
    private signer: LocalAccount,
    private facilitatorUrl: string,
    private splitterConfig: Record<string, SplitterConfig>
  ) {}

  async createPaymentPayload(x402Version, requirements) {
    // 1. Get splitter config for network
    const config = this.splitterConfig[requirements.network];
    
    // 2. Transform requirements
    const transformedRequirements = {
      ...requirements,
      payTo: config.splitterAddress,
      amount: String(BigInt(requirements.amount) + BigInt(config.fixedFee)),
      extra: {
        ...requirements.extra,
        seller: requirements.payTo,  // Original seller
        salt: generateRandomSalt()
      }
    };
    
    // 3. Sign EIP-712 to splitter address
    // (same logic as ExactEvmScheme but with transformed data)
  }
}
```

### Workflow Comparison

**Vorher (Seller muss ändern):**
```
Seller → 402 { payTo: SPLITTER, amount: 30k, extra: {seller, salt} }
Buyer  → Signs to SPLITTER
```

**Nachher (Seller bleibt standard):**
```
Seller → 402 { payTo: SELLER, amount: 20k, scheme: "exact-split" }
Buyer  → x402Client mit ExactSplitEvmScheme
       → Transformiert intern zu { to: SPLITTER, value: 30k }
       → Signs to SPLITTER
```

### Vorteile

| Aspekt | Vorher | Nachher |
|--------|--------|---------|
| Seller Code-Änderungen | Signifikant | Minimal (nur scheme string) |
| x402 Spec-Änderung | Nicht nötig | Nicht nötig |
| PR bei Coinbase nötig | Nein | Nein |
| Buyer-seitige Integration | Standard | Custom Scheme-Klasse |

## Architektur-Entscheidungen

### Deployment-Strategie: Separate Scaleway Function (Option D - Hybrid)

**Begründung:**
- ✅ Totale Isolation von bestehendem Whitelist-Service
- ✅ Kein Risiko für Production (facilitator.fretchen.eu)
- ✅ Unabhängiges Deployment & Rollback
- ✅ Separate Logs & Monitoring
- ✅ Shared utilities (chain_utils, facilitator_instance)

### Verzeichnisstruktur

```
x402_facilitator/
├── README.md
├── package.json                    # Shared dependencies
├── serverless.yml                  # Whitelist service (legacy, wird später entfernt)
├── serverless_splitter.yml         # ✨ NEU - Splitter service deployment
├── x402_facilitator.js             # Whitelist handler (legacy)
├── x402_verify.js                  # Whitelist verify (legacy)
├── x402_settle.js                  # Whitelist settle (legacy)
├── x402_whitelist.js               # Whitelist logic (legacy)
├── x402_splitter_facilitator.js    # ✨ NEU - Splitter main handler
├── x402_splitter_verify.js         # ✨ NEU - Splitter verify (no whitelist)
├── x402_splitter_settle.js         # ✨ NEU - Splitter settle
├── x402_splitter_supported.js      # ✨ NEU - Splitter capabilities
├── eip3009_splitter_abi.js         # ✨ NEU - Splitter contract ABI
├── chain_utils.js                  # ✅ SHARED
├── facilitator_instance.js         # ✅ SHARED
└── test/
    ├── x402_*.test.js              # Whitelist tests (legacy)
    └── x402_splitter_*.test.js     # ✨ NEU - Splitter tests
```

## Deployed Contract Adressen

| Network | Splitter Proxy | Fixed Fee |
|---------|---------------|-----------|
| Optimism Sepolia | `0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946` | 10000 (0.01 USDC) |
| Optimism Mainnet | TBD | 10000 (0.01 USDC) |

## Spam/Abuse Protection

### Was der Fee automatisch verhindert:
- ✅ **Settlement Spam**: Kostet echtes Geld (Preis + 0.01 USDC)
- ✅ **Wirtschaftlich sinnlos**: Angreifer zahlt USDC für Spam
- ✅ **Facilitator profitabel**: ~0.009 USD/tx (0.01 Fee - 0.001 Gas)

### Was der Fee NICHT verhindert:
- ⚠️ **Verify-Only Spam**: Unbegrenzte `/verify` Requests
  - **Lösung**: Rate Limiting auf Verify (100 req/min pro IP)
- ⚠️ **Failed Settlement Attempts**: Invalide Signatures
  - **Lösung**: Verify ist mandatory vor Settle (bereits implementiert)

### Empfohlene Rate Limits:
- Verify Endpoint: 100 requests/minute pro IP
- Settle Endpoint: Kein Limit (Verify ist Gatekeeper)

## Business Model

**Kosten (Facilitator):**
- Gas pro Settlement: ~0.001 USD (Optimism L2)
- Scaleway Function: ~5-10€/Monat (bei moderatem Traffic)

**Einnahmen:**
- Fee pro Settlement: 0.01 USD
- Net profit: ~0.009 USD pro Transaction

**Break-even:** 550-1100 Transactions/Monat

**Conclusion:** Bei >1100 tx/Monat profitabel!

---

## Implementation Plan

### Phase 1: Shared Infrastructure (1-2h)

#### 1.1 Extract Shared Utilities

**Status:** `chain_utils.js` bereits shared ✅

**Task:** Refactor `facilitator_instance.js` für Splitter-Nutzung (falls nötig)

```javascript
// facilitator_instance.js - Check if usable for splitter
// May need to add splitter contract address management
```

#### 1.2 Create Splitter ABI File

**File:** `eip3009_splitter_abi.js`

```javascript
// @ts-check

/**
 * EIP3009SplitterV1 Contract ABI
 * Deployed: Optimism Sepolia 0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946
 */

export const SPLITTER_ABI = [
  {
    name: "executeSplit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "buyer", type: "address" },
      { name: "seller", type: "address" },
      { name: "salt", type: "bytes32" },
      { name: "totalAmount", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "facilitatorWallet",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "fixedFee",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "isAuthorizationUsed",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "authorizer", type: "address" },
      { name: "nonce", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
];

export const SPLITTER_ADDRESSES = {
  "eip155:10": process.env.SPLITTER_ADDRESS_MAINNET || "", // TBD
  "eip155:11155420": process.env.SPLITTER_ADDRESS_SEPOLIA || "0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946",
};
```

---

### Phase 2: Splitter Service Core (3-4h)

#### 2.1 Create Verify Logic (No Whitelist!)

**File:** `x402_splitter_verify.js`

**Key Differences from Whitelist Verify:**
- ❌ NO `isAgentWhitelisted()` check
- ✅ Validate EIP-3009 signature correctness
- ✅ Validate amount >= fixedFee (10000)
- ✅ Validate token is USDC
- ✅ Validate network supported
- ✅ Optional: Rate limiting (100 req/min per IP)

```javascript
// @ts-check

/**
 * x402 Splitter Facilitator - Verification (NO WHITELIST)
 * Validates EIP-3009 payments without seller whitelist check
 */

import { verifyTypedData, createPublicClient, http } from "viem";
import pino from "pino";
import { getChain, getUSDCConfig } from "../chain_utils.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const FIXED_FEE = BigInt(process.env.FIXED_FEE || "10000"); // 0.01 USDC

// Simple in-memory rate limiter (optional)
const requestCounts = new Map();
function checkRateLimit(ip) {
  const count = requestCounts.get(ip) || 0;
  if (count > 100) return false; // 100 req/min
  requestCounts.set(ip, count + 1);
  setTimeout(() => requestCounts.delete(ip), 60000);
  return true;
}

/**
 * Verify EIP-3009 payment without whitelist check
 * @param {Object} paymentPayload - Payment payload
 * @param {Object} paymentRequirements - Payment requirements
 * @param {string} [clientIp] - Client IP for rate limiting
 * @returns {Promise<{isValid: boolean, invalidReason?: string, payer?: string}>}
 */
export async function verifySplitterPayment(paymentPayload, paymentRequirements, clientIp) {
  try {
    // Optional: Rate limiting
    if (clientIp && !checkRateLimit(clientIp)) {
      return {
        isValid: false,
        invalidReason: "rate_limit_exceeded",
      };
    }

    // Extract authorization
    const auth = paymentPayload.payload?.authorization;
    if (!auth) {
      return { isValid: false, invalidReason: "missing_authorization" };
    }

    const { from, to, value, validAfter, validBefore, nonce, v, r, s } = auth;

    // Validate network
    const network = paymentPayload.accepted?.network;
    if (!["eip155:10", "eip155:11155420"].includes(network)) {
      return { isValid: false, invalidReason: "unsupported_network" };
    }

    // Get chain config
    const chain = getChain(network);
    const usdcConfig = getUSDCConfig(network);

    // Validate amount >= fixedFee
    const totalAmount = BigInt(value);
    if (totalAmount < FIXED_FEE) {
      logger.warn({ totalAmount: totalAmount.toString(), fixedFee: FIXED_FEE.toString() }, 
        "Payment amount too low");
      return { isValid: false, invalidReason: "amount_below_minimum" };
    }

    // Validate token is USDC
    if (to.toLowerCase() !== usdcConfig.address.toLowerCase()) {
      return { isValid: false, invalidReason: "invalid_token_address" };
    }

    // Verify EIP-712 signature
    const domain = {
      name: usdcConfig.domainName,
      version: usdcConfig.domainVersion,
      chainId: chain.id,
      verifyingContract: usdcConfig.address,
    };

    const types = {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    const message = {
      from,
      to,
      value: BigInt(value),
      validAfter: BigInt(validAfter),
      validBefore: BigInt(validBefore),
      nonce,
    };

    const isValidSignature = await verifyTypedData({
      address: from,
      domain,
      types,
      primaryType: "TransferWithAuthorization",
      message,
      signature: { v, r, s },
    });

    if (!isValidSignature) {
      logger.warn("Invalid EIP-712 signature");
      return { isValid: false, invalidReason: "invalid_signature", payer: from };
    }

    // Check if authorization already used
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    // Note: Would need to call splitter.isAuthorizationUsed(token, from, nonce)
    // For now, skip this check (will fail on-chain if reused)

    logger.info({ from, value, network }, "Payment verified (no whitelist)");

    return {
      isValid: true,
      payer: from,
    };
  } catch (error) {
    logger.error({ err: error }, "Verification error");
    return {
      isValid: false,
      invalidReason: "verification_failed",
    };
  }
}
```

#### 2.2 Create Settlement Logic (Via Splitter)

**File:** `x402_splitter_settle.js`

**Key Differences from Direct Settle:**
- ✅ Calls `splitter.executeSplit()` not `token.transferWithAuthorization()`
- ✅ Nonce = `keccak256(abi.encode(seller, salt))`
- ✅ totalAmount must include fixedFee
- ✅ Seller receives `(totalAmount - fixedFee)`
- ✅ Facilitator wallet receives fixedFee automatically

```javascript
// @ts-check

/**
 * x402 Splitter Facilitator - Settlement Logic
 * Executes payments via EIP3009SplitterV1 contract
 */

import { createWalletClient, createPublicClient, http, getContract, encodeAbiParameters, keccak256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import pino from "pino";
import { getChain, getUSDCConfig } from "./chain_utils.js";
import { verifySplitterPayment } from "./x402_splitter_verify.js";
import { SPLITTER_ABI, SPLITTER_ADDRESSES } from "./eip3009_splitter_abi.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

/**
 * Settle payment via Splitter Contract
 * @param {Object} paymentPayload - Payment payload
 * @param {Object} paymentRequirements - Payment requirements (must include seller and salt)
 * @returns {Promise<{success: boolean, payer?: string, transaction?: string, network?: string, errorReason?: string}>}
 */
export async function settleSplitterPayment(paymentPayload, paymentRequirements) {
  try {
    // Verify first
    logger.info("Verifying payment before settlement");
    const verifyResult = await verifySplitterPayment(paymentPayload, paymentRequirements);

    if (!verifyResult.isValid) {
      logger.warn({ invalidReason: verifyResult.invalidReason }, "Payment verification failed");
      return {
        success: false,
        errorReason: verifyResult.invalidReason,
        payer: verifyResult.payer,
        transaction: "",
        network: paymentPayload.accepted.network,
      };
    }

    const network = paymentPayload.accepted.network;
    const chain = getChain(network);
    const usdcConfig = getUSDCConfig(network);
    const splitterAddress = SPLITTER_ADDRESSES[network];

    if (!splitterAddress) {
      throw new Error(`Splitter not deployed on network ${network}`);
    }

    // Extract authorization
    const auth = paymentPayload.payload.authorization;
    const { from: buyer, value: totalAmount, validAfter, validBefore, v, r, s } = auth;

    // Extract seller and salt from paymentRequirements
    const seller = paymentRequirements.seller;
    const salt = paymentRequirements.salt;

    if (!seller || !salt) {
      throw new Error("Missing seller or salt in paymentRequirements");
    }

    // Compute nonce = keccak256(abi.encode(seller, salt))
    // CRITICAL: Must match what buyer signed!
    const nonce = keccak256(
      encodeAbiParameters(
        [{ type: "address" }, { type: "bytes32" }],
        [seller, salt]
      )
    );

    logger.info({ buyer, seller, totalAmount, nonce, salt }, "Settling via splitter");

    // Setup wallet client
    const account = privateKeyToAccount(process.env.FACILITATOR_WALLET_PRIVATE_KEY);
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(),
    });

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    // Get splitter contract
    const splitter = getContract({
      address: splitterAddress,
      abi: SPLITTER_ABI,
      client: { public: publicClient, wallet: walletClient },
    });

    // Call executeSplit
    const hash = await splitter.write.executeSplit([
      usdcConfig.address, // token
      buyer,
      seller,
      salt,
      BigInt(totalAmount),
      BigInt(validAfter),
      BigInt(validBefore),
      nonce,
      v,
      r,
      s,
    ]);

    logger.info({ hash, buyer, seller }, "Settlement transaction submitted");

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "success") {
      logger.info({ hash, blockNumber: receipt.blockNumber }, "Transaction confirmed");
      return {
        success: true,
        payer: buyer,
        transaction: hash,
        network,
      };
    } else {
      logger.warn({ hash, status: receipt.status }, "Transaction failed");
      return {
        success: false,
        errorReason: "transaction_reverted",
        payer: buyer,
        transaction: hash,
        network,
      };
    }
  } catch (error) {
    logger.error({ err: error }, "Settlement failed");

    // Extract meaningful error reason
    let errorReason = "settlement_failed";
    if (error.message?.includes("insufficient")) {
      errorReason = "insufficient_funds";
    } else if (error.message?.includes("nonce")) {
      errorReason = "authorization_already_used";
    } else if (error.message?.includes("expired")) {
      errorReason = "authorization_expired";
    } else if (error.message?.includes("Seller not authorized")) {
      errorReason = "seller_verification_failed";
    }

    return {
      success: false,
      errorReason,
      payer: paymentPayload.payload?.authorization?.from,
      transaction: "",
      network: paymentPayload.accepted?.network,
    };
  }
}
```

#### 2.3 Create Supported Capabilities (x402 v2 Compliant)

**File:** `x402_splitter_supported.js`

**Important:** x402 v2 spec requires `scheme: "exact"` for EIP-3009. Fee information goes into the `extra` field as facilitator-specific configuration.

```javascript
// @ts-check

/**
 * x402 Splitter Facilitator - Supported Capabilities
 * x402 v2 compliant: uses standard "exact" scheme with fees in extra field
 */

import { SPLITTER_ADDRESSES } from "./eip3009_splitter_abi.js";

const FIXED_FEE = process.env.FIXED_FEE || "10000"; // 0.01 USDC
const FACILITATOR_WALLET = process.env.FACILITATOR_WALLET_ADDRESS || "";

/**
 * Get supported capabilities for splitter facilitator
 * @returns {Object} x402 v2 SupportedResponse
 */
export function getSplitterCapabilities() {
  return {
    // x402 v2 spec: /supported endpoint returns "kinds" array
    kinds: [
      {
        x402Version: 2,
        scheme: "exact", // ✅ Standard x402 v2 scheme (EIP-3009)
        network: "eip155:10", // Optimism Mainnet
        extra: {
          // ✅ Facilitator-specific configuration goes in extra
          facilitatorType: "splitter",
          splitterAddress: SPLITTER_ADDRESSES["eip155:10"],
          fixedFee: FIXED_FEE,
          feeCurrency: "USDC",
          feeDescription: "0.01 USDC fixed fee per transaction",
          whitelist: false,
          asset: "eip155:10/erc20:0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // USDC mainnet
        },
      },
      {
        x402Version: 2,
        scheme: "exact",
        network: "eip155:11155420", // Optimism Sepolia
        extra: {
          facilitatorType: "splitter",
          splitterAddress: SPLITTER_ADDRESSES["eip155:11155420"],
          fixedFee: FIXED_FEE,
          feeCurrency: "USDC",
          feeDescription: "0.01 USDC fixed fee per transaction (testnet)",
          whitelist: false,
          asset: "eip155:11155420/erc20:0x5fd84259d66Cd46123540766Be93DFE6D43130D7", // USDC Sepolia
        },
      },
    ],
    // x402 v2 spec: extensions array (empty for now)
    extensions: [],
    // x402 v2 spec: signers map (CAIP-2 pattern -> addresses)
    signers: {
      "eip155:*": FACILITATOR_WALLET ? [FACILITATOR_WALLET] : [],
    },
  };
}
```

#### 2.4 Create Main Handler

**File:** `x402_splitter_facilitator.js`

```javascript
// @ts-check

/**
 * x402 Splitter Facilitator - Main Handler
 */

import { verifySplitterPayment } from "./x402_splitter_verify.js";
import { settleSplitterPayment } from "./x402_splitter_settle.js";
import { getSplitterCapabilities } from "./x402_splitter_supported.js";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "*",
  "Content-Type": "application/json",
};

/**
 * Main handler for x402 Splitter Facilitator
 */
export async function handle(event, context) {
  const path = event.path || "/";
  
  logger.info({ path, method: event.httpMethod }, "Incoming request");

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  // Route to handlers
  if (path === "/verify") {
    return handleVerify(event, context);
  }
  
  if (path === "/settle") {
    return handleSettle(event, context);
  }
  
  if (path === "/supported") {
    return handleSupported(event, context);
  }

  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: "Not found" }),
  };
}

async function handleVerify(event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  let body;
  try {
    body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch (error) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  const { paymentPayload, paymentRequirements } = body;
  const clientIp = event.headers["x-forwarded-for"] || event.headers["x-real-ip"];

  const result = await verifySplitterPayment(paymentPayload, paymentRequirements, clientIp);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(result),
  };
}

async function handleSettle(event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  let body;
  try {
    body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch (error) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  const { paymentPayload, paymentRequirements } = body;
  const result = await settleSplitterPayment(paymentPayload, paymentRequirements);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(result),
  };
}

async function handleSupported(event, context) {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed. Use GET." }),
    };
  }

  const capabilities = getSplitterCapabilities();

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(capabilities),
  };
}
```

---

### Phase 3: Configuration & Deployment (1h)

#### 3.1 Create Serverless Configuration

**File:** `serverless_splitter.yml`

**Note:** Separate deployment config from legacy `serverless.yml` to allow independent deployments.

```yaml
service: x402-splitter-facilitator

# Read environment variables from parent .env file
useDotenv: true

configValidationMode: off

provider:
  name: scaleway
  runtime: node22
  
  # Environment variables for production
  env:
    NODE_ENV: production
    LOG_LEVEL: info
    # Splitter contract addresses
    SPLITTER_ADDRESS_MAINNET: "" # TBD after mainnet deployment
    SPLITTER_ADDRESS_SEPOLIA: "0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946"
    # Fixed fee (0.01 USDC)
    FIXED_FEE: "10000"
  
  # Secrets (set via Scaleway Console or CLI)
  secret:
    FACILITATOR_WALLET_PRIVATE_KEY: ${env:FACILITATOR_WALLET_PRIVATE_KEY}
    # Optional: Custom RPC endpoints
    OPTIMISM_RPC_URL: ${env:OPTIMISM_RPC_URL, ""}
    OPTIMISM_SEPOLIA_RPC_URL: ${env:OPTIMISM_SEPOLIA_RPC_URL, ""}

plugins:
  - serverless-scaleway-functions

package:
  patterns:
    - "!.gitignore"
    - "!.git/**"
    - "!test/**"
    - "!coverage/**"
    - "!.prettierrc"
    - "!eslint.config.js"
    - "!vitest.config.js"
    - "!README.md"

functions:
  splitterFacilitator:
    handler: x402_splitter_facilitator.handle
    description: x402 v2 splitter facilitator (public, no whitelist)
    # Memory and timeout
    memoryLimit: 512
    timeout: 60s
    # Custom domain
    custom_domains:
      - splitter-facilitator.fretchen.eu
```

#### 3.2 Deployment Checklist

**Pre-Deployment:**
- [ ] Verify `FACILITATOR_WALLET_PRIVATE_KEY` in .env (parent directory)
- [ ] Verify wallet has ETH on Optimism Sepolia for gas
- [ ] Update `SPLITTER_ADDRESS_SEPOLIA` if changed
- [ ] Test locally with Vitest

**Deploy to Sepolia:**
```bash
cd x402_facilitator
npx serverless deploy --config serverless_splitter.yml
```

**Post-Deployment:**
- [ ] Test `/supported` endpoint
- [ ] Test `/verify` with mock signature
- [ ] Test `/settle` with real transaction (small amount)
- [ ] Monitor logs in Scaleway Console
- [ ] Set up custom domain DNS (splitter-facilitator.fretchen.eu)

**Deploy to Mainnet (Later):**
- [ ] Deploy EIP3009SplitterV1 to Optimism Mainnet
- [ ] Update `SPLITTER_ADDRESS_MAINNET` in serverless.yml
- [ ] Redeploy
- [ ] Test with small amounts first

---

### Phase 4: Testing & Integration (2-3h)

#### 4.1 Unit Tests

**File:** `test/x402_splitter_verify.test.js`

**Test Cases:**
- ✅ Valid EIP-3009 signature → `isValid: true`
- ✅ Invalid signature → `isValid: false`
- ✅ Amount < fixedFee → `isValid: false`
- ✅ Wrong token address → `isValid: false`
- ✅ Unsupported network → `isValid: false`
- ✅ Any seller address accepted (no whitelist) → `isValid: true`
- ✅ Rate limiting after 100 requests → `isValid: false`

**File:** `test/x402_splitter_settle.test.js`

**Test Cases:**
- ✅ Mock splitter contract
- ✅ Verify `executeSplit()` called with correct params
- ✅ Verify nonce = `keccak256(abi.encode(seller, salt))`
- ✅ Verify totalAmount includes fixedFee
- ✅ Handle transaction reverts gracefully
- ✅ Return proper error reasons

#### 4.2 Integration Tests

**Test Script:** Manual testing via curl or Postman

```bash
# Test /supported
curl https://splitter-facilitator.fretchen.eu/supported

# Test /verify
curl -X POST https://splitter-facilitator.fretchen.eu/verify \
  -H "Content-Type: application/json" \
  -d '{
    "paymentPayload": {...},
    "paymentRequirements": {
      "seller": "0x...",
      "salt": "0x..."
    }
  }'

# Test /settle (after verify passes)
curl -X POST https://splitter-facilitator.fretchen.eu/settle \
  -H "Content-Type: application/json" \
  -d '{
    "paymentPayload": {...},
    "paymentRequirements": {
      "seller": "0x...",
      "salt": "0x..."
    }
  }'
```

#### 4.3 Frontend Integration (Optional - Later Phase)

**File:** `scw_js/genimg_x402_splitter.js` (new file)

**Changes needed:**
- Copy `genimg_x402_token.js`
- Change facilitator URL to `https://splitter-facilitator.fretchen.eu`
- Add salt generation: `const salt = randomBytes(32)`
- Adjust totalAmount: `price + 10000` (include fee)
- Pass salt in paymentRequirements

---

### Phase 5: Monitoring & Optimization (Ongoing)

#### 5.1 Logging & Metrics

**Add to each handler:**
```javascript
logger.info({
  action: "settlement_success",
  buyer,
  seller,
  totalAmount,
  fee: FIXED_FEE,
  netProfit: parseFloat(FIXED_FEE) / 1e6 - 0.001, // Fee - Gas
  txHash: hash,
  network,
}, "Fee earned");
```

**Metrics to track:**
- Settlements per hour/day
- Success/failure rate
- Average gas cost
- Total fees earned
- Net profit

#### 5.2 Alerts

**Set up alerts in Scaleway Console:**
- Function errors > 5% → Email alert
- Average execution time > 30s → Warning
- Function invocations drop to 0 → Critical alert

#### 5.3 Rate Limiting Improvements

**If needed (after observing traffic):**
- Implement Redis-based rate limiting (more robust)
- Add IP whitelist for known good actors
- Implement exponential backoff for repeated failures

---

## Testing Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1 | 1-2h | Shared infrastructure, ABI file |
| Phase 2 | 3-4h | Core logic (verify, settle, supported, main handler) |
| Phase 3 | 1h | Configuration, deployment |
| Phase 4 | 2-3h | Unit tests, integration tests |
| **Total** | **7-10h** | **1-2 Arbeitstage** |

## x402 v2 Compliance

**Why fees in `extra` field?**

The x402 v2 specification intentionally leaves fee handling **underspecified**. Fees are considered **facilitator implementation details**, not protocol-level concerns.

**Our approach:**
- ✅ Use standard `scheme: "exact"` (EIP-3009)
- ✅ Advertise fee information in `extra` field of `/supported` endpoint
- ✅ On-chain enforcement via splitter contract (trustless)
- ✅ Transparent: buyers see fee breakdown before paying
- ✅ Compatible: standard x402 clients can use our facilitator without parsing `extra`

**Comparison to Coinbase's facilitator:**
- Coinbase: "fee-free" is also a facilitator property (not in core spec)
- Us: "0.01 USDC fixed fee" in `extra` field (same pattern)

**References:**
- [x402 v2 Specification](https://github.com/coinbase/x402/blob/main/specs/x402-specification-v2.md#73-get-supported)
- Section 7.3: "Each `SupportedKind` object... `extra` (Optional): Additional scheme-specific configuration"

## Success Criteria

- ✅ **x402 v2 compliant:** Uses standard `scheme: "exact"`, fees in `extra` field
- ✅ Splitter facilitator deployed on Optimism Sepolia
- ✅ `/verify` endpoint validates EIP-3009 signatures correctly
- ✅ `/settle` endpoint executes splits via splitter contract
- ✅ `/supported` endpoint advertises capabilities with `kinds`, `extensions`, `signers`
- ✅ No whitelist check - accepts any seller
- ✅ Rate limiting prevents verify spam
- ✅ Facilitator wallet receives 0.01 USDC per settlement
- ✅ Zero impact on existing whitelist facilitator (separate deployment)

## Next Steps After Implementation

1. **Load Testing**: Simulate high traffic to verify rate limits work
2. **Economic Monitoring**: Track fees vs costs over first 100 transactions
3. **Frontend Integration**: Update genimg service to use splitter facilitator
4. **Mainnet Deployment**: After 1 week of successful Sepolia testing
5. **Documentation**: Create API documentation for public use
6. **Community Outreach**: Announce public facilitator availability

## References

- EIP3009SplitterV1 Contract: [`eth/contracts/EIP3009SplitterV1.sol`](../eth/contracts/EIP3009SplitterV1.sol)
- Deployment Guide: [`eth/DEPLOY_EIP3009_SPLITTER_V1_GUIDE.md`](../eth/DEPLOY_EIP3009_SPLITTER_V1_GUIDE.md)
- Existing Facilitator: [`x402_facilitator/README.md`](./README.md)
- EIP-3009 Standard: https://eips.ethereum.org/EIPS/eip-3009
- x402 Protocol: https://github.com/x402/spec

## Support

For questions during implementation:
- Check existing `x402_verify.js` and `x402_settle.js` for patterns
- Review Splitter contract tests for nonce computation
- Test with small amounts on Sepolia first
- Monitor Scaleway logs during deployment
