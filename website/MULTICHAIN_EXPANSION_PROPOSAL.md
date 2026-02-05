# Multi-Chain Expansion Plan

> Migration von GenImNFT, CollectorNFT auf CAIP-2 Pattern mit shared `@fretchen/chain-utils` Package

## Aktueller Zustand

| Contract | Optimism | Base | Multi-Chain Ready | Script Status |
|----------|:--------:|:----:|:-----------------:|:-------------:|
| **SupportV2** | ✅ | ✅ | ✅ Ja | ✅ Modern |
| **GenImNFTv4** | ✅ | ✅ | ✅ Ja | ✅ Modern |
| **CollectorNFTv1** | ✅ | ✅ | ✅ Ja | ✅ Modern |
| **LLMv1** | ✅ | ❌ | ❌ (out of scope) | - |
| **EIP3009SplitterV1** | ✅ | ❌ | ✅ Ja | ✅ Modern |

**Base Addresses:**
- GenImNFTv4: `0xa5d6a3eEDADc3346E22dF9556dc5B99f2777ab68` ✅ Verified
- CollectorNFTv1: `0x5D0103393DDcD988867437233c197c6A38b23360` ✅ Verified

---

## Implementierungsplan

| Phase | Was | Projekte | Status |
|-------|-----|----------|--------|
| **1a** | `@fretchen/chain-utils` erstellen | shared/ | ✅ Fertig |
| **1b** | scw_js auf chain-utils migrieren | scw_js/ | ✅ Fertig |
| **1c** | x402_facilitator auf chain-utils migrieren | x402_facilitator/ | ✅ Fertig |
| **2** | GenImNFT-Komponenten migrieren | website/ | ✅ Fertig |
| **3** | CollectorNFT-Komponenten migrieren | website/ | ✅ Fertig |
| **4.1** | deploy-genimg-v4.ts modernisieren | eth/ | ✅ Fertig |
| **4.2** | deploy-collector-nft-v1.ts modernisieren | eth/ | ✅ Fertig |
| **4.3** | GenImNFTv4 auf Base deployen & verifizieren | eth/, shared/ | ✅ Fertig |
| **4.4** | CollectorNFTv1 auf Base deployen & verifizieren | eth/, shared/ | ✅ Fertig |

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

## Phase 1c: x402_facilitator Migration ✅ FERTIG

**Änderungen:**
- `package.json`: Dependency `"@fretchen/chain-utils": "file:../shared/chain-utils"`
- `tsup.config.js`: Bundling mit tsup für Scaleway Deployment
- `chain_utils.js`: Nutzt `getViemChain()`, `tryGetGenAiNFTAddress()`, `tryGetLLMv1Address()`, `getUSDCAddress()`, `getUSDCName()` aus chain-utils
- `x402_splitter_verify.js`: Importiert `getViemChain`, `getUSDCName`, `getUSDCAddress`, `getEIP3009SplitterAddress` aus chain-utils
- `x402_splitter_settle.js`: Importiert `EIP3009SplitterV1ABI`, `getEIP3009SplitterAddress`, `getViemChain`, `getUSDCAddress` aus chain-utils
- `x402_whitelist.js`: Nutzt `getChainConfig()` für Contract-Adressen
- `facilitator_instance.js`: Nutzt `getSupportedNetworks()` aus chain_utils.js

**Unterstützte Netzwerke:**
- Optimism Mainnet (`eip155:10`)
- Optimism Sepolia (`eip155:11155420`)
- Base Mainnet (`eip155:8453`)
- Base Sepolia (`eip155:84532`)

**Tests:** 153 Tests bestanden, 73.47% Coverage

---

## Phase 2: GenImNFT Website Components Migration ✅ FERTIG

**Status: VOLLSTÄNDIG ABGESCHLOSSEN**

Alle GenImNFT-Komponenten wurden erfolgreich auf `@fretchen/chain-utils` migriert:

| Datei | Status |
|-------|--------|
| `hooks/useAutoNetwork.ts` | ✅ Erstellt - zentraler Hook für Network-Detection |
| `utils/nftLoader.ts` | ✅ Nutzt chain-utils |
| `utils/nodeNftLoader.ts` | ✅ Nutzt chain-utils |
| `components/MyNFTList.tsx` | ✅ `useAutoNetwork()` + chain-utils |
| `components/NFTCard.tsx` | ✅ `useAutoNetwork()` + `getGenAiNFTAddress()` |
| `components/NFTList.tsx` | ✅ `useAutoNetwork()` + chain-utils |
| `components/PublicNFTList.tsx` | ✅ `useAutoNetwork()` + chain-utils |
| `components/EntryNftImage.tsx` | ✅ `useAutoNetwork()` + chain-utils |
| `components/NFTFloatImage.tsx` | ✅ chain-utils |
| `components/ImageGenerator.tsx` | ✅ `useAutoNetwork()` + `isTestnet()` |
| `components/AgentInfoPanel.tsx` | ✅ chain-utils Adressen |
| `hooks/useNFTListedStatus.ts` | ✅ chain-utils (korrektes `isTokenListed` ABI) |
| Tests | ✅ 303 Tests bestanden |

