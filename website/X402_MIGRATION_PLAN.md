# x402 Migration Plan - ImageGenerator

## Übersicht

Migration des `ImageGenerator` von ETH-basiertem On-Chain-Minting zu x402 USDC-Zahlungen.

**Ziel:** ~70% Code-Reduktion, bessere UX durch gaslose USDC-Zahlungen.

**API-Endpoint:** `genimg_x402_token.js` (bereits deployed auf Scaleway)

---

## Phase 1: Dependencies & Infrastruktur

### 1.1 Neue Packages installieren

```bash
cd website
npm install @x402/fetch@^2.0.0 @x402/evm@^2.0.0
```

### 1.2 Environment Variable

In `.env` hinzufügen:
```env
PUBLIC_ENV__X402_GENIMG_URL=https://mypersonaljscloudivnad9dy-genimgx402token.functions.fnc.fr-par.scw.cloud
```

### 1.3 TypeScript Types

Neue Datei `types/x402.ts`:
```typescript
export interface X402GenImgRequest {
  prompt: string;
  size?: "1024x1024" | "1792x1024";
  mode?: "generate" | "edit";
  referenceImage?: string; // base64
  sepoliaTest?: boolean;
}

export interface X402GenImgResponse {
  imageUrl: string;
  tokenId: number;
  contractAddress: string;
  metadata_url: string;
  mintTxHash: string;
  transferTxHash: string;
}

export interface X402PaymentReceipt {
  transaction: string;
  network: string;
}
```

---

## Phase 2: Hook-Entwicklung

### 2.1 Neuer Hook `useX402ImageGeneration`

Erstelle `hooks/useX402ImageGeneration.ts`:

```typescript
import { useState, useCallback, useMemo } from "react";
import { useWalletClient, useAccount } from "wagmi";
import { x402Client, wrapFetchWithPayment, x402HTTPClient } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import type { X402GenImgRequest, X402GenImgResponse, X402PaymentReceipt } from "../types/x402";

const X402_API_URL = import.meta.env.PUBLIC_ENV__X402_GENIMG_URL;

export type GenerationStatus = "idle" | "awaiting-signature" | "processing" | "success" | "error";

export interface UseX402ImageGenerationResult {
  generateImage: (request: X402GenImgRequest) => Promise<X402GenImgResponse>;
  status: GenerationStatus;
  error: string | null;
  paymentReceipt: X402PaymentReceipt | null;
  reset: () => void;
}

export function useX402ImageGeneration(): UseX402ImageGenerationResult {
  const { data: walletClient } = useWalletClient();
  const { address, isConnected } = useAccount();
  
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<X402PaymentReceipt | null>(null);

  // Memoized x402 client setup
  const { client, fetchWithPayment } = useMemo(() => {
    if (!walletClient) return { client: null, fetchWithPayment: null };
    
    const x402 = new x402Client();
    registerExactEvmScheme(x402, { signer: walletClient });
    const wrappedFetch = wrapFetchWithPayment(fetch, x402);
    
    return { client: x402, fetchWithPayment: wrappedFetch };
  }, [walletClient]);

  const generateImage = useCallback(async (request: X402GenImgRequest): Promise<X402GenImgResponse> => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }
    
    if (!fetchWithPayment || !client) {
      throw new Error("x402 client not initialized");
    }

    setStatus("awaiting-signature");
    setError(null);
    setPaymentReceipt(null);

    try {
      // x402 handles 402 → signature → retry automatically
      const response = await fetchWithPayment(X402_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      setStatus("processing");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const result: X402GenImgResponse = await response.json();

      // Extract payment receipt from response headers
      const httpClient = new x402HTTPClient(client);
      const receipt = httpClient.getPaymentSettleResponse(
        (name) => response.headers.get(name)
      );
      
      if (receipt) {
        setPaymentReceipt({
          transaction: receipt.transaction,
          network: receipt.network,
        });
      }

      setStatus("success");
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setStatus("error");
      throw err;
    }
  }, [isConnected, address, fetchWithPayment, client]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setPaymentReceipt(null);
  }, []);

  return {
    generateImage,
    status,
    error,
    paymentReceipt,
    reset,
  };
}
```

