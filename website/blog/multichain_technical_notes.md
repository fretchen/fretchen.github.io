---
title: "Multi-Chain Architecture: Technical Notes"
publishing_date: 2026-02-05
category: "webdev"
tokenID: 189
secondaryCategory: "blockchain"
description: "Technical summary of implementing multi-chain support for an NFT minting application. Notes on architecture, testing patterns, and lessons learned."
---

This document summarizes the technical changes required to expand a single-chain NFT minting application (Optimism) to support multiple chains (Optimism + Base). Written as reference notes for future projects and interested developers.

## Motivation

1. **User reach**: Base has significantly higher transaction volume (~15x Optimism), primarily due to Coinbase wallet integration
2. **ERC-8004 preparation**: Base testnets have active reference implementations for agent authorization patterns

## Architecture Overview

### Before: Hardcoded Chain

```typescript
// Scattered across codebase
const chainId = 10;
const contractAddress = "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb";
```

### After: CAIP-2 Network Identifiers

```typescript
// Centralized in @fretchen/chain-utils
const network = "eip155:8453"; // CAIP-2 format
const address = getGenAiNFTAddress(network);
const chain = getViemChain(network);
```

**Why CAIP-2?**
- Human-readable (`eip155:10` vs `10`)
- Standard across wallets, indexers, block explorers
- Type-safe with TypeScript (can't accidentally pass chainId where network expected)

## Project Structure

```
monorepo/
├── shared/
│   └── chain-utils/          # Shared package (single source of truth)
│       ├── src/
│       │   ├── index.ts      # CAIP-2 utilities, chain mapping
│       │   ├── addresses.ts  # Contract addresses per network
│       │   └── abi/          # Contract ABIs
│       └── test/
├── scw_js/                   # Backend (Scaleway Functions)
├── x402_facilitator/         # Payment facilitator
└── website/                  # Frontend (Vike + React)
```

## Key Changes by Component

### 1. Shared Package: `@fretchen/chain-utils`

**Exports:**
- `toCAIP2(chainId)` / `fromCAIP2(network)` - conversion utilities
- `getViemChain(network)` - returns viem Chain object
- `getGenAiNFTAddress(network)` - contract address lookup
- `getUSDCConfig(network)` - USDC address, decimals, EIP-712 domain
- `GENAI_NFT_NETWORKS` - list of supported networks
- Contract ABIs

**Critical detail:** No `prepare` script. CI must explicitly build before consumers install:
```yaml
- run: cd shared/chain-utils && npm ci && npm run build
- run: cd website && npm ci  # Now chain-utils is built
```

### 2. Backend: Network Parameter

```javascript
// Before
const sepoliaTest = body.sepoliaTest; // boolean

// After
const network = body.network; // "eip155:10" | "eip155:8453" | ...
```

**Security consideration:** Added `validatePaymentNetwork(network, isTestMode)` to prevent testnet payments being accepted in production. This was a real bug found by tests.

### 3. Frontend: Multi-Chain Hooks

**New hook: `useMultiChainNFTs`**
```typescript
const { tokens, isLoading, reload } = useMultiChainUserNFTs();
// Returns NFTs from ALL supported chains, merged
```

**New component: `ChainBadge`**
```typescript
<ChainBadge network="eip155:8453" /> // Renders "Base" badge
```

**Counter fix:** "My Artworks (N)" now shows total across all chains, not just current wallet chain.

### 4. Payment Flow: x402 Protocol

```
1. Client: POST /genimg { prompt, network: "eip155:8453" }
2. Server: 402 Payment Required (Base USDC requirements)
3. Client: Signs EIP-3009 authorization for Base USDC
4. Server: Verifies, mints NFT on Base, transfers to client
```

The `network` parameter flows through the entire stack:
- Frontend → Backend → Payment Facilitator → Smart Contract

## Testing Architecture (Key Learning)

The most significant improvement was **splitting tests into two categories**:

### Functional Tests (`*_Functional.ts`)

- **Purpose:** Test contract logic in isolation
- **Stack:** Viem only (no ethers, no OpenZeppelin plugins)
- **Speed:** Fast (~50ms per test)
- **Example:** Does `safeMint` emit correct events? Does `transferFrom` check ownership?

```typescript
// Functional test: Pure contract behavior
it("should emit Transfer event on mint", async () => {
  const hash = await contract.write.safeMint([uri, true], { value: mintPrice });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  expect(receipt.logs).toContainEqual(/* Transfer event */);
});
```

### Deployment Tests (`*_Deployment.ts`)

- **Purpose:** Test deployment scripts and upgrade paths
- **Stack:** Ethers + OpenZeppelin Upgrades Plugin
- **Speed:** Slower (~500ms per test)
- **Example:** Does the deployment script handle missing config? Does upgrade preserve storage?

```typescript
// Deployment test: Script behavior
it("should fail gracefully with invalid config", async () => {
  const config = createTempConfig({ validateOnly: true, dryRun: false });
  config.proxyAddress = "invalid";
  await expect(deployFunction()).rejects.toThrow("Invalid proxy address");
});
```

**Why this matters:**
- Functional tests are 10x faster → run on every save
- Deployment tests catch CI/CD issues → run before deploy
- Clear separation prevents "test pollution" (ethers global state affecting viem tests)

### Frontend Test Mocking

**Problem:** Testing multi-chain components required mocking `@fretchen/chain-utils` deeply, causing tests to hang.

**Solution:** Mock at the hook level, not the utility level:

```typescript
// ❌ Deep mocking (caused hangs)
vi.mock("@fretchen/chain-utils", () => ({ ... }));

// ✅ Hook-level mocking (fast, reliable)
vi.mock("../hooks/useMultiChainNFTs", () => ({
  useMultiChainUserNFTs: () => ({
    tokens: mockTokens,
    isLoading: false,
    reload: vi.fn(),
  }),
}));
```

## Deployment Checklist

1. **chain-utils:** Build and verify exports
2. **Backend:** Deploy scw_js with new network parameter
3. **Facilitator:** Update supported networks
4. **Contracts:** Deploy to new chain, verify on block explorer
5. **chain-utils:** Add new addresses, rebuild
6. **Frontend:** Deploy with multi-chain components

**Order matters:** Backend must support new network before frontend offers it.

## Metrics

| Metric | Value |
|--------|-------|
| Planning duration | ~4 weeks |
| Implementation duration | ~3-4 weeks |
| Lines changed | ~2,500 |
| New tests | ~50 |
| Test coverage | >90% |
| Breaking changes | 0 |

## Common Pitfalls

1. **Symlinks in serverless:** Local packages (`file:../shared/chain-utils`) don't deploy. Use bundler (tsup) to inline dependencies.

2. **Nonce race conditions:** Parallel requests can cause "nonce too low" errors. Viem auto-manages nonces, but add retry logic for resilience.

3. **Type casting with wagmi:** `chainId` from `fromCAIP2()` returns `number`, but wagmi expects specific chain IDs:
   ```typescript
   const chainId = fromCAIP2(network) as SupportedChainId;
   ```

4. **EIP-712 domain names:** USDC has different domain names per chain ("USD Coin" on mainnet, "USDC" on testnet). Must match exactly for signatures to verify.

## References

- [CAIP-2 Specification](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md)
- [Viem Multi-Chain Guide](https://viem.sh/docs/clients/chains.html)
- [ERC-8004 (Agent Authorization)](https://eips.ethereum.org/EIPS/eip-8004)
- [Implementation Proposal](/website/MULTICHAIN_EXPANSION_PROPOSAL.md)