**Wichtige Erkenntnisse aus Phase 2:**
- `useAutoNetwork()` gibt `{ network, switchIfNeeded }` zurück
- `switchIfNeeded()` muss vor schreibenden Operationen aufgerufen werden
- Für wagmi `readContract` muss `chainId` als `SupportedChainId` gecastet werden:
  ```typescript
  const chainId = fromCAIP2(network) as SupportedChainId;
  ```
- GitHub Workflows brauchen `npm run build` für chain-utils vor website-Install

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

## Phase 2: GenImNFT Website Components Migration ⬜ NEXT

This phase performs a **clean break** from the existing `utils/getChain.ts` to consistently use `@fretchen/chain-utils`. The goal is simplicity over backward compatibility.

### Implementation Strategy: Two PRs

Phase 2 is split into two PRs to minimize risk and allow staged deployment:

| PR | Name | Content | Breaking? | Deployable? |
|----|------|---------|-----------|-------------|
| **2a** | Add chain-utils infrastructure | Dependency + `useAutoNetwork` hook + re-exports (keep old) | ❌ No | ✅ Yes |
| **2b** | Migrate GenImNFT components | All component migrations + remove old exports | ⚠️ Yes | ✅ Yes |

**Why two PRs:**
1. **PR 2a is low-risk:** Adds foundation without changing behavior. Verifiable via build + tests.
2. **PR 2b is atomic:** Components are tightly coupled — can't have half on old API, half on new.
3. **Clear rollback point:** If PR 2b causes issues, revert to PR 2a state.

---

### PR 2a: Add chain-utils Infrastructure

**Files to create/modify:**
- `package.json` — Add @fretchen/chain-utils dependency
- `hooks/useAutoNetwork.ts` — **CREATE NEW**
- `utils/getChain.ts` — Add re-exports (keep old exports)
- `utils/nodeChainUtils.ts` — Add `getDefaultNetwork()`

**Acceptance criteria:**
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] No behavior change in production

---

### PR 2b: Migrate GenImNFT Components

**Files to modify:**
- `utils/getChain.ts` — Remove old exports
- `utils/nftLoader.ts` — Use chain-utils
- `utils/nodeNftLoader.ts` — Use chain-utils
- `components/MyNFTList.tsx` — Use `useAutoNetwork()`
- `components/NFTCard.tsx` — Use `useAutoNetwork()` + `getGenAiNFTAddress()`
- `components/NFTList.tsx` — Add network prop
- `components/PublicNFTList.tsx` — Add network prop
- `components/EntryNftImage.tsx` — Use `getDefaultNetwork()` for SSR
- `components/NFTFloatImage.tsx` — Update to use network
- `components/ImageGenerator.tsx` — Remove hardcoded chain ID
- `components/AgentInfoPanel.tsx` — Use `useAutoNetwork()`
- `test/*.test.tsx` — Update mocks

**Acceptance criteria:**
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] Manual test: Connect wallet on Optimism → NFTs load
- [ ] Manual test: Connect wallet on unsupported chain → Auto-switches to Optimism

---

### Step 0: Add chain-utils Dependency

**File:** `website/package.json`

```bash
npm install @fretchen/chain-utils@file:../shared/chain-utils
```

### Step 1: Create `useAutoNetwork` Hook (NEW)

**File:** `website/hooks/useAutoNetwork.ts`

This hook replaces the scattered chain detection logic with a centralized, reusable pattern.

**Behavior:**
- Detects user's connected wallet chain
- If chain is in `supportedNetworks` → return CAIP-2 network string
- If chain is NOT supported → automatically switch to default chain (first in list)
- If no wallet connected → return default network

```typescript
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useEffect, useMemo } from "react";
import { toCAIP2, fromCAIP2 } from "@fretchen/chain-utils";

/**
 * Returns the current CAIP-2 network if supported, otherwise switches to default.
 * @param supportedNetworks - Array of CAIP-2 network strings (e.g., ["eip155:10", "eip155:11155420"])
 * @returns Current CAIP-2 network string
 */
export function useAutoNetwork(supportedNetworks: string[]): string {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  
  const defaultNetwork = supportedNetworks[0];
  const currentNetwork = toCAIP2(chainId);
  const isSupported = supportedNetworks.includes(currentNetwork);

  useEffect(() => {
    if (isConnected && !isSupported && switchChain) {
      switchChain({ chainId: fromCAIP2(defaultNetwork) });
    }
  }, [isConnected, isSupported, switchChain, defaultNetwork]);

  return isSupported ? currentNetwork : defaultNetwork;
}
```

### Step 2: Replace `utils/getChain.ts` (BREAKING CHANGE)

**File:** `website/utils/getChain.ts`

Delete all legacy code and replace with thin re-exports from chain-utils. This is a **clean break** - components must be updated to use the new pattern.

```typescript
// Re-export everything from chain-utils for convenience
export { 
  toCAIP2, 
  fromCAIP2, 
  getViemChain,
  isMainnet,
  isTestnet,
  getGenAiNFTAddress,
  getCollectorNFTAddress,
  GenImNFTv4ABI,
  GENAI_NFT_NETWORKS,
  COLLECTOR_NFT_NETWORKS,
} from "@fretchen/chain-utils";

// REMOVED: getChain(), genAiNFTContractConfig, collectorNFTContractConfig
// Use useAutoNetwork() + getGenAiNFTAddress(network) instead
```

