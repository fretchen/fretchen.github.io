# Multi-Chain Expansion Plan

> Migration von GenImNFT, CollectorNFT auf CAIP-2 Pattern mit shared `@fretchen/chain-utils` Package

## Aktueller Zustand

| Contract | Optimism | Base | Multi-Chain Ready |
|----------|:--------:|:----:|:-----------------:|
| **SupportV2** | ✅ | ✅ | ✅ Ja |
| **GenImNFTv4** | ✅ | ❌ | ✅ Ja (Backend ready) |
| **CollectorNFTv1** | ✅ | ❌ | ❌ Nein |
| **LLMv1** | ✅ | ❌ | ❌ (out of scope) |
| **EIP3009SplitterV1** | ✅ | ❌ | ✅ Ja |

---

## Implementierungsplan

| Phase | Was | Projekte | Status |
|-------|-----|----------|--------|
| **1a** | `@fretchen/chain-utils` erstellen | shared/ | ✅ Fertig |
| **1b** | scw_js auf chain-utils migrieren | scw_js/ | ✅ Fertig |
| **1c** | x402_facilitator auf chain-utils migrieren | x402_facilitator/ | ⬜ Next |
| **2** | GenImNFT-Komponenten migrieren | website/ | ⬜ |
| **3** | CollectorNFT-Komponenten migrieren | website/ | ⬜ |
| **4** | GenImNFTv4 auf Base deployen | eth/, shared/ | ⬜ Später |
| **5** | CollectorNFTv1 auf Base deployen | eth/, shared/ | ⬜ Später |

---

## Phase 1a: @fretchen/chain-utils ✅ FERTIG

**Struktur:**
```
fretchen.github.io/
├── shared/
│   └── chain-utils/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       ├── eslint.config.js
│       ├── README.md
│       ├── src/
│       │   ├── index.ts      # Core utilities + re-exports
│       │   ├── addresses.ts  # Contract address maps + getters
│       │   └── abi/
│       │       ├── index.ts
│       │       ├── GenImNFTv4.ts
│       │       ├── LLMv1.ts
│       │       └── EIP3009SplitterV1.ts
│       └── test/
│           ├── index.test.ts
│           └── abi.test.ts
```

**Implementiert:**
- CAIP-2 Utilities: `toCAIP2()`, `fromCAIP2()`, `isMainnet()`, `isTestnet()`
- Chain Mapping: `getViemChain()`
- Contract Adressen: Separate Maps für Mainnet/Testnet
- Getter Funktionen: `getGenAiNFTAddress()`, `getCollectorNFTAddress()`, `getLLMv1Address()`, `getSupportV2Address()`, `getEIP3009SplitterAddress()`, `getUSDCAddress()`, `getUSDCConfig()`
- ABIs: `GenImNFTv4ABI`, `LLMv1ABI`, `EIP3009SplitterV1ABI`
- 46 Tests mit 98.75% Coverage
- CI/CD Pipeline: `.github/workflows/test-chain-utils.yml`

**Wichtig:** Kein `prepare` Script - muss manuell mit `npm run build` gebaut werden. CI Workflows bauen chain-utils vor Installation der Consumer.

---

## Phase 1b: scw_js Migration ✅ FERTIG

**Änderungen:**
- `package.json`: Dependency `"@fretchen/chain-utils": "file:../shared/chain-utils"`
- `tsup.config.js`: Bundling mit tsup für Scaleway Deployment
- ABIs: Importiert aus `@fretchen/chain-utils` statt lokaler Kopien
- `getChain.js`, `genimg_bfl.js`, `genimg_x402_token.js`, `x402_server.js`: Nutzen `getViemChain()`, `getGenAiNFTAddress()`, `getUSDCConfig()`

**tsup Bundling:**
- Löst das Symlink-Problem für Scaleway Deployment
- `createRequire` Banner für pino ESM Kompatibilität
- Node.js Builtins als external
- 175 Tests bestanden

**Entfernte Dateien:**
- `nft_abi.js` → importiert aus chain-utils
- `nft_abi.test.js` → verschoben nach chain-utils

---

## Phase 1c: x402_facilitator Migration ⬜ NEXT

**Geplant:**
- `chain_utils.js` durch Imports aus `@fretchen/chain-utils` ersetzen
- tsup Bundling hinzufügen (gleiches Pattern wie scw_js)
- ABIs aus chain-utils importieren {
    "@fretchen/chain-utils": "file:../shared/chain-utils"
  }
}
```

---

## Phase 1b: scw_js Migration

**Datei:** `scw_js/getChain.js`

```javascript
// NACHHER
import { 
  getViemChain, 
  fromCAIP2,
  MAINNET_GENAI_NFT_ADDRESSES,
  TESTNET_GENAI_NFT_ADDRESSES,
  USDC_ADDRESSES,
  USDC_NAMES 
} from "@fretchen/chain-utils";

