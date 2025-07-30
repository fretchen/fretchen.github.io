# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a multi-project repository containing fretchen's personal website and associated blockchain/NFT projects. The repository consists of four main components:

1. **Website** (`/website/`) - Personal blog and documentation site built with Vike (React SSG framework)
2. **Ethereum Contracts** (`/eth/`) - Smart contracts for NFT generation and collection system 
3. **Serverless Functions** (`/scw_js/`) - Node.js serverless functions for AI image generation and blockchain interaction
4. **Source Components** (`/src/`) - Shared components and utilities

## Development Commands

### Website Development (`/website/`)
```bash
cd website
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### Ethereum Development (`/eth/`)
```bash
cd eth
npx hardhat compile  # Compile smart contracts
npx hardhat test     # Run contract tests
REPORT_GAS=true npx hardhat test  # Run tests with gas reporting

# Deployment commands
npx hardhat ignition deploy ./ignition/modules/Support.ts
npx hardhat ignition deploy ignition/modules/Support.ts --network sepolia --deployment-id <ID>

# Contract upgrades (GenImNFTv3 only upgrades from v2)
PROXY_ADDRESS=0x123... npx hardhat run scripts/upgrade-to-v3.ts --network sepolia

# ABI export for frontend integration
npx hardhat run scripts/export-abi.ts
```

### Serverless Functions (`/scw_js/`)
```bash
cd scw_js
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint         # Run ESLint
npm run check        # Run all checks (lint + format + test)

# Local testing
NODE_ENV=test node readhandler_v2.js  # Test main NFT handler
NODE_ENV=test node dec_ai.js          # Test AI API without NFT

# Deployment
serverless deploy
```

## Architecture Overview

### Smart Contract System
The project implements an upgradeable NFT system using OpenZeppelin's UUPS proxy pattern:

- **GenImNFTv3**: Main NFT contract for AI-generated images, upgradeable from GenImNFTv2
- **CollectorNFT**: Community collection contract allowing anyone to create NFTs based on existing GenImNFT tokens
- **Support**: Like button implementation contract

Key features:
- Dynamic pricing for CollectorNFT (doubles every 5 mints)
- Authorized image updaters for GenImNFT tokens
- Public/private listing system for NFTs
- Payment routing to original GenImNFT owners

### Website Architecture
Built with Vike (React-based SSG framework) featuring:

- **Layout System**: Single layout (`LayoutDefault.tsx`) with responsive navigation
- **Content Types**: Blog posts (MDX), quantum physics lectures, and NFT galleries
- **Styling**: PandaCSS for styling system with CSS-in-JS
- **Blockchain Integration**: Wagmi for Ethereum interaction
- **Static Generation**: Pre-rendered pages for blog and quantum content

### Serverless Architecture
Node.js functions deployed on Scaleway for:

- **Image Generation**: IONOS AI API integration for creating NFT images
- **Blockchain Updates**: Updating NFT metadata and images on-chain
- **API Handlers**: RESTful endpoints for frontend integration

## Key Technologies

- **Frontend**: React 19, Vike, PandaCSS, Wagmi, TypeScript
- **Smart Contracts**: Solidity ^0.8.27, Hardhat, OpenZeppelin Upgradeable
- **Backend**: Node.js, Vitest, AWS SDK, Viem
- **Deployment**: Serverless Framework (Scaleway), Hardhat Ignition

## Environment Variables

### Ethereum Development (`/eth/`)
```
ALCHEMY_API_KEY=your_alchemy_key
SEPOLIA_PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_etherscan_key
OPTIMISTIC_ETHERSCAN_API_KEY=your_optimistic_etherscan_key
COINMARKETCAP_API_KEY=your_cmc_key
```

### Networks
- **Sepolia** (testnet): `--network sepolia`
- **Optimism Sepolia** (testnet): `--network optsepolia`  
- **Optimism Mainnet** (production): `--network optimisticEthereum`

## Testing Strategy

### Contract Testing
- Comprehensive test suites for each contract version
- Deployment and functional tests separated
- Shared test utilities in `test/shared/`
- OpenZeppelin upgrade compatibility testing

### Frontend Testing
- Vitest with jsdom environment
- React Testing Library for component tests
- Coverage reporting enabled
- Integration tests for blockchain components

### Serverless Testing
- Vitest with Node.js environment
- Unit tests for individual functions
- Integration tests for API endpoints
- E2E tests for full workflow

## Production Deployment

Current production deployment on Optimism Mainnet:
- **Proxy Address**: `0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb`
- **Version**: GenImNFTv2 (upgradeable to v3)
- **Network**: Optimism Mainnet

Upgrade process includes validation scripts and testnet testing before mainnet deployment.