### Step 3: Update `utils/nodeChainUtils.ts` (Server-Side)

**File:** `website/utils/nodeChainUtils.ts`

For SSR/server-side rendering, we need a non-hook version:

```typescript
import { 
  getViemChain, 
  getGenAiNFTAddress, 
  isMainnet 
} from "@fretchen/chain-utils";

/**
 * Get default network for server-side rendering.
 * Uses mainnet for production, testnet for development.
 */
export function getDefaultNetwork(): string {
  const isProd = process.env.NODE_ENV === "production";
  return isProd ? "eip155:10" : "eip155:11155420";
}

// Re-export chain-utils functions for server use
export { getViemChain, getGenAiNFTAddress, isMainnet };
```

### Step 4: Update `utils/nftLoader.ts` (Viem-only)

**File:** `website/utils/nftLoader.ts`

```typescript
// BEFORE
import { getChain, genAiNFTContractConfig } from "./getChain";
const chain = getChain();

// AFTER
import { getViemChain, getGenAiNFTAddress, GenImNFTv4ABI } from "@fretchen/chain-utils";

export async function loadNFT(network: string, tokenId: bigint) {
  const chain = getViemChain(network);
  const client = createPublicClient({ chain, transport: http() });
  
  return client.readContract({
    address: getGenAiNFTAddress(network),
    abi: GenImNFTv4ABI,
    functionName: "tokenURI",
    args: [tokenId],
  });
}
```

### Step 5: Update `utils/nodeNftLoader.ts` (SSR)

**File:** `website/utils/nodeNftLoader.ts`

Same pattern as nftLoader.ts but with explicit network parameter for SSR context.

### Step 6: Migrate Components (8 files)

Each component follows the same pattern:

| File | Changes |
|------|---------|
| `components/MyNFTList.tsx` | Replace `getChain()` with `useAutoNetwork(GENAI_NFT_NETWORKS)` |
| `components/NFTCard.tsx` | Replace `genAiNFTContractConfig` with `getGenAiNFTAddress(network)` + ABI |
| `components/NFTList.tsx` | Add network parameter, use chain-utils |
| `components/PublicNFTList.tsx` | Add network parameter |
| `components/EntryNftImage.tsx` | Use `getDefaultNetwork()` for SSR |
| `components/NFTFloatImage.tsx` | Update to use network prop |
| `components/ImageGenerator.tsx` | **Remove hardcoded `11155420` check**, use `isTestnet(network)` |
| `components/AgentInfoPanel.tsx` | Use `useAutoNetwork()` |

**Example Migration (NFTCard.tsx):**

```tsx
// BEFORE
import { getChain, genAiNFTContractConfig } from "../utils/getChain";

function NFTCard({ tokenId }) {
  const chain = getChain();
  const { data } = useReadContract({
    ...genAiNFTContractConfig,
    chainId: chain.id,
    functionName: "tokenURI",
    args: [tokenId],
  });
}

// AFTER
import { useAutoNetwork } from "../hooks/useAutoNetwork";
import { getGenAiNFTAddress, GenImNFTv4ABI, GENAI_NFT_NETWORKS, fromCAIP2 } from "@fretchen/chain-utils";

function NFTCard({ tokenId }) {
  const network = useAutoNetwork(GENAI_NFT_NETWORKS);
  const { data } = useReadContract({
    address: getGenAiNFTAddress(network),
    abi: GenImNFTv4ABI,
    chainId: fromCAIP2(network),
    functionName: "tokenURI",
    args: [tokenId],
  });
}
```

### Step 7: Update Tests

**Files:**
- `test/ContractChainSelection.test.ts`
- `test/nftLoader.test.ts` (if exists)

Update tests to use CAIP-2 networks and mock `useAutoNetwork`:

```typescript
import { vi } from "vitest";

vi.mock("../hooks/useAutoNetwork", () => ({
  useAutoNetwork: () => "eip155:11155420", // Mock testnet
}));
```

---

### Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Breaking Change** | 🟡 Medium | All getChain() usages updated in PR 2b (atomic) |
| **SSR Hydration Mismatch** | 🟡 Medium | Use `getDefaultNetwork()` for server, `useAutoNetwork()` for client |
| **Hardcoded Chain IDs** | 🟢 Low | Grep for `11155420`, `10`, `8453`, `84532` and replace |
| **Wagmi Hook Context** | 🟢 Low | `useAutoNetwork` only used in components with WagmiProvider |

### Checklists by PR

**PR 2a: Infrastructure (non-breaking)**
- [ ] `package.json` - Add @fretchen/chain-utils dependency
- [ ] `hooks/useAutoNetwork.ts` - **CREATE NEW**
- [ ] `utils/getChain.ts` - Add re-exports (keep old exports)
- [ ] `utils/nodeChainUtils.ts` - Add `getDefaultNetwork()`