export { getViemChain, fromCAIP2 };

export function getGenImgContractConfig(network) {
  const addresses = { ...MAINNET_GENAI_NFT_ADDRESSES, ...TESTNET_GENAI_NFT_ADDRESSES };
  const address = addresses[network];
  if (!address) throw new Error(`GenImg not deployed on ${network}`);
  return { address };
}

export function getUSDCConfig(network) {
  return {
    address: USDC_ADDRESSES[network],
    name: USDC_NAMES[network],
    chainId: fromCAIP2(network),
    decimals: 6,
    version: "2",
  };
}
```

---

## Phase 1c: x402_facilitator Migration

**Datei:** `x402_facilitator/chain_utils.js`

```javascript
// NACHHER
import { 
  getViemChain,
  fromCAIP2,
  MAINNET_GENAI_NFT_ADDRESSES,
  USDC_ADDRESSES,
  USDC_NAMES
} from "@fretchen/chain-utils";

export { getViemChain, fromCAIP2 };

export function getChainConfig(network) {
  return {
    chain: getViemChain(network),
    rpcUrl: getRpcUrl(network),  // bleibt lokal
    GENIMG_V4_ADDRESS: MAINNET_GENAI_NFT_ADDRESSES[network] || null,
    USDC_ADDRESS: USDC_ADDRESSES[network],
    USDC_NAME: USDC_NAMES[network],
  };
}
```

---

## Phase 2: GenImNFT-Komponenten migrieren (Website)

**Betroffene Dateien:**
- `MyNFTList.tsx` (4 Stellen)
- `NFTCard.tsx` (8 Stellen)
- `NFTList.tsx` (1 Stelle)
- `EntryNftImage.tsx` (2 Stellen)
- `PublicNFTList.tsx` (1 Stelle)
- `nftLoader.ts` (2 Stellen)

**Pattern-Änderung:**
```tsx
// VORHER
import { getChain, genAiNFTContractConfig } from "../utils/getChain";
const chain = getChain();
const { data } = useReadContract({
  ...genAiNFTContractConfig,
  chainId: chain.id,
});

// NACHHER
import { useAutoNetwork } from "../hooks/useAutoNetwork";
import { getGenAiNFTAddress, GenImNFTv4ABI, GENAI_NFT_NETWORKS } from "@fretchen/chain-utils";

const network = useAutoNetwork(GENAI_NFT_NETWORKS);
const { data } = useReadContract({
  address: getGenAiNFTAddress(network),
  abi: GenImNFTv4ABI,
});
```

---

## Phase 3: CollectorNFT-Komponenten migrieren

**Betroffene Dateien:**
- `SimpleCollectButton.tsx` (2 Stellen)

Gleiches Pattern wie Phase 2.

---

## Phase 4: GenImNFTv4 auf Base deployen

1. Deploy-Script für Base erweitern
2. Deploy + Verify auf Base Mainnet
3. Agent-Wallet autorisieren
4. Adresse in `@fretchen/chain-utils/src/addresses.ts` hinzufügen:
   ```typescript
   export const MAINNET_GENAI_NFT_ADDRESSES: Record<string, `0x${string}`> = {
     "eip155:10": "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
     "eip155:8453": "0x...",  // Base
   };
   ```
5. `npm run build` in chain-utils
6. `npm install` in allen Projekten

---

## Phase 5: CollectorNFTv1 auf Base deployen

Voraussetzung: GenImNFT muss auf Base existieren.

1. Deploy mit Base GenImNFT Adresse
2. Verify
3. Adresse in chain-utils hinzufügen

---

## Zusammenfassung

**Prinzipien:**
- CAIP-2 `"eip155:10"` ist überall der primäre Key
- Getrennte Maps für Mainnet/Testnet
- Kein Chain-Selector - automatische Wahl basierend auf User-Wallet
- Eine Quelle für Adressen: `@fretchen/chain-utils`
- tsup Bundling für Serverless Deployment

**Vorteile:**
- Neue Chains: Adresse nur an einer Stelle hinzufügen
- Konsistenz: Gleiches Pattern in website, scw_js, x402_facilitator
- Weniger Code: ~140 Zeilen duplizierter Switch-Statements entfernt
- Zuverlässiges Deployment: Symlink-Problem durch Bundling gelöst

**Tests:**
- chain-utils: 46 Tests, 98.75% Coverage
- scw_js: 175 Tests
- CI Pipelines für alle Packages
