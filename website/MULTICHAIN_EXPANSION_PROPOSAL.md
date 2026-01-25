# Multi-Chain Expansion Plan

> Migration von GenImNFT, CollectorNFT auf CAIP-2 Pattern mit shared `@fretchen/chain-utils` Package

## Aktueller Zustand

| Contract | Optimism | Base | Multi-Chain Ready |
|----------|:--------:|:----:|:-----------------:|
| **SupportV2** | ✅ | ✅ | ✅ Ja |
| **GenImNFTv4** | ✅ | ❌ | ❌ Nein |
| **CollectorNFTv1** | ✅ | ❌ | ❌ Nein |
| **LLMv1** | ✅ | ❌ | ❌ (out of scope) |

---

## Implementierungsplan

| Phase | Was | Projekte | Status |
|-------|-----|----------|--------|
| **1a** | `@fretchen/chain-utils` erstellen | shared/ | 🔜 Next |
| **1b** | scw_js auf chain-utils migrieren | scw_js/ | ⬜ |
| **1c** | x402_facilitator auf chain-utils migrieren | x402_facilitator/ | ⬜ |
| **2** | GenImNFT-Komponenten migrieren | website/ | ⬜ |
| **3** | CollectorNFT-Komponenten migrieren | website/ | ⬜ |
| **4** | GenImNFTv4 auf Base deployen | eth/, shared/ | ⬜ Später |
| **5** | CollectorNFTv1 auf Base deployen | eth/, shared/ | ⬜ Später |

---

## Phase 1a: @fretchen/chain-utils erstellen

**Struktur:**
```
fretchen.github.io/
├── shared/
│   └── chain-utils/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts      # Core utilities
│           └── addresses.ts  # Contract address maps
```

**package.json:**
```json
{
  "name": "@fretchen/chain-utils",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./addresses": { "types": "./dist/addresses.d.ts", "default": "./dist/addresses.js" }
  },
  "scripts": {
    "build": "tsc",
    "prepare": "npm run build"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "viem": "^2.0.0"
  }
}
```

**src/index.ts:**
```typescript
import { optimism, optimismSepolia, base, baseSepolia } from "viem/chains";
import type { Chain } from "viem";

// ═══════════════════════════════════════════════════════════════
// CAIP-2 Utilities
// ═══════════════════════════════════════════════════════════════

export const toCAIP2 = (chainId: number): string => `eip155:${chainId}`;

export const fromCAIP2 = (network: string): number => {
  const match = network.match(/^eip155:(\d+)$/);
  if (!match) throw new Error(`Invalid CAIP-2: ${network}`);
  return parseInt(match[1], 10);
};

export function getViemChain(network: string): Chain {
  switch (network) {
    case "eip155:10": return optimism;
    case "eip155:11155420": return optimismSepolia;
    case "eip155:8453": return base;
    case "eip155:84532": return baseSepolia;
    default: throw new Error(`Unsupported network: ${network}`);
  }
}

export * from "./addresses";
```

**src/addresses.ts:**
```typescript
// ═══════════════════════════════════════════════════════════════
// Contract Adressen (CAIP-2 als Key, getrennt nach Mainnet/Testnet)
// ═══════════════════════════════════════════════════════════════

// GenImNFT
export const MAINNET_GENAI_NFT_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:10": "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
  // "eip155:8453": "0x...",  // Base - nach Deployment
};

export const TESTNET_GENAI_NFT_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:11155420": "0x10827cC42a09D0BAD2d43134C69F0e776D853D85",
};

// CollectorNFT
export const MAINNET_COLLECTOR_NFT_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:10": "0x584c40d8a7cA164933b5F90a2dC11ddCB4a924ea",
};

export const TESTNET_COLLECTOR_NFT_ADDRESSES: Record<string, `0x${string}`> = {};

// SupportV2
export const MAINNET_SUPPORT_V2_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:10": "0x4ca63f8A4Cd56287E854f53E18ca482D74391316",
  "eip155:8453": "0xB70EA4d714Fed01ce20E93F9033008BadA1c8694",
};

export const TESTNET_SUPPORT_V2_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:11155420": "0x9859431b682e861b19e87Db14a04944BC747AB6d",
  "eip155:84532": "0xaB44BE78499721b593a0f4BE2099b246e9C53B57",
};

// USDC
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

**Konsumenten installieren via file: Link:**
```json
{
  "dependencies": {
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

## Phase 2: GenImNFT-Komponenten migrieren

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
import { getGenAiNFTConfig, GENAI_NFT_NETWORKS } from "@fretchen/chain-utils";

const network = useAutoNetwork(GENAI_NFT_NETWORKS);
const config = getGenAiNFTConfig(network);
const { data } = useReadContract({ ...config });
```

**useAutoNetwork Hook (website/hooks/):**
```typescript
export function useAutoNetwork(supportedNetworks: string[]): string {
  const { chain } = useAccount();
  if (chain) {
    const userNetwork = toCAIP2(chain.id);
    if (supportedNetworks.includes(userNetwork)) return userNetwork;
  }
  return supportedNetworks[0];  // Fallback: Optimism
}
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
4. Adresse in `@fretchen/chain-utils/src/addresses.ts` hinzufügen
5. `npm install` in allen Projekten

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

**Vorteile:**
- Neue Chains: Adresse nur an einer Stelle hinzufügen
- Konsistenz: Gleiches Pattern in website, scw_js, x402_facilitator
- Weniger Code: ~140 Zeilen duplizierter Switch-Statements entfernt