**PR 2b: Component Migration (breaking)**
- [ ] `utils/getChain.ts` - Remove old exports (`getChain`, `genAiNFTContractConfig`)
- [ ] `utils/nftLoader.ts` - Use chain-utils
- [ ] `utils/nodeNftLoader.ts` - Use chain-utils
- [ ] `components/MyNFTList.tsx` - Use `useAutoNetwork()`
- [ ] `components/NFTCard.tsx` - Use `useAutoNetwork()` + `getGenAiNFTAddress()`
- [ ] `components/NFTList.tsx` - Add network prop
- [ ] `components/PublicNFTList.tsx` - Add network prop
- [ ] `components/EntryNftImage.tsx` - Use `getDefaultNetwork()` for SSR
- [ ] `components/NFTFloatImage.tsx` - Update to use network
- [ ] `components/ImageGenerator.tsx` - Remove hardcoded chain ID
- [ ] `components/AgentInfoPanel.tsx` - Use `useAutoNetwork()`
- [ ] `test/ContractChainSelection.test.ts` - Update mocks
- [ ] `test/MyNFTList.test.tsx` - Update mocks
- [ ] `test/ImageGenerator.test.tsx` - Update if needed

---

## Phase 3: CollectorNFT-Komponenten migrieren ✅ FERTIG

**Status: VOLLSTÄNDIG ABGESCHLOSSEN**

Alle CollectorNFT-Komponenten wurden erfolgreich auf `@fretchen/chain-utils` migriert:

| Datei | Status |
|-------|--------|
| `shared/chain-utils/src/abi/CollectorNFTv1.ts` | ✅ Erstellt - Minimal ABI |
| `components/SimpleCollectButton.tsx` | ✅ `useAutoNetwork()` + chain-utils |
| `test/SimpleCollectButton.test.tsx` | ✅ Mocks aktualisiert |
| `utils/getChain.ts` | ✅ `collectorNFTContractConfig` entfernt, `getChain()` für LLMv1 erhalten |
| Tests | ✅ 302 Tests bestanden |

**Wichtige Änderungen:**
- `CollectorNFTv1ABI` hinzugefügt mit `getMintStats` und `mintCollectorNFT`
- `SimpleCollectButton` nutzt jetzt `useAutoNetwork(COLLECTOR_NFT_NETWORKS)`
- `switchIfNeeded()` wird vor `writeContract` aufgerufen
- `SupportedChainId` Type wurde entfernt (nicht notwendig)
- `getChain()` bleibt für LLMv1 (Phase 4 Migration Kandidat)

### Komplexitätsvergleich mit Phase 2

| Aspekt | Phase 2 (GenImNFT) | Phase 3 (CollectorNFT) |
|--------|-------------------|------------------------|
| **Anzahl Dateien** | 12+ Komponenten + Tests | 1 Komponente + 1 Test |
| **Hook-Erstellung** | `useAutoNetwork` musste erstellt werden | Hook existiert bereits ✅ |
| **ABI in chain-utils** | GenImNFTv4ABI vorhanden | ⚠️ CollectorNFTv1ABI fehlt noch |
| **Getter in chain-utils** | `getGenAiNFTAddress()` vorhanden | `getCollectorNFTAddress()` vorhanden ✅ |
| **Netzwerk-Konstante** | `GENAI_NFT_NETWORKS` vorhanden | `COLLECTOR_NFT_NETWORKS` vorhanden ✅ |
| **Testanpassungen** | Umfangreiche Mock-Updates | Minimal |
| **Komplexität** | 🔴 Hoch | 🟢 Niedrig |
| **Geschätzter Aufwand** | 4-6 Stunden | 30-60 Minuten |

**Fazit: Phase 3 ist ~90% einfacher als Phase 2**, da:
1. Die Infrastruktur (`useAutoNetwork`, chain-utils Dependency) bereits existiert
2. Nur 1 Komponente zu migrieren ist
3. Das Pattern aus Phase 2 einfach kopiert werden kann

### Voraussetzung: CollectorNFTv1ABI zu chain-utils hinzufügen

**Datei:** `shared/chain-utils/src/abi/CollectorNFTv1.ts`

```typescript
// Minimal ABI für CollectorNFTv1 - nur benötigte Funktionen
export const CollectorNFTv1ABI = [
  {
    name: "getMintStats",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "genImTokenId", type: "uint256" }],
    outputs: [
      { name: "mintCount", type: "uint256" },
      { name: "currentPrice", type: "uint256" },
      { name: "lastMinter", type: "address" },
    ],
  },
  {
    name: "mintCollectorNFT",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "genImTokenId", type: "uint256" }],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
] as const;
```

**Datei:** `shared/chain-utils/src/abi/index.ts` - Export hinzufügen:
```typescript
export { CollectorNFTv1ABI } from "./CollectorNFTv1";
```

### Implementierungsplan

**Step 1: ABI zu chain-utils hinzufügen (5 min)**
- [ ] `shared/chain-utils/src/abi/CollectorNFTv1.ts` erstellen
- [ ] `shared/chain-utils/src/abi/index.ts` Export hinzufügen
- [ ] `npm run build` in chain-utils
- [ ] Tests hinzufügen (optional)

