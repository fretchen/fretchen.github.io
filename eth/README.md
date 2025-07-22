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
# Export ABIs for both GenImNFTv3 and CollectorNFT in multiple formats
npx hardhat run scripts/export-abi.ts

# ABI files will be available at:
# - abi/contracts/GenImNFTv3.json (ABI only)
# - abi/contracts/GenImNFTv3.ts (TypeScript)
# - abi/contracts/CollectorNFT.json (ABI only)
# - abi/contracts/CollectorNFT.ts (TypeScript)
```

## CollectorNFT - Community Collection Contract

CollectorNFT allows anyone to create NFTs based on existing GenImNFT tokens. When someone mints a CollectorNFT, the payment goes directly to the current owner of the referenced GenImNFT.

### Key Features

- **Community-Driven**: Anyone can mint CollectorNFTs based on any GenImNFT
- **Creator Rewards**: Payments go directly to GenImNFT owners
- **Dynamic Pricing**: Price increases as more CollectorNFTs are minted for the same GenImNFT
- **Upgradeable**: Uses OpenZeppelin UUPS proxy pattern

### Deployment

```shell
# Deploy CollectorNFT (requires existing GenImNFT address)
GENIMNFv3_ADDRESS=0x123... npx hardhat run scripts/deploy-collector-nft.ts --network sepolia
```

### Testing

```shell
# Run deployment tests
npx hardhat test --grep "CollectorNFT - Deployment Tests"

# Run functional tests
npx hardhat test --grep "CollectorNFT - Functional Tests"
```

### Key Scripts

#### `deploy-collector-nft.ts`

Deploys CollectorNFT as an upgradeable proxy contract.

**Usage:**

```shell
# Validation only (dry run)
npx hardhat run scripts/deploy-collector-nft.ts --network sepolia -- --validate-only

# Full deployment
GENIMNIFL_ADDRESS=0x123... npx hardhat run scripts/deploy-collector-nft.ts --network sepolia
```

#### `upgrade-collector-nft.ts`

Upgrades existing CollectorNFT deployments (when available).

**Usage:**

```shell
PROXY_ADDRESS=0x456... npx hardhat run scripts/upgrade-collector-nft.ts --network sepolia
```

### Contract Interaction Examples

```typescript
// Mint a CollectorNFT based on GenImNFT token #0
const currentPrice = await collectorNFT.getCurrentPrice(0);
await collectorNFT.mintCollectorNFT(0, "ipfs://metadata-uri", { value: currentPrice });

// Get pricing information
const [mintCount, currentPrice, nextPrice] = await collectorNFT.getMintStats(0);

// Get all CollectorNFTs for a specific GenImNFT
const collectorTokens = await collectorNFT.getCollectorTokensForGenIm(0);
```

### Pricing Model

- **Base Price**: 0.001 ETH (configurable)
- **Price Tiers**: Doubles every 5 mints
  - Mints 1-5: 1x base price (0.001 ETH)
  - Mints 6-10: 2x base price (0.002 ETH)
  - Mints 11-15: 4x base price (0.004 ETH)
  - And so on...

### Integration with GenImNFT

CollectorNFT works seamlessly with any GenImNFT version:

- References GenImNFT by contract address
- Validates token ownership before minting
- Sends payments to current GenImNFT token owners
- Independent pricing per GenImNFT token

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
const contract = new ethers.Contract("0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb", GenImNFTv3ABI, provider);

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
