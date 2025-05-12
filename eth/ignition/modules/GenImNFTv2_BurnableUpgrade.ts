// npx hardhat ignition deploy ./ignition/modules/GenImNFTv2_BurnableUpgrade.ts 
// --network sepolia --parameters '{ "proxyAddress": "0xDieAdresseDesAktuellenProxys" }'
// 
 
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("GenImNFTUpgradeModule", (m) => {
  // Parameter: Die Adresse des bestehenden Proxys
  const proxyAddress = m.getParameter("proxyAddress");
  
  // 1. Deploy der neuen Implementation
  const newImplementation = m.contract("GenImNFTv3", []); // Neue Version des Contracts
  
  // 2. Upgrade des Proxys
  const upgraded = m.upgradeProxy(proxyAddress, newImplementation, {
    kind: "uups",
    // Optional: Initialisierungsfunktion für neue Speicherslots
    // reInitializer: "reinitialize",
    // initializeArgs: []
  });
  
  return { 
    genImNFTV3Implementation: newImplementation,
    upgradedProxy: upgraded
  };
});