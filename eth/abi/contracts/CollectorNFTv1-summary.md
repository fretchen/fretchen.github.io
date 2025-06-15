# CollectorNFTv1 Contract Summary

CollectorNFT Version 1 with upgraded features and UUPS proxy pattern

Generated on: 2025-06-15T14:48:31.673Z

## Contract Information
- **Name**: CollectorNFTv1
- **Functions**: 36
- **Events**: 11
- **Errors**: 27

## Key Functions

### `baseMintPrice`
- **Type**: view
- **Inputs**: none
- **Outputs**: uint256 

### `collectorToGenImToken`
- **Type**: view
- **Inputs**: uint256 
- **Outputs**: uint256 

### `collectorTokensByGenImToken`
- **Type**: view
- **Inputs**: uint256 , uint256 
- **Outputs**: uint256 

### `getCollectorTokensForGenIm`
- **Type**: view
- **Inputs**: uint256 genImTokenId
- **Outputs**: uint256[] 

### `getCurrentPrice`
- **Type**: view
- **Inputs**: uint256 genImTokenId
- **Outputs**: uint256 

### `getGenImTokenIdForCollector`
- **Type**: view
- **Inputs**: uint256 collectorTokenId
- **Outputs**: uint256 

### `getOriginalGenImURI`
- **Type**: view
- **Inputs**: uint256 collectorTokenId
- **Outputs**: string 

### `initialize`
- **Type**: nonpayable
- **Inputs**: address _genImNFTContract, uint256 _baseMintPrice
- **Outputs**: none

### `mintCollectorNFT`
- **Type**: payable
- **Inputs**: uint256 genImTokenId
- **Outputs**: uint256 

### `mintCountPerGenImToken`
- **Type**: view
- **Inputs**: uint256 
- **Outputs**: uint256 

### `setBaseMintPrice`
- **Type**: nonpayable
- **Inputs**: uint256 _baseMintPrice
- **Outputs**: none

### `updateGenImNFTContract`
- **Type**: nonpayable
- **Inputs**: address _genImNFTContract
- **Outputs**: none

### `upgradeToAndCall`
- **Type**: payable
- **Inputs**: address newImplementation, bytes data
- **Outputs**: none



## All Functions

- `UPGRADE_INTERFACE_VERSION()`
- `approve(address to, uint256 tokenId)`
- `balanceOf(address owner)`
- `baseMintPrice()`
- `collectorToGenImToken(uint256 )`
- `collectorTokensByGenImToken(uint256 , uint256 )`
- `genImNFTContract()`
- `getApproved(uint256 tokenId)`
- `getCollectorTokensForGenIm(uint256 genImTokenId)`
- `getCurrentPrice(uint256 genImTokenId)`
- `getGenImTokenIdForCollector(uint256 collectorTokenId)`
- `getMintStats(uint256 genImTokenId)`
- `getOriginalGenImURI(uint256 collectorTokenId)`
- `initialize(address _genImNFTContract, uint256 _baseMintPrice)`
- `isApprovedForAll(address owner, address operator)`
- `mintCollectorNFT(uint256 genImTokenId)`
- `mintCountPerGenImToken(uint256 )`
- `name()`
- `owner()`
- `ownerOf(uint256 tokenId)`
- `proxiableUUID()`
- `renounceOwnership()`
- `safeTransferFrom(address from, address to, uint256 tokenId)`
- `safeTransferFrom(address from, address to, uint256 tokenId, bytes data)`
- `setApprovalForAll(address operator, bool approved)`
- `setBaseMintPrice(uint256 _baseMintPrice)`
- `supportsInterface(bytes4 interfaceId)`
- `symbol()`
- `tokenByIndex(uint256 index)`
- `tokenOfOwnerByIndex(address owner, uint256 index)`
- `tokenURI(uint256 tokenId)`
- `totalSupply()`
- `transferFrom(address from, address to, uint256 tokenId)`
- `transferOwnership(address newOwner)`
- `updateGenImNFTContract(address _genImNFTContract)`
- `upgradeToAndCall(address newImplementation, bytes data)`

## Events

- `Approval(indexed address owner, indexed address approved, indexed uint256 tokenId)`
- `ApprovalForAll(indexed address owner, indexed address operator, bool approved)`
- `BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId)`
- `CollectorNFTMinted(indexed uint256 collectorTokenId, indexed uint256 genImTokenId, indexed address collector, uint256 price, uint256 mintNumber)`
- `ContractInitialized(address genImNFTContract, uint256 baseMintPrice)`
- `Initialized(uint64 version)`
- `MetadataUpdate(uint256 _tokenId)`
- `OwnershipTransferred(indexed address previousOwner, indexed address newOwner)`
- `PaymentSentToCreator(indexed uint256 genImTokenId, indexed address creator, uint256 amount)`
- `Transfer(indexed address from, indexed address to, indexed uint256 tokenId)`
- `Upgraded(indexed address implementation)`

## Usage

### TypeScript/JavaScript ES Modules
```typescript
import { CollectorNFTv1ABI } from './CollectorNFTv1';
// Use with ethers, web3, viem, etc.
```

### JSON (Direct import)
```javascript
import abi from './CollectorNFTv1.json';
// Or for Node.js/CommonJS environments:
const abi = require('./CollectorNFTv1.json');
```