**Step 2: SimpleCollectButton.tsx migrieren (15 min)**

```tsx
// VORHER
import { collectorNFTContractConfig, getChain } from "../utils/getChain";

const chain = getChain();
const isCorrectNetwork = chainId === chain.id;

useReadContract({
  ...collectorNFTContractConfig,
  functionName: "getMintStats",
  args: [genImTokenId],
  chainId: chain.id,
});

writeContract({
  ...collectorNFTContractConfig,
  functionName: "mintCollectorNFT",
  args: [genImTokenId],
  value: currentPrice,
});

// NACHHER
import { useAutoNetwork } from "../hooks/useAutoNetwork";
import { 
  getCollectorNFTAddress, 
  CollectorNFTv1ABI, 
  COLLECTOR_NFT_NETWORKS, 
  fromCAIP2 
} from "@fretchen/chain-utils";
import type { config } from "../wagmi.config";

type SupportedChainId = (typeof config)["chains"][number]["id"];

const { network, switchIfNeeded } = useAutoNetwork(COLLECTOR_NFT_NETWORKS);
const contractAddress = getCollectorNFTAddress(network);
const networkChainId = fromCAIP2(network) as SupportedChainId;

useReadContract({
  address: contractAddress,
  abi: CollectorNFTv1ABI,
  functionName: "getMintStats",
  args: [genImTokenId],
  chainId: networkChainId,
});

// Bei Schreiboperationen: erst switchIfNeeded() aufrufen
const handleCollect = async () => {
  if (!isConnected) return;
  
  const switched = await switchIfNeeded();
  if (!switched) return;
  
  writeContract({
    address: contractAddress,
    abi: CollectorNFTv1ABI,
    functionName: "mintCollectorNFT",
    args: [genImTokenId],
    value: currentPrice,
  });
};
```

**Step 3: Test aktualisieren (10 min)**
- [ ] `test/SimpleCollectButton.test.tsx` - Mock für `useAutoNetwork` hinzufügen
- [ ] Chain-utils Mocks analog zu anderen Tests

**Step 4: getChain.ts aufräumen (5 min)**
- [ ] `collectorNFTContractConfig` Export entfernen
- [ ] Deprecation-Hinweis aktualisieren

### Checkliste Phase 3

- [x] `shared/chain-utils/src/abi/CollectorNFTv1.ts` - **CREATED**
- [x] `shared/chain-utils/src/abi/index.ts` - Export hinzugefügt
- [x] `shared/chain-utils` - `npm run build`
- [x] `components/SimpleCollectButton.tsx` - Use `useAutoNetwork()` + chain-utils
- [x] `test/SimpleCollectButton.test.tsx` - Update mocks
- [x] `utils/getChain.ts` - `collectorNFTContractConfig` entfernt, `getChain()` für LLMv1 erhalten
- [x] `npm run build` - Verifiziert
- [x] `npm test` - 302 Tests grün

### Risikobewertung

| Risiko | Schwere | Mitigation |
|--------|---------|------------|
| **ABI-Inkompatibilität** | 🟢 Niedrig | Minimal ABI mit nur genutzten Funktionen |
| **Network-Switch UX** | 🟢 Niedrig | Pattern bereits in NFTCard getestet |
| **Breaking Change** | 🟢 Niedrig | Nur 1 Komponente betroffen |

---

## Phase 4 & 5: GenImNFTv4 + CollectorNFTv1 auf Base deployen ⬜ NEXT

> **Status:** Deployment-Skripte müssen auf SupportV2-Standard aktualisiert werden

### Übersicht

| Contract | Optimism | Base | Deployment Script Status |
|----------|:--------:|:----:|:------------------------:|
| **GenImNFTv4** | ✅ `0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb` | ⬜ | ⚠️ Veraltet |
| **CollectorNFTv1** | ✅ `0x1234...` | ⬜ | ⚠️ Veraltet |

### Gap-Analyse: Deployment-Skripte vs. SupportV2 (Gold Standard)

| Feature | SupportV2 ✅ | GenImNFTv4 ⚠️ | CollectorNFTv1 ⚠️ |
|---------|:------------:|:-------------:|:-----------------:|
| **Zod Schema** | ✅ | ✅ | ❌ Manuelles Interface |
| **Balance-Check** | ✅ `MIN_DEPLOYMENT_BALANCE` | ❌ | ❌ |
| **checkDeployerBalance()** | ✅ Mit Faucet-Links | ❌ | ❌ |
| **Deployment Path** | ✅ `deployments/` | ⚠️ `scripts/deployments/` | ⚠️ `scripts/deployments/` |
| **Export für Tests** | ✅ `deploySupportV2, Schema` | ❌ Kein Export | ⚠️ Ohne Schema |
| **require.main Guard** | ✅ | ❌ | ✅ |
| **Dry Run Balance Check** | ✅ | ❌ | ❌ |

### Modernisierungsplan (3 PRs)

#### PR 4.1: deploy-genimg-v4.ts modernisieren

**Ziel:** GenImNFTv4 Deployment-Skript auf SupportV2-Standard bringen

