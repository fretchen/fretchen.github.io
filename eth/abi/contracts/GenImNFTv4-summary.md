# GenImNFTv4 Contract Summary

GenImNFT Version 4 with EIP-8004 agent whitelist (CVE-2025-11-26 fix)

## Contract Information

- **Name**: GenImNFTv4
- **Functions**: 41
- **Events**: 13
- **Errors**: 20

## All Functions

- `UPGRADE_INTERFACE_VERSION()`
- `approve(address to, uint256 tokenId)`
- `authorizeAgentWallet(address agentWallet)`
- `balanceOf(address owner)`
- `burn(uint256 tokenId)`
- `getAllPublicTokens()`
- `getApproved(uint256 tokenId)`
- `getPublicTokensOfOwner(address owner)`
- `initialize()`
- `isApprovedForAll(address owner, address operator)`
- `isAuthorizedAgent(address agentWallet)`
- `isImageUpdated(uint256 tokenId)`
- `isTokenListed(uint256 tokenId)`
- `mintPrice()`
- `name()`
- `owner()`
- `ownerOf(uint256 tokenId)`
- `proxiableUUID()`
- `reinitializeV3()`
- `reinitializeV4()`
- `renounceOwnership()`
- `requestImageUpdate(uint256 tokenId, string imageUrl)`
- `revokeAgentWallet(address agentWallet)`
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

- `AgentWalletAuthorized(indexed address agentWallet)`
- `AgentWalletRevoked(indexed address agentWallet)`
- `Approval(indexed address owner, indexed address approved, indexed uint256 tokenId)`
- `ApprovalForAll(indexed address owner, indexed address operator, bool approved)`
- `BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId)`
- `ImageUpdateRequested(indexed uint256 tokenId, indexed address updater, string imageUrl)`
- `Initialized(uint64 version)`
- `MetadataUpdate(uint256 _tokenId)`
- `OwnershipTransferred(indexed address previousOwner, indexed address newOwner)`
- `TokenListingChanged(indexed uint256 tokenId, bool isListed)`
- `Transfer(indexed address from, indexed address to, indexed uint256 tokenId)`
- `UpdaterPaid(indexed uint256 tokenId, indexed address updater, uint256 amount)`
- `Upgraded(indexed address implementation)`

## Usage

### TypeScript/JavaScript ES Modules

```typescript
import { GenImNFTv4ABI } from "./GenImNFTv4";
// Use with ethers, web3, viem, etc.
```

### JSON (Direct import)

```javascript
import abi from "./GenImNFTv4.json";
// Or for Node.js/CommonJS environments:
const abi = require("./GenImNFTv4.json");
```
