// Upgrade module for GenImNFTv2 contract
// 
// Usage:
// npx hardhat ignition deploy ./ignition/modules/GenImNFTv2_Upgrade.ts
// --network sepolia --parameters '{ "proxyAddress": "0xYourExistingProxyAddress" }'
//
// This module allows you to upgrade an existing GenImNFTv2 proxy to a new implementation.
// Make sure to:
// 1. Replace "0xYourExistingProxyAddress" with the actual proxy address
// 2. Test the upgrade on a testnet first
// 3. Verify that the new implementation is compatible with existing storage layout
//
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("GenImNFTv2UpgradeModule", (builder) => {
  // Get the proxy address from parameters
  const proxyAddress = builder.getParameter("proxyAddress");
  
  // Deploy the new implementation contract
  const newImplementation = builder.contract("GenImNFTv2");

  // Get the existing proxy contract instance
  const proxy = builder.contractAt("GenImNFTv2", proxyAddress);

  // Perform the upgrade by calling upgradeToAndCall on the proxy
  // Since we're not calling any initialization function, we pass empty data
  builder.call(proxy, "upgradeToAndCall", [newImplementation, "0x"], {
    id: "upgrade_proxy"
  });

  return { 
    newImplementation, 
    proxy,
    proxyAddress 
  };
});
