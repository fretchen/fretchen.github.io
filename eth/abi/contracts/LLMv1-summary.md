# LLMv1 Contract Summary

LLM Version 1 to interact with LLMs

## Contract Information

- **Name**: LLMv1
- **Functions**: 20
- **Events**: 10
- **Errors**: 10

## All Functions

- `UPGRADE_INTERFACE_VERSION()`
- `addServiceProvider(address provider)`
- `authorizedProviders(address )`
- `checkBalance(address user)`
- `defaultServiceProvider()`
- `depositForLLM()`
- `initialize()`
- `isAuthorizedProvider(address provider)`
- `llmBalance(address )`
- `owner()`
- `processBatch(bytes32 merkleRoot, tuple[] leaves, bytes32[][] proofs)`
- `processedBatches(bytes32 )`
- `proxiableUUID()`
- `removeServiceProvider(address provider)`
- `renounceOwnership()`
- `setDefaultServiceProvider(address newProvider)`
- `transferOwnership(address newOwner)`
- `upgradeToAndCall(address newImplementation, bytes data)`
- `verifyMerkleProof(bytes32[] proof, bytes32 root, bytes32 leaf)`
- `withdrawBalance(uint256 amount)`

## Events

- `BatchProcessed(indexed bytes32 root, uint256 totalCost)`
- `DebugLeafHash(uint256 index, bytes32 hash)`
- `Initialized(uint64 version)`
- `LLMDeposit(indexed address user, uint256 amount)`
- `LLMWithdraw(indexed address user, uint256 amount)`
- `OwnershipTransferred(indexed address previousOwner, indexed address newOwner)`
- `ServiceProviderAdded(indexed address provider)`
- `ServiceProviderChanged(indexed address newProvider)`
- `ServiceProviderRemoved(indexed address provider)`
- `Upgraded(indexed address implementation)`

## Usage

### TypeScript/JavaScript ES Modules

```typescript
import { LLMv1ABI } from "./LLMv1";
// Use with ethers, web3, viem, etc.
```

### JSON (Direct import)

```javascript
import abi from "./LLMv1.json";
// Or for Node.js/CommonJS environments:
const abi = require("./LLMv1.json");
```