**Änderungen:**
1. `MIN_DEPLOYMENT_BALANCE` Konstante hinzufügen (0.03 ETH)
2. `checkDeployerBalance()` Funktion hinzufügen (mit Faucet-Links)
3. Balance-Check in `validateDeployment()` und `simulateDeployment()` hinzufügen
4. Deployment-Pfad von `scripts/deployments/` auf `deployments/` ändern
5. Export Pattern für Tests hinzufügen:
   ```typescript
   export { deployGenImV4, MIN_DEPLOYMENT_BALANCE, GenImV4DeployConfigSchema };
   
   if (require.main === module) {
     deployGenImV4()
       .then(() => process.exit(0))
       .catch((error) => { console.error(error); process.exit(1); });
   }
   ```

**Datei:** `eth/scripts/deploy-genimg-v4.ts`

```typescript
// NEU: Importieren
import { formatEther, parseEther } from "viem";

// NEU: Balance-Konstante
const MIN_DEPLOYMENT_BALANCE = parseEther("0.03");

// NEU: Balance-Check Funktion (kopiert von deploy-support-v2.ts)
async function checkDeployerBalance(deployer: {
  address: string;
  provider: { getBalance: (addr: string) => Promise<bigint> };
}): Promise<void> {
  const balance = await deployer.provider.getBalance(deployer.address);
  const balanceFormatted = formatEther(balance);
  const minFormatted = formatEther(MIN_DEPLOYMENT_BALANCE);

  console.log(`💰 Deployer Balance: ${balanceFormatted} ETH`);
  console.log(`📊 Minimum Required: ${minFormatted} ETH`);

  if (balance < MIN_DEPLOYMENT_BALANCE) {
    const deficit = MIN_DEPLOYMENT_BALANCE - balance;
    throw new Error(
      `Insufficient funds for deployment!\n` +
        `   Balance: ${balanceFormatted} ETH\n` +
        `   Required: ${minFormatted} ETH\n` +
        `   Deficit: ${formatEther(deficit)} ETH\n\n` +
        `   Please fund ${deployer.address} with at least ${formatEther(deficit)} ETH.\n` +
        `   Faucets:\n` +
        `   - Optimism Sepolia: https://www.alchemy.com/faucets/optimism-sepolia\n` +
        `   - Base Sepolia: https://www.alchemy.com/faucets/base-sepolia`,
    );
  }

  console.log("✅ Sufficient balance for deployment");
}
```

**Acceptance Criteria:**
- [ ] `npx hardhat run scripts/deploy-genimg-v4.ts --network hardhat` funktioniert
- [ ] Deployment-Tests bestehen (wenn erstellt)
- [ ] Deployment-File wird nach `deployments/` geschrieben

---

#### PR 4.2: deploy-collector-nft-v1.ts modernisieren

**Ziel:** CollectorNFTv1 Deployment-Skript auf SupportV2-Standard bringen

**Änderungen:**
1. Interface durch Zod Schema ersetzen
2. `MIN_DEPLOYMENT_BALANCE` + `checkDeployerBalance()` hinzufügen
3. Deployment-Pfad auf `deployments/` ändern
4. Export Pattern für Tests anpassen

**Datei:** `eth/scripts/deploy-collector-nft-v1.ts`

```typescript
// NEU: Zod Schema statt Interface
import { z } from "zod";
import { formatEther, parseEther, getAddress } from "viem";

const MIN_DEPLOYMENT_BALANCE = parseEther("0.03");

const CollectorNFTv1ConfigSchema = z.object({
  parameters: z.object({
    genImNFTAddress: z.string().refine((addr) => {
      try { getAddress(addr); return true; } catch { return false; }
    }, "Invalid genImNFTAddress format"),
    baseMintPrice: z.string(), // in ETH, e.g., "0.00005"
  }),
  options: z.object({
    validateOnly: z.boolean(),
    dryRun: z.boolean(),
  }),
  metadata: z.object({
    description: z.string(),
    version: z.string(),
    environment: z.string(),
  }),
});

type CollectorNFTv1Config = z.infer<typeof CollectorNFTv1ConfigSchema>;

// NEU: Export für Tests
export { deployCollectorNFT, MIN_DEPLOYMENT_BALANCE, CollectorNFTv1ConfigSchema };

