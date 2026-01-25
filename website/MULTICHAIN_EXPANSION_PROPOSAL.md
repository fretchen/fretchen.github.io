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

**Prinzip:** 
- CAIP-2 `"eip155:10"` ist die Wahrheit
- wagmi/viem `chainId: number` wird nur an den Grenzen übersetzt

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
// Contract Adressen (CAIP-2 als Key - wie scw_js)
// ═══════════════════════════════════════════════════════════════

const GENAI_NFT_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:10": "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
  "eip155:11155420": "0x10827cC42a09D0BAD2d43134C69F0e776D853D85",
  // "eip155:8453": "0x...",  // Base - nach Deployment
};

const COLLECTOR_NFT_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:10": "0x584c40d8a7cA164933b5F90a2dC11ddCB4a924ea",
  // Nur Optimism (benötigt GenImNFT auf gleicher Chain)
};

const SUPPORT_V2_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:10": "0x4ca63f8A4Cd56287E854f53E18ca482D74391316",
  "eip155:8453": "0xB70EA4d714Fed01ce20E93F9033008BadA1c8694",
  "eip155:11155420": "0x9859431b682e861b19e87Db14a04944BC747AB6d",
  "eip155:84532": "0xaB44BE78499721b593a0f4BE2099b246e9C53B57",
};

// ═══════════════════════════════════════════════════════════════
// Config-Funktionen (nehmen CAIP-2, wie scw_js)
// ═══════════════════════════════════════════════════════════════

export function getGenAiNFTConfig(network: string) {
  const address = GENAI_NFT_ADDRESSES[network];
  if (!address) return null;
  return { address, abi: GenImNFTv3ABI, chainId: fromCAIP2(network) };
}

export function getCollectorNFTConfig(network: string) {
  const address = COLLECTOR_NFT_ADDRESSES[network];
  if (!address) return null;
  return { address, abi: CollectorNFTv1ABI, chainId: fromCAIP2(network) };
}

// ═══════════════════════════════════════════════════════════════
// Unterstützte Networks (CAIP-2 Arrays)
// ═══════════════════════════════════════════════════════════════

export const GENAI_NFT_NETWORKS = Object.keys(GENAI_NFT_ADDRESSES);
export const COLLECTOR_NFT_NETWORKS = Object.keys(COLLECTOR_NFT_ADDRESSES);
```

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
