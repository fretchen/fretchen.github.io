# eth — agent rules

Solidity contracts on Optimism L2, Hardhat + Viem. See [`README.md`](./README.md) for the
contract addresses, the deployment pattern and its three execution modes, the network list,
and the per-contract deployment guides in [`docs/`](./docs/).

The conventions below are specific to this repo and are not in the README.

## Hardhat here uses Viem, not Ethers

Contract calls return `bigint`. Use Viem formatters (`formatEther`, `parseUnits`), not
`ethers.utils.*`. The one exception is the `*_Deployment.ts` tests — see below.

## Tests are split into two categories

- **`*_Functional.ts`** — Viem only. Tests contract logic: initialization, state changes,
  events. Proxies are deployed manually via `deployContract`.
- **`*_Deployment.ts`** — ethers + the OpenZeppelin Upgrades Plugin. Imports and tests the
  actual deployment script, covering all three execution modes (`validateOnly`, `dryRun`,
  execute) and the Zod config validation.

Put a new test in the category that matches what it exercises; do not mix the two client
libraries within one file.

## Deployment scripts must export and guard

Every deploy/upgrade script exports its deploy function so `*_Deployment.ts` can import it,
and guards direct execution so the import does not run a deployment:

```typescript
export { deployFunction, MIN_DEPLOYMENT_BALANCE, ConfigSchema };
if (require.main === module) { deployFunction().then(...) }
```

## Upgrades: append state variables only

All contracts use the **OpenZeppelin UUPS upgradeable proxy pattern** — never deploy an
implementation contract directly. When upgrading, **always append new state variables after
the existing ones** to keep storage slot alignment. Reordering or inserting a variable
corrupts the proxy's storage.

## Security

`requestImageUpdate()` on GenImNFTv4 is gated by an agent whitelist (the CVE-2025-11-26 fix).
Any code that calls it must verify `isAuthorizedAgent()` first. See
[`SECURITY.md`](./SECURITY.md) for contract-level findings.
