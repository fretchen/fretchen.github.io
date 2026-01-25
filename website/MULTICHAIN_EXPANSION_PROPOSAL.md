# Multi-Chain Expansion Proposal

> Migration von GenImNFT, CollectorNFT auf CAIP-2 Pattern

## Aktueller Zustand

| Contract | Optimism | Base | Multi-Chain Ready |
|----------|:--------:|:----:|:-----------------:|
| **SupportV2** | ✅ | ✅ | ✅ Ja |
| **GenImNFTv4** | ✅ `0x80f95d33...` | ❌ | ❌ Nein |
| **CollectorNFTv1** | ✅ `0x584c40d8...` | ❌ | ❌ Nein |
| **LLMv1** | ✅ | ❌ | ❌ (out of scope) |

**Problem:** GenImNFT/CollectorNFT nutzen `PUBLIC_ENV__CHAIN_NAME` (Build-Zeit). SupportV2 nutzt CAIP-2 Address-Maps (Runtime).

---

## Implementierungsplan

| Phase | Was | Status |
|-------|-----|--------|
| **1** | getChain.ts → CAIP-2 Pattern für alle Contracts | 🔜 Next |
| **2** | GenImNFT-Komponenten auf neues Pattern migrieren | ⬜ Geplant |
| **3** | CollectorNFT-Komponenten migrieren | ⬜ Geplant |
| **4** | GenImNFTv4 auf Base deployen | ⬜ Später |
| **5** | CollectorNFTv1 auf Base deployen (nach GenImNFT) | ⬜ Später |

> **Out of Scope:** LLMv1 Migration (Assistent-Seite) - kommt später.

---

## Phase 1: getChain.ts Refactoring

**Ziel:** CAIP-2 Strings als primärer Key überall (konsistent mit scw_js).

**Prinzipien:** 
- CAIP-2 `"eip155:10"` ist die Wahrheit
- wagmi/viem `chainId: number` wird nur an den Grenzen übersetzt
- **Getrennte Maps für Mainnet/Testnet** (Option A) - kein Risiko Mainnet/Testnet zu mischen

```typescript
// ═══════════════════════════════════════════════════════════════
// CAIP-2 Utilities
// ═══════════════════════════════════════════════════════════════

/** wagmi chainId → CAIP-2 */
export const toCAIP2 = (chainId: number): string => `eip155:${chainId}`;

/** CAIP-2 → wagmi chainId */
export const fromCAIP2 = (network: string): number => {
  const match = network.match(/^eip155:(\d+)$/);
  if (!match) throw new Error(`Invalid CAIP-2: ${network}`);
  return parseInt(match[1], 10);
};

/** CAIP-2 → viem Chain object */
export function getViemChain(network: string): Chain {
  switch (network) {
    case "eip155:10": return optimism;
    case "eip155:11155420": return optimismSepolia;
    case "eip155:8453": return base;
    case "eip155:84532": return baseSepolia;
    default: throw new Error(`Unsupported network: ${network}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// Contract Adressen (CAIP-2 als Key, getrennt nach Mainnet/Testnet)
// ═══════════════════════════════════════════════════════════════

/** GenImNFT - Mainnet */
const MAINNET_GENAI_NFT_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:10": "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
  // "eip155:8453": "0x...",  // Base - nach Deployment
};

/** GenImNFT - Testnet */
const TESTNET_GENAI_NFT_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:11155420": "0x10827cC42a09D0BAD2d43134C69F0e776D853D85",
  // "eip155:84532": "0x...",  // Base Sepolia - nach Deployment
};

/** Aktive Adressen basierend auf VITE_USE_TESTNET */
const GENAI_NFT_ADDRESSES = USE_TESTNET 
  ? TESTNET_GENAI_NFT_ADDRESSES 
  : MAINNET_GENAI_NFT_ADDRESSES;

