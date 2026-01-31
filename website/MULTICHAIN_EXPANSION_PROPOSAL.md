# Multi-Chain Expansion Plan

> Migration von GenImNFT, CollectorNFT auf CAIP-2 Pattern mit shared `@fretchen/chain-utils` Package

## Aktueller Zustand

| Contract | Optimism | Base | Multi-Chain Ready |
|----------|:--------:|:----:|:-----------------:|
| **SupportV2** | ✅ | ✅ | ✅ Ja |
| **GenImNFTv4** | ✅ | ❌ | ✅ Ja (Backend ready) |
| **CollectorNFTv1** | ✅ | ❌ | ✅ Ja (Frontend ready) |
| **LLMv1** | ✅ | ❌ | ❌ (out of scope) |
| **EIP3009SplitterV1** | ✅ | ❌ | ✅ Ja |

---

## Implementierungsplan

| Phase | Was | Projekte | Status |
|-------|-----|----------|--------|
| **1a** | `@fretchen/chain-utils` erstellen | shared/ | ✅ Fertig |
| **1b** | scw_js auf chain-utils migrieren | scw_js/ | ✅ Fertig |
| **1c** | x402_facilitator auf chain-utils migrieren | x402_facilitator/ | ✅ Fertig |
| **2** | GenImNFT-Komponenten migrieren | website/ | ✅ Fertig |
| **3** | CollectorNFT-Komponenten migrieren | website/ | ✅ Fertig |
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
