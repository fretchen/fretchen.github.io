---
publishing_date: 2025-12-21
title: x402 Implementation Plan für ImageGen
category: "blockchain"
secondaryCategory: "webdev"
description: "Detaillierter Implementierungsplan zur Integration des x402 Payment-Protokolls in den AI Image Generation Service mit Beibehaltung der NFT-Funktionalität. Der NFT-Mint dient als Payment-Proof."
---

## Übersicht

Integration des x402 Payment-Protokolls in den ImageGen-Service **mit Beibehaltung der NFT-Funktionalität**. Der NFT-Mint wird als Payment-Proof akzeptiert.

Das x402-Protokoll nutzt den HTTP-Statuscode `402 Payment Required` für automatische Mikrozahlungen direkt im HTTP-Request/Response-Zyklus.

### Technologie-Stack

- **x402 Protocol Standard** - HTTP 402 Payment Required Protokoll (Manual Implementation)
- **Viem** - Blockchain-Interaktion und Event-Parsing
- **Custom Implementation** - Direkte On-Chain Verification ohne Facilitator

**Aufteilung:**

- ✅ x402-Style 402 Response: Manual (klar und direkt)
- ✅ Transaction Verification: Viem (status, recipient, amount)
- ✅ Mint-Event Parsing: Custom (NFT-spezifisch, TokenId Extraktion)