// Analog für CollectorNFT, SupportV2...
```

---

## Offene Frage: Shared Package

Die CAIP-2 Utilities (`toCAIP2`, `fromCAIP2`, `getViemChain`, Address-Maps) werden in mehreren Projekten benötigt:
- `website/` (Vite + TypeScript)
- `scw_js/` (Node.js + JavaScript)  
- `x402_facilitator/` (Node.js + JavaScript)

### Empfehlung: TypeScript Package mit file: Link

**Struktur:**
```
fretchen.github.io/
├── shared/
│   └── chain-utils/
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts        # CAIP-2 utilities
│       │   └── addresses.ts    # Contract-Adressen (Mainnet/Testnet Maps)
│       └── dist/               # Generiert bei npm install
│           ├── index.js
│           ├── index.d.ts
│           └── ...
├── website/
├── scw_js/
└── x402_facilitator/
```

**shared/chain-utils/package.json:**
```json
{
  "name": "@fretchen/chain-utils",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./addresses": {
      "types": "./dist/addresses.d.ts",
      "default": "./dist/addresses.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "prepare": "npm run build"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

**shared/chain-utils/tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "dist",
    "strict": true
  },
  "include": ["src"]
}
```

**Konsumenten (scw_js, x402_facilitator, website):**
```json
{
  "dependencies": {
    "@fretchen/chain-utils": "file:../shared/chain-utils"
  }
}
```

**Workflow:**
1. `npm install` in `shared/chain-utils/` → `prepare` Script → `tsc` → `dist/`
2. `npm install` in Konsumenten → kopiert fertiges `dist/` nach `node_modules/`
3. Import: `import { toCAIP2, fromCAIP2 } from "@fretchen/chain-utils"`

### Monorepo: Nötig oder nicht?

**Aktuell reicht `file:` Link** - kein formales Monorepo-Setup nötig.

| Ansatz | Wann sinnvoll |
|--------|---------------|
| **file: Links (aktuell)** | 1-2 shared packages, wenige Abhängigkeiten |
| **npm workspaces** | 3+ packages, gemeinsame devDependencies |
| **pnpm workspaces** | Viele packages, Disk-Space-Optimierung |
| **Turborepo/Nx** | Build-Caching, komplexe CI/CD |

**Empfehlung:** Mit `file:` Links starten. Falls später mehr shared packages entstehen oder `npm install` zu langsam wird → npm workspaces nachrüsten:

```json
// Root package.json (optional, für später)
{
  "workspaces": [
    "shared/*",
    "website",
    "scw_js",
    "x402_facilitator"
  ]
}
```

Dann reicht ein `npm install` im Root für alle Projekte.

### Kompatibilitätsanalyse: scw_js & x402_facilitator

**Aktuelle Implementierungen:**

| Funktion | scw_js | x402_facilitator | Shared? |
|----------|--------|------------------|---------|
| `toCAIP2(chainId)` | ❌ fehlt | ❌ fehlt | ✅ Neu |
| `fromCAIP2(network)` | ❌ implizit | `getChainId()` | ✅ |
| `getViemChain(network)` | ✅ vorhanden | `getChain()` | ✅ |
| Contract Adressen | `getGenImgContractConfig()` | `getChainConfig()` | ⚠️ |
| USDC Config | `getUSDCConfig()` | `TOKEN_INFO` | ⚠️ |
| RPC URLs | ❌ fehlt | `getRpcUrl()` | ❌ Lokal |

**Unterschiedliche Strukturen (später vereinheitlichen):**

scw_js:
```javascript
getUSDCConfig("eip155:10") → { address, decimals, usdcName, ... }
```

x402_facilitator:
```javascript
getChainConfig("eip155:10") → { chain, rpcUrl, USDC_ADDRESS, ... }
TOKEN_INFO["eip155:10"]["0x..."] → { address, symbol, ... }
```

**Layered Shared Package:**

```
@fretchen/chain-utils/src/
├── index.ts        # Core: toCAIP2, fromCAIP2, getViemChain
├── addresses.ts    # Maps: GENAI_NFT_ADDRESSES, USDC_ADDRESSES, etc.
└── usdc.ts         # USDC_NAMES per network
```

**Was shared wird:**
```typescript
// Core utilities
export const toCAIP2 = (chainId: number) => `eip155:${chainId}`;
export const fromCAIP2 = (network: string) => parseInt(network.split(":")[1], 10);
export function getViemChain(network: string): Chain { ... }

// Address Maps
export const GENAI_NFT_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:10": "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
  "eip155:11155420": "0x10827cC42a09D0BAD2d43134C69F0e776D853D85",
};
export const USDC_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:10": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  "eip155:11155420": "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
  "eip155:8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "eip155:84532": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};
export const USDC_NAMES: Record<string, string> = {
  "eip155:10": "USD Coin",
  "eip155:11155420": "USDC",
  "eip155:8453": "USD Coin",
  "eip155:84532": "USDC",
};
```

**Was lokal bleibt (projekt-spezifisch):**
- `getRpcUrl()` - x402 env-var Logik
- `getChainConfig()` Struktur - x402 bündelt mehr
- ABIs - unterschiedliche Imports pro Projekt

**Migration in scw_js/x402_facilitator:**
```javascript
// Vorher
export function getViemChain(network) { switch... }

