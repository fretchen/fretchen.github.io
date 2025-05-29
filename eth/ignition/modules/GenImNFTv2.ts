// npx hardhat ignition deploy ./ignition/modules/GenImNFTv2.ts
// --network sepolia
//
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ProxyModule = buildModule("GenImNFTv2ProxyModule", (builder) => {
  // Deploy the implementation contract
  const implementation = builder.contract("GenImNFTv2");

  // Encode the initialize function call for the contract.
  const initialize = builder.encodeFunctionCall(implementation, "initialize", []);

  // Deploy the ERC1967 Proxy, pointing to the implementation
  const proxy = builder.contract("ERC1967Proxy", [implementation, initialize]);

  return { proxy };
});

export default buildModule("GenImNFTv2Module", (builder) => {
  // Get the proxy from the previous module.
  const { proxy } = builder.useModule(ProxyModule);

  // Create a contract instance using the deployed proxy's address.
  const instance = builder.contractAt("GenImNFTv2", proxy);

  return { instance, proxy };
});