**Warum KEIN [x402 npm Package](https://www.npmjs.com/package/x402)?**

1. **Facilitator-Dependency**: x402 Package ist designed für Facilitator-basierte Verification (zentralisierter Service)

   ```javascript
   // x402 Package Design:
   import { verify } from "x402/verify";
   const result = await verify(payload, requirements); // ➜ Ruft Facilitator auf!
   ```

2. **Self-Sovereign Approach**: Wir wollen direkt On-Chain verifizieren ohne externe Dependencies

   ```javascript
   // Unser Ansatz:
   const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
   const mintLog = receipt.logs.find(/* Transfer from 0x0 */);
   // ➜ Direkt auf Optimism, kein Middleman
   ```

3. **NFT-Mint-Spezifisch**: x402 ist optimiert für Standard USDC-Transfers, nicht für NFT-Mint-Verification mit TokenId-Extraktion

4. **Subpath Exports**: x402 Package nutzt Subpath Exports (`x402/client`, `x402/verify`), nicht Root-Import

**Entscheidung**: Manual x402-konforme Implementation für maximale Kontrolle und Zero-Dependency-Approach

---

## x402 Package vs. Manual Implementation

### x402 Package Analyse

Das [x402 npm Package](https://www.npmjs.com/package/x402) (70k+ Downloads) ist ein **production-ready** Package von Coinbase für das x402 Payment Protocol. Es bietet:

**Verfügbare Module:**

```javascript
import { verify, settle } from "x402/verify"; // Facilitator-basierte Verification
import { preparePaymentHeader } from "x402/client"; // Client-side Payment Header
import { exact } from "x402/schemes"; // Payment Schemes
```

**Package Design:**

- ✅ Middleware für Express/Hono/Next.js
- ✅ Standardisierte 402 Response Formate
- ✅ Facilitator-Integration für Payment Verification
- ✅ Lifecycle Hooks (onBeforeVerify, onAfterSettle, etc.)
- ✅ Multi-Network Support (EVM, Solana)

**Warum nicht verwendet:**

| Aspekt           | x402 Package             | Unsere Requirements   |
| ---------------- | ------------------------ | --------------------- |
| **Verification** | Facilitator-Service      | Direkt On-Chain       |
| **Architecture** | Middleware-basiert       | Serverless Function   |
| **Payment Type** | Standard USDC Transfer   | NFT Mint Transaction  |
| **Dependencies** | Facilitator erforderlich | Self-Sovereign        |
| **Use Case**     | Generische API Payments  | NFT-spezifischer Flow |

**Beispiel: x402 Package mit Facilitator**

```javascript
import { useFacilitator } from "x402/verify";

const { verify } = useFacilitator({
  url: "https://x402.org/facilitator", // ❌ Externe Dependency!
});

const result = await verify(paymentPayload, paymentRequirements);
// ➜ Ruft Facilitator auf, nicht direkt Blockchain
```

**Unsere Manual Implementation**

```javascript
// Direkte On-Chain Verification ohne Facilitator
const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

// Basic Checks
if (receipt.status !== "success") return { valid: false };
if (tx.to !== CONTRACT_ADDRESS) return { valid: false };
if (tx.value < MINT_PRICE) return { valid: false };

// NFT-spezifisch: TokenId aus Mint-Event extrahieren
const mintLog = receipt.logs.find(log => /* Transfer from 0x0 */);
const tokenId = parseInt(mintLog.topics[3], 16);

return { valid: true, tokenId, payer };
```

**Vorteile unserer Manual Implementation:**

- ✅ **Self-Sovereign**: Keine Abhängigkeit von Facilitator-Services
- ✅ **NFT-Optimiert**: TokenId-Extraktion aus Mint-Event
- ✅ **Serverless-Ready**: Passt perfekt zu Scaleway Functions
- ✅ **Transparent**: Klarer, direkter Code ohne Abstraction-Layer
- ✅ **Zero External Dependencies**: Nur Viem für Blockchain-Zugriff

**Wann x402 Package verwenden?**

- Express/Hono/Next.js Middleware-Integration
- Standard USDC Payment Flows
- Facilitator-basierte Verification gewünscht
- Multi-Network Support benötigt

---

## Aktueller Workflow vs. x402 Workflow

### Aktueller Workflow (Mint-then-Generate)

```
┌─────────────┐                              ┌──────────────────┐
│   Browser   │                              │  GenImNFTv4      │
│   (User)    │                              │  Smart Contract  │
└──────┬──────┘                              └────────┬─────────┘
       │                                              │
       │  1. User gibt Prompt ein                     │
       │                                              │
       │  2. mint() mit ETH ────────────────────────▶│
       │                                              │
       │  3. TokenId zurück ◀─────────────────────────│
       │                                              │
       │                              ┌───────────────┴───────────────┐
       │                              │      genimg_bfl.js            │
       │                              │      (Serverless)             │
       │                              └───────────────┬───────────────┘
       │                                              │
       │  4. POST /genimg { tokenId, prompt } ───────▶│
       │                                              │
       │     (Server prüft: Token existiert?          │
       │      Hat Token schon Bild?)                  │
       │                                              │
       │  5. Bild generieren (BFL API)                │
       │                                              │
       │  6. TokenURI on-chain updaten                │
       │                                              │
       │  7. Response { image_url } ◀─────────────────│
       ▼                                              ▼
```

**Probleme:**

- Zwei separate User-Interaktionen (Mint + Generate)
- Server muss Token-Status on-chain prüfen
- Kein standardisiertes Payment-Protokoll

### Neuer Workflow (x402 mit NFT-Mint als Payment)

```
┌─────────────┐                              ┌──────────────────┐
│   Browser   │                              │  genimg_bfl.js   │
│   (User)    │                              │  (Serverless)    │
└──────┬──────┘                              └────────┬─────────┘
       │                                              │
       │  1. POST /genimg { prompt } ────────────────▶│
       │                                              │
       │  2. 402 Payment Required ◀───────────────────│
       │     X-Payment: {                             │
       │       "scheme": "exact",                     │
       │       "network": "optimism",                 │
       │       "maxAmountRequired": "500000...",      │
       │       "contractAddress": "0x80f95d...",      │
       │       "contractMethod": "mint()"             │
       │     }                                        │
       │                                              │
       │                              ┌───────────────┴───────────────┐
       │                              │      GenImNFTv4               │
       │                              │      Smart Contract           │
       │                              └───────────────┬───────────────┘
       │                                              │
       │  3. mint() mit ETH ─────────────────────────▶│
       │                                              │
       │  4. txHash + tokenId ◀───────────────────────│
       │                                              │
       │                              ┌───────────────┴───────────────┐
       │                              │      genimg_bfl.js            │
       │                              └───────────────┬───────────────┘
       │                                              │
       │  5. POST /genimg { prompt }                  │
       │     X-Payment: { txHash, tokenId } ─────────▶│
       │                                              │
       │     (Server verifiziert Mint-Event)          │
       │                                              │
       │  6. Bild generieren + TokenURI updaten       │
       │                                              │
       │  7. Response { image_url, tokenId } ◀────────│
       ▼                                              ▼
```

**Vorteile:**

- ✅ NFT-Funktionalität bleibt erhalten
- ✅ x402-konformes Payment-Protokoll
- ✅ Ein zusammenhängender User-Flow
- ✅ Standardisierte Payment-Discovery
- ✅ Mint-Transaktion IST der Payment-Proof

---

## Phase 1: Server-Side (genimg_bfl.js)

**Ziel:** 402-Response bei fehlendem Payment, Mint-Verification bei vorhandenem Payment

### 1.0 Dependencies

```bash
cd scw_js
# Viem bereits installiert (v2.38.3)
# Keine zusätzlichen Dependencies nötig
```

**Note**: `viem` bereits vorhanden für Blockchain-Interaktion. Keine x402 Package Dependency.

### 1.1 Request-Handler erweitern

- Prüfe `X-Payment` Header auf eingehende Requests
- Ohne Payment → Return `402` via x402 Package
- Mit Payment → Verifiziere Mint-Event und generiere Bild

### 1.2 402 Response (x402-konform, Manual)

```javascript
// Config
const MINT_PRICE = "500000000000000"; // 0.0005 ETH
const GENIMG_CONTRACT_ADDRESS = "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb";

// 402-Response erstellen (x402-Protocol-konform)
function create402Response() {
  const paymentInfo = {
    scheme: "exact",
    network: "optimism",
    maxAmountRequired: MINT_PRICE,
    recipient: GENIMG_CONTRACT_ADDRESS,
    metadata: {
      resource: "genimg",
      description: "Mint an NFT to generate your AI image",
      paymentType: "contract-call",
      contractAddress: GENIMG_CONTRACT_ADDRESS,
      contractMethod: "mint()",
    },
  };

  return {
    statusCode: 402,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
      "Content-Type": "application/json",
      "X-Payment": JSON.stringify(paymentInfo),
    },
    body: JSON.stringify({
      error: "Payment required",
      message: "Please mint an NFT to generate your image",
      payment: paymentInfo,
    }),
  };
}
```

**Generiertes Format:**

```http
HTTP/1.1 402 Payment Required
X-Payment: {
  "scheme": "exact",
  "network": "optimism",
  "maxAmountRequired": "500000000000000",
  "recipient": "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
  "metadata": {
    "resource": "genimg",
    "description": "Mint an NFT to generate your AI image",
    "paymentType": "contract-call",
    "contractAddress": "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
    "contractMethod": "mint()"
  }
}
```

### 1.3 Mint-Verification (Direkte On-Chain Verification)

Direkte On-Chain Verification ohne Facilitator:

```javascript
import { createPublicClient, http, parseAbiItem } from 'viem';
import { optimism } from 'viem/chains';

const publicClient = createPublicClient({
  chain: optimism,
  transport: http()
});

// Transfer-Event für Mint-Detection
const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
);

async function verifyMintPayment(publicClient, txHash) {
  try {
    // 1. Get Transaction Receipt
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

    if (!receipt || receipt.status !== "success") {
      return { valid: false, error: "Transaction failed or not found" };
    }

    // 2. Get Transaction Details
    const tx = await publicClient.getTransaction({ hash: txHash });

    // 3. Verify Recipient (Contract Address)
    if (tx.to?.toLowerCase() !== GENIMG_CONTRACT_ADDRESS.toLowerCase()) {
      return { valid: false, error: "Transaction not sent to correct contract" };
    }

    // 4. Verify Transaction Value >= MINT_PRICE
    if (BigInt(tx.value) < BigInt(MINT_PRICE)) {
      return {
        valid: false,
        error: `Insufficient payment. Expected at least ${MINT_PRICE}, got ${tx.value}`
      };
    }

  // 2. Custom: Mint-Event aus Receipt extrahieren
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

  // Finde Transfer-Event mit from=0x0 (Mint)
  const mintLog = receipt.logs.find(log => {
    if (log.address.toLowerCase() !== GENIMG_CONTRACT_ADDRESS.toLowerCase()) {
      return false;
    }
    // Transfer von 0x0 = Mint
    return log.topics[0] === TRANSFER_EVENT.signature &&
           log.topics[1] === '0x0000000000000000000000000000000000000000000000000000000000000000';
  });

  if (!mintLog) {
    return { valid: false, error: 'No mint event found in transaction' };
  }

  // 3. TokenId aus Event extrahieren
  const mintedTokenId = parseInt(mintLog.topics[3], 16);
  const minterAddress = '0x' + mintLog.topics[2].slice(26);

  return {
    valid: true,
    tokenId: mintedTokenId,
    payer: minterAddress,
    txHash
  };
}
```

**Was wird geprüft:**

- ✅ Transaction Status (success/reverted)
- ✅ Recipient (Contract Address match)
- ✅ Amount (≥ MINT_PRICE)
- ✅ Mint-Event Detection (Transfer from 0x0)
- ✅ TokenId Extraktion aus Event
- ✅ Minter-Adresse extrahieren

**Vorteile gegenüber Facilitator:**

- ✅ Self-Sovereign (keine externe Dependency)
- ✅ Transparent (direkter Blockchain-Zugriff)
- ✅ NFT-optimiert (TokenId-Extraktion)

### 1.4 Vollständiger Handler (x402-konform)

```javascript
import { createPublicClient, http, parseAbiItem } from "viem";
import { optimism } from "viem/chains";

// Config
const MINT_PRICE = "500000000000000"; // 0.0005 ETH
const GENIMG_CONTRACT_ADDRESS = "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb";

const publicClient = createPublicClient({
  chain: optimism,
  transport: http(process.env.OPTIMISM_RPC_URL),
});

export async function handler(event) {
  const paymentProof = event.headers["x-payment"];
  const { prompt } = JSON.parse(event.body);

  // Kein Payment → 402 via x402 Package
  if (!paymentProof) {
    const payment = createPaymentRequired({
      amount: MINT_PRICE,
      recipient: GENIMG_CONTRACT_ADDRESS,
      network: "optimism",
      metadata: {
        resource: "genimg",
        description: "Mint an NFT to generate your AI image",
        paymentType: "contract-call",
        contractAddress: GENIMG_CONTRACT_ADDRESS,
        contractMethod: "mint()",
      },
    });

    return {
      statusCode: 402,
      headers: {
        "X-Payment": JSON.stringify(payment),
      },
      body: JSON.stringify({
        error: "Payment required",
        message: "Please mint an NFT to generate your image",
      }),
    };
  }

  // Payment verifizieren (x402 + Custom Mint-Check)
  const verification = await verifyMintPayment(paymentProof);
  if (!verification.valid) {
    return {
      statusCode: 402,
      body: JSON.stringify({ error: verification.error }),
    };
  }

  // Bild generieren mit verifiziertem tokenId
  const result = await generateImageAndUpdateNFT(prompt, verification.tokenId, verification.payer);

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
}
```

---

## Phase 2: Client-Side (ImageGenerator.tsx)

**Ziel:** Automatisches 402-Handling mit NFT-Mint als Payment

### 2.1 Fetch-Wrapper mit 402-Handling

- Erster Request ohne Payment
- Bei 402 → Parse Payment-Details, führe `mint()` aus
- Retry mit txHash + tokenId als Payment-Proof

### 2.2 UX-Flow (vereinfacht)

```
┌────────────────────────────────────────────────────────────┐
│                    ImageGenerator UI                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Prompt: [A beautiful sunset over mountains    ]           │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  💰 Price: 0.0005 ETH (~$1.20)                       │  │
│  │  🎨 You'll receive an NFT with your generated image  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│         [ 🖼️ Generate Image (Mint NFT) ]                   │
│                                                            │
└────────────────────────────────────────────────────────────┘

         ↓ Click

┌────────────────────────────────────────────────────────────┐
│  Wallet Popup: Confirm mint() transaction                  │
│  Amount: 0.0005 ETH                                        │
│  Contract: GenImNFTv4                                      │
└────────────────────────────────────────────────────────────┘

         ↓ Confirm

┌────────────────────────────────────────────────────────────┐
│  ⏳ Generating your image...                               │
│  (Automatic retry with payment proof)                      │
└────────────────────────────────────────────────────────────┘

         ↓ Complete

┌────────────────────────────────────────────────────────────┐
│  ✅ Your NFT #42 has been created!                         │
│  [Generated Image Preview]                                 │
│  View on Etherscan | View NFT                              │
└────────────────────────────────────────────────────────────┘
```

### 2.3 Änderungen am aktuellen Flow

| Aktuell                             | Neu (x402)                        |
| ----------------------------------- | --------------------------------- |
| Separater Mint-Button               | Ein "Generate"-Button             |
| User wartet auf Mint, dann Generate | Ein durchgehender Flow            |
| TokenId manuell übergeben           | TokenId aus Mint-Event extrahiert |
| Server prüft Token on-chain         | Server verifiziert Payment-Proof  |

### 2.4 Pseudocode

```typescript
async function generateImageWithPayment(prompt: string) {
  // 1. Erster Request - löst 402 aus
  let response = await fetch(GENIMG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (response.status === 402) {
    // 2. Parse Payment-Details
    const paymentDetails = JSON.parse(response.headers.get("X-Payment") || "{}");

    // 3. NFT Minting durchführen
    const { hash: txHash } = await writeContract({
      address: paymentDetails.contractAddress,
      abi: GenImNFTv4ABI,
      functionName: "mint",
      value: BigInt(paymentDetails.maxAmountRequired),
    });

    // 4. Auf Confirmation warten
    const receipt = await waitForTransactionReceipt({ hash: txHash });

    // 5. TokenId aus Mint-Event extrahieren
    const mintEvent = receipt.logs.find((log) => log.topics[0] === TRANSFER_EVENT_SIGNATURE);
    const tokenId = parseInt(mintEvent.topics[3], 16);

    // 6. Retry mit Payment-Proof
    response = await fetch(GENIMG_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Payment": JSON.stringify({ txHash, tokenId }),
      },
      body: JSON.stringify({ prompt }),
    });
  }

  if (!response.ok) {
    throw new Error("Image generation failed");
  }

  return response.json();
}
```

---

## Phase 3: Smart Contract (GenImNFTv4)

**Entscheidung:** Der bestehende GenImNFTv4 Contract bleibt unverändert!

### Warum keine Contract-Änderungen nötig sind

Der aktuelle Contract unterstützt bereits alles, was für x402 benötigt wird:

| Funktion               | Bereits vorhanden | Für x402 genutzt             |
| ---------------------- | ----------------- | ---------------------------- |
| `mint()`               | ✅                | Payment-Transaktion          |
| `Transfer` Event       | ✅                | TokenId + Payer extrahieren  |
| `requestImageUpdate()` | ✅                | Bild on-chain speichern      |
| Whitelisted Provider   | ✅                | Server kann TokenURI updaten |

### Mint-Event als Payment-Proof

Das `Transfer`-Event beim Minting enthält alle nötigen Informationen:

```solidity
event Transfer(
    address indexed from,    // 0x0 bei Mint
    address indexed to,      // Payer/Owner
    uint256 indexed tokenId  // Neuer Token
);
```

Der Server kann aus dem txHash:

1. Prüfen ob Transaktion erfolgreich war
2. TokenId extrahieren
3. Payer-Adresse verifizieren
4. Gezahlten Betrag prüfen

---

## Phase 4: Integration & Testing

### 4.1 Lokales Testing

- Mock-402-Responses für UI-Entwicklung
- Testnet-Transaktionen (Optimism Sepolia)
- End-to-End Flow mit echtem Mint

### 4.2 Edge Cases

| Edge Case                          | Handling                                   |
| ---------------------------------- | ------------------------------------------ |
| Payment Success, Generation Failed | Bild später generieren (TokenId existiert) |
| Doppelte Payments verhindern       | Server prüft ob TokenId schon Bild hat     |
| Timeout bei Mint                   | Client zeigt Retry-Option                  |
| Invalid txHash                     | 402 mit Fehlermeldung                      |
| Falscher Contract                  | 402 - nur GenImNFTv4 akzeptiert            |

### 4.3 Monitoring

- Payment-Success-Rate tracken
- Generation-Success-Rate nach Payment
- Durchschnittliche Zeit: Request → Bild

---

## Zusammenfassung der Änderungen

### Server (genimg_bfl.js)

```diff
+ // Neuer 402-Handler am Anfang
+ if (!event.headers['x-payment']) {
+   return { statusCode: 402, headers: { 'X-Payment': ... } };
+ }
+
+ // Mint-Verification statt Token-Check
- const tokenExists = await contract.ownerOf(tokenId);
+ const { valid, tokenId } = await verifyMintPayment(paymentProof);

  // Rest bleibt gleich
  const image = await generateWithBFL(prompt);
  await updateTokenURI(tokenId, image);
```

### Client (ImageGenerator.tsx)

```diff
- // Separater Mint-Schritt
- const { mint } = useWriteContract();
- await mint();
- // ... warten ...
- await generateImage(tokenId);

+ // Ein zusammenhängender Flow
+ const response = await fetch('/genimg', { body: { prompt } });
+ if (response.status === 402) {
+   const tx = await mint();  // Automatisch getriggert
+   await fetch('/genimg', {
+     headers: { 'X-Payment': { txHash: tx.hash } }
+   });
+ }
```

---

## Dateien zu ändern

| Datei                                   | Änderungen                                                          |
| --------------------------------------- | ------------------------------------------------------------------- |
| `scw_js/package.json`                   | Dependencies: `viem` (bereits vorhanden)                            |
| `scw_js/genimg_x402.js`                 | **NEU**: 402-Response (manual), Mint-Verification (direct on-chain) |
| `website/components/ImageGenerator.tsx` | 402-Handling, vereinfachter Flow                                    |
| `website/hooks/useImageGeneration.ts`   | (neu) Fetch + 402 + Mint + Retry                                    |
| `website/public/openapi.json`           | 402-Response dokumentieren                                          |

---

## Zeitschätzung

| Phase                               | Aufwand | Status                           |
| ----------------------------------- | ------- | -------------------------------- |
| Phase 1: Server (402 + Mint-Verify) | 3-4h    | ✅ **Fertig** (`genimg_x402.js`) |
| Phase 2: Client (402-Handling)      | 3-4h    | ⏳ Todo                          |
| Phase 3: Contract                   | 0h      | ✅ Keine Änderungen              |
| Phase 4: Testing                    | 2-3h    | ⏳ Unit Tests vorhanden          |
| **Total**                           | 8-11h   | **Phase 1 abgeschlossen**        |

**Manual Implementation:** Klarer, direkter Code ohne Facilitator-Overhead

---

## Integration mit EIP-8004

x402 und EIP-8004 ergänzen sich gut:

- **EIP-8004**: Agent-Discovery & Trust (wer ist der Agent?)
- **x402**: Payment-Protokoll (wie zahle ich?)

Die `agent-registration.json` könnte ein x402-Payment-Schema referenzieren:

```json
{
  "endpoints": [
    {
      "name": "genimg",
      "endpoint": "https://...",
      "paymentProtocol": "x402"
    }
  ]
}
```

---

## Referenzen

- [x402 npm Package](https://www.npmjs.com/package/x402) - Offizielles x402 Core Package (für Facilitator-basierte Flows)
- [x402 Protocol Specification](https://github.com/coinbase/x402) - Standard für Payment Required (Coinbase)
- [x402 Express Examples](https://github.com/coinbase/x402/tree/main/examples/typescript/servers/advanced) - Advanced Server Patterns
- [HTTP 402 Payment Required](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402)
- [EIP-8004 Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004)
- [Viem Documentation](https://viem.sh/) - TypeScript Interface für Ethereum
- [Optimism Documentation](https://docs.optimism.io/)

## Implementation Status

- ✅ **genimg_x402.js**: Vollständige Server-Implementation mit x402-konformer 402 Response und direkter On-Chain Verification
- ✅ **Unit Tests**: Comprehensive Test-Suite mit 22 Tests
- ✅ **Demo Notebook**: `notebooks/genimg_x402_demo.ipynb` für lokales Testing
- ⏳ **Client Integration**: Website-Integration folgt in Phase 2