// Nachher
import { getViemChain, fromCAIP2, USDC_ADDRESSES } from "@fretchen/chain-utils";

// Lokale Funktionen nutzen shared imports
export function getChainConfig(network) {
  return {
    chain: getViemChain(network),        // ← shared
    rpcUrl: getRpcUrl(network),          // ← lokal
    USDC_ADDRESS: USDC_ADDRESSES[network], // ← shared
  };
}
```

> **Später vereinheitlichen:** Die unterschiedlichen Config-Strukturen (`getUSDCConfig` vs `TOKEN_INFO`) können in einem späteren Schritt konsolidiert werden.

---

## Automatische Network-Wahl

**Kein Chain-Selector** - Network wird automatisch basierend auf User-Wallet gewählt:

```typescript
// hooks/useAutoNetwork.ts
export function useAutoNetwork(supportedNetworks: string[]): string {
  const { chain } = useAccount();
  
  if (chain) {
    const userNetwork = toCAIP2(chain.id);
    if (supportedNetworks.includes(userNetwork)) {
      return userNetwork;
    }
  }
  
  // Fallback: Erstes unterstütztes Network (Optimism)
  return supportedNetworks[0];
}

// Verwendung
const network = useAutoNetwork(GENAI_NFT_NETWORKS);  // "eip155:10"
const config = getGenAiNFTConfig(network);
```

---

## Phase 2: GenImNFT-Komponenten migrieren

**Betroffene Komponenten:**
- `MyNFTList.tsx` - 4 Stellen mit `genAiNFTContractConfig`
- `NFTCard.tsx` - 8 Stellen mit `genAiNFTContractConfig`
- `NFTList.tsx` - 1 Stelle
- `EntryNftImage.tsx` - 2 Stellen
- `PublicNFTList.tsx` - 1 Stelle
- `nftLoader.ts` - 2 Stellen

**Aktuelles Pattern:**
```tsx
// MyNFTList.tsx - VORHER
import { getChain, genAiNFTContractConfig } from "../utils/getChain";

const chain = getChain();  // Statisch, Build-Zeit

const { data: userBalance } = useReadContract({
  ...genAiNFTContractConfig,  // Statische Config
  functionName: "balanceOf",
  args: address ? [address] : undefined,
  chainId: chain.id,  // Manuell hinzugefügt
});
```

**Neues Pattern mit chain-utils:**
```tsx
// MyNFTList.tsx - NACHHER
import { useAutoNetwork } from "../hooks/useAutoNetwork";
import { getGenAiNFTConfig, GENAI_NFT_NETWORKS } from "@fretchen/chain-utils";

// Network automatisch basierend auf User-Wallet
const network = useAutoNetwork(GENAI_NFT_NETWORKS);
const config = getGenAiNFTConfig(network);  // Enthält address, abi, chainId

const { data: userBalance } = useReadContract({
  ...config,  // chainId ist bereits enthalten!
  functionName: "balanceOf",
  args: address ? [address] : undefined,
  // chainId: nicht mehr nötig, kommt aus config
});
```

**Migration pro Komponente:**

| Komponente | Änderungen | Aufwand |
|------------|------------|---------|
| `MyNFTList.tsx` | Import ändern, `useAutoNetwork` hinzufügen, 4x Config ersetzen | 30min |
| `NFTCard.tsx` | Import ändern, `useAutoNetwork` hinzufügen, 8x Config ersetzen | 45min |
| `NFTList.tsx` | Import ändern, 1x Config ersetzen | 15min |
| `EntryNftImage.tsx` | Import ändern, 2x Config ersetzen | 15min |
| `PublicNFTList.tsx` | Import ändern, 1x Config ersetzen | 15min |
| `nftLoader.ts` | Parameter `network` hinzufügen, Config dynamisch | 30min |

**nftLoader.ts Sonderfall:**
```typescript
// VORHER - statisch
export async function loadNFTMetadata(tokenID: number, publicClient: PublicClient) {
  const tokenURIResult = await publicClient.readContract({
    address: genAiNFTContractConfig.address,
    abi: genAiNFTContractConfig.abi,
    functionName: "tokenURI",
    args: [BigInt(tokenID)],
  });
}

