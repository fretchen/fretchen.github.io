// npx hardhat ignition deploy ./ignition/modules/GenImNFT_BurnableUpgrade.ts
// --network sepolia --parameters '{ "proxyAddress": "0xDieAdresseDesAktuellenProxys" }'
//
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ProxyModule = buildModule("ProxyModule", (builder) => {
  // Deploy the implementation contract
  const implementation = builder.contract("GenImNFT");

  // Encode the initialize function call for the contract.
  const initialize = builder.encodeFunctionCall(implementation, "initialize", []);

  // Deploy the ERC1967 Proxy, pointing to the implementation
  const proxy = builder.contract("ERC1967Proxy", [implementation, initialize]);

  return { proxy };
});

export const MyContractModule = buildModule("GenImNFTModule", (builder) => {
  // Get the proxy from the previous module.
  const { proxy } = builder.useModule(ProxyModule);

  // Create a contract instance using the deployed proxy's address.
  const instance = builder.contractAt("GenImNFT", proxy);

  return { instance, proxy };
});

export default MyContractModule;
