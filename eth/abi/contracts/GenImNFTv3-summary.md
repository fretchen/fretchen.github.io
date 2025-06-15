# GenImNFTv3 Contract Summary

GenImNFT Version 3 with listing functionality

Generated on: 2025-06-15T14:30:10.469Z

## Contract Information
- **Name**: GenImNFTv3
- **Functions**: 38
- **Events**: 12
- **Errors**: 20

## Key Functions

### `getAllPublicTokens`
- **Type**: view
- **Inputs**: none
- **Outputs**: uint256[] 

### `getPublicTokensOfOwner`
- **Type**: view
- **Inputs**: address owner
- **Outputs**: uint256[] 

### `isTokenListed`
- **Type**: view
- **Inputs**: uint256 tokenId
- **Outputs**: bool 

### `setMultipleTokensListed`
- **Type**: nonpayable
- **Inputs**: uint256[] tokenIds, bool isListed
- **Outputs**: none

### `setTokenListed`
- **Type**: nonpayable
- **Inputs**: uint256 tokenId, bool isListed
- **Outputs**: none



## All Functions

- `UPGRADE_INTERFACE_VERSION()`
- `approve(address to, uint256 tokenId)`
- `balanceOf(address owner)`
- `burn(uint256 tokenId)`
- `getAllPublicTokens()`
- `getApproved(uint256 tokenId)`
- `getAuthorizedImageUpdater(uint256 tokenId)`
- `getPublicTokensOfOwner(address owner)`
- `initialize()`
- `isApprovedForAll(address owner, address operator)`
- `isImageUpdated(uint256 tokenId)`
- `isTokenListed(uint256 tokenId)`
- `mintPrice()`
- `name()`
- `owner()`
- `ownerOf(uint256 tokenId)`
- `proxiableUUID()`
- `reinitializeV3()`
- `renounceOwnership()`
- `requestImageUpdate(uint256 tokenId, string imageUrl)`
- `safeMint(string uri, bool isListed)`
- `safeMint(string uri)`
- `safeTransferFrom(address from, address to, uint256 tokenId)`
- `safeTransferFrom(address from, address to, uint256 tokenId, bytes data)`
- `setApprovalForAll(address operator, bool approved)`
- `setMintPrice(uint256 newPrice)`
- `setMultipleTokensListed(uint256[] tokenIds, bool isListed)`
- `setTokenListed(uint256 tokenId, bool isListed)`
- `supportsInterface(bytes4 interfaceId)`
- `symbol()`
- `tokenByIndex(uint256 index)`
- `tokenOfOwnerByIndex(address owner, uint256 index)`
- `tokenURI(uint256 tokenId)`
- `totalSupply()`
- `transferFrom(address from, address to, uint256 tokenId)`
- `transferOwnership(address newOwner)`
- `upgradeToAndCall(address newImplementation, bytes data)`
- `withdraw()`

## Events

- `Approval(indexed address owner, indexed address approved, indexed uint256 tokenId)`
- `ApprovalForAll(indexed address owner, indexed address operator, bool approved)`
- `BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId)`
- `ImageUpdateRequested(indexed uint256 tokenId, indexed address updater, string imageUrl)`
- `ImageUpdaterAuthorized(indexed uint256 tokenId, indexed address updater)`
- `Initialized(uint64 version)`
- `MetadataUpdate(uint256 _tokenId)`
- `OwnershipTransferred(indexed address previousOwner, indexed address newOwner)`
- `TokenListingChanged(indexed uint256 tokenId, bool isListed)`
- `Transfer(indexed address from, indexed address to, indexed uint256 tokenId)`
- `UpdaterPaid(indexed uint256 tokenId, indexed address updater, uint256 amount)`
- `Upgraded(indexed address implementation)`

## Usage

### JavaScript/TypeScript
```typescript
import { GenImNFTv3ABI } from './GenImNFTv3';
// Use with ethers, web3, viem, etc.
```

### JSON
```javascript
const abi = require('./GenImNFTv3.json');
```
