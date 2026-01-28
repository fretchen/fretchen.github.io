# EIP3009SplitterV1 Contract Summary

EIP-3009 payment splitter with fixed facilitator fee

Generated on: 2026-01-20T20:33:28.418Z

## Contract Information

- **Name**: EIP3009SplitterV1
- **Functions**: 14
- **Events**: 6
- **Errors**: 11

## All Functions

- `UPGRADE_INTERFACE_VERSION()`
- `VERSION()`
- `executeSplit(address token, address buyer, address seller, bytes32 salt, uint256 totalAmount, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)`
- `facilitatorWallet()`
- `fixedFee()`
- `initialize(address _facilitatorWallet, uint256 _fixedFee)`
- `isAuthorizationUsed(address token, address authorizer, bytes32 nonce)`
- `owner()`
- `proxiableUUID()`
- `renounceOwnership()`
- `setFacilitatorWallet(address _wallet)`
- `setFixedFee(uint256 _fixedFee)`
- `transferOwnership(address newOwner)`
- `upgradeToAndCall(address newImplementation, bytes data)`

## Events

- `FacilitatorWalletUpdated(indexed address oldWallet, indexed address newWallet)`
- `FixedFeeUpdated(uint256 oldFee, uint256 newFee)`
- `Initialized(uint64 version)`
- `OwnershipTransferred(indexed address previousOwner, indexed address newOwner)`
- `SplitExecuted(indexed address buyer, indexed address seller, indexed address facilitator, uint256 totalAmount, uint256 sellerAmount, uint256 facilitatorFee)`
- `Upgraded(indexed address implementation)`

## Usage

### TypeScript/JavaScript ES Modules

```typescript
import { EIP3009SplitterV1ABI } from "./EIP3009SplitterV1";
// Use with ethers, web3, viem, etc.
```

### JSON (Direct import)

```javascript
import abi from "./EIP3009SplitterV1.json";
// Or for Node.js/CommonJS environments:
const abi = require("./EIP3009SplitterV1.json");
```