---

## Phase 3: ImageGenerator Refactoring

### 3.1 Code zu entfernen

Aus `ImageGenerator.tsx` entfernen:

| Code-Block | Zeilen (ca.) | Grund |
|------------|--------------|-------|
| `useReadContract` für `mintPrice` | 148-154 | Server bestimmt Preis |
| `useWriteContract` + `writeContractAsync` | 156 | Kein On-Chain-Minting mehr |
| `waitForTransaction` Helper | 82-98 | Server wartet auf TXs |
| `waitForChainSwitch` Helper | 159-176 | Nicht mehr nötig |
| Token-ID-Extraktion aus Events | 365-378 | Server liefert tokenId |
| Chain-Switch-Logik | 314-334 | Server wählt Chain |
| `mintPrice` Anzeige-Logik | 987-1000 | USDC-Preis stattdessen |
| Minting-Status-State | 132, 348-352 | Vereinfacht |

### 3.2 Neuer `handleGenerate` Flow

```typescript
// Ersetze handleMintAndGenerate (~150 Zeilen) mit:

const { generateImage, status, error: x402Error, paymentReceipt } = useX402ImageGeneration();

const handleGenerate = async () => {
  if (!isConnected) {
    setError("Please connect your wallet");
    return;
  }

  if (!prompt.trim()) {
    setError("Please enter a prompt");
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    const result = await generateImage({
      prompt,
      size,
      mode: referenceImageBase64 ? "edit" : "generate",
      referenceImage: referenceImageBase64 || undefined,
      sepoliaTest: import.meta.env.DEV, // Testnet in dev mode
    });

    // Success handling
    setGeneratedImageUrl(result.imageUrl);
    setTokenId(BigInt(result.tokenId));
    setCurrentPreviewImage(result.imageUrl);
    setPreviewState("generated");

    // Callback to parent
    onSuccess?.(BigInt(result.tokenId), result.imageUrl, {
      name: `AI Generated Artwork #${result.tokenId}`,
      description: `AI generated artwork: "${prompt}"`,
      image: result.imageUrl,
    });

    // Analytics
    trackEvent?.("x402_image_generated", {
      tokenId: result.tokenId,
      mode: referenceImageBase64 ? "edit" : "generate",
    });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Generation failed";
    setError(errorMsg);
    onError?.(errorMsg);
  } finally {
    setIsLoading(false);
  }
};
```

### 3.3 Status-Anzeige aktualisieren

```typescript
// Mapping von x402-Status zu UI-Text
const getStatusText = () => {
  switch (status) {
    case "awaiting-signature":
      return "Sign USDC payment..."; // Lokalisieren
    case "processing":
      return "Generating image & minting NFT...";
    case "success":
      return "Complete!";
    case "error":
      return x402Error || "Error occurred";
    default:
      return null;
  }
};
```

---

## Phase 4: UI-Anpassungen

### 4.1 Preis-Anzeige ändern

Von:
```tsx
{mintPrice && (
  <span>Cost: {formatEther(mintPrice)} ETH</span>
)}
```

Zu:
```tsx
<span>Cost: $0.07 USDC</span>
{/* Optional: Dynamisch vom Server laden */}
```

### 4.2 Button-Text

Von:
```tsx
"Create Artwork (0.00003 ETH)"
```

Zu:
```tsx
"Create Artwork ($0.07 USDC)"
```

### 4.3 Payment-Receipt anzeigen (optional)

```tsx
{paymentReceipt && (
  <div className={styles.paymentReceipt}>
    <p>Payment confirmed!</p>
    <a 
      href={`https://optimistic.etherscan.io/tx/${paymentReceipt.transaction}`}
      target="_blank"
    >
      View transaction ↗
    </a>
  </div>
)}
```

---

## Phase 5: Lokalisierung

### 5.1 Neue Keys in `locales/*.json`

```json
{
  "imagegen.payWithUsdc": "Pay with USDC",
  "imagegen.usdcCost": "Cost: $0.07 USDC",
  "imagegen.awaitingSignature": "Sign USDC payment in wallet...",
  "imagegen.processingPayment": "Processing payment...",
  "imagegen.mintingNft": "Minting your NFT...",
  "imagegen.paymentConfirmed": "Payment confirmed!",
  "imagegen.viewTransaction": "View transaction"
}
```

### 5.2 Zu entfernende Keys

- `imagegen.loadMintPrice`
- `imagegen.switchToOptimism`
- `imagegen.switchingNetwork`

---

## Phase 6: Testing

### 6.1 Unit Tests für Hook

```typescript
// hooks/useX402ImageGeneration.test.ts
import { renderHook, act } from "@testing-library/react";
import { useX402ImageGeneration } from "./useX402ImageGeneration";

describe("useX402ImageGeneration", () => {
  it("should initialize with idle status", () => {
    const { result } = renderHook(() => useX402ImageGeneration());
    expect(result.current.status).toBe("idle");
  });

  it("should throw if wallet not connected", async () => {
    const { result } = renderHook(() => useX402ImageGeneration());
    await expect(
      result.current.generateImage({ prompt: "test" })
    ).rejects.toThrow("Wallet not connected");
  });

  // ... weitere Tests
});
```

### 6.2 E2E Test mit Sepolia

```typescript
// Manueller Test-Flow:
// 1. Connect Wallet mit Sepolia USDC
// 2. Enter prompt
// 3. Click "Create Artwork"
// 4. Sign EIP-3009 message in MetaMask
// 5. Wait for image generation
// 6. Verify NFT in wallet
```

---

## Phase 7: Cleanup

### 7.1 Zu entfernende Imports

```typescript
// Entfernen aus ImageGenerator.tsx:
- import { useReadContract, useWriteContract, useSwitchChain } from "wagmi";
- import { TransactionReceipt, MintingStatus } from "../types/blockchain";
```

### 7.2 Zu entfernende Typen

In `types/blockchain.ts`:
- `MintingStatus` (ersetzt durch `GenerationStatus`)

### 7.3 Zu entfernende Utils

- `waitForTransaction` kann nach Migration gelöscht werden

---

## Migrations-Checkliste

- [x] Dependencies installieren (`@x402/fetch`, `@x402/evm`)
- [x] Types erstellen (`types/x402.ts`)
- [x] Hook erstellen (`useX402ImageGeneration.ts`)
- [x] ImageGenerator refactoren
- [ ] Environment Variable setzen (optional, hat Default)
- [ ] Lokalisierung aktualisieren (neue x402-Keys)
- [ ] Unit Tests schreiben
- [ ] E2E Test auf Sepolia
- [ ] Alte Imports/Types entfernen (bereits erledigt)
- [ ] Dokumentation aktualisieren

---

## Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Mitigation |
|--------|-------------------|------------|
| @x402/fetch Browser-Kompatibilität | Niedrig | Vite bundlet ESM korrekt |
| USDC-Guthaben fehlt | Mittel | Klare Fehlermeldung + Link zu Bridge |
| EIP-3009 Signatur-Ablehnung | Niedrig | Retry-Option anbieten |
| Server-Downtime | Niedrig | Graceful error handling |

---

## Geschätzte Aufwände

| Phase | Aufwand |
|-------|---------|
| Phase 1: Dependencies | 0.5h |
| Phase 2: Hook | 2h |
| Phase 3: Refactoring | 3h |
| Phase 4: UI | 1h |
| Phase 5: Lokalisierung | 0.5h |
| Phase 6: Testing | 2h |
| Phase 7: Cleanup | 1h |
| **Gesamt** | **~10h** |

---

## Rollback-Plan

Falls Probleme auftreten:
1. Revert zu vorherigem Commit
2. Alte `genimg_bfl.js` API ist weiterhin verfügbar
3. Kein Breaking Change an Smart Contracts

---

## Nächste Schritte

1. **Review** dieses Plans
2. **Dependencies** installieren und testen
3. **Hook** entwickeln (isoliert testbar)
4. **Schrittweise Migration** des ImageGenerator
