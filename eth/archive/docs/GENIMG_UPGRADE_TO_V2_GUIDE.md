# GenImNFT v1 → v2 Upgrade Summary

## Overview

This document summarizes the migration from GenImNFT (v1) to GenImNFTv2, which was primarily a naming and versioning update to establish proper version control for future upgrades.

## Version Information

| Version | Contract Name | Token Name | Token Symbol | Status     |
| ------- | ------------- | ---------- | ------------ | ---------- |
| v1      | GenImNFT      | GenImNFT   | GENIMG       | Deprecated |
| v2      | GenImNFTv2    | GenImNFTv2 | GENIMGv2     | Superseded |
| v3      | GenImNFTv3    | GenImNFTv2 | GENIMGv2     | Superseded |
| v4      | GenImNFTv4    | GenImNFTv2 | GENIMGv2     | Current    |

**Note:** From v2 onwards, the token name and symbol remain "GenImNFTv2" and "GENIMGv2" respectively, even though the contract name evolves (GenImNFTv3, GenImNFTv4). This is intentional proxy behavior.

## Changes Implemented

### 1. Smart Contract (GenImNFTv2.sol)

- ✅ Contract name changed from `GenImNFT` to `GenImNFTv2`
- ✅ Token name in `initialize()` function changed from "GenImNFT" to "GenImNFTv2"
- ✅ Token symbol changed from "GENIMG" to "GENIMGv2"
- ✅ Version tracking established for future upgrades

### 2. Tests (GenImNFTv2.ts)

- ✅ Test suite name changed from "GenImNFT" to "GenImNFTv2"
- ✅ Fixture function renamed from `deployGenImNFTFixture` to `deployGenImNFTv2Fixture`
- ✅ All contract deployment references updated from "GenImNFT" to "GenImNFTv2"
- ✅ All `getContractAt` calls updated from "GenImNFT" to "GenImNFTv2"
- ✅ Expected token names and symbols in tests adjusted accordingly
- ✅ Metadata generation now uses "GenImNFTv2" as prefix

### 3. Ignition Deployment Module

- ✅ Deprecated `GenImNFTv2_BurnableUpgrade.ts` module removed
- ✅ New `GenImNFTv2.ts` Ignition module created based on GenImNFT.ts example
- ✅ Proxy module names adjusted accordingly ("GenImNFTv2ProxyModule", "GenImNFTv2Module")
- ✅ UUPS proxy pattern implementation

## Validation

- ✅ All contracts compile successfully
- ✅ All 24 tests in GenImNFTv2 test suite pass
- ✅ Ignition module deploys successfully on local Hardhat network
- ✅ Proxy pattern verified (ERC1967)
- ✅ UUPS upgradeability confirmed

## Contract Features

GenImNFTv2 maintains all original features from v1:

- **Upgradeable ERC721 NFT** with UUPS proxy pattern
- **Public minting** with configurable mint price (0.01 ETH default)
- **Image update functionality** with compensation system for service providers
- **Token burning** capability for token holders
- **Full enumerable support** for token listing
- **URI storage** for metadata management
- **Owner-controlled upgrades** via UUPS pattern

## Upgrade Architecture

### Proxy Pattern (ERC1967/UUPS)

```
┌─────────────────────────────────────┐
│   ERC1967 Proxy                      │
│   (Immutable Address)                │
│   - Holds all state/storage         │
│   - Delegates calls to implementation│
└─────────────┬───────────────────────┘
              │ delegatecall
              ▼
┌─────────────────────────────────────┐
│   GenImNFTv2 Implementation          │
│   (Upgradeable Logic)                │
│   - initialize() function            │
│   - All business logic               │
└─────────────────────────────────────┘
```

### Storage Layout