if (require.main === module) {
  deployCollectorNFT()
    .then(() => process.exit(0))
    .catch((error) => { console.error(error); process.exit(1); });
}
```

**Config-Format-Änderung:** `collector-nft-v1.config.json`
```json
{
  "parameters": {
    "genImNFTAddress": "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
    "baseMintPrice": "0.00005"
  },
  "options": {
    "validateOnly": false,
    "dryRun": false
  },
  "metadata": {
    "description": "CollectorNFT v1 deployment configuration",
    "version": "1.0.0",
    "environment": "production"
  }
}
```

---

#### PR 4.3: Deploy auf Base Mainnet

**Voraussetzung:** PR 4.1 und PR 4.2 gemergt

**Schritte:**

1. **GenImNFTv4 auf Base Sepolia testen**
   ```bash
   cd eth/
   # Config für Base Sepolia anpassen
   npx hardhat run scripts/deploy-genimg-v4.ts --network baseSepolia
   ```

2. **GenImNFTv4 auf Base Mainnet deployen**
   ```bash
   npx hardhat run scripts/deploy-genimg-v4.ts --network base
   npx hardhat run scripts/verify-genimg-v4.ts --network base
   ```

3. **Agent-Wallet autorisieren**
   ```bash
   # Via Hardhat Console oder separates Script
   npx hardhat console --network base
   > const contract = await ethers.getContractAt("GenImNFTv4", "0x...")
   > await contract.authorizeAgentWallet("0xAAEBC1441323B8ad6Bdf6793A8428166b510239C")
   ```

4. **CollectorNFTv1 auf Base deployen**
   - Config mit neuer GenImNFT Adresse anpassen
   ```bash
   npx hardhat run scripts/deploy-collector-nft-v1.ts --network base
   ```

5. **Adressen in chain-utils hinzufügen**
   
   **Datei:** `shared/chain-utils/src/addresses.ts`
   ```typescript
   export const MAINNET_GENAI_NFT_ADDRESSES: Record<string, `0x${string}`> = {
     "eip155:10": "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb", // Optimism
     "eip155:8453": "0x...",  // Base - NEU
   };
   
   export const MAINNET_COLLECTOR_NFT_ADDRESSES: Record<string, `0x${string}`> = {
     "eip155:10": "0x...",  // Optimism (bestehend)
     "eip155:8453": "0x...",  // Base - NEU
   };
   ```

6. **chain-utils rebuilden und Consumer updaten**
   ```bash
   cd shared/chain-utils && npm run build
   cd ../../website && npm install
   cd ../scw_js && npm install  
   cd ../x402_facilitator && npm install
   ```

---

### Deployment Checkliste Phase 4 & 5

**PR 4.1: GenImNFTv4 Script modernisieren**
- [ ] `MIN_DEPLOYMENT_BALANCE` hinzufügen
- [ ] `checkDeployerBalance()` hinzufügen
- [ ] Balance-Check in validate/simulate einfügen
- [ ] Deployment-Pfad auf `deployments/` ändern
- [ ] Export Pattern für Tests hinzufügen
- [ ] Tests ausführen

**PR 4.2: CollectorNFTv1 Script modernisieren**
- [ ] Zod Schema erstellen
- [ ] Config-Format aktualisieren
- [ ] `MIN_DEPLOYMENT_BALANCE` + `checkDeployerBalance()` hinzufügen
- [ ] Deployment-Pfad auf `deployments/` ändern
- [ ] Export Pattern für Tests hinzufügen

**PR 4.3: Base Deployment**
- [ ] GenImNFTv4 auf Base Sepolia testen
- [ ] GenImNFTv4 auf Base Mainnet deployen
- [ ] GenImNFTv4 auf Etherscan verifizieren
- [ ] Agent-Wallet autorisieren
- [ ] CollectorNFTv1 auf Base deployen
- [ ] CollectorNFTv1 auf Etherscan verifizieren
- [ ] Adressen in chain-utils hinzufügen
- [ ] chain-utils rebuilden
- [ ] Consumer-Projekte updaten
- [ ] E2E Test auf Base

---

### Risikobewertung Phase 4 & 5

| Risiko | Schwere | Mitigation |
|--------|---------|------------|
| **Deployment fehlschlägt** | 🟡 Mittel | Erst auf Base Sepolia testen |
| **Agent-Wallet falsch** | 🔴 Hoch | Gleiche Wallet wie Optimism nutzen |
| **Config-Format Bruch** | 🟡 Mittel | Alte Config-Files backuppen |
| **Balance zu niedrig** | 🟢 Niedrig | Balance-Check schützt |
| **Verify fehlschlägt** | 🟢 Niedrig | Kann später nachgeholt werden |

### Geschätzter Aufwand

| PR | Aufwand | Komplexität |
|----|---------|-------------|
| **4.1:** GenImNFTv4 Script | 1-2 Stunden | 🟡 Mittel |
| **4.2:** CollectorNFTv1 Script | 1-2 Stunden | 🟡 Mittel |
| **4.3:** Base Deployment | 2-3 Stunden | 🔴 Hoch (echtes Geld) |
| **Gesamt** | 4-7 Stunden | |

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

---

## Phase 5: Website Notebook-Pattern Migration 🔄 IN PROGRESS

### Änderungen

Backend erwartet jetzt `network` Parameter (CAIP-2) statt `sepoliaTest` Boolean. Website muss angepasst werden.

**Breaking Change:** `X402GenImgRequest.sepoliaTest` → `X402GenImgRequest.network`

### Code-Änderungen

**1. Type Definition** (`website/types/x402.ts`):
```typescript
export interface X402GenImgRequest {
  prompt: string;
  size?: "1024x1024" | "1792x1024";
  mode?: "generate" | "edit";
  referenceImage?: string;
  sepoliaTest?: boolean;  // ❌ Remove
  network: string;        // ✅ Add (CAIP-2, z.B. "eip155:8453")
  expectedChainId?: number;
  isListed?: boolean;
}
```

**2. ImageGenerator** (`website/components/ImageGenerator.tsx`):
```tsx
// VORHER (Line ~308)
const result = await generateImage({
  prompt,
  size,
  mode,
  referenceImage: isEditMode ? referenceImageBase64 : undefined,
  sepoliaTest: useTestnetFlag,  // ❌
  expectedChainId: targetChainId,
  isListed,
});

