# SupportV2 Contract Summary

Support contract V2 with ETH and EIP-3009 token donations

## Contract Information

- **Name**: SupportV2
- **Functions**: 12
- **Events**: 4
- **Errors**: 11

## All Functions

- `UPGRADE_INTERFACE_VERSION()`
- `VERSION()`
- `donate(string _url, address _recipient)`
- `donateToken(string _url, address _recipient, address _token, uint256 _amount, uint256 _validAfter, uint256 _validBefore, bytes32 _nonce, uint8 _v, bytes32 _r, bytes32 _s)`
- `getLikesForUrl(string _url)`
- `initialize(address _owner)`
- `owner()`
- `proxiableUUID()`
- `renounceOwnership()`
- `transferOwnership(address newOwner)`
- `upgradeToAndCall(address newImplementation, bytes data)`
- `urlLikes(bytes32 )`

## Events

- `Donation(indexed address from, indexed address recipient, indexed bytes32 urlHash, string url, uint256 amount, address token)`
- `Initialized(uint64 version)`
- `OwnershipTransferred(indexed address previousOwner, indexed address newOwner)`
- `Upgraded(indexed address implementation)`

## Usage

### TypeScript/JavaScript ES Modules

```typescript
import { SupportV2ABI } from "./SupportV2";
// Use with ethers, web3, viem, etc.
```

### JSON (Direct import)

```javascript
import abi from "./SupportV2.json";
// Or for Node.js/CommonJS environments:
const abi = require("./SupportV2.json");
```