```solidity
// ERC721 Base Storage
Initializable
ContextUpgradeable
ERC165Upgradeable
AccessControlUpgradeable
ERC721Upgradeable
ERC721EnumerableUpgradeable
ERC721URIStorageUpgradeable
ERC721BurnableUpgradeable
UUPSUpgradeable

// GenImNFTv2 Custom Storage
uint256 private _nextTokenId;
uint256 public mintPrice;
mapping(uint256 => bool) private _imageUpdated;
uint256[47] private __gap; // Reserved storage slots
```

## Deployment Commands

### Local Testing

```bash
# Run all GenImNFTv2 tests
npx hardhat test test/GenImNFTv2.ts

# Compile contracts
npx hardhat compile

# Run local node
npx hardhat node
```

### Network Deployment

#### Using Hardhat Ignition (Recommended)

```bash
# Deploy to Sepolia testnet
npx hardhat ignition deploy ./ignition/modules/GenImNFTv2.ts --network sepolia

# Deploy to Optimism mainnet
npx hardhat ignition deploy ./ignition/modules/GenImNFTv2.ts --network optimism

# Verify on Etherscan
npx hardhat verify --network sepolia <PROXY_ADDRESS>
```

#### Using OpenZeppelin Upgrades Plugin

```bash
# Deploy script
npx hardhat run scripts/deploy-genimv2.ts --network sepolia
```

## Post-Deployment Checklist

After deploying GenImNFTv2:

1. ✅ Verify proxy address on block explorer
2. ✅ Verify implementation address on block explorer
3. ✅ Test minting functionality
4. ✅ Test image update functionality
5. ✅ Verify owner permissions
6. ✅ Test enumeration functions
7. ✅ Verify metadata display
8. ✅ Document deployed addresses

## Migration Path

```
GenImNFT (v1)
    │
    │ Versioning update
    ▼
GenImNFTv2
    │
    │ + Listing control (UPGRADE_TO_V3_GUIDE.md)
    ▼
GenImNFTv3
    │
    │ + Agent authorization (UPGRADE_TO_V4_GUIDE.md)
    │ + CVE-2025-11-26 security fix
    ▼
GenImNFTv4 (Current)
```

## Key Differences from v1

### What Changed

- ✅ Contract versioning established
- ✅ Naming convention for future upgrades
- ✅ Ignition deployment module structure

### What Stayed the Same

- ✅ All contract functionality
- ✅ Storage layout
- ✅ API/function signatures
- ✅ Mint price (0.01 ETH)
- ✅ Image update compensation system
- ✅ Token burning capability

## Known Issues & Limitations

### Resolved in v3

- Token privacy control (all tokens public in v2)

### Resolved in v4

- **CVE-2025-11-26**: Unauthorized image update vulnerability
- Anyone could call `requestImageUpdate()` and claim payment

## Next Steps

For production deployments:

1. **Upgrade to v3** for listing control features
   - See `UPGRADE_TO_V3_GUIDE.md`
2. **Upgrade to v4** for security fixes (CRITICAL)
   - See `UPGRADE_TO_V4_GUIDE.md`
   - Fixes CVE-2025-11-26 unauthorized image update vulnerability

## Files Modified

```
contracts/
  ├── GenImNFTv2.sol (created from GenImNFT.sol)

test/
  ├── GenImNFTv2.ts (created from GenImNFT.ts)

ignition/modules/
  ├── GenImNFTv2.ts (created)
  └── GenImNFTv2_BurnableUpgrade.ts (removed - deprecated)
```

## References

- [OpenZeppelin UUPS Upgrades](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable)
- [EIP-1967: Proxy Storage Slots](https://eips.ethereum.org/EIPS/eip-1967)
- [Hardhat Ignition](https://hardhat.org/ignition/docs/getting-started)
- [UPGRADE_TO_V3_GUIDE.md](./UPGRADE_TO_V3_GUIDE.md) - Next upgrade guide
- [UPGRADE_TO_V4_GUIDE.md](./UPGRADE_TO_V4_GUIDE.md) - Security fix guide