// NACHHER - network als Parameter
export async function loadNFTMetadata(
  tokenID: number, 
  publicClient: PublicClient,
  network: string  // NEU: CAIP-2 network
) {
  const config = getGenAiNFTConfig(network);
  if (!config) throw new Error(`GenImNFT not available on ${network}`);
  
  const tokenURIResult = await publicClient.readContract({
    address: config.address,
    abi: config.abi,
    functionName: "tokenURI",
    args: [BigInt(tokenID)],
  });
}
```

---

## Phase 3: CollectorNFT-Komponenten migrieren

**Betroffene Komponenten:**
- `SimpleCollectButton.tsx` - 2 Stellen mit `collectorNFTContractConfig`

**Aktuelles Pattern:**
```tsx
// VORHER
import { collectorNFTContractConfig, getChain } from "../utils/getChain";

const chain = getChain();
const isCorrectNetwork = chainId === chain.id;

const { data: mintStats } = useReadContract({
  ...collectorNFTContractConfig,
  functionName: "getMintStats",
  chainId: chain.id,
});
```

**Neues Pattern:**
```tsx
// NACHHER
import { useAutoNetwork } from "../hooks/useAutoNetwork";
import { getCollectorNFTConfig, COLLECTOR_NFT_NETWORKS, fromCAIP2 } from "@fretchen/chain-utils";

const network = useAutoNetwork(COLLECTOR_NFT_NETWORKS);
const config = getCollectorNFTConfig(network);

// CollectorNFT nur auf Optimism → Network-Check anpassen
const isCorrectNetwork = config && chainId === config.chainId;

