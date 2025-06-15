# Support Contract Summary

Support contract for donations and likes functionality

Generated on: 2025-06-15T14:54:48.729Z

## Contract Information
- **Name**: Support
- **Functions**: 6
- **Events**: 2
- **Errors**: 3



## All Functions

- `donate(string _url)`
- `getLikesForUrl(string _url)`
- `owner()`
- `renounceOwnership()`
- `transferOwnership(address newOwner)`
- `urlLikes(bytes32 )`

## Events

- `LikeReceived(indexed address from, indexed bytes32 urlHash, string url, uint256 amount)`
- `OwnershipTransferred(indexed address previousOwner, indexed address newOwner)`

## Usage

### TypeScript/JavaScript ES Modules
```typescript
import { SupportABI } from './Support';
// Use with ethers, web3, viem, etc.
```

### JSON (Direct import)
```javascript
import abi from './Support.json';
// Or for Node.js/CommonJS environments:
const abi = require('./Support.json');
```
