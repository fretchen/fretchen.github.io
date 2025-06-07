# My Hardhat Project

This project is based on the Hardhat sample. It has the standard examples `Token.sol` and `Lock.sol` contract. For me interesting is for the moment the new contract `Support.sol` which starts to implement the logic behind a simple like button.

I really like to follow the documentation [Hardhat Runner](https://hardhat.org/hardhat-runner/docs/guides/compile-contracts) here.

The typical commands to run are:

```shell
npx hardhat compile
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
```

Then you can deploy the contract to a local network with:

```shell
npx hardhat ignition deploy ./ignition/modules/Support.ts
```

The final step is to deploy to the sepolia testnet.

```shell
npx hardhat ignition deploy ignition/modules/Support.ts --network sepolia --deployment-id <YOUR-ID>
```

And we can check the deployment with:

```shell
npx hardhat ignition verify <THE-ID-FROM-ABOVE>
```

## GenImNFTv3 - OpenZeppelin Upgrades

GenImNFTv3 can **only** be deployed as an upgrade from GenImNFTv2. There is no direct deployment of V3.

### Upgrade existing V2 to V3:
```shell
PROXY_ADDRESS=0x123... npx hardhat run scripts/upgrade-to-v3.ts --network sepolia
```

### Verify upgraded V3 contracts on Etherscan:
```shell
PROXY_ADDRESS=0x123... npx hardhat run scripts/verify-v3.ts --network sepolia
```

### Manual verification (if automatic fails):
```shell
IMPLEMENTATION_ADDRESS=0x456... npx hardhat run scripts/verify-manual.ts --network sepolia
```

### Get ABI for frontend integration:
```shell
# Export V3 ABI in multiple formats
npx hardhat run scripts/export-abi.ts

# ABI files will be available at:
# - artifacts/contracts/GenImNFTv3.sol/GenImNFTv3.json (full artifact)
# - abi/contracts/GenImNFTv3.json (ABI only)
# - abi/contracts/GenImNFTv3.ts (TypeScript)
```

### Validate upgrade compatibility before upgrading

```shell
npx hardhat run scripts/validate-contract.ts --network sepolia
```

## Production Deployment - Optimism Mainnet

### Current Deployed Contract

- **Proxy Address**: `0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb`
- **Current Version**: GenImNFTv2
- **Network**: Optimism Mainnet
- **Deployment**: `genImv2-optimism`

### Quick Upgrade (Automated)

For a complete automated upgrade process with safety checks:

```shell
# Run the complete upgrade process
./scripts/upgrade-optimism.sh
```

### Manual Upgrade Steps

#### 1. Check current contract status

```shell
npx hardhat run scripts/check-contract-status.ts --network optimisticEthereum
```

#### 2. Upgrade V2 → V3 on Optimism Mainnet

```shell
npx hardhat run scripts/upgrade-v2-to-v3-optimism.ts --network optimisticEthereum
```

#### 3. Verify new implementation

```shell
npx hardhat run scripts/verify-v3.ts --network optimisticEthereum
```

### Testnet Testing (Recommended)

#### Optimism Sepolia Testing

```shell
# Deploy V2 to testnet first (if not already deployed)
TESTNET_PROXY_ADDRESS=0x... npx hardhat run scripts/upgrade-v2-to-v3-sepolia.ts --network optsepolia

# Verify on testnet
npx hardhat run scripts/verify-v3.ts --network optsepolia
```

### New V3 Features

- **`getAllPublicTokens()`**: Get all publicly listed tokens across all owners
- Improved gas efficiency for bulk token operations
- Enhanced metadata handling

### Post-Upgrade Integration

After successful upgrade, update your frontend/dApp:

```javascript
// Example: Using the new getAllPublicTokens function
const contract = new ethers.Contract(
  "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb", 
  GenImNFTv3ABI, 
  provider
);

// Get all public tokens (new V3 feature)
const publicTokens = await contract.getAllPublicTokens();
console.log(`Found ${publicTokens.length} public tokens`);
```

### Network Configuration

Supported networks:

- **Sepolia** (testnet): `--network sepolia`
- **Optimism Sepolia** (testnet): `--network optsepolia`  
- **Optimism Mainnet** (production): `--network optimisticEthereum`

### Environment Variables Required

```shell
# Required for all networks
ALCHEMY_API_KEY=your_alchemy_key
SEPOLIA_PRIVATE_KEY=your_private_key

# Required for verification
ETHERSCAN_API_KEY=your_etherscan_key
OPTIMISTIC_ETHERSCAN_API_KEY=your_optimistic_etherscan_key
```