const { data: mintStats } = useReadContract({
  ...config,
  functionName: "getMintStats",
  // chainId bereits in config
});
```

**Besonderheit CollectorNFT:**
- Nur auf Optimism deployed (referenziert GenImNFT)
- `COLLECTOR_NFT_NETWORKS` = `["eip155:10"]` (nur Mainnet)
- Wenn User auf Base → Button disabled oder versteckt

---

## Phase 4: GenImNFTv4 auf Base deployen

**Voraussetzungen:**
- Phase 1-2 abgeschlossen (chain-utils + Frontend-Migration)
- Deploy-Script für Base anpassen

**Schritte:**
1. `eth/scripts/deploy-genimg-v4.ts` für Base erweitern
2. Deploy auf Base Mainnet
3. Contract verifizieren
4. Agent-Wallet autorisieren: `authorizeAgentWallet(0xAAEBC1441323...)`
5. Address in `@fretchen/chain-utils` hinzufügen:
   ```typescript
   const MAINNET_GENAI_NFT_ADDRESSES = {
     "eip155:10": "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
     "eip155:8453": "0x...",  // NEU
   };
   ```
6. `scw_js/getChain.js` aktualisieren (nutzt dann shared package)
7. Test: Image-Generation auf Base

---

## Phase 5: CollectorNFTv1 auf Base deployen

**Voraussetzungen:**
- Phase 4 abgeschlossen (GenImNFT auf Base)
- CollectorNFT referenziert GenImNFT → muss zuerst existieren

**Schritte:**
1. `eth/scripts/deploy-collector-nft.ts` für Base anpassen
2. Deploy mit `genImNFTAddress` = Base GenImNFT Adresse
3. Contract verifizieren
4. Address in `@fretchen/chain-utils` hinzufügen
5. Test: Collect-Button funktioniert auf Base

---

## Zusammenfassung: Wie chain-utils unterstützt

| Phase | Ohne chain-utils | Mit chain-utils |
|-------|------------------|-----------------|
| **2** | Jede Komponente hat eigene Chain-Logik | `useAutoNetwork()` + `getGenAiNFTConfig()` |
| **3** | Duplizierte Logik für CollectorNFT | Gleiches Pattern wie Phase 2 |
| **4** | Adressen in 3 Projekten manuell pflegen | Eine Stelle in shared package |
| **5** | Nochmal manuelle Pflege | Nur `COLLECTOR_NFT_ADDRESSES` erweitern |

**Kritischer Vorteil:** Wenn Base-Adressen hinzugefügt werden, reicht ein Update in `@fretchen/chain-utils` → alle Projekte (website, scw_js, x402) profitieren automatisch nach `npm install`.

---

## Migration: scw_js

**Betroffene Dateien:**
- `scw_js/getChain.js` - Hauptdatei mit Chain-Logik

**Aktuell dupliziert:**
```javascript
// scw_js/getChain.js - VORHER
export function getGenImgContractConfig(network) {
  switch (network) {
    case "eip155:11155420":
      return { address: "0x10827cC42a09D0BAD2d43134C69F0e776D853D85" };
    case "eip155:10":
      return { address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb" };
  }
}

export function getViemChain(network) {
  switch (network) { ... }  // Dupliziert
}

export function getUSDCConfig(network) {
  switch (network) { ... }  // Dupliziert
}
```

**Nach Migration:**
```javascript
// scw_js/getChain.js - NACHHER
import { 
  getViemChain, 
  fromCAIP2,
  GENAI_NFT_ADDRESSES,
  USDC_ADDRESSES,
  USDC_NAMES 
} from "@fretchen/chain-utils";

// Re-export für Abwärtskompatibilität
export { getViemChain, fromCAIP2 };

// Lokale Wrapper (falls nötig)
export function getGenImgContractConfig(network) {
  const address = GENAI_NFT_ADDRESSES[network];
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

**Gelöschter Code:** ~80 Zeilen (switch statements für Adressen)

---

## Migration: x402_facilitator

**Betroffene Dateien:**
- `x402_facilitator/chain_utils.js` - Hauptdatei mit Chain-Logik

**Aktuell dupliziert:**
```javascript
// x402_facilitator/chain_utils.js - VORHER
export function getChainConfig(network) {
  if (network === "eip155:10") {
    return {
      chain: optimism,
      GENIMG_V4_ADDRESS: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",  // Dupliziert!
      USDC_ADDRESS: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",      // Dupliziert!
      ...
    };
  }
}

export const TOKEN_INFO = {
  "eip155:10": {
    "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85": { ... }  // Dupliziert!
  },
};
```

**Nach Migration:**
```javascript
// x402_facilitator/chain_utils.js - NACHHER
import { 
  getViemChain,
  GENAI_NFT_ADDRESSES,
  LLMV1_ADDRESSES,
  USDC_ADDRESSES,
  USDC_NAMES
} from "@fretchen/chain-utils";

export function getChainConfig(network) {
  return {
    chain: getViemChain(network),           // ← aus shared
    rpcUrl: getRpcUrl(network),              // ← bleibt lokal (env vars)
    GENIMG_V4_ADDRESS: GENAI_NFT_ADDRESSES[network] || null,  // ← aus shared
    LLMV1_ADDRESS: LLMV1_ADDRESSES[network] || null,          // ← aus shared
    USDC_ADDRESS: USDC_ADDRESSES[network],                    // ← aus shared
    USDC_NAME: USDC_NAMES[network],                           // ← aus shared
  };
}

// TOKEN_INFO kann dynamisch generiert werden
export function getTokenInfo(network, tokenAddress) {
  if (tokenAddress === USDC_ADDRESSES[network]) {
    return {
      address: tokenAddress,
      symbol: "USDC",
      name: USDC_NAMES[network],
      decimals: 6,
      version: "2",
    };
  }
  throw new Error(`Unsupported token: ${tokenAddress}`);
}
```

**Gelöschter Code:** ~60 Zeilen (hardcoded Adressen, TOKEN_INFO Objekt)

---

## Aktualisierter Implementierungsplan

| Phase | Was | Projekte | Status |
|-------|-----|----------|--------|
| **1a** | `@fretchen/chain-utils` erstellen | shared/ | 🔜 Next |
| **1b** | scw_js auf chain-utils migrieren | scw_js/ | ⬜ Geplant |
| **1c** | x402_facilitator auf chain-utils migrieren | x402_facilitator/ | ⬜ Geplant |
| **2** | GenImNFT-Komponenten migrieren | website/ | ⬜ Geplant |
| **3** | CollectorNFT-Komponenten migrieren | website/ | ⬜ Geplant |
| **4** | GenImNFTv4 auf Base deployen | eth/, shared/ | ⬜ Später |
| **5** | CollectorNFTv1 auf Base deployen | eth/, shared/ | ⬜ Später |

**Neue Reihenfolge-Begründung:**
- 1a → Shared package muss zuerst existieren
- 1b/1c → Backend-Projekte migrieren (einfacher, weniger UI-Abhängigkeiten)
- 2/3 → Frontend migrieren (komplexer, Tests nötig)
- 4/5 → Neue Deployments (profitieren von shared package)

---

## Betroffene Dateien

**Phase 1 (getChain.ts):**
- [utils/getChain.ts](utils/getChain.ts)
- [utils/nodeChainUtils.ts](utils/nodeChainUtils.ts)

**Phase 2-3 (Komponenten):**
- [components/NFTCard.tsx](components/NFTCard.tsx)
- [components/MyNFTList.tsx](components/MyNFTList.tsx)
- [components/SimpleCollectButton.tsx](components/SimpleCollectButton.tsx)
- [utils/nftLoader.ts](utils/nftLoader.ts)

---

## Nächste Schritte

1. ✅ Review Proposal
2. **Phase 1 starten**: getChain.ts auf CAIP-2 Pattern umstellen
3. GenImNFT-Komponenten migrieren
