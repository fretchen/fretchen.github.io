# @fretchen/chain-utils

Shared chain utilities for the fretchen.github.io monorepo. Provides contract addresses, ABIs, and CAIP-2 utilities for multi-chain deployments.

## Installation

```bash
npm install @fretchen/chain-utils
```

Or as a local dependency in the monorepo:

```json
{
  "dependencies": {
    "@fretchen/chain-utils": "file:../shared/chain-utils"
  }
}
```

> **Note:** This package must be built before use. Run `npm install && npm run build` in `shared/chain-utils/` before installing consuming packages. The CI workflow handles this automatically.

## Usage

```typescript
import {
  getViemChain,
  getGenAiNFTAddress,
  getUSDCConfig,
  GenImNFTv4ABI,
  toCAIP2,
  fromCAIP2,
} from "@fretchen/chain-utils";

// Get viem chain from CAIP-2 identifier
const chain = getViemChain("eip155:10"); // Optimism

// Get contract address
const nftAddress = getGenAiNFTAddress("eip155:10");

// CAIP-2 conversion
const caip2 = toCAIP2(10); // "eip155:10"
const chainId = fromCAIP2("eip155:10"); // 10
```

## Supported Networks

| Network          | CAIP-2 ID         | Type    |
| ---------------- | ----------------- | ------- |
| Optimism         | `eip155:10`       | Mainnet |
| Base             | `eip155:8453`     | Mainnet |
| Optimism Sepolia | `eip155:11155420` | Testnet |
| Base Sepolia     | `eip155:84532`    | Testnet |

## Contract Overview

### GenImNFTv4 (AI Image NFT)

Upgradeable ERC-721 for AI-generated images. Uses UUPS proxy pattern.

| Network          | Address                                      |
| ---------------- | -------------------------------------------- |
| Optimism         | `0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb` |
| Optimism Sepolia | `0x10827cC42a09D0BAD2d43134C69F0e776D853D85` |

```typescript
import { GenImNFTv4ABI, getGenAiNFTAddress } from "@fretchen/chain-utils";
```

### SupportV2 (Tipping Contract)

Accepts ETH tips with optional messages.

| Network          | Address                                      |
| ---------------- | -------------------------------------------- |
| Optimism         | `0x4ca63f8A4Cd56287E854f53E18ca482D74391316` |
| Base             | `0xB70EA4d714Fed01ce20E93F9033008BadA1c8694` |
| Optimism Sepolia | `0x9859431b682e861b19e87Db14a04944BC747AB6d` |
| Base Sepolia     | `0xaB44BE78499721b593a0f4BE2099b246e9C53B57` |

```typescript
import { getSupportV2Address } from "@fretchen/chain-utils";
```

### LLMv1 (AI Chat Contract)

On-chain AI chat with per-token billing.

| Network          | Address                                      |
| ---------------- | -------------------------------------------- |
| Optimism         | `0x7E8b7091a229B1004c4FBa25bB70d04595d3e848` |
| Optimism Sepolia | `0xA5b7f0A3f4104c97b46eafF2b0b4A457C5a73Bf4` |

```typescript
import { LLMv1ABI } from "@fretchen/chain-utils";
```

### EIP3009SplitterV1 (Payment Splitter)

Splits EIP-3009 USDC payments between recipient and platform.

| Network          | Address                                      |
| ---------------- | -------------------------------------------- |
| Optimism         | `0x4a0EA6E7A8B23C95Da07d59a8e36E9c5C5f6c5Bf` |
| Optimism Sepolia | `0x7F2b5E60e26B31E32c40F48e0e7D1CA5E62C5b7a` |

```typescript
import { EIP3009SplitterV1ABI } from "@fretchen/chain-utils";
```

### USDC (Stablecoin)

Circle's USD Coin with EIP-3009 support for gasless transfers.

| Network          | Address                                      |
| ---------------- | -------------------------------------------- |
| Optimism         | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |
| Base             | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Optimism Sepolia | `0x5fd84259d66Cd46123540766Be93DFE6D43130D7` |
| Base Sepolia     | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |

```typescript
import { getUSDCConfig, getUSDCAddress } from "@fretchen/chain-utils";

// Full config for EIP-712 signatures
const config = getUSDCConfig("eip155:10");
// { name: "OP Mainnet", chainId: 10, address: "0x...", usdcName: "USD Coin", ... }
```

## API Reference

### CAIP-2 Utilities

- `toCAIP2(chainId: number): string` - Convert chain ID to CAIP-2
- `fromCAIP2(network: string): number` - Parse CAIP-2 to chain ID
- `isMainnet(network: string): boolean` - Check if network is mainnet
- `isTestnet(network: string): boolean` - Check if network is testnet

### Chain Utilities

- `getViemChain(network: string): Chain` - Get viem Chain object

### Address Getters

- `getGenAiNFTAddress(network: string): Address`
- `getCollectorNFTAddress(network: string): Address`
- `getSupportV2Address(network: string): Address`
- `getUSDCAddress(network: string): Address`
- `getUSDCConfig(network: string): USDCConfig`

### ABIs

- `GenImNFTv4ABI` - AI Image NFT contract
- `LLMv1ABI` - AI Chat contract
- `EIP3009SplitterV1ABI` - Payment splitter

## Development

```bash
npm install
npm run build    # Compile TypeScript
npm test         # Run tests
npm run lint     # ESLint check
npm run format   # Prettier check
```

## License

ISC