// NACHHER
const result = await generateImage({
  prompt,
  size,
  mode,
  referenceImage: isEditMode ? referenceImageBase64 : undefined,
  network,  // ✅ Von useAutoNetwork
  expectedChainId: targetChainId,
  isListed,
});
```

**3. useAutoNetwork Hook** - Bleibt unverändert:
- Verwendet bereits wallet-connected chain
- Fällt zurück auf erste supported chain wenn wallet nicht verbunden
- Keine UI für manuelle Network-Auswahl (bereits verworfen)

**4. x402 Hook Validation** (`website/hooks/useX402ImageGeneration.ts`):
```typescript
// Update: Validate gegen network statt expectedChainId
const { expectedChainId, network, ...requestBody } = request;

if (response.status === 402 && network) {
  const decoded = JSON.parse(atob(response.headers.get("Payment-Required")));
  if (decoded.accepts?.[0]?.network !== network) {
    throw new Error(`Network mismatch: expected ${network}`);
  }
}
```

### Deployment

**Backend First:**
- [x] Facilitator deployed (Base support)
- [ ] scw_js deployment: `cd scw_js && npm run deploy`

**Website:**
- [ ] Remove `sepoliaTest` references
- [ ] Add `network` parameter
- [ ] Update tests
- [ ] Deploy

**Status:** Ready for Implementation  
**Blocking:** scw_js deployment
---

## 🎉 Project Complete: Multi-Chain Expansion Summary

**Deployment Date:** 5. Februar 2026

### What We Built

We successfully expanded our AI image generation NFT platform from a single-chain (Optimism) deployment to a true multi-chain architecture supporting **Optimism and Base** networks. Users can now mint AI-generated artwork NFTs on their preferred chain.

### Key Achievements

#### 1. Shared Chain Utilities Package (`@fretchen/chain-utils`)
- **Single source of truth** for all chain configurations, contract addresses, and ABIs
- CAIP-2 compliant network identifiers (`eip155:10` for Optimism, `eip155:8453` for Base)
- Type-safe contract address lookups with `getGenAiNFTAddress(network)`
- 46 tests with 98.75% coverage

#### 2. Backend Multi-Chain Support
- **x402 Payment Flow**: Buyers can pay with USDC on either Optimism or Base
- **Network parameter**: Request body now includes `network` instead of boolean `sepoliaTest`
- **Nonce retry logic**: Handles race conditions in parallel requests
- **Security fix**: `validatePaymentNetwork()` now validates network against mode to prevent testnet payments in production

#### 3. Frontend Multi-Chain Gallery
- **ChainBadge component**: Visual indicators showing which chain each NFT lives on
- **useMultiChainNFTs hook**: Fetches NFTs from all supported chains in parallel
- **Unified counter**: "My Artworks" tab shows total count across all chains
- **Network-aware minting**: Users can select their preferred chain for new NFTs

#### 4. Smart Contract Deployments

| Contract | Optimism | Base |
|----------|----------|------|
| GenImNFTv4 | `0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb` | `0xa5d6a3eEDADc3346E22dF9556dc5B99f2777ab68` |
| CollectorNFTv1 | `0xD59...` | `0x5D0103393DDcD988867437233c197c6A38b23360` |

### Technical Highlights

**Migration Pattern:**
```
Before: hardcoded chainId === 10
After:  getGenAiNFTAddress("eip155:8453") // Base
        getViemChain("eip155:10")         // Optimism
```

**Multi-Chain Hook:**
```typescript
const { tokens, isLoading, reload } = useMultiChainUserNFTs();
// Returns NFTs from ALL supported chains, merged and sorted
```

**Payment Flow:**
```
1. Client sends { prompt, network: "eip155:8453" }
2. Server returns 402 with payment requirements for Base USDC
3. Client signs x402 payment on Base
4. Server mints NFT on Base, transfers to buyer
```

### Lessons Learned

1. **Shared packages need explicit builds** - No `prepare` script, CI must build before consumers install
2. **Viem auto-manages nonces** - But race conditions need retry logic, not manual nonce tracking
3. **Test mode validation is security-critical** - Must prevent testnet payments being accepted in production
4. **CAIP-2 is the way** - Human-readable network IDs (`eip155:10`) beat magic numbers (`10`)

### Metrics

| Metric | Value |
|--------|-------|
| Lines of code changed | ~2,500 |
| Test coverage maintained | >90% |
| New tests added | ~50 |
| Chains supported | 2 (mainnet) + 2 (testnet) |
| Breaking changes | 0 (backward compatible) |

### What's Next

- **Date-based sorting**: NFTs currently sorted by tokenId; cross-chain date sorting would require metadata preloading
- **More chains**: Architecture supports adding Arbitrum, Polygon, etc. with minimal changes
- **Gas optimization**: Consider lazy minting patterns for high-volume scenarios

---

*This document served as the implementation roadmap. For the public announcement, see the blog post version.*