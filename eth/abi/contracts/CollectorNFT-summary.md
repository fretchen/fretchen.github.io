# CollectorNFT Contract Summary

NFT collection based on GenImNFT tokens

Generated on: 2025-08-05T16:01:22.274Z

## Contract Information

- **Name**: CollectorNFT
- **Functions**: 33
- **Events**: 10
- **Errors**: 20

## Key Functions

### `baseMintPrice`

- **Type**: view
- **Inputs**: none
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

### `mintCollectorNFT`

- **Type**: payable
- **Inputs**: uint256 genImTokenId, string uri
- **Outputs**: uint256

### `mintCountPerGenImToken`

- **Type**: view
- **Inputs**: uint256
- **Outputs**: uint256

### `setBaseMintPrice`

- **Type**: nonpayable
- **Inputs**: uint256 \_baseMintPrice
- **Outputs**: none

### `updateGenImNFTContract`

- **Type**: nonpayable
- **Inputs**: address \_genImNFTContract
- **Outputs**: none

## All Functions

- `UPGRADE_INTERFACE_VERSION()`
- `approve(address to, uint256 tokenId)`
- `balanceOf(address owner)`
- `baseMintPrice()`
- `collectorTokensByGenImToken(uint256 , uint256 )`
- `genImNFTContract()`
- `getApproved(uint256 tokenId)`
- `getCollectorTokensForGenIm(uint256 genImTokenId)`
- `getCurrentPrice(uint256 genImTokenId)`
- `getMintStats(uint256 genImTokenId)`
- `initialize(address _genImNFTContract, uint256 _baseMintPrice)`
- `isApprovedForAll(address owner, address operator)`
- `mintCollectorNFT(uint256 genImTokenId, string uri)`
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
- `Initialized(uint64 version)`
- `MetadataUpdate(uint256 _tokenId)`
- `OwnershipTransferred(indexed address previousOwner, indexed address newOwner)`
- `PaymentSentToCreator(indexed uint256 genImTokenId, indexed address creator, uint256 amount)`
- `Transfer(indexed address from, indexed address to, indexed uint256 tokenId)`
- `Upgraded(indexed address implementation)`

## Usage

### TypeScript/JavaScript ES Modules

```typescript
import { CollectorNFTABI } from "./CollectorNFT";
// Use with ethers, web3, viem, etc.
```

### JSON (Direct import)

```javascript
import abi from "./CollectorNFT.json";
// Or for Node.js/CommonJS environments:
const abi = require("./CollectorNFT.json");
```
