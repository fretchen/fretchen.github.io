# My Hardhat Project

This project is based on the Hardhat sample. It has the standard examples `Token.sol` and `Lock.sol` contract. For me interesting is for the moment the new contract `Support.sol` which starts to implement the logic behind a simple like button.

I really like to follow the documentation [Hardhat Runner](https://hardhat.org/hardhat-runner/docs/guides/compile-contracts) here.

The typical commands to run are:

```shell
npx hardhat compile
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```
