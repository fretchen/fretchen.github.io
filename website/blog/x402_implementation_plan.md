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

- **[x402 npm Package](https://www.npmjs.com/package/x402)** - Offizielles x402 Core Package für 402-Responses und Basic Transaction-Verification
- **Custom Mint-Verification** - Event-Parsing für TokenId-Extraktion
- **Viem/Ethers** - Blockchain-Interaktion und Event-Parsing

**Aufteilung:**
- ✅ x402 Package: 80% (402-Response, Basic TX-Check)
- ✅ Custom Code: 20% (Mint-Event Parsing, TokenId Extraktion)

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

### 1.0 Dependencies installieren

```bash
cd scw_js
npm install x402 viem
```

### 1.1 Request-Handler erweitern

- Prüfe `X-Payment` Header auf eingehende Requests
- Ohne Payment → Return `402` via x402 Package
- Mit Payment → Verifiziere Mint-Event und generiere Bild

### 1.2 402 Response mit x402 Package

```javascript
import { createPaymentRequired } from 'x402';

// 402-Response erstellen
function create402Response() {
  return createPaymentRequired({
    amount: '500000000000000',
    recipient: GENIMG_CONTRACT_ADDRESS,
    network: 'optimism',
    metadata: {
      resource: 'genimg',
      description: 'Mint an NFT to generate your AI image',
      paymentType: 'contract-call',
      contractAddress: GENIMG_CONTRACT_ADDRESS,
      contractMethod: 'mint()'
    }
  });
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

### 1.3 Mint-Verification (x402 + Custom)

Kombination aus x402 Basic-Verification und Custom Mint-Event-Parsing:

```javascript
import { verifyPayment } from 'x402';
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

async function verifyMintPayment(paymentProof) {
  const { txHash, tokenId } = JSON.parse(paymentProof);
  
  // 1. Basic Verification via x402 Package
  const basicVerification = await verifyPayment({
    txHash,
    expectedRecipient: GENIMG_CONTRACT_ADDRESS,
    expectedAmount: MINT_PRICE,
    network: 'optimism'
  });
  
  if (!basicVerification.valid) {
    return { 
      valid: false, 
      error: basicVerification.error || 'Invalid transaction' 
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

**Was macht x402:**
- ✅ Transaction Status prüfen
- ✅ Recipient (Contract) verifizieren
- ✅ Amount (≥ MINT_PRICE) prüfen
- ✅ Network-spezifische Provider-Logik

**Was ist Custom:**
- ✅ Mint-Event Detection (Transfer from 0x0)
- ✅ TokenId Extraktion aus Event
- ✅ Minter-Adresse extrahieren

### 1.4 Vollständiger Handler mit x402 Package

```javascript
import { createPaymentRequired, verifyPayment } from 'x402';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { optimism } from 'viem/chains';

// Config
const MINT_PRICE = '500000000000000'; // 0.0005 ETH
const GENIMG_CONTRACT_ADDRESS = '0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb';

const publicClient = createPublicClient({
  chain: optimism,
  transport: http(process.env.OPTIMISM_RPC_URL)
});

export async function handler(event) {
  const paymentProof = event.headers['x-payment'];
  const { prompt } = JSON.parse(event.body);
  
  // Kein Payment → 402 via x402 Package
  if (!paymentProof) {
    const payment = createPaymentRequired({
      amount: MINT_PRICE,
      recipient: GENIMG_CONTRACT_ADDRESS,
      network: 'optimism',
      metadata: {
        resource: 'genimg',
        description: 'Mint an NFT to generate your AI image',
        paymentType: 'contract-call',
        contractAddress: GENIMG_CONTRACT_ADDRESS,
        contractMethod: 'mint()'
      }
    });
    
    return {
      statusCode: 402,
      headers: {
        'X-Payment': JSON.stringify(payment)
      },
      body: JSON.stringify({ 
        error: 'Payment required',
        message: 'Please mint an NFT to generate your image'
      })
    };
  }
  
  // Payment verifizieren (x402 + Custom Mint-Check)
  const verification = await verifyMintPayment(paymentProof);
  if (!verification.valid) {
    return { 
      statusCode: 402, 
      body: JSON.stringify({ error: verification.error })
    };
  }
  
  // Bild generieren mit verifiziertem tokenId
  const result = await generateImageAndUpdateNFT(
    prompt, 
    verification.tokenId,
    verification.payer
  );
  
  return {
    statusCode: 200,
    body: JSON.stringify(result)
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

| Aktuell | Neu (x402) |
|---------|------------|
| Separater Mint-Button | Ein "Generate"-Button |
| User wartet auf Mint, dann Generate | Ein durchgehender Flow |
| TokenId manuell übergeben | TokenId aus Mint-Event extrahiert |
| Server prüft Token on-chain | Server verifiziert Payment-Proof |

### 2.4 Pseudocode

```typescript
async function generateImageWithPayment(prompt: string) {
  // 1. Erster Request - löst 402 aus
  let response = await fetch(GENIMG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  
  if (response.status === 402) {
    // 2. Parse Payment-Details
    const paymentDetails = JSON.parse(
      response.headers.get('X-Payment') || '{}'
    );
    
    // 3. NFT Minting durchführen
    const { hash: txHash } = await writeContract({
      address: paymentDetails.contractAddress,
      abi: GenImNFTv4ABI,
      functionName: 'mint',
      value: BigInt(paymentDetails.maxAmountRequired)
    });
    
    // 4. Auf Confirmation warten
    const receipt = await waitForTransactionReceipt({ hash: txHash });
    
    // 5. TokenId aus Mint-Event extrahieren
    const mintEvent = receipt.logs.find(
      log => log.topics[0] === TRANSFER_EVENT_SIGNATURE
    );
    const tokenId = parseInt(mintEvent.topics[3], 16);
    
    // 6. Retry mit Payment-Proof
    response = await fetch(GENIMG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Payment': JSON.stringify({ txHash, tokenId })
      },
      body: JSON.stringify({ prompt })
    });
  }
  
  if (!response.ok) {
    throw new Error('Image generation failed');
  }
  
  return response.json();
}
```

---

## Phase 3: Smart Contract (GenImNFTv4)

**Entscheidung:** Der bestehende GenImNFTv4 Contract bleibt unverändert!

### Warum keine Contract-Änderungen nötig sind

Der aktuelle Contract unterstützt bereits alles, was für x402 benötigt wird:

| Funktion | Bereits vorhanden | Für x402 genutzt |
|----------|-------------------|------------------|
| `mint()` | ✅ | Payment-Transaktion |
| `Transfer` Event | ✅ | TokenId + Payer extrahieren |
| `requestImageUpdate()` | ✅ | Bild on-chain speichern |
| Whitelisted Provider | ✅ | Server kann TokenURI updaten |

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

| Edge Case | Handling |
|-----------|----------|
| Payment Success, Generation Failed | Bild später generieren (TokenId existiert) |
| Doppelte Payments verhindern | Server prüft ob TokenId schon Bild hat |
| Timeout bei Mint | Client zeigt Retry-Option |
| Invalid txHash | 402 mit Fehlermeldung |
| Falscher Contract | 402 - nur GenImNFTv4 akzeptiert |

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

| Datei | Änderungen |
|-------|------------|
| `scw_js/package.json` | Add: `x402`, `viem` |
| `scw_js/genimg_bfl.js` | 402-Response (x402), Mint-Verification (x402 + custom) |
| `website/components/ImageGenerator.tsx` | 402-Handling, vereinfachter Flow |
| `website/hooks/useImageGeneration.ts` | (neu) Fetch + 402 + Mint + Retry |
| `website/public/openapi.json` | 402-Response dokumentieren |

---

## Zeitschätzung

| Phase | Aufwand | Mit x402 Package |
|-------|---------|------------------|
| Phase 1: Server (402 + Mint-Verify) | 3-4h | **2-3h** ✅ |
| Phase 2: Client (402-Handling) | 3-4h | 3-4h |
| Phase 3: Contract | 0h | 0h |
| Phase 4: Testing | 2-3h | 2-3h |
| **Total** | 8-11h | **7-10h** ✅ |

**Zeitsparung durch x402 Package:** ~1-2h (Basic-Verification fertig implementiert)

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

- [x402 npm Package](https://www.npmjs.com/package/x402) - Offizielles x402 Core Package
- [x402 Protocol Specification](https://github.com/standard-crypto/x402) - Standard für Payment Required
- [HTTP 402 Payment Required](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402)
- [EIP-8004 Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004)
- [Viem Documentation](https://viem.sh/) - TypeScript Interface für Ethereum
- [Optimism Documentation](https://docs.optimism.io/)
