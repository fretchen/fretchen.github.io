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

### Validate upgrade compatibility before upgrading:
```shell
npx hardhat run scripts/validate-contract.ts --network sepolia
```
